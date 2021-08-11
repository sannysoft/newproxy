import { Logger } from '../common/logger';

export function doNotWaitPromise(promise: Promise<any>, description: string, logger: Logger): void {
  promise
    .then(() => {})
    .catch((err) => {
      logger.logError(err, `Error at ${description}`);
    });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
