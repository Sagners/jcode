from __future__ import annotations

import datetime as dt
import json
import os
import re
import subprocess
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


HOST = "127.0.0.1"
PORT = 8765
ROOT = Path(__file__).resolve().parent
WEB_ROOT = ROOT / "web"
CONFIG_PATH = Path.home() / ".jcode" / "config.toml"
WORKBENCH_STATE_PATH = Path.home() / ".jcode" / "workbench.json"
DEVICES_PATH = Path.home() / ".jcode" / "devices.json"
SESSIONS_PATH = Path.home() / ".jcode" / "sessions"
ACTIVE_PIDS_PATH = Path.home() / ".jcode" / "active_pids"
TELEMETRY_ACTIVE_SESSIONS_PATH = Path.home() / ".jcode" / "telemetry_active_sessions"
LOGS_PATH = Path.home() / ".jcode" / "logs"
DEFAULT_WORKDIR = Path.home() / "Documents" / "Playground"
JCODE_BIN = Path.home() / ".cargo" / "bin" / "jcode.exe"
JCODE_API_BIN = Path.home() / ".cargo" / "bin" / "jcode-api.cmd"
ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")
WHITESPACE_RE = re.compile(r"\s+")


def read_file_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def normalize_workspace(path_text: str) -> str:
    raw = str(path_text or "").strip().strip('"').strip("'")
    if not raw:
        return ""
    try:
        return str(Path(raw).expanduser().resolve())
    except Exception:
        return str(Path(raw).expanduser())


def read_workbench_state() -> dict[str, Any]:
    text = read_file_text(WORKBENCH_STATE_PATH)
    if not text.strip():
        return {
            "workspaces": [],
            "selected_workspace": str(DEFAULT_WORKDIR),
            "last_validation": None,
        }
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {
            "workspaces": [],
            "selected_workspace": str(DEFAULT_WORKDIR),
            "last_validation": None,
        }
    workspaces = []
    for item in data.get("workspaces") or []:
        path = normalize_workspace(item.get("path") if isinstance(item, dict) else item)
        if not path:
            continue
        workspaces.append(
            {
                "name": str(item.get("name") or Path(path).name if isinstance(item, dict) else Path(path).name),
                "path": path,
            }
        )
    unique = []
    seen = set()
    for item in workspaces:
        key = item["path"].lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    selected = normalize_workspace(data.get("selected_workspace") or str(DEFAULT_WORKDIR))
    return {
        "workspaces": unique,
        "selected_workspace": selected,
        "last_validation": data.get("last_validation"),
    }


