'use client';

import { useState } from 'react';
import { EditNoteModal } from './EditNoteModal';

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

interface NotesPanelProps {
  notes: Note[];
  userId: string;
  onNoteClick: (timestamp: number) => void;
  onNoteUpdated: (note: Note) => void;
  onNoteDeleted: (noteId: string) => void;
  readOnly?: boolean;
}

export const NotesPanel = ({
  notes,
  userId,
  onNoteClick,
  onNoteUpdated,
  onNoteDeleted,
  readOnly = false,
}: NotesPanelProps) => {
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      // Extract sessionId from URL pathname (format: /sessions/[id])
      const pathParts = window.location.pathname.split('/');
      const sessionId = pathParts[2];
      
      if (!sessionId) {
        throw new Error('Unable to determine session ID');
      }

      const response = await fetch(
        `/api/sessions/${sessionId}/notes/${noteId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      onNoteDeleted(noteId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const visibleNotes = notes
    .filter((note) => !note.isPrivate || note.createdBy.id === userId)
    .filter((note, index, self) => 
      index === self.findIndex((n) => n.id === note.id)
    );

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Notes</h3>
      {visibleNotes.length === 0 ? (
        <p className="text-text-secondary text-sm">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {visibleNotes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-bg-primary rounded border-l-2 border-[#eab308] cursor-pointer transition-colors hover:bg-bg-tertiary/50"
              onClick={() => onNoteClick(note.timestamp)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNoteClick(note.timestamp);
                }
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-accent-secondary font-medium">
                      {formatTime(note.timestamp)}
                    </span>
                    {note.isPrivate && (
                      <span className="px-2 py-0.5 text-xs font-medium text-text-secondary bg-bg-tertiary rounded">
                        Private
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-text-primary text-sm mb-1">{note.title}</h4>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-2">{note.content}</p>
                  <div className="text-xs text-text-tertiary">
                    by {note.createdBy.username}
                  </div>
                </div>
                {!readOnly && note.createdBy.id === userId && (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setEditingNote(note)}
                      className="text-xs text-accent-secondary hover:text-accent-primary transition-colors"
                      aria-label="Edit note"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-xs text-red-500 hover:text-red-400 transition-colors"
                      aria-label="Delete note"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingNote && (
        <EditNoteModal
          isOpen={true}
          onClose={() => setEditingNote(null)}
          note={editingNote}
          onSuccess={(updatedNote) => {
            onNoteUpdated(updatedNote);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
};


