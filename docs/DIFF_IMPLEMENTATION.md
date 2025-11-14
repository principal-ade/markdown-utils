# Diff Implementation for @a24z/markdown-utils

## Overview

This document captures the implementation plan for adding presentation diff capabilities to the `@a24z/markdown-utils` library. This is Phase 1 of a two-phase project where:

- **Phase 1** (this library): Core diffing logic - pure TypeScript, framework-agnostic
- **Phase 2** (industry-themed-markdown): React UI components using the diff utilities

## Goals

Add slide-level diffing capabilities to compare two markdown presentations, enabling:

1. Detection of slide changes (added, removed, modified, unchanged, moved)
2. Text-level content comparison within modified slides
3. Summary statistics of presentation changes
4. Framework-agnostic API for use in various contexts (React, CLI, VS Code extensions, etc.)

## Architecture

### Type Definitions

New types to be added in `src/types/diff.ts`:

```typescript
export type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged' | 'moved';

export interface SlideDiff {
  status: DiffStatus;
  beforeSlide?: MarkdownSlide;
  afterSlide?: MarkdownSlide;
  beforeIndex?: number;
  afterIndex?: number;
  contentChanges?: TextDiff[];
  titleChanged?: boolean;
}

export interface PresentationDiff {
  before: MarkdownPresentation;
  after: MarkdownPresentation;
  slideDiffs: SlideDiff[];
  summary: DiffSummary;
}

export interface TextDiff {
  type: 'add' | 'remove' | 'unchanged';
  value: string;
  lineNumber?: number;
}

export interface DiffSummary {
  totalSlidesBefore: number;
  totalSlidesAfter: number;
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  moved: number;
}
```

### Module Structure

New diff module to be added:

```
src/
├── diff/
│   ├── index.ts                     # Public exports
│   ├── diffPresentations.ts         # Main diff algorithm
│   ├── matchSlides.ts               # Slide matching logic
│   ├── textDiff.ts                  # Text-level diffing
│   └── diffSummary.ts               # Summary calculations
└── types/
    └── diff.ts                      # Diff type definitions
```

## Public API

### Primary Functions

#### `diffPresentations()`

Main entry point for comparing two presentations:

```typescript
export function diffPresentations(
  before: MarkdownPresentation,
  after: MarkdownPresentation
): PresentationDiff
```

**Returns**: Complete diff analysis including slide-by-slide comparison and summary statistics.

#### `calculateDiffSummary()`

Generate summary statistics from a presentation diff:

```typescript
export function calculateDiffSummary(diff: PresentationDiff): DiffSummary
```

**Returns**: Counts of added, removed, modified, unchanged, and moved slides.

#### `diffText()`

Low-level text comparison utility:

```typescript
export function diffText(
  beforeContent: string,
  afterContent: string
): TextDiff[]
```

**Returns**: Array of text changes with line-level granularity.

## Slide Matching Algorithm

The core challenge is matching slides between two presentation versions:

### Matching Strategy

1. **Primary**: Match by title using `extractSlideTitle()` utility
2. **Secondary**: Match by position if titles don't align
3. **Detection**: Identify reordering by tracking index changes
4. **Edge cases**: Handle duplicate titles and untitled slides

### Status Detection Logic

- **Added**: Slide exists in `after` but not in `before`
- **Removed**: Slide exists in `before` but not in `after`
- **Modified**: Slide exists in both with different content
- **Unchanged**: Slide exists in both with identical content
- **Moved**: Slide exists in both but at different indices

## Implementation Details

### Text Diffing

For content-level comparison, we'll use one of:

