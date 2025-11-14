import { MarkdownSlide } from '../types/presentation';
import { normalizeText } from './textDiff';

/**
 * Represents a matched pair of slides from before and after presentations
 */
export interface SlideMatch {
  /** Slide from before presentation (undefined if added) */
  beforeSlide?: MarkdownSlide;
  /** Slide from after presentation (undefined if removed) */
  afterSlide?: MarkdownSlide;
  /** Index in before presentation (undefined if added) */
  beforeIndex?: number;
  /** Index in after presentation (undefined if removed) */
  afterIndex?: number;
  /** Whether the slide was matched by title or position */
  matchedBy: 'title' | 'position' | 'none';
}

/**
 * Matches slides between two presentations using a two-phase approach:
 * 1. First, match slides by title
 * 2. Then, match remaining slides by position
 *
 * @param beforeSlides - Slides from the before presentation
 * @param afterSlides - Slides from the after presentation
 * @returns Array of matched slide pairs
 */
export function matchSlides(
  beforeSlides: MarkdownSlide[],
  afterSlides: MarkdownSlide[]
): SlideMatch[] {
  const matches: SlideMatch[] = [];
  const matchedBeforeIndices = new Set<number>();
  const matchedAfterIndices = new Set<number>();

  // Phase 1: Match by title
  for (let beforeIndex = 0; beforeIndex < beforeSlides.length; beforeIndex++) {
    const beforeSlide = beforeSlides[beforeIndex];

    // Try to find a matching slide in after by title
    for (let afterIndex = 0; afterIndex < afterSlides.length; afterIndex++) {
      if (matchedAfterIndices.has(afterIndex)) {
        continue; // Already matched
      }

      const afterSlide = afterSlides[afterIndex];

      // Check if titles match (case-sensitive, but normalized)
      if (normalizeTitleForMatching(beforeSlide.title) === normalizeTitleForMatching(afterSlide.title)) {
        matches.push({
          beforeSlide,
          afterSlide,
          beforeIndex,
          afterIndex,
          matchedBy: 'title',
        });
        matchedBeforeIndices.add(beforeIndex);
        matchedAfterIndices.add(afterIndex);
        break;
      }
    }
  }

  // Phase 2: Match remaining slides by position
  const unmatchedBeforeIndices = beforeSlides
    .map((_, i) => i)
    .filter(i => !matchedBeforeIndices.has(i));
  const unmatchedAfterIndices = afterSlides
    .map((_, i) => i)
    .filter(i => !matchedAfterIndices.has(i));

  const minUnmatched = Math.min(unmatchedBeforeIndices.length, unmatchedAfterIndices.length);

  for (let i = 0; i < minUnmatched; i++) {
    const beforeIndex = unmatchedBeforeIndices[i];
    const afterIndex = unmatchedAfterIndices[i];

    matches.push({
      beforeSlide: beforeSlides[beforeIndex],
      afterSlide: afterSlides[afterIndex],
      beforeIndex,
      afterIndex,
      matchedBy: 'position',
    });
    matchedBeforeIndices.add(beforeIndex);
    matchedAfterIndices.add(afterIndex);
  }

  // Phase 3: Add unmatched slides as removed or added
  // Removed slides (in before but not matched)
  for (let beforeIndex = 0; beforeIndex < beforeSlides.length; beforeIndex++) {
    if (!matchedBeforeIndices.has(beforeIndex)) {
      matches.push({
        beforeSlide: beforeSlides[beforeIndex],
        beforeIndex,
        matchedBy: 'none',
      });
    }
  }

  // Added slides (in after but not matched)
  for (let afterIndex = 0; afterIndex < afterSlides.length; afterIndex++) {
    if (!matchedAfterIndices.has(afterIndex)) {
      matches.push({
        afterSlide: afterSlides[afterIndex],
        afterIndex,
        matchedBy: 'none',
      });
    }
  }

  // Sort matches by the index they appear in (prefer before index, then after index)
  matches.sort((a, b) => {
    const aIndex = a.beforeIndex ?? a.afterIndex ?? 0;
    const bIndex = b.beforeIndex ?? b.afterIndex ?? 0;
    return aIndex - bIndex;
  });

  return matches;
}

/**
 * Checks if two slides are equal (identical content).
 * Compares normalized content to avoid false positives from whitespace differences.
 *
 * @param slide1 - First slide to compare
 * @param slide2 - Second slide to compare
 * @returns true if slides have identical content
 */
export function slidesAreEqual(
  slide1: MarkdownSlide,
  slide2: MarkdownSlide
): boolean {
  // Compare normalized content
  return normalizeSlideContent(slide1) === normalizeSlideContent(slide2);
}

/**
 * Normalizes slide content for comparison.
 * Extracts and normalizes the text content from the slide's location.
 *
 * @param slide - Slide to normalize
 * @returns Normalized content string
 */
export function normalizeSlideContent(slide: MarkdownSlide): string {
  return normalizeText(slide.location.content);
}

/**
 * Normalizes a title for matching purposes.
 * Removes extra whitespace and converts to lowercase for fuzzy matching.
 *
 * @param title - Title to normalize
 * @returns Normalized title
 */
function normalizeTitleForMatching(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .toLowerCase(); // Case-insensitive matching
}
