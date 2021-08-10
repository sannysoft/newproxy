import { ProxyConfig } from '../types/proxy-config';
import { RequestHandlerFn } from '../types/functions/request-handler-fn';
import { RequestHandler } from './request-handler';
import { Context } from '../types/contexts/context';

// create requestHandler function
export function createRequestHandler(proxyConfig: ProxyConfig): RequestHandlerFn {
  return function requestHandler(context: Context): void {
    const reqHandler = new RequestHandler(context, proxyConfig);

    context.clientReq.socket.on('close', () => {
      if (proxyConfig?.statusFn) {
        const statusData = context.getStatusData();

        proxyConfig.statusFn(statusData);
      }
    });

    // Mark time of request processing start
    context.markStart();

    void (async (): Promise<void> => {
      await reqHandler.go();
    })();
  };
}
