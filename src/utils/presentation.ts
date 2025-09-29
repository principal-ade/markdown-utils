import { BaseChunk } from '../types/chunks';
import {
  MarkdownPresentation,
  MarkdownSlide,
  MarkdownSource,
  RepositoryInfo,
} from '../types/presentation';

import { parseMarkdownChunks } from './markdown-parser';

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
 * Extract the title from slide content (first heading or first line)
 */
export function extractSlideTitle(content: string): string {
  const lines = content.split('\n').filter(line => line.trim());

  // Look for the first heading
  for (const line of lines) {
    const headingMatch = line.match(/^#+\s+(.+)$/);
    if (headingMatch) {
      return headingMatch[1].trim();
    }
  }

  // If no heading, use first non-empty line (truncated)
  if (lines.length > 0) {
    const firstLine = lines[0];
    return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
  }

  return 'Untitled Slide';
}

/**
 * Parse markdown into presentation from source
 */
export function parseMarkdownIntoPresentationFromSource<T extends BaseChunk = BaseChunk>(
  source: MarkdownSource,
  customParsers?: Array<(content: string, idPrefix: string) => T[]>
): MarkdownPresentation<T> {
  // Always use header format
  const presentation = parseMarkdownIntoPresentation(
    source.content,
    source.repositoryInfo,
    customParsers
  );
  presentation.source = source;
  return presentation;
}

/**
 * Parse markdown content into presentation format
 */
export function parseMarkdownIntoPresentation<T extends BaseChunk = BaseChunk>(
  markdownContent: string,
  repositoryInfo?: RepositoryInfo,
  customParsers?: Array<(content: string, idPrefix: string) => T[]>
): MarkdownPresentation<T> {

  // Check if content has multiple headers
  const hasMultipleHeaders = detectMultipleHeaders(markdownContent);
  
  // If no multiple headers, return entire content as single slide
  if (!hasMultipleHeaders) {
    const id = `slide-0-${hashMarkdownString(markdownContent)}`;
    const chunks = parseMarkdownChunks<T>(markdownContent, id, customParsers);
    return {
      slides: [
        {
          id,
          title: extractSlideTitle(markdownContent),
          location: {
            startLine: 0,
            endLine: markdownContent.split('\n').length - 1,
            content: markdownContent,
          },
          chunks,
        },
      ],
      originalContent: markdownContent,
      repositoryInfo,
    };
  }

  const lines = markdownContent.split('\n');
  const slides: MarkdownSlide<T>[] = [];
  let currentSlideLines: string[] = [];
  let currentSlideStartLine = 0;
  let inCodeBlock = false;
  let codeBlockDelimiter = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for code block boundaries
    if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockDelimiter = line.trim().substring(0, 3);
      } else if (line.trim().startsWith(codeBlockDelimiter)) {
        inCodeBlock = false;
        codeBlockDelimiter = '';
      }
    }
    
    // Only check for headers if we're not inside a code block
    // Headers are # or ## but not ###
    const isDelimiter = !inCodeBlock && line.trim().startsWith('#') && !line.trim().startsWith('###');

    if (isDelimiter && currentSlideLines.length > 0) {
      // Save current slide
      const slideContent = currentSlideLines.join('\n');
      const slideId = `slide-${slides.length}-${hashMarkdownString(slideContent)}`;
      const chunks = parseMarkdownChunks<T>(slideContent, slideId, customParsers);
      slides.push({
        id: slideId,
        title: extractSlideTitle(slideContent),
        location: {
          startLine: currentSlideStartLine,
          endLine: i - 1,
          content: slideContent,
        },
        chunks,
      });

      // Start new slide with the header line
      currentSlideLines = [line];
      currentSlideStartLine = i;
    } else {
      currentSlideLines.push(line);
    }
  }

  // Add the last slide if there's content
  if (currentSlideLines.length > 0) {
    const slideContent = currentSlideLines.join('\n');
    const slideId = `slide-${slides.length}-${hashMarkdownString(slideContent)}`;
    const chunks = parseMarkdownChunks<T>(slideContent, slideId, customParsers);
    slides.push({
      id: slideId,
      title: extractSlideTitle(slideContent),
      location: {
        startLine: currentSlideStartLine,
        endLine: lines.length - 1,
        content: slideContent,
      },
      chunks,
    });
  }

  return {
    slides,
    originalContent: markdownContent,
    repositoryInfo,
  };
}

/**
 * Detect if content has multiple headers
 */
function detectMultipleHeaders(markdownContent: string): boolean {
  const lines = markdownContent.split('\n');
  let h1Count = 0;
  let h2Count = 0;
  let inCodeBlock = false;
  let codeBlockDelimiter = '';

  for (const line of lines) {
    // Track code block boundaries
    if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockDelimiter = line.trim().substring(0, 3);
      } else if (line.trim().startsWith(codeBlockDelimiter)) {
        inCodeBlock = false;
        codeBlockDelimiter = '';
      }
    }
    
    // Only count headers outside of code blocks
    if (!inCodeBlock) {
      if (line.trim().startsWith('#') && !line.trim().startsWith('###')) {
        if (!line.trim().startsWith('##')) {
          h1Count++;
        } else {
          h2Count++;
        }
      }
    }
  }

  // If there are multiple headers (H1 or H2), return true
  const totalHeaders = h1Count + h2Count;
  return totalHeaders > 1;
}

/**
 * Serialize presentation back to markdown
 */
export function serializePresentationToMarkdown<T extends BaseChunk = BaseChunk>(
  presentation: MarkdownPresentation<T>
): string {
  return presentation.slides
    .map(slide => slide.location.content)
    .join('\n');
}

/**
 * Update a slide in the presentation
 */
export function updatePresentationSlide<T extends BaseChunk = BaseChunk>(
  presentation: MarkdownPresentation<T>,
  slideIndex: number,
  newContent: string,
  customParsers?: Array<(content: string, idPrefix: string) => T[]>
): MarkdownPresentation<T> {
  if (slideIndex < 0 || slideIndex >= presentation.slides.length) {
    throw new Error('Invalid slide index');
  }

  const updatedSlides = [...presentation.slides];
  const slide = updatedSlides[slideIndex];
  const newChunks = parseMarkdownChunks<T>(newContent, slide.id, customParsers);

  updatedSlides[slideIndex] = {
    ...slide,
    location: {
      ...slide.location,
      content: newContent,
    },
    chunks: newChunks,
    title: extractSlideTitle(newContent),
  };

  return {
    ...presentation,
    slides: updatedSlides,
    originalContent: serializePresentationToMarkdown({ ...presentation, slides: updatedSlides }),
  };
}