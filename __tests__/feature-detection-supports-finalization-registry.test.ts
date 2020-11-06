import useDisposeUncommittedDefault, { useDisposeUncommitted } from "../src/index";

test("The finalization impl is exported", () => {
  expect(useDisposeUncommittedDefault.name).toBe("useDisposeUncommittedFinalizationRegistry");
  expect(useDisposeUncommitted.name).toBe("useDisposeUncommittedFinalizationRegistry");
});
