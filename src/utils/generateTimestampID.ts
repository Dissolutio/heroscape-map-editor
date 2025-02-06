export default function generateTimestampID(): string {
  return new Date().getTime().toString()
}