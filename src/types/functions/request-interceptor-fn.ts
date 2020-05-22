import * as http from 'http';
import { RequestOptions } from '../request-options';

export type RequestInterceptorFn = (
  requestOptions: RequestOptions,
  clientReq: http.IncomingMessage,
  clientRes: http.ServerResponse,
  ssl: boolean,
  next: () => void,
) => void;
