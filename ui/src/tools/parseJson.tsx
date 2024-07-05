import window from "./window";

export default function parseJson<T = TJsonValue, TDefault = undefined>(
  json: unknown,
  defaultValue?: TDefault
): T | TDefault {
  if (typeof json !== "string") return defaultValue as TDefault;

  try {
    return window.JSON.parse(json);
  } catch (error) {
    console.error(`Could not parse JSON string: ${json}\n`, error);
    return defaultValue as TDefault;
  }
}

// #region Types

export type TJsonValue = null | string | number | boolean | { [x: string]: TJsonValue } | TJsonValue[];

// #endregion
