import type { FC } from "react";
import { useEffect, useRef, useState } from "react";

import { Crepe } from "@milkdown/crepe";
import {
  diffConfig,
  diffPlugins,
  getDiffState,
  jumpTo,
  merge,
} from "@woshizhangbin33/plugin-inline-diff";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import "@woshizhangbin33/plugin-inline-diff/style.css";
import { MergeBar } from "./MergeBar";

import originMarkdown from "./origin.md?raw";
import modifiedMarkdown from "./modified.md?raw";

export const MilkdownEditor: FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const [diffState, setDiffState] = useState({ currentIndex: -1, count: 0 });

  useEffect(() => {
    if (!rootRef.current) return;

    // Create the editor first, then attach the diff plugin array and config.
    const crepe = new Crepe({
      root: rootRef.current,
    });

    // originContent + modifiedContent lets the plugin enter diff mode
    // automatically after the editor view is ready.
    crepe.editor.use(diffPlugins).config(
      diffConfig({
        acceptButtonTitle: "Accept Change",
        rejectButtonTitle: "Keep Original",
        originContent: originMarkdown,
        modifiedContent: modifiedMarkdown,
      }),
    );

    const syncDiffState = () => {
      const editor = crepeRef.current?.editor ?? crepe.editor;
      const nextState = editor.action((ctx) => getDiffState(ctx));
      setDiffState(nextState);
    };

    // Listen to editor lifecycle and selection changes, then read diff state
    // with getDiffState(ctx) so external UI can stay in sync.
    crepe.on((listener) => {
      listener.mounted(syncDiffState);
      listener.updated(syncDiffState);
      listener.selectionUpdated(syncDiffState);
    });

    crepe.create().then(() => {
      crepeRef.current = crepe;
      syncDiffState();
    });

    return () => {
      crepe.destroy();
    };
  }, []);

  const handleJump = (index: number) => {
    if (!crepeRef.current) return;

    crepeRef.current.editor.action((ctx) => {
      jumpTo(ctx, index);
    });

    setDiffState((prev) => ({
      ...prev,
      currentIndex: index,
    }));
  };

  const handleAcceptAll = () => {
    if (!crepeRef.current) return;
    const nextState = crepeRef.current.editor.action((ctx) => {
      merge(ctx, "accept", 0, true);
      return getDiffState(ctx);
    });
    setDiffState(nextState);
  };

  const handleRemoveAll = () => {
    if (!crepeRef.current) return;
    const nextState = crepeRef.current.editor.action((ctx) => {
      merge(ctx, "reject", 0, true);
      return getDiffState(ctx);
    });
    setDiffState(nextState);
  };

  return (
    <>
      <MergeBar
        conflictCount={diffState.count}
        currentIndex={diffState.currentIndex}
        onJump={handleJump}
        onAcceptAll={handleAcceptAll}
        onRemoveAll={handleRemoveAll}
      />
      <div ref={rootRef} className="editor-shell" />
    </>
  );
};
