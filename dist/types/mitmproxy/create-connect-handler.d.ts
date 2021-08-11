import { FakeServersCenter } from '../tls/fake-servers-center';
import { ConnectHandlerFn } from '../types/functions/connect-handler-fn';
import { Logger } from '../common/logger';
import { ProxyConfig } from '../types/proxy-config';
export declare function createConnectHandler(proxyConfig: ProxyConfig, fakeServerCenter: FakeServersCenter, logger: Logger): ConnectHandlerFn;
