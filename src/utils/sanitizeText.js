let stripAnsi = null;

// Dynamically import strip-ansi (ES module) at module load
// This starts loading immediately, and by the time sanitizeText is called
// (after initialization), it should be ready. If not, we fallback to text.
(async () => {
  const stripAnsiModule = await import('strip-ansi');
  stripAnsi = stripAnsiModule.default;
})();

/**
 * Comprehensive text sanitization function that removes invisible characters
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
function sanitizeText(text) {
  if (typeof text !== 'string') {
    return text;
  }

  let sanitized = stripAnsi ? stripAnsi(text) : text;

  // Remove invisible characters using targeted patterns
  // Zero-width characters
  sanitized = sanitized.replace(/[\u200B-\u200F\u2060]/g, '');
  
  // Zero-width joiners and non-joiners
  sanitized = sanitized.replace(/[\u200C\u200D]/g, '');
  
  // Format characters and variation selectors
  sanitized = sanitized.replace(/[\uFE00-\uFE0F]/g, '');
  
  // Control characters - using individual character removal to avoid linting issues
  const controlChars = [
    '\u0000', '\u0001', '\u0002', '\u0003', '\u0004', '\u0005', '\u0006', '\u0007', '\u0008',
    '\u000B', '\u000C', '\u000E', '\u000F', '\u0010', '\u0011', '\u0012', '\u0013', '\u0014',
    '\u0015', '\u0016', '\u0017', '\u0018', '\u0019', '\u001A', '\u001B', '\u001C', '\u001D',
    '\u001E', '\u001F', '\u007F', '\u0080', '\u0081', '\u0082', '\u0083', '\u0084', '\u0085',
    '\u0086', '\u0087', '\u0088', '\u0089', '\u008A', '\u008B', '\u008C', '\u008D', '\u008E',
    '\u008F', '\u0090', '\u0091', '\u0092', '\u0093', '\u0094', '\u0095', '\u0096', '\u0097',
    '\u0098', '\u0099', '\u009A', '\u009B', '\u009C', '\u009D', '\u009E', '\u009F'
  ];
  
  controlChars.forEach(char => {
    sanitized = sanitized.replace(new RegExp(char, 'g'), '');
  });
  
  // Other invisible characters
  sanitized = sanitized.replace(/[\u034F\u061C\u070F\u115F\u1160]/g, '');
  sanitized = sanitized.replace(/[\u17B4\u17B5]/g, '');
  sanitized = sanitized.replace(/[\u180B-\u180D]/g, '');
  sanitized = sanitized.replace(/[\u2028\u2029]/g, '');
  sanitized = sanitized.replace(/[\u202A-\u202E]/g, '');
  sanitized = sanitized.replace(/[\u2066-\u2069]/g, '');
  sanitized = sanitized.replace(/[\u3164\uFEFF\uFFA0]/g, '');
  
  // Private use area characters
  sanitized = sanitized.replace(/[\uE000-\uF8FF]/g, '');

  // Replace special spaces with regular spaces
  sanitized = sanitized.replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ');

  // Clean up multiple spaces and trim
  return sanitized.replace(/\s+/g, ' ').trim();
}

module.exports = { sanitizeText };
