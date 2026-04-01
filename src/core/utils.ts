// src/core/utils.ts
// Shared utility functions used across core modules.

export function deepMerge(
  target: Record<string, any>,
  overrides: Record<string, unknown>
): Record<string, any> {
  const result: Record<string, any> = { ...target };

  for (const key of Object.keys(overrides)) {
    const overrideVal = overrides[key];
    const targetVal = result[key];

    if (
      overrideVal !== null &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, any>,
        overrideVal as Record<string, unknown>
      );
    } else {
      result[key] = overrideVal;
    }
  }

  return result;
}
