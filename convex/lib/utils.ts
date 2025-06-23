/**
 * Ensures a value is an array. If the value is already an array, returns it as-is.
 * Otherwise, wraps the value in an array.
 */
export function castArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? [...value] : [value];
}

/**
 * Type guard to check if a value is an object with a specific property
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  prop: K,
): obj is T & Record<K, unknown> {
  return prop in obj;
}
