import { Font } from '@react-pdf/renderer'

let fontsRegistered = false

export function registerPdfFonts() {
  if (fontsRegistered) return

  Font.register({
    family: 'Inter',
    fonts: [
      {
        src: 'fonts/Inter_18pt-Bold.ttf',
      },
    ],
  })
  Font.register({
    family: 'InterItalic',
    fonts: [
      {
        src: 'fonts/Inter_18pt-Italic.ttf',
      },
    ],
  })
  Font.register({
    family: 'Proxima Nova Condensed Black',
    fonts: [
      {
        src: 'fonts/ProximaNovaCondensedBlack.otf',
      },
    ],
  })

  fontsRegistered = true
}
