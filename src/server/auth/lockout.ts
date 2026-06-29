// PIN 무차별 대입 방지: 실패 횟수에 따른 지수 백오프 + 잠금 정책 (순수 함수).
// 상태(LockoutState)는 S1에서 DB(Meeting/Participant)에 저장하고 이 정책으로 판단한다.

export const MAX_FREE_ATTEMPTS = 5; // 이 횟수까지는 지연 없음
export const BASE_DELAY_MS = 1_000; // 잠금 시작 후 첫 지연
export const MAX_DELAY_MS = 15 * 60 * 1_000; // 상한 15분

export type LockoutState = {
  failedAttempts: number;
  lastFailedAt: number | null; // epoch ms
};

// 누적 실패 횟수에 대한 "다음 시도까지" 대기 시간.
export function backoffDelayMs(failedAttempts: number): number {
  if (failedAttempts < MAX_FREE_ATTEMPTS) return 0;
  const over = failedAttempts - MAX_FREE_ATTEMPTS;
  return Math.min(BASE_DELAY_MS * 2 ** over, MAX_DELAY_MS);
}

// 현재 잠겨있는지 + 남은 대기 시간(ms).
export function checkLockout(
  state: LockoutState,
  now: number = Date.now(),
): { locked: boolean; retryAfterMs: number } {
  const delay = backoffDelayMs(state.failedAttempts);
  if (delay === 0 || state.lastFailedAt === null) {
    return { locked: false, retryAfterMs: 0 };
  }
  const remaining = delay - (now - state.lastFailedAt);
  return remaining > 0
    ? { locked: true, retryAfterMs: remaining }
    : { locked: false, retryAfterMs: 0 };
}

export function recordFailure(
  state: LockoutState,
  now: number = Date.now(),
): LockoutState {
  return { failedAttempts: state.failedAttempts + 1, lastFailedAt: now };
}

export const INITIAL_LOCKOUT: LockoutState = {
  failedAttempts: 0,
  lastFailedAt: null,
};
