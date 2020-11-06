import { createUseDisposeUncommitted } from "./finalization-registry-based-impl";
import { FinalizationRegistry } from "./FinalizationRegistryWrapper";
import { useDisposeUncommittedTimerBased } from "./timers-based-impl";
import { UseDisposeUncommitted } from "./types";

export const useDisposeUncommitted: UseDisposeUncommitted = FinalizationRegistry
  ? createUseDisposeUncommitted(FinalizationRegistry)
  : useDisposeUncommittedTimerBased;

export default useDisposeUncommitted;
