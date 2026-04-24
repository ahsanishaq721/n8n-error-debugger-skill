---
name: n8n-error-debugger
description: Diagnoses n8n workflow errors and gives exact fixes based on official n8n documentation. Use when a user pastes an n8n error message, describes a failing node, or asks why their workflow stopped. Covers HTTP errors, Code node errors, credential failures, expression problems, webhook issues, memory errors, AI Agent failures, and error handling setup.
---

# n8n Error Debugger Skill

You are an expert n8n workflow debugger. When the user pastes an error message, describes a failure, or shares a workflow problem, diagnose the exact cause and give a precise fix. Every rule below comes from official n8n documentation or the n8n community forum with official support answers.

---

## HOW TO USE THIS SKILL

1. Ask the user for the **full error message** (copy from the node output panel or execution log).
2. Ask which **node type** failed (HTTP Request, Code, Webhook, Trigger, AI Agent, etc.).
3. Ask how n8n is hosted if relevant (Cloud, Docker self-hosted, npm).
4. Match the error to a section below and provide the exact fix.

---

## 1. ERROR TYPE TAXONOMY

n8n uses two internal error classes. Knowing which one fired narrows the cause immediately.

| Class | When it fires | Examples |
|---|---|---|
| `NodeApiError` | External API calls / HTTP requests fail | 400, 401, 403, 404, 429, 502, 503 |
| `NodeOperationError` | Internal validation / config / logic failures | Invalid JSON, missing param, data transform errors |

**Source:** https://docs.n8n.io/integrations/creating-nodes/build/reference/error-handling/

---

## 2. HTTP REQUEST NODE ERRORS

**Source:** https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/common-issues/

### "Bad request - please check your parameters" (HTTP 400)
- **Cause:** Invalid name or value in a Query Parameter, or an array passed in a Query Parameter that isn't formatted correctly.
- **Fix:** Review the API documentation for the service. Use the **Array Format in Query Parameters** option in the HTTP Request node if passing arrays.

### "The resource you are requesting could not be found" (HTTP 404)
- **Cause:** The endpoint URL is invalid — typo in the URL or a deprecated API endpoint.
- **Fix:** Verify the endpoint URL against the service's API documentation.

### "JSON parameter need to be an valid JSON"
- **Cause:** A parameter was passed as JSON but is not valid JSON.
- **Fix:**
  1. Test the JSON in a validator (e.g., jsonlint.com) — look for missing quotes, extra commas, incorrect brackets.
  2. If using an expression, wrap the entire JSON in double curly brackets: `{{ { "key": "value" } }}`

### "Forbidden - perhaps check your credentials" (HTTP 403)
- **Cause:** Authentication failed.
- **Fix:**
  1. Update API key/OAuth permissions or scopes for the required operation.
  2. Reformat the generic credential.
  3. Generate a new API key or token with the correct scopes.

### "429 - The service is receiving too many requests from you" (HTTP 429)
- **Cause:** API rate limit exceeded.
- **Fix (HTTP Request node built-in options):**
  - **Batching:** Add Option -> Batching -> set Items per Batch and Batch Interval (ms). Example: 1 request/second = Batch Interval 1000ms.
  - **Retry on Fail:** Settings -> enable Retry on Fail -> set Max Tries and Wait Between Tries (ms).
- **Fix (general nodes):** Add a **Loop Over Items** node before the API-calling node and a **Wait** node after it, connected back to Loop Over Items.
- **Source:** https://docs.n8n.io/integrations/builtin/rate-limits/

### HTTP 502 logged even when retry succeeds
- **Cause:** n8n logs the initial failure in execution history and does not overwrite it even if a later retry succeeds. This is expected behavior.
- **Fix:** Use an Error Workflow or a Try/Catch pattern in a Code node to handle gracefully. Accept that logs will always show the first error.

---

## 3. CODE NODE ERRORS

**Source:** https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/common-issues/

### "Code doesn't return items properly"
- **Cause:** Code does not return data in the required format.
- **Fix:** All data in n8n is an array of objects where each object wraps another object with a `json` key:
  ```js
  return [{ json: { yourField: "value" } }];
  ```

