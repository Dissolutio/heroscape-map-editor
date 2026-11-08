import { Box, IconButton, TextField } from '@mui/material'
import { MdAutorenew } from 'react-icons/md'
import { genRandomMapName } from '../utils/genRandomMapName'

export function MapNameField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Box
      sx={{
        p: '1em 4px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <TextField
        id="newMapName"
        autoFocus
        required
        value={value}
        name="newMapName"
        onChange={(event) => onChange(event.target.value)}
        margin="dense"
        label="Map Title"
        type="text"
        fullWidth
        variant="outlined"
      />
      <IconButton
        title="Generate new random map name"
        type="button"
        sx={{ p: '10px' }}
        onClick={() => onChange(genRandomMapName())}
      >
        <MdAutorenew />
      </IconButton>
    </Box>
  )
}
