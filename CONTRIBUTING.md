# Contributing to jcode

Thanks for contributing.

## Fork collaboration workflow

This repository is currently operated as a fork-customized variant of upstream
`jcode`.

That means the default expectation is:

- `upstream` is the official source repository
- `origin` is the writable fork for this customization line
- fetch and pull from `upstream`
- push new work to `origin`
- do not push directly to `upstream`

Recommended command flow:

```bash
# Refresh official upstream state
git fetch upstream --prune
git pull --ff-only upstream master

# Publish local customized work
git push origin master
```

If you are preparing a larger upstream sync, use a short review loop first:

- inspect `git log --oneline upstream/master..HEAD` to see the local delta
- inspect `git log --oneline HEAD..upstream/master` to see incoming upstream work
- re-check fork-specific surfaces before and after the sync
- prefer small, explainable maintenance commits over giant reconciliation diffs

For this fork, changes should stay explicit about which side they belong to:

- upstream-aligned fixes should be easy to rebase or drop if upstream subsumes them
- fork-only behavior should be documented in code or docs so later agents know it is intentional
- if a local customization starts fighting upstream architecture too hard, redesign it rather than piling on compatibility hacks

## Issues vs pull requests

If the problem is easy for me to reproduce, please prefer opening a GitHub issue. A clear issue with reproduction steps, expected behavior, actual behavior, logs, screenshots, or traces is usually the fastest path to a fix.

Pull requests are more useful when the problem depends on an environment I may not have, such as macOS-specific behavior, Windows-specific behavior, unusual shells, terminal emulators, filesystems, GPU/display setups, provider accounts, or other local configuration. In those cases, a PR can be a useful reference because it captures the behavior in the environment where the problem actually occurs.

## Pull request policy

Pull requests are welcome and encouraged.

That said, most PRs should be treated as proposals or references, not as changes that are likely to be merged directly. This project is developed with heavy use of code generation, and generated code can be deceptively plausible: it may fix the visible problem while introducing subtle correctness, lifecycle, architecture, or maintenance issues.

Because of that, I will often use PRs to understand the bug, feature request, test case, design direction, or proposed implementation, then write my own version of the change. The submitted code may still be extremely valuable as a reference, reproduction, or proof of concept, even if the final committed code is different.

This is not a judgment that maintainer-generated code is inherently better than contributor-generated code. It is a practical ownership rule: if I am going to maintain the resulting code, I need to understand its assumptions, tradeoffs, and failure modes.

The best PRs therefore include:

- a clear description of the problem being solved
- a minimal reproduction or failing test when possible
- notes about edge cases and tradeoffs
- focused changes that are easy to review independently
- any relevant logs, screenshots, traces, or benchmarks

Large, generated, or highly invasive PRs may be closed even when the underlying idea is good. In those cases, the issue or PR may still be used as a reference for a maintainer-authored change.

Handwritten by author: My clanker slop may or may not be better than your clanker slop. I know how to work with my clanker slop though.
