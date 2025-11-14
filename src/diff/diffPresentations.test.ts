import { describe, test, expect } from 'bun:test';
import { diffPresentations } from './diffPresentations';
import { parseMarkdownIntoPresentation } from '../utils/presentation';

describe('diffPresentations', () => {
  test('should detect added slides', () => {
    const before = parseMarkdownIntoPresentation('# Slide 1\n\nContent 1');
    const after = parseMarkdownIntoPresentation(
      '# Slide 1\n\nContent 1\n\n# Slide 2\n\nContent 2'
    );

    const diff = diffPresentations(before, after);

    expect(diff.slideDiffs).toHaveLength(2);
    expect(diff.slideDiffs[0].status).toBe('unchanged');
    expect(diff.slideDiffs[1].status).toBe('added');
    expect(diff.summary.added).toBe(1);
    expect(diff.summary.unchanged).toBe(1);
  });

  test('should detect removed slides', () => {
    const before = parseMarkdownIntoPresentation(
      '# Slide 1\n\nContent 1\n\n# Slide 2\n\nContent 2'
    );
    const after = parseMarkdownIntoPresentation('# Slide 1\n\nContent 1');

    const diff = diffPresentations(before, after);

    expect(diff.slideDiffs).toHaveLength(2);
    expect(diff.slideDiffs[0].status).toBe('unchanged');
    expect(diff.slideDiffs[1].status).toBe('removed');
    expect(diff.summary.removed).toBe(1);
    expect(diff.summary.unchanged).toBe(1);
  });

  test('should detect modified slides', () => {
    const before = parseMarkdownIntoPresentation('# Slide 1\n\nOriginal content');
    const after = parseMarkdownIntoPresentation('# Slide 1\n\nModified content');

    const diff = diffPresentations(before, after);

    expect(diff.slideDiffs).toHaveLength(1);
    expect(diff.slideDiffs[0].status).toBe('modified');
    expect(diff.slideDiffs[0].contentChanges).toBeDefined();
    expect(diff.summary.modified).toBe(1);
  });

  test('should detect unchanged slides', () => {
    const content = '# Slide 1\n\nSame content\n\n# Slide 2\n\nAlso same';
    const before = parseMarkdownIntoPresentation(content);
    const after = parseMarkdownIntoPresentation(content);

    const diff = diffPresentations(before, after);

    expect(diff.slideDiffs).toHaveLength(2);
    expect(diff.slideDiffs[0].status).toBe('unchanged');
    expect(diff.slideDiffs[1].status).toBe('unchanged');
    expect(diff.summary.unchanged).toBe(2);
    expect(diff.summary.added).toBe(0);
    expect(diff.summary.removed).toBe(0);
    expect(diff.summary.modified).toBe(0);
  });

  test('should detect moved slides', () => {
    const before = parseMarkdownIntoPresentation(
      '# Slide A\n\nContent A\n\n# Slide B\n\nContent B'
    );
    const after = parseMarkdownIntoPresentation(
      '# Slide B\n\nContent B\n\n# Slide A\n\nContent A'
    );

    const diff = diffPresentations(before, after);

    expect(diff.slideDiffs).toHaveLength(2);
    // Both slides moved
    expect(diff.slideDiffs.filter(d => d.status === 'moved').length).toBe(2);
    expect(diff.summary.moved).toBe(2);
  });

  test('should handle empty presentations', () => {
    const before = parseMarkdownIntoPresentation('');
    const after = parseMarkdownIntoPresentation('');

    const diff = diffPresentations(before, after);

    // Empty markdown still creates one slide
    expect(diff.slideDiffs).toHaveLength(1);
    expect(diff.slideDiffs[0].status).toBe('unchanged');
    expect(diff.summary.totalSlidesBefore).toBe(1);
    expect(diff.summary.totalSlidesAfter).toBe(1);
  });

  test('should handle complex mixed changes', () => {
    const before = parseMarkdownIntoPresentation(`# Slide 1
Content 1

# Slide 2
Content 2

# Slide 3
Content 3`);

    const after = parseMarkdownIntoPresentation(`# Slide 1
Content 1 Modified

# Slide 3
Content 3

# Slide 4
Content 4`);

    const diff = diffPresentations(before, after);

    // Slide 1: modified (content changed)
    // Slide 2 → Slide 4: modified (different title/content by position)
    // Slide 3: moved (matched by title, different position)
    expect(diff.slideDiffs).toHaveLength(3);

    expect(diff.slideDiffs[0].status).toBe('modified'); // Slide 1 content changed
    expect(diff.slideDiffs[1].status).toBe('modified'); // Slide 2 -> Slide 4 by position
    expect(diff.slideDiffs[2].status).toBe('moved'); // Slide 3 moved position

    expect(diff.summary.modified).toBe(2);
    expect(diff.summary.moved).toBe(1);
  });

  test('should detect title changes', () => {
    const before = parseMarkdownIntoPresentation('# Original Title\n\nContent');
    const after = parseMarkdownIntoPresentation('# New Title\n\nContent');

    const diff = diffPresentations(before, after);

    // Title change is detected as modified (matched by position)
    expect(diff.slideDiffs).toHaveLength(1);
    expect(diff.slideDiffs[0].status).toBe('modified');
    expect(diff.slideDiffs[0].titleChanged).toBe(true);
    expect(diff.summary.modified).toBe(1);
  });

  test('should handle slides with duplicate titles', () => {
    const before = parseMarkdownIntoPresentation(
      '# Same Title\n\nContent 1\n\n# Same Title\n\nContent 2'
    );
    const after = parseMarkdownIntoPresentation(
      '# Same Title\n\nContent 1 Modified\n\n# Same Title\n\nContent 2'
    );

    const diff = diffPresentations(before, after);

    expect(diff.slideDiffs).toHaveLength(2);
    // First slide should be modified, second should be unchanged
    expect(diff.slideDiffs[0].status).toBe('modified');
    expect(diff.slideDiffs[1].status).toBe('unchanged');
  });

  test('should provide accurate slide indices', () => {
    const before = parseMarkdownIntoPresentation(
      '# Slide 1\n\nContent 1\n\n# Slide 2\n\nContent 2'
    );
    const after = parseMarkdownIntoPresentation(
      '# Slide 1\n\nContent 1\n\n# Slide 3\n\nContent 3'
    );

    const diff = diffPresentations(before, after);

    expect(diff.slideDiffs).toHaveLength(2);

    // Check that indices are set correctly
    const unchanged = diff.slideDiffs.find(
      d => d.status === 'unchanged'
    );
    expect(unchanged?.beforeIndex).toBe(0);
    expect(unchanged?.afterIndex).toBe(0);

    // Slide 2 -> Slide 3 is matched by position and marked as modified
    const modified = diff.slideDiffs.find(
      d => d.status === 'modified'
    );
    expect(modified?.beforeIndex).toBe(1);
    expect(modified?.afterIndex).toBe(1);
  });

  test('should include content changes for modified slides', () => {
    const before = parseMarkdownIntoPresentation('# Slide\n\nLine 1\nLine 2');
    const after = parseMarkdownIntoPresentation('# Slide\n\nLine 1\nLine 3');

    const diff = diffPresentations(before, after);

    expect(diff.slideDiffs).toHaveLength(1);
    expect(diff.slideDiffs[0].status).toBe('modified');
    expect(diff.slideDiffs[0].contentChanges).toBeDefined();

    const changes = diff.slideDiffs[0].contentChanges!;
    expect(changes.some(c => c.type === 'remove' && c.value.includes('Line 2'))).toBe(true);
    expect(changes.some(c => c.type === 'add' && c.value.includes('Line 3'))).toBe(true);
  });
});
