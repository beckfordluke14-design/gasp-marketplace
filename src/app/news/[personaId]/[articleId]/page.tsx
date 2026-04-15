import { Metadata } from 'next';
import { initialProfiles } from '@/lib/profiles';
import { db } from '@/lib/db';
import ArticleView from './ArticleView';

interface Props {
  params: { personaId: string; articleId: string };
}

/**
 * 🛰️ SEO ARCHITECT: Dynamic Metadata Generator
 * This is what Google sees. We pull the real title and content from the DB
 * to ensure every article has a unique share card and search ranking.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { articleId, personaId } = params;
  
  // Fetch article for metadata
  const { rows } = await db.query('SELECT title, content FROM posts WHERE id = $1', [articleId]);
  const article = rows[0];
  const profile = initialProfiles.find(p => p.id.toLowerCase() === personaId?.toLowerCase());

  if (!article) return { title: 'Intelligence Dispatch | GASP' };

  return {
    title: `${article.title} | ${profile?.name || 'GASP Syndicate'}`,
    description: article.content ? article.content.substring(0, 160) + '...' : 'High-status intelligence and market alerts.',
    openGraph: {
      title: article.title,
      description: article.content ? article.content.substring(0, 160) : '',
      type: 'article',
    }
  };
}

export default async function Page({ params }: Props) {
  const { personaId, articleId } = params;
  
  // Server-side fetch
  const { rows } = await db.query('SELECT * FROM posts WHERE id = $1', [articleId]);
  const article = rows[0];
  const profile = initialProfiles.find(p => p.id.toLowerCase() === personaId?.toLowerCase());

  if (!article || !profile) return null;

  return (
    <ArticleView 
      article={article} 
      profile={profile} 
      personaId={personaId} 
      articleId={articleId} 
    />
  );
}
