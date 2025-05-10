import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'
import { MdDelete } from 'react-icons/md'

type MapFileState = {
  id: string
  name: string
  data: any // Replace `any` with the actual map data type
}

const validateMap = (item: any): item is MapFileState => {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    item.data !== undefined
  )
}

const SaveLoadMapDialog = ({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [storageData, setStorageData] = useState(analyzeLocalStorage())
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null)

  const handleDelete = (key: string) => {
    if (confirmDeleteKey === key) {
      localStorage.removeItem(key)
      setStorageData(analyzeLocalStorage())
      setConfirmDeleteKey(null)
      enqueueSnackbar('Item deleted successfully', { variant: 'success' })
    } else {
      setConfirmDeleteKey(key)
    }
  }

  const handleSave = (map: MapFileState) => {
    localStorage.setItem(map.id, JSON.stringify(map))
    setStorageData(analyzeLocalStorage())
    enqueueSnackbar('Map saved successfully', { variant: 'success' })
  }

  const handleLoad = (key: string) => {
    const mapData = localStorage.getItem(key)
    if (mapData) {
      const parsedMap = JSON.parse(mapData)
      if (validateMap(parsedMap)) {
        enqueueSnackbar(`Loaded map: ${parsedMap.name}`, { variant: 'info' })
        // Add logic to load the map into the application
      } else {
        enqueueSnackbar('Invalid map data', { variant: 'error' })
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Save/Load Maps</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Free Space: {storageData.freeSpace} KB | Used Space:{' '}
          {storageData.usedSpace} KB
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Map Space: {storageData.mapSpace} KB
        </Typography>
        <List>
          {storageData.items.map((item) => (
            <ListItem key={item.key}>
              <ListItemText
                primary={`Key: ${item.key}`}
                secondary={`Type: ${item.type}, Size: ${item.size} KB`}
              />
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleLoad(item.key)}
                  sx={{ marginRight: 1 }}
                >
                  Load
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    handleSave({ id: item.key, name: 'New Map', data: {} })
                  }
                  sx={{ marginRight: 1 }}
                >
                  Save
                </Button>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDelete(item.key)}
                  color={confirmDeleteKey === item.key ? 'error' : 'default'}
                >
                  <MdDelete />
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

function analyzeLocalStorage(): {
  freeSpace: number
  usedSpace: number
  mapSpace: number
  items: Array<{
    key: string
    value: string | null
    size: number
    type: string
  }>
} {
  const totalSpace = 5120 // Approximate total local storage space in KB (5MB)
  let usedSpace = 0
  let mapSpace = 0

  const items = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    const value = key ? localStorage.getItem(key) : null
    const size = key && value ? (key.length + value.length) * 2 : 0
    usedSpace += size / 1024

    let type = 'string'
    try {
      const parsedValue = value && JSON.parse(value)
      if (validateMap(parsedValue)) {
        type = 'map'
        mapSpace += size / 1024
      } else if (typeof parsedValue === 'object') {
        type = 'object'
      } else if (typeof parsedValue === 'number') {
        type = 'number'
      }
    } catch {
      // Non-JSON values are treated as strings
    }

    items.push({
      key: key || '',
      value,
      size: parseFloat((size / 1024).toFixed(2)),
      type,
    })
  }

  const freeSpace = totalSpace - usedSpace

  return {
    freeSpace: parseFloat(freeSpace.toFixed(2)),
    usedSpace: parseFloat(usedSpace.toFixed(2)),
    mapSpace: parseFloat(mapSpace.toFixed(2)),
    items,
  }
}

export default SaveLoadMapDialog
