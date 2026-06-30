import type { ReactNode } from "react";
import styles from "./app-shell.module.css";

// 앱 화면 공통 셸: 모바일 우선 중앙 컬럼(카톡 인앱 트래픽 다수). 디자인의 phone 목업 대신
// 실제 반응형 — 좁은 화면은 꽉 차고, 넓은 화면은 가운데 컬럼.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>{children}</div>
    </div>
  );
}
