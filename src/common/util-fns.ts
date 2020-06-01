export function makeErr(message: string): never {
  throw new Error(message);
}

export function isNullOrUndefined<T>(obj: T | null | undefined): obj is null | undefined {
  return typeof obj === 'undefined' || obj === null;
}
