import '@react-pdf/types'

declare module '@react-pdf/types' {
  interface SVGPresentationAttributes {
    dy?: number | string
    fontSize?: number | string
  }
}
