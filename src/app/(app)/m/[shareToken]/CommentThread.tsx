"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/people/Avatar";
import { addCommentAction } from "@/server/meetings/actions";
import styles from "./guest.module.css";

type Props = {
  shareToken: string;
  nickname: string;
  target: "DATE" | "PLACE";
  targetId: string;
  comments: { id: string; who: string; body: string }[];
};

export function CommentThread({ shareToken, nickname, target, targetId, comments }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    try {
      await addCommentAction({ shareToken, nickname, target, targetId, body });
      setDraft("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button className={styles.cmtToggle} onClick={() => setOpen((o) => !o)}>
        💬 댓글 {comments.length} {open ? "▴" : "▾"}
      </button>
      {open && (
        <div className={styles.cmtBox}>
          {comments.length === 0 && <div className={styles.cmtEmpty}>첫 댓글을 남겨보세요</div>}
          {comments.map((c) => (
            <div key={c.id} className={styles.cmt}>
              <Avatar name={c.who} size={28} />
              <div>
                <div className={styles.cmtWho}>{c.who}</div>
                <div className={styles.cmtBody}>{c.body}</div>
              </div>
            </div>
          ))}
          <div className={styles.cmtForm}>
            <div className={styles.grow} style={{ flex: 1 }}>
              <Input
                placeholder="댓글 달기…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") add();
                }}
              />
            </div>
            <Button variant="primary" disabled={busy || !draft.trim()} onClick={add}>
              등록
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
