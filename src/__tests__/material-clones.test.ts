/**
 * MATERIAL CLONES (utils/materialClones.ts)
 *
 * The move/rotate previews draw a see-through ghost of the selected piece.
 * Its models take materials from a global cache shared with the real pieces,
 * so the ghost must change private clones only. Before this, hovering a move
 * button left the real piece at 35% opacity for good.
 */
import { MeshBasicMaterial } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { createMaterialCloner } from '../utils/materialClones'

describe('createMaterialCloner', () => {
  it('returns a clone, not the original', () => {
    const original = new MeshBasicMaterial({ color: 'yellow' })
    const { cloneMaterial } = createMaterialCloner()
    const clone = cloneMaterial(original)
    expect(clone).not.toBe(original)
    expect(clone.uuid).not.toBe(original.uuid)
    expect(clone.color.getHexString()).toBe(original.color.getHexString())
  })

  it('mutating a clone leaves the original untouched', () => {
    const original = new MeshBasicMaterial({ color: 'yellow' })
    const clone = createMaterialCloner().cloneMaterial(original)
    clone.transparent = true
    clone.opacity = 0.35
    clone.color.set('red')
    expect(original.transparent).toBe(false)
    expect(original.opacity).toBe(1)
    expect(original.color.getHexString()).toBe('ffff00')
  })

  it('clones each distinct material once, across meshes and inside arrays', () => {
    const shared = new MeshBasicMaterial()
    const other = new MeshBasicMaterial()
    const { cloneMaterial } = createMaterialCloner()
    const first = cloneMaterial(shared)
    const second = cloneMaterial(shared)
    const array = cloneMaterial([shared, other, shared])
    expect(second).toBe(first)
    expect(array).toHaveLength(3)
    expect(array[0]).toBe(first)
    expect(array[2]).toBe(first)
    expect(array[1]).not.toBe(other)
    expect(array[1]).not.toBe(first)
  })

  it('treats its own clones as already cloned', () => {
    const { cloneMaterial, isClone } = createMaterialCloner()
    const original = new MeshBasicMaterial()
    const clone = cloneMaterial(original)
    expect(isClone(clone)).toBe(true)
    expect(isClone(original)).toBe(false)
    expect(cloneMaterial(clone)).toBe(clone)
  })

  it('dispose() disposes every clone exactly once, and never an original', () => {
    const a = new MeshBasicMaterial()
    const b = new MeshBasicMaterial()
    const originalDispose = vi.spyOn(a, 'dispose')
    const { cloneMaterial, dispose } = createMaterialCloner()
    const clones = cloneMaterial([a, b, a])
    cloneMaterial(b)
    const spies = [clones[0], clones[1]].map((c) => vi.spyOn(c, 'dispose'))
    dispose()
    for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1)
    expect(originalDispose).not.toHaveBeenCalled()
    dispose()
    for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1)
  })
})
