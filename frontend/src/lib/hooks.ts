'use client';

import { useEffect, useState } from 'react';
import { getStoredValue, setStoredValue } from './storage';

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => getStoredValue(key, initialValue));

  useEffect(() => {
    setStoredValue(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
