import styles from "./ui.module.css";

type Tone = "live" | "closed" | "confirmed";

const LABEL: Record<Tone, string> = {
  live: "🟢 진행 중",
  closed: "🔒 마감",
  confirmed: "🎉 확정",
};

export function Badge({ tone }: { tone: Tone }) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {LABEL[tone]}
    </span>
  );
}
