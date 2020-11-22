# Warning ⚠️☣️🐉 you probably don't need it
For the vast majority of cases, use [useEffect](https://reactjs.org/docs/hooks-reference.html#useeffect), and the [cleanup function](https://reactjs.org/docs/hooks-reference.html#cleaning-up-an-effect) for side effects and cleanups, and KEEP YOUR RENDER FUNCTION PURE

# Ah, still here? useDisposeUncommitted

[![codecov](https://codecov.io/gh/Bnaya/use-dispose-uncommitted/branch/main/graph/badge.svg?token=A1UIArW8lH)](https://codecov.io/gh/Bnaya/use-dispose-uncommitted)  
useDisposeUncommitted is a tiny React hook to help us clean side effects of uncommitted components.  
Based on similar implementation of [MobX's internal hook](https://github.com/mobxjs/mobx/blob/5d5eb89/packages/mobx-react-lite/src/utils/createReactionCleanupTrackingUsingFinalizationRegister.ts).  
React discussion in this topic: [#15317 [Concurrent] Safely disposing uncommitted objects](https://github.com/facebook/react/issues/15317) 

## When do we ever need that? - Explainer
It is known that, side effects in react should be only inside `useEffect`, and React will run them only when the component instance is actually being committed/mounted.  

React may (For various reasons: suspense, strict-mode, aborted-renders) decide to throw away component instance after render, but before running `useEffects`, without letting us know in any mean.

As long as we keep side-effects in `useEffects` it's not a problem, But lets take MobX as example:  
In order to track access to observables, MobX must create the reaction on render phase.
And in this case React will throw away the component instance, we will not have a chance to dispose the Mobx reaction, which means memory leaks and possible bugs.

## Simple usage example
Install the package `yarn add use-dispose-uncommitted`
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

**Naive Mobx's useObserver impl:**
```ts
import { Reaction } from "mobx";
function useObserver(jsxFactoryFunction) {
  const [__, forceUpdateCounter] = useState(0);

  function forceUpdate() {
    forceUpdateCounter(c => c +1);
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

## Some implementation details
### Using FinalizationRegistry
On js engines that supports
[FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry) (chromium 84+, firefox 79+, node 14), we allocate React state without creating any external reference, and we register it for cleanup on FinalizationRegistry.  
As only React have reference to that state object, we can tell that React have disposed the component when the cleanup callback is called for that state object.


### Using timer based GC
For platform that does not support FinalizationRegistry, We take a speculative assumption that is a specific period of time have passed since render, but the component wasn't committed, we assume it was disposed by read.  
That period of time is a hard-coded 10 seconds, none configurable, as in mobx impl.
#### Component revival
That speculation can bring us to a situation where we've ran our disposer, but React suddenly committing/re-rendering the component.  
for that situation, we also have the reviver function that will run and signal that. 

### Not sure if it's a good idea to use FinalizationRegistry for that? [Read this comment](https://github.com/facebook/react/issues/15317#issuecomment-722627311)

## Testing, Running, Building.
This project is using yarn 2 + pnp + zero install.  
Which means you just need to have yarn installed (version not matter) clone it, and run `yarn test` or `yarn build`.  
Node 14+ is required to run the tests suite
### Tests coverage
Some code paths are not covered by tests (revive before mount),
Need to more investigation how to trigger that code path.

## Code Of Conduct (As MobX's)
[Code Of Conduct](https://github.com/mobxjs/mobx/blob/main/CODE_OF_CONDUCT.md)
