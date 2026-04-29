import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-3xl font-bold text-gray-900">Data Mining Platform</h1>
      <p className="text-gray-600 text-center max-w-xl">
        Welcome. Use the dashboard to manage datasets, run cleaning operations, exports, crawling jobs, and analytics.
      </p>
      <div className="flex gap-4">
        <Link href="/dashboard" className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Go to Dashboard</Link>
        <Link href="/auth/login" className="px-5 py-2 rounded border border-gray-300 hover:bg-gray-50 transition">Login</Link>
      </div>
    </main>
  );
}