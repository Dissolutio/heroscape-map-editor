import { Children, isValidElement, type MouseEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { HexDirectionPad } from '../controls/HexDirectionPad'

describe('HexDirectionPad', () => {
  it('renders six cardinal buttons and dispatches their direction indexes', () => {
    const onMove = vi.fn()
    const pad = HexDirectionPad({
      label: 'Move all pieces',
      onMove,
      onPreviewMove: vi.fn(),
      onClearPreview: vi.fn(),
    })
    const buttons = Children.toArray(pad.props.children).map((child) => {
      if (
        !isValidElement<{
          'aria-label': string
          onClick: (event: MouseEvent<HTMLButtonElement>) => void
        }>(child)
      ) {
        throw new Error('test setup: expected a direction button')
      }
      return child
    })

    expect(buttons.map((button) => button.props['aria-label'])).toEqual([
      'Move all pieces 1 hex north-west',
      'Move all pieces 1 hex north-east',
      'Move all pieces 1 hex west',
      'Move all pieces 1 hex east',
      'Move all pieces 1 hex south-west',
      'Move all pieces 1 hex south-east',
    ])

    for (const button of buttons) {
      button.props.onClick({} as MouseEvent<HTMLButtonElement>)
    }

    expect(onMove.mock.calls).toEqual([[4], [5], [3], [0], [2], [1]])
  })
})
