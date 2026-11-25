#!/usr/bin/env node
/**
 * Build public/textures/void-mat.webp, the Void Mat texture, from page 1 of
 * assets-src/void-and-pylons/printable-void-terrain-mats.pdf.
 *
 *   node scripts/textures/build-void-mat.mjs
 *
 * Needs pdftoppm (poppler-utils) and ImageMagick 7 (`magick`) on the PATH.
 * The page is rendered, then trimmed to the mat outline (the page is white
 * around it). The outline is a hexagon through six ring hex centers, so the
 * trimmed image's edges are those centers; src/world/models/voidMatGeometry.ts
 * maps template coordinates into it from the image's aspect ratio alone.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const pdf = path.join(
  root,
  'assets-src/void-and-pylons/printable-void-terrain-mats.pdf',
)
const out = path.join(root, 'public/textures/void-mat.webp')
const DPI = 200
const QUALITY = 80

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'void-mat-'))
try {
  const prefix = path.join(work, 'page')
  execFileSync('pdftoppm', [
    '-f',
    '1',
    '-l',
    '1',
    '-r',
    `${DPI}`,
    '-png',
    pdf,
    prefix,
  ])
  const page = fs.readdirSync(work).find((name) => name.endsWith('.png'))
  if (!page) throw new Error('pdftoppm wrote no page')
  execFileSync('magick', [
    path.join(work, page),
    '-fuzz',
    '8%',
    '-trim',
    '+repage',
    '-strip',
    '-quality',
    `${QUALITY}`,
    out,
  ])
  const size = execFileSync('magick', ['identify', '-format', '%wx%h', out])
  console.log(
    `${path.relative(root, out)}: ${size} ${fs.statSync(out).size} bytes`,
  )
} finally {
  fs.rmSync(work, { recursive: true, force: true })
}
