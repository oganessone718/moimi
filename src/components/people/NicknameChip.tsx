import { Avatar } from "./Avatar";
import styles from "./people.module.css";

type Props = { name: string; selected?: boolean };

export function NicknameChip({ name, selected = false }: Props) {
  return (
    <span className={styles.chip} data-selected={selected}>
      <Avatar name={name} size={20} />
      {name}
    </span>
  );
}
