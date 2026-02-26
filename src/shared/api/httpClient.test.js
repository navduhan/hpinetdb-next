import { request } from "@/shared/api/httpClient";

describe("httpClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps backend sub-path when building api urls", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await request("/api/go/", {
      query: { species: "Wheat", sptype: "host", page: 0, size: 25 }
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/hpinetbackend/api/go/");
    expect(url).toContain("species=Wheat");
    expect(options.headers.Accept).toBe("application/json");
    expect(options.headers["Content-Type"]).toBeUndefined();
  });
});
