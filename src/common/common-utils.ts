import * as url from 'url';
import * as AgentKeepAlive from 'agentkeepalive';
import { ExtendedRequestOptions } from '../types/request-options';
import {
  ExternalProxyConfig,
  ExternalProxyHelper,
  isExternalProxyConfigObject,
} from '../types/external-proxy-config';
import { contexts } from './contexts';
import { TunnelingAgent } from './tunneling-agent';
import { makeErr } from './util-fns';
import { Context } from '../types/contexts/context';
import { ProxyConfig } from '../types/proxy-config';
import { Logger } from './logger';

const httpsAgent = new AgentKeepAlive.HttpsAgent({
  keepAlive: true,
  timeout: 60000,
});

const httpAgent = new AgentKeepAlive({
  keepAlive: true,
  timeout: 60000,
});

let socketId = 0;

export class CommonUtils {
  public static getOptionsFromRequest(
    context: Context,
    proxyConfig: ProxyConfig,
    logger: Logger,
  ): ExtendedRequestOptions {
    const urlObject = url.parse(context.clientReq?.url ?? makeErr('No URL set for the request'));
    const defaultPort = context.ssl ? 443 : 80;
    const protocol = context.ssl ? 'https:' : 'http:';
    const headers = { ...context.clientReq.headers };

    let externalProxyHelper: ExternalProxyHelper | undefined;
    try {
      externalProxyHelper = this.getExternalProxyHelper(context, proxyConfig);
      // eslint-disable-next-line no-param-reassign
      context.externalProxy = externalProxyHelper?.getConfigObject();
    } catch (error) {
      logger.logError(error, 'Wrong external proxy set');
    }

    delete headers['proxy-connection'];
    delete headers['proxy-authorization'];

    let agent: any = false;
    if (!externalProxyHelper) {
      // keepAlive
      if (headers.connection !== 'close') {
        if (protocol === 'https:') {
          agent = httpsAgent;
        } else {
          agent = httpAgent;
        }
        headers.connection = 'keep-alive';
      }
    } else {
      agent = TunnelingAgent.getTunnelAgent(protocol === 'https:', externalProxyHelper);
    }

    const requestHost: string = headers?.host ?? makeErr('No request hostname set');

    const options: ExtendedRequestOptions = {
      protocol: protocol,
      hostname: requestHost.split(':')[0],
      method: context.clientReq.method ?? makeErr('No request method set'),
      port: Number(requestHost.split(':')[1] || defaultPort),
      path: urlObject.path ?? makeErr('No request path set'),
      headers: headers,
      agent: agent,
      timeout: 60000,
      url: `${protocol}//${requestHost}${urlObject.path ?? ''}`,
    };

    try {
      if (
        protocol === 'http:' &&
        externalProxyHelper &&
        externalProxyHelper.getProtocol() === 'http:'
      ) {
        const externalURL = externalProxyHelper.getUrlObject();
        const host =
          externalURL.hostname ??
          makeErr(`No external proxy hostname set - ${context.externalProxy}`);

        const port = Number(
          externalURL.port ?? makeErr(`No external proxy port set - ${context.externalProxy}`),
        );

        options.hostname = host;
        options.port = port;

        // Check if we have authorization here
        const basicAuthString = externalProxyHelper.getBasicAuth();
        if (basicAuthString) {
          if (!options.headers) options.headers = {};
          options.headers['Proxy-Authorization'] = `Basic ${basicAuthString}`;
        }

        // support non-transparent proxy
        options.path = `http://${urlObject.host}${urlObject.path}`;
      }
    } catch (error) {
      logger.logError(error, 'External proxy parsing problem');
    }

    // TODO: Check if we ever have customSocketId
    // mark a socketId for Agent to bind socket for NTLM
    // @ts-ignore
    if (context.clientReq.socket.customSocketId) {
      // @ts-ignore
      options.customSocketId = context.clientReq.socket.customSocketId;
    } else if (headers.authorization) {
      // @ts-ignore
      // eslint-disable-next-line no-param-reassign
      context.clientReq.socket.customSocketId = socketId++;
      // @ts-ignore
      options.customSocketId = context.clientReq.socket.customSocketId;
    }

    return options;
  }

  private static getExternalProxyHelper(
    context: Context,
    proxyConfig: ProxyConfig,
  ): ExternalProxyHelper | undefined {
    let externalProxyConfig: ExternalProxyConfig | undefined;

    const externalProxy = proxyConfig.externalProxy;
    const req = context.clientReq;

    if (externalProxy) {
      if (typeof externalProxy === 'string' || isExternalProxyConfigObject(externalProxy)) {
        externalProxyConfig = externalProxy;
      } else if (typeof externalProxy === 'function') {
        const connectKey = `${req.socket.remotePort}:${req.socket.localPort}`;
        externalProxyConfig = externalProxy(
          req,
          context.ssl,
          context.clientRes,
          contexts[connectKey]?.connectRequest,
        );

        // Check return type is proper config
        if (
          externalProxyConfig &&
          typeof externalProxyConfig !== 'string' &&
          !isExternalProxyConfigObject(externalProxyConfig)
        ) {
          throw new TypeError('Invalid externalProxy config generated by external function');
        }
      } else {
        throw new TypeError('Invalid externalProxy config provided');
      }
    }

    if (externalProxyConfig) return new ExternalProxyHelper(externalProxyConfig);

    return undefined;
  }
}
