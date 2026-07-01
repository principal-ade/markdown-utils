import { describe, expect, test } from "bun:test";
import {
  isRelativeUrl,
  normalizeGitHubMediaUrl,
  transformImageUrl,
  transformMarkdownImageUrls,
} from "./image-urls";

describe("normalizeGitHubMediaUrl", () => {
  test("rewrites a github blob page URL to raw.githubusercontent.com", () => {
    expect(
      normalizeGitHubMediaUrl(
        "https://github.com/envoyproxy/artwork/blob/main/PNG/Envoy_Logo_Final_PANTONE.png",
      ),
    ).toBe(
      "https://raw.githubusercontent.com/envoyproxy/artwork/main/PNG/Envoy_Logo_Final_PANTONE.png",
    );
  });

  test("rewrites a github /raw/ web URL to the raw host", () => {
    expect(
      normalizeGitHubMediaUrl("https://github.com/owner/repo/raw/dev/docs/img.gif"),
    ).toBe("https://raw.githubusercontent.com/owner/repo/dev/docs/img.gif");
  });

  test("handles http (not just https)", () => {
    expect(
      normalizeGitHubMediaUrl("http://github.com/owner/repo/blob/main/a.png"),
    ).toBe("https://raw.githubusercontent.com/owner/repo/main/a.png");
  });

  test("drops a redundant ?raw=true", () => {
    expect(
      normalizeGitHubMediaUrl("https://github.com/owner/repo/blob/main/a.png?raw=true"),
    ).toBe("https://raw.githubusercontent.com/owner/repo/main/a.png");
  });

  test("keeps other query params when dropping raw=true", () => {
    expect(
      normalizeGitHubMediaUrl(
        "https://github.com/owner/repo/blob/main/a.png?raw=true&width=200",
      ),
    ).toBe("https://raw.githubusercontent.com/owner/repo/main/a.png?width=200");
    expect(
      normalizeGitHubMediaUrl(
        "https://github.com/owner/repo/blob/main/a.png?width=200&raw=true",
      ),
    ).toBe("https://raw.githubusercontent.com/owner/repo/main/a.png?width=200");
  });

  test("preserves a branch with dots and nested paths", () => {
    expect(
      normalizeGitHubMediaUrl("https://github.com/o/r/blob/release/1.2/x/y/z.svg"),
    ).toBe("https://raw.githubusercontent.com/o/r/release/1.2/x/y/z.svg");
  });

  test("leaves non-blob github.com URLs untouched", () => {
    const url =
      "https://github.com/owner/repo/user-attachments/assets/abc-123";
    expect(normalizeGitHubMediaUrl(url)).toBe(url);
  });

  test("leaves the tree (directory) view untouched", () => {
    const url = "https://github.com/owner/repo/tree/main/src";
    expect(normalizeGitHubMediaUrl(url)).toBe(url);
  });

  test("leaves already-raw and arbitrary URLs untouched", () => {
    const raw = "https://raw.githubusercontent.com/owner/repo/main/a.png";
    expect(normalizeGitHubMediaUrl(raw)).toBe(raw);
    const cdn = "https://img.shields.io/badge/x.svg";
    expect(normalizeGitHubMediaUrl(cdn)).toBe(cdn);
    expect(normalizeGitHubMediaUrl("./local.png")).toBe("./local.png");
  });
});

describe("transformImageUrl blob handling", () => {
  test("normalizes an absolute github blob URL even without repositoryInfo", () => {
    expect(
      transformImageUrl(
        "https://github.com/envoyproxy/artwork/blob/main/PNG/Envoy_Logo_Final_PANTONE.png",
      ),
    ).toBe(
      "https://raw.githubusercontent.com/envoyproxy/artwork/main/PNG/Envoy_Logo_Final_PANTONE.png",
    );
  });

  test("normalizes a blob URL whose repo differs from repositoryInfo", () => {
    expect(
      transformImageUrl("https://github.com/other/art/blob/main/logo.png", {
        owner: "envoyproxy",
        repo: "envoy",
        branch: "main",
      }),
    ).toBe("https://raw.githubusercontent.com/other/art/main/logo.png");
  });

  test("still resolves relative paths against repositoryInfo", () => {
    expect(
      transformImageUrl("docs/x.png", {
        owner: "envoyproxy",
        repo: "envoy",
        branch: "main",
      }),
    ).toBe("https://raw.githubusercontent.com/envoyproxy/envoy/main/docs/x.png");
  });

  test("leaves ordinary absolute (non-blob) URLs untouched", () => {
    const badge = "https://img.shields.io/pypi/v/x.svg";
    expect(transformImageUrl(badge, { owner: "o", repo: "r" })).toBe(badge);
  });
});

describe("transformMarkdownImageUrls blob handling", () => {
  test("rewrites a github blob image in bulk markdown", () => {
    const md = "![logo](https://github.com/envoyproxy/artwork/blob/main/PNG/x.png)";
    expect(transformMarkdownImageUrls(md, { owner: "envoyproxy", repo: "envoy" })).toBe(
      "![logo](https://raw.githubusercontent.com/envoyproxy/artwork/main/PNG/x.png)",
    );
  });
});

describe("isRelativeUrl (regression guard)", () => {
  test("absolute and scheme URLs are not relative", () => {
    expect(isRelativeUrl("https://x.com/a.png")).toBe(false);
    expect(isRelativeUrl("//x.com/a.png")).toBe(false);
    expect(isRelativeUrl("data:image/png;base64,AAAA")).toBe(false);
    expect(isRelativeUrl("blob:https://x.com/uuid")).toBe(false);
  });
  test("bare paths are relative", () => {
    expect(isRelativeUrl("docs/x.png")).toBe(true);
    expect(isRelativeUrl("/root/x.png")).toBe(true);
  });
});
