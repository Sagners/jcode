from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


HOST = "127.0.0.1"
PORT = 8765
ROOT = Path(__file__).resolve().parent
WEB_ROOT = ROOT / "web"
CONFIG_PATH = Path.home() / ".jcode" / "config.toml"
DEFAULT_WORKDIR = Path.home() / "Documents" / "Playground"
JCODE_BIN = Path.home() / ".cargo" / "bin" / "jcode.exe"


def read_file_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def read_provider_state() -> dict[str, Any]:
    text = read_file_text(CONFIG_PATH)
    provider = {
        "default_provider": "",
        "default_model": "",
        "anthropic_api_base": "",
    }
    active = False
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if line.startswith("[") and line.endswith("]"):
            active = line == "[provider]"
            continue
        if not active or "=" not in line or line.startswith("#"):
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key in provider:
            provider[key] = value
    return provider


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


def read_state() -> dict[str, Any]:
    provider = read_provider_state()
    api_key = windows_read_user_env("ANTHROPIC_API_KEY")
    return {
        "provider": provider,
        "api_key_present": bool(api_key.strip()),
        "api_key_masked": masked_secret(api_key.strip()),
        "config_path": str(CONFIG_PATH),
        "jcode_bin": str(JCODE_BIN),
        "workdir": str(DEFAULT_WORKDIR),
    }


def save_state(payload: dict[str, Any]) -> dict[str, Any]:
    provider = payload.get("provider") or {}
    updates = {
        "default_provider": str(provider.get("default_provider") or "claude"),
        "default_model": str(provider.get("default_model") or "claude-opus-4-7"),
        "anthropic_api_base": str(provider.get("anthropic_api_base") or "").strip(),
    }
    upsert_provider_values(updates)

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
    return [
        f'jcode --no-update -p claude -m {model} provider current',
        f'jcode --no-update -p claude -m {model} run "Reply exactly CLAUDE_GATEWAY_OK"',
    ]


def run_command(args: list[str]) -> dict[str, Any]:
    env = os.environ.copy()
    api_key = windows_read_user_env("ANTHROPIC_API_KEY").strip()
    if api_key:
        env["ANTHROPIC_API_KEY"] = api_key

    completed = subprocess.run(
        args,
        cwd=str(DEFAULT_WORKDIR if DEFAULT_WORKDIR.exists() else Path.home()),
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
    return {
        "success": success,
        "results": results,
        "state": state,
        "preview": command_preview(state),
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "JCodeConfigWorkbench/0.1"

    def log_message(self, format: str, *args: Any) -> None:
        return

    def do_GET(self) -> None:
        if self.path == "/api/state":
            self.send_json(read_state())
            return
        if self.path in ("/", "/index.html"):
            self.serve_file(WEB_ROOT / "index.html", "text/html; charset=utf-8")
            return
        self.send_error(404, "Not found")

    def do_POST(self) -> None:
        if self.path == "/api/save":
            payload = self.read_json()
            self.send_json(save_state(payload))
            return
        if self.path == "/api/validate":
            self.send_json(validate_state())
            return
        self.send_error(404, "Not found")

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
