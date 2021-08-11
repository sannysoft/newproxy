import { CertAndKeyContainer } from './cert-and-key-container';
import { Logger } from '../common/logger';
import { RequestHandlerFn } from '../types/functions/request-handler-fn';
import { UpgradeHandlerFn } from '../types/functions/upgrade-handler-fn';
export declare class HttpsServer {
    private readonly certAndKeyContainer;
    private readonly logger;
    readonly remoteHostname: string;
    readonly remotePort: number;
    private readonly requestHandler;
    private readonly upgradeHandler;
    private fakeServer?;
    private _launching;
    get isLaunching(): boolean;
    private _stopped;
    private _running;
    get isRunning(): boolean;
    private serverSockets;
    private _listenPort?;
    get listenPort(): number | undefined;
    private _mappingHostNames;
    get mappingHostNames(): string[];
    constructor(certAndKeyContainer: CertAndKeyContainer, logger: Logger, remoteHostname: string, remotePort: number, requestHandler: RequestHandlerFn, upgradeHandler: UpgradeHandlerFn);
    doesMatchHostname(hostname: string): boolean;
    run(): Promise<HttpsServer>;
    stop(): Promise<void>;
}
