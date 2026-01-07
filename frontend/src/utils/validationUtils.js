// validationUtils.js
import { detectCode } from './codeDetector';

export function isLikelyCode(text) {
  // Quick validation before full detection
  if (!text || text.length < 5) return false;

  const suspiciousPatterns = [
    // Too many special characters
    /[{}()[\]<>;=]/g,
    // Line starts with special chars
    /^\s*[{}()[\]<>;=]/m,
    // Multiple lines ending with semicolons
    /;\s*$/m,
  ];

  const suspiciousCount = suspiciousPatterns.reduce((count, pattern) => {
    return count + (text.match(pattern)?.length || 0);
  }, 0);

  return suspiciousCount >= 2;
}

export function shouldUsePrism(text) {
  const codeDetection = detectCode(text);

  // Don't use prism for:
  // 1. Very short text
  if (text.length < 20 && !codeDetection.isCode) return false;

  // 2. Text that's mostly natural language
  const wordCount = text.split(/\s+/).length;
  const specialCharCount = (text.match(/[{}()[\]<>;=]/g) || []).length;

  if (specialCharCount < 2 && wordCount > 10) {
    return false;
  }

  return codeDetection.isCode;
}