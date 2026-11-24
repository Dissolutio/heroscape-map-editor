export type ObjectiveMarkerUnitNames = {
  official: string[]
  vc: string[]
}

let unitNamesPromise: Promise<ObjectiveMarkerUnitNames> | undefined

export function normalizeObjectiveMarkerUnitNames(
  data: unknown,
): ObjectiveMarkerUnitNames {
  if (Array.isArray(data)) {
    return {
      official: data.filter(
        (name): name is string => typeof name === 'string' && name.length > 0,
      ),
      vc: [],
    }
  }
  if (
    typeof data !== 'object' ||
    data === null ||
    !('official' in data) ||
    !('vc' in data)
  ) {
    throw new Error('Invalid unit-name data')
  }
  const validateNames = (value: unknown) => {
    if (!Array.isArray(value)) throw new Error('Invalid unit-name data')
    return value.filter(
      (name): name is string => typeof name === 'string' && name.length > 0,
    )
  }
  return {
    official: validateNames(data.official),
    vc: validateNames(data.vc),
  }
}

export async function loadObjectiveMarkerUnitNames() {
  unitNamesPromise ??= import('./units/objectiveMarkerUnitNames.json')
    .then((module) => normalizeObjectiveMarkerUnitNames(module.default))
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
