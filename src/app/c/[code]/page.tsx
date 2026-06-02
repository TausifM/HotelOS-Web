import { redirect } from 'next/navigation';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export default async function ShortGuestChatRedirect(
  props: { params: Promise<{ code: string }> }
) {
  const { code } = await props.params;

  const res = await fetch(
    `${API_URL}/api/chatbot/guest/resolve/${encodeURIComponent(code)}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    // TEMP: show plain text to debug; replace with redirect later
    const text = await res.text();
    return (
      <html>
        <body>
          <pre>Resolve failed: {res.status} {res.statusText}{'\n'}{text}</pre>
        </body>
      </html>
    );
  }

  const json = await res.json();
  const token = json?.data?.token as string | undefined;

  if (!token) {
    return (
      <html>
        <body>
          <pre>No token in response</pre>
        </body>
      </html>
    );
  }

  redirect(`/guest-chat/${encodeURIComponent(token)}`);
}