'use strict';

/**
 * Read the human-readable error text from the item a failed node emits
 * (On Error = Continue, or Continue using error output).
 *
 * Shapes observed on n8n 2.41.5, see field-notes/001-error-item-shapes-per-node-type.md:
 *   Postgres         { message: '<db message>', error: { description: 'Failed query: <SQL>', ... } }
 *   HTTP Request     { error: { message: '<status> - "<body>"', name, code, status, stack } }
 *   Google Calendar  { error: '<string>' }
 *
 * Only strings are returned, so an object is never printed as "[object Object]".
 */
function extractErrorText(item) {
  const x = item || {};
  const e = x.error;
  const pick = (...candidates) => candidates.find((v) => typeof v === 'string' && v) || 'unknown error';
  return pick(x.message, e, e && e.message, e && e.description);
}

module.exports = { extractErrorText };
