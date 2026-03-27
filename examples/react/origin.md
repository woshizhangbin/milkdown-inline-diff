# Milkdown Inline Diff

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
  - `editor.use(diffPlugins)`
  - `.config(diffConfig({...}))`

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
| Code Block | Code blocks are diffed as code blocks |
| Blockquote | Nested quote content stays grouped |
| List | Nested ordered and unordered items remain structured |
| Table | Header and row changes stay in table form |

## Summary

This editor demo shows a single review flow for headings, paragraphs, blockquotes, nested lists, and tables.