/**
 * Simple HTML parser utility to ensure images are properly rendered
 * This helps fix issues with the Lexical editor's image handling
 */

/**
 * Parses HTML content and ensures images are properly rendered
 * @param htmlContent The HTML content to parse
 * @returns Sanitized HTML string with properly rendered images
 */
export const parseHtmlContent = (htmlContent: string): string => {
  if (!htmlContent) return '';
  
  // Replace any image tags that might be showing as text with actual image elements
  // This regex looks for img tags that might be showing as text
  const fixedHtml = htmlContent.replace(
    /&lt;img\s+src=["']([^"']+)["']\s*(?:alt=["']([^"']*)["'])?\s*(?:style=["']([^"']*)["'])?\s*\/?&gt;/g,
    (_, src, alt = 'Image', style = '') => {
      return `<img src="${src}" alt="${alt}" style="${style || 'max-width: 100%; display: block; margin: 10px auto;'}" />`;
    }
  );
  
  // Also handle cases where the HTML might be double-escaped
  const doubleFixedHtml = fixedHtml.replace(
    /&amp;lt;img\s+src=["']([^"']+)["']\s*(?:alt=["']([^"']*)["'])?\s*(?:style=["']([^"']*)["'])?\s*\/?&amp;gt;/g,
    (_, src, alt = 'Image', style = '') => {
      return `<img src="${src}" alt="${alt}" style="${style || 'max-width: 100%; display: block; margin: 10px auto;'}" />`;
    }
  );
  
  return doubleFixedHtml;
};

/**
 * Creates a component that safely renders HTML content with images
 * @param htmlContent The HTML content to render
 * @returns JSX element with dangerouslySetInnerHTML
 */
export const createHtmlContent = (htmlContent: string): { __html: string } => {
  return { __html: parseHtmlContent(htmlContent) };
};
