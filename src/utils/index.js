// Helper functions (e.g., JSON parsing/validation)
export { parseGeminiResponse } from './parseGeminiResponse';

export const parseJSONSafely = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};
