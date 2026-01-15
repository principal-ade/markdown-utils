import { describe, test, expect } from 'bun:test';
import { parseSkillMarkdown, serializeSkillMarkdown, isSkillMarkdown, extractSkillName, extractSkillDescription } from '../src/utils/skill-parser';
import { SkillParseError, SkillValidationError } from '../src/types/skill';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SKILLS_DIR = join(__dirname, 'fixtures/skills/skills');

describe('Skill Parser - Real Anthropic Skills', () => {
  // Get all skill directories from the submodule
  let skillDirs: string[] = [];

  if (existsSync(SKILLS_DIR)) {
    skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  }

  if (skillDirs.length === 0) {
    test('submodule check', () => {
      throw new Error(
        'No skills found. Did you initialize the submodule?\n' +
        'Run: git submodule update --init --recursive'
      );
    });
  }

  test(`found ${skillDirs.length} skills to test`, () => {
    expect(skillDirs.length).toBeGreaterThan(0);
    console.log(`Testing ${skillDirs.length} skills:`, skillDirs.join(', '));
  });

  // Test each skill individually
  for (const skillName of skillDirs) {
    describe(skillName, () => {
      const skillPath = join(SKILLS_DIR, skillName, 'SKILL.md');
      let content: string;

      test('SKILL.md exists', () => {
        expect(existsSync(skillPath)).toBe(true);
        content = readFileSync(skillPath, 'utf-8');
      });

      test('is valid skill markdown', () => {
        content = readFileSync(skillPath, 'utf-8');
        expect(isSkillMarkdown(content)).toBe(true);
      });

      test('parses without errors', () => {
        content = readFileSync(skillPath, 'utf-8');
        expect(() => parseSkillMarkdown(content)).not.toThrow();
      });

      test('has required metadata fields', () => {
        content = readFileSync(skillPath, 'utf-8');
        const parsed = parseSkillMarkdown(content);

        expect(parsed.metadata.name).toBeTruthy();
        expect(typeof parsed.metadata.name).toBe('string');
        expect(parsed.metadata.name.trim().length).toBeGreaterThan(0);

        expect(parsed.metadata.description).toBeTruthy();
        expect(typeof parsed.metadata.description).toBe('string');
        expect(parsed.metadata.description.trim().length).toBeGreaterThan(0);
      });

      test('has markdown body', () => {
        content = readFileSync(skillPath, 'utf-8');
        const parsed = parseSkillMarkdown(content);

        expect(parsed.body).toBeTruthy();
        expect(typeof parsed.body).toBe('string');
        expect(parsed.body.trim().length).toBeGreaterThan(0);
      });

      test('preserves raw content', () => {
        content = readFileSync(skillPath, 'utf-8');
        const parsed = parseSkillMarkdown(content);

        expect(parsed.raw).toBe(content);
      });

      test('extractSkillName works', () => {
        content = readFileSync(skillPath, 'utf-8');
        const name = extractSkillName(content);
        const parsed = parseSkillMarkdown(content);

        expect(name).toBe(parsed.metadata.name);
      });

      test('extractSkillDescription works', () => {
        content = readFileSync(skillPath, 'utf-8');
        const description = extractSkillDescription(content);
        const parsed = parseSkillMarkdown(content);

        expect(description).toBe(parsed.metadata.description);
      });
    });
  }
});

describe('Skill Parser - Error Handling', () => {
  test('throws on missing frontmatter', () => {
    const content = '# Just a regular markdown file';
    expect(() => parseSkillMarkdown(content)).toThrow(SkillParseError);
  });

  test('throws on unclosed frontmatter', () => {
    const content = '---\nname: test\n# Missing closing ---';
    expect(() => parseSkillMarkdown(content)).toThrow(SkillParseError);
  });

  test('throws on missing name field', () => {
    const content = '---\ndescription: A skill without a name\n---\n\n# Body';
    expect(() => parseSkillMarkdown(content)).toThrow(SkillValidationError);
  });

  test('throws on missing description field', () => {
    const content = '---\nname: test-skill\n---\n\n# Body';
    expect(() => parseSkillMarkdown(content)).toThrow(SkillValidationError);
  });

  test('throws on empty name', () => {
    const content = '---\nname: ""\ndescription: A skill\n---\n\n# Body';
    expect(() => parseSkillMarkdown(content)).toThrow(SkillValidationError);
  });
});

