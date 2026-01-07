/**
 * Parser for Agent Skills SKILL.md files
 * Follows specification from https://github.com/agentskills/agentskills
 */

import type {
  SkillMetadata,
  ParsedSkill,
} from '../types/skill';
import {
  SkillParseError,
  SkillValidationError,
} from '../types/skill';

/**
 * Parse YAML frontmatter from markdown content
 * Extracts content between --- delimiters
 */
function extractFrontmatter(content: string): { frontmatter: string; body: string } {
  const trimmed = content.trim();

  // Check if content starts with ---
  if (!trimmed.startsWith('---')) {
    throw new SkillParseError('SKILL.md must start with YAML frontmatter (---)');
  }

  // Find the closing ---
  const afterFirstDelimiter = trimmed.slice(3);
  const closingIndex = afterFirstDelimiter.indexOf('\n---');

  if (closingIndex === -1) {
    throw new SkillParseError('SKILL.md frontmatter is not properly closed with ---');
  }

  const frontmatter = afterFirstDelimiter.slice(0, closingIndex).trim();
  const body = afterFirstDelimiter.slice(closingIndex + 4).trim();

  return { frontmatter, body };
}

/**
 * Simple YAML parser for frontmatter
 * Handles basic key-value pairs, lists, and nested objects
 */
function parseYamlFrontmatter(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let currentKey: string | null = null;
  let currentObject: Record<string, string> | null = null;
  let currentList: string[] | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const lineIndent = line.search(/\S/);

    // Detect list items (indented lines starting with -)
    if (trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();
      if (currentList) {
        currentList.push(value);
      }
      continue;
    }

    // Detect key-value pairs
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();

      // Top-level key (no indentation)
      if (lineIndent === 0) {
        currentKey = key;
        currentList = null;
        currentObject = null;

        // Empty value might indicate a list or nested object follows
        if (!value) {
          // Peek ahead to determine if it's a list or object
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const nextTrimmed = nextLine.trim();
            if (nextTrimmed.startsWith('- ')) {
              // It's a list
              currentList = [];
              result[key] = currentList;
            } else if (nextLine.search(/\S/) > 0 && nextLine.includes(':')) {
              // It's a nested object
              currentObject = {};
              result[key] = currentObject;
            }
          }
        } else {
          // Remove quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, '');
          result[key] = cleanValue;
        }
      } else if (lineIndent > 0 && currentObject) {
        // Nested key-value in object
        const cleanValue = value.replace(/^["']|["']$/g, '');
        currentObject[key] = cleanValue;
      }
    }
  }

  return result;
}

/**
 * Validate required skill metadata fields
 */
function validateSkillMetadata(metadata: Record<string, unknown>): SkillMetadata {
  // Check required fields
  if (!metadata.name || typeof metadata.name !== 'string' || !metadata.name.trim()) {
    throw new SkillValidationError('Required field "name" is missing or empty', 'name');
  }

  if (!metadata.description || typeof metadata.description !== 'string' || !metadata.description.trim()) {
    throw new SkillValidationError('Required field "description" is missing or empty', 'description');
  }

  // Validate optional fields
  if (metadata.license !== undefined && typeof metadata.license !== 'string') {
    throw new SkillValidationError('Field "license" must be a string', 'license');
  }

  if (metadata.compatibility !== undefined && typeof metadata.compatibility !== 'string') {
    throw new SkillValidationError('Field "compatibility" must be a string', 'compatibility');
  }

  // Handle allowed-tools as space-delimited string per Agent Skills spec
  if (metadata['allowed-tools'] !== undefined) {
    if (typeof metadata['allowed-tools'] === 'string') {
      // Convert space-delimited string to array (Agent Skills spec format)
      const toolsString = metadata['allowed-tools'] as string;
      metadata['allowed-tools'] = toolsString.trim() ? toolsString.trim().split(/\s+/) : [];
    } else {
      throw new SkillValidationError('Field "allowed-tools" must be a space-delimited string', 'allowed-tools');
    }
  }

  if (metadata.metadata !== undefined && (typeof metadata.metadata !== 'object' || Array.isArray(metadata.metadata))) {
    throw new SkillValidationError('Field "metadata" must be an object', 'metadata');
  }

  // Build validated SkillMetadata object
  const skillMetadata: SkillMetadata = {
    name: metadata.name as string,
    description: metadata.description as string,
  };

  if (metadata.license !== undefined) {
    skillMetadata.license = metadata.license as string;
  }

  if (metadata.compatibility !== undefined) {
    skillMetadata.compatibility = metadata.compatibility as string;
  }

  if (metadata['allowed-tools'] !== undefined) {
    skillMetadata['allowed-tools'] = metadata['allowed-tools'] as string[];
  }

  if (metadata.metadata !== undefined) {
    skillMetadata.metadata = metadata.metadata as Record<string, string>;
  }

  return skillMetadata;
}

/**
 * Parse a SKILL.md file content into structured data
 *
 * @param content - The raw SKILL.md file content
 * @returns Parsed skill with metadata and markdown body
 * @throws {SkillParseError} If the file format is invalid
 * @throws {SkillValidationError} If required fields are missing or invalid
 *
 * @example
 * ```typescript
 * const content = `---
 * name: legal-review
 * description: Review contracts for compliance
 * allowed-tools: "Read Write Bash(jq:*)"
 * ---
 *
 * # Legal Review Skill
 *
 * This skill reviews legal documents...
 * `;
 *
 * const skill = parseSkillMarkdown(content);
 * console.log(skill.metadata.name); // "legal-review"
 * console.log(skill.body); // "# Legal Review Skill\n\n..."
 * ```
 */
export function parseSkillMarkdown(content: string): ParsedSkill {
  try {
    // Extract frontmatter and body
    const { frontmatter, body } = extractFrontmatter(content);

    // Parse YAML frontmatter
    let rawMetadata: Record<string, unknown>;
    try {
      rawMetadata = parseYamlFrontmatter(frontmatter);
    } catch (error) {
      throw new SkillParseError(
        'Failed to parse YAML frontmatter',
        error
      );
    }

    // Validate metadata
    const metadata = validateSkillMetadata(rawMetadata);

    return {
      metadata,
      body,
      raw: content,
    };
  } catch (error) {
    if (error instanceof SkillParseError || error instanceof SkillValidationError) {
      throw error;
    }
    throw new SkillParseError('Failed to parse SKILL.md', error);
  }
}

/**
 * Extract skill name from SKILL.md content without full parsing
 * Useful for quick lookups
 */
export function extractSkillName(content: string): string | null {
  try {
    const { frontmatter } = extractFrontmatter(content);
    const metadata = parseYamlFrontmatter(frontmatter);
    return typeof metadata.name === 'string' ? metadata.name : null;
  } catch {
    return null;
  }
}

/**
 * Extract skill description from SKILL.md content without full parsing
 * Useful for quick lookups
 */
export function extractSkillDescription(content: string): string | null {
  try {
    const { frontmatter } = extractFrontmatter(content);
    const metadata = parseYamlFrontmatter(frontmatter);
    return typeof metadata.description === 'string' ? metadata.description : null;
  } catch {
    return null;
  }
}

/**
 * Check if content appears to be a valid SKILL.md file
 * Does not perform full validation, just basic format check
 */
export function isSkillMarkdown(content: string): boolean {
  try {
    const trimmed = content.trim();
    return trimmed.startsWith('---') && trimmed.includes('\n---');
  } catch {
    return false;
  }
}
