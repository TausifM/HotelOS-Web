// src/app/guest/checkout/page.tsx
import GuestCheckoutClient from "./GuestCheckoutClient";

export default async function GuestCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return <GuestCheckoutClient token={token} />;
}