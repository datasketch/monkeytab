import { usePresence } from '../client/PresenceContext.tsx';
import type { PresenceUser } from '@monkeytab/core';

/**
 * Tiny avatar strip shown above the grid. Renders nothing when no presence
 * users are registered — no layout impact on single-user tables.
 */
export function PresenceBar() {
  const users = usePresence();
  if (users.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        fontSize: 12,
      }}
      role="status"
      aria-label={`${users.length} ${users.length === 1 ? 'user' : 'users'} viewing`}
    >
      {users.map((u) => (
        <PresenceAvatar key={u.userId} user={u} />
      ))}
    </div>
  );
}

function PresenceAvatar({ user }: { user: PresenceUser }) {
  const label = user.name ?? user.userId;
  const initial = (label[0] ?? '?').toUpperCase();
  const bg = user.color ?? '#64748b';

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={label}
        title={label}
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: `2px solid ${bg}`,
          objectFit: 'cover',
        }}
      />
    );
  }

  return (
    <div
      title={label}
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: 11,
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {initial}
    </div>
  );
}
