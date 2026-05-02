# Config Workbench

Local Claude gateway configuration workbench for `jcode`.

## Purpose

This tool stays outside the core `jcode` runtime loop and focuses on:

- showing an operations-first overview of recent sessions, live process matches, and log tail state
- correlating sessions with saved workspaces so the shell can jump from runtime state back into workspace actions
- editing Claude provider defaults in `~/.jcode/config.toml`
- setting/removing `ANTHROPIC_API_KEY`
- validating the active Claude route with exact `jcode` commands
- saving workspace entries
- selecting the current workspace
- opening workspace directories safely in Explorer
- launching `jcode` or `jcode-api` in a chosen workspace

It is intentionally a control-plane shell, not a session UI.

It is intended as the first UI-friendly layer for later richer clients.

## Run

```powershell
python E:\Projects\jcode\tools\config-workbench\server.py
```

or:

```powershell
E:\Projects\jcode\tools\config-workbench\start.cmd
```

Then open:

```text
http://127.0.0.1:8765
```

## Current scope

- operations dashboard for recent sessions
- active PID inspection for tracked jcode sessions
- session-side quick actions for open/select/launch flows
- session resume launch via `jcode --resume <session_id>`
- operations search and auto-refresh
- workspace health overview across registered and orphan session paths
- latest log tail and validation snapshot
- default provider
- default model
- `anthropic_api_base`
- `ANTHROPIC_API_KEY`
- provider-current validation
- smoke-test validation
- workspace persistence
- workspace launch actions
- gateway config persistence
- gateway health checks
- pairing-code generation through `jcode pair`
- paired-device and pending-code registry display

## Next phase

The next sensible expansion is:

- session list / attach controls backed by the existing `gateway` surface
- richer process controls when jcode exposes a stable non-invasive control contract
- workspace metadata panels with session correlation

That should still stay outside core agent/provider logic and talk through config,
process launch, and gateway communication surfaces.

## Why this shape

This workbench does not try to embed the main TUI. It treats `jcode` as an engine
and uses file/env updates plus command execution as the control plane.

That makes it a good stepping stone toward:

- a browser-based config console
- a desktop wrapper
- a richer remote UI that talks to the existing gateway on port `7643`

## Practical workflow

The intended daily flow is now:

1. land on `Operations`
2. filter to the session, model, provider, or workspace path you care about
3. inspect the selected session/process in the right-hand detail panel
4. jump directly to `恢复会话`, `打开目录`, `设为当前`, `启动 jcode`, or `启动 jcode-api`
5. only move into `Provider` or `Gateway` when you need to change configuration

That keeps the workbench in the control-plane lane instead of trying to duplicate
the main terminal UI.
