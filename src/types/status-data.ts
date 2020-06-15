import * as http from 'http';
import { ExternalProxyConfigObject } from './external-proxy-config';

export class StatusData {
  public request: http.IncomingMessage;

  /**
   * If HTTPS was used
   */
  public ssl: boolean;

  /**
   * HTTP status code
   */
  public statusCode: number;

  /**
   * External proxy config if used
   */
  public externalProxy: ExternalProxyConfigObject | null = null;

  /**
   * Request processing rime
   */
  public time: number = 0;

  /**
   * Size of request received from client
   */
  public requestBytes: number = 0;

  /**
   * Size of response sent to client
   */
  public responseBytes: number = 0;

  /**
   * Size of request sent to end-server
   */
  public serverRequestBytes: number = 0;

  /**
   * Size of response from end-server
   */
  public serverResponseBytes: number = 0;

  public constructor(
    request: http.IncomingMessage,
    ssl: boolean,
    status: number,
    time: number,
    externalProxy: ExternalProxyConfigObject | null,
    requestBytes: number | undefined,
    responseBytes: number | undefined,
    serverRequestBytes: number,
    serverResponseBytes: number,
  ) {
    this.request = request;
    this.ssl = ssl;
    this.statusCode = status;
    this.time = time;

    if (externalProxy) this.externalProxy = externalProxy;
    if (requestBytes) this.requestBytes = requestBytes;
    if (responseBytes) this.responseBytes = responseBytes;
    this.serverRequestBytes = serverRequestBytes;
    this.serverResponseBytes = serverResponseBytes;
  }
}
