import styles from "./ui.module.css";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label"?: string;
};

export function Switch({ checked, onChange, ...rest }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-on={checked}
      className={styles.switch}
      onClick={() => onChange(!checked)}
      {...rest}
    />
  );
}
