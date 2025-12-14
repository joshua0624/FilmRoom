'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

interface Note {
  id: string;
  sessionId: string;
  timestamp: number;
  title: string;
  content: string;
  isPrivate: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    username: string;
  };
}

interface NoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note;
  userId: string;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export const NoteDetailModal = ({
  isOpen,
  onClose,
  note,
  userId,
  onEdit,
  onDelete,
}: NoteDetailModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const sessionId = window.location.pathname.split('/')[2];
      const response = await fetch(`/api/sessions/${sessionId}/notes/${note.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      onDelete(note.id);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{note.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Time:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatTime(note.timestamp)}
            </span>
          </div>
          {note.isPrivate && (
            <div className="inline-block px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded">
              Private
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
        </div>

        <div className="mb-4 text-sm text-gray-500 space-y-1">
          <div>
            Created by <span className="font-medium">{note.createdBy.username}</span>
          </div>
          <div>Created: {formatDate(note.createdAt)}</div>
          {note.updatedAt !== note.createdAt && (
            <div>Updated: {formatDate(note.updatedAt)}</div>
          )}
        </div>

        {note.createdBy.id === userId && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                onEdit(note);
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
};


