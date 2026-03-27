# Milkdown Inline Diff Plugin

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
  - `editor.use(diffPlugins)`
  - `.config(diffConfig({ originContent, modifiedContent }))`

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
| Code Block | Code blocks are diffed as code blocks |
| Blockquote | Nested quote content stays grouped for review |
| List | Nested ordered and unordered items keep their hierarchy |
| Table | Header changes, row changes, and extended table schemas remain table-shaped |

## Summary

This editor demo shows block-level diff for headings, paragraphs, blockquotes, nested lists, and tables, plus merge controls for individual changes and bulk actions.