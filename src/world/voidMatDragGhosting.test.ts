import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { describe, expect, it } from 'vitest'
import { Pieces } from '../types'
import { ghostMapDuringVoidMatDrag } from './voidMatDragGhosting'

describe('Void Mat drag ghosting', () => {
  it('fades and disables other meshes, preserves the table and void layer, then restores', () => {
    const root = new Group()
    const piece = new Mesh(new BoxGeometry(), new MeshStandardMaterial())
    const pieceMaterial = piece.material
    const pieceRaycast = piece.raycast
    const originalInstanceRaycast = () => undefined
    const instance = Object.assign(new Group(), {
      raycast: originalInstanceRaycast,
    })
    const tableGroup = new Group()
    tableGroup.userData.voidMatDragTable = true
    const table = new Mesh(new BoxGeometry(), new MeshStandardMaterial())
    const tableMaterial = table.material
    const matGroup = new Group()
    matGroup.userData.inventoryID = Pieces.voidMat
    const mat = new Mesh(new BoxGeometry(), new MeshStandardMaterial())
    const matMaterial = mat.material
    const previewGroup = new Group()
    previewGroup.userData.voidMatDragPreview = true
    const preview = new Mesh(new BoxGeometry(), new MeshStandardMaterial())
    const previewMaterial = preview.material

    root.add(piece, instance, tableGroup, matGroup, previewGroup)
    tableGroup.add(table)
    matGroup.add(mat)
    previewGroup.add(preview)
    const restore = ghostMapDuringVoidMatDrag(root)

    expect(piece.material).not.toBe(pieceMaterial)
    expect(piece.material).toMatchObject({
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    })
    expect(piece.raycast).not.toBe(pieceRaycast)
    expect(instance.raycast).not.toBe(originalInstanceRaycast)
    expect(table.material).toBe(tableMaterial)
    expect(mat.material).toBe(matMaterial)
    expect(preview.material).toBe(previewMaterial)

    restore()

    expect(piece.material).toBe(pieceMaterial)
    expect(piece.raycast).toBe(pieceRaycast)
    expect(instance.raycast).toBe(originalInstanceRaycast)
    expect(table.material).toBe(tableMaterial)
    expect(mat.material).toBe(matMaterial)
    expect(preview.material).toBe(previewMaterial)
  })
})
