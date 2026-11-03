import { useState } from 'react';
import { resolveImage } from '../api/client';
import { initials } from '../utils/format';

export default function Avatar({ src, name = '', size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false);
  const source = resolveImage(src);
  const classes = `avatar avatar-${size} ${className}`.trim();

  if (source && !failed) {
    return (
      <img
        src={source}
        alt={name ? `${name}'s profile photo` : 'Profile photo'}
        className={classes}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={`avatar-fallback ${classes}`} aria-hidden="true">
      {initials(name) || '?'}
    </span>
  );
}
