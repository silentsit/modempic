import { describe, expect, it, vi, afterEach } from "vitest";
import { sitemapIndexUrl } from "./collect-public-urls";
import { INDEXNOW_BATCH_SIZE, indexNowKeyLocation, submitIndexNow } from "./indexnow";
import { normalizeSearchConsoleSiteUrl } from "./search-console";
import { notifySearchEngines } from "./notify-search-engines";

describe("indexNowKeyLocation", () => {
  it("points to the API key route", () => {
    expect(indexNowKeyLocation("abc123", "https://modempic.com")).toBe(
      "https://modempic.com/api/indexnow/key",
    );
  });
});

describe("normalizeSearchConsoleSiteUrl", () => {
  it("adds trailing slash for domain properties", () => {
    expect(normalizeSearchConsoleSiteUrl("https://modempic.com")).toBe("https://modempic.com/");
    expect(normalizeSearchConsoleSiteUrl("https://modempic.com/")).toBe("https://modempic.com/");
  });
});

describe("sitemapIndexUrl", () => {
  it("returns the sitemap index path", () => {
    expect(sitemapIndexUrl("https://modempic.com/")).toBe("https://modempic.com/sitemap.xml");
  });
});

describe("submitIndexNow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns error when API key is missing", async () => {
    const result = await submitIndexNow(["https://modempic.com/shop"], { apiKey: "" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not configured/i);
  });

  it("batches large URL lists", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);

    const urls = Array.from({ length: INDEXNOW_BATCH_SIZE + 1 }, (_, i) => `https://modempic.com/p/${i}`);
    const result = await submitIndexNow(urls, { apiKey: "test-key", siteUrl: "https://modempic.com" });

    expect(result.ok).toBe(true);
    expect(result.submitted).toBe(urls.length);
    expect(result.batches).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("notifySearchEngines", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SEO_NOTIFY_ALLOW_DEV;
  });

  it("blocks localhost by default", async () => {
    const result = await notifySearchEngines({
      indexNow: true,
      siteUrl: "http://localhost:3000",
    });

    expect(result.blockedReason).toMatch(/localhost/i);
    expect(result.urlCount).toBe(0);
  });
});
