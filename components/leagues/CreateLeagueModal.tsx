'use client';

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { toast } from 'sonner';

interface CreateLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (league: any) => void;
}

export const CreateLeagueModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateLeagueModalProps) => {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('League name is required');
      return;
    }

    if (!isPublic && !password.trim()) {
      setError('Password is required for private leagues');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          isPublic,
          password: !isPublic ? password : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create league');
      }

      const league = await response.json();
      toast.success('League created successfully!');
      onSuccess(league);
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setIsPublic(true);
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create League"
      maxWidth="500px"
      footer={
        <div className="flex gap-3">
          <Button variant="tertiary" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as any);
            }}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? 'Creating...' : 'Create League'}
          </Button>
        </div>
      }
    >
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
              required={!isPublic}
              className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary"
              placeholder="Enter league password"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-500 text-sm">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
};
