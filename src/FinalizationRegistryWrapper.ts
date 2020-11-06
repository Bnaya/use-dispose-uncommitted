declare class FinalizationRegistryType<T, R = unknown, U = unknown> {
  constructor(cleanup: (cleanupToken: T) => void);
  register(object: R, cleanupToken: T, unregisterToken?: U): void;
  unregister(unregisterToken: U): void;
}

declare const FinalizationRegistry: typeof FinalizationRegistryType | undefined;

const FinalizationRegistryLocal =
  typeof FinalizationRegistry === "undefined" ? undefined : FinalizationRegistry;

export { FinalizationRegistryLocal as FinalizationRegistry };
