import http from 'http';
import stream from 'stream';
import { AbstractContext } from './abstract-context';
import { StatusDataNoMitm } from '../status-data-no-mitm';

export class ContextNoMitm extends AbstractContext {
  public constructor(
    public connectRequest: http.IncomingMessage,
    public clientSocket: stream.Duplex,
    public head: Buffer,
  ) {
    super();
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
