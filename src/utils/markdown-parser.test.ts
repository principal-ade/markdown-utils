import { describe, it, expect } from 'bun:test';
import { parseMarkdownChunks, CHUNK_TYPES } from '../index';

describe('parseMarkdownChunks', () => {
  it('should parse plain markdown content', () => {
    const content = '# Hello World\n\nThis is a test.';
    const chunks = parseMarkdownChunks(content, 'test');
    
    expect(chunks).toHaveLength(1);
    expect(chunks[0].type).toBe(CHUNK_TYPES.MARKDOWN);
    expect(chunks[0].content).toBe(content);
    expect(chunks[0].id).toContain('test-md');
  });

  it('should separate mermaid chunks from markdown', () => {
    const content = `# Title

Some text before

\`\`\`mermaid
graph TD
  A --> B
\`\`\`

Text after diagram`;

    const chunks = parseMarkdownChunks(content, 'test');
    
    expect(chunks).toHaveLength(3);
    
    // First markdown chunk
    expect(chunks[0].type).toBe(CHUNK_TYPES.MARKDOWN);
    expect(chunks[0].content).toContain('# Title');
    expect(chunks[0].content).toContain('Some text before');
    
    // Mermaid chunk
    expect(chunks[1].type).toBe(CHUNK_TYPES.MERMAID);
    expect(chunks[1].content).toContain('graph TD');
    
    // Last markdown chunk
    expect(chunks[2].type).toBe(CHUNK_TYPES.MARKDOWN);
    expect(chunks[2].content).toContain('Text after diagram');
  });

  it('should handle empty content gracefully', () => {
    const chunks = parseMarkdownChunks('', 'test');
    expect(chunks).toHaveLength(0);
  });

  it('should handle multiple mermaid diagrams', () => {
    const content = `\`\`\`mermaid
graph TD
\`\`\`

Middle content

\`\`\`mermaid
flowchart LR
\`\`\``;

    const chunks = parseMarkdownChunks(content, 'test');
    
    expect(chunks).toHaveLength(3);
    expect(chunks.filter(c => c.type === CHUNK_TYPES.MERMAID)).toHaveLength(2);
    expect(chunks.filter(c => c.type === CHUNK_TYPES.MARKDOWN)).toHaveLength(1);
  });
});