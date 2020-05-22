import * as url from 'url';

export type ExternalProxyConfig = ExternalProxyConfigObject | string;
export type ExternalProxyConfigOrNull = ExternalProxyConfig | null;

interface ExternalProxyConfigObject {
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
    if (typeof this.config === 'string') return url.parse(this.config);

    return url.parse(this.config.url);
  }

  public getProtocol(): string {
    return this.getUrlObject().protocol || '';
  }

  public getLoginAndPassword(): string | undefined {
    if (typeof this.config === 'string') return this.getUrlObject().auth;

    return `${this.config.login}:${this.config.password}`;
  }
}
