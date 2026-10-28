import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/game/windowGeometry.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const geometry = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))

test('restored windows can reach the right and bottom edges without disappearing', () => {
  const position = geometry.clampWindowPosition(
    { x: 90, y: 24 },
    { x: 100, y: 100 },
    { x: 900, y: 700 },
    { width: 1200, height: 800 },
    { width: 800, height: 600 },
  )
  assert.deepEqual(position, { x: 392, y: 752 })
})

test('window dragging never moves the title bar outside the workspace', () => {
  const farLeftTop = geometry.clampWindowPosition(
    { x: 90, y: 24 },
    { x: 300, y: 300 },
    { x: -200, y: -200 },
    { width: 900, height: 600 },
    { width: 850, height: 550 },
  )
  assert.deepEqual(farLeftTop, { x: 0, y: 0 })
})

test('oversized window dimensions safely clamp to the only reachable position', () => {
  const position = geometry.clampWindowPosition(
    { x: 40, y: 40 },
    { x: 10, y: 10 },
    { x: 500, y: 500 },
    { width: 600, height: 400 },
    { width: 900, height: 700 },
  )
  assert.deepEqual(position, { x: 0, y: 0 })
})
