import test from "node:test";
import assert from "node:assert/strict";
import { generateJoinCode, isValidJoinCode } from "../src/joinCodes.js";

test("join code generation returns 6 allowed characters", () => {
  const code = generateJoinCode();

  assert.equal(code.length, 6);
  assert.equal(isValidJoinCode(code), true);
});

test("join code generation can produce unique codes across a sample", () => {
  const codes = new Set();

  for (let index = 0; index < 1000; index += 1) {
    codes.add(generateJoinCode());
  }

  assert.equal(codes.size, 1000);
});
