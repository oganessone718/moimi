import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
        <div style={{ fontSize: 52 }} aria-hidden="true">
          🔍
        </div>
        <h1 style={{ font: "var(--text-h2)", color: "var(--text-strong)", margin: 0 }}>
          링크를 찾을 수 없어요
        </h1>
        <p style={{ font: "var(--text-body)", color: "var(--text-medium)", margin: 0 }}>
          만료됐거나 잘못된 모임 링크예요. 주소를 다시 확인해 주세요.
        </p>
        <Link
          href="/"
          style={{
            marginTop: 8,
            font: "var(--fw-bold) var(--fs-body) / 1 var(--font-sans)",
            color: "var(--text-on-primary)",
            background: "var(--color-primary)",
            padding: "14px 24px",
            borderRadius: "var(--radius-full)",
            textDecoration: "none",
          }}
        >
          모이미 홈으로
        </Link>
      </div>
    </div>
  );
}
