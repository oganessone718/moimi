import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getResults } from "@/server/meetings/getMeeting";
import { Badge } from "@/components/ui/Badge";
import styles from "./results.module.css";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
function fmt(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { label: `${m}월 ${d}일`, weekday: DOW[new Date(y, m - 1, d).getDay()] };
}
const TONE = { OPEN: "live", CLOSED: "closed", CONFIRMED: "confirmed" } as const;
const medal = (i: number) => (i === 0 ? "🥇 1위" : i === 1 ? "🥈 2위" : i === 2 ? "🥉 3위" : `${i + 1}위`);

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const r = await getResults(getDb(), shareToken);
  if (!r) notFound();

  const denom = Math.max(r.submittedCount, 1);
  const pct = (n: number) => `${(n / denom) * 100}%`;
  const progressPct = r.total > 0 ? (r.submittedCount / r.total) * 100 : 0;

  return (
    <>
      <div className={styles.head}>
        <Link href={`/m/${shareToken}`} className={styles.logo}>
          moimi
        </Link>
        <h1 className={styles.title}>📊 {r.meeting.title}</h1>
        <div className={styles.progress}>
          <Badge tone={TONE[r.meeting.status]} />
          <span className={styles.txt}>
            <b>
              {r.total}명 중 {r.submittedCount}명
            </b>{" "}
            제출
          </span>
          <span className={styles.bar}>
            <i style={{ width: `${progressPct}%` }} />
          </span>
        </div>
      </div>

      <div className={styles.scroll}>
        {(r.meeting.type === "DATE" || r.meeting.type === "DATE_PLACE") && (
          <section>
            <div className={styles.sectionH}>🗓️ 날짜 결과</div>
            <div className={styles.agg}>
              {r.dateResults.length === 0 && <div className={styles.muted}>날짜 후보가 없어요</div>}
              {r.dateResults.map((d, i) => {
                const f = fmt(d.date);
                return (
                  <div key={d.id} className={`${styles.row} ${i === 0 ? styles.rowLead : ""}`}>
                    <div className={styles.rowTop}>
                      <span className={`${styles.rank} ${i === 0 ? styles.rankLead : ""}`}>
                        {i === 0 ? "🏆 추천" : medal(i)}
                      </span>
                      <span className={styles.date}>
                        {f.label}
                        <span className={styles.dow} data-d={f.weekday}>
                          {" "}
                          ({f.weekday})
                        </span>
                      </span>
                    </div>
                    <div className={styles.bar3}>
                      <i className={styles.y} style={{ width: pct(d.yes) }} />
                      <i className={styles.m} style={{ width: pct(d.maybe) }} />
                      <i className={styles.n} style={{ width: pct(d.no) }} />
                    </div>
                    <div className={styles.counts}>
                      <span>
                        🟢 <b>{d.yes}</b>
                      </span>
                      <span>
                        🟡 <b>{d.maybe}</b>
                      </span>
                      <span>
                        🔴 <b>{d.no}</b>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {(r.meeting.type === "PLACE" || r.meeting.type === "DATE_PLACE") && (
          <section>
            <div className={styles.sectionH}>📍 장소 결과</div>
            <div className={styles.agg}>
              {r.placeResults.length === 0 && <div className={styles.muted}>장소 후보가 없어요</div>}
              {r.placeResults.map((p, i) => (
                <div key={p.id} className={`${styles.row} ${i === 0 ? styles.rowLead : ""}`}>
                  <div className={styles.rowTop}>
                    <span className={`${styles.rank} ${i === 0 ? styles.rankLead : ""}`}>{medal(i)}</span>
                    <span className={styles.date}>{p.name}</span>
                    <span className={styles.likes}>❤️ {p.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className={styles.actionbar}>
        <Link href={`/m/${shareToken}`} className={styles.backBtn}>
          ← 응답 화면으로
        </Link>
      </div>
    </>
  );
}
