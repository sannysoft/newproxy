import { RequestOptions, Agent } from 'http';

export interface ExtendedRequestOptions extends RequestOptions {
  customSocketId?: number | undefined;

  agent: Agent & { getName: (options: RequestOptions) => string };

  host?: string | undefined;
  url: string;
}
