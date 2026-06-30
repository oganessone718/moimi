"use client";

import type { Vote } from "@/components/vote/VoteCell";
import styles from "./guest.module.css";

type DateOpt = { id: string; date: string };
type Props = {
  dates: DateOpt[];
  votes: Record<string, Vote>;
  onVote: (id: string, v: Vote) => void;
};

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const NEXT: Record<string, Vote> = { "": "yes", yes: "maybe", maybe: "no", no: "yes" };

function tint(v: Vote | undefined) {
  if (v === "yes") return { background: "var(--vote-yes-bg)", borderColor: "var(--vote-yes)" };
  if (v === "maybe") return { background: "var(--vote-maybe-bg)", borderColor: "var(--vote-maybe)" };
  if (v === "no") return { background: "var(--vote-no-bg)", borderColor: "var(--vote-no)" };
  return undefined;
}

// 후보 날짜를 월별 그리드로. 후보 칸 탭 → 가능/아마도/불가 순환.
export function CalendarVote({ dates, votes, onVote }: Props) {
  // 후보를 연-월로 그룹
  const byMonth = new Map<string, Map<number, string>>(); // "y-m" -> day -> dateOptionId
  for (const d of dates) {
    const [y, m, day] = d.date.split("-").map(Number);
    const key = `${y}-${m}`;
    if (!byMonth.has(key)) byMonth.set(key, new Map());
    byMonth.get(key)!.set(day, d.id);
  }
  const months = [...byMonth.keys()].sort((a, b) => {
    const [ay, am] = a.split("-").map(Number);
    const [by, bm] = b.split("-").map(Number);
    return ay - by || am - bm;
  });

  return (
    <>
      <p className={styles.calHint}>📌 날짜 칸을 탭하면 가능 여부가 바뀌어요 (🟢→🟡→🔴)</p>
      {months.map((key) => {
        const [y, m] = key.split("-").map(Number);
        const firstDow = new Date(y, m - 1, 1).getDay();
        const days = new Date(y, m, 0).getDate();
        const cells: (number | null)[] = [
          ...Array.from({ length: firstDow }, () => null),
          ...Array.from({ length: days }, (_, i) => i + 1),
        ];
        const dayMap = byMonth.get(key)!;
        return (
          <div className={styles.cal} key={key}>
            <div className={styles.calMon}>
              {y}년 {m}월
            </div>
            <div className={styles.calDow}>
              {DOW.map((d, i) => (
                <span key={d} className={i === 0 ? styles.sun : i === 6 ? styles.sat : ""}>
                  {d}
                </span>
              ))}
            </div>
            <div className={styles.calGrid}>
              {cells.map((day, i) => {
                if (day === null) return <span key={`e${i}`} className={`${styles.vcell} ${styles.vcellDim}`} />;
                const id = dayMap.get(day);
                if (!id)
                  return (
                    <span key={day} className={`${styles.vcell} ${styles.vcellDim}`}>
                      {day}
                    </span>
                  );
                const v = votes[id];
                return (
                  <button
                    key={day}
                    className={styles.vcell}
                    style={tint(v)}
                    aria-label={`${m}월 ${day}일 투표`}
                    onClick={() => onVote(id, NEXT[v ?? ""])}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
