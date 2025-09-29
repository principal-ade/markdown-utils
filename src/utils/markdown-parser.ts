import { BaseChunk, ContentChunk, CHUNK_TYPES } from '../types/chunks';

// Simple hash function for markdown strings
function hashMarkdownString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Parses markdown content into chunks (markdown and mermaid)
 * Can be extended with custom parsers for plugin support
 */
export function parseMarkdownChunks<T extends BaseChunk = ContentChunk>(
  markdownContent: string,
  idPrefix: string,
  customParsers?: Array<(content: string, idPrefix: string) => T[]>
): T[] {
  try {
    if (typeof markdownContent !== 'string') {
      throw new Error('Invalid markdown content provided');
    }

    // Handle empty content gracefully
    if (!markdownContent || markdownContent.trim() === '') {
      return [];
    }

    const chunks: T[] = [];
    const mermaidRegex = /^```mermaid\n([\s\S]*?)\n^```$/gm;
    let lastIndex = 0;
    let match;
    let partCounter = 0;

    while ((match = mermaidRegex.exec(markdownContent)) !== null) {
      partCounter++;
      if (match.index > lastIndex) {
        const mdContent = markdownContent.substring(lastIndex, match.index);
        if (mdContent.trim()) {
          chunks.push({
            type: CHUNK_TYPES.MARKDOWN,
            content: mdContent,
            id: `${idPrefix}-md-${partCounter}-${hashMarkdownString(mdContent)}`,
          } as T);
        }
      }
      partCounter++;
      const mermaidContent = match[1].trim();
      chunks.push({
        type: CHUNK_TYPES.MERMAID,
        content: mermaidContent,
        id: `${idPrefix}-mermaid-${partCounter}-${hashMarkdownString(mermaidContent)}`,
      } as T);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < markdownContent.length) {
      partCounter++;
      const remainingMdContent = markdownContent.substring(lastIndex);
      if (remainingMdContent.trim()) {
        chunks.push({
          type: CHUNK_TYPES.MARKDOWN,
          content: remainingMdContent,
          id: `${idPrefix}-md-${partCounter}-${hashMarkdownString(remainingMdContent)}`,
        } as T);
      }
    }

    if (chunks.length === 0 && markdownContent.trim()) {
      chunks.push({
        type: CHUNK_TYPES.MARKDOWN,
        content: markdownContent,
        id: `${idPrefix}-md-only-${hashMarkdownString(markdownContent)}`,
      } as T);
    }

    // Apply custom parsers if provided
    if (customParsers && customParsers.length > 0) {
      let processedChunks = chunks;
      for (const parser of customParsers) {
        const newChunks: T[] = [];
        for (const chunk of processedChunks) {
          if (chunk.type === CHUNK_TYPES.MARKDOWN) {
            const parsed = parser(chunk.content, chunk.id);
            if (parsed.length > 0) {
              newChunks.push(...parsed);
            } else {
              newChunks.push(chunk);
            }
          } else {
            newChunks.push(chunk);
          }
        }
        processedChunks = newChunks;
      }
      return processedChunks;
    }

    return chunks;
  } catch (error) {
    console.error('Error in parseMarkdownChunks:', error);
    // Return a single markdown chunk with the original content to allow fallback rendering
    return markdownContent
      ? [
          {
            type: CHUNK_TYPES.MARKDOWN,
            content: markdownContent,
            id: `${idPrefix}-md-error-fallback-${hashMarkdownString(markdownContent)}`,
          } as T,
        ]
      : [];
  }
}