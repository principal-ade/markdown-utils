import { MarkdownPresentation, MarkdownSlide } from './presentation';

/**
 * Status of a slide when comparing two presentations
 */
export type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged' | 'moved';

/**
 * Type of text change within a slide
 */
export type TextDiffType = 'add' | 'remove' | 'unchanged';

/**
 * Represents a text-level change within slide content
 */
export interface TextDiff {
  /** Type of change */
  type: TextDiffType;
  /** The text content */
  value: string;
  /** Optional line number for the change */
  lineNumber?: number;
}

/**
 * Represents the diff between two versions of a slide
 */
export interface SlideDiff {
  /** Status of this slide comparison */
  status: DiffStatus;
  /** The slide from the before version (undefined if added) */
  beforeSlide?: MarkdownSlide;
  /** The slide from the after version (undefined if removed) */
  afterSlide?: MarkdownSlide;
  /** Index in the before presentation (undefined if added) */
  beforeIndex?: number;
  /** Index in the after presentation (undefined if removed) */
  afterIndex?: number;
  /** Line-by-line content changes (populated for modified slides) */
  contentChanges?: TextDiff[];
  /** Whether the slide title changed */
  titleChanged?: boolean;
}

/**
 * Summary statistics for a presentation diff
 */
export interface DiffSummary {
  /** Total number of slides in before presentation */
  totalSlidesBefore: number;
  /** Total number of slides in after presentation */
  totalSlidesAfter: number;
  /** Number of added slides */
  added: number;
  /** Number of removed slides */
  removed: number;
  /** Number of modified slides */
  modified: number;
  /** Number of unchanged slides */
  unchanged: number;
  /** Number of moved slides (reordered but not modified) */
  moved: number;
}

/**
 * Complete diff analysis between two presentations
 */
export interface PresentationDiff {
  /** The before version of the presentation */
  before: MarkdownPresentation;
  /** The after version of the presentation */
  after: MarkdownPresentation;
  /** Array of slide-by-slide diffs */
  slideDiffs: SlideDiff[];
  /** Summary statistics */
  summary: DiffSummary;
}
