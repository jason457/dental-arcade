import { describe, expect, it } from "vitest";
import { CATALOGUE, allProcedures, catalogueCounts, findProcedure } from "@/content/catalogue";
import { getCase } from "@/engines/case";
import { STATUS } from "@/content/status";

describe("curriculum catalogue", () => {
  it("has unique slugs", () => {
    const slugs = allProcedures().map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(CATALOGUE.map((s) => s.slug)).size).toBe(CATALOGUE.length);
  });
  it("covers ten specialties plus cross-specialty modules", () => {
    expect(CATALOGUE.filter((s) => !s.crossSpecialty)).toHaveLength(10);
    expect(CATALOGUE.find((s) => s.crossSpecialty)?.procedures).toHaveLength(7);
    expect(catalogueCounts().procedures).toBe(157);
  });
  it("claims nothing as published, and every playable entry has a real case", () => {
    expect(catalogueCounts().published).toBe(0);
    for (const p of allProcedures().filter((x) => x.status !== "planned")) expect(getCase(p.caseSlug!), p.slug).toBeDefined();
    expect(findProcedure("simple-extraction")?.status).toBe("demo");
  });
  it("status page numbers match the catalogue", () => {
    const row = STATUS.find((r) => r.module === "Curriculum catalogue")!;
    expect(row.detail).toContain(String(catalogueCounts().procedures));
    expect(row.detail).toContain(String(CATALOGUE.length));
  });
});
