import styles from "./place.module.css";

type Props = {
  name: string;
  emoji?: string;
  description?: string;
  distance?: string;
  likes?: number;
  comments?: number;
  liked?: boolean;
  selected?: boolean;
  showComments?: boolean;
  onToggleLike?: () => void;
  onComment?: () => void;
  onRemove?: () => void;
};

export function PlaceCard({
  name,
  emoji = "📍",
  description,
  distance,
  likes = 0,
  comments = 0,
  liked = false,
  selected = false,
  showComments = true,
  onToggleLike,
  onComment,
  onRemove,
}: Props) {
  return (
    <div className={styles.card} data-selected={selected}>
      <span className={styles.emoji} aria-hidden="true">
        {emoji}
      </span>
      <div className={styles.body}>
        <div className={styles.name}>{name}</div>
        {description && <div className={styles.desc}>{description}</div>}
        {distance && <div className={styles.meta}>📍 {distance}</div>}
      </div>

      <div className={styles.actions}>
        {onRemove && (
          <button
            type="button"
            className={styles.remove}
            aria-label="장소 삭제"
            onClick={onRemove}
          >
            ✕
          </button>
        )}
        {onToggleLike && (
          <button
            type="button"
            className={styles.like}
            data-on={liked}
            aria-pressed={liked}
            onClick={onToggleLike}
          >
            {liked ? "❤️" : "🤍"} {likes}
          </button>
        )}
        {showComments && onComment && (
          <button type="button" className={styles.comment} onClick={onComment}>
            💬 {comments}
          </button>
        )}
      </div>
    </div>
  );
}
