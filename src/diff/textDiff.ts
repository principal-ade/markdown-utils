import { TextDiff } from '../types/diff';

/**
 * Performs a line-by-line diff between two text strings.
 * Uses a simple longest common subsequence (LCS) based algorithm.
 *
 * @param beforeContent - The original text
 * @param afterContent - The modified text
 * @returns Array of TextDiff objects representing the changes
 */
export function diffText(
  beforeContent: string,
  afterContent: string
): TextDiff[] {
  // Handle empty strings
  if (beforeContent === '' && afterContent === '') {
    return [];
  }

  // Split into lines, handling empty strings properly
  const beforeLines = beforeContent === '' ? [] : beforeContent.split('\n');
  const afterLines = afterContent === '' ? [] : afterContent.split('\n');

  // Use LCS algorithm to find common lines
  const lcs = longestCommonSubsequence(beforeLines, afterLines);

  // Build the diff from the LCS
  return buildDiffFromLCS(beforeLines, afterLines, lcs);
}

/**
 * Computes the longest common subsequence between two arrays of lines.
 * Returns a 2D array where lcs[i][j] represents the length of LCS
 * for beforeLines[0..i-1] and afterLines[0..j-1].
 */
function longestCommonSubsequence(
  beforeLines: string[],
  afterLines: string[]
): number[][] {
  const m = beforeLines.length;
  const n = afterLines.length;

  // Initialize LCS matrix with zeros
  const lcs: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // Build LCS matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (beforeLines[i - 1] === afterLines[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  return lcs;
}

/**
 * Builds the diff result by backtracking through the LCS matrix
 */
function buildDiffFromLCS(
  beforeLines: string[],
  afterLines: string[],
  lcs: number[][]
): TextDiff[] {
  const result: TextDiff[] = [];
  let i = beforeLines.length;
  let j = afterLines.length;

  // Backtrack through LCS matrix to build diff
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && beforeLines[i - 1] === afterLines[j - 1]) {
      // Lines are the same - unchanged
      result.unshift({
        type: 'unchanged',
        value: beforeLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      // Line was added in after
      result.unshift({
        type: 'add',
        value: afterLines[j - 1],
      });
      j--;
    } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
      // Line was removed from before
      result.unshift({
        type: 'remove',
        value: beforeLines[i - 1],
      });
      i--;
    }
  }

  // Add line numbers sequentially after building the diff
  return result.map((diff, index) => ({
    ...diff,
    lineNumber: index + 1,
  }));
}

/**
 * Checks if two text strings are equal after normalization.
 * Normalization includes trimming whitespace and normalizing line endings.
 *
 * @param text1 - First text to compare
 * @param text2 - Second text to compare
 * @returns true if texts are equal after normalization
 */
export function normalizedTextEquals(text1: string, text2: string): boolean {
  return normalizeText(text1) === normalizeText(text2);
}

/**
 * Normalizes text by:
 * - Trimming leading/trailing whitespace
 * - Normalizing line endings to \n
 * - Removing trailing whitespace from each line
 *
 * @param text - Text to normalize
 * @returns Normalized text
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .split('\n')
    .map(line => line.trimEnd())  // Remove trailing whitespace from each line
    .join('\n')
    .trim();  // Remove leading/trailing whitespace
}