### "A 'json' property isn't an object"
- **Cause:** The `json` key points to an array instead of an object.
- **Fix:** Ensure `json` references an object `{}`, never an array `[]`.

### "Code doesn't return an object" / returns `undefined`
- **Cause:** Code returns `undefined` or an unexpected result.
- **Fix:** Verify the data you reference exists in every execution. Return the expected `[{ json: {...} }]` structure.

### "'import' and 'export' may only appear at the top level"
- **Cause:** ES module `import`/`export` syntax is not supported in n8n's JS sandbox.
- **Fix:** Use `require()` instead:
  ```js
  // Wrong:  import express from "express";
  // Correct:
  const express = require("express");
  ```

### "Cannot find module '<module>'"
- **Cause:** The module isn't installed in the n8n environment.
- **Fix (self-hosted only -- not available on n8n Cloud):**
  1. Install the module in the same environment as n8n (npm) or extend the Docker image (Docker).
  2. Set environment variables: `NODE_FUNCTION_ALLOW_BUILTIN` and `NODE_FUNCTION_ALLOW_EXTERNAL`.

---

## 4. CREDENTIAL & CONNECTION ERRORS

### HTTP 401 / "Authentication failed"
- **Cause:** Expired token, incorrect API key, or missing permissions.
- **Fix:**
  1. Go to Credentials section -> test the connection.
  2. Re-authenticate: click "Connect" and follow the OAuth flow again.
  3. Verify the API key in the service's dashboard -- check for IP restrictions or scope limitations.
  4. Test the credential outside n8n (e.g., Postman) to confirm it works independently.
- **Source:** https://community.n8n.io/t/178701

### "Node has no access to credential"
- **Cause:** The workflow and the credential are in different **Projects**. The node cannot access a credential it doesn't share a project with.
- **Fix:** Open the credential -> go to the **Sharing** tab -> share it with the project that owns the workflow.
- **Source:** https://community.n8n.io/t/82118

### "Credentials not found"
- **Cause:** The credential is not linked to the node, or the user account lacks access to the shared credential.
- **Fix:** Open the failing node -> manually select the credential from the dropdown (even if it appears already set) -> save the workflow.
- **Source:** https://community.n8n.io/t/229864

### OAuth2 works in manual test but fails with 401 in active/production workflow
- **Cause (most common):** One of three issues:
  1. `N8N_ENCRYPTION_KEY` changed between runs -- previously stored credentials can no longer be decrypted.
  2. Clock drift between server and OAuth provider -- tokens expire immediately.
  3. Missing persistent storage for the `.n8n` directory in containerized deployments.
- **Fix:**
  1. Ensure `N8N_ENCRYPTION_KEY` is static and consistent across restarts.
  2. Synchronize server time via NTP.
  3. Mount the `.n8n` directory to a persistent volume.
- **Source:** https://community.n8n.io/t/271472

### Google/Microsoft OAuth keeps disconnecting (self-hosted)
- **Cause:** Google OAuth app is in **Testing** mode -- tokens expire quickly.
- **Fix:**
  1. Go to Google Cloud Console -> change OAuth app status from **Testing** to **Production**.
  2. Reconnect the account once in n8n.
- **Source:** https://community.n8n.io/t/289946

### "redirect_uri_mismatch" when connecting Google credentials
- **Cause:** n8n instance URL mismatch with the OAuth redirect URI registered in Google Console.
- **Fix:** Update the n8n instance to the newest stable version and retry.
- **Source:** https://community.n8n.io/t/252523

### "Couldn't connect with these settings" (credential test fails but node works)
- **Cause:** The credential test endpoint for some nodes is incorrect -- this is a known n8n bug in versions before 1.112.0.
- **Fix:** Ignore the test failure and use the node normally. The credential works during execution even if the test fails.
- **Source:** https://community.n8n.io/t/191758

