/**
 * Input sanitization utilities to prevent XSS attacks
 */

/**
 * Escape HTML special characters
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Sanitize text input (removes HTML tags and escapes special characters)
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Remove HTML tags
  const withoutTags = text.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  return escapeHtml(withoutTags);
};

/**
 * Sanitize text but preserve line breaks (for textarea content)
 */
export const sanitizeMultilineText = (text: string): string => {
  if (!text) return '';
  
  // Remove HTML tags
  const withoutTags = text.replace(/<[^>]*>/g, '');
  
  // Escape special characters but preserve newlines
  return withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
};

/**
 * Sanitize user input for display (client-side)
 * Note: Server-side validation should also be performed
 */
export const sanitizeForDisplay = (text: string | null | undefined): string => {
  if (!text) return '';
  return sanitizeText(String(text));
};




