import * as url from 'url';
import { isNullOrUndefined, makeErr } from '../common/util-fns';
import { isString, types } from './types';

export interface ExternalProxyConfigObject {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export type ExternalProxyConfig = ExternalProxyConfigObject | string;
export type ExternalProxyConfigOrNull = ExternalProxyConfig | undefined;

export function isExternalProxyConfigObject(obj: unknown): obj is ExternalProxyConfigObject {
  return types(obj) && !!obj.host && !!obj.port;
}

export class ExternalProxyHelper {
  private readonly config: ExternalProxyConfig | string;

  public constructor(config: ExternalProxyConfig) {
    this.config = config;
  }

  public getUrlObject(): url.UrlWithStringQuery {
    let proxy: string;

    proxy = isString(this.config) ? this.config : `${this.config.host}:${this.config.port}`;

    if (!proxy.startsWith('http:') && !proxy.startsWith('https:')) proxy = `http://${proxy}`;

    return url.parse(proxy);
  }

  public getProtocol(): string {
    return this.getUrlObject().protocol || '';
  }

  public getLoginAndPassword(): string | undefined {
    if (typeof this.config === 'string') {
      const auth = this.getUrlObject()?.auth;
      return auth || undefined;
    }

    if (isNullOrUndefined(this.config.username) || isNullOrUndefined(this.config.password))
      return undefined;

    return `${this.config.username}:${this.config.password}`;
  }

  public getBasicAuth(): string | undefined {
    const authString = this.getLoginAndPassword();
    if (!authString) return undefined;

    return Buffer.from(authString).toString('base64');
  }

  public getConfigObject(): ExternalProxyConfigObject {
    if (isExternalProxyConfigObject(this.config)) {
      return this.config;
    }

    const proxyUrl = this.getUrlObject();
    const [login, password] = this.getLoginAndPassword()?.split(':') ?? [undefined, undefined];

    return {
      host: proxyUrl.host ?? makeErr('No host set for proxy'),
      port: Number.parseInt(proxyUrl.port ?? makeErr('No port set for proxy'), 10),
      username: login,
      password: password,
    };
  }
}
