import { describe, expect, it } from "vitest";
import { LOWER, TOOL_ART, archPoint, jawFront, jawSide, mouth, toothPoint } from "@/game/art";
import { getCase } from "@/engines/case";

describe("game illustrations", () => {
  it("draws all 16 lower teeth with 46 on the patient's right", () => {
    expect(LOWER).toHaveLength(16);
    const svg = mouth({ numbers: true });
    for (const n of LOWER) expect(svg).toContain(`data-n="${n}"`);
    expect(toothPoint(46).x).toBeLessThan(toothPoint(36).x);
    expect(archPoint(0).y).toBeLessThan(archPoint(7).y);
  });
  it("every scene has the layers the game draws into", () => {
    for (const svg of [mouth(), jawSide(), jawSide({ socket: "dry" }), jawFront()]) {
      expect(svg).toContain('id="fx"');
      expect(svg.startsWith("<svg")).toBe(true);
    }
    expect(jawSide({ socket: "tip" })).toContain('id="tip"');
    expect(jawSide({ socket: "healed" })).not.toContain('id="socket"');
  });
  it("has art for every instrument the case mentions", () => {
    const c = getCase("simple-extraction-46")!;
    const icons = c.steps.flatMap((s) => ("options" in s ? s.options.map((o) => ("icon" in o ? o.icon : undefined)) : [])).filter(Boolean) as string[];
    const map: Record<string, string> = { scaler: "scaler", handpiece: "handpiece", elevator: "elevator", "forceps-lower": "forceps-lower", "forceps-upper": "forceps-upper", "forceps-bayonet": "forceps-bayonet" };
    for (const i of icons) expect(TOOL_ART[map[i]], i).toBeTruthy();
  });
});
