'use client';

import { useState, useEffect, useRef } from 'react';

interface Note {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  isPrivate: boolean;
}

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note;
  onSuccess: (note: any) => void;
}

export const EditNoteModal = ({
  isOpen,
  onClose,
  note,
  onSuccess,
}: EditNoteModalProps) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isPrivate, setIsPrivate] = useState(note.isPrivate);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(note.title);
      setContent(note.content);
      setIsPrivate(note.isPrivate);
      setIsSaving(false);
      // Clear any pending auto-save when modal opens
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    }
  }, [isOpen, note]);

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (!isOpen) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (500ms debounce)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Only auto-save if values have changed
      if (title === note.title && content === note.content && isPrivate === note.isPrivate) {
        return;
      }

      setIsSaving(true);
      try {
        const sessionId = window.location.pathname.split('/')[2];
        const response = await fetch(`/api/sessions/${sessionId}/notes/${note.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            content,
            isPrivate,
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
  }, [title, content, isPrivate, isOpen, note, onSuccess]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const sessionId = window.location.pathname.split('/')[2];
      const response = await fetch(
        `/api/sessions/${sessionId}/notes/${note.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            content,
            isPrivate,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update note');
      }

      const data = await response.json();
      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Note</h2>
        <p className="text-sm text-gray-600 mb-4">
          Time: {formatTime(note.timestamp)}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter note title"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Content *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter note content"
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Private note</span>
            </label>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {isSaving && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
              Saving...
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


