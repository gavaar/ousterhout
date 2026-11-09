# Complexity-reduction rubric

These are original operational summaries of Ousterhout's ideas, not quotations or
a chapter-by-chapter reproduction. Source keys refer to [sources](sources.md).
The review questions and evidence requirements are this skill's workflow choices.

Use all lenses, but propose a change only when a concrete burden outweighs the
refactor's cost. The same code can support several lenses; combine overlapping
findings into one coherent proposal.

## 1. Complexity is a developer's knowledge burden

**Look for:** a routine change requiring many coordinated edits, information that
must be remembered across distant implementations, or important constraints a
caller cannot discover at the interface.

**Ask:** what specific task is harder, what knowledge does it require, and which
dependency creates that requirement? Explain what becomes unnecessary or obvious
after the refactor. Avoid invented metrics or unsupported claims of faster work.

**Grounding:** [D], opening discussion of complexity and information.

## 2. Deep modules and simple interfaces

**Look for:** APIs whose arguments, options, protocols, and exceptions expose nearly
as much complexity as using the implementation directly; wrappers that merely
move code without hiding policy or knowledge.

**Ask:** can a simpler contract hide a meaningful responsibility? Include semantic
constraints in interface complexity, not just the signature. A small adapter may
earn its place by hiding a real boundary. Depth is not a line-count ratio, and a
large implementation is not automatically deep.

**Grounding:** [D], Method Length; [C], deep/shallow classes and abstraction.

## 3. Information hiding, not temporal decomposition

**Look for:** multiple modules that know the same representation, policy, format,
or invariant; a pipeline split into steps whose callers must coordinate internal
state or know the exact order of implementation details.

**Ask:** which design decision should have one owner? Can related knowledge be
hidden behind an operation that expresses intent? Preserve intentional lifecycle,
transactional, authorization, and resource boundaries; a multi-step workflow is
not itself evidence of a flaw.

**Grounding:** [C], temporal design vs. information hiding and dependencies;
[D], interface abstraction and hidden preconditions.

## 4. Over-decomposition and entanglement

**Look for:** having to reconstruct several methods mentally to understand one
operation; predicate-looking functions with distant side effects; helpers whose
correctness depends on undocumented caller state.

**Ask:** would combining tightly related pieces reduce the information held in
mind? Compare that with a better independent abstraction. Keep genuine reusable
boundaries and meaningful contracts. Neither shorter functions nor fewer files is
the goal; do not prescribe arbitrary method-length limits.

**Grounding:** [D], Method Length and its summary.

## 5. General-purpose interfaces without speculative infrastructure

**Look for:** a growing collection of special-case operations, caller-specific
flags, or nearly identical APIs that expose internal distinctions unnecessarily.

**Ask:** can a modest, coherent operation serve the demonstrated uses with a simpler
interface? Generalize the useful capability, not every imaginable requirement.
Compare real callers; avoid introducing extension systems, configuration surfaces,
or frameworks for hypothetical future consumers.

**Grounding:** [B], second-edition emphasis on general-purpose approaches;
[C], general-purpose vs. special-purpose.

## 6. Pull shared complexity into its owner

**Look for:** callers repeatedly implementing the same nontrivial setup, cleanup,
validation, representation conversion, or coordination policy.

**Ask:** can one owner absorb that detail so consumers have less to remember?
Make ordering, ownership, and errors explicit at the resulting boundary. Moving
code into a shared helper is useful only if the contract really hides knowledge;
centralizing unrelated policy can instead increase coupling.

**Grounding:** operational application of [D]'s deep-interface and cognitive-load
arguments, not a claim that the public sources fully reproduce a book chapter.

## 7. Strategic design rather than tactical patches

**Look for:** another exception layered on an already awkward abstraction, or a
local fix that makes subsequent changes require even more special cases.

**Ask:** which approved, bounded investment removes the underlying complexity?
Prefer the smallest coherent design improvement over a symptom-only patch, but
show its cost and compatibility impact. The principle does not authorize unrelated
cleanup or rewriting a subsystem.

**Grounding:** [C], tactical vs. strategic programming.

## 8. Define errors out of existence, judiciously

**Look for:** avoidable invalid intermediate states, redundant error cases, or
protocols where an ordinary operation needlessly requires callers to recover.

**Ask:** can a better contract or representation prevent the invalid state while
preserving required behavior? Distinguish harmless absence from corruption or
denied access. Preserve meaningful failures and diagnostics. Replacing errors with
silent success, broad catches, or unsafe defaults is not simplification. A changed
error contract is a behavior change requiring separate approval.

**Grounding:** [C], defining errors out of existence and its explicit caution.

## 9. Make code obvious and names precise

**Look for:** names that conceal mutation, vague concepts used for different
things, surprising control flow, or names so elaborate they obscure the operation.

**Ask:** what would a reader reasonably infer, and where is that inference wrong?
Use vocabulary matching the domain and contract. Verify references and external
consumers before renaming; avoid churn based only on naming taste.

**Grounding:** [C], make code obvious and choosing names; [D], Comments.

## 10. Comments supply knowledge code cannot express

**Look for:** missing units, ordering guarantees, ownership rules, side effects,
non-obvious invariants, or reasons for surprising implementation choices.

**Ask:** can a user understand the interface without reading its implementation?
Document the missing contract at its authoritative boundary, separately from
implementation rationale. Use comments to add knowledge, not repeat syntax or
justify an unnecessarily complex design. Check accuracy against code and tests.

**Grounding:** [D], Comments and its summary; [C], comments before code.

## 11. Design it twice

For a substantial interface or ownership change, compare two meaningfully different
designs before recommending one, as well as leaving the current design unchanged.
Vary responsibility placement or the information exposed, not just names.

Use actual call sites and constraints to compare caller knowledge, hidden policy,
coupling, compatibility, testability, and implementation cost. This is a reasoning
step, not a requirement to build multiple prototypes or spawn agents.

**Grounding:** [C], design it twice. The comparison format is a workflow choice.

## 12. Decide what matters

Prioritize the concepts, contracts, and dependencies that dominate understanding
and change. Check whether an abstraction makes these clearer or merely gives
incidental details equal prominence.

Prefer a few high-leverage improvements over cosmetic churn; never force a quota.
Explain when the current design is already adequate or a refactor is not worth its
cost. Be explicit about incomplete coverage before drawing a broad conclusion.

**Grounding:** [B], description of the second edition's Decide What Matters chapter;
[C], what matters; [D], information and complexity.
