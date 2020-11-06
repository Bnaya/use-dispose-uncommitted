# Warning ⚠️☣️ you probably don't need to use that
For the vast majority of cases, use [useEffect](https://reactjs.org/docs/hooks-reference.html#useeffect), and the [cleanup function](https://reactjs.org/docs/hooks-reference.html#cleaning-up-an-effect) for side effects and cleanups, and KEEP YOUR RENDER FUNCTION PURE

# Ah, still here? useDisposeUncommitted [WIP]

useDisposeUncommitted is a React hook to help us cleanup side effects of uncommitted components.  
Based on similar implementation of [MobX's internal hook](https://github.com/mobxjs/mobx/blob/5d5eb89/packages/mobx-react-lite/src/utils/createReactionCleanupTrackingUsingFinalizationRegister.ts).  
React discussion in this topic: [#15317 [Concurrent] Safely disposing uncommitted objects](https://github.com/facebook/react/issues/15317)

## Explainer - Why do we need that?
It is know that, side effects in react should be only inside `useEffect`, and React will run them only when the component instance is actually being committed/mounted.  

React may (For various reasons: suspense, strick-mode, aborted-renders) decide to throw away component instance after render, but before running `useEffects`, without letting us know in any mean.

As long as we keep side-effects in `useEffects` it's not a problem, But lets take MobX as example:  
In order to track access to observables, MobX must create the reaction on render phase.
And in case this React will throw away tje component instance, we will not have a chance to dispose the Mobx reaction, which means memory leaks and possible bugs.

## How - TBW
[FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry) on supported engines (chromium 84+, firefox 79+, node 14), or "legacy" using timer-based GC
