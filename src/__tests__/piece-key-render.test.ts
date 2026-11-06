import { createElement, type ReactNode, isValidElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { PieceKeyShape } from '../pdf-map/PdfPieceLegend'
import { PdfMapHex } from '../pdf-map/PdfMapHex'
import useBoundStore from '../store/store'
import { type BoardHex, type BoardPiece, HexTerrain, Pieces } from '../types'
import type { PieceKeyEntry } from '../pdf-svg-shared/pieceKey'
import { SvgMapHex } from '../svg-map/SvgMapHex'
import { SvgPieceKeyShape } from '../svg-map/SvgPieceKey'

const initialGenericColors = {
  genericSolidCapColor: useBoundStore.getState().genericSolidCapColor,
  genericSolidSideColor: useBoundStore.getState().genericSolidSideColor,
}

afterEach(() => {
  useBoundStore.setState(initialGenericColors)
})

const collectShapeColors = (node: ReactNode): unknown[] => {
  if (Array.isArray(node)) return node.flatMap(collectShapeColors)
  if (!isValidElement(node)) return []

  const { type, props } = node
  if (typeof type === 'function') {
    const renderComponent = type as (componentProps: typeof props) => ReactNode
    return collectShapeColors(renderComponent(props))
  }
  const shapeColor =
    'fill' in props || 'stroke' in props
      ? {
          fill: props.fill,
          stroke: props.stroke,
          strokeWidth: props.strokeWidth,
        }
      : null
  return [
    ...(shapeColor ? [shapeColor] : []),
    ...collectShapeColors(props.children),
  ]
}

describe('piece key shape rendering', () => {
  it('matches map fill and stroke in both border modes with Generic colors', () => {
    const piece: BoardPiece = {
      uid: 'key-generic',
      inventoryID: Pieces.generic1,
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 0, r: 0, s: 0 },
    }
    const hex: BoardHex = {
      id: '0~0~0',
      q: 0,
      r: 0,
      s: 0,
      altitude: 0,
      pieceID: '0~0~0~0~gn1',
      boardPieceUID: piece.uid,
      inventoryID: Pieces.generic1,
      terrain: HexTerrain.generic,
      pieceRotation: 0,
      isCap: true,
    }
    const entry: PieceKeyEntry = {
      inventoryID: piece.inventoryID,
      title: 'Generic (1)',
      terrain: HexTerrain.generic,
      count: 1,
      piece,
      hexes: [hex],
    }
    const genericCapColor = '#123456'
    const genericSideColor = '#234567'
    useBoundStore.setState({
      genericSolidCapColor: genericCapColor,
      genericSolidSideColor: genericSideColor,
    })

    for (const useTerrainBorderColor of [true, false]) {
      const mapProps = {
        hex,
        viewingLevel: 1,
        isOverlayViewing: true,
        isPdfColorBorders: useTerrainBorderColor,
        isShowPdfOverlayOnPlacedLevel: true,
        isShowPdfTileLetters: false,
        isShowPdfBuriedMarks: false,
        buriedMarksByUID: new Map(),
        useLegacyStartZones: false,
        isPieceKeyPreview: true,
      }
      const keyShape = PieceKeyShape({
        entry,
        useTerrainBorderColor,
        scale: 0.075,
      })
      const keyColors = collectShapeColors(keyShape)
      const mapColors = collectShapeColors(PdfMapHex(mapProps))

      expect(keyColors).toEqual(mapColors)
      expect(keyColors).toContainEqual(
        expect.objectContaining({ fill: genericCapColor }),
      )
    }

    const mapSvg = renderToStaticMarkup(
      createElement(SvgMapHex, {
        hex,
        buriedMarksByUID: new Map(),
        isPieceKeyPreview: true,
      }),
    )
    const keySvg = renderToStaticMarkup(
      SvgPieceKeyShape(entry, 0, 0, 0.075, 'generic'),
    )
    const svgColors = (markup: string) =>
      markup.match(/(?:fill|stroke)="[^"]+"/g) ?? []

    expect(svgColors(keySvg)).toEqual(svgColors(mapSvg))
  })
})
