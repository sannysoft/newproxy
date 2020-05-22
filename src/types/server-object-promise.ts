import { ServerObject } from './server-object';

export interface ServerObjectPromise {
  mappingHostNames: string[];
  promise: Promise<ServerObject>;
  serverObj?: ServerObject;
}
