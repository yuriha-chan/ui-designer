// Mock for @uidotdev/usehooks
export const useThrottle = <T>(value: T, delay?: number): T => {
  // Return value immediately without throttling for tests
  return value;
};

export const useDebounce = <T>(value: T, delay?: number): T => {
  // Return value immediately without debouncing for tests
  return value;
};
