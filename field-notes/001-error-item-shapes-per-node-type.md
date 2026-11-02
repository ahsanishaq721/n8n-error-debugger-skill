# 001 - Error items have a different shape per node type

**Type:** Experiment. **Proved on:** n8n 2.41.5 (self-hosted, external task runners on), 11 and 13 Oct 2026. Not re-run on 2 Nov 2026; the instance was still 2.41.5.

## Symptom

A node is set to **Continue** or **Continue (using error output)**. A later node reads the error text with `$json.error.message` and builds an alert. For a Postgres failure the alert says `[object Object]`, or shows the whole SQL statement instead of the cause.

## Cause

n8n does not give failing nodes one common error format. I forced a real failure on three nodes and read the item each one emitted:

| Node | Item emitted (fields I recorded) | Where the readable text is |
|---|---|---|
| Postgres | `{ message: "<the database's message>", error: { description: "Failed query: <the whole SQL text>", ... } }` | top-level `message`. `error` is an object with **no `.message`**, and `error.description` is the SQL |
| HTTP Request | `{ error: { message, name, code, status, stack } }` | `error.message`, which starts with the status code, for example `422 - "..."` |
| Google Calendar | `{ error: "<string>" }` | `error` itself is the string |

- The same Postgres shape came out in both On Error modes (Continue, and Continue using error output).
- Google Calendar texts I saw: a missing id gave `The resource you are requesting could not be found` (404). An event that was already deleted gave `Your request is invalid or could not be processed by the service` (410), which is the same text a 400 gives, so the text alone cannot tell them apart.
- A forum post shows the same HTTP Request shape from another user ([community.n8n.io/t/213857](https://community.n8n.io/t/213857)): a status-prefixed message, `name: AxiosError`, and a numeric `status`.

So `String(item.error.message || item.error)` prints `[object Object]` for Postgres. [`fixtures/extract-error-text.test.js`](../fixtures/extract-error-text.test.js) shows it.

## How I proved it

On a self-hosted n8n 2.41.5 I forced: a Postgres query against a table that does not exist; an HTTP Request that received a 422 response; and Google Calendar calls with an id that does not exist and for an event that was already deleted. I read the item each node emitted in the next node. I re-checked the Postgres item on 13 Oct 2026.

The fixtures in this repo are the **minimal shapes** with synthetic values. n8n adds other fields that I did not record, and they are left out.

## Fix

One extractor for all three. It prefers the top-level `message` and never prints an object ([`fixtures/extract-error-text.js`](../fixtures/extract-error-text.js)):

```js
function extractErrorText(item) {
  const x = item || {};
  const e = x.error;
  const pick = (...c) => c.find((v) => typeof v === 'string' && v) || 'unknown error';
  return pick(x.message, e, e && e.message, e && e.description);
}
```

Test your own node: force one failure, look at the item, and add a fixture before you trust it.

## Related

- [002 "Continue" does not throw](002-continue-on-error-does-not-throw.md)
- Official docs for the On Error setting: [Node settings](https://docs.n8n.io/build/understand-workflows/workflow-components/work-with-nodes#node-settings)
