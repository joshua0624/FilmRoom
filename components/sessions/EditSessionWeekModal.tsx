'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface EditSessionWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  currentWeek: number | null;
  onSuccess: (updatedWeek: number | null) => void;
}

export const EditSessionWeekModal = ({
  isOpen,
  onClose,
  sessionId,
  currentWeek,
  onSuccess,
}: EditSessionWeekModalProps) => {
  const [week, setWeek] = useState<string>(currentWeek?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const weekValue = week.trim() === '' ? null : parseInt(week);

      if (weekValue !== null && (isNaN(weekValue) || weekValue < 1 || weekValue > 52)) {
        setError('Week must be between 1 and 52');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ week: weekValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update week');
      }

      toast.success('Week updated successfully!');
      onSuccess(weekValue);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setWeek(currentWeek?.toString() || '');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Edit Session Week
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="week"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Week
            </label>
            <input
              type="number"
              id="week"
              min="1"
              max="52"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Leave empty for no week"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter a week number (1-52) or leave empty to remove week assignment
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Week'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
