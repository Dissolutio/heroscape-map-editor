import {
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import React from 'react'
import { MdDelete } from 'react-icons/md'
import type { MapFileState } from '../types'

const maxLocalStorageSize = 5120

const LocalStorageList = () => {
  const [storageData, setStorageData] = React.useState(analyzeLocalStorage())

  const handleDelete = (key: string) => {
    localStorage.removeItem(key)
    setStorageData(analyzeLocalStorage())
  }

  return (
    <Container sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        Local Storage Items
      </Typography>
      <List>
        {storageData.items.map((item) => (
          <ListItem
            key={item.key}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDelete(item.key)}
              >
                <MdDelete />
              </IconButton>
            }
          >
            <ListItemText
              primary={`Key: ${item.key}`}
              secondary={`Type: ${item.type}, Size: ${item.size} KB, Value: ${item.value}`}
            />
          </ListItem>
        ))}
      </List>
      <Typography variant="body2" color="textSecondary">
        Available: {maxLocalStorageSize - storageData.totalSize} KB
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Total Items: {storageData.itemCount}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Used: {storageData.totalSize} KB
      </Typography>
      {/* | Total Items: {storageData.itemCount}
          | Size unused: {storageData.totalSize} KB */}
    </Container>
  )
}

const validateIsHexoscapeMap = (item: any): item is MapFileState => {
  // TODO: Add more specific validation logic based on MapFileState structure
  return (
    typeof item === 'object' &&
    item !== null &&
    'hexMap' in item &&
    typeof item.hexMap === 'object' &&
    'boardPieces' in item &&
    typeof item.boardPieces === 'object'
    // Add more checks for other required properties
  )
}
type LocalStorageItem = {
  key: string
  value: MapFileState | number | object | string | null
  size: number
  type: string
}
function analyzeLocalStorage(): {
  totalSize: number
  itemCount: number
  dataTypeCounts: Record<string, number>
  items: Array<LocalStorageItem>
} {
  const storageInfo = {
    totalSize: 0, // Total size in kilobytes
    itemCount: 0, // Total number of items
    dataTypeCounts: {} as Record<string, number>, // Counts of each data type (string, object, number, etc.)
    items: [] as Array<LocalStorageItem>,
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    let itemSize = 0
    const value = key ? localStorage.getItem(key) : null

    if (value && key) {
      // Calculate the size of each item in bytes, accounting for UTF-16 encoding
      itemSize = (key.length + value.length) * 2
      storageInfo.totalSize += itemSize
    }

    // Determine data type and update counts
    let dataType = 'string'
    const parsedValue =
      value && isJSON(value)
        ? JSON.parse(value)
        : (value?.toString() ?? 'unknown')
    if (validateIsHexoscapeMap(parsedValue)) {
      dataType = 'map'
    } else if (typeof parsedValue === 'object' && parsedValue !== null) {
      dataType = 'object'
    } else if (typeof parsedValue === 'number') {
      dataType = 'number'
    } else if (typeof parsedValue === 'boolean') {
      dataType = 'boolean'
    }

    if (storageInfo.dataTypeCounts[dataType]) {
      storageInfo.dataTypeCounts[dataType]++
    } else {
      storageInfo.dataTypeCounts[dataType] = 1
    }

    storageInfo.items.push({
      key: key || '',
      value: parsedValue,
      size: Number.parseFloat((itemSize / 1024).toFixed(2)),
      type: dataType,
    })

    storageInfo.itemCount++
  }

  // Convert total size to KB
  storageInfo.totalSize = Number.parseFloat(
    (storageInfo.totalSize / 1024).toFixed(2),
  )

  return storageInfo
}

const localStorageData = analyzeLocalStorage()
console.log(localStorageData)
export default LocalStorageList

// Helper function to check if a string is valid JSON
function isJSON(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}
