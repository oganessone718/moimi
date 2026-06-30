"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { PinInput } from "@/components/ui/PinInput";
import { NicknameChip } from "@/components/people/NicknameChip";
import { DateCandidateCard } from "@/components/vote/DateCandidateCard";
import type { Vote } from "@/components/vote/VoteCell";
import { PlaceCard } from "@/components/place/PlaceCard";
import { CommentThread } from "./CommentThread";
import { CalendarVote } from "./CalendarVote";
import {
  submitResponseAction,
  verifyAdminPinAction,
  adminAddDateAction,
  adminDeleteDateAction,
  adminAddPlaceAction,
  adminDeletePlaceAction,
  adminSetLockAction,
  adminConfirmAction,
} from "@/server/meetings/actions";
import styles from "./guest.module.css";

type DateOpt = { id: string; date: string };
type PlaceOpt = { id: string; name: string; emoji: string };
type CommentRow = { id: string; target: "DATE" | "PLACE"; targetId: string; body: string; who: string };
type Status = "OPEN" | "CLOSED" | "CONFIRMED";

type Props = {
  shareToken: string;
  title: string;
  status: Status;
  type: "DATE" | "PLACE" | "DATE_PLACE";
  initialIsAdmin: boolean;
  dates: DateOpt[];
  places: PlaceOpt[];
  comments: CommentRow[];
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

export function GuestResponse({
  shareToken,
  title,
  status,
  type,
  initialIsAdmin,
  dates,
  places,
  comments,
}: Props) {
  const router = useRouter();
  const commentsFor = (target: "DATE" | "PLACE", targetId: string) =>
    comments.filter((c) => c.target === target && c.targetId === targetId);
  const [joined, setJoined] = useState(false);
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");

  const [tab, setTab] = useState<"date" | "place" | "me">("date");
  const [dateView, setDateView] = useState<"list" | "calendar">("list");
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // 관리자 모드
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [pinOpen, setPinOpen] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [finalDate, setFinalDate] = useState<string | null>(null);
  const [finalPlace, setFinalPlace] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newPlace, setNewPlace] = useState("");

  const locked = status !== "OPEN";
  const needsDate = type === "DATE" || type === "DATE_PLACE";
  const needsPlace = type === "PLACE" || type === "DATE_PLACE";

  const tryPin = async (value: string) => {
    const res = await verifyAdminPinAction(shareToken, value);
    if (res.ok) {
      setIsAdmin(true);
      setPinOpen(false);
      setAdminPin("");
      setPinErr(false);
    } else {
      setPinErr(true);
      setAdminPin("");
    }
  };

  const verifyDateChange =
    (fn: () => Promise<void>) =>
    async () => {
      await fn();
      router.refresh();
    };
  const adminConfirm = async () => {
    await adminConfirmAction(
      shareToken,
      needsDate ? finalDate : null,
      needsPlace ? finalPlace : null,
    );
    router.push(`/m/${shareToken}/confirmed`);
  };
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
      {isAdmin && (
        <div className={styles.adminBanner}>
          <b>🛠️ 관리 모드</b>
          <span>후보 추가·삭제, 마감, 최종 확정을 할 수 있어요</span>
          <button onClick={() => setIsAdmin(false)}>나가기</button>
        </div>
      )}

      <div className={styles.head}>
        <div className={styles.headRow}>
          <Link href="/" className={styles.logo}>
            moimi
          </Link>
          {!isAdmin && (
            <button
              className={styles.adminBtn}
              onClick={() => {
                setAdminPin("");
                setPinErr(false);
                setPinOpen(true);
              }}
            >
              🔒 관리자
            </button>
          )}
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

      {isAdmin && (
        <div className={styles.adminPanel}>
          <div className={styles.adminCtl}>
            <div>
              <b>투표 마감</b>
              <span>{locked ? "마감됨 — 참가자는 투표할 수 없어요" : "켜면 더 이상 투표할 수 없어요"}</span>
            </div>
            <Switch
              checked={locked}
              onChange={(v) => adminSetLockAction(shareToken, v).then(() => router.refresh())}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            block
            disabled={(needsDate && !finalDate) || (needsPlace && !finalPlace)}
            onClick={adminConfirm}
          >
            🎉 최종 {needsDate ? "날짜" : ""}
            {needsDate && needsPlace ? "·" : ""}
            {needsPlace ? "장소" : ""} 확정하기
          </Button>
          {((needsDate && !finalDate) || (needsPlace && !finalPlace)) && (
            <span className={styles.hint}>아래에서 ⭐ 최종 후보를 골라주세요</span>
          )}
        </div>
      )}

      <div className={styles.scroll} key={tab}>
        {tab === "date" && (
          <>
            <div className={styles.segRow}>
              <div className={styles.seg}>
                <button aria-pressed={dateView === "list"} onClick={() => setDateView("list")}>
                  리스트
                </button>
                <button aria-pressed={dateView === "calendar"} onClick={() => setDateView("calendar")}>
                  캘린더
                </button>
              </div>
              <span className={styles.sectlabel}>
                {answered}/{dates.length} 가능
              </span>
            </div>
            {dates.length === 0 && <div className={styles.muted}>날짜 후보가 없어요</div>}
            {dateView === "calendar" && dates.length > 0 && (
              <CalendarVote
                dates={dates}
                votes={votes}
                onVote={(id, v) => {
                  setVotes((s) => ({ ...s, [id]: v }));
                  setSubmitted(false);
                }}
              />
            )}
            {dateView === "list" &&
              dates.map((d) => {
                const f = fmtDate(d.date);
                return (
                  <div key={d.id}>
                  <DateCandidateCard
                    date={f.label}
                    weekday={f.weekday}
                    value={votes[d.id] ?? null}
                    onChange={(v) => {
                      setVotes((s) => ({ ...s, [d.id]: v }));
                      setSubmitted(false);
                    }}
                  />
                  {isAdmin && (
                    <div className={styles.adminRow}>
                      <button
                        className={styles.adminPick}
                        data-on={finalDate === d.id}
                        onClick={() => setFinalDate(d.id)}
                      >
                        {finalDate === d.id ? "⭐ 최종 날짜" : "☆ 최종으로"}
                      </button>
                      <button
                        className={styles.adminDel}
                        onClick={verifyDateChange(() => adminDeleteDateAction(shareToken, d.id))}
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  )}
                  <CommentThread
                    shareToken={shareToken}
                    nickname={nickname}
                    target="DATE"
                    targetId={d.id}
                    comments={commentsFor("DATE", d.id)}
                  />
                </div>
              );
            })}
            {isAdmin && (
              <div className={styles.adminAdd}>
                <div className={styles.grow} style={{ flex: 1 }}>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <Button
                  variant="secondary"
                  disabled={!newDate}
                  onClick={async () => {
                    await adminAddDateAction(shareToken, newDate);
                    setNewDate("");
                    router.refresh();
                  }}
                >
                  ＋ 추가
                </Button>
              </div>
            )}
          </>
        )}

        {tab === "place" && (
          <>
            <div className={styles.sectlabel}>마음에 드는 곳에 하트를 눌러주세요</div>
            {places.length === 0 && <div className={styles.muted}>장소 후보가 없어요</div>}
            {places.map((p) => (
              <div key={p.id}>
                <PlaceCard
                  name={p.name}
                  emoji={p.emoji}
                  liked={!!likes[p.id]}
                  showComments={false}
                  onToggleLike={() => {
                    setLikes((s) => ({ ...s, [p.id]: !s[p.id] }));
                    setSubmitted(false);
                  }}
                />
                {isAdmin && (
                  <div className={styles.adminRow}>
                    <button
                      className={styles.adminPick}
                      data-on={finalPlace === p.id}
                      onClick={() => setFinalPlace(p.id)}
                    >
                      {finalPlace === p.id ? "⭐ 최종 장소" : "☆ 최종으로"}
                    </button>
                    <button
                      className={styles.adminDel}
                      onClick={verifyDateChange(() => adminDeletePlaceAction(shareToken, p.id))}
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                )}
                <CommentThread
                  shareToken={shareToken}
                  nickname={nickname}
                  target="PLACE"
                  targetId={p.id}
                  comments={commentsFor("PLACE", p.id)}
                />
              </div>
            ))}
            {isAdmin && (
              <div className={styles.adminAdd}>
                <div className={styles.grow} style={{ flex: 1 }}>
                  <Input
                    placeholder="장소 이름"
                    value={newPlace}
                    onChange={(e) => setNewPlace(e.target.value)}
                  />
                </div>
                <Button
                  variant="secondary"
                  disabled={!newPlace.trim()}
                  onClick={async () => {
                    await adminAddPlaceAction(shareToken, newPlace);
                    setNewPlace("");
                    router.refresh();
                  }}
                >
                  ＋ 추가
                </Button>
              </div>
            )}
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

      {!isAdmin && (
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
          {submitted && (
            <Link href={`/m/${shareToken}/results`} className={styles.resultsLink}>
              📊 전체 결과 보기
            </Link>
          )}
        </div>
      )}

      {pinOpen && (
        <div className={styles.backdrop} onClick={() => setPinOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>관리자 인증</div>
            <p className={styles.modalText}>
              모임을 만들 때 정한 <b>관리 PIN 4자리</b>를 입력하세요
            </p>
            <PinInput
              length={4}
              value={adminPin}
              error={pinErr}
              onChange={(v) => {
                setAdminPin(v);
                setPinErr(false);
              }}
              onComplete={(v) => tryPin(v)}
            />
            {pinErr && <span className={styles.err}>PIN이 일치하지 않아요</span>}
          </div>
        </div>
      )}
    </>
  );
}
