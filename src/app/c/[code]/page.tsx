import { redirect } from 'next/navigation';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

async function resolveCode(code: string) {
  const res = await fetch(
    `${API_URL}/api/chatbot/guest/resolve/${encodeURIComponent(code)}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    // You can redirect to a custom expired/invalid page if you want
    redirect('/404');
  }

  const json = await res.json();
  // Expect backend to return { success: true, data: { token: '...' } }
  const token = json?.data?.token as string | undefined;

  if (!token) {
    redirect('/404');
  }

  // This matches your existing guest-chat/[token]/page.tsx route
  redirect(`/guest-chat/${encodeURIComponent(token)}`);
}

export default async function ShortGuestChatRedirect({
  params,
}: {
  params: { code: string };
}) {
  await resolveCode(params.code);
  return null;
}