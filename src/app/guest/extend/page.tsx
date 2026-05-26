// src/app/guest/extend/page.tsx

import GuestExtendClient from "./GuestExtendClient";

export default async function GuestExtendPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return <GuestExtendClient token={token} />;
}