'use client';

import { useState, useEffect } from 'react';
import { validateYouTubeUrl, validateTeamName, validateColor } from '@/lib/validation';
import { toast } from 'sonner';
import { useLeague } from '@/contexts/LeagueContext';

interface Team {
  id: string;
  name: string;
  color: string;
}

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sessionId: string) => void;
}

export const CreateSessionModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateSessionModalProps) => {
  const { activeLeague } = useLeague();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const [teamACustomName, setTeamACustomName] = useState('');
  const [teamBCustomName, setTeamBCustomName] = useState('');
  const [teamAColor, setTeamAColor] = useState('#3B82F6');
  const [teamBColor, setTeamBColor] = useState('#EF4444');
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen, activeLeague]);

  const fetchTeams = async () => {
    if (!activeLeague) {
      setIsLoadingTeams(false);
      return;
    }

    try {
      setIsLoadingTeams(true);
      const response = await fetch(`/api/teams?leagueId=${activeLeague.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate YouTube URL
    const urlValidation = validateYouTubeUrl(youtubeUrl);
    if (!urlValidation.valid) {
      setFieldErrors({ youtubeUrl: urlValidation.error || 'Invalid URL' });
      return;
    }

    // Validate team custom names if provided
    if (!teamAId && teamACustomName) {
      const teamAValidation = validateTeamName(teamACustomName);
      if (!teamAValidation.valid) {
        setFieldErrors((prev) => ({ ...prev, teamACustomName: teamAValidation.error || 'Invalid name' }));
        return;
      }
    }

    if (!teamBId && teamBCustomName) {
      const teamBValidation = validateTeamName(teamBCustomName);
      if (!teamBValidation.valid) {
        setFieldErrors((prev) => ({ ...prev, teamBCustomName: teamBValidation.error || 'Invalid name' }));
        return;
      }
    }

    // Validate colors
    const colorAValidation = validateColor(teamAColor);
    if (!colorAValidation.valid) {
      setFieldErrors((prev) => ({ ...prev, teamAColor: colorAValidation.error || 'Invalid color' }));
      return;
    }

    const colorBValidation = validateColor(teamBColor);
    if (!colorBValidation.valid) {
      setFieldErrors((prev) => ({ ...prev, teamBColor: colorBValidation.error || 'Invalid color' }));
      return;
    }

    if (!activeLeague) {
      setError('Please select a league first');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeUrl,
          leagueId: activeLeague.id,
          teamAId: teamAId || null,
          teamBId: teamBId || null,
          teamACustomName: teamACustomName || null,
          teamBCustomName: teamBCustomName || null,
          teamAColor,
          teamBColor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const data = await response.json();
      toast.success('Session created successfully!');
      resetForm();
      onSuccess(data.id);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setYoutubeUrl('');
    setTeamAId('');
    setTeamBId('');
    setTeamACustomName('');
    setTeamBCustomName('');
    setTeamAColor('#3B82F6');
    setTeamBColor('#EF4444');
    setError(null);
    setFieldErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTeamAChange = (teamId: string) => {
    setTeamAId(teamId);
    if (teamId) {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        setTeamAColor(team.color);
        setTeamACustomName('');
      }
    }
  };

  const handleTeamBChange = (teamId: string) => {
    setTeamBId(teamId);
    if (teamId) {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        setTeamBColor(team.color);
        setTeamBCustomName('');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Create New Film Session
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="youtubeUrl"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              YouTube URL *
            </label>
            <input
              type="url"
              id="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value);
                if (fieldErrors.youtubeUrl) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.youtubeUrl;
                    return newErrors;
                  });
                }
              }}
              required
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                fieldErrors.youtubeUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://www.youtube.com/watch?v=..."
              aria-invalid={!!fieldErrors.youtubeUrl}
              aria-describedby={fieldErrors.youtubeUrl ? 'youtubeUrl-error' : undefined}
            />
            {fieldErrors.youtubeUrl && (
              <p id="youtubeUrl-error" className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.youtubeUrl}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="teamA"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Team A
              </label>
              {isLoadingTeams ? (
                <div className="text-sm text-gray-500">Loading teams...</div>
              ) : (
                <select
                  id="teamA"
                  value={teamAId}
                  onChange={(e) => handleTeamAChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Custom Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}
              {!teamAId && (
                <>
                  <input
                    type="text"
                    value={teamACustomName}
                    onChange={(e) => {
                      setTeamACustomName(e.target.value);
                      if (fieldErrors.teamACustomName) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.teamACustomName;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Team A name"
                    maxLength={50}
                    className={`w-full mt-2 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.teamACustomName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={!!fieldErrors.teamACustomName}
                    aria-describedby={fieldErrors.teamACustomName ? 'teamACustomName-error' : undefined}
                  />
                  {fieldErrors.teamACustomName && (
                    <p id="teamACustomName-error" className="mt-1 text-sm text-red-600" role="alert">
                      {fieldErrors.teamACustomName}
                    </p>
                  )}
                </>
              )}
              <div className="mt-2 flex items-center gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  Color:
                </label>
                <input
                  type="color"
                  value={teamAColor}
                  onChange={(e) => setTeamAColor(e.target.value)}
                  className="h-8 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={teamAColor}
                  onChange={(e) => setTeamAColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="teamB"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Team B
              </label>
              {isLoadingTeams ? (
                <div className="text-sm text-gray-500">Loading teams...</div>
              ) : (
                <select
                  id="teamB"
                  value={teamBId}
                  onChange={(e) => handleTeamBChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Custom Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}
              {!teamBId && (
                <>
                  <input
                    type="text"
                    value={teamBCustomName}
                    onChange={(e) => {
                      setTeamBCustomName(e.target.value);
                      if (fieldErrors.teamBCustomName) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.teamBCustomName;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Team B name"
                    maxLength={50}
                    className={`w-full mt-2 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.teamBCustomName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={!!fieldErrors.teamBCustomName}
                    aria-describedby={fieldErrors.teamBCustomName ? 'teamBCustomName-error' : undefined}
                  />
                  {fieldErrors.teamBCustomName && (
                    <p id="teamBCustomName-error" className="mt-1 text-sm text-red-600" role="alert">
                      {fieldErrors.teamBCustomName}
                    </p>
                  )}
                </>
              )}
              <div className="mt-2 flex items-center gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  Color:
                </label>
                <input
                  type="color"
                  value={teamBColor}
                  onChange={(e) => setTeamBColor(e.target.value)}
                  className="h-8 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={teamBColor}
                  onChange={(e) => setTeamBColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
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
              {isLoading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


