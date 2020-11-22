# Warning ⚠️☣️🐉 you probably don't need it
For the vast majority of cases, use [useEffect](https://reactjs.org/docs/hooks-reference.html#useeffect), and the [cleanup function](https://reactjs.org/docs/hooks-reference.html#cleaning-up-an-effect) for side effects and cleanups, and KEEP YOUR RENDER FUNCTION PURE

# Ah, still here? useDisposeUncommitted

[![codecov](https://codecov.io/gh/Bnaya/use-dispose-uncommitted/branch/main/graph/badge.svg?token=A1UIArW8lH)](https://codecov.io/gh/Bnaya/use-dispose-uncommitted)  
useDisposeUncommitted is a tiny React hook to help us clean side effects of uncommitted components.  
Based on a similar implementation of [MobX's internal hook](https://github.com/mobxjs/mobx/blob/5d5eb89/packages/mobx-react-lite/src/utils/createReactionCleanupTrackingUsingFinalizationRegister.ts).  
Relevant discussion in the React repo on this topic: [#15317 [Concurrent] Safely disposing uncommitted objects](https://github.com/facebook/react/issues/15317).

## When do we ever need that? - Explainer
It is known that side effects in React should only be inside `useEffect` and that React will run them only when the component instance is actually being committed/mounted.  

However, React may decide to throw away a component instance after rendering (for various reasons like suspense, strict mode, aborted renders), but before running `useEffect`, without letting us know by any means.

As long as we keep side-effects in `useEffect`, it's not a problem. But consider MobX as an example: in order to track access to observables, MobX must create the reaction during the render phase. In this case, React may throw away the component instance, and we won't have a chance to dispose of the MobX reaction, resulting in memory leaks and possible bugs.

## Simple usage example
Install the package: `yarn add use-dispose-uncommitted`.

```js
// default import also works
import { useDisposeUncommitted } from "use-dispose-uncommitted";

function MyComponent() {
  useDisposeUncommitted(function disposer() {
    console.log('Component disposed by React');
  }, function reviver(revivedFromRenderBeforeCommit) {
    if (revivedFromRenderBeforeCommit) {
      console.log('Component speculatively disposed by us, but React suddenly re-rendered it');
    } else {
      console.log('Component speculatively disposed by us, but React suddenly mounted it');
    }
  });
}
```

**Naive Mobx's useObserver implementation:**
```ts
import { Reaction } from "mobx";
function useObserver(jsxFactoryFunction) {
  const [__, forceUpdateCounter] = useState(0);

  function forceUpdate() {
    forceUpdateCounter(c => c + 1);
  }

  const reactionRef = useRef<Reaction>(null);
  const mountingRef = useRef<{ changedBefore: boolean, isMounted: boolean }>({
    changedBefore: false,
    isMounted: false
  });

  function createReaction() {
    reactionRef.current = new Reaction(() => {
      if (mountingRef.isMounted) {
        forceUpdate();
      } else {
        mountingRef.changedBefore = true;
      }
    });
  }

  useDisposeUncommitted(() => {
    reactionRef.current.dispose();
    reactionRef.current = null;
  }, (revivedFromRenderBeforeCommit) => {
    createReaction();
  });

  useLayoutEffect(() => {
    if (mountingRef.changedBefore) {
      forceUpdate();
    }
    mountingRef.isMounted = true;

    return function unMountCleanup() {
      reactionRef.current.dispose();
      reactionRef.current = null;
    }
  }, []);

  if (reactionRef.current === null) {
    createReaction();
  }
}
```

## Implementation details

### Using FinalizationRegistry
In JS engines which support [FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry) (chromium 84+, firefox 79+, node 14), we allocate a React state without creating any external references, and we register it for cleanup using a FinalizationRegistry.  
As only React has a reference to that state object, we can tell that React has disposed of the component when the cleanup callback is called for that state object.

### Using timer based GC
For platforms without FinalizationRegistry, we take a speculative approach: if during a specific period of time since the render the component wasn't committed, we assume it was disposed by read. That period of time is a hard-coded 10 seconds, non configurable, matching the MobX implementation.

#### Component revival
This speculation can result in a situation, where we've ran our disposer, but React suddenly commits or re-renders the component. For this case, we have the reviver function, which runs to signal that. 

### Not sure if it's a  good idea to use FinalizationRegistry for that? [Read this comment](https://github.com/facebook/react/issues/15317#issuecomment-722627311)

## Testing, Running, Building.
This project is using yarn 2 + pnp + zero install. You need to have `yarn` installed (version doesn't matter), clone and run `yarn test` or `yarn build`.  
Node 14+ is required to run the tests suite.

### Tests coverage
Some code paths are not covered by tests (revive before mount). We need to investigate how to trigger that code path.

## Code Of Conduct (As MobX's)
[Code Of Conduct](https://github.com/mobxjs/mobx/blob/main/CODE_OF_CONDUCT.md)
