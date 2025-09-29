// Chunk type constants
export const CHUNK_TYPES = {
  MARKDOWN: 'markdown_chunk',
  MERMAID: 'mermaid_chunk',
  SLIDE: 'slide_chunk',
  CODE: 'code_chunk',
} as const;

export type ChunkType = typeof CHUNK_TYPES[keyof typeof CHUNK_TYPES];

// Base interface for all chunk types - extensible for plugins
export interface BaseChunk<T extends string = string> {
  type: T;
  content: string;
  id: string;
}

// Core chunk types
export type MarkdownChunk = BaseChunk<typeof CHUNK_TYPES.MARKDOWN>;

export type MermaidChunk = BaseChunk<typeof CHUNK_TYPES.MERMAID>;

export type SlideChunk = BaseChunk<typeof CHUNK_TYPES.SLIDE>;

export interface CodeChunk extends BaseChunk<typeof CHUNK_TYPES.CODE> {
  language?: string;
}

// Core content chunk union
export type ContentChunk = MarkdownChunk | MermaidChunk | CodeChunk;

// Type guard helpers
export const isMarkdownChunk = (chunk: BaseChunk): chunk is MarkdownChunk => 
  chunk.type === CHUNK_TYPES.MARKDOWN;

export const isMermaidChunk = (chunk: BaseChunk): chunk is MermaidChunk =>
  chunk.type === CHUNK_TYPES.MERMAID;

export const isCodeChunk = (chunk: BaseChunk): chunk is CodeChunk =>
  chunk.type === CHUNK_TYPES.CODE;