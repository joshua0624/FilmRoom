'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { toast } from 'sonner';

interface League {
  id: string;
  name: string;
  isPublic: boolean;
  creatorId: string;
}

interface EditLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  league: League | null;
  userId: string;
  onSuccess: () => void;
}

export const EditLeagueModal = ({
  isOpen,
  onClose,
  league,
  userId,
  onSuccess,
}: EditLeagueModalProps) => {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (league && isOpen) {
      setName(league.name);
      setIsPublic(league.isPublic);
      setPassword('');
      setChangePassword(false);
      setError(null);
    }
  }, [league, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!league) return;

    // Only creator can edit
    if (league.creatorId !== userId) {
      setError('Only the league creator can edit league settings');
      return;
    }

    if (!name.trim()) {
      setError('League name is required');
      return;
    }

    if (!isPublic && changePassword && !password.trim()) {
      setError('Password is required for private leagues');
      return;
    }

    setIsLoading(true);

    try {
      const body: any = {
        name: name.trim(),
        isPublic,
      };

      // Only include password if changing it or switching to private
      if (!isPublic && (changePassword || !league.isPublic)) {
        if (password.trim()) {
          body.password = password;
        } else if (!league.isPublic) {
          // Keep existing password (don't send password field)
        } else {
          // Switching to private, need password
          setError('Password is required when switching to private');
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch(`/api/leagues/${league.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update league');
      }

      toast.success('League updated successfully!');
      onSuccess();
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!league) return;

    const confirmMessage = `Are you sure you want to delete "${league.name}"? This will permanently delete all teams, sessions, and data in this league. This action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/leagues/${league.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete league');
      }

      toast.success('League deleted successfully');
      onSuccess();
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setIsPublic(true);
    setPassword('');
    setChangePassword(false);
    setError(null);
    onClose();
  };

  if (!league) return null;

  // Only creator can edit
  const isCreator = league.creatorId === userId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit League"
      maxWidth="500px"
      footer={
        <div className="flex justify-between w-full">
          <div>
            {isCreator && (
              <Button
                variant="tertiary"
                onClick={handleDelete}
                disabled={isDeleting || isLoading}
                type="button"
                className="!text-red-500 !border-red-500 hover:!bg-red-500/10"
              >
                {isDeleting ? 'Deleting...' : 'Delete League'}
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="tertiary" onClick={handleClose} type="button">
              Cancel
            </Button>
            {isCreator && (
              <Button
                variant="primary"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e as any);
                }}
                disabled={isLoading || isDeleting}
                type="button"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {!isCreator ? (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-yellow-600">
          Only the league creator can edit league settings.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              League Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary"
              placeholder="Enter league name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Privacy
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  value="public"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-text-primary">
                  Public (anyone can join)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-text-primary">
                  Private (requires password)
                </span>
              </label>
            </div>
          </div>

          {!isPublic && (
            <>
              {!league.isPublic && (
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={changePassword}
                      onChange={(e) => setChangePassword(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-text-primary">
                      Change password
                    </span>
                  </label>
                </div>
              )}

              {(changePassword || league.isPublic) && (
                <div className="mb-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-text-primary mb-2"
                  >
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={isPublic ? false : (changePassword || league.isPublic)}
                    className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary"
                    placeholder="Enter new league password"
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-500 text-sm">
              {error}
            </div>
          )}
        </form>
      )}
    </Modal>
  );
};
