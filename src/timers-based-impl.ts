import { useLayoutEffect, useRef } from "react";
import {
  DEFAULT_ASSUMED_UNCOMMITTED_AFTER_MILLIS,
  DEFAULT_CLEANUP_TIMER_LOOP_MILLIS,
} from "./consts";
import { UserCallback, UserReviverCallback } from "./types";

// Don't depend on node/browser specific types
// Yes, in node the returned value is not a number, but it ain't matter.
declare function setTimeout(cb: () => void, timeout: number): number;
declare function clearTimeout(handle: number): void;

interface DisposerStateRef {
  /**
   * The time (in timestamp) at which point we should consider component as not-committed,
   * if this component hasn't yet been fully mounted.
   */
  cleanAt: number;

  /**
   * Whether the component has yet completed mounting (for us, whether
   * its useEffect has run)
   */
  mounted: boolean;

  disposeCallback: UserCallback;
}

let cleanupTimerLoopHandle: ReturnType<typeof setTimeout> | undefined;

export const waitingToBeCommittedOrDisposed = new Set<
  React.MutableRefObject<DisposerStateRef | null>
>();

export function useDisposeUncommittedTimerBased(
  disposeCallback: UserCallback,
  reviveCallback: UserReviverCallback
): void {
  const refState = useRef<DisposerStateRef>(null);

  // First render
  if (!refState.current) {
    scheduleCleanupOfComponentIfConsideredStale(refState, disposeCallback);
  }
  // Not first render, but still not committed
  else {
    // ensure disposeCallback is up to date
    // Most disposeCallback wasn't changed
    refState.current.disposeCallback = disposeCallback;

    if (!refState.current.mounted) {
      if (
        /**
         * If this is true, it means we've assumed that the component is disposed by React,
         * and we called the disposer, ...BUT... React eventually decided to render it again,
         * means it's not really needs to be disposed
         * So we need to call the reviver!
         */
        !waitingToBeCommittedOrDisposed.has(refState)
      ) {
        // User callback must not throw!
        reviveCallback(true);
        scheduleCleanupOfComponentIfConsideredStale(refState, disposeCallback);
      }
    }
  }

  /**
   * We use useLayoutEffect here, because sometimes you must force re-render in the reviveCallback,
   * And using useEffect might cause stale paint and immediate update.
   */
  useLayoutEffect(() => {
    if (!refState.current) {
      /**
       * INVARIANT!
       * We fill refState.current in the first render, and keep it there
       */
      return;
    }

    // First side effect run, right after first commit
    if (!refState.current.mounted) {
      refState.current.mounted = true;
      if (
        /**
         * If this is true, it means we've assumed that the component is disposed by React,
         * and we called the disposer, ...BUT... React eventually decided to commit it,
         * means it's not really needs to be disposed
         * So we need to call the reviver!
         */
        !waitingToBeCommittedOrDisposed.has(refState)
      ) {
        // User callback must not throw!
        reviveCallback(false);
      } else {
        waitingToBeCommittedOrDisposed.delete(refState);
        if (waitingToBeCommittedOrDisposed.size === 0 && cleanupTimerLoopHandle !== undefined) {
          clearTimeout(cleanupTimerLoopHandle);
          cleanupTimerLoopHandle = undefined;
        }
      }
    }
  }, [reviveCallback]);
}

function ensureCleanupTimerRunning() {
  if (cleanupTimerLoopHandle === undefined) {
    cleanupTimerLoopHandle = setTimeout(
      disposeAssumedUncommittedComponents,
      DEFAULT_CLEANUP_TIMER_LOOP_MILLIS
    );
  }
}

function scheduleCleanupOfComponentIfConsideredStale(
  ref: React.MutableRefObject<DisposerStateRef | null>,
  disposeCallback: UserCallback
) {
  ref.current = {
    mounted: false,
    cleanAt: Date.now() + DEFAULT_ASSUMED_UNCOMMITTED_AFTER_MILLIS,
    disposeCallback,
  };

  waitingToBeCommittedOrDisposed.add(ref);

  ensureCleanupTimerRunning();
}

/**
 * Run by the cleanup timer to dispose any outstanding reactions
 */
function disposeAssumedUncommittedComponents() {
  cleanupTimerLoopHandle = undefined;

  // Loop through all the candidate leaked reactions; those older
  // than CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS get tidied.

  const now = Date.now();
  waitingToBeCommittedOrDisposed.forEach((ref) => {
    if (ref.current) {
      if (now >= ref.current.cleanAt) {
        // component presumed stale, run the dispose callback
        ref.current.disposeCallback();
        waitingToBeCommittedOrDisposed.delete(ref);
      }
    }
  });

  if (waitingToBeCommittedOrDisposed.size > 0) {
    // We've just finished a round of cleanups but there are still
    // some leak candidates outstanding.
    ensureCleanupTimerRunning();
  }
}
