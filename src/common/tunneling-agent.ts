// @ts-ignore
import * as TunnelAgent from '@postman/tunnel-agent';
import HashCode from 'ts-hashcode';
import * as NodeCache from 'node-cache';
import { ExternalProxyHelper } from '../types/external-proxy-config';

const myCache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 60, useClones: false });

export class TunnelingAgent {
  public static getTunnelAgent(isSsl: boolean, externalProxyHelper: ExternalProxyHelper): any {
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

    const externalProxyHostCache =
      (isSsl ? '1' : '0') + externalProxyProtocol + HashCode(tunnelConfig);

    const cachedTunnel: any | undefined = myCache.get(externalProxyHostCache);
    if (cachedTunnel) return cachedTunnel;

    const newTunnel = this.getNewTunnel(isSsl, externalProxyProtocol, tunnelConfig);

    myCache.set(externalProxyHostCache, newTunnel, 15 * 60 * 1000 /* 15 minutes */);

    return newTunnel;
  }

  private static getNewTunnel(
    isSsl: boolean,
    externalProxyProtocol: string,
    tunnelConfig: { proxy: { port: number; host: string } },
  ): any {
    if (isSsl) {
      if (externalProxyProtocol === 'http:') {
        return TunnelAgent.httpsOverHttp(tunnelConfig);
      }
      return TunnelAgent.httpsOverHttps(tunnelConfig);
    }

    if (externalProxyProtocol === 'http:') {
      // if (!httpOverHttpAgent) {
      //     httpOverHttpAgent = tunnelAgent.httpOverHttp(tunnelConfig);
      // }
      return false;
    }

    return TunnelAgent.httpOverHttps(tunnelConfig);
  }
}
