import { cleanup, render } from "@testing-library/react";
import React, { useLayoutEffect, useRef } from "react";
import { DEFAULT_CLEANUP_TIMER_LOOP_MILLIS } from "../src/consts";
import {
  useDisposeUncommittedTimerBased,
  waitingToBeCommittedOrDisposed,
} from "../src/timers-based-impl";

interface CounterGroups {
  instances: number;
  mounts: number;
  unmounts: number;
  disposes: number;
  renders: number;
  revivesOnCommit: number;
  revivesOnRender: number;
}

describe("timers based impl", () => {
  test("Dispose is called for uncommitted component and not called for committed component", async () => {
    const countersComp1: CounterGroups = {
      instances: 0,
      mounts: 0,
      unmounts: 0,
      disposes: 0,
      renders: 0,
      revivesOnCommit: 0,
      revivesOnRender: 0,
    };

    const countersComp2: CounterGroups = {
      instances: 0,
      mounts: 0,
      unmounts: 0,
      disposes: 0,
      renders: 0,
      revivesOnCommit: 0,
      revivesOnRender: 0,
    };

    function useUpdateCounters(countersGroup: CounterGroups) {
      countersGroup.renders += 1;
      const isFirstRender = useRef<{ firstRender: boolean }>({ firstRender: true });

      if (isFirstRender.current.firstRender) {
        isFirstRender.current.firstRender = false;
        countersGroup.instances += 1;
      }

      useDisposeUncommittedTimerBased(
        () => {
          countersGroup.disposes += 1;
        },
        (revivedOnRender) => {
          if (revivedOnRender) {
            countersGroup.revivesOnRender += 1;
          } else {
            countersGroup.revivesOnCommit += 1;
          }
        }
      );

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

    await sleep(DEFAULT_CLEANUP_TIMER_LOOP_MILLIS + 1000);

    expect(waitingToBeCommittedOrDisposed.size).toBe(0);

    expect(countersComp1).toMatchInlineSnapshot(`
      Object {
        "disposes": 1,
        "instances": 2,
        "mounts": 1,
        "renders": 4,
        "revivesOnCommit": 0,
        "revivesOnRender": 0,
        "unmounts": 1,
      }
    `);
    expect(countersComp2).toMatchInlineSnapshot(`
      Object {
        "disposes": 1,
        "instances": 2,
        "mounts": 1,
        "renders": 2,
        "revivesOnCommit": 0,
        "revivesOnRender": 0,
        "unmounts": 1,
      }
    `);
  }, 20_000);
});

function sleep(time: number): Promise<void> {
  return new Promise<void>((res) => {
    setTimeout(res, time);
  });
}
