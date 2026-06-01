// src/app/c/[code]/page.tsx
import { redirect } from 'next/navigation';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

type PageProps = {
  params: {
    code: string;
  };
};

async function resolveCode(code: string) {
  const res = await fetch(
    `${API_URL}/api/chatbot/guest/resolve/${encodeURIComponent(code)}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    redirect('/404');
  }

  const json = await res.json();
  const token = json?.data?.token as string | undefined;

  if (!token) {
    redirect('/404');
  }

  redirect(`/guest-chat/${encodeURIComponent(token)}`);
}

export default async function ShortGuestChatRedirect({ params }: PageProps) {
  await resolveCode(params.code);
  return null;
}