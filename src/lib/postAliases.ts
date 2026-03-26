/**
 * POST ALIAS SYSTEM
 * 
 * Stores per-post display overrides in localStorage.
 * These override what's shown in the feed WITHOUT touching the personas table.
 * If you want a post to show "Sofia, 24, Miami" instead of "Isabella, 28, Newark",
 * set an alias for that post ID.
 * 
 * Applied site-wide: GlobalFeed reads aliases before rendering every post.
 */

export interface PostAlias {
  displayName?: string;   // override persona.name for this post
  displayAge?: string;    // override persona.age for this post
  displayCity?: string;   // override persona.city for this post
}

const ALIAS_KEY = 'gasp_post_aliases';

export function getAllAliases(): Record<string, PostAlias> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(ALIAS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getAlias(postId: string): PostAlias {
  return getAllAliases()[postId] || {};
}

export function setAlias(postId: string, alias: PostAlias) {
  const all = getAllAliases();
  all[postId] = { ...all[postId], ...alias };
  // Remove empty values
  Object.keys(all[postId]).forEach(k => {
    if (!all[postId][k as keyof PostAlias]) delete all[postId][k as keyof PostAlias];
  });
  if (Object.keys(all[postId]).length === 0) delete all[postId];
  localStorage.setItem(ALIAS_KEY, JSON.stringify(all));
  // Dispatch storage event so other tabs/components react
  window.dispatchEvent(new StorageEvent('storage', { key: ALIAS_KEY }));
}

export function clearAlias(postId: string) {
  const all = getAllAliases();
  delete all[postId];
  localStorage.setItem(ALIAS_KEY, JSON.stringify(all));
  window.dispatchEvent(new StorageEvent('storage', { key: ALIAS_KEY }));
}

/** Apply alias overrides to a persona+broadcast combo for display */
export function applyAliases(
  postId: string,
  persona: { name: string; age?: number | string; city?: string },
  alias?: PostAlias
): { name: string; age: string; city: string } {
  const a = alias || getAlias(postId);
  return {
    name:  a.displayName ?? persona.name,
    age:   a.displayAge  ?? String(persona.age  ?? '22'),
    city:  a.displayCity ?? String(persona.city ?? ''),
  };
}
