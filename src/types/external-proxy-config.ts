import * as url from 'url';

export type ExternalProxyConfig = ExternalProxyConfigObject | string;
export type ExternalProxyConfigOrNull = ExternalProxyConfig | undefined;

export interface ExternalProxyConfigObject {
  url: string;
  login?: string;
  password?: string;
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
      proxy = this.config.url;
    }

    if (!proxy.startsWith('http:') && !proxy.startsWith('https:')) proxy = `http://${proxy}`;

    return url.parse(proxy);
  }

  public getProtocol(): string {
    return this.getUrlObject().protocol || '';
  }

  public getLoginAndPassword(): string | undefined {
    if (typeof this.config === 'string') return this.getUrlObject().auth;

    return `${this.config.login}:${this.config.password}`;
  }
}
