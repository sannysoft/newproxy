import * as url from 'url';
import { isNullOrUndefined, makeErr } from '../common/util-fns';

export type ExternalProxyConfig = ExternalProxyConfigObject | string;
export type ExternalProxyConfigOrNull = ExternalProxyConfig | undefined;

export interface ExternalProxyConfigObject {
  host: string;
  username?: string;
  password?: string;
}

export function isExternalProxyConfigObject(obj: any): obj is ExternalProxyConfigObject {
  return typeof obj === 'object' && obj.host;
}

export class ExternalProxyHelper {
  private readonly config: ExternalProxyConfig;

  public constructor(config: ExternalProxyConfig) {
    this.config = config;
  }

  public getUrlObject(): url.UrlWithStringQuery {
    let proxy: string;

    if (typeof this.config === 'string') {
      proxy = this.config;
    } else {
      proxy = this.config.host;
    }

    if (!proxy.startsWith('http:') && !proxy.startsWith('https:')) proxy = `http://${proxy}`;

    return url.parse(proxy);
  }

  public getProtocol(): string {
    return this.getUrlObject().protocol || '';
  }

  public getLoginAndPassword(): string | undefined {
    if (typeof this.config === 'string') {
      const auth = this.getUrlObject().auth;
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
    if (typeof this.config === 'object' && 'host' in this.config) return this.config;

    const proxyUrl = this.getUrlObject();
    const [login, password] = this.getLoginAndPassword()?.split(':') ?? [undefined, undefined];

    return {
      host: proxyUrl.host ?? makeErr('No host set for proxy'),
      username: login,
      password: password,
    };
  }
}
