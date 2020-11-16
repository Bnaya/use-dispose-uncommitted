import "./kill-finalization-registry";
import useDisposeUncommittedDefault, { useDisposeUncommitted } from "../src/index";

test("The timers impl is exported", () => {
  expect(useDisposeUncommittedDefault.name).toBe("useDisposeUncommittedTimerBased");
  expect(useDisposeUncommitted.name).toBe("useDisposeUncommittedTimerBased");
});
