import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

/**
 * 🛰️ SOVEREIGN SITEMAP: Dynamic Indexing Engine
 * Purpose: Ensure Google indexes every Agent profile and News story automatically.
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gasp.fun'

  // 1. Core Platform Nodes (GASP Shell)
  const coreRoutes = [
    '',
    '/news',
    '/vault',
    '/pulse',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  try {
    // 2. Fetch all Intelligence Agents (Personas)
    const { rows: personas } = await db.query('SELECT id, updated_at FROM personas WHERE is_active = true')
    const personaRoutes = personas.map((p) => ({
      url: `${baseUrl}/profile/${p.id}`,
      lastModified: new Date(p.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // 3. Fetch all Intelligence Dispatches (Archive Stories)
    const { rows: posts } = await db.query('SELECT id, caption as title, created_at FROM posts ORDER BY created_at DESC')
    const articleRoutes = posts.map((post) => {
      const slug = (post.title || 'intelligence')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      
      return {
        url: `${baseUrl}/archive/${post.id}?slug=${slug}`,
        lastModified: new Date(post.created_at || new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    })

    return [...coreRoutes, ...personaRoutes, ...articleRoutes]
  } catch (error) {
    console.error('🛰️ SITEMAP_SYNC_ERROR:', error);
    // Fallback: Always return core routes so Google doesn't see a "Couldn't fetch" error.
    return coreRoutes;
  }
}
