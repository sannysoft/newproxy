import { ProxyConfig } from '../types/proxy-config';
import { RequestHandlerFn } from '../types/functions/request-handler-fn';
import { RequestHandler } from './request-handler';
import { Context } from '../types/contexts/context';
import { Logger } from '../common/logger';
import { doNotWaitPromise } from '../utils/promises';

// create requestHandler function
export function createRequestHandler(proxyConfig: ProxyConfig, logger: Logger): RequestHandlerFn {
  return function requestHandler(context: Context): void {
    const reqHandler = new RequestHandler(context, proxyConfig, logger);

    context.clientReq.socket.on('close', () => {
      if (proxyConfig?.statusFn) {
        const statusData = context.getStatusData();

        proxyConfig.statusFn(statusData);
      }
    });

    // Mark time of request processing start
    context.markStart();

    doNotWaitPromise(reqHandler.go(), 'requestHandler', logger);
  };
}
