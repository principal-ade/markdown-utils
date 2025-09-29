import { RepositoryInfo } from '../types/presentation';

/**
 * Determines if a URL is relative (not absolute)
 */
export function isRelativeUrl(url: string): boolean {
  // Check if it's an absolute URL (starts with protocol)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return false;
  }

  // Check if it's a protocol-relative URL
  if (url.startsWith('//')) {
    return false;
  }

  // Check if it's a data URL
  if (url.startsWith('data:')) {
    return false;
  }

  // Check if it's a blob URL
  if (url.startsWith('blob:')) {
    return false;
  }

  // Otherwise consider it relative
  return true;
}

/**
 * Transforms a relative image URL to a GitHub raw URL
 */
export function transformImageUrl(src: string, repositoryInfo?: RepositoryInfo): string {
  // If no repository info or URL is already absolute, return as-is
  if (!repositoryInfo || !isRelativeUrl(src)) {
    return src;
  }

  const { owner, repo, branch = 'main', basePath = '' } = repositoryInfo;

  let fullPath: string;

  if (src.startsWith('/')) {
    // Absolute path from repository root - remove leading slash
    fullPath = src.substring(1);
  } else {
    // Relative path - resolve relative to the markdown file's location
    let cleanPath = src;

    // Remove leading './'
    if (cleanPath.startsWith('./')) {
      cleanPath = cleanPath.substring(2);
    }

    // Handle '../' navigation if needed
    if (cleanPath.startsWith('../')) {
      console.warn(
        'Relative parent directory navigation in image URLs is not fully supported:',
        src,
      );
      // For now, just remove the '../' and continue
      cleanPath = cleanPath.replace(/^(\.\.\/)+/, '');
    }

    // Construct the full path relative to the markdown file's location
    if (basePath) {
      // Ensure basePath doesn't start/end with slashes for clean joining
      const cleanBasePath = basePath.replace(/^\/+|\/+$/g, '');
      fullPath = `${cleanBasePath}/${cleanPath}`;
    } else {
      fullPath = cleanPath;
    }
  }

  // Use raw.githubusercontent.com for the raw file URL
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fullPath}`;

  return rawUrl;
}

/**
 * Transforms image URLs in markdown content
 * This can be used to preprocess markdown content before rendering
 */
export function transformMarkdownImageUrls(
  markdownContent: string,
  repositoryInfo?: RepositoryInfo,
): string {
  if (!repositoryInfo) {
    return markdownContent;
  }

  // Transform markdown image syntax: ![alt](src)
  const transformedContent = markdownContent.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, altText, imagePath) => {
      const transformedPath = transformImageUrl(imagePath, repositoryInfo);
      return `![${altText}](${transformedPath})`;
    },
  );

  return transformedContent;
}