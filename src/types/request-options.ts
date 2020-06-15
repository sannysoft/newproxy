import { RequestOptions, Agent } from 'http';

export interface ExtendedRequestOptions extends RequestOptions {
  customSocketId?: number;

  agent: Agent & { getName: (options: RequestOptions) => string };

  host?: string;
  url: string;
}
