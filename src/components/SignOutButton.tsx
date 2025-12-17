'use client';

import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch('/auth/signout', {
      method: 'POST',
    });
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
    >
      Sign Out
    </button>
  );
}
