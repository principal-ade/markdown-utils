/**
 * Diff utilities for comparing markdown presentations
 * @module diff
 */

// Main diff function
export { diffPresentations } from './diffPresentations';

// Summary utilities
export {
  calculateDiffSummary,
  hasChanges,
  getTotalChangedSlides,
  formatDiffSummary,
} from './diffSummary';

// Text diff utilities
export { diffText, normalizedTextEquals, normalizeText } from './textDiff';

// Slide matching utilities
export {
  matchSlides,
  slidesAreEqual,
  normalizeSlideContent,
} from './matchSlides';
export type { SlideMatch } from './matchSlides';

// Re-export types for convenience
export type {
  DiffStatus,
  TextDiffType,
  TextDiff,
  SlideDiff,
  DiffSummary,
  PresentationDiff,
} from '../types/diff';
