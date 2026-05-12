# Repository Guidelines

## Development Workflow

- **Commit as you go** - Make small, focused commits after completing each feature or fix
- If the git state is not clean, or there are other agents working in the codebase in parallel, do your best to still commit your work. 
- **Push when done** - Push all commits to remote when finishing a task or session
- **Use fast iteration by default** - Prefer `cargo check`, targeted tests, and dev builds while iterating
- **Rebuild when done** - When you are done making changes, build the source.
- **Bump version for releases** - Update version in `Cargo.toml` when making releases. When cutting a new release, look at all the changes that happened since the last release and determine what the version bump should be ie patch or minor, etc. 
- **Remote builds available** - Use `scripts/remote_build.sh` to offload heavy cargo work to another machine. If your build is terminated, likely is because there are not enough resources on this machine to build. use remote build in that case. Try checking the resource avaliablity on the machine before you run a build. 

## Web UI / Tauri UX Direction

- Treat the web UI as a multi-model orchestration workbench, not a generic dashboard. The primary loop is: compose a task, understand which model route will handle it, watch execution/collaboration state, and inspect failures without leaving the task.
- Keep the header compact. Preserve only high-frequency actions in the top bar; collapse secondary controls behind clear icon buttons or short chips, especially on narrow viewports.
- Make the composer route-aware. When changing the chat/task input surface, show the active routing mode, default model, fallback state, and role route hints close to the send action so users know how the next task will run.
- Prefer a right-side runtime inspector over forcing users into a separate runtime-only workflow. Runtime visibility should summarize active tools, collaboration members, route roles, errors, and recent events while the main conversation/work surface stays usable.
- Represent collaboration as workflow state, not only metrics. Planning, execution, review, and fallback roles should show the responsible model, current status, and the latest meaningful action.
- Keep visual hierarchy quiet and operational: the main task surface gets the strongest weight; Runtime, Settings, and supporting metadata stay lower contrast unless they are active, blocked, or failing.
- Use Tailwind for new UI styling through the existing local pipeline. Add reusable component classes in `web-ui/css/tailwind.css` or existing scoped CSS as appropriate, run `npm run build`, and let `web-ui/scripts/sync-dist.mjs` update generated Tauri assets.
- Do not hand-edit `web-ui/dist`; edit source files and regenerate. Avoid CDN-only styling or assets that would make packaged Tauri builds fragile.
- Current model-routing UI is local route-hint state until the gateway/runtime exposes an authoritative backend model-routing contract. Do not imply backend orchestration exists until that protocol is implemented and verified.
- Verify visual work on desktop and mobile viewports, including overflow, focus/hover states, and whether the main workflow is understandable without explanatory in-app text.

## Logs
- Logs are written to `~/.jcode/logs/` (daily files like `jcode-YYYY-MM-DD.log`).

## Debug Socket
- Use the debug socket for runtime level debugging

## Install Notes
- `~/.local/bin/jcode` is the launcher symlink used from `PATH`.
- `~/.jcode/builds/current/jcode` is the active local/source-build channel; self-dev builds and `scripts/install_release.sh` point the launcher here.
- `~/.jcode/builds/stable/jcode` is the stable release channel; `scripts/install.sh` installs this and points the launcher here.
- `~/.jcode/builds/versions/<version>/jcode` stores immutable binaries.
- `~/.jcode/builds/canary/jcode` still exists for canary/testing flows, but it is not the primary self-dev install path.
- On Windows, the equivalents are `%LOCALAPPDATA%\\jcode\\bin\\jcode.exe` for the launcher, `%LOCALAPPDATA%\\jcode\\builds\\stable\\jcode.exe` for stable, and `%LOCALAPPDATA%\\jcode\\builds\\versions\\<version>\\jcode.exe` for immutable installs; `scripts/install.ps1` currently installs the stable channel.
- Ensure `~/.local/bin` is **before** `~/.cargo/bin` in `PATH`.

