import { ExternalProxyConfigObject } from '../external-proxy-config';
export declare abstract class AbstractContext {
    externalProxy: ExternalProxyConfigObject | undefined | null;
    protected status_startTime: number | undefined;
    protected status_endTime: number | undefined;
    markStart(): void;
    markEnd(): void;
}
