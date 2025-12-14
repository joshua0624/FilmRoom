/**
 * Validation utilities for form inputs
 */

export const validateYouTubeUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === '') {
    return { valid: false, error: 'YouTube URL is required' };
  }

  // YouTube URL patterns
  const patterns = [
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
    /^https?:\/\/youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/youtube\.com\/embed\/[\w-]+/,
  ];

  const isValidFormat = patterns.some((pattern) => pattern.test(url.trim()));

  if (!isValidFormat) {
    return {
      valid: false,
      error: 'Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...)',
    };
  }

  return { valid: true };
};

export const validateTeamName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Team name is required' };
  }

  const trimmed = name.trim();
  if (trimmed.length < 1) {
    return { valid: false, error: 'Team name must be at least 1 character' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Team name must be 50 characters or less' };
  }

  return { valid: true };
};

export const validateNoteTitle = (title: string): { valid: boolean; error?: string } => {
  if (!title || title.trim() === '') {
    return { valid: false, error: 'Note title is required' };
  }

  const trimmed = title.trim();
  if (trimmed.length < 1) {
    return { valid: false, error: 'Note title must be at least 1 character' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Note title must be 100 characters or less' };
  }

  return { valid: true };
};

export const validateNoteContent = (content: string): { valid: boolean; error?: string } => {
  if (!content || content.trim() === '') {
    return { valid: false, error: 'Note content is required' };
  }

  const trimmed = content.trim();
  if (trimmed.length < 1) {
    return { valid: false, error: 'Note content must be at least 1 character' };
  }

  if (trimmed.length > 5000) {
    return { valid: false, error: 'Note content must be 5000 characters or less' };
  }

  return { valid: true };
};

export const validateColor = (color: string): { valid: boolean; error?: string } => {
  if (!color || color.trim() === '') {
    return { valid: false, error: 'Color is required' };
  }

  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  if (!hexPattern.test(color.trim())) {
    return { valid: false, error: 'Color must be a valid hex color (e.g., #3B82F6)' };
  }

  return { valid: true };
};