- **Option 1**: `diff` library (https://www.npmjs.com/package/diff)
- **Option 2**: `fast-diff` for better performance
- **Option 3**: Simple custom implementation for minimal dependencies

Decision: TBD based on bundle size and performance requirements.

### Slide Equality

Slides are considered equal when:
- Normalized content is identical (after trimming whitespace)
- Markdown chunks produce the same output when parsed

Helper function:

```typescript
function slidesAreEqual(
  slide1: MarkdownSlide,
  slide2: MarkdownSlide
): boolean
```

### Content Normalization

To avoid false positives from whitespace differences:

```typescript
function normalizeSlideContent(slide: MarkdownSlide): string
```

## Testing Strategy

### Unit Tests

Test files to create:

1. **`diffPresentations.test.ts`**
   - Basic diff: simple before/after with modifications
   - Edge cases: empty presentations, single slide
   - Slide matching with duplicate titles
   - Slide matching with missing titles
   - Reordering detection
   - All slides unchanged
   - All slides changed

2. **`matchSlides.test.ts`**
   - Match by title (exact match)
   - Match by position when titles don't align
   - Handle duplicate titles
   - Handle untitled slides
   - Empty slide arrays

3. **`textDiff.test.ts`**
   - Simple text additions
   - Simple text deletions
   - Mixed additions and deletions
   - No changes
   - Multi-line changes

4. **`diffSummary.test.ts`**
   - Accurate counts for all diff statuses
   - Summary with no changes
   - Summary with all changes

### Test Coverage Goals

- Minimum 90% code coverage
- All edge cases documented and tested
- Performance benchmarks for large presentations (100+ slides)

## Dependencies

### Required

- None (uses existing `MarkdownPresentation` types)

### Optional

- `diff` or `fast-diff` for text comparison (TBD)

## Implementation Checklist

- [x] Create type definitions in `src/types/diff.ts`
- [x] Implement text diffing in `src/diff/textDiff.ts`
- [x] Implement slide matching in `src/diff/matchSlides.ts`
- [x] Implement main diff algorithm in `src/diff/diffPresentations.ts`
- [x] Implement summary calculations in `src/diff/diffSummary.ts`
- [x] Create public exports in `src/diff/index.ts`
- [x] Update main `src/index.ts` to export diff utilities
- [x] Write comprehensive unit tests (31 tests, all passing)
- [x] Update README.md with diff API documentation
- [x] Add usage examples
- [ ] Performance testing with large presentations (optional)
- [ ] Publish as version 0.1.3 (next step)

## Timeline Estimate

- **Type definitions**: 30 mins - 1 hour
- **Text diff utilities**: 1-2 hours
- **Slide matching logic**: 2-3 hours
- **Main diff algorithm**: 2-3 hours
- **Summary calculations**: 1 hour
- **Unit tests**: 2-3 hours
- **Documentation & exports**: 30 mins - 1 hour

**Total**: ~9-14 hours of focused development

## Success Criteria

The implementation will be considered complete when:

1. ✅ All type definitions are properly exported
2. ✅ `diffPresentations()` correctly identifies all diff statuses
3. ✅ Slide matching handles all edge cases gracefully
4. ✅ Text-level diffs are accurate and useful
5. ✅ Summary statistics are correctly calculated
6. ✅ Unit tests pass with >90% coverage
7. ✅ Documentation is complete with examples
8. ✅ No React or UI dependencies introduced
9. ✅ Bundle size remains reasonable (<20KB)
10. ✅ Published to npm as version 0.1.3

## Future Enhancements

Potential additions for later versions:

- Semantic diff (meaning-preserving changes)
- Syntax-aware diff for code blocks
- Image diff comparison capabilities
- Mermaid diagram diff visualization
- Export diff as markdown report
- Three-way merge utilities (base, theirs, ours)

## Related Documentation

- **Phase 2 Plan**: `/Users/griever/Developer/web-ade/industry-themed-markdown/SLIDE_DIFF_PLAN.md`
- **README**: `../README.md`
- **Existing Types**: `../src/types/presentation.ts`
- **Slide Utilities**: `../src/utils/slide-titles.ts`

## Notes

- This implementation must remain framework-agnostic
- No UI code should be included in this phase
- Focus on correctness and testability over performance initially
- API should be intuitive for React developers who will use it in Phase 2
