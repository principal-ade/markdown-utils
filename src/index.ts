// Type exports - chunks
export {
  CHUNK_TYPES,
  type ChunkType,
  type BaseChunk,
  type MarkdownChunk,
  type MermaidChunk,
  type SlideChunk,
  type CodeChunk,
  type ContentChunk,
  isMarkdownChunk,
  isMermaidChunk,
  isCodeChunk,
} from './types/chunks';

// Type exports - presentation
export {
  MarkdownSourceType,
  type MarkdownSource,
  type MarkdownSlideLocation,
  type MarkdownSlide,
  type RepositoryInfo,
  type MarkdownPresentation,
} from './types/presentation';

// Type exports - bash
export {
  type BashCommand,
  type BashCommandOptions,
  type BashCommandResult,
} from './types/bash';

// Utility exports - markdown parser
export {
  parseMarkdownChunks,
} from './utils/markdown-parser';

// Utility exports - rehype plugins
export {
  rehypeCodeKind,
} from './utils/rehype-code-kind';

// Utility exports - presentation
export {
  extractSlideTitle,
  parseMarkdownIntoPresentationFromSource,
  parseMarkdownIntoPresentation,
  serializePresentationToMarkdown,
  updatePresentationSlide,
} from './utils/presentation';

// Utility exports - document front matter
export {
  type ParsedFrontmatter,
  parseFrontmatter,
  stripRedundantTitleHeading,
  fmString,
  fmStringList,
} from './utils/document-frontmatter';

// Utility exports - bash parser
export {
  parseBashCommands,
  getCommandDisplayName,
} from './utils/bash-parser';

// Utility exports - image urls
export {
  isRelativeUrl,
  normalizeGitHubMediaUrl,
  transformImageUrl,
  transformMarkdownImageUrls,
} from './utils/image-urls';

// Utility exports - slide titles
export {
  extractAllSlideTitles,
  getAllSlideTitles,
  findSlideByTitle,
  findSlideIndexByTitle,
} from './utils/slide-titles';

// Type exports - sections
export type {
  MarkdownSection,
  UpsertSectionOptions,
  UpsertResult,
} from './types/section';

// Utility exports - sections
export {
  splitSections,
  serializeSections,
  upsertSection,
} from './utils/markdown-sections';

// Diff exports - types
export type {
  DiffStatus,
  TextDiffType,
  TextDiff,
  SlideDiff,
  DiffSummary,
  PresentationDiff,
} from './types/diff';

// Diff exports - utilities
export {
  diffPresentations,
  calculateDiffSummary,
  hasChanges,
  getTotalChangedSlides,
  formatDiffSummary,
  diffText,
  normalizedTextEquals,
  normalizeText,
  matchSlides,
  slidesAreEqual,
  normalizeSlideContent,
} from './diff';
export type { SlideMatch } from './diff';

// Skill exports - types
export type {
  SkillMetadata,
  ParsedSkill,
  PartialSkillMetadata,
  PartialParsedSkill,
  ValidationWarning,
} from './types/skill';
export {
  SkillParseError,
  SkillValidationError,
} from './types/skill';

// Skill exports - parser
export {
  parseSkillMarkdown,
  parseSkillMarkdownGraceful,
  serializeSkillMarkdown,
  extractSkillName,
  extractSkillDescription,
  isSkillMarkdown,
} from './utils/skill-parser';