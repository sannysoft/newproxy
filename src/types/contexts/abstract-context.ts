import { ExternalProxyConfigObject } from '../external-proxy-config';

export abstract class AbstractContext {
  public externalProxy: ExternalProxyConfigObject | undefined | null;

  protected status_startTime: number | undefined;

  protected status_endTime: number | undefined;

  public markStart(): void {
    // eslint-disable-next-line @typescript-eslint/camelcase
    this.status_startTime = Date.now();
  }

  public markEnd(): void {
    // eslint-disable-next-line @typescript-eslint/camelcase
    if (!this.status_endTime) this.status_endTime = Date.now();
  }
}
