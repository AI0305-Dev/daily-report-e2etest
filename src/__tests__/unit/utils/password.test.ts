import { describe, it, expect } from "vitest";
import { generateInitialPassword } from "@/lib/utils/password";

describe("generateInitialPassword", () => {
  it("UT050: 8文字以上生成される", () => {
    const password = generateInitialPassword();
    expect(password.length).toBeGreaterThanOrEqual(8);
  });

  it("UT051: 英字・数字を含む", () => {
    const password = generateInitialPassword();
    expect(/[A-Za-z]/.test(password)).toBe(true);
    expect(/[0-9]/.test(password)).toBe(true);
  });

  it("UT052: 呼び出しごとに異なる値を返す", () => {
    const first = generateInitialPassword();
    const second = generateInitialPassword();
    expect(first).not.toBe(second);
  });
});
