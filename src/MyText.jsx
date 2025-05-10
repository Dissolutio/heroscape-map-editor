import { Text } from '@react-pdf/renderer'
import React from 'react'

export default function MyText({ children }) {
  return <Text bookmark={{ title: 'Level 1' }}>{children}</Text>
}
