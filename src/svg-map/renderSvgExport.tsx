import { zipSync } from 'fflate'
import { createElement } from 'react'
import { serializeSvgWithEmbeddedFont } from './exportSvg'

export type SvgExportPage = {
  id: string
  filename: string
  content: string
}

export async function renderSvgExportPage({
  viewingLevel,
  legendOnly = false,
  logoLevel,
}: {
  viewingLevel?: number
  legendOnly?: boolean
  logoLevel?: number
}) {
  const [{ default: SvgMapDisplay }, { createRoot }, { flushSync }] =
    await Promise.all([
      import('./SvgMapDisplay'),
      import('react-dom/client'),
      import('react-dom'),
    ])
  const container = document.createElement('div')
  Object.assign(container.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: '1000px',
    height: '1000px',
    visibility: 'hidden',
    pointerEvents: 'none',
  })
  document.body.appendChild(container)
  const root = createRoot(container)
  try {
    flushSync(() => {
      root.render(
        createElement(SvgMapDisplay, {
          viewingLevelOverride: viewingLevel,
          legendOnly,
          overlayEnabledOverride: true,
        }),
      )
    })
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const svg = container.querySelector('svg')
    if (!svg) throw new Error('Could not render the SVG export page')
    return await serializeSvgWithEmbeddedFont(svg, logoLevel)
  } finally {
    flushSync(() => root.unmount())
    container.remove()
  }
}

export function combineSvgExportPages(pages: SvgExportPage[]) {
  const svgNamespace = 'http://www.w3.org/2000/svg'
  const document = window.document.implementation.createDocument(
    svgNamespace,
    'svg',
  )
  const root = document.documentElement
  root.setAttribute('xmlns', svgNamespace)

  const parsedPages = pages.map((page) => {
    const parsed = new DOMParser().parseFromString(
      page.content,
      'image/svg+xml',
    )
    const viewBox = (parsed.documentElement.getAttribute('viewBox') ?? '')
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    if (
      viewBox.length !== 4 ||
      !viewBox.every(Number.isFinite) ||
      !viewBox[2] ||
      !viewBox[3]
    ) {
      throw new Error(`Invalid viewBox in ${page.filename}`)
    }
    return { page, source: parsed.documentElement, viewBox }
  })
  const columns = Math.ceil(Math.sqrt(parsedPages.length))
  const rows = Math.ceil(parsedPages.length / columns)
  const tileWidth = Math.max(...parsedPages.map(({ viewBox }) => viewBox[2]))
  const tileHeight = Math.max(...parsedPages.map(({ viewBox }) => viewBox[3]))
  const gap = 100
  const width = columns * tileWidth + (columns - 1) * gap
  const height = rows * tileHeight + (rows - 1) * gap
  root.setAttribute('viewBox', `0 0 ${width} ${height}`)
  root.setAttribute('width', String(width))
  root.setAttribute('height', String(height))

  parsedPages.forEach(({ page, source, viewBox }, index) => {
    const group = document.createElementNS(svgNamespace, 'g')
    group.setAttribute('id', page.id)
    group.setAttribute(
      'transform',
      `translate(${(index % columns) * (tileWidth + gap) - viewBox[0]} ${Math.floor(index / columns) * (tileHeight + gap) - viewBox[1]})`,
    )
    for (const child of Array.from(source.childNodes)) {
      if (
        child.nodeType === Node.ELEMENT_NODE &&
        (child as Element).tagName.toLowerCase() === 'title'
      ) {
        continue
      }
      group.appendChild(document.importNode(child, true))
    }
    root.appendChild(group)
  })

  return new XMLSerializer().serializeToString(root)
}

export function zipSvgExportPages(
  pages: Array<{ path: string; content: string }>,
) {
  return zipSync(
    Object.fromEntries(
      pages.map(({ path, content }) => [
        path,
        new TextEncoder().encode(content),
      ]),
    ),
    { level: 6 },
  )
}
