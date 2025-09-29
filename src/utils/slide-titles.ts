/**
 * Extracts the title from a markdown slide
 * Looks for the first # or ## heading in the content
 */
export function extractSlideTitle(content: string, slideIndex: number): string {
  // Split into lines
  const lines = content.split('\n');
  
  // Find the first heading (# or ##)
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for # heading (but not ###+ or code blocks)
    if (trimmedLine.startsWith('#')) {
      // Extract just the heading text
      const match = trimmedLine.match(/^#{1,2}\s+(.+)$/);
      if (match && match[1]) {
        // Remove any markdown formatting from the title
        return match[1]
          .replace(/\*\*/g, '') // Remove bold
          .replace(/\*/g, '')   // Remove italic
          .replace(/`/g, '')    // Remove code
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
          .trim();
      }
    }
  }
  
  // If no title found, return a default
  return `Slide ${slideIndex + 1}`;
}

/**
 * Extracts titles from all slides
 */
export function extractAllSlideTitles(slides: string[]): string[] {
  return slides.map((slide, index) => extractSlideTitle(slide, index));
}

/**
 * Get all slide titles from a presentation
 */
export function getAllSlideTitles(slides: Array<{ title: string }>): string[] {
  return slides.map(slide => slide.title);
}

/**
 * Find a slide by title
 */
export function findSlideByTitle<T extends { title: string }>(
  slides: T[],
  title: string
): T | undefined {
  return slides.find(slide => slide.title === title);
}

/**
 * Find slide index by title
 */
export function findSlideIndexByTitle(
  slides: Array<{ title: string }>,
  title: string
): number {
  return slides.findIndex(slide => slide.title === title);
}