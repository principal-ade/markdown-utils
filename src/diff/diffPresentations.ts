import { MarkdownPresentation } from '../types/presentation';
import { PresentationDiff, SlideDiff, DiffStatus } from '../types/diff';
import { matchSlides, slidesAreEqual, SlideMatch } from './matchSlides';
import { diffText } from './textDiff';
import { calculateDiffSummary } from './diffSummary';

/**
 * Compares two markdown presentations and generates a complete diff analysis.
 *
 * The algorithm:
 * 1. Matches slides between presentations (by title, then position)
 * 2. Determines the status of each slide (added, removed, modified, unchanged, moved)
 * 3. For modified slides, computes line-by-line content changes
 * 4. Generates summary statistics
 *
 * @param before - The original presentation
 * @param after - The modified presentation
 * @returns Complete diff analysis including slide-by-slide comparison and summary
 */
export function diffPresentations(
  before: MarkdownPresentation,
  after: MarkdownPresentation
): PresentationDiff {
  // Match slides between the two presentations
  const matches = matchSlides(before.slides, after.slides);

  // Convert matches to SlideDiffs with status determination
  const slideDiffs: SlideDiff[] = matches.map(match =>
    createSlideDiff(match)
  );

  // Create the presentation diff
  const presentationDiff: PresentationDiff = {
    before,
    after,
    slideDiffs,
    summary: {
      totalSlidesBefore: 0,
      totalSlidesAfter: 0,
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0,
      moved: 0
    },
  };

  // Calculate summary statistics
  presentationDiff.summary = calculateDiffSummary(presentationDiff);

  return presentationDiff;
}

/**
 * Creates a SlideDiff from a SlideMatch by determining the diff status
 * and computing content changes if needed.
 */
function createSlideDiff(match: SlideMatch): SlideDiff {
  const { beforeSlide, afterSlide, beforeIndex, afterIndex, matchedBy } = match;

  // Determine the status based on what exists
  let status: DiffStatus;
  let contentChanges: SlideDiff['contentChanges'];
  let titleChanged = false;

  if (!beforeSlide && afterSlide) {
    // Slide was added
    status = 'added';
  } else if (beforeSlide && !afterSlide) {
    // Slide was removed
    status = 'removed';
  } else if (beforeSlide && afterSlide) {
    // Both exist - check if content is the same
    const contentEqual = slidesAreEqual(beforeSlide, afterSlide);
    const positionChanged = beforeIndex !== afterIndex;
    titleChanged = beforeSlide.title !== afterSlide.title;

    if (contentEqual) {
      // Content is the same
      if (positionChanged) {
        status = 'moved';
      } else {
        status = 'unchanged';
      }
    } else {
      // Content changed
      status = 'modified';

      // Compute line-by-line diff for modified slides
      contentChanges = diffText(
        beforeSlide.location.content,
        afterSlide.location.content
      );
    }
  } else {
    // This shouldn't happen, but handle it gracefully
    status = 'unchanged';
  }

  return {
    status,
    beforeSlide,
    afterSlide,
    beforeIndex,
    afterIndex,
    contentChanges,
    titleChanged,
  };
}
