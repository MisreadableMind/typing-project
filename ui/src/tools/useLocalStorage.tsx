import { useEffect, useState } from "react";
import localStorage, { TJsonValue } from "./localStorage";
import useThrottledCallback from "./useThrottledCallback";

/**
 * React.useState hook that is connected to the local storage value (stores data there and sync it back)
 *
 * @template T - The type of the value to be stored in local storage.
 * @template TD - The type of the default value.
 * @param {string} key - The key used to store the value in local storage.
 * @param {TD} [defaultValue] - The default value to be used if no value is found in local storage.
 * @returns {[T | TD, TUseLocalStorageSet<T>]} - A tuple containing the current value and a setter function.
 */
export default function useLocalStorage<T extends TJsonValue, TD = T>(
  key: string,
  defaultValue?: TD
): [T | TD, TUseLocalStorageSet<T>] {
  const [value, setValue] = useState<T | TD>(() =>
    localStorage.has(key) ? localStorage.read<T>(key) : (defaultValue as TD)
  );

  const set = useThrottledCallback<TUseLocalStorageSet<T>>(
    (setter) =>
      setValue((previous) => {
        if (typeof setter === "function") setter = setter(previous as T);
        localStorage.write(key, setter);
        return setter;
      }),
    10
  );

  useEffect(() => localStorage.subscribe<T>(key, (newValue) => setValue(newValue as T)), [key]);

  return [value, set];
}

// #region Types

export type { TJsonValue };

export type TUseLocalStorageSet<T> = (setter: T | ((previous: T | undefined) => T)) => void;

// #endregion
