import { Box, Button } from '@mui/material'

export const HEX_DIRECTION_BUTTONS = [
  { direction: 4, name: 'north-west', glyph: '↖', column: 2, offset: -0.75 },
  { direction: 5, name: 'north-east', glyph: '↗', column: 3, offset: -0.75 },
  { direction: 3, name: 'west', glyph: '←', column: 1, offset: 0 },
  { direction: 0, name: 'east', glyph: '→', column: 4, offset: 0 },
  { direction: 2, name: 'south-west', glyph: '↙', column: 2, offset: 0.75 },
  { direction: 1, name: 'south-east', glyph: '↘', column: 3, offset: 0.75 },
] as const

export function HexDirectionPad({
  label,
  onMove,
  onPreviewMove,
  onClearPreview,
}: {
  label: string
  onMove: (direction: number) => void
  onPreviewMove: (direction: number) => void
  onClearPreview: () => void
}) {
  return (
    <Box
      role="group"
      aria-label={label}
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 34px)',
        gridTemplateRows: '32px',
        columnGap: '2px',
        paddingBlock: '24px',
        width: 'max-content',
      }}
    >
      {HEX_DIRECTION_BUTTONS.map(
        ({ direction, name, glyph, column, offset }) => {
          const buttonLabel = `${label} 1 hex ${name}`
          return (
            <Button
              key={direction}
              aria-label={buttonLabel}
              title={buttonLabel}
              onClick={() => onMove(direction)}
              onMouseEnter={() => onPreviewMove(direction)}
              onMouseLeave={onClearPreview}
              onFocus={() => onPreviewMove(direction)}
              onBlur={onClearPreview}
              sx={{
                gridColumn: column,
                gridRow: 1,
                height: 32,
                minWidth: 34,
                padding: 0,
                fontSize: 18,
                lineHeight: 1,
                transform: `translateY(${offset * 100}%)`,
              }}
            >
              {glyph}
            </Button>
          )
        },
      )}
    </Box>
  )
}
