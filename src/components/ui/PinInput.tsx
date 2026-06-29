"use client";

import { useRef } from "react";
import styles from "./ui.module.css";

type Props = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
};

// 숫자 PIN 입력. 셀당 한 자리, 자동 포커스 이동. (관리자 PIN 4자리 — D14)
export function PinInput({
  length = 4,
  value,
  onChange,
  onComplete,
  error = false,
}: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const setAt = (i: number, d: string) => {
    const next = (value.slice(0, i) + d + value.slice(i + 1)).slice(0, length);
    onChange(next);
    if (d && i < length - 1) refs.current[i + 1]?.focus();
    if (next.length === length && !next.includes("") && onComplete) {
      onComplete(next);
    }
  };

  return (
    <div className={`${styles.pin} ${error ? styles.pinErr : ""}`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={styles.pinCell}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={d}
          aria-label={`PIN ${i + 1}번째 자리`}
          onChange={(e) => {
            const only = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, only);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
