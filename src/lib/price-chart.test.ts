import { describe, expect, it } from "vitest";
import { buildLinePath } from "./price-chart";

describe("buildLinePath", () => {
  it("가격이 없으면 빈 문자열을 반환한다", () => {
    expect(buildLinePath([], 100, 50)).toBe("");
  });

  it("가격이 하나면 중앙을 가로지르는 수평선을 반환한다", () => {
    const path = buildLinePath([10000], 100, 50, 8);
    expect(path).toBe("M 8,25 L 92,25");
  });

  it("가격이 모두 같으면(range 0) 수평선을 반환한다", () => {
    const path = buildLinePath([10000, 10000], 100, 50, 8);
    expect(path.startsWith("M 8.0,25.0")).toBe(true);
    expect(path).toContain("L 92.0,25.0");
  });

  it("가격이 오르면 좌상단에서 우하단이 아니라 y가 감소하는 경로를 만든다(가격 상승 = 낮은 y)", () => {
    const path = buildLinePath([10000, 20000], 100, 60, 0);
    const [, secondPoint] = path.split(" L ");
    const y = Number(secondPoint.split(",")[1]);
    expect(y).toBe(0);
  });
});
