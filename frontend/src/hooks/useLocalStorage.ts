import { useState } from 'react';

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed: unknown = JSON.parse(raw);
      if (
        Array.isArray(initial)
          ? !Array.isArray(parsed)
          : typeof parsed !== typeof initial || parsed === null
      )
        return initial;
      return parsed as T;
    } catch {
      return initial;
    }
  });
  const [storageError, setStorageError] = useState(false);
  function update(next: T | ((previous: T) => T)) {
    setValue((previous) => {
      const resolved = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
      return resolved;
    });
  }
  return [value, update, storageError] as const;
}
