import { G, Text } from '@react-pdf/renderer'
import {
  Children,
  Fragment,
  createElement,
  isValidElement,
  type ReactNode,
} from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { getPieceGameHeight, piecesSoFar } from '../data/pieces'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import useBoundStore from '../store/store'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import { type BoardHex, Pieces } from '../types'
import type { BuriedMarksByUID } from '../utils/tileMarks'
import { makeTable, place } from './helpers/board'

// These numbers are rules heights; glacier/outcrop numbers are hex counts and
// ruin numbers are variants.
const RULES_HEIGHT_PIECES = [
  [Pieces.snowTree10, 10],
  [Pieces.snowTree12, 12],
  [Pieces.tree10, 10],
  [Pieces.tree11, 11],
  [Pieces.tree12, 12],
  [Pieces.tree415, 15],
  [Pieces.laurPalm13, 13],
  [Pieces.laurPalm14, 14],
  [Pieces.laurPalm15, 15],
  [Pieces.palm14, 14],
  [Pieces.palm15, 15],
  [Pieces.palm16, 16],
  [Pieces.shroudshroom7, 7],
  [Pieces.shroudshroom10, 10],
  [Pieces.shroudshroom13, 13],
] as const

const DEV_PHYSICAL_HEIGHTS = `
a1:1,a2:1,a24:1,a3:1,a7:1,at1:1,at2:1,at24:1,at3:1,at7:1,bt:5,c1:1,c2:1,
c24:1,c3:1,c6:1,c7:1,ca:9,cab:9,cbc:1,cbe:1,cbs:1,cg1:1,cg7:1,cg9:1,cn:3,
cwc:9,cwe:9,cws:9,d1:1,d2:1,d24:1,d3:1,d7:1,fw:9,g1:1,g2:1,g24:1,g3:1,
g7:1,gf1:0,gf2:0,gf24:0,gf3:0,gf7:0,gn1:1,gn2:1,gn24:1,gn3:1,gn7:1,h:17,
i1:0,i3:0,i4:0,i6:0,l1:0,l3:0,lb10:10,ld:2,lf1:1,lf2:1,lf24:1,lf3:1,lf7:1,
lp13:13,lp14:14,lp15:15,lwa:12,lwl:12,lwl2:12,lwp:12,lwp2:12,lwr:8,lwr2:12,
lwr3:12,lws:12,lws2:12,lwt:12,m10:10,m13:13,m7:7,o1:7,o3:9,og1:7,og3:9,
og4:8,og6:17,ol1:7,ol3:9,ot1:7,ot3:9,r1:1,r2:1,r24:1,r3:1,r7:1,rd1:1,
rd2:1,rd5:1,rl:7,rm:9,rmb:9,rmn:9,rmnb:9,rs2:5,rs3:5,rw:3,s1:1,s2:1,
s24:1,s3:1,s7:1,sb:13,sb10:10,sh1:0,sh3:0,sl:10,sn1:1,sn2:1,sn24:1,sn3:1,
sn7:1,str10:10,str12:12,sw1:1,sw2:1,sw24:1,sw3:1,sw7:1,tb9:9,tp14:14,
tp15:15,tp16:16,tr10:9,tr11:11,tr12:11,tr15:15,w1:0,w3:0,wd2:1,ws1:0,
ws3:0,ws6:0,ww1:0,x1:1,x3:1,xw1:0,y0:0,y1:0,z1:0,z2:0,z3:0,z4:0,z5:0,
z6:0,z7:0,z8:0
`.replace(/\s/g, '')

const makePieceHex = (inventoryID: string): BoardHex => ({
  id: '0~0~0',
  q: 0,
  r: 0,
  s: 0,
  altitude: 0,
  pieceID: `0~0~0~0~${inventoryID}`,
  inventoryID,
  terrain: piecesSoFar[inventoryID].terrain,
  pieceRotation: 0,
  isObstacleOrigin: true,
})

const initialState = useBoundStore.getState()

const setExportState = (hex: BoardHex) => {
  useBoundStore.setState({
    boardHexes: { [hex.id]: hex },
    boardPieces: [],
    viewingLevel: 0,
    is2DOverlayLevelEnabled: false,
    isShow2DExportTileLetters: false,
    isShow2DExportBuriedMarks: false,
    isHideHeightsOnGlyphs: false,
  })
}

const renderSvgHex = (hex: BoardHex) =>
  renderToStaticMarkup(
    createElement(
      'svg',
      { xmlns: 'http://www.w3.org/2000/svg' },
      createElement(SvgMapHex, {
        hex,
        buriedMarksByUID: {} as BuriedMarksByUID,
      }),
    ),
  )

const renderPdfHex = (hex: BoardHex) =>
  PdfMapHex({
    hex,
    viewingLevel: 0,
    isOverlayViewing: true,
    isPdfColorBorders: false,
    isShowPdfOverlayOnPlacedLevel: false,
    isShowPdfTileLetters: false,
    isShowPdfBuriedMarks: false,
    buriedMarksByUID: {} as BuriedMarksByUID,
    useLegacyStartZones: false,
  })

