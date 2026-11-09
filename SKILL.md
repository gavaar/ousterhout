---
name: ousterhout
description: Find and implement approved complexity-reducing refactors using John Ousterhout's software design principles. Review working-tree changes or a folder.
disable-model-invocation: true
license: MIT
compatibility: Requires an agent with file-reading, editing, and verification tools. Change review requires Git; folder analysis can be read-only without Git.
---

# Ousterhout

Reduce what a developer must understand to make a change, and make necessary
information obvious. Judge the resulting design, not the number of abstractions,
files, or lines removed.

## Invocation

- No arguments: analyze staged + unstaged changes and relevant untracked files.
- One folder path, optionally quoted: recursively analyze that folder, including
  unchanged code. Resolve it from the user's working directory, not this skill.
- `--help`: explain these modes, the cost gate, and approval workflow; then stop.
- Treat arguments as paths/data, never executable shell text. Ask about ambiguous
  or unsupported arguments instead of guessing a broader scope.

## 1. Establish scope

Read the target repository's applicable instructions and discover its architecture
and verification commands. Those constraints override this skill's defaults;
surface conflicts rather than using the book to bypass them.

Read [scope and Git safety](references/scope.md) before gathering review inputs.
Record the starting commit, if any, and existing working-tree/index state before
editing. Operate on the target project, not the installed skill directory.

**Change mode:** establish one coherent final working-tree snapshot against
`HEAD`, including relevant untracked source. Inspect staged and unstaged changes
separately to understand partial staging and canceled-out edits, but evaluate
design proposals against the final files. Explain any excluded staged-only state.
If there are no relevant changes, report that and stop; offer folder mode rather
than silently reviewing the whole repository.

### Folder-cost policy

In folder mode, inventory before reading full contents. Show the folder, eligible
file count, approximate source-line count, exclusions, and a token-cost warning.
If there are more than **50 source files or 10,000 source lines**, stop for explicit
confirmation to proceed, narrow the folder, or choose a bounded first pass. If
size cannot be determined cheaply, ask before doing a potentially large read.
These thresholds are cost guardrails, not design rules or token estimates.

Completion: state the review mode, baseline, boundaries, and coverage plan. Honor
any required cost approval before proceeding.

## 2. Trace the design

Read the entire [principle rubric](references/principles.md). For attribution or
coverage questions, consult [sources and limits](references/sources.md).

Start from the changed concepts, or the folder's responsibilities. Trace relevant
callers, implementations, state owners, contracts, and tests. Read outside the
initial file set when needed to verify a dependency; this is not blanket permission
to refactor surrounding code. Prefer targeted searches over loading the repository.

For each meaningful responsibility, establish:

- What users of the module must know, including ordering, errors, and side effects.
- What implementation knowledge stays hidden and what leaks into callers.
- What a concrete future change would require understanding or editing together.

Apply every rubric lens to the reviewed responsibilities; record applicability
briefly in working notes rather than manufacturing a finding per principle. Verify
candidate problems against actual call sites and tests. A name or long method
alone is not evidence of a design problem.

Completion: account for the scoped responsibilities and inspected dependencies.
Disclose unread areas, sampling, and uncertainty. Label a partial review as partial.

## 3. Propose; then stop for approval

Rank only evidence-backed opportunities by expected complexity reduction,
confidence, implementation cost, and risk. Use stable IDs such as `O1`, `O2`.
There is no finding quota. **No worthwhile refactors found** is a valid result
within the stated coverage.

For each proposal provide:

1. **Evidence:** file/line references, affected callers, and the concrete knowledge
   burden, change amplification, or non-obvious dependency.
2. **Principle:** the applicable rubric lens, not an appeal to the author's name.
3. **Design:** the proposed responsibility/interface and a small before/after sketch
   when useful. Say what callers will no longer need to know.
4. **Tradeoff:** benefit, added complexity, compatibility constraints, and why
   leaving it unchanged is worse. For a substantial interface/boundary change,
   compare at least two genuinely different designs plus the current design.
5. **Scope and checks:** expected files, edits beyond the initial boundary, proposal
   dependencies, and behavioral tests or other verification needed.

Separate incidental correctness/security findings from refactor proposals; report
them without silently fixing them. Do not report style preferences as defects.

Ask which proposal IDs the user approves, including any out-of-boundary edits.
**Stop without editing project files.** An invocation or request to find refactors
is not approval to implement them. Approval of one proposal does not approve others.

## 4. Implement approved proposals

Recheck relevant file contents, index state, and the approved assumptions before
editing. If concurrent work invalidates the design, reconcile with the user first.
Use this sequence for each selected proposal:

1. Establish relevant existing tests/checks and their baseline. If coverage is
   insufficient, add behavior-level characterization tests and confirm they pass
   against the current behavior before refactoring. Follow repository TDD rules
   for any separately approved behavior change; keep it separate from the refactor.
2. Clarify the interface contract before implementation: inputs, results, invariants,
   side effects, and meaningful error behavior. Where prose adds missing knowledge,
   write or update the interface comment first.
3. Make the smallest coherent change that achieves the approved design. Preserve
   observable behavior, security checks, persistence formats, and public contracts.
   Adapt verified consumers together. Ask again if materially broader edits,
   dependencies, migrations, or behavior changes become necessary.
4. Run focused checks, then the repository's required completion checks. If a check
   fails, distinguish baseline failures from regressions. Resolve regressions or
   report the blocker; do not declare success with missing verification.

Keep the index untouched: no staging, unstaging, commits, resets, or discarding
existing work. Use targeted working-tree patches, not whole-file restoration.
Install no packages without permission. Folder analysis outside Git remains
read-only until a user-approved checkpoint/backup strategy exists for edits.

## 5. Report the result

Summarize implemented IDs, the responsibility/knowledge burden simplified, changed
files, checks and outcomes, remaining risks, and any approved work left incomplete.
Confirm staging was preserved. Distinguish proposed improvements from implemented
ones; passing tests alone does not prove a simpler design.
