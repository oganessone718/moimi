import styles from "./ui.module.css";

type Props = {
  steps: number;
  current: number; // 0-index
};

export function StepIndicator({ steps, current }: Props) {
  return (
    <div className={styles.steps} aria-label={`${current + 1}/${steps} 단계`}>
      {Array.from({ length: steps }, (_, i) => (
        <span
          key={i}
          className={styles.stepDot}
          data-state={i < current ? "done" : i === current ? "current" : "todo"}
        />
      ))}
    </div>
  );
}
