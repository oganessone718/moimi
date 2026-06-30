import styles from "./vote.module.css";

export type Vote = "yes" | "maybe" | "no";

const OPTS: { v: Vote; icon: string; label: string }[] = [
  { v: "yes", icon: "🟢", label: "가능" },
  { v: "maybe", icon: "🟡", label: "아마도" },
  { v: "no", icon: "🔴", label: "불가" },
];

type Props = {
  value: Vote | null;
  onChange: (v: Vote) => void;
  block?: boolean;
};

export function VoteCell({ value, onChange, block = false }: Props) {
  return (
    <div className={`${styles.cell} ${block ? styles.block : ""}`} role="group">
      {OPTS.map((o) => (
        <button
          key={o.v}
          type="button"
          className={styles.opt}
          data-v={o.v}
          data-on={value === o.v}
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
        >
          <span aria-hidden="true">{o.icon}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}
