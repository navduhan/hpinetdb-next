import { normalizeAnnotationBundle, normalizeJobId, normalizePagedResponse } from "@/shared/api/mappers";

describe("api mappers", () => {
  it("normalizes paged response from data key", () => {
    const parsed = normalizePagedResponse({ data: [{ a: 1 }], total: "4" });
    expect(parsed.results).toHaveLength(1);
    expect(parsed.total).toBe(4);
  });

  it("normalizes job ids from multiple payload styles", () => {
    expect(normalizeJobId("abc")).toBe("abc");
    expect(normalizeJobId({ resultid: 12 })).toBe("12");
    expect(normalizeJobId({ id: "x" })).toBe("x");
  });

  it("normalizes annotation bundle with empty fallbacks", () => {
    const parsed = normalizeAnnotationBundle({ hgo: [{ gene: "A" }] });
    expect(parsed.hgo).toHaveLength(1);
    expect(parsed.pgo).toEqual([]);
    expect(parsed.htf).toEqual([]);
  });
});