### Credential warnings appear in executions but workflow still runs
- **Cause:** Known n8n issue (GitHub #26054) where false credential warnings appear for non-admin users after certain updates.
- **Fix:** Check if the workflow is actually failing. If it runs correctly, the warning can be ignored pending an n8n version update.

---

## 5. EXPRESSION & DATA MAPPING ERRORS

**Source:** https://docs.n8n.io/data/expressions-for-transformation/

### "Can't get data for expression"
- **Cause (most common):** Item linking is broken. n8n cannot trace the data back to the source node.
- **Fix:** Switch from **dot notation** to **item linking**:
  - Wrong: `{{ $json.field }}`
  - Correct: drag the field directly from the left panel using the item linking UI.
- **Source:** https://docs.n8n.io/data/data-mapping/data-item-linking/

### `.item` vs `.first()` -- choosing the correct accessor
| Accessor | When to use |
|---|---|
| `$json` or `.item` | When processing one item at a time (most cases) |
| `.first()` | When you specifically need the first item from a node with multiple outputs |
| `.all()` | When you need all items from a node as an array |

Using `.first()` when there's only one item works, but is not semantically correct and can cause confusion.

### "Referenced node doesn't exist" / expression breaks after renaming a node
- **Cause:** Expressions referencing `$('Old Node Name')` break when the node is renamed.
- **Fix:** After renaming any node, search the entire workflow for references to the old name and update them.

### Expression works in one mode but not another (manual vs production)
- **Cause:** Data structure differs between test data (pinned) and real production data.
- **Fix:** Never rely solely on pinned test data. Run the workflow with real data at least once before deploying.

---

## 6. TRIGGER & ACTIVATION ERRORS

### Webhook / trigger fires in test but not in production
- **Cause:** The workflow is not **Active**. Production webhooks only fire when the workflow toggle is turned ON.
- **Fix:** Click the toggle at the top of the workflow editor to activate the workflow. Test mode uses a temporary URL; production uses the permanent one.
- **Source:** https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/

### Google Sheets trigger stops firing after some time
- **Cause:** Google's push notification subscriptions expire after 7 days. n8n should auto-renew, but fails under certain conditions.
- **Fix:** Deactivate and reactivate the workflow to force a subscription renewal.
- **Source:** https://community.n8n.io/t/198432

### Telegram trigger not receiving messages
- **Cause:** Only one webhook can be registered per Telegram bot. If the bot is connected to another service, n8n's registration will be overwritten.
- **Fix:** Ensure no other service is using the same bot token. Delete and re-register the webhook in n8n.

### Error Trigger workflow not firing
- **Cause:** Error Trigger workflows only fire on **automatic** executions (active workflows). Manual test runs do not trigger error workflows.
- **Fix:** Use a separate workflow to simulate a failure in an active workflow. The Error Trigger will fire when that active workflow fails automatically.
- **Source:** https://docs.n8n.io/flow-logic/error-handling/

### Stale trigger data / workflow uses old data
- **Cause:** Test data is pinned from a previous execution and not refreshed.
- **Fix:** Click the pin icon on the trigger node -> delete pinned data -> re-trigger manually.

---

## 7. WEBHOOK ERRORS

**Source:** https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/

### "The URL is not accessible" / webhook not receiving data
- **Cause (self-hosted):** `WEBHOOK_URL` environment variable is not set or is set incorrectly.
- **Fix:**
  - Set `WEBHOOK_URL` to the public HTTPS domain of your n8n instance.
  - Format: `https://yourdomain.com` (no trailing slash, no `/webhook` suffix).
  - Verify the domain is publicly accessible and SSL is valid.

### Test URL works but Production URL returns 404
- **Cause:** The workflow is not active. Production webhook URLs are only active when the workflow toggle is ON.
- **Fix:** Activate the workflow. Then use the **Production URL** shown in the Webhook node (not the Test URL).

### Webhook receives data but node shows no output
- **Cause:** The webhook received a request during a test but the connection between the external service and n8n timed out before the test captured it.
- **Fix:** Click "Listen for Test Event" in n8n first, then immediately trigger the webhook from the external service. Both must happen within the timeout window.

### Reverse proxy / nginx not forwarding webhook correctly
- **Cause:** The reverse proxy is not passing the correct headers or is stripping the request body.
- **Fix (nginx):**
  ```nginx
  location / {
    proxy_pass http://localhost:5678;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```

---

## 8. MEMORY & INTERRUPTION ERRORS

**Source:** https://docs.n8n.io/hosting/scaling/memory-errors/

### "Can't show data" / execution history shows no output
- **Cause:** The n8n process was killed mid-execution due to out-of-memory (OOM). The execution record was written but output data was not saved.
- **Fix:**
  1. Check server logs for OOM kill signals: `dmesg | grep -i "killed process"` (Linux).
  2. Increase available memory for the n8n container or process.
  3. Enable **Save Execution Progress** in workflow settings to capture output per node before completion.

### "Error in 6s" / execution stops after a fixed time
- **Cause:** The execution hit the execution timeout configured in n8n settings.
- **Fix:** Increase `EXECUTIONS_TIMEOUT` and `EXECUTIONS_TIMEOUT_MAX` environment variables. Break large workflows into sub-workflows called via the Execute Workflow node.

### Execution log shows "Running" forever / stuck execution
- **Cause:** The process crashed or was restarted while the execution was in progress. n8n did not get a chance to mark it as failed.
- **Fix:**
  1. In n8n UI: Settings -> Executions -> find the stuck execution -> manually mark as failed.
  2. For queue mode: check Redis for stalled jobs.
- **Source:** https://community.n8n.io/t/256461

### Random failures under load / queue mode intermittent errors
- **Cause:** Worker memory saturation. Low memory limits cause aggressive garbage collection and instability. Redis stalled jobs also cause delays.
- **Fix:**
  1. Increase worker memory limits.
  2. Scale horizontally by adding more workers.
  3. Monitor Redis for stalled jobs.
  4. Avoid long-running Code node logic or large JSON transformations that block the event loop.
- **Source:** https://community.n8n.io/t/270764

### "This execution failed to be processed too many times and will no longer retry"
- **Cause:** A long-running workflow in queue mode exceeded the worker lock duration, causing the job to appear stalled and be retried too many times.
- **Fix:** Increase `QUEUE_WORKER_LOCK_DURATION` (e.g., `QUEUE_WORKER_LOCK_DURATION=120000` for 120 seconds). Break the workflow into smaller sub-workflows.
- **Source:** https://community.n8n.io/t/88285

---

## 9. NODE EXECUTION FLOW PROBLEMS

### A node in the workflow never executes (shows no checkmark)
- **Cause:** The workflow has two parallel paths. One path fails, and since both paths must connect before a downstream node, the second path never runs.
- **Fix:** Add a **Merge** node before the downstream node to combine both paths. Configure it to wait for both inputs.
- **Source:** https://community.n8n.io/t/108199

### Single bad item crashes entire execution
- **Cause:** n8n fails the entire execution when one item in a batch throws an error.
- **Fix:** Catch errors per item inside a Code node and return them as data (not thrown errors):
  ```js
  return items.map(item => {
    try {
      // your logic
      return { json: { ...item.json, status: 'ok' } };
    } catch (e) {
      return { json: { id: item.json.id, error: e.message, status: 'failed' } };
    }
  });
  ```
  Then route `status === 'failed'` items to a separate handler. Use UPSERT writes to avoid duplicates on retry.
- **Source:** https://community.n8n.io/t/269849

### Workflow stops when one node fails (want it to continue)
- **Cause:** Default n8n behavior is to stop on node error.
- **Fix:** Open the failing node -> Settings tab -> **On Error** -> choose:
  - **Continue**: proceeds using last valid data
  - **Continue (using error output)**: passes error info to next node
  - Or enable **Retry On Fail** to automatically retry before failing.
- **Source:** https://docs.n8n.io/workflows/components/nodes/#node-settings

---

## 10. AI AGENT NODE ERRORS

**Source:** https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/common-issues/

### "Internal error: 400 Invalid value for 'content': expected a string, got null"
- **Cause:** The Prompt input contains a null value. Either an expression in the Text field isn't generating a value, or incoming `chatInput` data has null values.
- **Fix:**
  1. If Prompt is set to "Define below": ensure expressions reference valid fields that resolve to non-null values.
  2. If Prompt is set to "Connected Chat Trigger Node": remove null values from `chatInput` in the input node.

### "Error in sub-node Simple Memory"
- **Cause:** The workflow uses an outdated version of the Simple Memory node (previously called "Window Buffer Memory").
- **Fix:** Remove the Simple Memory node and re-add it fresh to get the latest version.

### "A Chat Model sub-node must be connected"
- **Cause:** The AI Agent node has no Chat Model attached.
- **Fix:** Click **+ Chat Model** at the bottom of the node panel (when node is open) or the **Chat Model +** connector (when node is closed) and select a model.

### "No prompt specified"
- **Cause:** The agent expects a prompt from the Chat Trigger automatically but it isn't being passed.
- **Fix:** In the AI Agent node, change **Prompt** from "Connected Chat Trigger Node" to **Define below** and manually build the prompt using expressions.

### "contents.parts must not be empty" (Gemini / Google AI)
- **Cause:** The language model isn't returning messages -- possible causes: outdated LangChain node, invalid API key, or poorly written prompts.
- **Fix:** Update the node, verify API credentials, and test with different prompts.
- **Source:** https://community.n8n.io/t/191643

---

## 11. ERROR HANDLING SETUP

**Source:** https://docs.n8n.io/flow-logic/error-handling/

### Setting up an Error Workflow (correct procedure)
1. Create a new workflow.
2. Add the **Error Trigger** node as the first node.
3. Add notification nodes (Slack, email, etc.) connected to it.
4. Save the error handler workflow.
5. In the source workflow: Options -> Settings -> **Error Workflow** -> select the handler.

### Error data available to the Error Trigger
```json
{
  "execution": {
    "id": "231",
    "url": "https://n8n.example.com/execution/231",
    "error": {
      "message": "Example Error Message",
      "stack": "Stacktrace"
    },
    "lastNodeExecuted": "Node With Error",
    "mode": "manual"
  },
  "workflow": {
    "id": "1",
    "name": "Example Workflow"
  }
}
```

**Note:** `execution.id` and `execution.url` are absent if the error is in the trigger node itself. In that case, data is in `trigger{}` instead of `execution{}`.

### Forcing a controlled failure: Stop And Error node
Add a **Stop And Error** node anywhere in the workflow to trigger the error workflow with a custom message (useful for catching business logic failures, not just technical errors).

### Node-level On Error options
Each node has a Settings tab -> **On Error**:
- **Stop Workflow** (default): halts execution
- **Continue**: uses last valid data and continues
- **Continue (using error output)**: passes error info downstream for custom handling

### Retry strategies for transient errors (production AI agents)
- Only retry: network timeouts, rate limits, temporary service unavailability.
- Never retry: authentication failures, invalid requests, permanent errors.
- Exponential backoff: 1s -> 2s -> 4s (max 3-5 attempts).
- Add jitter (random delay) when multiple workflows retry simultaneously to avoid thundering herd.
- **Source:** https://blog.n8n.io/best-practices-for-deploying-ai-agents-in-production/

---

## 12. DIAGNOSTIC CHECKLIST

When a user reports an error, work through these in order:

1. **Read the execution log.** Open Executions -> click the failed execution -> find the red node -> read the error message. The message usually identifies the problem type (Invalid JSON, Missing credentials, etc.).

2. **Check the node type.** HTTP Request, Code, Webhook, Trigger, AI Agent, and credential nodes each have different failure modes.

3. **Check if the error is credential-related.** Re-authenticate in the Credentials section. Test the credential outside n8n (e.g., Postman).

4. **Check if the error is data-related.** Copy the input JSON and validate it at jsonlint.com. Check if upstream nodes changed the data structure.

5. **Check if the workflow is active for webhook/trigger errors.** Production webhooks require an active (published) workflow. Error Triggers only fire on automatic executions.

6. **Check WEBHOOK_URL for self-hosted webhook problems.** Must be the public HTTPS domain without a `/webhook` suffix.

7. **Check memory for interrupted executions.** "Can't show data" or "Error in Xs" after a long run = OOM kill. Check server logs.

8. **Enable Save Execution Progress** in workflow settings to capture the exact failing node in memory crash scenarios.

9. **Test in isolation.** Run individual nodes using the play button on each node to narrow down which node causes the problem without running the whole workflow.
