import React, { useEffect, useState } from 'react';

export const ThemeToggle: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = window.document.documentElement;
    setIsDark(root.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const root = window.document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      window.document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="btn btn-outline text-sm"
    >
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
};