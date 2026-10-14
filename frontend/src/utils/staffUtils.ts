/**
 * staffUtils.ts
 * Helper utilities for staff display, initials, and formatting.
 */

/**
 * Extracts a 2-letter uppercase initial avatar string matching Figma designs.
 * E.g. "Prof. Eduardo Cruz" -> "PE", "Karen Dela Cruz" -> "KD"
 */
export function getInitials(name: string): string {
  if (!name || !name.trim()) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0].replace(/[^a-zA-Z0-9]/g, '')[0] || '';
    const second = parts[1].replace(/[^a-zA-Z0-9]/g, '')[0] || '';
    const combined = (first + second).toUpperCase();
    if (combined.length === 2) return combined;
  }
  return name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || 'ST';
}

/**
 * Formats a username with leading @
 */
export function formatUsername(username: string): string {
  if (!username) return '@';
  return username.startsWith('@') ? username : `@${username}`;
}
