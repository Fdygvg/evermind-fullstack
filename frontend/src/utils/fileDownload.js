/**
 * Download a file from a Blob
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Name of the file
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download HTML content as a file
 * @param {string} htmlContent - HTML string to download
 * @param {string} filename - Name of the file (without extension)
 */
export function downloadHTML(htmlContent, filename = 'export') {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}-${timestamp}.html`;
  downloadBlob(blob, fullFilename);
}

/**
 * Generate filename from title
 * @param {string} title - Document title
 * @returns {string} Sanitized filename
 */
export function generateFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) || 'export';
}

