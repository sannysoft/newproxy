import http from "http";
import { ExtendedRequestOptions } from "../request-options";

export type RequestInterceptorFn = (
  requestOptions: ExtendedRequestOptions,
  clientReq: http.IncomingMessage,
  clientRes: http.ServerResponse,
  ssl: boolean,
  connectRequest: http.IncomingMessage | undefined,
) => Promise<void>;
