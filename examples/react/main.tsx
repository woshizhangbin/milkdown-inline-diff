import { createRoot } from "react-dom/client";

import "./index.css";
import { MilkdownEditor } from "./Editor";

const root$ = document.getElementById("root");
if (!root$) throw new Error("No root element found");

const root = createRoot(root$);

root.render(
  <main className="page">
    <section className="hero">
      <p className="eyebrow">milkdown-inline-diff</p>
      <h1>Block-level Markdown diff for Milkdown editors</h1>
      <p className="lead">
        This page is both the runnable demo and the integration guide. It uses
        <code> editor.use(diffPlugins).config(diffConfig(...)) </code>
        to enable block-level diff for headings, paragraphs, nested
        blockquotes, nested lists, and tables.
      </p>
      <div className="hero-grid">
        <div className="hero-panel">
          <h2>How to use it</h2>
          <ol>
            <li>Install the plugin array with <code>editor.use(diffPlugins)</code>.</li>
            <li>Provide button titles or initial content with <code>diffConfig(...)</code>.</li>
            <li>Listen to editor updates and call <code>getDiffState(ctx)</code> to sync your own UI.</li>
          </ol>
        </div>
        <div className="hero-panel hero-panel--code">
          <h2>Typical setup</h2>
          <pre>{`editor
  .use(diffPlugins)
  .config(
    diffConfig({
      acceptButtonTitle: "Accept Change",
      rejectButtonTitle: "Keep Original",
      originContent,
      modifiedContent,
    }),
  );`}</pre>
        </div>
        <div className="hero-panel">
          <h2>Runtime API</h2>
          <ul className="hero-list">
            <li><code>diff(ctx, modified, origin?)</code> enters diff mode on demand.</li>
            <li><code>jumpTo(ctx, index)</code> moves focus to a specific conflict.</li>
            <li><code>merge(ctx, "accept" | "reject", index, all?)</code> resolves one conflict or all of them.</li>
            <li><code>getDiffState(ctx)</code> returns the current conflict count and active index.</li>
          </ul>
        </div>
      </div>
    </section>
    <section className="demo-card">
      <div className="demo-copy">
        <h2>What to try</h2>
        <p>
          Hover a highlighted block to open the merge tooltip, or use the merge
          bar above the editor to jump between conflicts and trigger bulk
          actions.
        </p>
      </div>
      <MilkdownEditor />
    </section>
  </main>,
);
