import { Box, TextField } from '@mui/material'
import type React from 'react'

export const MAP_AUTHOR_FIELD_NAME = 'newAuthorName'
export const MAP_NOTES_FIELD_NAME = 'mapNotes'

type Props = {
  authorName: string
  onAuthorNameChange: (value: string) => void
  mapNotes: string
  onMapNotesChange: (value: string) => void
  authorControl?: React.ReactNode
}

export function MapAuthorNotesFields({
  authorName,
  onAuthorNameChange,
  mapNotes,
  onMapNotesChange,
  authorControl,
}: Props) {
  return (
    <>
      <Box sx={{ p: '1em 4px' }}>
        <TextField
          id={MAP_AUTHOR_FIELD_NAME}
          name={MAP_AUTHOR_FIELD_NAME}
          value={authorName}
          onChange={(event) => onAuthorNameChange(event.target.value)}
          margin="dense"
          label="Map Author"
          type="text"
          fullWidth
          variant="outlined"
        />
        {authorControl}
      </Box>
      <Box sx={{ p: '1em 4px' }}>
        <TextField
          id={MAP_NOTES_FIELD_NAME}
          name={MAP_NOTES_FIELD_NAME}
          label="Map Notes"
          value={mapNotes}
          onChange={(event) => onMapNotesChange(event.target.value)}
          placeholder="Your notes here..."
          fullWidth
          multiline
          rows={4}
        />
      </Box>
    </>
  )
}
