import * as url from 'url';
// @ts-ignore
import * as tunnelAgent from 'tunnel-agent';
import * as http from 'http';
import * as AgentKeepAlive from 'agentkeepalive';
import { ExternalProxyFn } from '../types/functions/external-proxy-fn';
import { RequestOptions } from '../types/request-options';
import { logError } from './logger';
import { ExternalProxyConfig, ExternalProxyHelper } from '../types/external-proxy-config';

const httpsAgent = new AgentKeepAlive.HttpsAgent({
  keepAlive: true,
  timeout: 60000,
});

const httpAgent = new AgentKeepAlive({
  keepAlive: true,
  timeout: 60000,
});

let socketId = 0;

let httpsOverHttpAgent: boolean;
let httpOverHttpsAgent: boolean;
let httpsOverHttpsAgent: boolean;

export function makeErr(message: string): never {
  throw new Error(message);
}

export class CommonUtils {
  public static getOptionsFromRequest(
    req: http.IncomingMessage,
    ssl: boolean,
    externalProxy: ExternalProxyConfig | ExternalProxyFn | null,
    res?: http.ServerResponse | undefined,
  ): RequestOptions {
    const urlObject = url.parse(req?.url ?? makeErr('No URL specified'));
    const defaultPort = ssl ? 443 : 80;
    const protocol = ssl ? 'https:' : 'http:';
    const headers = Object.assign({}, req.headers);

    const externalProxyHelper = this.getExternalProxyHelper(externalProxy, req, ssl, res);

    delete headers['proxy-connection'];

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
      agent = CommonUtils.getTunnelAgent(protocol === 'https:', externalProxyHelper);
    }

    const requestHost: string = req.headers?.host ?? makeErr('No request hostname set');

    const options: RequestOptions = {
      protocol: protocol,
      hostname: requestHost.split(':')[0],
      method: req.method ?? makeErr('No request method set'),
      port: Number(requestHost.split(':')[1] || defaultPort),
      path: urlObject.path ?? makeErr('No request path set'),
      headers: req.headers,
      agent: agent,
      url: `${protocol}//${requestHost}${urlObject.path ?? ''}`,
    };

    if (
      protocol === 'http:' &&
      externalProxyHelper &&
      externalProxyHelper.getProtocol() === 'http:'
    ) {
      const externalURL = externalProxyHelper.getUrlObject();
      options.hostname = externalURL.hostname ?? makeErr('No external proxy hostname');
      options.port = Number(externalURL.port ?? makeErr('No external proxy port'));

      // support non-transparent proxy
      options.path = `http://${urlObject.host}${urlObject.path}`;
    }

    // TODO: Check if we ever have customSocketId
    // mark a socketId for Agent to bind socket for NTLM
    // @ts-ignore
    if (req.socket.customSocketId) {
      // @ts-ignore
      options.customSocketId = req.socket.customSocketId;
    } else if (headers.authorization) {
      // @ts-ignore
      req.socket.customSocketId = socketId++;
      // @ts-ignore
      options.customSocketId = req.socket.customSocketId;
    }

    return options;
  }

  private static getExternalProxyHelper(
    externalProxy: ExternalProxyConfig | ExternalProxyFn | null,
    req: http.IncomingMessage,
    ssl: boolean,
    res?: http.ServerResponse | undefined,
  ): ExternalProxyHelper | undefined {
    let externalProxyConfig: ExternalProxyConfig | null = null;

    if (externalProxy) {
      if (typeof externalProxy === 'string') {
        externalProxyConfig = externalProxy;
      } else if (typeof externalProxy === 'function') {
        try {
          externalProxyConfig = externalProxy(req, ssl, res);
        } catch (error) {
          logError(error);
        }
      }
    }

    if (externalProxyConfig) return new ExternalProxyHelper(externalProxyConfig);

    return undefined;
  }

  private static getTunnelAgent(isSsl: boolean, externalProxyHelper: ExternalProxyHelper): any {
    const urlObject = externalProxyHelper.getUrlObject();
    const externalProxyProtocol = urlObject.protocol || 'http:';
    const port: number | null = Number(
      urlObject?.port ?? (externalProxyProtocol === 'http:' ? 80 : 443),
    );

    const hostname = urlObject.hostname || 'localhost';

    const tunnelConfig = {
      proxy: {
        host: hostname,
        port: port,
      },
    };

    const auth = externalProxyHelper.getLoginAndPassword();
    if (auth) {
      // @ts-ignore
      tunnelConfig.proxy.proxyAuth = auth;
    }

    if (isSsl) {
      if (externalProxyProtocol === 'http:') {
        if (!httpsOverHttpAgent) {
          httpsOverHttpAgent = tunnelAgent.httpsOverHttp(tunnelConfig);
        }
        return httpsOverHttpAgent;
      }
      if (!httpsOverHttpsAgent) {
        httpsOverHttpsAgent = tunnelAgent.httpsOverHttps(tunnelConfig);
      }
      return httpsOverHttpsAgent;
    }
    if (externalProxyProtocol === 'http:') {
      // if (!httpOverHttpAgent) {
      //     httpOverHttpAgent = tunnelAgent.httpOverHttp(tunnelConfig);
      // }
      return false;
    }
    if (!httpOverHttpsAgent) {
      httpOverHttpsAgent = tunnelAgent.httpOverHttps(tunnelConfig);
    }
    return httpOverHttpsAgent;
  }
}
