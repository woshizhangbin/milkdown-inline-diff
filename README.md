# @milkdown/plugin-inline-diff

A Milkdown plugin for inline diff visualization and merge functionality.

## Installation

```bash
npm install @milkdown/plugin-inline-diff
```

or

```bash
yarn add @milkdown/plugin-inline-diff
```

or

```bash
pnpm add @milkdown/plugin-inline-diff
```

## Quick Start

```typescript
import { Editor, rootCtx } from '@milkdown/core'
import { commonmark } from '@milkdown/preset-commonmark'
import { createDiffEditState } from '@milkdown/plugin-inline-diff'

const editor = new Editor()
  .config((ctx) => {
    ctx.get(rootCtx)
  })
  .use(commonmark)
  .create()

const originalDoc = editor.state.doc
const modifiedDoc = editor.state.doc

const diffState = createDiffEditState(
  originalDoc,
  modifiedDoc,
  editor.state.doc.type.schema
)

console.log('Merged document:', diffState.mergedDoc)
console.log('Decorations:', diffState.decorations)
console.log('Merge groups:', diffState.mergeGroups)
```

## Features

- **Block-level diff**: Compare documents at block level for better accuracy
- **Merge visualization**: Visualize changes with colored decorations
- **Special handling**: Smart handling for tables, lists, and other complex structures
- **Framework agnostic**: Works with any UI framework (React, Vue, vanilla JS, etc.)

## API

### `diffViewConfig(config)`

Configures the merge view with callback functions.

**Parameters:**
- `config` (MergeConfig): Configuration object

**Returns:**
- Milkdown slice with configuration

**MergeConfig interface:**
```typescript
interface MergeConfig {
  onmerge: (action: 'accept' | 'reject', origincontent: string, modifiedContent: string, resultContent: string) => void
  oncomplete: () => void
  onDiffStateChanged: (currentIndex: number, count: number) => void
}
```

**Example:**
```typescript
import { diffViewConfig } from '@milkdown/plugin-inline-diff'

diffViewConfig({
  onmerge: (action, origincontent, modifiedContent, resultContent) => {
    console.log('Merge action:', action)
    console.log('Origin content:', origincontent)
    console.log('Modified content:', modifiedContent)
    console.log('Result content:', resultContent)
  },
  oncomplete: () => {
    console.log('Merge completed')
  },
  onDiffStateChanged: (currentIndex, count) => {
    console.log('Current diff index:', currentIndex)
    console.log('Total conflicts:', count)
  }
})
```

### `diffViewPlugin()`

Milkdown plugin that injects merge view functionality.

**Returns:**
- Milkdown plugin

**Example:**
```typescript
import { Editor, rootCtx } from '@milkdown/core'
import { diffViewPlugin } from '@milkdown/plugin-inline-diff'

const editor = new Editor()
  .config((ctx) => {
    ctx.get(rootCtx)
  })
  .use(diffViewPlugin())
  .create()
```

### `diff(ctx, newContent)`

Compares current editor content with new content and creates diff visualization.

**Parameters:**
- `ctx` (Ctx): Milkdown context
- `newContent` (string): New content to compare

**Example:**
```typescript
import { diff } from '@milkdown/plugin-inline-diff'

editor.action((ctx) => {
  diff(ctx, newContent)
})
```

### `acceptMerge(ctx, index)`

Accepts a merge group at the specified index.

**Parameters:**
- `ctx` (Ctx): Milkdown context
- `index` (number): Index of the merge group to accept

### `rejectMerge(ctx, index)`

Rejects a merge group at the specified index.

**Parameters:**
- `ctx` (Ctx): Milkdown context
- `index` (number): Index of the merge group to reject

### `createDiffEditState(originalDoc, modifiedDoc, schema)`

Creates a diff state comparing two documents.

**Parameters:**
- `originalDoc` (Node): The original document
- `modifiedDoc` (Node): The modified document
- `schema` (Schema): The ProseMirror schema

**Returns:**
- `DiffEditState`: Object containing merged document, decorations, and merge groups

### `getDecorationClass(type)`

Returns CSS class name for a given change type.

**Parameters:**
- `type` ('delete' | 'insert' | 'modify'): The change type

**Returns:**
- `string`: The CSS class name

### `blockDiff(docA, docB)`

Computes block-level differences between two documents.

**Parameters:**
- `docA` (Node): The first document
- `docB` (Node): The second document

**Returns:**
- `BlockChange[]`: Array of block changes

### `getMergeGroups(ctx)`

Gets all merge groups from the current diff decorations.

**Parameters:**
- `ctx` (Ctx): Milkdown context

**Returns:**
- `MergeGroup[]`: Array of merge groups

### `calculateMergeGroupRange(ctx, groupIndex)`

Calculates the range of a merge group.

**Parameters:**
- `ctx` (Ctx): Milkdown context
- `groupIndex` (number): Index of the merge group

**Returns:**
- `MergeGroupRange | undefined`: Range information or undefined

## Styling

The plugin uses the following CSS classes for decorations:

```css
.diff-decoration-delete {
  background-color: #ffccc7;
}

.diff-decoration-insert {
  background-color: #d9f7be;
}

.diff-decoration-modify {
  background-color: #fffb8f;
}
```

## Example

See `examples/vanilla` directory for a complete vanilla JavaScript example.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
