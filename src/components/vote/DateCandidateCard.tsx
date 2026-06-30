import { VoteCell, type Vote } from "./VoteCell";
import styles from "./vote.module.css";

type Props = {
  date: string; // 표시용 라벨 (예: "3월 14일")
  weekday?: string; // 요일 (예: "토")
  value: Vote | null;
  onChange: (v: Vote) => void;
  yes?: number;
  maybe?: number;
  lead?: boolean;
};

export function DateCandidateCard({
  date,
  weekday,
  value,
  onChange,
  yes,
  maybe,
  lead = false,
}: Props) {
  const showCounts = yes !== undefined || maybe !== undefined;
  return (
    <div className={`${styles.card} ${lead ? styles.cardLead : ""}`}>
      <div className={styles.head}>
        <span className={styles.date}>
          {date}
          {weekday && (
            <span className={styles.dow} data-d={weekday}>
              ({weekday})
            </span>
          )}
        </span>
        {showCounts && (
          <span className={styles.counts}>
            <span>
              🟢 <b>{yes ?? 0}</b>
            </span>
            <span>
              🟡 <b>{maybe ?? 0}</b>
            </span>
          </span>
        )}
      </div>
      <VoteCell value={value} onChange={onChange} block />
    </div>
  );
}
