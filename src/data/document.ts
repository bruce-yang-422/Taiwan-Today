/** Accept legacy payloads as well as versioned data documents. */
export function unwrapData(value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'version' in value && 'data' in value) {
    if (typeof value.version !== 'string' || !/^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(value.version)) throw new Error('資料版本須為 x.y.z');
    return value.data;
  }
  return value;
}