def write_workbench_state(state: dict[str, Any]) -> None:
    ensure_parent(WORKBENCH_STATE_PATH)
    WORKBENCH_STATE_PATH.write_text(
        json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def upsert_workspace(name: str, path_text: str) -> dict[str, Any]:
    path = normalize_workspace(path_text)
    if not path:
        raise ValueError("Workspace path was empty.")
    item = {"name": name.strip() or Path(path).name, "path": path}
    state = read_workbench_state()
    workspaces = [
        ws for ws in state["workspaces"] if ws["path"].lower() != path.lower()
    ]
    workspaces.append(item)
    workspaces.sort(key=lambda ws: ws["name"].lower())
    state["workspaces"] = workspaces
    state["selected_workspace"] = path
    write_workbench_state(state)
    return state


def remove_workspace(path_text: str) -> dict[str, Any]:
    path = normalize_workspace(path_text)
    state = read_workbench_state()
    state["workspaces"] = [
        ws for ws in state["workspaces"] if ws["path"].lower() != path.lower()
    ]
    if normalize_workspace(state.get("selected_workspace", "")) == path:
        state["selected_workspace"] = (
            state["workspaces"][0]["path"] if state["workspaces"] else str(DEFAULT_WORKDIR)
        )
    write_workbench_state(state)
    return state


def select_workspace(path_text: str) -> dict[str, Any]:
    path = normalize_workspace(path_text)
    state = read_workbench_state()
    if path:
        state["selected_workspace"] = path
        write_workbench_state(state)
    return state


def read_provider_state() -> dict[str, Any]:
    text = read_file_text(CONFIG_PATH)
    provider = {
        "default_provider": "",
        "default_model": "",
        "anthropic_api_base": "",
    }
    gateway = {
        "enabled": False,
        "port": 7643,
        "bind_addr": "0.0.0.0",
    }
    active = False
    active_gateway = False
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if line.startswith("[") and line.endswith("]"):
            active = line == "[provider]"
            active_gateway = line == "[gateway]"
            continue
        if "=" not in line or line.startswith("#"):
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        raw_value = value.strip()
        value = raw_value.strip('"').strip("'")
        if active and key in provider:
            provider[key] = value
        if active_gateway:
            if key == "enabled":
                gateway["enabled"] = value.lower() in {"true", "1", "yes", "on"}
            elif key == "port":
                try:
                    gateway["port"] = int(value)
                except ValueError:
                    pass
            elif key == "bind_addr":
                gateway["bind_addr"] = value
    return {"provider": provider, "gateway": gateway}


def upsert_provider_values(updates: dict[str, str]) -> None:
    ensure_parent(CONFIG_PATH)
    lines = read_file_text(CONFIG_PATH).splitlines()
    if not lines:
        lines = []

    section_start = None
    section_end = None
    for idx, raw in enumerate(lines):
        line = raw.strip()
        if line == "[provider]":
            section_start = idx
            section_end = len(lines)
            for j in range(idx + 1, len(lines)):
                nxt = lines[j].strip()
                if nxt.startswith("[") and nxt.endswith("]"):
                    section_end = j
                    break
            break

    if section_start is None:
        if lines and lines[-1].strip():
            lines.append("")
        lines.append("[provider]")
        section_start = len(lines) - 1
        section_end = len(lines)

    for key, value in updates.items():
        rendered = f'{key} = "{value}"'
        found = False
        for idx in range(section_start + 1, section_end):
            stripped = lines[idx].strip()
            if stripped.startswith(f"{key} ="):
                lines[idx] = rendered
                found = True
                break
        if not found:
            lines.insert(section_end, rendered)
            section_end += 1

    CONFIG_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def upsert_gateway_values(updates: dict[str, Any]) -> None:
    ensure_parent(CONFIG_PATH)
    lines = read_file_text(CONFIG_PATH).splitlines()
    if not lines:
        lines = []

    section_start = None
    section_end = None
    for idx, raw in enumerate(lines):
        line = raw.strip()
        if line == "[gateway]":
            section_start = idx
            section_end = len(lines)
            for j in range(idx + 1, len(lines)):
                nxt = lines[j].strip()
                if nxt.startswith("[") and nxt.endswith("]"):
                    section_end = j
                    break
            break

    if section_start is None:
        if lines and lines[-1].strip():
            lines.append("")
        lines.append("[gateway]")
        section_start = len(lines) - 1
        section_end = len(lines)

    normalized = {
        "enabled": "true" if bool(updates.get("enabled")) else "false",
        "port": str(int(updates.get("port") or 7643)),
        "bind_addr": str(updates.get("bind_addr") or "0.0.0.0"),
    }

    for key, value in normalized.items():
        rendered = f'{key} = "{value}"' if key == "bind_addr" else f"{key} = {value}"
        found = False
        for idx in range(section_start + 1, section_end):
            stripped = lines[idx].strip()
            if stripped.startswith(f"{key} ="):
                lines[idx] = rendered
                found = True
                break
        if not found:
            lines.insert(section_end, rendered)
            section_end += 1

    CONFIG_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def windows_read_user_env(name: str) -> str:
    if os.name != "nt":
        return os.environ.get(name, "")
    try:
        import winreg  # type: ignore

        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
            value, _ = winreg.QueryValueEx(key, name)
            return str(value)
    except Exception:
        return os.environ.get(name, "")


def windows_set_user_env(name: str, value: str) -> None:
    if os.name != "nt":
        os.environ[name] = value
        return
    import winreg  # type: ignore

    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
        winreg.SetValueEx(key, name, 0, winreg.REG_EXPAND_SZ, value)
    os.environ[name] = value


def windows_delete_user_env(name: str) -> None:
    if os.name != "nt":
        os.environ.pop(name, None)
        return
    import winreg  # type: ignore

    try:
        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER, "Environment", 0, winreg.KEY_SET_VALUE
        ) as key:
            winreg.DeleteValue(key, name)
    except FileNotFoundError:
        pass
    os.environ.pop(name, None)


