"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { NicknameChip } from "@/components/people/NicknameChip";
import { DateCandidateCard } from "@/components/vote/DateCandidateCard";
import type { Vote } from "@/components/vote/VoteCell";
import { PlaceCard } from "@/components/place/PlaceCard";
import { submitResponseAction } from "@/server/meetings/actions";
import styles from "./guest.module.css";

type DateOpt = { id: string; date: string };
type PlaceOpt = { id: string; name: string; emoji: string };
type Status = "OPEN" | "CLOSED" | "CONFIRMED";

type Props = {
  shareToken: string;
  title: string;
  status: Status;
  dates: DateOpt[];
  places: PlaceOpt[];
};

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  return { label: `${m}월 ${d}일`, weekday: DOW[wd] };
}
const TONE: Record<Status, "live" | "closed" | "confirmed"> = {
  OPEN: "live",
  CLOSED: "closed",
  CONFIRMED: "confirmed",
};

export function GuestResponse({ shareToken, title, status, dates, places }: Props) {
  const [joined, setJoined] = useState(false);
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");

  const [tab, setTab] = useState<"date" | "place" | "me">("date");
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const locked = status !== "OPEN";
  const answered = Object.keys(votes).length;
  const likedCount = Object.values(likes).filter(Boolean).length;
  const canSubmit = answered > 0 && !locked;

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await submitResponseAction({
        shareToken,
        nickname,
        editPin: pin || null,
        dateVotes: Object.entries(votes).map(([dateOptionId, v]) => ({
          dateOptionId,
          vote: v.toUpperCase() as "YES" | "MAYBE" | "NO",
        })),
        placeLikes: Object.entries(likes)
          .filter(([, on]) => on)
          .map(([id]) => id),
      });
      if (res.ok) {
        setSubmitted(true);
      } else if (res.reason === "pin_mismatch") {
        setError("이 닉네임은 PIN으로 보호돼 있어요. PIN이 일치하지 않습니다.");
      } else {
        setError("제출할 수 없어요. 모임이 마감됐거나 링크가 올바르지 않아요.");
      }
    } catch {
      setError("제출 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- 참여(닉네임) 게이트 -----
  if (!joined) {
    return (
      <div className={styles.join}>
        <div>
          <div className={styles.joinTitle}>{title}</div>
          <p className={styles.joinSub}>닉네임만 입력하면 바로 참여할 수 있어요</p>
        </div>
        <Input
          label="닉네임"
          placeholder="예: 민지"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
        <Input
          label="응답 PIN (선택)"
          helpText="설정하면 다른 기기에서도 내 응답을 안전하게 수정할 수 있어요"
          placeholder="숫자 4자리"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <Button
          variant="primary"
          size="lg"
          block
          disabled={!nickname.trim()}
          onClick={() => setJoined(true)}
        >
          참여하기
        </Button>
      </div>
    );
  }

  const yesDates = dates.filter((d) => votes[d.id] === "yes");
  const maybeDates = dates.filter((d) => votes[d.id] === "maybe");
  const likedPlaces = places.filter((p) => likes[p.id]);

  return (
    <>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <Link href="/" className={styles.logo}>
            moimi
          </Link>
        </div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.sub}>
          <Badge tone={TONE[status]} />
          <NicknameChip name={nickname} selected />
          <span className={styles.muted}>(으)로 참여 중</span>
        </div>
      </div>

      <div className={styles.tabs} role="tablist">
        <button role="tab" aria-selected={tab === "date"} className={styles.tab} onClick={() => setTab("date")}>
          🗓️ 날짜 <span className={styles.cnt}>{answered}/{dates.length}</span>
        </button>
        <button role="tab" aria-selected={tab === "place"} className={styles.tab} onClick={() => setTab("place")}>
          📍 장소 {likedCount > 0 && <span className={styles.cnt}>♥ {likedCount}</span>}
        </button>
        <button role="tab" aria-selected={tab === "me"} className={styles.tab} onClick={() => setTab("me")}>
          🙋 내 응답
        </button>
      </div>

      <div className={styles.scroll} key={tab}>
        {tab === "date" && (
          <>
            <div className={styles.sectlabel}>가능한 날에 표시해주세요</div>
            {dates.length === 0 && <div className={styles.muted}>날짜 후보가 없어요</div>}
            {dates.map((d) => {
              const f = fmtDate(d.date);
              return (
                <DateCandidateCard
                  key={d.id}
                  date={f.label}
                  weekday={f.weekday}
                  value={votes[d.id] ?? null}
                  onChange={(v) => {
                    setVotes((s) => ({ ...s, [d.id]: v }));
                    setSubmitted(false);
                  }}
                />
              );
            })}
          </>
        )}

        {tab === "place" && (
          <>
            <div className={styles.sectlabel}>마음에 드는 곳에 하트를 눌러주세요</div>
            {places.length === 0 && <div className={styles.muted}>장소 후보가 없어요</div>}
            {places.map((p) => (
              <PlaceCard
                key={p.id}
                name={p.name}
                emoji={p.emoji}
                liked={!!likes[p.id]}
                showComments={false}
                onToggleLike={() => {
                  setLikes((s) => ({ ...s, [p.id]: !s[p.id] }));
                  setSubmitted(false);
                }}
              />
            ))}
          </>
        )}

        {tab === "me" && (
          <>
            <div className={styles.sectlabel}>내가 고른 것 — 언제든 수정할 수 있어요</div>
            <div className={styles.sumcard}>
              <div className={styles.sumrow}>
                <span className="k" style={{ width: 64, flex: "none", color: "var(--text-medium)", font: "var(--text-body-sm)" }}>
                  🗓️ 날짜
                </span>
                <div className={styles.pills}>
                  {yesDates.length === 0 && maybeDates.length === 0 && (
                    <span className={styles.muted}>아직 없어요</span>
                  )}
                  {yesDates.map((d) => (
                    <span key={d.id} className={`${styles.pill} ${styles.pillYes}`}>
                      🟢 {fmtDate(d.date).label}
                    </span>
                  ))}
                  {maybeDates.map((d) => (
                    <span key={d.id} className={`${styles.pill} ${styles.pillMaybe}`}>
                      🟡 {fmtDate(d.date).label}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.sumrow}>
                <span style={{ width: 64, flex: "none", color: "var(--text-medium)", font: "var(--text-body-sm)" }}>
                  📍 장소
                </span>
                <div className={styles.pills}>
                  {likedPlaces.length === 0 && <span className={styles.muted}>아직 없어요</span>}
                  {likedPlaces.map((p) => (
                    <span key={p.id} className={styles.pill}>
                      {p.emoji} {p.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.actionbar}>
        {error && <span className={styles.err}>⚠️ {error}</span>}
        {locked ? (
          <span className={styles.hint}>🔒 투표가 마감됐어요</span>
        ) : !canSubmit ? (
          <span className={styles.hint}>날짜를 하나 이상 골라야 제출할 수 있어요</span>
        ) : null}
        <Button
          variant="primary"
          size="lg"
          block
          disabled={!canSubmit || submitting}
          onClick={submit}
        >
          {submitting ? "제출 중…" : submitted ? "제출 완료 · 다시 제출" : "제출하기"}
        </Button>
      </div>
    </>
  );
}
