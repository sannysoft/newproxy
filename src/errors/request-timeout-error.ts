export class RequestTimeoutError extends Error {
  public constructor(hostPort: string, timeout: number) {
    super(`Timeout of ${timeout}ms while requesting ${hostPort}`); // 'Error' breaks prototype chain here
    this.name = 'RequestTimeoutError';
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}
