import { arrayToCsv, buildSearch, csvToArray, readQueryParams } from "@/shared/utils/url";

describe("url utils", () => {
  it("reads query params", () => {
    expect(readQueryParams("?a=1&b=two")).toEqual({ a: "1", b: "two" });
  });

  it("builds search string without empty values", () => {
    expect(buildSearch({ a: 1, b: "", c: null, d: "ok" })).toBe("?a=1&d=ok");
  });

  it("converts csv/text to array", () => {
    expect(csvToArray("A,B\nC\tD")).toEqual(["A", "B", "C", "D"]);
  });

  it("joins array to csv", () => {
    expect(arrayToCsv(["X", "Y"])).toBe("X,Y");
  });
});
