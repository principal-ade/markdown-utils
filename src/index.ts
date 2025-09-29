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

// Utility exports - presentation
export {
  extractSlideTitle,
  parseMarkdownIntoPresentationFromSource,
  parseMarkdownIntoPresentation,
  serializePresentationToMarkdown,
  updatePresentationSlide,
} from './utils/presentation';

// Utility exports - bash parser
export {
  parseBashCommands,
  getCommandDisplayName,
} from './utils/bash-parser';

// Utility exports - image urls
export {
  isRelativeUrl,
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