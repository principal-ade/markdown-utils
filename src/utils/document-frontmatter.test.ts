import { describe, expect, test } from "bun:test";
import {
  parseFrontmatter,
  stripRedundantTitleHeading,
  fmString,
  fmStringList,
} from "./document-frontmatter";

describe("parseFrontmatter", () => {
  test("returns body untouched when there is no fence", () => {
    const r = parseFrontmatter("# Hello\n\nbody");
    expect(r.hasFrontmatter).toBe(false);
    expect(r.data).toEqual({});
    expect(r.body).toBe("# Hello\n\nbody");
  });

  test("parses top-level scalars and strips the fence", () => {
    const r = parseFrontmatter(
      `---\ntitle: My Doc\ntype: reference\n---\n# My Doc\n\nbody`
    );
    expect(r.hasFrontmatter).toBe(true);
    expect(r.data.title).toBe("My Doc");
    expect(r.data.type).toBe("reference");
    expect(r.body).toBe("# My Doc\n\nbody");
  });

  test("parses inline and block lists", () => {
    const r = parseFrontmatter(
      `---\ntags: [a, "b", c]\nsources:\n  - https://x.test\n  - https://y.test\n---\nbody`
    );
    expect(r.data.tags).toEqual(["a", "b", "c"]);
    expect(r.data.sources).toEqual(["https://x.test", "https://y.test"]);
  });

  test("parses folded block scalars", () => {
    const r = parseFrontmatter(
      `---\ndescription: >\n  one two\n  three\n---\nbody`
    );
    expect(r.data.description).toBe("one two three");
  });

  test("tolerates a leading BOM and CRLF", () => {
    const r = parseFrontmatter(`﻿---\r\ntitle: X\r\n---\r\nbody`);
    expect(r.hasFrontmatter).toBe(true);
    expect(r.data.title).toBe("X");
    expect(r.body).toBe("body");
  });

  test("leaves content untouched when the fence yields no fields", () => {
    const input = `---\n\n---\nbody`;
    const r = parseFrontmatter(input);
    expect(r.hasFrontmatter).toBe(false);
    expect(r.body).toBe(input);
  });
});

describe("stripRedundantTitleHeading", () => {
  test("removes a leading H1 that matches the title", () => {
    expect(stripRedundantTitleHeading("# My Doc\n\nbody", "My Doc")).toBe(
      "body"
    );
  });

  test("keeps an H1 that does not match", () => {
    expect(stripRedundantTitleHeading("# Other\n\nbody", "My Doc")).toBe(
      "# Other\n\nbody"
    );
  });

  test("handles setext H1", () => {
    expect(stripRedundantTitleHeading("My Doc\n=====\n\nbody", "My Doc")).toBe(
      "body"
    );
  });

  test("no-ops without a title", () => {
    expect(stripRedundantTitleHeading("# My Doc\n\nbody", undefined)).toBe(
      "# My Doc\n\nbody"
    );
  });
});

describe("fmString / fmStringList", () => {
  test("fmString coerces and trims", () => {
    expect(fmString("  hi ")).toBe("hi");
    expect(fmString(3)).toBe("3");
    expect(fmString(true)).toBe("true");
    expect(fmString("")).toBeUndefined();
    expect(fmString(null)).toBeUndefined();
  });

  test("fmStringList accepts arrays and single scalars", () => {
    expect(fmStringList(["a", "", "b"])).toEqual(["a", "b"]);
    expect(fmStringList("solo")).toEqual(["solo"]);
    expect(fmStringList(undefined)).toEqual([]);
  });
});
