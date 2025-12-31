'use client';

import { useState } from 'react';
import { validateTeamName, validateColor } from '@/lib/validation';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useLeague } from '@/contexts/LeagueContext';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTeamModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateTeamModalProps) => {
  const { activeLeague } = useLeague();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#DC2626'); // Default red
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const colors = [
    { name: 'Red', value: '#DC2626' },
    { name: 'Blue', value: '#2563EB' },
    { name: 'Green', value: '#16A34A' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Orange', value: '#EA580C' },
    { name: 'Purple', value: '#9333EA' },
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate team name
    const nameValidation = validateTeamName(name);
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Invalid name');
      return;
    }

    // Validate color
    const colorValidation = validateColor(selectedColor);
    if (!colorValidation.valid) {
      setError(colorValidation.error || 'Invalid color');
      return;
    }

    if (!activeLeague) {
      setError('Please select a league first');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color: selectedColor, leagueId: activeLeague.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create team');
      }

      setName('');
      setSelectedColor('#DC2626');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedColor('#DC2626');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Team"
      maxWidth="500px"
      footer={
        <div className="flex gap-3">
          <Button variant="tertiary" onClick={handleClose} disabled={loading} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            type="button"
          >
            {loading ? 'Creating...' : 'Create Team'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <p className="text-sm text-text-secondary mb-4">
          Choose a name and color for your team
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 mb-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Team Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Team Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary"
            placeholder="Enter team name"
            required
            disabled={loading}
          />
        </div>

        {/* Team Color */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-3">
            Team Color
          </label>
          <div className="grid grid-cols-4 gap-3">
            {colors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setSelectedColor(color.value)}
                className={`h-12 rounded-md border-2 transition-all ${
                  selectedColor === color.value
                    ? 'border-accent-primary scale-110'
                    : 'border-border hover:border-bg-tertiary'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
                disabled={loading}
                aria-label={`Select ${color.name} color`}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};


