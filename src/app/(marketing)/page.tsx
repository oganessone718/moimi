"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./landing.module.css";

// 받은 링크/코드에서 shareToken 추출. URL이면 /m/ 뒤 또는 마지막 경로조각, 아니면 코드 그대로.
function parseShareToken(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const m = v.match(/\/m\/([^/?#]+)/);
  if (m) return m[1];
  if (/^https?:\/\//i.test(v) || v.includes("/")) {
    const seg = v.split(/[/?#]/).filter(Boolean).pop();
    return seg ?? null;
  }
  return v;
}

export default function LandingPage() {
  const router = useRouter();
  const [navSolid, setNavSolid] = useState(false);
  const joinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const token = parseShareToken(joinRef.current?.value ?? "");
    if (token) router.push(`/m/${encodeURIComponent(token)}`);
  };

  return (
    <>
      <nav className={`${styles.nav} ${navSolid ? styles.navSolid : ""}`}>
        <div className={`${styles.wrap} ${styles.navIn}`}>
          <Link className={styles.brand} href="/">
            moimi<span className={styles.dot} />
          </Link>
          <span className={styles.navSp} />
          {/* 로그인은 선택 기능(S9). 지금은 자리만. */}
          <button className={styles.navLogin} type="button">
            로그인
          </button>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div>
            <span className={styles.eyebrow}>
              <span aria-hidden="true">✨</span>가입 없이 30초면 끝
            </span>
            <h1>
              언제 어디서 볼지,
              <br />
              <span className={styles.hl}>한 번에</span> 정해요
            </h1>
            <p className={styles.heroSub}>
              날짜와 장소를 한 번에 올리고 링크로 공유하세요. 친구들은 톡 누르고
              투표만 하면 끝.
            </p>
            <div className={styles.heroCta}>
              <Link className={styles.btnPrimary} href="/meetings/new">
                약속 만들기 <span className={styles.arr}>→</span>
              </Link>
              <span className={styles.nofee}>
                <span className={styles.chk}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6.2 5 8.6 9.6 3.4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                가입·로그인 없이 바로
              </span>
            </div>
            <div className={styles.heroTrust}>
              <div className={styles.avstack}>
                <span style={{ background: "var(--indigo-500)" }}>민</span>
                <span style={{ background: "var(--accent-500)" }}>현</span>
                <span style={{ background: "var(--sky-500)" }}>지</span>
                <span style={{ background: "var(--vote-yes)" }}>수</span>
              </div>
              모임 약속, 카톡에서 굴리지 말고 한 곳에서
            </div>
          </div>

          <div className={styles.heroArt} aria-hidden="true">
            <svg viewBox="0 0 460 420" role="img">
              <ellipse cx="234" cy="232" rx="208" ry="186" fill="var(--indigo-50)" />
              <circle cx="392" cy="92" r="13" fill="var(--accent-300)" opacity="0.7" />
              <circle cx="58" cy="150" r="9" fill="var(--vote-maybe)" opacity="0.55" />
              <circle cx="74" cy="324" r="11" fill="var(--sky-400)" opacity="0.5" />

              <g className={styles.fl2}>
                <g transform="translate(286 70)">
                  <rect x="0" y="0" width="150" height="118" rx="20" fill="#fff" stroke="var(--border-subtle)" />
                  <rect x="16" y="16" width="118" height="50" rx="11" fill="var(--sky-50)" />
                  <path d="M16 44 H134 M64 16 V66 M100 16 V66" stroke="var(--sky-100)" strokeWidth="3" />
                  <path d="M75 26c-9 0-16 7-16 16 0 11 16 24 16 24s16-13 16-24c0-9-7-16-16-16z" fill="var(--accent-500)" />
                  <circle cx="75" cy="42" r="6" fill="#fff" />
                  <rect x="16" y="78" width="80" height="9" rx="4.5" fill="var(--gray-200)" />
                  <rect x="16" y="95" width="54" height="8" rx="4" fill="var(--gray-100)" />
                  <g transform="translate(108 80)">
                    <rect width="26" height="22" rx="8" fill="var(--accent-500)" opacity="0.15" />
                    <text x="13" y="16" fontSize="13" textAnchor="middle">❤️</text>
                  </g>
                </g>
              </g>

              <g className={styles.fl1}>
                <g transform="translate(40 116)">
                  <rect x="0" y="0" width="252" height="252" rx="26" fill="#fff" stroke="var(--border-subtle)" />
                  <rect x="0" y="0" width="252" height="58" rx="26" fill="var(--color-primary)" />
                  <rect x="0" y="32" width="252" height="26" fill="var(--color-primary)" />
                  <text x="24" y="37" fontWeight="800" fontSize="17" fill="#fff">3월 날짜 정하기</text>
                  <g fontSize="11" fontWeight="700" fill="var(--text-weak)" textAnchor="middle">
                    <text x="40" y="84">월</text>
                    <text x="76" y="84">화</text>
                    <text x="112" y="84">수</text>
                    <text x="148" y="84">목</text>
                    <text x="184" y="84">금</text>
                    <text x="220" y="84">토</text>
                  </g>
                  <g>
                    <rect x="24" y="94" width="32" height="32" rx="9" fill="var(--vote-yes-bg)" />
                    <rect x="60" y="94" width="32" height="32" rx="9" fill="var(--gray-50)" />
                    <rect x="96" y="94" width="32" height="32" rx="9" fill="var(--vote-maybe-bg)" />
                    <rect x="132" y="94" width="32" height="32" rx="9" fill="var(--vote-yes-bg)" />
                    <rect x="168" y="94" width="32" height="32" rx="9" fill="var(--gray-50)" />
                    <rect x="204" y="94" width="32" height="32" rx="9" fill="var(--vote-no-bg)" />
                    <rect x="24" y="130" width="32" height="32" rx="9" fill="var(--gray-50)" />
                    <rect x="60" y="130" width="32" height="32" rx="9" fill="var(--vote-yes-bg)" />
                    <rect x="96" y="130" width="32" height="32" rx="9" fill="var(--vote-yes-bg)" />
                    <rect x="132" y="130" width="32" height="32" rx="9" fill="var(--vote-maybe-bg)" />
                    <rect x="168" y="130" width="32" height="32" rx="9" fill="var(--gray-50)" />
                    <rect x="204" y="130" width="32" height="32" rx="9" fill="var(--gray-50)" />
                    <circle cx="40" cy="110" r="5" fill="var(--vote-yes)" />
                    <circle cx="112" cy="110" r="5" fill="var(--vote-maybe)" />
                    <circle cx="148" cy="110" r="5" fill="var(--vote-yes)" />
                    <circle cx="220" cy="110" r="5" fill="var(--vote-no)" />
                    <circle cx="76" cy="146" r="5" fill="var(--vote-yes)" />
                    <circle cx="112" cy="146" r="5" fill="var(--vote-yes)" />
                    <circle cx="148" cy="146" r="5" fill="var(--vote-maybe)" />
                  </g>
                  <rect x="20" y="180" width="212" height="48" rx="14" fill="var(--indigo-50)" stroke="var(--indigo-200)" />
                  <text x="36" y="203" fontWeight="800" fontSize="15" fill="var(--text-strong)">3월 14일 (토)</text>
                  <text x="36" y="220" fontWeight="600" fontSize="11" fill="var(--vote-yes-text)">가능 4 · 아마도 1</text>
                  <g transform="translate(186 192)">
                    <circle r="15" fill="var(--vote-yes-bg)" />
                    <text y="6" fontSize="16" textAnchor="middle">🏆</text>
                  </g>
                </g>
              </g>

              <g className={styles.fl2}>
                <g transform="translate(20 60)">
                  <circle cx="22" cy="22" r="22" fill="var(--vote-yes)" />
                  <text x="22" y="29" fontWeight="800" fontSize="18" fill="#fff" textAnchor="middle">민</text>
                  <circle cx="38" cy="36" r="10" fill="#fff" />
                  <text x="38" y="40" fontSize="11" textAnchor="middle">🟢</text>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </header>

      <section className={styles.steps}>
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={styles.kicker}>어떻게 쓰나요</div>
            <h2>딱 세 단계면 충분해요</h2>
            <p>복잡한 조율 없이, 만들고 · 뿌리고 · 정하면 끝.</p>
          </div>
          <div className={styles.stepGrid}>
            <article className={styles.step}>
              <span className={styles.stepN}>01</span>
              <div className={styles.stepArt}>
                <svg viewBox="0 0 52 52" fill="none">
                  <rect x="6" y="9" width="30" height="30" rx="7" fill="#fff" stroke="var(--indigo-500)" strokeWidth="2.5" />
                  <path d="M6 17h30" stroke="var(--indigo-500)" strokeWidth="2.5" />
                  <path d="M14 6v6M28 6v6" stroke="var(--indigo-500)" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="15" cy="25" r="2.4" fill="var(--vote-yes)" />
                  <circle cx="23" cy="25" r="2.4" fill="var(--vote-maybe)" />
                  <circle cx="15" cy="32" r="2.4" fill="var(--gray-300)" />
                  <path d="M37 24c-6 0-11 5-11 11 0 8 11 13 11 13s11-5 11-13c0-6-5-11-11-11z" fill="var(--accent-500)" stroke="#fff" strokeWidth="2.5" />
                  <circle cx="37" cy="35" r="4" fill="#fff" />
                </svg>
              </div>
              <h3>
                날짜<b>+</b>장소 한 번에
              </h3>
              <p>되는 날 후보와 가볼 만한 장소를 한 폼에 담아 약속 하나로 만들어요.</p>
            </article>

            <article className={styles.step}>
              <span className={styles.stepN}>02</span>
              <div className={styles.stepArt}>
                <svg viewBox="0 0 52 52" fill="none">
                  <path d="M9 12h26a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H21l-9 7v-7H9V12z" fill="#fff" stroke="var(--sky-500)" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M21 24a4 4 0 0 1 4-4h3" stroke="var(--sky-500)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M31 24a4 4 0 0 1-4 4h-3" stroke="var(--sky-500)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M22 24h8" stroke="var(--sky-500)" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="40" cy="13" r="6" fill="var(--vote-yes)" stroke="#fff" strokeWidth="2" />
                  <path d="M37.5 13 39.3 14.8 42.6 11.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>링크로 카톡 공유</h3>
              <p>만들면 나오는 링크 하나를 단톡방에 톡. 친구들은 앱 설치도 가입도 필요 없어요.</p>
            </article>

            <article className={styles.step}>
              <span className={styles.stepN}>03</span>
              <div className={styles.stepArt}>
                <svg viewBox="0 0 52 52" fill="none">
                  <path d="M16 22h20l-2 14a4 4 0 0 1-4 3.4H22a4 4 0 0 1-4-3.4L16 22z" fill="#fff" stroke="var(--vote-yes)" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M16 22c-5 0-7-3-7-6h6M36 22c5 0 7-3 7-6h-6" stroke="var(--vote-yes)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 39h10" stroke="var(--vote-yes)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M22 28.5 25 31.5 30.5 25.5" stroke="var(--vote-yes)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="13" cy="9" r="2" fill="var(--vote-maybe)" />
                  <circle cx="40" cy="11" r="2.4" fill="var(--accent-500)" />
                </svg>
              </div>
              <h3>
                모두 투표 → <b>확정</b>
              </h3>
              <p>가장 많이 되는 날과 인기 장소가 한눈에. 주최자가 누르면 약속 확정 완료.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.receive}>
        <div className={styles.wrap}>
          <div className={styles.receiveCard}>
            <h2>이미 받은 링크가 있나요?</h2>
            <p>모임 코드나 받은 링크를 붙여넣으면 바로 투표하러 가요.</p>
            <form className={styles.receiveForm} onSubmit={goJoin}>
              <input
                ref={joinRef}
                type="text"
                placeholder="moimi.kr/abc123  또는  참여 코드"
                aria-label="모임 링크 또는 코드"
              />
              <button type="submit">투표하러 가기</button>
            </form>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerIn}`}>
          <Link className={styles.brand} href="/">
            moimi<span className={styles.dot} />
          </Link>
          <span className={styles.footerSp} />
          <a href="#">이용약관</a>
          <a href="#">개인정보</a>
          <a href="#">문의</a>
          <span style={{ width: "100%", color: "var(--text-disabled)", marginTop: 4 }}>
            © 2026 moimi · 약속, 가입 없이 한 번에
          </span>
        </div>
      </footer>
    </>
  );
}
