# Config Workbench

Local Claude gateway configuration workbench for `jcode`.

## Purpose

This tool stays outside the core `jcode` runtime loop and focuses on:

- editing Claude provider defaults in `~/.jcode/config.toml`
- setting/removing `ANTHROPIC_API_KEY`
- validating the active Claude route with exact `jcode` commands

It is intended as the first UI-friendly layer for later richer clients.

## Run

```powershell
python E:\Projects\jcode\tools\config-workbench\server.py
```

Then open:

```text
http://127.0.0.1:8765
```

## Current scope

- default provider
- default model
- `anthropic_api_base`
- `ANTHROPIC_API_KEY`
- provider-current validation
- smoke-test validation

## Why this shape

This workbench does not try to embed the main TUI. It treats `jcode` as an engine
and uses file/env updates plus command execution as the control plane.

That makes it a good stepping stone toward:

- a browser-based config console
- a desktop wrapper
- a richer remote UI that talks to the existing gateway on port `7643`
