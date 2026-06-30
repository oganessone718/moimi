import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getMeetingByShareToken } from "@/server/meetings/getMeeting";
import { Badge } from "@/components/ui/Badge";
import { ShareButton } from "@/components/share/ShareButton";
import styles from "./confirmed.module.css";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
function fmt(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${m}월 ${d}일 (${DOW[new Date(y, m - 1, d).getDay()]})`;
}

export default async function ConfirmedPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const data = await getMeetingByShareToken(getDb(), shareToken);
  if (!data) notFound();

  const { meeting, dateOptions, places } = data;

  if (meeting.status !== "CONFIRMED") {
    return (
      <div className={styles.pending}>
        <div className={styles.hi} aria-hidden="true">
          🗳️
        </div>
        <div className={styles.title} style={{ font: "var(--text-h2)" }}>
          아직 확정 전이에요
        </div>
        <p className={styles.sub}>주최자가 날짜·장소를 확정하면 여기에 표시돼요.</p>
        <Link href={`/m/${shareToken}/results`} className={styles.back}>
          결과 보러가기 →
        </Link>
      </div>
    );
  }

  const confirmedDate = dateOptions.find((d) => d.id === meeting.confirmedSlotId);
  const confirmedPlace = places.find((p) => p.id === meeting.confirmedPlaceId);
  const shareUrl = `https://moimi.app/m/${shareToken}`;

  return (
    <div className={styles.wrap}>
      <Link href="/" className={styles.logo}>
        moimi
      </Link>
      <div className={styles.hi} aria-hidden="true">
        🎉
      </div>
      <h1 className={styles.title}>약속이 확정됐어요!</h1>
      <p className={styles.sub}>아래 내용으로 만나요.</p>

      <div className={styles.card}>
        <div className={styles.band}>
          <b>{meeting.title}</b>
          <Badge tone="confirmed" />
        </div>
        {confirmedDate && (
          <div className={styles.row}>
            <div className={styles.ic}>🗓️</div>
            <div>
              <div className={styles.k}>언제</div>
              <div className={styles.v}>{fmt(confirmedDate.date)}</div>
            </div>
          </div>
        )}
        {confirmedPlace && (
          <div className={styles.row}>
            <div className={styles.ic}>📍</div>
            <div>
              <div className={styles.k}>어디서</div>
              <div className={styles.v}>{confirmedPlace.name}</div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <ShareButton variant="kakao">카카오톡으로 확정 공유하기</ShareButton>
        <ShareButton variant="copy" copyText={shareUrl} />
      </div>

      <p className={styles.note}>📅 캘린더 추가(.ics)는 v1.1에서 제공돼요</p>
      <Link href={`/m/${shareToken}/results`} className={styles.back}>
        ← 결과 보기
      </Link>
    </div>
  );
}
