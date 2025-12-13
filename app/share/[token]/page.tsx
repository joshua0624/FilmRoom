import { SignOutButton } from '@/components/auth/SignOutButton';
import { SharedSessionViewer } from '@/components/sessions/SharedSessionViewer';
import { getSession } from '@/lib/session';
import Link from 'next/link';

export default async function ShareSessionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">FilmRoom</h1>
              </div>
            </div>
            <div className="flex items-center">
              {session ? (
                <>
                  <span className="text-sm text-gray-700 mr-4">
                    {session.user.name}
                  </span>
                  <SignOutButton />
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span className="text-sm font-medium text-blue-900">
              Shared Session
            </span>
          </div>
          <p className="mt-1 text-sm text-blue-700">
            This is a read-only view of a shared film session.
          </p>
        </div>
        <SharedSessionViewer shareToken={token} userId={session?.user?.id} />
      </main>
    </div>
  );
}


