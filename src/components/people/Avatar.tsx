import styles from "./people.module.css";

const COLORS = [
  "var(--indigo-500)",
  "var(--accent-500)",
  "var(--sky-500)",
  "var(--vote-yes)",
  "var(--vote-maybe)",
  "var(--indigo-700)",
];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

type Props = { name: string; size?: number };

export function Avatar({ name, size = 32 }: Props) {
  const initial = [...name][0] ?? "?";
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
