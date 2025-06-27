export const HotkeyText = ({ text }: { text: string }) => {
  return (
    <span
      style={{
        fontSize: '0.6em',
        color: 'var(--sub-white)',
        marginLeft: '0.5em',
      }}
    >
      [{text}]
    </span>
  )
}
