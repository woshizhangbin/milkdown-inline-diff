import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Crepe } from "@milkdown/crepe";
import { diffConfig, diffPlugins, getDiffState, jumpTo, merge, } from "@milkdown/plugin-inline-diff";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import "@milkdown/plugin-inline-diff/style.css";
import { MergeBar } from "./MergeBar";
const originMarkdown = `# Milkdown Inline Diff

Milkdown inline diff brings block-level comparison to Markdown editing, so reviewers can inspect structural changes without leaving the editor.

## Why This Demo Exists

This sample focuses on block-aware diff instead of plain text patches. Each changed section below maps to a document block that can be accepted or rejected in place.

> Blockquote changes are handled as blocks.
>
> > Nested blockquotes stay nested during diff.
> >
> > - Review comments do not need to be flattened
> > - Merge actions stay attached to the changed block

## Supported Structures

- Heading changes are matched as heading blocks
- Paragraph updates remain paragraph blocks
- Blockquotes and nested lists keep their hierarchy
- Tables are diffed as table rows instead of raw text

1. Install the plugin array on the editor
2. Provide configuration with button titles
3. Trigger diff mode after the editor view is ready

- Integration outline
  - \`editor.use(diffPlugins)\`
  - \`.config(diffConfig({...}))\`

## Example Document Outline

- API shape
  - Plugin array
  - Config helper
- Rendering details
  - Code block styling in Crepe
- Block coverage
  - Heading
  - Paragraph
  - Blockquote
  - Nested list
  - Table

## Code Block Coverage

~~~ts
editor.use(diffPlugins).config(diffConfig({ ... }));
~~~

## Table Diff Coverage

| Block Type | Notes |
| --- | --- |
| Heading | Section titles can be reviewed as single blocks |
| Paragraph | Intro and summary copy can be merged independently |
| Blockquote | Nested quote content stays grouped |
| List | Nested ordered and unordered items remain structured |
| Table | Header and row changes stay in table form |
| Code Block | Code blocks are diffed as code blocks |

## Summary

This editor demo shows a single review flow for headings, paragraphs, blockquotes, nested lists, and tables.
`;
const modifiedMarkdown = `# Milkdown Inline Diff Plugin

Milkdown inline diff brings block-level comparison to Markdown editing, so reviewers can inspect structural changes and merge them directly inside the editor.

## Why This Demo Exists

This sample highlights block-aware diff instead of plain text patches. Each changed section below remains a real Markdown block, which makes review easier to scan and safer to merge.

> Blockquote changes are handled as blocks.
>
> > Nested blockquotes still preserve their structure during diff.
> >
> > - Review comments can be accepted or rejected without flattening the quote
> > - Nested list content inside a quote keeps its hierarchy

## Supported Structures

- Heading, paragraph, blockquote, and list changes are matched as block nodes
- Nested blockquotes and nested lists keep their original hierarchy
- Tables are diffed as table structures, including support for extended schemas with multiple header rows

1. Install the plugin array on the editor instance
2. Provide configuration with button titles or optional initial content
3. Let the plugin enter diff mode automatically after the editor view is ready

- Integration outline
  - \`editor.use(diffPlugins)\`
  - \`.config(diffConfig({ originContent, modifiedContent }))\`

## Example Document Outline

- API shape
  - Plugin array
  - Config helper
  - Auto diff on initial content
- Rendering details
  - Code block diff decoration
- Block coverage
  - Heading
  - Paragraph
  - Blockquote
  - Nested list
  - Table with extended header support

## Code Block Coverage

~~~ts
editor
  .use(diffPlugins)
  .config(diffConfig({ originContent, modifiedContent }));
~~~

## Table Diff Coverage

| Block Type | Notes |
| --- | --- |
| Heading | Document and section titles can be reviewed as single blocks |
| Paragraph | Narrative copy can be merged block by block |
| Blockquote | Nested quote content stays grouped for review |
| List | Nested ordered and unordered items keep their hierarchy |
| Table | Header changes, row changes, and extended table schemas remain table-shaped |
| Code Block | Code blocks are diffed as code blocks |

## Summary

This editor demo shows block-level diff for headings, paragraphs, blockquotes, nested lists, and tables, plus merge controls for individual changes and bulk actions.
`;
export const MilkdownEditor = () => {
    const rootRef = useRef(null);
    const crepeRef = useRef(null);
    const [diffState, setDiffState] = useState({ currentIndex: -1, count: 0 });
    useEffect(() => {
        if (!rootRef.current)
            return;
        // Create the editor first, then attach the diff plugin array and config.
        const crepe = new Crepe({
            root: rootRef.current,
        });
        // originContent + modifiedContent lets the plugin enter diff mode
        // automatically after the editor view is ready.
        crepe.editor.use(diffPlugins).config(diffConfig({
            acceptButtonTitle: "Accept Change",
            rejectButtonTitle: "Keep Original",
            originContent: originMarkdown,
            modifiedContent: modifiedMarkdown,
        }));
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
    const handleJump = (index) => {
        if (!crepeRef.current)
            return;
        crepeRef.current.editor.action((ctx) => {
            jumpTo(ctx, index);
        });
        setDiffState((prev) => ({
            ...prev,
            currentIndex: index,
        }));
    };
    const handleAcceptAll = () => {
        if (!crepeRef.current)
            return;
        const nextState = crepeRef.current.editor.action((ctx) => {
            merge(ctx, "accept", 0, true);
            return getDiffState(ctx);
        });
        setDiffState(nextState);
    };
    const handleRemoveAll = () => {
        if (!crepeRef.current)
            return;
        const nextState = crepeRef.current.editor.action((ctx) => {
            merge(ctx, "reject", 0, true);
            return getDiffState(ctx);
        });
        setDiffState(nextState);
    };
    return (_jsxs(_Fragment, { children: [_jsx(MergeBar, { conflictCount: diffState.count, currentIndex: diffState.currentIndex, onJump: handleJump, onAcceptAll: handleAcceptAll, onRemoveAll: handleRemoveAll }), _jsx("div", { ref: rootRef, className: "editor-shell" })] }));
};
