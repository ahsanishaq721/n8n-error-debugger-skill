# n8n Error Debugger Skill

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Built for Claude Code](https://img.shields.io/badge/Built%20for-Claude%20Code-blueviolet)](https://claude.ai)
[![n8n](https://img.shields.io/badge/n8n-workflow%20automation-orange)](https://n8n.io)
[![Sources](https://img.shields.io/badge/Sources-Official%20n8n%20Docs-red)](https://docs.n8n.io)

> A Claude agent skill that instantly diagnoses n8n workflow errors and gives you the exact fix — built entirely from official n8n documentation and verified community forum answers.

No more spending 2 hours searching the n8n forum for a cryptic error message. Paste the error. Get the fix.

---

## What it does

When you paste an n8n error message or describe a failing workflow, this skill:

1. Identifies the exact error class (`NodeApiError` vs `NodeOperationError`)
2. Matches it to the correct section (HTTP, Code, Credential, Webhook, Memory, AI Agent, etc.)
3. Gives you the precise fix — exact UI labels, environment variables, and code patterns
4. Walks you through a 9-step diagnostic checklist if the error isn't immediately clear

Every rule in this skill comes from official n8n documentation or community forum threads with official n8n support answers. No guessing. No hallucination.

---

## Errors covered

| Section | What it fixes |
|---|---|
| **HTTP Request errors** | 400, 403, 404, 429, 502 — with exact node settings to apply |
| **Code node errors** | Return format, `import`/`require`, missing modules, undefined output |
| **Credential errors** | OAuth2 failures, encryption key issues, Google disconnect, redirect URI mismatch |
| **Expression errors** | "Can't get data", item linking, `.first()` vs `.item`, broken references |
| **Trigger errors** | Webhook not firing, stale triggers, Google Sheets expiry, Error Trigger not running |
| **Webhook errors** | WEBHOOK_URL setup, test vs production URL, nginx reverse proxy config |
| **Memory errors** | OOM kills, stuck executions, queue mode failures, LOCK_DURATION tuning |
| **Execution flow** | Node never runs, single bad item crashes all, parallel path merge issues |
| **AI Agent errors** | Null prompt, Simple Memory node, Chat Model not connected, Gemini errors |
| **Error handling** | Error Workflow setup, Stop And Error node, retry strategies, On Error options |

---

## Install

### Option A — Global install (recommended)

Works in every Claude Code session on your machine, in any folder, forever.

```bash
npx skills add ahsanishaq721/n8n-error-debugger-skill -g
```

### Option B — Project install

Only active in the current project folder.

```bash
npx skills add ahsanishaq721/n8n-error-debugger-skill
```

### Requirements
- Node.js v18 or higher
- Claude Code: `npm install -g @anthropic-ai/claude-code`

---

## How to use

After installing, open Claude Code:

```bash
claude
```

Then just describe your problem naturally. No slash commands required.

### Example prompts

```
I'm getting "429 - The service is receiving too many requests" on my HTTP Request node. How do I fix it?
```

```
My Code node returns undefined. Here's my code: [paste code]
```

```
OAuth works when I test manually but fails with 401 in the active workflow. Why?
```

```
My webhook fires in test but never fires in production. What's wrong?
```

```
The AI Agent node throws "A Chat Model sub-node must be connected" but it is connected.
```

```
One bad item in my loop is crashing the entire workflow. How do I handle errors per item?
```

Claude will match your problem to the exact section, give you step-by-step fix instructions, and walk you through the diagnostic checklist if needed.

---

## For claude.ai users (web or mobile)

1. Go to **[claude.ai](https://claude.ai)**
2. Click **Projects** -> **New Project** -> name it `n8n Debugger`
3. Click **Add content** -> **Upload files**
4. Download and upload `SKILL.md`:
   ```
   https://raw.githubusercontent.com/ahsanishaq721/n8n-error-debugger-skill/main/SKILL.md
   ```
5. Every chat inside that project now has this skill active

---

## Sources

This skill was built by searching official n8n documentation using the `mcp__n8n-docs__search_n8n_knowledge_sources` MCP tool — a live connection to the n8n knowledge base. Every fix is cited.

| Documentation | URL |
|---|---|
| Error handling reference | https://docs.n8n.io/integrations/creating-nodes/build/reference/error-handling/ |
| HTTP Request common issues | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/common-issues/ |
| Code node common issues | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/common-issues/ |
| Data expressions | https://docs.n8n.io/data/expressions-for-transformation/ |
| Item linking | https://docs.n8n.io/data/data-mapping/data-item-linking/ |
| Webhook node | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/ |
| Memory errors | https://docs.n8n.io/hosting/scaling/memory-errors/ |
| Flow logic / error handling | https://docs.n8n.io/flow-logic/error-handling/ |
| AI Agent common issues | https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/common-issues/ |
| Rate limits | https://docs.n8n.io/integrations/builtin/rate-limits/ |
| Production AI agent best practices | https://blog.n8n.io/best-practices-for-deploying-ai-agents-in-production/ |

---

## Repo structure

```
n8n-error-debugger-skill/
├── SKILL.md          # Main skill file — 12 sections, 500+ lines, all sourced from official docs
├── LICENSE           # MIT License
└── README.md         # This file
```

---

## Contributing

Found an n8n error that isn't covered? Open an issue or submit a PR.

When contributing, every fix must include:
- The exact error message as it appears in n8n
- The root cause
- Step-by-step fix with exact UI labels or environment variable names
- A source URL (docs.n8n.io or community.n8n.io thread)

No undocumented guesses accepted.

---

## License

MIT © [Ahsan Ishaq](https://github.com/ahsanishaq721)

## Built by

**Ahsan Ishaq**
