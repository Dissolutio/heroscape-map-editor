export const HotkeyText = ({ text }: { text: string }) => {
  return (
    <span
      title={`Use hotkey: ${text?.toUpperCase()} to execute this action`}
      style={{
        fontSize: '0.6em',
        color: 'var(--sub-white)',
        marginLeft: '0.5em',
      }}
    >
      [{text?.toUpperCase()}]
    </span>
  )
}
