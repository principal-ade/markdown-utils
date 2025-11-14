# @a24z/markdown-utils

Core markdown parsing and presentation utilities without React dependencies. Extract slides, parse chunks, and handle markdown transformations.

## Installation

```bash
npm install @a24z/markdown-utils
# or
bun add @a24z/markdown-utils
```

## Features

- 📝 **Markdown parsing** - Parse markdown into typed chunks
- 🎯 **Slide extraction** - Split markdown into presentation slides
- 🔀 **Presentation diffing** - Compare two presentations slide-by-slide
- 🔌 **Extensible** - Plugin system for custom chunk types
- 🚀 **Zero React dependencies** - Pure TypeScript utilities
- 📦 **Lightweight** - ~22KB bundled

## Usage

### Parse Markdown into Chunks

```typescript
import { parseMarkdownChunks, CHUNK_TYPES } from '@a24z/markdown-utils';

const chunks = parseMarkdownChunks(markdownContent, 'my-prefix');

chunks.forEach(chunk => {
  if (chunk.type === CHUNK_TYPES.MERMAID) {
    // Handle mermaid diagram
    console.log('Mermaid:', chunk.content);
  }
});
```

### Create Presentation from Markdown

```typescript
import { parseMarkdownIntoPresentation, MarkdownPresentationFormat } from '@a24z/markdown-utils';

// Split by horizontal rules (---)
const presentation = parseMarkdownIntoPresentation(
  markdownContent,
  MarkdownPresentationFormat.HORIZONTAL_RULE
);

console.log(`${presentation.slides.length} slides found`);
```

### Compare Two Presentations

```typescript
import { diffPresentations, parseMarkdownIntoPresentation } from '@a24z/markdown-utils';

const beforePresentation = parseMarkdownIntoPresentation(beforeMarkdown);
const afterPresentation = parseMarkdownIntoPresentation(afterMarkdown);

const diff = diffPresentations(beforePresentation, afterPresentation);

console.log(`${diff.summary.modified} slides modified`);
console.log(`${diff.summary.added} slides added`);
console.log(`${diff.summary.removed} slides removed`);

// Iterate through slide-by-slide diffs
diff.slideDiffs.forEach(slideDiff => {
  console.log(`Slide status: ${slideDiff.status}`);

  if (slideDiff.status === 'modified') {
    // Access line-by-line content changes
    slideDiff.contentChanges?.forEach(change => {
      if (change.type === 'add') {
        console.log(`+ ${change.value}`);
      } else if (change.type === 'remove') {
        console.log(`- ${change.value}`);
      }
    });
  }
});
```

### Extend with Custom Chunks

```typescript
import { BaseChunk, parseMarkdownChunks } from '@a24z/markdown-utils';

// Define custom chunk type
interface MathChunk extends BaseChunk<'math_chunk'> {
  formula: string;
}

// Custom parser
const mathParser = (content: string, idPrefix: string): MathChunk[] => {
  // Parse LaTeX math blocks...
  return [];
};

// Use with parser
const chunks = parseMarkdownChunks<MathChunk | ContentChunk>(
  content,
  'prefix',
  [mathParser]
);
```

## API

### Types

**Chunks:**
- `BaseChunk<T>` - Base interface for extensible chunks
- `MarkdownChunk`, `MermaidChunk`, `CodeChunk` - Built-in chunk types

**Presentations:**
- `MarkdownPresentation`, `MarkdownSlide` - Presentation types

**Diffs:**
- `PresentationDiff` - Complete diff analysis between two presentations
- `SlideDiff` - Diff between two versions of a slide
- `DiffSummary` - Summary statistics for a presentation diff
- `DiffStatus` - Status of a slide: `'added' | 'removed' | 'modified' | 'unchanged' | 'moved'`
- `TextDiff` - Line-level text change

### Functions

**Parsing:**
- `parseMarkdownChunks()` - Parse markdown into typed chunks
- `parseMarkdownIntoPresentation()` - Create presentation from markdown
- `extractSlideTitle()` - Extract title from slide content

**Diffing:**
- `diffPresentations()` - Compare two presentations and generate diff
- `calculateDiffSummary()` - Generate summary statistics from a diff
- `diffText()` - Low-level line-by-line text comparison
- `hasChanges()` - Check if a diff has any changes
- `formatDiffSummary()` - Format summary as human-readable string

**Utilities:**
- `parseBashCommands()` - Parse bash code blocks
- `transformImageUrl()` - Transform relative URLs to absolute
- `slidesAreEqual()` - Check if two slides are identical
- `normalizeText()` - Normalize text for comparison

## License

MIT - a24z Team