import { Metadata } from 'next';
import { initialPersonas } from '@/lib/profiles';

type Props = {
  params: Promise<{ personaId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const personaId = (await params).personaId;
  const persona = initialPersonas.find(p => p.id.toLowerCase() === personaId.toLowerCase());

  if (!persona) return { title: 'Gasp.fun | Elite Directory' };

  return {
    title: `${persona.name} | Gasp.fun`,
    description: `Following 3 people. Active in her priority circle? Reciprocal connection established. 💎`,
    openGraph: {
      title: `${persona.name} (@gasp.fun)`,
      description: `Selective Connection: Following 3 people. Join ${persona.name}'s inner circle today.`,
      images: [
        {
          url: persona.image || '/v1.png',
          width: 800,
          height: 800,
          alt: persona.name,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${persona.name} | Exclusive`,
      description: `Following only 3 people. Get priority access to ${persona.name}.`,
      images: [persona.image || '/v1.png'],
    },
  };
}

export default function PersonaLandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