def masked_secret(secret: str) -> str:
    if not secret:
        return ""
    if len(secret) <= 8:
        return "*" * len(secret)
    return f"{secret[:4]}...{secret[-4:]}"


def strip_ansi(text: str) -> str:
    return ANSI_RE.sub("", text or "")


def squash_text(text: str, limit: int = 140) -> str:
    compact = WHITESPACE_RE.sub(" ", strip_ansi(text or "")).strip()
    if len(compact) <= limit:
        return compact
    return compact[: limit - 1].rstrip() + "..."


def iso_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def parse_iso8601(value: str | None) -> dt.datetime | None:
    if not value:
        return None
    try:
        return dt.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def format_relative_time(value: str | None) -> str:
    when = parse_iso8601(value)
    if when is None:
        return ""
    now = dt.datetime.now(dt.timezone.utc)
    seconds = int((now - when).total_seconds())
    if seconds < 0:
        seconds = 0
    if seconds < 60:
        return f"{seconds}s ago"
    if seconds < 3600:
        return f"{seconds // 60}m ago"
    if seconds < 86400:
        return f"{seconds // 3600}h ago"
    return f"{seconds // 86400}d ago"


def normalize_status(value: Any) -> tuple[str, str]:
    if isinstance(value, str):
        return value, ""
    if isinstance(value, dict) and value:
        key = next(iter(value.keys()))
        detail = value.get(key)
        if isinstance(detail, dict):
            message = str(detail.get("message") or json.dumps(detail, ensure_ascii=False))
        else:
            message = str(detail or "")
        return key, message
    return "Unknown", ""


def powershell_json(command: str) -> Any:
    completed = subprocess.run(
        ["powershell", "-NoProfile", "-Command", command],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=30,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or completed.stdout.strip() or "PowerShell command failed")
    text = completed.stdout.strip()
    if not text:
        return None
    return json.loads(text)


def read_active_pid_map() -> dict[str, int]:
    mapping: dict[str, int] = {}
    if not ACTIVE_PIDS_PATH.exists():
        return mapping
    for path in ACTIVE_PIDS_PATH.iterdir():
        if not path.is_file():
            continue
        raw = read_file_text(path).strip()
        try:
            mapping[path.name] = int(raw)
        except ValueError:
            continue
    return mapping


def read_latest_assistant_preview(session_id: str) -> str:
    journal_path = SESSIONS_PATH / f"{session_id}.journal.jsonl"
    if not journal_path.exists():
        return ""
    lines = journal_path.read_text(encoding="utf-8", errors="replace").splitlines()
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        for message in reversed(event.get("append_messages") or []):
            if message.get("role") != "assistant":
                continue
            text_parts = []
            for part in message.get("content") or []:
                if isinstance(part, dict) and part.get("type") == "text":
                    text_parts.append(str(part.get("text") or ""))
            preview = squash_text(" ".join(text_parts))
            if preview:
                return preview
    return ""


def read_session_records(limit: int = 10) -> list[dict[str, Any]]:
    records = []
    active_pids = read_active_pid_map()
    if not SESSIONS_PATH.exists():
        return records
    for path in SESSIONS_PATH.glob("session_*.json"):
        if path.name.endswith(".journal.jsonl"):
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        messages = data.get("messages") or []
        status_text, status_detail = normalize_status(data.get("status"))
        session_id = str(data.get("id") or path.stem)
        working_dir = str(data.get("working_dir") or "")
        pid = active_pids.get(session_id, data.get("last_pid"))
        assistant_preview = read_latest_assistant_preview(session_id)
        records.append(
            {
                "session_id": session_id,
                "short_name": data.get("short_name") or session_id,
                "status": data.get("status") or "Unknown",
                "status_text": status_text,
                "status_detail": status_detail,
                "provider_key": data.get("provider_key") or "",
                "model": data.get("model") or "",
                "working_dir": working_dir,
                "created_at": data.get("created_at"),
                "updated_at": data.get("updated_at"),
                "last_active_at": data.get("last_active_at"),
                "relative_last_active": format_relative_time(data.get("last_active_at") or data.get("updated_at")),
                "last_pid": pid,
                "message_count": len(messages),
                "saved": bool(data.get("saved")),
                "is_debug": bool(data.get("is_debug")),
                "env_snapshot_count": len(data.get("env_snapshots") or []),
                "session_path": str(path),
                "journal_path": str(SESSIONS_PATH / f"{session_id}.journal.jsonl"),
                "assistant_preview": assistant_preview,
            }
        )
    records.sort(
        key=lambda item: parse_iso8601(item.get("updated_at") or item.get("last_active_at") or "") or dt.datetime.min.replace(tzinfo=dt.timezone.utc),
        reverse=True,
    )
    return records[:limit]


