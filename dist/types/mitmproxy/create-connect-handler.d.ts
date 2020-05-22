import { SslConnectInterceptorFn } from '../types/functions/ssl-connect-interceptor';
import { FakeServersCenter } from '../tls/fake-servers-center';
import { ConnectHandlerFn } from '../types/functions/connect-handler-fn';
export declare function createConnectHandler(sslConnectInterceptor: SslConnectInterceptorFn | boolean | undefined, fakeServerCenter: FakeServersCenter): ConnectHandlerFn;
