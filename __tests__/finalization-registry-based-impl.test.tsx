import { cleanup, render } from "@testing-library/react";
// @ts-expect-error lib have no @types package, and the api is super simple
import gc from "expose-gc/function";
import React, { useLayoutEffect, useRef } from "react";
import {
  createUseDisposeUncommitted,
  userCallbacksMap,
} from "../src/finalization-registry-based-impl";
import { FinalizationRegistry } from "../src/FinalizationRegistryWrapper";
import { assertNotNullable } from "../src/utils";

interface CounterGroups {
  instances: number;
  mounts: number;
  unmounts: number;
  disposes: number;
  renders: number;
}

describe("finalization registry based implementation", () => {
  assertNotNullable(FinalizationRegistry);

  const useDisposeUncommitted = createUseDisposeUncommitted(FinalizationRegistry);

  test("Dispose is called for uncommitted component and not called for committed component", async () => {
    const countersComp1: CounterGroups = {
      instances: 0,
      mounts: 0,
      unmounts: 0,
      disposes: 0,
      renders: 0,
    };

    const countersComp2: CounterGroups = {
      instances: 0,
      mounts: 0,
      unmounts: 0,
      disposes: 0,
      renders: 0,
    };

    function useUpdateCounters(countersGroup: CounterGroups) {
      countersGroup.renders += 1;
      const isFirstRender = useRef<{ firstRender: boolean }>({ firstRender: true });

      if (isFirstRender.current.firstRender) {
        isFirstRender.current.firstRender = false;
        countersGroup.instances += 1;
      }

      useDisposeUncommitted(() => {
        countersGroup.disposes += 1;
      });

      useLayoutEffect(() => {
        countersGroup.mounts += 1;
        return () => {
          countersGroup.unmounts += 1;
        };
      }, [countersGroup]);
    }

    function TestComponent1() {
      useUpdateCounters(countersComp1);
      return <div />;
    }

    function TestComponent2() {
      useUpdateCounters(countersComp2);
      return <div />;
    }

    // Render, then remove only #2
    const rendering = render(
      <React.StrictMode>
        <TestComponent1 />
        <TestComponent2 />
      </React.StrictMode>
    );
    rendering.rerender(
      <React.StrictMode>
        <TestComponent1 />
      </React.StrictMode>
    );

    cleanup();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    gc();

    await sleep(50);

    expect(countersComp1).toMatchInlineSnapshot(`
      Object {
        "disposes": 1,
        "instances": 2,
        "mounts": 1,
        "renders": 4,
        "unmounts": 1,
      }
    `);
    expect(countersComp2).toMatchInlineSnapshot(`
      Object {
        "disposes": 1,
        "instances": 2,
        "mounts": 1,
        "renders": 2,
        "unmounts": 1,
      }
    `);

    expect(userCallbacksMap.size).toBe(0);
  });
});

function sleep(time: number): Promise<void> {
  return new Promise<void>((res) => {
    setTimeout(res, time);
  });
}
