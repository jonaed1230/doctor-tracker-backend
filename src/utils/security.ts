/**
 * Escapes regex special characters to prevent Regular Expression Denial of Service (ReDoS)
 * and Regex Injection attacks when querying MongoDB with user-provided strings.
 */
export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

