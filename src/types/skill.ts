/**
 * Skill types following the Agent Skills specification
 * https://github.com/agentskills/agentskills
 */

/**
 * Parsed Agent Skill metadata from SKILL.md frontmatter
 */
export interface SkillMetadata {
  /** Required: Name of the skill */
  name: string;
  /** Required: Description of what the skill does */
  description: string;
  /** Optional: License information */
  license?: string;
  /** Optional: Compatibility requirements */
  compatibility?: string;
  /** Optional: List of allowed tools the skill can use (parsed from space-delimited string) */
  'allowed-tools'?: string[];
  /** Optional: Custom metadata key-value pairs */
  metadata?: Record<string, string>;
}

/**
 * Parsed SKILL.md file with frontmatter and markdown body
 */
export interface ParsedSkill {
  /** Metadata from YAML frontmatter */
  metadata: SkillMetadata;
  /** Markdown content (body after frontmatter) */
  body: string;
  /** Raw original content */
  raw: string;
}

/**
 * Error thrown when SKILL.md parsing fails
 */
export class SkillParseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'SkillParseError';
  }
}

/**
 * Error thrown when SKILL.md validation fails
 */
export class SkillValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'SkillValidationError';
  }
}
