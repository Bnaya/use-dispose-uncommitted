export type UserCallback = () => void;

export interface UserReviverCallback {
  (
    /**
     * @param {boolean} revivedFromRenderBeforeCommit True when the reviver was called from render after dispose and not commit after dispose
     */
    revivedFromRenderBeforeCommit: boolean
  ): void;
}

export interface UseDisposeUncommittedFinalizationRegistry {
  (disposeCallback: UserCallback): void;
}

export interface UseDisposeUncommitted {
  (disposeCallback: UserCallback, reviveCallback: UserReviverCallback): void;
}
