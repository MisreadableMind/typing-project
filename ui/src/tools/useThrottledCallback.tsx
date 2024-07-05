import { useRef } from "react";
import useRefCallback from "use-ref-callback";

/**
 * Returns a throttled version of the provided callback function.
 * The throttled callback will only be invoked once within the specified delay.
 *
 * @template T - The type of the callback function.
 * @param {T} callback - The callback function to be throttled.
 * @param {number} [delay=1000] - The delay in milliseconds before invoking the callback again.
 * @returns {T} - The throttled callback function.
 */
export default function useThrottledCallback<T extends (...args: any[]) => any>(callback: T, delay = 1e3): T {
  const cb = useRefCallback(callback);
  const cachedRef = useRef<undefined | { time: number; value: ReturnType<T> }>(undefined);

  const memoized = useRefCallback((...args: Parameters<T>) => {
    const cached = cachedRef.current;
    if (cached && cached.time > Date.now() - delay) {
      return cached.value;
    }

    cachedRef.current = {
      time: Date.now(),
      value: cb(...args),
    };

    return cachedRef.current.value;
  });

  return memoized as T;
}
