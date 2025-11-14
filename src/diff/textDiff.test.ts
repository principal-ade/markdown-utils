import { describe, test, expect } from 'bun:test';
import { diffText, normalizedTextEquals, normalizeText } from './textDiff';

describe('diffText', () => {
  test('should detect simple text additions', () => {
    const before = 'line 1\nline 2';
    const after = 'line 1\nline 2\nline 3';

    const result = diffText(before, after);

    expect(result).toEqual([
      { type: 'unchanged', value: 'line 1', lineNumber: 1 },
      { type: 'unchanged', value: 'line 2', lineNumber: 2 },
      { type: 'add', value: 'line 3', lineNumber: 3 },
    ]);
  });

  test('should detect simple text deletions', () => {
    const before = 'line 1\nline 2\nline 3';
    const after = 'line 1\nline 3';

    const result = diffText(before, after);

    expect(result).toEqual([
      { type: 'unchanged', value: 'line 1', lineNumber: 1 },
      { type: 'remove', value: 'line 2', lineNumber: 2 },
      { type: 'unchanged', value: 'line 3', lineNumber: 3 },
    ]);
  });

  test('should detect mixed additions and deletions', () => {
    const before = 'line 1\nline 2\nline 3';
    const after = 'line 1\nline 2.5\nline 3';

    const result = diffText(before, after);

    expect(result).toEqual([
      { type: 'unchanged', value: 'line 1', lineNumber: 1 },
      { type: 'remove', value: 'line 2', lineNumber: 2 },
      { type: 'add', value: 'line 2.5', lineNumber: 3 },
      { type: 'unchanged', value: 'line 3', lineNumber: 4 },
    ]);
  });

  test('should handle no changes', () => {
    const text = 'line 1\nline 2\nline 3';

    const result = diffText(text, text);

    expect(result).toEqual([
      { type: 'unchanged', value: 'line 1', lineNumber: 1 },
      { type: 'unchanged', value: 'line 2', lineNumber: 2 },
      { type: 'unchanged', value: 'line 3', lineNumber: 3 },
    ]);
  });

  test('should handle empty strings', () => {
    const result = diffText('', '');
    expect(result).toEqual([]);
  });

  test('should handle adding to empty string', () => {
    const result = diffText('', 'new line');

    expect(result).toEqual([
      { type: 'add', value: 'new line', lineNumber: 1 },
    ]);
  });

  test('should handle removing all content', () => {
    const result = diffText('old line', '');

    expect(result).toEqual([
      { type: 'remove', value: 'old line', lineNumber: 1 },
    ]);
  });

  test('should handle multi-line changes', () => {
    const before = 'A\nB\nC\nD\nE';
    const after = 'A\nX\nC\nY\nE';

    const result = diffText(before, after);

    expect(result).toEqual([
      { type: 'unchanged', value: 'A', lineNumber: 1 },
      { type: 'remove', value: 'B', lineNumber: 2 },
      { type: 'add', value: 'X', lineNumber: 3 },
      { type: 'unchanged', value: 'C', lineNumber: 4 },
      { type: 'remove', value: 'D', lineNumber: 5 },
      { type: 'add', value: 'Y', lineNumber: 6 },
      { type: 'unchanged', value: 'E', lineNumber: 7 },
    ]);
  });
});

describe('normalizedTextEquals', () => {
  test('should return true for identical strings', () => {
    expect(normalizedTextEquals('hello', 'hello')).toBe(true);
  });

  test('should return true for strings with different line endings', () => {
    expect(normalizedTextEquals('line1\r\nline2', 'line1\nline2')).toBe(true);
  });

  test('should return true for strings with different trailing whitespace', () => {
    expect(normalizedTextEquals('line1  \nline2', 'line1\nline2')).toBe(true);
  });

  test('should return true for strings with different leading/trailing whitespace', () => {
    expect(normalizedTextEquals('  hello  ', 'hello')).toBe(true);
  });

  test('should return false for different content', () => {
    expect(normalizedTextEquals('hello', 'world')).toBe(false);
  });

  test('should handle empty strings', () => {
    expect(normalizedTextEquals('', '')).toBe(true);
    expect(normalizedTextEquals('  ', '')).toBe(true);
    expect(normalizedTextEquals('hello', '')).toBe(false);
  });
});

describe('normalizeText', () => {
  test('should normalize line endings', () => {
    expect(normalizeText('line1\r\nline2\r\nline3')).toBe('line1\nline2\nline3');
  });

  test('should remove trailing whitespace from lines', () => {
    expect(normalizeText('line1  \nline2   ')).toBe('line1\nline2');
  });

  test('should trim leading and trailing whitespace', () => {
    expect(normalizeText('  hello  ')).toBe('hello');
  });

  test('should handle empty string', () => {
    expect(normalizeText('')).toBe('');
  });

  test('should handle only whitespace', () => {
    expect(normalizeText('   \n  \n   ')).toBe('');
  });

  test('should preserve internal spacing', () => {
    expect(normalizeText('hello  world')).toBe('hello  world');
  });
});
