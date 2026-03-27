import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import "./index.css";
import { MilkdownEditor } from "./Editor";
const root$ = document.getElementById("root");
if (!root$)
    throw new Error("No root element found");
const root = createRoot(root$);
root.render(_jsxs("main", { className: "page", children: [_jsxs("section", { className: "hero", children: [_jsx("p", { className: "eyebrow", children: "milkdown-inline-diff" }), _jsx("h1", { children: "Block-level Markdown diff for Milkdown editors" }), _jsxs("p", { className: "lead", children: ["This page is both the runnable demo and the integration guide. It uses", _jsx("code", { children: " editor.use(diffPlugins).config(diffConfig(...)) " }), "to enable block-level diff for headings, paragraphs, nested blockquotes, nested lists, and tables."] }), _jsxs("div", { className: "hero-grid", children: [_jsxs("div", { className: "hero-panel", children: [_jsx("h2", { children: "How to use it" }), _jsxs("ol", { children: [_jsxs("li", { children: ["Install the plugin array with ", _jsx("code", { children: "editor.use(diffPlugins)" }), "."] }), _jsxs("li", { children: ["Provide button titles or initial content with ", _jsx("code", { children: "diffConfig(...)" }), "."] }), _jsxs("li", { children: ["Listen to editor updates and call ", _jsx("code", { children: "getDiffState(ctx)" }), " to sync your own UI."] })] })] }), _jsxs("div", { className: "hero-panel hero-panel--code", children: [_jsx("h2", { children: "Typical setup" }), _jsx("pre", { children: `editor
  .use(diffPlugins)
  .config(
    diffConfig({
      acceptButtonTitle: "Accept Change",
      rejectButtonTitle: "Keep Original",
      originContent,
      modifiedContent,
    }),
  );` })] }), _jsxs("div", { className: "hero-panel", children: [_jsx("h2", { children: "Runtime API" }), _jsxs("ul", { className: "hero-list", children: [_jsxs("li", { children: [_jsx("code", { children: "diff(ctx, modified, origin?)" }), " enters diff mode on demand."] }), _jsxs("li", { children: [_jsx("code", { children: "jumpTo(ctx, index)" }), " moves focus to a specific conflict."] }), _jsxs("li", { children: [_jsx("code", { children: "merge(ctx, \"accept\" | \"reject\", index, all?)" }), " resolves one conflict or all of them."] }), _jsxs("li", { children: [_jsx("code", { children: "getDiffState(ctx)" }), " returns the current conflict count and active index."] })] })] })] })] }), _jsxs("section", { className: "demo-card", children: [_jsxs("div", { className: "demo-copy", children: [_jsx("h2", { children: "What to try" }), _jsx("p", { children: "Hover a highlighted block to open the merge tooltip, or use the merge bar above the editor to jump between conflicts and trigger bulk actions." })] }), _jsx(MilkdownEditor, {})] })] }));
