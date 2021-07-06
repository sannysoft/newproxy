declare type ObjectCheck<T> = T extends object ? T : Record<any, unknown>;
export declare function types<T extends {} | null | undefined | unknown>(value: T): value is ObjectCheck<NonNullable<T>>;
export declare function isString(value: unknown): value is string;
export declare function isPresent<T>(value: T): value is Exclude<T, undefined | null>;
export {};
