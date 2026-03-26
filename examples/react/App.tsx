import React, { useState } from 'react'
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core'
import { commonmark } from '@milkdown/preset-commonmark'
import { ReactEditor, useEditor } from '@milkdown/react'
import { createDiffEditState } from '@milkdown/plugin-inline-diff'

const originalDoc = `# Original Document

This is original content.

## Features

- Feature 1
- Feature 2
- Feature 3

## Code Example

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

## Table

| Name | Age | City |
|------|-----|------|
| Alice | 25 | NYC |
| Bob | 30 | LA |
| Carol | 28 | Chicago |
`

const modifiedDoc = `# Modified Document

This is modified content with some changes.

## Features

- Feature 1 (updated)
- Feature 2
- New Feature 3
- Feature 4

## Code Example

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
  console.log('This is a new line');
}
\`\`\`

## Table

| Name | Age | City |
|------|-----|------|
| Alice | 25 | NYC |
| Bob | 30 | LA |
| Dave | 35 | Boston |
| Eve | 27 | Seattle |
`

function App() {
  const [showOriginal, setShowOriginal] = useState(true)

  useEditor((root) =>
    root
      .config((ctx) => {
        ctx.set(defaultValueCtx, showOriginal ? originalDoc : modifiedDoc)
        ctx.get(rootCtx)
      })
      .use(commonmark)
  )

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Milkdown Inline Diff Example</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            cursor: 'pointer',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {showOriginal ? 'Show Modified' : 'Show Original'}
        </button>
      </div>

      <div style={{ border: '1px solid #d9d9d9', borderRadius: '4px', minHeight: '400px', padding: '20px' }}>
        <ReactEditor />
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Legend</h3>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#ffccc7', marginRight: '8px' }}></div>
            <span>Deleted</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#d9f7be', marginRight: '8px' }}></div>
            <span>Inserted</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#fffb8f', marginRight: '8px' }}></div>
            <span>Modified</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>How to Use</h3>
        <ol>
          <li>Click "Show Original" or "Show Modified" to switch between documents</li>
          <li>The plugin provides diff functionality to compare two Markdown documents</li>
          <li>Use the <code>createDiffEditState</code> function to compute differences</li>
          <li>The result includes merged document, decorations, and merge groups</li>
        </ol>
      </div>
    </div>
  )
}

export default App
