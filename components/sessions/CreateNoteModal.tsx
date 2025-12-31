'use client';

import { useState, useEffect, useRef } from 'react';
import { validateNoteTitle, validateNoteContent } from '@/lib/validation';
import { toast } from 'sonner';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  timestamp: number;
  onSuccess: (note: any) => void;
}

export const CreateNoteModal = ({
  isOpen,
  onClose,
  sessionId,
  timestamp,
  onSuccess,
}: CreateNoteModalProps) => {
  console.log('CreateNoteModal render - isOpen:', isOpen, 'timestamp:', timestamp);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'TEAM_ONLY'>('PUBLIC');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save functionality with debouncing
  useEffect(() => {
    // Only auto-save if we have a note ID (note has been created)
    if (!noteId || !title.trim() || !content.trim()) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (500ms debounce)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/sessions/${sessionId}/notes/${noteId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            content,
            visibility,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to auto-save note');
        }

        const data = await response.json();
        onSuccess(data);
      } catch (err) {
        console.error('Auto-save error:', err);
        // Don't show error to user for auto-save failures
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, visibility, noteId, sessionId, onSuccess]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    
    if (timestamp === undefined || timestamp < 0 || isNaN(timestamp)) {
      setError('Invalid timestamp. Please try adding the note again.');
      return;
    }

    // Validate title
    const titleValidation = validateNoteTitle(title);
    if (!titleValidation.valid) {
      setFieldErrors({ title: titleValidation.error || 'Invalid title' });
      return;
    }

    // Validate content
    const contentValidation = validateNoteContent(content);
    if (!contentValidation.valid) {
      setFieldErrors({ content: contentValidation.error || 'Invalid content' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: Number(timestamp),
          title,
          content,
          visibility,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create note');
      }

      const data = await response.json();
      setNoteId(data.id);
      toast.success('Note created successfully!');
      onSuccess(data);
      // Don't close modal or reset form - allow user to continue editing with auto-save
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setVisibility('PUBLIC');
    setError(null);
    setNoteId(null);
    setIsSaving(false);
    setFieldErrors({});
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Note"
      maxWidth="500px"
      footer={
        <div className="flex gap-3">
          <Button variant="tertiary" onClick={handleClose} type="button">
            {noteId ? 'Close' : 'Cancel'}
          </Button>
          {!noteId && (
            <Button
              variant="primary"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as any);
              }}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? 'Creating...' : 'Create Note'}
            </Button>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <p className="text-sm text-text-secondary mb-4">
          Time: {formatTime(timestamp)}
        </p>

        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (fieldErrors.title) {
                setFieldErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.title;
                  return newErrors;
                });
              }
            }}
            required
            maxLength={100}
            className={`w-full px-3 py-2.5 bg-bg-primary border rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary ${
              fieldErrors.title ? 'border-red-500' : 'border-border'
            }`}
            placeholder="Enter note title"
            aria-invalid={!!fieldErrors.title}
            aria-describedby={fieldErrors.title ? 'title-error' : undefined}
          />
          {fieldErrors.title && (
            <p id="title-error" className="mt-1 text-sm text-red-500" role="alert">
              {fieldErrors.title}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            Content *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (fieldErrors.content) {
                setFieldErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.content;
                  return newErrors;
                });
              }
            }}
            required
            rows={4}
            maxLength={5000}
            className={`w-full px-3 py-2.5 bg-bg-primary border rounded-md text-text-primary placeholder-text-tertiary resize-y focus:outline-none focus:border-accent-primary ${
              fieldErrors.content ? 'border-red-500' : 'border-border'
            }`}
            placeholder="Enter note content"
            aria-invalid={!!fieldErrors.content}
            aria-describedby={fieldErrors.content ? 'content-error' : undefined}
          />
          {fieldErrors.content && (
            <p id="content-error" className="mt-1 text-sm text-red-500" role="alert">
              {fieldErrors.content}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Visibility
          </label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                checked={visibility === 'PUBLIC'}
                onChange={() => setVisibility('PUBLIC')}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm text-text-primary">Public (all league members)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="TEAM_ONLY"
                checked={visibility === 'TEAM_ONLY'}
                onChange={() => setVisibility('TEAM_ONLY')}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm text-text-primary">Team only (my team members)</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-500 text-sm">
            {error}
          </div>
        )}

        {isSaving && (
          <div className="mb-4 p-2 bg-accent-bg border border-accent-border rounded-md text-accent-secondary text-sm">
            Saving...
          </div>
        )}
      </form>
    </Modal>
  );
};