const getPdfText = (node: ReactNode): string[] =>
  Children.toArray(node).flatMap((child) => {
    if (!isValidElement(child)) return []
    if (child.type === Text) {
      return Children.toArray(child.props.children).map(String)
    }
    if (child.type === Fragment || child.type === G) {
      return getPdfText(child.props.children)
    }
    if (typeof child.type === 'function') {
      const renderComponent = child.type as (props: unknown) => ReactNode
      return getPdfText(renderComponent(child.props))
    }
    return []
  })

afterEach(() => {
  useBoundStore.setState({
    boardHexes: initialState.boardHexes,
    boardPieces: initialState.boardPieces,
    viewingLevel: initialState.viewingLevel,
    is2DOverlayLevelEnabled: initialState.is2DOverlayLevelEnabled,
    isShow2DExportTileLetters: initialState.isShow2DExportTileLetters,
    isShow2DExportBuriedMarks: initialState.isShow2DExportBuriedMarks,
    isHideHeightsOnGlyphs: initialState.isHideHeightsOnGlyphs,
  })
})

const PHYSICAL_LABEL_CASES: [string, string[]][] = [
  [Pieces.glacier1, ['7']],
  [Pieces.glacier3, ['5', '9', '7']],
  [Pieces.glacier4, ['7', '11', '9', '11']],
  [Pieces.glacier6, ['9', '17', '17', '9', '17', '17']],
  [Pieces.outcrop1, ['7']],
  [Pieces.outcrop3, ['5', '9', '7']],
  [Pieces.lavaRockOutcrop1, ['7']],
  [Pieces.lavaRockOutcrop3, ['5', '9', '7']],
  [Pieces.toxicOutcrop1, ['7']],
  [Pieces.toxicOutcrop3, ['5', '9', '7']],
]

describe('printed piece heights', () => {
  it('matches the dev physical-height snapshot', () => {
    const physicalHeights = Object.values(Pieces)
      .sort()
      .map(
        (inventoryID) => `${inventoryID}:${piecesSoFar[inventoryID]?.height}`,
      )
      .join(',')

    expect(physicalHeights).toBe(DEV_PHYSICAL_HEIGHTS)
  })

  it.each(RULES_HEIGHT_PIECES)(
    'uses the rules height for %s',
    (pieceID, rulesHeight) => {
      expect(getPieceGameHeight(pieceID)).toBe(rulesHeight)
    },
  )

  it.each([
    [Pieces.tree10, 9, 10],
    [Pieces.tree12, 11, 12],
  ])(
    'keeps %s physical clearance while resolving its game height',
    (pieceID, physicalHeight, gameHeight) => {
      expect(piecesSoFar[pieceID].height).toBe(physicalHeight)
      expect(getPieceGameHeight(pieceID)).toBe(gameHeight)
    },
  )

  it('uses the physical height when no game-height override is needed', () => {
    expect(getPieceGameHeight(Pieces.tree11)).toBe(11)
  })

  it.each([
    [Pieces.tree10, 10],
    [Pieces.tree12, 12],
  ])('renders %s game height in both SVG and PDF', (pieceID, gameHeight) => {
    const hex = makePieceHex(pieceID)
    setExportState(hex)

    expect(renderSvgHex(hex)).toContain(`>${gameHeight}</text>`)

    const pdf = renderPdfHex(hex)
    if (!pdf) throw new Error('Expected PDF hex output')
    expect(getPdfText(pdf)).toContain(String(gameHeight))
  })

  it('prints tree10 as 10 while its placement blocks 9 levels', () => {
    const hex = makePieceHex(Pieces.tree10)
    setExportState(hex)

    expect(renderSvgHex(hex)).toContain('>10</text>')

    const pdf = renderPdfHex(hex)
    if (!pdf) throw new Error('Expected PDF hex output')
    expect(getPdfText(pdf)).toContain('10')

    const table = makeTable()
    const result = place({
      board: table,
      pieceID: Pieces.tree10,
      at: table.center,
      altitude: 0,
      uid: 'tree10',
    })
    expect(result.error).toBeUndefined()
    const occupiedLevels = Object.values(result.board.boardHexes).filter(
      (placedHex) =>
        placedHex.boardPieceUID === 'tree10' &&
        placedHex.q === table.center.q &&
        placedHex.r === table.center.r,
    )
    expect(occupiedLevels).toHaveLength(9)
  })

  it.each(PHYSICAL_LABEL_CASES)(
    'prints physical heights for %s',
    (pieceID, physicalHeights) => {
      const hex = makePieceHex(pieceID)
      setExportState(hex)

      const svgLabels = [
        ...renderSvgHex(hex).matchAll(/<text\b[^>]*>(\d+)<\/text>/g),
      ].map((match) => match[1])
      expect(svgLabels).toEqual(expect.arrayContaining(physicalHeights))

      const pdf = renderPdfHex(hex)
      if (!pdf) throw new Error('Expected PDF hex output')
      expect(getPdfText(pdf)).toEqual(expect.arrayContaining(physicalHeights))
    },
  )
})
