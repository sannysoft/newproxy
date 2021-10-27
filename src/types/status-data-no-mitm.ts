import http from 'http';
import { ExternalProxyConfigObject } from './external-proxy-config';

export class StatusDataNoMitm {
  public connectRequest: http.IncomingMessage;

  public externalProxy: ExternalProxyConfigObject | undefined = undefined;

  public time: number = 0;

  public constructor(
    connectRequest: http.IncomingMessage,
    externalProxy: ExternalProxyConfigObject | undefined,
    time: number,
  ) {
    this.connectRequest = connectRequest;
    this.externalProxy = externalProxy;
    this.time = time;
  }
}
