// icons.js
// Small inline SVG icon set. Keeping icons as template strings avoids an
// external icon font or library dependency, matching the "no dependencies"
// requirement, and lets each icon inherit currentColor for theming.

const paths = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>',
  paw: '<circle cx="7" cy="8" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="8" r="2"/><circle cx="19" cy="13" r="2"/><path d="M12 12c-3 0-6 2.5-6 5.5S8 21 12 21s6-1.5 6-3.5S15 12 12 12Z"/>',
  heart: '<path d="M12 20.5s-7-4.35-9.5-8.7C.5 8.2 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.5C11 6 12.5 5 14.4 5c3.3 0 5.1 3.2 3.1 6.8C19 16.15 12 20.5 12 20.5Z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/>',
  scissors: '<circle cx="6" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><path d="M20 4 8.5 12 20 20"/><path d="M8.5 12 4 16"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  dollar: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M15 9.5c0-1.4-1.4-2.5-3-2.5s-3 1-3 2.3c0 3 6 1.5 6 4.5 0 1.4-1.4 2.5-3 2.5s-3-1-3-2.3"/>',
  book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5c-.8 0-1.5-.7-1.5-1.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V19a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  moon: '<path d="M20 14.5a8.5 8.5 0 1 1-8.9-11.4 7 7 0 0 0 8.9 11.4Z"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 13l4 4L19 7"/>',
  edit: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5.5-5.5L4 21"/>',
  document: '<path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v6h6"/>',
};

/** Return an inline <svg> string for a named icon. */
export function icon(name, { size = 20 } = {}) {
  const inner = paths[name] || paths.more;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
}
