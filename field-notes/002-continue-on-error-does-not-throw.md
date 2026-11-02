# 002 - "Continue" does not throw

**Type:** Experiment + docs. **Proved on:** n8n 2.41.5 (self-hosted), 11 Oct 2026. Not re-run on 2 Nov 2026; the instance was still 2.41.5.

## Symptom

A Code node wraps the read of an earlier node in `try { ... } catch { ... }`, expecting to catch that node's failure. The catch never runs. The execution is green. The failure was treated as "no data", and the flow went on as if the answer were empty.

## Cause

A node with **On Error = Continue** does not throw. It emits an item that carries the error (the shapes are in [note 001](001-error-item-shapes-per-node-type.md)), and the execution status stays **success**. A `try/catch` downstream only fires if the node did not run at all.

The docs describe **Continue** as "proceeds to the next node despite the error, using the last valid data" ([Node settings](https://docs.n8n.io/build/understand-workflows/workflow-components/work-with-nodes#node-settings)). On 2.41.5, for the three nodes I tested, the next node received an item carrying the error instead. Do not assume either wording for your node: force a failure and look.

## How I proved it

I forced failures on a Postgres node, an HTTP Request node and a Google Calendar node, each set to Continue, on 11 Oct 2026. The execution status stayed "success" and the next node received the error item. A real consequence from my own system: a failed calendar read looked like an empty calendar, so a booking flow offered a time that was already taken.

## Fix

Pick one:

1. **Use "Continue (using error output)".** The docs say it passes error information on for handling, so errors leave through their own output and the main output only carries successes.
2. **If you use plain Continue, check for the error explicitly** before you use the data, and fail closed: anything that is not an explicit success counts as a failure ([`fixtures/extract-error-text.js`](../fixtures/extract-error-text.js) reads the text out).
3. **Never let a failed read look like an empty result.** If "nothing found" is a valid answer in your flow, make the two cases distinguishable.

## Related

- [001 Error items have a different shape per node type](001-error-item-shapes-per-node-type.md)
