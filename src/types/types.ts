// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-types */
type ObjectCheck<T> = T extends object ? T : Record<any, unknown>;

export function types<T extends {} | null | undefined | unknown>(
  value: T,
): value is ObjectCheck<NonNullable<T>> {
  return value !== null && typeof value === 'object';
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isPresent<T>(value: T): value is Exclude<T, undefined | null> {
  return value !== undefined && value !== null;
}