def process_details_for_pids(pids: list[int]) -> dict[int, dict[str, Any]]:
    valid = sorted({int(pid) for pid in pids if isinstance(pid, int) and pid > 0})
    if not valid:
        return {}
    clauses = [f"ProcessId={pid}" for pid in valid]
    command = (
        "Get-CimInstance Win32_Process -Filter '"
        + " OR ".join(clauses)
        + "' | Select-Object ProcessId,Name,CommandLine,CreationDate | ConvertTo-Json -Depth 4"
    )
    raw = powershell_json(command)
    if raw is None:
        return {}
    items = raw if isinstance(raw, list) else [raw]
    details = {}
    for item in items:
        try:
            pid = int(item.get("ProcessId"))
        except Exception:
            continue
        details[pid] = {
            "pid": pid,
            "name": item.get("Name") or "",
            "command_line": item.get("CommandLine") or "",
            "created_at": item.get("CreationDate") or "",
        }
    return details


def read_recent_logs(lines: int = 80) -> dict[str, Any]:
    if not LOGS_PATH.exists():
        return {"latest_file": "", "tail": [], "summary": {"errors": 0, "warnings": 0, "infos": 0}}
    log_files = sorted(LOGS_PATH.glob("*.log"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not log_files:
        return {"latest_file": "", "tail": [], "summary": {"errors": 0, "warnings": 0, "infos": 0}}
    latest = log_files[0]
    content_lines = latest.read_text(encoding="utf-8", errors="replace").splitlines()
    tail = content_lines[-lines:]
    summary = {"errors": 0, "warnings": 0, "infos": 0}
    for line in tail:
        if "[ERROR]" in line:
            summary["errors"] += 1
        elif "[WARN]" in line or "[WARNING]" in line:
            summary["warnings"] += 1
        elif "[INFO]" in line:
            summary["infos"] += 1
    return {
        "latest_file": str(latest),
        "updated_at": dt.datetime.fromtimestamp(latest.stat().st_mtime, tz=dt.timezone.utc).isoformat(),
        "tail": tail,
        "summary": summary,
    }


def workspace_match(path_text: str, workspaces: list[dict[str, Any]]) -> dict[str, Any] | None:
    normalized = normalize_workspace(path_text)
    if not normalized:
        return None
    key = normalized.lower()
    for workspace in workspaces:
        if str(workspace.get("path") or "").lower() == key:
            return workspace
    return None


def read_operations_dashboard() -> dict[str, Any]:
    sessions = read_session_records(limit=12)
    pid_candidates = [item.get("last_pid") for item in sessions]
    process_info = process_details_for_pids([pid for pid in pid_candidates if isinstance(pid, int)])
    workbench = read_workbench_state()
    workspaces = workbench.get("workspaces") or []
    active_sessions = []
    for session in sessions:
        pid = session.get("last_pid")
        details = process_info.get(pid) if isinstance(pid, int) else None
        matched_workspace = workspace_match(str(session.get("working_dir") or ""), workspaces)
        working_dir = str(session.get("working_dir") or "")
        session["process"] = details
        session["is_running"] = bool(details)
        session["working_dir_exists"] = bool(working_dir and Path(working_dir).exists())
        session["workspace_registered"] = bool(matched_workspace)
        session["workspace_name"] = str(matched_workspace.get("name") or "") if matched_workspace else ""
        session["workspace_path"] = str(matched_workspace.get("path") or "") if matched_workspace else working_dir
        active_sessions.append(session)
    processes = sorted(process_info.values(), key=lambda item: item["pid"], reverse=True)
    logs = read_recent_logs()
    state = read_state()
    gateway = gateway_health()
    return {
        "summary": {
            "active_session_count": sum(1 for item in active_sessions if item.get("is_running")),
            "tracked_session_count": len(active_sessions),
            "active_pid_count": len(processes),
            "gateway_enabled": bool(state["gateway"].get("enabled")),
            "gateway_ok": bool(gateway.get("ok")),
            "latest_log_time": logs.get("updated_at"),
            "telemetry_active_count": len(list(TELEMETRY_ACTIVE_SESSIONS_PATH.glob("*.active"))) if TELEMETRY_ACTIVE_SESSIONS_PATH.exists() else 0,
            "registered_workspace_count": len(workspaces),
            "selected_workspace": state.get("selected_workspace") or "",
            "provider": state["provider"].get("default_provider") or "",
            "model": state["provider"].get("default_model") or "",
        },
        "sessions": active_sessions,
        "processes": processes,
        "logs": logs,
        "last_validation": workbench.get("last_validation"),
    }


def read_state() -> dict[str, Any]:
    provider_bundle = read_provider_state()
    api_key = windows_read_user_env("ANTHROPIC_API_KEY")
    workbench = read_workbench_state()
    return {
        "provider": provider_bundle["provider"],
        "gateway": provider_bundle["gateway"],
        "api_key_present": bool(api_key.strip()),
        "api_key_masked": masked_secret(api_key.strip()),
        "config_path": str(CONFIG_PATH),
        "workbench_state_path": str(WORKBENCH_STATE_PATH),
        "jcode_bin": str(JCODE_BIN),
        "jcode_api_bin": str(JCODE_API_BIN),
        "workdir": str(DEFAULT_WORKDIR),
        "selected_workspace": workbench["selected_workspace"],
        "workspaces": workbench["workspaces"],
        "last_validation": workbench.get("last_validation"),
    }


def save_state(payload: dict[str, Any]) -> dict[str, Any]:
    provider = payload.get("provider") or {}
    gateway = payload.get("gateway") or {}
    updates = {
        "default_provider": str(provider.get("default_provider") or "claude"),
        "default_model": str(provider.get("default_model") or "claude-opus-4-7"),
        "anthropic_api_base": str(provider.get("anthropic_api_base") or "").strip(),
    }
    upsert_provider_values(updates)
    upsert_gateway_values(
        {
            "enabled": bool(gateway.get("enabled")),
            "port": int(gateway.get("port") or 7643),
            "bind_addr": str(gateway.get("bind_addr") or "0.0.0.0"),
        }
    )

    api_key = str(payload.get("anthropic_api_key") or "").strip()
    clear_api_key = bool(payload.get("clear_api_key"))
    if clear_api_key:
        windows_delete_user_env("ANTHROPIC_API_KEY")
    elif api_key:
        windows_set_user_env("ANTHROPIC_API_KEY", api_key)

    return read_state()


def command_preview(state: dict[str, Any]) -> list[str]:
    provider = state["provider"]
    model = provider.get("default_model") or "claude-opus-4-7"
    selected_workspace = state.get("selected_workspace") or str(DEFAULT_WORKDIR)
    return [
        f'jcode --no-update -p claude -m {model} provider current',
        f'jcode --no-update -p claude -m {model} run "Reply exactly CLAUDE_GATEWAY_OK"',
        f'jcode -C "{selected_workspace}"',
        f'jcode-api -C "{selected_workspace}"',
    ]


def run_command(args: list[str], cwd: str | None = None) -> dict[str, Any]:
    env = os.environ.copy()
    api_key = windows_read_user_env("ANTHROPIC_API_KEY").strip()
    if api_key:
        env["ANTHROPIC_API_KEY"] = api_key

    actual_cwd = Path(cwd) if cwd else DEFAULT_WORKDIR
    if not actual_cwd.exists():
        actual_cwd = Path.home()

    completed = subprocess.run(
        args,
        cwd=str(actual_cwd),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
        timeout=600,
    )
    return {
        "command": subprocess.list2cmdline(args),
        "exit_code": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
    }


def validate_state() -> dict[str, Any]:
    state = read_state()
    provider = state["provider"]
    model = provider.get("default_model") or "claude-opus-4-7"
    commands = [
        [str(JCODE_BIN), "--no-update", "-p", "claude", "-m", model, "provider", "current"],
        [
            str(JCODE_BIN),
            "--no-update",
            "-p",
            "claude",
            "-m",
            model,
            "run",
            "Reply exactly CLAUDE_GATEWAY_OK",
        ],
    ]
    results = [run_command(cmd) for cmd in commands]
    success = all(item["exit_code"] == 0 for item in results)
    snapshot = {
        "success": success,
        "validated_at": iso_now(),
        "commands": [
            {
                "command": item["command"],
                "exit_code": item["exit_code"],
                "stdout_preview": squash_text(item.get("stdout", ""), limit=220),
                "stderr_preview": squash_text(item.get("stderr", ""), limit=220),
            }
            for item in results
        ],
    }
    workbench = read_workbench_state()
    workbench["last_validation"] = snapshot
    write_workbench_state(workbench)
    state = read_state()
    return {
        "success": success,
        "results": results,
        "state": state,
        "preview": command_preview(state),
    }


def read_device_registry() -> dict[str, Any]:
    text = read_file_text(DEVICES_PATH)
    if not text.strip():
        return {"devices": [], "pending_codes": []}
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {"devices": [], "pending_codes": []}
    now = dt.datetime.now(dt.timezone.utc)
    pending_codes = []
    for code in data.get("pending_codes") or []:
        expires_at = str(code.get("expires_at") or "") if isinstance(code, dict) else ""
        expired = False
        seconds_left = None
        try:
            expires = dt.datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            seconds_left = max(0, int((expires - now).total_seconds()))
            expired = seconds_left == 0
        except ValueError:
            expired = True
        pending_codes.append({**code, "expired": expired, "seconds_left": seconds_left})
    return {
        "devices": data.get("devices") or [],
        "pending_codes": pending_codes,
    }


def gateway_connect_host(bind_addr: str) -> str:
    bind_addr = (bind_addr or "").strip()
    if bind_addr in {"0.0.0.0", "::", ""}:
        return "127.0.0.1"
    return bind_addr


def gateway_health() -> dict[str, Any]:
    state = read_state()
    gateway = state["gateway"]
    host = gateway_connect_host(gateway.get("bind_addr") or "127.0.0.1")
    port = int(gateway.get("port") or 7643)
    url = f"http://{host}:{port}/health"
    result: dict[str, Any] = {
        "enabled": bool(gateway.get("enabled")),
        "host": host,
        "port": port,
        "url": url,
        "ok": False,
    }
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            body = response.read().decode("utf-8", errors="replace")
            result["status_code"] = response.status
            result["body"] = body
            result["ok"] = response.status == 200
    except urllib.error.HTTPError as exc:
        result["status_code"] = exc.code
        result["body"] = exc.read().decode("utf-8", errors="replace")
        result["error"] = str(exc)
    except Exception as exc:
        result["error"] = str(exc)
    return result


def gateway_pair_command() -> dict[str, Any]:
    result = run_command([str(JCODE_BIN), "--no-update", "pair"])
    output = strip_ansi("\n".join([result.get("stderr", ""), result.get("stdout", "")]))
    match = re.search(r"Pairing code:\s+([0-9]{3})\s+([0-9]{3})", output)
    if match:
        result["pairing_code"] = f"{match.group(1)}{match.group(2)}"
    uri_match = re.search(r"jcode://pair\?host=([^\s&]+)&port=([0-9]+)&code=([0-9]{6})", output)
    if uri_match:
        result["pair_uri"] = uri_match.group(0)
        result["connect_host"] = uri_match.group(1)
        result["connect_port"] = int(uri_match.group(2))
        result["pairing_code"] = uri_match.group(3)
    result["clean_output"] = output
    return result


def gateway_dashboard() -> dict[str, Any]:
    state = read_state()
    registry = read_device_registry()
    return {
        "gateway": state["gateway"],
        "health": gateway_health(),
        "devices": registry["devices"],
        "pending_codes": registry["pending_codes"],
        "devices_path": str(DEVICES_PATH),
    }


def launch_workspace(payload: dict[str, Any]) -> dict[str, Any]:
    path = normalize_workspace(payload.get("path") or read_state().get("selected_workspace"))
    if not path:
        raise ValueError("No workspace selected.")
    shell = payload.get("shell") or "jcode"
    if shell == "jcode-api":
        cmd = str(JCODE_API_BIN if JCODE_API_BIN.exists() else JCODE_BIN)
    else:
        cmd = str(JCODE_BIN)

    args = []
    if cmd.lower().endswith(".cmd"):
        args = ["/c", cmd, "-C", path]
        file_path = "cmd.exe"
    else:
        args = ["-NoExit", "-Command", f'& "{cmd}" -C "{path}"']
        file_path = "powershell.exe"

    subprocess.Popen(args=[file_path, *args], cwd=path)
    select_workspace(path)
    return {
        "launched": True,
        "path": path,
        "shell": shell,
    }


def reveal_path(payload: dict[str, Any]) -> dict[str, Any]:
    path = normalize_workspace(payload.get("path") or "")
    if not path:
        raise ValueError("No path supplied.")
    target = Path(path)
    if not target.exists():
        raise ValueError(f"Path does not exist: {path}")
    subprocess.Popen(["explorer.exe", str(target)])
    return {
        "revealed": True,
        "path": str(target),
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "JCodeConfigWorkbench/0.1"

    def log_message(self, format: str, *args: Any) -> None:
        return

    def do_GET(self) -> None:
        try:
            if self.path == "/api/state":
                self.send_json(read_state())
                return
            if self.path == "/api/operations":
                self.send_json(read_operations_dashboard())
                return
            if self.path == "/api/gateway":
                self.send_json(gateway_dashboard())
                return
            if self.path in ("/", "/index.html"):
                self.serve_file(WEB_ROOT / "index.html", "text/html; charset=utf-8")
                return
            self.send_error(404, "Not found")
        except Exception as exc:
            self.send_json({"error": str(exc)}, status=500)

    def do_POST(self) -> None:
        try:
            if self.path == "/api/save":
                payload = self.read_json()
                self.send_json(save_state(payload))
                return
            if self.path == "/api/validate":
                self.send_json(validate_state())
                return
            if self.path == "/api/gateway/save":
                payload = self.read_json()
                upsert_gateway_values(payload.get("gateway") or {})
                self.send_json(read_state())
                return
            if self.path == "/api/gateway/health":
                self.send_json(gateway_health())
                return
            if self.path == "/api/gateway/pair":
                self.send_json(gateway_pair_command())
                return
            if self.path == "/api/workspaces/save":
                payload = self.read_json()
                self.send_json(
                    upsert_workspace(
                        str(payload.get("name") or ""),
                        str(payload.get("path") or ""),
                    )
                )
                return
            if self.path == "/api/workspaces/remove":
                payload = self.read_json()
                self.send_json(remove_workspace(str(payload.get("path") or "")))
                return
            if self.path == "/api/workspaces/select":
                payload = self.read_json()
                self.send_json(select_workspace(str(payload.get("path") or "")))
                return
            if self.path == "/api/workspaces/launch":
                payload = self.read_json()
                self.send_json(launch_workspace(payload))
                return
            if self.path == "/api/open-path":
                payload = self.read_json()
                self.send_json(reveal_path(payload))
                return
            self.send_error(404, "Not found")
        except json.JSONDecodeError as exc:
            self.send_json({"error": f"Invalid JSON: {exc}"}, status=400)
        except Exception as exc:
            self.send_json({"error": str(exc)}, status=500)

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def send_json(self, payload: dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def serve_file(self, path: Path, content_type: str) -> None:
        if not path.exists():
            self.send_error(404, "Not found")
            return
        body = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Config workbench listening on http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
