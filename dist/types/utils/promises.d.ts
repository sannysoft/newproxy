import { Logger } from '../common/logger';
export declare function doNotWaitPromise(promise: Promise<any>, description: string, logger: Logger): void;
export declare function sleep(ms: number): Promise<void>;
