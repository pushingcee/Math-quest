'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGameState } from '@/contexts/GameStateContext';

const FF_PERSISTED = process.env.NEXT_PUBLIC_FF_PERSISTED_PROBLEM_SETS === 'true';

const NAV_LINKS: { href: string; label: string; mobileLabel?: string }[] = [
  { href: '/', label: 'Game' },
  ...(FF_PERSISTED ? [{ href: '/problem-sets', label: 'Problem Sets', mobileLabel: 'Problems' }] : []),
  { href: '/world-builder', label: 'World Builder', mobileLabel: 'Builder' },
];

function isActiveLink(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export default function NavBar() {
  const pathname = usePathname();
  const { isPlaying } = useGameState();

  if (isPlaying) return null;

  return (
    <nav
      style={{
        background: 'var(--ed-surface, #ffffff)',
        borderBottom: '1px solid var(--ed-border, #d4cfc7)',
        height: '44px',
        display: 'flex',
        alignItems: 'stretch',
        padding: '0 1rem',
        fontFamily: 'var(--font-source-sans), system-ui, sans-serif',
      }}
    >
      {/* Monogram */}
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-libre-baskerville), Georgia, serif',
          fontWeight: 700,
          fontSize: '14px',
          color: 'var(--ed-text, #2c2825)',
          display: 'flex',
          alignItems: 'center',
          paddingRight: '1rem',
          borderRight: '1px solid var(--ed-border, #d4cfc7)',
          textDecoration: 'none',
          marginRight: '0.25rem',
        }}
      >
        MQ
      </Link>

      {/* Tab links */}
      {NAV_LINKS.map(({ href, label, mobileLabel }) => {
        const active = isActiveLink(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 1rem',
              fontSize: '0.9375rem',
              fontWeight: active ? 600 : 400,
              color: active
                ? 'var(--ed-accent, #3730a3)'
                : 'var(--ed-text-dim, #6b6560)',
              borderBottom: active
                ? '2px solid var(--ed-accent, #3730a3)'
                : '2px solid transparent',
              marginBottom: '-1px',
              textDecoration: 'none',
              transition: 'color 150ms ease, border-color 150ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.color = 'var(--ed-text, #2c2825)';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.color = 'var(--ed-text-dim, #6b6560)';
              }
            }}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{mobileLabel ?? label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
