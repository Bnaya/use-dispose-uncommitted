export type UserCallback = () => void;

export interface UserReviverCallback {
  (
    /**
     * @param {boolean} renderBeforeCommit True when the reviver was called from render after dispose and not commit after dispose
     */
    renderAndNotCommit: boolean
  ): void;
}

export interface UseDisposeUncommittedFinalizationRegistry {
  (disposeCallback: UserCallback): void;
}

export interface UseDisposeUncommitted {
  (disposeCallback: UserCallback, reviveCallback: UserReviverCallback): void;
}

/**
 * timeouts are not configurable atm
 */
// interface Options {
//   /**
//    * The amount of time since render an uncommitted component instance will be considered disposed
//    * @default 10000
//    */
//   assumedUncommittedAfterMillis?: number;

//   /**
//    * The frequency with which we'll check for assumed uncommitted component
//    * @default 10000
//    */
//   cleanupTimerLoopMillis?: number;
// }
