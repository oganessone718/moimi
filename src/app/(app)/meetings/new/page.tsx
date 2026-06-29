"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { PinInput } from "@/components/ui/PinInput";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { PlaceCard } from "@/components/place/PlaceCard";
import { ShareButton } from "@/components/share/ShareButton";
import styles from "./wizard.module.css";

type MeetingType = "both" | "date" | "place";
type NewPlace = { name: string; emoji: string; description?: string; location?: string };

const TYPES: { id: MeetingType; ico: string; tt: string; td: string }[] = [
  { id: "both", ico: "🗓️", tt: "날짜 + 장소", td: "언제 + 어디서를 한 번에" },
  { id: "date", ico: "📅", tt: "날짜만", td: "모일 날짜만 정해요" },
  { id: "place", ico: "📍", tt: "장소만", td: "만날 곳만 정해요" },
];
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function MonthCalendar({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (date: string) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const first = new Date(ym.y, ym.m, 1).getDay();
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  const shift = (delta: number) => {
    const d = new Date(ym.y, ym.m + delta, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() });
  };
  return (
    <div className={styles.cal}>
      <div className={styles.calHead}>
        <button className={styles.calNav} aria-label="이전 달" onClick={() => shift(-1)}>
          ‹
        </button>
        <span className={styles.calMon}>
          {ym.y}년 {ym.m + 1}월
        </span>
        <button className={styles.calNav} aria-label="다음 달" onClick={() => shift(1)}>
          ›
        </button>
      </div>
      <div className={styles.calDow}>
        {DOW.map((d, i) => (
          <span key={d} className={i === 0 ? styles.sun : i === 6 ? styles.sat : ""}>
            {d}
          </span>
        ))}
      </div>
      <div className={styles.calGrid}>
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} className={`${styles.day} ${styles.empty}`} />;
          const wd = i % 7;
          const key = iso(ym.y, ym.m, d);
          return (
            <button
              key={key}
              className={`${styles.day} ${wd === 0 ? styles.sun : wd === 6 ? styles.sat : ""}`}
              aria-pressed={selected.has(key)}
              onClick={() => onToggle(key)}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CreateWizardPage() {
  const [type, setType] = useState<MeetingType>("both");
  const [title, setTitle] = useState("");
  const [dates, setDates] = useState<Set<string>>(new Set());
  const [places, setPlaces] = useState<NewPlace[]>([]);
  const [placeInput, setPlaceInput] = useState("");
  const [allowGuestAddPlace, setAllowGuestAddPlace] = useState(true);
  const [deadline, setDeadline] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [pin, setPin] = useState("");

  // 유형별 스텝 구성 (시간은 MVP 제외 — D14)
  const stepIds = useMemo(
    () => [
      "basic",
      ...(type !== "place" ? ["date"] : []),
      ...(type !== "date" ? ["place"] : []),
      "options",
      "share",
    ],
    [type],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const i = Math.min(stepIndex, stepIds.length - 1);
  const id = stepIds[i];

  // createMeeting 서버액션(S2)이 발급할 shareToken. 지금은 공유 스텝 진입 시 데모 토큰 생성.
  const [demoToken, setDemoToken] = useState("");
  const shareUrl = `moimi.app/m/${demoToken || "······"}`;

  const toggleDate = (d: string) =>
    setDates((s) => {
      const n = new Set(s);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });
  const linkDetected = /^https?:\/\//i.test(placeInput.trim());
  const addPlace = () => {
    const v = placeInput.trim();
    if (!v) return;
    setPlaces((p) => [
      ...p,
      linkDetected
        ? { name: "지도로 추가한 장소", emoji: "🔗", location: "🔗 지도 링크 연결됨" }
        : { name: v, emoji: "📍" },
    ]);
    setPlaceInput("");
  };

  const canNext =
    id === "basic" ? title.trim().length > 0 : id === "options" ? pin.length >= 4 : true;
  const isLastForm = id === "options";
  const next = () => {
    const ni = Math.min(i + 1, stepIds.length - 1);
    // 공유 스텝 진입 시 데모 토큰 발급(실제 토큰은 createMeeting 서버액션 — S2).
    if (stepIds[ni] === "share" && !demoToken) {
      setDemoToken(Math.random().toString(36).slice(2, 8).toUpperCase());
    }
    setStepIndex(ni);
  };
  const back = () => setStepIndex((n) => Math.max(n - 1, 0));

  const TITLES: Record<string, [string, string]> = {
    basic: ["기본 정보", "어떤 모임인가요? 제목과 유형을 정해요."],
    date: ["날짜 후보", "모일 수 있는 날짜를 모두 골라주세요."],
    place: ["장소 후보", "후보 장소를 추가해요. 링크를 붙여도 카드가 돼요."],
    options: ["옵션 & 관리 PIN", "마감과 공개 방식을 정하고, 관리 PIN을 설정해요."],
    share: ["", ""],
  };

  const sortedDates = [...dates].sort();

  return (
    <>
      {id !== "share" && (
        <div className={styles.topbar}>
          <Link href="/" className={styles.close} aria-label="닫기">
            ✕
          </Link>
          <div className={styles.stepsWrap}>
            <StepIndicator steps={stepIds.length} current={i} />
          </div>
          <span style={{ width: 36 }} />
        </div>
      )}

      <div className={styles.scroll} key={id}>
        {id !== "share" && (
          <>
            <h1 className={styles.steptitle}>{TITLES[id][0]}</h1>
            <p className={styles.stepdesc}>{TITLES[id][1]}</p>
          </>
        )}

        {id === "basic" && (
          <div className={styles.blockgap}>
            <Input
              label="모임 제목"
              placeholder="예: 이번 주 동아리 모임 🍻"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div>
              <span className={styles.fieldlbl}>모임 유형</span>
              <div className={styles.typegrid}>
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    className={styles.typecard}
                    aria-pressed={type === t.id}
                    onClick={() => setType(t.id)}
                  >
                    <span className={styles.ico} aria-hidden="true">
                      {t.ico}
                    </span>
                    <span>
                      <span className={styles.tt}>{t.tt}</span>
                      <span className={styles.td}>{t.td}</span>
                    </span>
                    <span className={styles.chk} aria-hidden="true">
                      {type === t.id ? "✓" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {id === "date" && (
          <div className={styles.blockgap}>
            {sortedDates.length === 0 ? (
              <div className={styles.datechipsEmpty}>아래 달력에서 날짜를 골라주세요</div>
            ) : (
              <div className={styles.datechips}>
                {sortedDates.map((d) => (
                  <span key={d} className={styles.datechip}>
                    <span>{d.slice(5).replace("-", "/")}</span>
                    <button aria-label={`${d} 빼기`} onClick={() => toggleDate(d)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <MonthCalendar selected={dates} onToggle={toggleDate} />
          </div>
        )}

        {id === "place" && (
          <div>
            <span className={styles.fieldlbl}>장소 추가</span>
            <div className={styles.addrow}>
              <div className="grow" style={{ flex: 1 }}>
                <Input
                  placeholder="이름 또는 지도 링크 붙여넣기"
                  value={placeInput}
                  onChange={(e) => setPlaceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addPlace();
                  }}
                />
              </div>
              <Button variant="primary" onClick={addPlace}>
                추가
              </Button>
            </div>
            {linkDetected && (
              <p className={styles.pinnote} style={{ color: "var(--indigo-600)" }}>
                🔗 지도 링크가 감지됐어요 — 추가하면 자동 연결돼요
              </p>
            )}
            <div className={styles.placelist}>
              {places.map((p, idx) => (
                <PlaceCard
                  key={idx}
                  name={p.name}
                  emoji={p.emoji}
                  description={p.description}
                  distance={p.location}
                  showComments={false}
                  onRemove={() => setPlaces((ps) => ps.filter((_, n) => n !== idx))}
                />
              ))}
            </div>
            <div className={styles.optrow} style={{ marginTop: 12 }}>
              <span>
                <span className={styles.ot}>참가자도 추가 가능</span>
                <span className={styles.od}>게스트가 직접 장소를 더할 수 있어요</span>
              </span>
              <Switch checked={allowGuestAddPlace} onChange={setAllowGuestAddPlace} />
            </div>
          </div>
        )}

        {id === "options" && (
          <div>
            <div className={styles.optrow}>
              <span>
                <span className="ot" style={{ font: "var(--text-body-strong)", color: "var(--text-strong)" }}>
                  투표 마감일
                </span>
                <span style={{ display: "block", font: "var(--text-caption)", color: "var(--text-medium)", marginTop: 2 }}>
                  이후엔 투표가 잠겨요
                </span>
              </span>
              <input
                className={styles.dateinput}
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className={styles.optrow}>
              <span>
                <span style={{ font: "var(--text-body-strong)", color: "var(--text-strong)" }}>익명 투표</span>
                <span style={{ display: "block", font: "var(--text-caption)", color: "var(--text-medium)", marginTop: 2 }}>
                  누가 뭘 골랐는지 숨겨요
                </span>
              </span>
              <Switch checked={anonymous} onChange={setAnonymous} />
            </div>
            <div className={styles.pinwrap}>
              <span className={styles.fieldlbl}>
                관리자 PIN <span style={{ color: "var(--color-primary)" }}>*</span>
              </span>
              <PinInput length={4} value={pin} onChange={setPin} />
              <div className={styles.pinnote}>
                🔒 가입 없이 모임을 관리하려면 PIN이 꼭 필요해요. 잊지 마세요!
              </div>
            </div>
          </div>
        )}

        {id === "share" && (
          <div className={styles.done}>
            <div className={styles.doneEmoji} aria-hidden="true">
              🎉
            </div>
            <h1 className={styles.doneTitle}>모임이 만들어졌어요!</h1>
            <p className={styles.doneSub}>링크를 카톡에 공유하고 투표를 받아보세요.</p>
            <div className={styles.linkbox}>
              <span aria-hidden="true">🔗</span>
              <span className={styles.url}>{shareUrl}</span>
            </div>
            <div className={styles.shareCol}>
              <ShareButton variant="kakao">카카오톡으로 초대하기</ShareButton>
              <ShareButton variant="copy" copyText={`https://${shareUrl}`} />
            </div>
            <div className={styles.pinremind}>
              <span aria-hidden="true">🔑</span>
              <span className={styles.pt}>
                관리 PIN <b>{pin || "••••"}</b> 을(를) 기억하세요. 모임 마감·확정에 필요해요.
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.actionbar}>
        {id === "share" ? (
          <Button variant="primary" size="lg" block onClick={() => { window.location.href = `/m/${demoToken}`; }}>
            모임 현황 보러가기
          </Button>
        ) : (
          <>
            {i > 0 && (
              <Button variant="ghost" size="lg" onClick={back}>
                뒤로
              </Button>
            )}
            <Button variant="primary" size="lg" block disabled={!canNext} onClick={next}>
              {isLastForm ? "모임 만들기 🙌" : "다음"}
            </Button>
          </>
        )}
      </div>
    </>
  );
}
