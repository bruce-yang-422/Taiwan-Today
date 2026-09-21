export const extensionStorage = () => typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
export async function readStorage(key: string): Promise<unknown> {
  if (extensionStorage()) return (await chrome.storage.local.get(key))[key];
  const value = localStorage.getItem(key);
  return value === null ? undefined : JSON.parse(value);
}
export async function writeStorage(key: string, value: unknown) {
  if (extensionStorage()) await chrome.storage.local.set({ [key]: value });
  else localStorage.setItem(key, JSON.stringify(value));
}
