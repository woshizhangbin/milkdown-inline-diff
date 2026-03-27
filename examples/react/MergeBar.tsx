import type { FC } from "react";

type MergeBarProps = {
  conflictCount: number;
  currentIndex: number;
  onJump: (index: number) => void;
  onAcceptAll: () => void;
  onRemoveAll: () => void;
};

export const MergeBar: FC<MergeBarProps> = ({
  conflictCount,
  currentIndex,
  onJump,
  onAcceptAll,
  onRemoveAll,
}) => {
  if (conflictCount <= 0) {
    return null;
  }

  const displayIndex = currentIndex === -1 ? 1 : currentIndex + 1;

  return (
    <div className="merge-bar">
      <div className="merge-bar__status">
        <button
          type="button"
          className="merge-bar__nav"
          onClick={() => onJump(currentIndex <= 0 ? 0 : currentIndex - 1)}
          disabled={currentIndex <= 0}
        >
          Prev
        </button>
        <span className="merge-bar__counter">
          {displayIndex} / {conflictCount}
        </span>
        <button
          type="button"
          className="merge-bar__nav"
          onClick={() =>
            onJump(
              currentIndex === -1
                ? 0
                : Math.min(currentIndex + 1, conflictCount - 1),
            )
          }
          disabled={currentIndex >= conflictCount - 1}
        >
          Next
        </button>
      </div>

      <div className="merge-bar__actions">
        <button
          type="button"
          className="merge-bar__button merge-bar__button--secondary"
          onClick={onRemoveAll}
        >
          Remove All
        </button>
        <button
          type="button"
          className="merge-bar__button merge-bar__button--primary"
          onClick={onAcceptAll}
        >
          Accept All
        </button>
      </div>
    </div>
  );
};
