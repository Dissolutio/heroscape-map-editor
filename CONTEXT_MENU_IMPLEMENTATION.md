# Right-Click Context Menu Implementation for Pieces

## Overview

The context menu system allows users to right-click on pieces in the 3D view to access selection expansion options. The implementation consists of:

1. **PieceContextMenu** - The UI component that displays the context menu
2. **usePiecePointerHandler** - Hook for handling left/right click separation
3. **selection-utils** - Utilities for selecting groups of related pieces
4. **MapDisplay3D** - Manages context menu state globally

## How It Works

### 1. Context Menu State Management (MapDisplay3D)

The main 3D view component maintains the context menu state and provides a handler that piece models can call on right-click.

```tsx
const [contextMenuState, setContextMenuState] = useState({
  anchorEl: HTMLElement | null,
  pieceID: string,
})

const handleOpenContextMenu = (event: ThreeEvent<PointerEvent>, pieceID: string) => {
  // Creates anchor element at cursor position and sets menu state
}
```

### 2. Piece Model Components

Individual piece models (like Outcrop3, Cannon, Ruins3) accept an optional `onContextMenu` prop:

```tsx
function MyPieceModel({
  pid,
  onContextMenu,
}: {
  pid: string
  onContextMenu?: (e: ThreeEvent<PointerEvent>, pieceID: string) => void
}) {
  const { handlePointerUp } = usePiecePointerHandler({
    pieceID: pid,
    onLeftClick: (_, isMultiSelect) => {
      toggleSelectedPieceID(pid, isMultiSelect)
    },
    onRightClick: onContextMenu,
  })

  return (
    <mesh onPointerUp={handlePointerUp}>
      {/* mesh content */}
    </mesh>
  )
}
```

### 3. Selection Expansion Options

The context menu provides several selection options through utilities in `selection-utils.ts`:

- **selectAllPiecesOnLevel** - Select all pieces at the same altitude
- **selectAllPiecesOfType** - Select all pieces of the same type on the same level
- **selectNeighboringPieces** - Select pieces adjacent to the clicked piece
- **Add/Remove from selection** - Manually add or remove the clicked piece from current selection

## How to Extend to Other Piece Components

To add context menu support to a piece component:

### Step 1: Update Component Signature

Add an `onContextMenu` prop to your component:

```tsx
export default function MyPiece({
  pid,
  onContextMenu,
}: {
  pid: string
  onContextMenu?: (e: ThreeEvent<PointerEvent>, pieceID: string) => void
})
```

### Step 2: Add Pointer Handler Hook

Import and use the hook:

```tsx
import { usePiecePointerHandler } from '../../hooks/usePiecePointerHandler'

const { handlePointerUp } = usePiecePointerHandler({
  pieceID: pid,
  onLeftClick: (_, isMultiSelect) => {
    toggleSelectedPieceID(pid, isMultiSelect)
  },
  onRightClick: onContextMenu,
})
```

### Step 3: Update Pointer Event Handler

Replace the old `onPointerUp` handler with the new `handlePointerUp`:

```tsx
// Before
const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
  event.stopPropagation()
  if (event.button !== 0) return
  toggleSelectedPieceID(pid, event.shiftKey || event.ctrlKey || event.metaKey)
}

// After
<mesh onPointerUp={handlePointerUp}>
```

### Step 4: Pass Prop from MapBoardPiece3D

In `MapBoardPiece3D.tsx`, find where your component is rendered and pass the `onContextMenuPiece` prop:

```tsx
<MyPiece pid={uid} onContextMenu={onContextMenuPiece} />
```

## Files Modified

- `src/controls/PieceContextMenu.tsx` - Main context menu component
- `src/hooks/usePiecePointerHandler.ts` - Pointer event handling hook
- `src/utils/selection-utils.ts` - Selection expansion utilities
- `src/world/MapDisplay3D.tsx` - Context menu state management
- `src/world/MapBoardPiece3D.tsx` - Pass context menu handler to pieces
- `src/world/models/Outcrop3.tsx` - Example implementation
- `src/world/models/Cannon.tsx` - Example implementation
- `src/world/models/Ruins3.tsx` - Example implementation

## Future Enhancements

Currently implemented:
- Basic context menu with selection options
- Select all on level
- Select all of type on same level
- Add neighboring pieces to selection

Potential future options:
- Delete piece(s) from context menu
- Copy/paste pieces
- Group operations
- Advanced filtering
- Contextual actions based on piece type
