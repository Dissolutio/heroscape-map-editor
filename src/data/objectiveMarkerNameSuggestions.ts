let unitNamesPromise: Promise<string[]> | undefined

export async function loadObjectiveMarkerUnitNames() {
  unitNamesPromise ??= fetch(
    `${import.meta.env.BASE_URL}objective-marker-unit-names.json`,
  )
    .then((response) => {
      if (!response.ok) throw new Error('Could not load unit names')
      return response.json() as Promise<unknown>
    })
    .then((data) => {
      if (!Array.isArray(data)) throw new Error('Invalid unit-name data')
      return data.filter(
        (name): name is string => typeof name === 'string' && name.length > 0,
      )
    })
    .catch((error: unknown) => {
      unitNamesPromise = undefined
      throw error
    })
  return unitNamesPromise
}

export function getObjectiveMarkerNameSuggestions(
  names: string[],
  input: string,
) {
  const query = input.trim().toLowerCase()
  if (!query) return []

  return names
    .map((name) => ({ name, lowerName: name.toLowerCase() }))
    .filter(({ lowerName }) => lowerName.includes(query))
    .sort((first, second) => {
      const firstPrefix = first.lowerName.startsWith(query)
      const secondPrefix = second.lowerName.startsWith(query)
      if (firstPrefix !== secondPrefix) return firstPrefix ? -1 : 1
      return first.name.localeCompare(second.name, 'en', {
        sensitivity: 'base',
      })
    })
    .slice(0, 20)
    .map(({ name }) => name)
}
