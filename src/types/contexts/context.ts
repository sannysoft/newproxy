import http from 'http';
import { StatusData } from '../status-data';
import { AbstractContext } from './abstract-context';

export class Context extends AbstractContext {
  public clientReq: http.IncomingMessage;

  public clientRes: http.ServerResponse | undefined;

  public ssl: boolean;

  protected status_code: number | undefined;

  protected status_requestedFromServerBytes = 0;

  protected status_serverRespondedBytes = 0;

  public constructor(
    clientReq: http.IncomingMessage,
    clientRes: http.ServerResponse | undefined,
    ssl: boolean,
  ) {
    super();
    this.clientReq = clientReq;
    this.clientRes = clientRes;
    this.ssl = ssl;
  }

  public getStatusData(): StatusData {
    this.markEnd();

    return new StatusData(
      this.clientReq,
      this.ssl,
      this.status_code ?? 0,
      Math.max(0, (this.status_endTime ?? 0) - (this.status_startTime ?? 0)),

      this.externalProxy ?? undefined,
      this.clientReq.socket.bytesRead,
      this.clientReq.socket.bytesWritten,

      this.status_requestedFromServerBytes,
      this.status_serverRespondedBytes,
    );
  }

  public setStatusCode(
    statusCode: number | null | undefined,
    requestBytes: number = 0,
    responseBytes: number = 0,
  ): void {
    if (!this.status_code && statusCode) this.status_code = statusCode;

    this.status_requestedFromServerBytes = requestBytes;
    this.status_serverRespondedBytes = responseBytes;
  }
}
