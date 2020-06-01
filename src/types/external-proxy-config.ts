import * as url from 'url';
import { isNullOrUndefined } from '../common/util-fns';

export type ExternalProxyConfig = ExternalProxyConfigObject | string;
export type ExternalProxyConfigOrNull = ExternalProxyConfig | undefined;

export interface ExternalProxyConfigObject {
  host: string;
  username?: string;
  password?: string;
}

export function isExternalProxyConfigObject(obj: any): obj is ExternalProxyConfigObject {
  return typeof obj === 'object' && obj.url;
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
    if (typeof this.config === 'string') return this.getUrlObject().auth;

    if (isNullOrUndefined(this.config.username) || isNullOrUndefined(this.config.password))
      return undefined;

    return `${this.config.username}:${this.config.password}`;
  }

  public getBasicAuth(): string | undefined {
    const authString = this.getLoginAndPassword();
    if (!authString) return undefined;

    return Buffer.from(authString).toString('base64');
  }
}
