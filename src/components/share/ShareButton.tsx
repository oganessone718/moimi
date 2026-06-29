"use client";

import { useState, type ReactNode } from "react";
import styles from "./share.module.css";

type Props = {
  variant: "kakao" | "copy";
  copyText?: string;
  children?: ReactNode;
};

// 카카오 공유는 S4에서 Kakao SDK 연결. 지금은 자리(클릭 시 안내).
export function ShareButton({ variant, copyText, children }: Props) {
  const [copied, setCopied] = useState(false);

  if (variant === "copy") {
    return (
      <button
        type="button"
        className={styles.copy}
        onClick={async () => {
          if (copyText && navigator.clipboard) {
            await navigator.clipboard.writeText(copyText);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }
        }}
      >
        <span aria-hidden="true">🔗</span>
        {copied ? "복사됐어요!" : (children ?? "링크 복사")}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={styles.kakao}
      // TODO(S4): Kakao Share SDK 연결
      onClick={() => {}}
    >
      <span aria-hidden="true">💬</span>
      {children ?? "카카오톡 공유"}
    </button>
  );
}
