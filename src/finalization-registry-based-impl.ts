import { useLayoutEffect, useRef, useState } from "react";
import type { FinalizationRegistry as FinalizationRegistryType } from "./FinalizationRegistryWrapper";
import type { UserCallback, UseDisposeUncommittedFinalizationRegistry } from "./types";

/**
 * We use class so it will be easy to find these objects in heap snapshots explorers by the class name
 */
class ObjectToBeRetainedByReact {}

interface ContainerRef {
  cleanupToken: number;
  committed: boolean;
}

export const userCallbacksMap = new Map<number, UserCallback>();

/**
 * This is behind create function, because FinalizationRegistry might not be defined
 * We want to create the actual impl only if FinalizationRegistry available
 * revisit
 * @param FinalizationRegistry
 */
export function createUseDisposeUncommitted(
  FinalizationRegistry: NonNullable<typeof FinalizationRegistryType>
): UseDisposeUncommittedFinalizationRegistry {
  // Global state, all of the instances of finalization-registry UseDisposeUncommitted shares these vars
  let cleanupTokensCounter = 0;

  const registry = new FinalizationRegistry<
    number,
    ObjectToBeRetainedByReact,
    React.MutableRefObject<ContainerRef | null>
  >(function cleanup(cleanupToken: number) {
    const callback = userCallbacksMap.get(cleanupToken);
    userCallbacksMap.delete(cleanupToken);
    // This is not expected to be false if we got here...
    if (callback) {
      callback();
      userCallbacksMap.delete(cleanupToken);
    }
  });
  // end of global state

  return function useDisposeUncommittedFinalizationRegistry(onUncommittedCallback: UserCallback) {
    /**
     * This is the "magic"
     * As long as the calling component instance is not disposed by react, and still queued for committing somewhere in the future,
     * React must retain this state object
     *
     * When this object is no longer retained, our finalization callback will be called,
     * and we know that react is no longer to commit our component instance
     */
    const [objectRetainedByReact] = useState(new ObjectToBeRetainedByReact());
    const cleanupTokenRef = useRef<ContainerRef | null>(null);

    if (cleanupTokenRef.current === null) {
      cleanupTokenRef.current = {
        cleanupToken: cleanupTokensCounter++,
        committed: false,
      };

      // console.info(`component registered ${cleanupTokenRef.current.cleanupToken}`);

      registry.register(
        objectRetainedByReact,
        cleanupTokenRef.current.cleanupToken,
        cleanupTokenRef
      );
      userCallbacksMap.set(cleanupTokenRef.current.cleanupToken, onUncommittedCallback);
    } else if (!cleanupTokenRef.current.committed) {
      // The user might pass different onUncommittedCallback on additional renders but before commit,
      // Make sure we point to the most current passed function
      userCallbacksMap.set(cleanupTokenRef.current.cleanupToken, onUncommittedCallback);
    }

    /**
     * We can tell that component is committed only when react runs the side effects
     */
    useLayoutEffect(() => {
      if (cleanupTokenRef.current !== null) {
        cleanupTokenRef.current.committed = true;
        registry.unregister(cleanupTokenRef);
        userCallbacksMap.delete(cleanupTokenRef.current.cleanupToken);
      }
    }, []);
  };
}
