import window from "./window";
import parseJson, { TJsonValue } from "./parseJson";

window?.addEventListener("storage", (e: StorageEvent) => {
  subscribers.forEach((s) => {
    if (s[0] !== e.key && prefix(s[0]) !== e.key) return;
    s[1](parseJson(e.newValue));
  });
});

const localStorage = {
  has(key: string): boolean {
    if (!has) return false;
    return has(prefix(key));
  },
  read<Value extends TJsonValue>(key: string, defaultValue: Value | null = null) {
    if (!get) return defaultValue as Value;
    const value = get(prefix(key)) ?? get(key); // TODO: @Stan remove when safe
    return (parseJson(value) ?? defaultValue) as Value;
  },
  write<Value extends TJsonValue>(key: string, value: Value | ((old: Value | null) => Value)) {
    try {
      if (typeof value === "function") {
        value = value(localStorage.read(key));
      }
      if (!set || !stringify || !del) return;

      set(prefix(key), stringify(value));
      del(key); // TODO: @Stan remove when safe
      subscribers.filter((s) => s[0] === key).forEach((s) => s[1](value as Parameters<(typeof s)[1]>));
    } catch (e) {
      console.error(e);
    }
  },
  remove(key: string) {
    if (!del) return;
    del(prefix(key));
    del(key); // TODO: @Stan remove when safe
  },
  clear() {
    clear && clear();
  },
  subscribe<Value extends TJsonValue>(key: string, callback: Subscriber<Value>) {
    subscribers.push([key, callback as Subscriber]);

    return () => {
      const index = subscribers.findIndex((s) => s[0] === key && s[1] === callback);
      if (~index) subscribers.splice(index, 1);
    };
  },
};

export default localStorage;

// #region Helpers

const prefix = (key: string) => `Tx3/${key}`;
const ls = window?.localStorage;

const has = ls?.hasOwnProperty.bind(ls);
const get = ls?.getItem.bind(ls);
const set = ls?.setItem.bind(ls);
const del = ls?.removeItem.bind(ls);
const clear = ls?.clear.bind(ls);
const stringify = window?.JSON.stringify.bind(window?.JSON);

const subscribers: [key: string, callback: Subscriber][] = [];

window && Object.assign(window, { atlasLocalStorage: localStorage });

// #endregion

// #region Types

export type { TJsonValue };

type Subscriber<Value extends TJsonValue = TJsonValue> = (value: Value | null) => void;

// #endregion
