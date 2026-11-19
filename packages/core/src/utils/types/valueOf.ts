import type { ValueOf as ValuesOf } from 'type-fest';

export type String<V> = V extends string ? `${V}` : `${string & V}`;
export type ValueOf<T extends object, K extends keyof T = keyof T> = String<ValuesOf<T, K>>;
