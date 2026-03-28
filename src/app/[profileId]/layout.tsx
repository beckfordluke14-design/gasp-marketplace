import { Metadata } from 'next';
import { initialProfiles } from '@/lib/profiles';

type Props = {
  params: Promise<{ profileId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profileId = (await params).profileId;
  const profile = initialProfiles.find(p => p.id.toLowerCase() === profileId.toLowerCase());

  if (!profile) return { title: 'Gasp.fun | Elite Directory' };

  return {
    title: `${profile.name} | Gasp.fun`,
    description: `Following 3 people. Active in her priority circle? Reciprocal connection established. 💎`,
    openGraph: {
      title: `${profile.name} (@gasp.fun)`,
      description: `Selective Connection: Following 3 people. Join ${profile.name}'s inner circle today.`,
      images: [
        {
          url: profile.image || '/v1.png',
          width: 800,
          height: 800,
          alt: profile.name,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.name} | Exclusive`,
      description: `Following only 3 people. Get priority access to ${profile.name}.`,
      images: [profile.image || '/v1.png'],
    },
  };
}

export default function ProfileLandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
