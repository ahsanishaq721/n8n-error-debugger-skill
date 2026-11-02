# Field notes

Things about n8n that cost me time, each with the evidence behind it. `SKILL.md` is built from the official docs. These notes are different: they come from experiments on a real self-hosted n8n instance, so every note says **which n8n version, which date, and how I proved it**.

## How to read a note

| Label | Meaning |
|---|---|
| **Experiment** | I forced the behaviour on a real instance and read the result. The version and date are on the note. |
| **Docs** | The behaviour is stated in the official n8n docs. The link is on the note. |
| **Pattern** | A design I built and tested. The note says what was proved and what was not. |

A note is trusted for the version it names. n8n changes, so if you run another version, repeat the experiment (each note says how).

## Index

| # | Note | Type | Proved on |
|---|---|---|---|
| 001 | [Error items have a different shape per node type](001-error-item-shapes-per-node-type.md) | Experiment | n8n 2.41.5, 11 and 13 Oct 2026 |
| 002 | ["Continue" does not throw](002-continue-on-error-does-not-throw.md) | Experiment + docs | n8n 2.41.5, 11 Oct 2026 |
| 003 | [Dead-man heartbeat for scheduled jobs](003-dead-man-heartbeat-for-scheduled-jobs.md) | Pattern | n8n 2.41.5 and PostgreSQL 15, 11 Oct 2026; alert predicate re-run 2 Nov 2026 |

Code that belongs to a note lives in [`../fixtures/`](../fixtures/) and runs in CI (`node --test`).

## Add a note

1. Force the behaviour on a real instance. Write down the n8n version and the date.
2. Say what you saw, not what you expect. Keep every value synthetic: no real hostnames, ids, names or keys.
3. Include the smallest fix, and test it.
4. If the official docs say something different, quote the page and say so.

Found a mistake, or a different result on another version? Open an issue with the version and what you saw.
