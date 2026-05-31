import AttendanceScanClient from "./AttendanceScanClient";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token =
    typeof params.token === 'string' ? params.token : '';

  return <AttendanceScanClient token={token} />;
}