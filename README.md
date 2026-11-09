# ousterhout

A reusable AI-agent skill for finding **worthwhile, complexity-reducing refactors**
using John Ousterhout's *A Philosophy of Software Design*.

Review pending changes or a folder, approve specific proposals, then let the agent
implement and verify them. The skill is self-contained; it does not require other
personal skills or a particular framework, model, or package manager.

## Install globally in OpenCode

```sh
bunx @gavaar/ousterhout@latest install
```

That's it: both the skill and `/ousterhout` command are installed for your user
account, across projects. `init` is an alias for `install`. No `-g`, checkout,
manual copying, plugin, or OpenCode config edit is needed.

Requires OpenCode with skill/command support. `bunx` respects the CLI's Node
shebang, so use Node.js 20+ or run entirely with Bun:

```sh
bunx --bun @gavaar/ousterhout@latest install
```

Node users can instead use `npx --yes @gavaar/ousterhout@latest install`. Reviewing
pending changes also requires Git. The installer has no runtime dependencies or
automatic install-time scripts; it writes files only when `install`/`init` runs.

### Verify

In OpenCode, from any project:

```text
/ousterhout --help
```

It should load the skill and describe change mode, folder mode, cost warnings, and
the approval gate without reviewing or editing your code.

If it is missing, check the installation paths and permissions below. A
project-local skill or command with the same ID can override the global
installation. The skill is intentionally hidden from automatic model invocation,
but explicitly loadable by ID. OpenCode also documents explicit skill mentions as
`@ousterhout`.

### Where it installs

- Skill: `~/.config/opencode/skills/ousterhout/`
- Command: `~/.config/opencode/commands/ousterhout.md`

An absolute `XDG_CONFIG_HOME` overrides `~/.config`. OpenCode reloads changes
automatically; use `/reload` if discovery looks stale. No restart is needed.

The installer preserves unrelated files and refuses to overwrite locally edited
skill/command files. Back up or move conflicting files before retrying; there is
no destructive `--force` option. An identical manual installation is adopted
automatically. Linked destination files/directories are refused rather than
modifying their targets.

## Use

### Review staged + unstaged changes

From the project you want reviewed:

```text
/ousterhout
```

The agent reviews the **final working-tree design against `HEAD`**, including
relevant non-ignored untracked files. It inspects staged and unstaged differences
to understand context, but does not confuse their intermediate versions with the
final files. A staged edit undone on disk is reported as outside that final design.
No relevant changes means no automatic whole-repository review.

### Analyze a folder, including unchanged code

```text
/ousterhout src/payments
/ousterhout "src/payment flows"
/ousterhout .
```

Paths resolve from the active project directory. The agent inventories the folder,
then warns about token cost. **Large folders can consume substantial tokens**, even
with no pending changes. The [folder-cost policy](SKILL.md#folder-cost-policy)
defines when the agent must ask whether to proceed, narrow the folder, or use a
bounded first pass. Generated code, dependencies, binaries, and build output are
excluded; relevant authored tests and contracts may be read.

Callers outside the folder may be inspected to verify findings. Edits beyond the
folder require explicit approval. Folder analysis can be read-only outside Git;
implementation there first requires agreement on a checkpoint/backup strategy.

### Select refactors

The agent presents ranked proposals with stable IDs, concrete file references,
principles, tradeoffs, intended scope, and verification. For example:

```text
Implement O1 only. Leave O2 as-is.
```

Review the proposal's file scope before approving it. If extra files, behavior
changes, dependencies, or migrations become necessary, the agent asks again.
Substantial interface changes include a comparison of alternative designs.

### Review the implementation

The agent establishes relevant checks, implements approved refactors incrementally,
and reports verification and remaining risks. Existing staging choices are
preserved; it does not stage, unstage, commit, or publish. Refactoring preserves
behavior. Discovered bugs are reported separately, not silently fixed.

**No worthwhile refactors found** is a valid result. This is not a mandate to add
abstractions, shorten functions, merge files, or meet a finding quota.

## What it evaluates

The [rubric](references/principles.md) examines knowledge burden, deep interfaces,
information hiding, entanglement, appropriately general-purpose APIs, shared
complexity ownership, strategic design, error contracts, obviousness, names,
comments, alternative designs, and what matters most.

These are original summaries grounded in the author's public material, **not an
exhaustive full-book analysis or an endorsement by John Ousterhout**. See
[sources and coverage limits](references/sources.md). The book and official extract
are not bundled or licensed under this repository's MIT license.

## Other agents

`SKILL.md` follows the Agent Skills directory format. Install the directory using
your agent's documented skill mechanism; the core workflow does not depend on
OpenCode. If that agent lacks a skill loader, ask it to read `SKILL.md` from the
checkout and resolve references relative to it. Slash-command registration and
frontmatter support vary; `commands/ousterhout.md` is specifically for OpenCode.

## Update or uninstall

To update, rerun:

```sh
bunx @gavaar/ousterhout@latest install
```

The installer updates the files it manages while protecting local edits. There is
no background updater.

To uninstall, remove only the installed skill directory
`$XDG_CONFIG_HOME/opencode/skills/ousterhout` and command
`$XDG_CONFIG_HOME/opencode/commands/ousterhout.md`, substituting `~/.config` when
`XDG_CONFIG_HOME` is unset. Check their contents first. Your project files are
independent and do not need to be removed.

## License

[MIT](LICENSE). Linked third-party works retain their own rights.
