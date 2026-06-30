import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getMeetingByShareToken } from "@/server/meetings/getMeeting";
import { getAdminSession } from "@/lib/auth/admin-cookie";
import { GuestResponse } from "./GuestResponse";

// 게스트 응답 진입점 (무가입). 동적 — 요청 시 shareToken으로 모임 조회.
export default async function GuestPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const data = await getMeetingByShareToken(getDb(), shareToken);
  if (!data) notFound();

  const session = await getAdminSession(data.meeting.id);

  return (
    <GuestResponse
      shareToken={shareToken}
      title={data.meeting.title}
      status={data.meeting.status}
      type={data.meeting.type}
      initialIsAdmin={!!session}
      dates={data.dateOptions.map((d) => ({ id: d.id, date: d.date }))}
      places={data.places.map((p) => ({ id: p.id, name: p.name, emoji: "📍" }))}
    />
  );
}
