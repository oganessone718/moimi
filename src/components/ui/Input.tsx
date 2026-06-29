import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import styles from "./ui.module.css";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  required?: boolean;
  helpText?: string;
};

export function Input({ label, required, helpText, id, ...rest }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
          {required && <span className={styles.req}>*</span>}
        </label>
      )}
      <input id={inputId} className={styles.input} {...rest} />
      {helpText && <span className={styles.help}>{helpText}</span>}
    </div>
  );
}
