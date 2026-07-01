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
 * Normalizes a GitHub "web" media URL to its raw-bytes equivalent.
 *
 * A URL like `https://github.com/owner/repo/blob/main/img.png` points at
 * GitHub's HTML page for that file, not the image itself, so using it as an
 * `<img src>` renders broken. This rewrites the `blob`/`raw` web form to
 * `https://raw.githubusercontent.com/owner/repo/main/img.png`, which serves the
 * actual bytes. A trailing `?raw=true` (GitHub's own "give me the raw file"
 * hint) is dropped since the raw host already serves raw bytes.
 *
 * Any URL that isn't a github.com blob/raw file path is returned unchanged, so
 * this is safe to call on every URL (user-attachments, gists, arbitrary CDNs,
 * relative paths, etc. all pass through untouched).
 */
export function normalizeGitHubMediaUrl(url: string): string {
  const match = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^/]+)\/(.+)$/,
  );

  if (!match) {
    return url;
  }

  const [, owner, repo, branch, rest] = match;
  // Drop a redundant `raw=true` query param (the raw host already serves raw
  // bytes); keep any other query/fragment (e.g. private-repo `?token=...`).
  const path = rest
    .replace(/(\?|&)raw=true(&|$)/, (_, lead, tail) => (lead === '?' && tail === '&' ? '?' : tail || ''))
    .replace(/\?$/, '');

  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

/**
 * Transforms a relative image URL to a GitHub raw URL
 */
export function transformImageUrl(src: string, repositoryInfo?: RepositoryInfo): string {
  // Normalize GitHub blob/raw web URLs to raw.githubusercontent.com first. This
  // applies even without repositoryInfo, since the URL is self-describing.
  const normalized = normalizeGitHubMediaUrl(src);
  if (normalized !== src) {
    return normalized;
  }

  // If no repository info or URL is already absolute, return as-is
  if (!repositoryInfo || !isRelativeUrl(src)) {
    return src;
  }

  const { owner, repo, branch = 'main', basePath = '' } = repositoryInfo;

  let fullPath: string;

  if (src.startsWith('/')) {
    // Check if this is a GitHub web-style path (e.g., /owner/repo/raw/branch/path or /owner/repo/blob/branch/path)
    const githubWebPathMatch = src.match(/^\/([^/]+)\/([^/]+)\/(raw|blob)\/([^/]+)\/(.+)$/);

    if (githubWebPathMatch) {
      const [, srcOwner, srcRepo, , srcBranch, srcPath] = githubWebPathMatch;
      // Use the path info from the URL itself
      fullPath = srcPath;

      // If the owner/repo/branch match our repository info, use them
      // Otherwise, construct URL from the parsed path (cross-repo reference)
      const rawUrl = `https://raw.githubusercontent.com/${srcOwner}/${srcRepo}/${srcBranch}/${srcPath}`;
      return rawUrl;
    }

    // Regular absolute path from repository root - remove leading slash
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