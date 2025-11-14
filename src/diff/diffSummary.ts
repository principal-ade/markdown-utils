import { PresentationDiff, DiffSummary } from '../types/diff';

/**
 * Calculates summary statistics for a presentation diff.
 * Counts the number of slides in each status category.
 *
 * @param diff - The presentation diff to summarize
 * @returns Summary statistics with counts for each diff status
 */
export function calculateDiffSummary(diff: PresentationDiff): DiffSummary {
  const summary: DiffSummary = {
    totalSlidesBefore: diff.before.slides.length,
    totalSlidesAfter: diff.after.slides.length,
    added: 0,
    removed: 0,
    modified: 0,
    unchanged: 0,
    moved: 0,
  };

  // Count each status
  for (const slideDiff of diff.slideDiffs) {
    switch (slideDiff.status) {
      case 'added':
        summary.added++;
        break;
      case 'removed':
        summary.removed++;
        break;
      case 'modified':
        summary.modified++;
        break;
      case 'unchanged':
        summary.unchanged++;
        break;
      case 'moved':
        summary.moved++;
        break;
    }
  }

  return summary;
}

/**
 * Checks if a presentation diff has any changes.
 *
 * @param diff - The presentation diff to check
 * @returns true if there are any changes (added, removed, modified, or moved slides)
 */
export function hasChanges(diff: PresentationDiff): boolean {
  const { summary } = diff;
  return (
    summary.added > 0 ||
    summary.removed > 0 ||
    summary.modified > 0 ||
    summary.moved > 0
  );
}

/**
 * Gets the total number of changed slides (excluding unchanged).
 *
 * @param summary - The diff summary
 * @returns Total number of changed slides
 */
export function getTotalChangedSlides(summary: DiffSummary): number {
  return summary.added + summary.removed + summary.modified + summary.moved;
}

/**
 * Formats a diff summary as a human-readable string.
 *
 * @param summary - The diff summary to format
 * @returns Formatted string describing the changes
 */
export function formatDiffSummary(summary: DiffSummary): string {
  const parts: string[] = [];

  if (summary.added > 0) {
    parts.push(`${summary.added} added`);
  }
  if (summary.removed > 0) {
    parts.push(`${summary.removed} removed`);
  }
  if (summary.modified > 0) {
    parts.push(`${summary.modified} modified`);
  }
  if (summary.moved > 0) {
    parts.push(`${summary.moved} moved`);
  }

  if (parts.length === 0) {
    return 'No changes';
  }

  return parts.join(', ');
}
