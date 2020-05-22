import { ProxyConfig } from '../types/proxy-config';
import { RequestHandlerFn } from '../types/functions/request-handler-fn';
import { RequestHandler } from './request-handler';

// create requestHandler function
export function createRequestHandler(config: ProxyConfig): RequestHandlerFn {
  return function requestHandler(req, res, ssl): void {
    const reqHandler = new RequestHandler(req, res, ssl, config);

    (async () => {
      await reqHandler.go();
    })();
  };
}