describe('Skill Parser - Optional Fields', () => {
  test('parses license field', () => {
    const content = '---\nname: test\ndescription: A test skill\nlicense: MIT\n---\n\n# Body';
    const parsed = parseSkillMarkdown(content);
    expect(parsed.metadata.license).toBe('MIT');
  });

  test('parses compatibility field', () => {
    const content = '---\nname: test\ndescription: A test skill\ncompatibility: ">=1.0.0"\n---\n\n# Body';
    const parsed = parseSkillMarkdown(content);
    expect(parsed.metadata.compatibility).toBe('>=1.0.0');
  });

  test('parses allowed-tools as space-delimited string', () => {
    const content = '---\nname: test\ndescription: A test skill\nallowed-tools: "Read Write Bash"\n---\n\n# Body';
    const parsed = parseSkillMarkdown(content);
    expect(parsed.metadata['allowed-tools']).toEqual(['Read', 'Write', 'Bash']);
  });

  test('handles empty allowed-tools', () => {
    const content = '---\nname: test\ndescription: A test skill\nallowed-tools: ""\n---\n\n# Body';
    const parsed = parseSkillMarkdown(content);
    expect(parsed.metadata['allowed-tools']).toEqual([]);
  });
});

describe('Skill Parser - Utility Functions', () => {
  test('isSkillMarkdown returns true for valid skill', () => {
    const content = '---\nname: test\n---\n\nBody';
    expect(isSkillMarkdown(content)).toBe(true);
  });

  test('isSkillMarkdown returns false for invalid content', () => {
    const content = 'Just markdown without frontmatter';
    expect(isSkillMarkdown(content)).toBe(false);
  });

  test('extractSkillName returns null for invalid content', () => {
    const content = 'Invalid content';
    expect(extractSkillName(content)).toBeNull();
  });

  test('extractSkillDescription returns null for invalid content', () => {
    const content = 'Invalid content';
    expect(extractSkillDescription(content)).toBeNull();
  });
});

describe('Skill Parser - Round-Trip Serialization', () => {
  // Get all skill directories from the submodule
  let skillDirs: string[] = [];

  if (existsSync(SKILLS_DIR)) {
    skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  }

  test('serialize basic skill', () => {
    const content = '---\nname: test\ndescription: A test skill\n---\n\n# Test Skill';
    const parsed = parseSkillMarkdown(content);
    const serialized = serializeSkillMarkdown(parsed);
    const reparsed = parseSkillMarkdown(serialized);

    expect(reparsed.metadata.name).toBe(parsed.metadata.name);
    expect(reparsed.metadata.description).toBe(parsed.metadata.description);
    expect(reparsed.body).toBe(parsed.body);
  });

  test('serialize skill with all optional fields', () => {
    const content = `---
name: test
description: A test skill
license: MIT
compatibility: ">=1.0.0"
allowed-tools: Read Write Bash
metadata:
  author: Test Author
  version: "1.0.0"
---

# Test Skill

Body content here.`;

    const parsed = parseSkillMarkdown(content);
    const serialized = serializeSkillMarkdown(parsed);
    const reparsed = parseSkillMarkdown(serialized);

    expect(reparsed.metadata.name).toBe(parsed.metadata.name);
    expect(reparsed.metadata.description).toBe(parsed.metadata.description);
    expect(reparsed.metadata.license).toBe(parsed.metadata.license);
    expect(reparsed.metadata.compatibility).toBe(parsed.metadata.compatibility);
    expect(reparsed.metadata['allowed-tools']).toEqual(parsed.metadata['allowed-tools']);
    expect(reparsed.metadata.metadata).toEqual(parsed.metadata.metadata);
    expect(reparsed.body).toBe(parsed.body);
  });

  // Test round-trip for all Anthropic skills
  for (const skillName of skillDirs) {
    test(`round-trip: ${skillName}`, () => {
      const skillPath = join(SKILLS_DIR, skillName, 'SKILL.md');
      const original = readFileSync(skillPath, 'utf-8');

      // Parse original
      const parsed1 = parseSkillMarkdown(original);

      // Serialize
      const serialized = serializeSkillMarkdown(parsed1);

      // Parse serialized version
      const parsed2 = parseSkillMarkdown(serialized);

      // Compare parsed objects - they should be identical
      expect(parsed2.metadata.name).toBe(parsed1.metadata.name);
      expect(parsed2.metadata.description).toBe(parsed1.metadata.description);
      expect(parsed2.metadata.license).toBe(parsed1.metadata.license);
      expect(parsed2.metadata.compatibility).toBe(parsed1.metadata.compatibility);
      expect(parsed2.metadata['allowed-tools']).toEqual(parsed1.metadata['allowed-tools']);
      expect(parsed2.metadata.metadata).toEqual(parsed1.metadata.metadata);
      expect(parsed2.body).toBe(parsed1.body);
    });
  }
});
