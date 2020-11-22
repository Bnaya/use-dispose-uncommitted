export function assertNotNullable<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    /* istanbul ignore next */
    throw new Error("Value is nullable");
  }
}
