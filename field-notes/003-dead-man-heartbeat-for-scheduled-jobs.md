# 003 - Dead-man heartbeat for scheduled jobs

**Type:** Pattern. **Proved on:** n8n 2.41.5 and PostgreSQL 15, 11 Oct 2026 (design, rolled-back SQL scenarios, timed runs on real schedules). The alert predicate was re-run on PostgreSQL 15.19 on 2 Nov 2026 with synthetic rows (table below).

## Symptom

A scheduled job stops and nothing tells you. In my case a 15-minute sync job stayed silent for about 12.5 hours on 10-11 Sep 2026 and nobody was told.

## Cause

An error workflow reacts to failed executions: the docs say it "runs if an execution fails" ([Handle errors gracefully](https://docs.n8n.io/build/flow-logic/handle-errors-gracefully)). A schedule that stops firing creates no execution, so nothing fails and nothing alerts. A dead job cannot report its own death, so the check has to come from somewhere else.

## The pattern

1. **The job writes a heartbeat in the same statement as its work.** The beat is a data-modifying CTE, which PostgreSQL runs "exactly once, and always to completion, independently of whether the primary query reads all (or indeed any) of their output" ([PostgreSQL docs](https://www.postgresql.org/docs/15/queries-with.html)). So the beat is written on quiet runs that return 0 rows, and only if the work committed.
2. **A different workflow watches the heartbeat.** If the watcher is the same job, a dead job cannot alert.
3. **Alert once per stall.** A small state table remembers when an alert was delivered. A stall alerts once, reminds every 2 hours while it lasts, and alerts again if the job recovers and later stalls again.
4. **Record "alerted" only after the alert was delivered**, and never for a failed check. A failed check must say "could not check", not "stopped": otherwise it would silence a real stall for 2 hours.

```sql
CREATE TABLE job_heartbeat   (job text PRIMARY KEY, last_run_at timestamptz NOT NULL, detail text);
CREATE TABLE job_alert_state (job text PRIMARY KEY, alerted_at timestamptz NOT NULL, detail text);

-- In the job: the beat rides in the same statement as the work.
WITH work AS (
  UPDATE tasks SET status = 'done'
  WHERE id IN (SELECT id FROM tasks WHERE status = 'due' ORDER BY id LIMIT 100)
  RETURNING id
), beat AS (
  INSERT INTO job_heartbeat (job, last_run_at, detail) VALUES ('release_tasks', now(), 'tick')
  ON CONFLICT (job) DO UPDATE SET last_run_at = now(), detail = EXCLUDED.detail
  RETURNING 1
)
SELECT id FROM work;

-- In the watcher: returns a row only for a job that is stale AND due an alert.
SELECT j.job,
       COALESCE(h.last_run_at, 'epoch'::timestamptz) AS last_run_at
FROM (VALUES ('release_tasks', interval '45 minutes')) AS j(job, max_age)
LEFT JOIN job_heartbeat h ON h.job = j.job
LEFT JOIN job_alert_state a ON a.job = j.job
WHERE COALESCE(h.last_run_at, 'epoch'::timestamptz) < now() - j.max_age
  AND (a.alerted_at IS NULL
       OR a.alerted_at <= COALESCE(h.last_run_at, 'epoch'::timestamptz)
       OR a.alerted_at < now() - interval '2 hours');
```

Healthy, or already alerted, means **zero rows**. In n8n a node that returns no items skips every node after it, and the watcher relies on that: do **not** turn on Always Output Data for the check node, or it would alert on every run. I observed the skip on 12 Aug 2026 and have relied on it since 11 Oct 2026 on 2.41.5; the [Node settings](https://docs.n8n.io/build/understand-workflows/workflow-components/work-with-nodes#node-settings) page documents the opposite setting, Always Output Data.

## Proof: the alert predicate (PostgreSQL 15.19, 2 Nov 2026)

Run with synthetic rows and `now()` fixed. In every row the result matched what I expected.

| Case | Alerts? |
|---|---|
| 10 min since the last beat | no |
| 44 min since the last beat | no |
| exactly 45 min | no (the check is strict) |
| 46 min, never alerted | **yes** |
| no heartbeat row at all | **yes** |
| stale, alerted 30 min ago | no (already reported) |
| stale, alerted 2 h 01 min ago | **yes** (reminder) |
| stale, alerted exactly 2 h ago | no (strict) |
| stale again after a recovery (the old alert is older than the last beat) | **yes** (new stall) |

On 11 Oct 2026 I ran about 30 such scenarios inside rolled-back transactions, then timed the whole chain on real schedules: a stale heartbeat produced an alert one second after the watcher's next tick, the next two ticks stayed silent, and it went quiet after recovery. Those raw runs are not in this repo; the table above is the part you can re-run yourself.

## Limits

- It does not catch a whole-server outage: the watcher dies with the server. That needs a monitor outside the box.
- Thresholds are per job. I used 3 times the interval for a 15-minute job (45 minutes) and the interval plus 2 hours for a daily job (26 hours).
- n8n 2.41.5 only. Forum users report schedule triggers that silently stop in other setups; I did not verify their causes.
