import http from 'http';
import stream from 'stream';
import { AbstractContext } from './abstract-context';
import { StatusDataNoMitm } from '../status-data-no-mitm';

export class ContextNoMitm extends AbstractContext {
  public connectRequest: http.IncomingMessage;

  public clientSocket: stream.Duplex;

  public head: Buffer;

  public constructor(
    connectRequest: http.IncomingMessage,
    clientSocket: stream.Duplex,
    head: Buffer,
  ) {
    super();
    this.connectRequest = connectRequest;
    this.clientSocket = clientSocket;
    this.head = head;
  }

  public getStatusData(): StatusDataNoMitm {
    this.markEnd();

    return new StatusDataNoMitm(
      this.connectRequest,
      this.externalProxy ?? undefined,
      Math.max(0, (this.status_endTime ?? 0) - (this.status_startTime ?? 0)),
    );
  }
}
