# RustScript Agent: The Runtime Protocol Around Model Calls

*Why an agent needs admission, authority, durable effects, and recovery around the model*

---

A model call can propose the next step, but it cannot by itself define a reliable agent runtime. The surrounding system still has to answer harder questions: Which installed plugin/tool graphs and authority admitted this run? What may the run change? Was a tool call already executed before a restart? Who owns a child process? When does a workspace change become visible to anyone else?

[RustScript Agent](https://github.com/rustscript-lang/rustscript-agent) treats those questions as a protocol around model calls. RustScript (`.rss`) owns policy that should be easy to inspect and evolve. Rust owns authority, durable state, resource ownership, and the boundaries that must remain valid even when a policy program, process, or machine stops.

This article describes the current core design. RustScript Agent is still pre-v1, so the emphasis is on invariants rather than a frozen public API. You can also visit [agent.rustscript.org](https://agent.rustscript.org/) and the [RustScript core documentation](/docs/reference/rustscript/).

## A Model Call Is One Transition, Not the Runtime

The runtime models a run as a sequence of admitted transitions:

1. Freeze the run's installed plugin/tool graph pins, limits, prompt inputs, and authority snapshot.
2. Durably create the session/run state and its initial event boundary.
3. Ask the model for a proposed next step.
4. If the step requests an effect, prepare and review that exact effect.
5. Commit an allowed result or roll back the prepared state.
6. Append durable messages and events, then advance the replay cursor.
7. Reach a classified terminal boundary that live retry or restart repair can handle.

The model participates in step 3. It does not get to redefine the other steps through generated text.

This separation also gives the runtime a useful failure model. A provider response can be pending, a tool effect can be prepared, a workspace branch can be staged, and a terminal transition can be awaiting a process-local durable-store retry. Those are distinct states with distinct recovery rules, rather than one vague "agent is running" flag.

## Policy in RSS, Authority in Rust

Agent behavior changes frequently: prompt construction, turn policy, tool routing, review policy, source selection, and result handling all benefit from living in RSS. They remain ordinary typed programs that can be compiled and reviewed. Installed plugin and tool graphs can also be pinned to admitted runs.

Rust keeps the parts that cannot depend on the guest program behaving correctly:

- durable session, run, event, approval, and effect records
- plugin/tool graph identities and source compilation checks
- workspace grants and publication authority
- deadlines, cancellation, permits, and resource quotas
- capability tokens and ownership generations
- filesystem and process confinement
- restart reconciliation and process-local terminal commit retry

The rule is simple: RSS may decide *what should happen next* within the admitted limits. Rust proves *whether this run has authority to make it happen* and records the transition durably.

Moving all policy into Rust would make iteration slow and couple behavior to a native release. Moving authority into RSS would let mutable guest state become its own permission proof. The split keeps both sides narrower.

## Typed Host Contracts Remove Map Guesswork

A boundary built from untyped maps leaves basic questions to convention. Does a missing key mean "not supplied," "false," or "host bug"? Is an empty object success? Can a caller distinguish a completed operation that returns no payload from an absent result?

RustScript's typed host surface uses named records together with Unit, `Option<T>`, and `Result<T, E>`:

- `()` means a successful operation has no payload.
- `Option<T>` distinguishes `Some(value)` from `None`.
- `Result<T, E>` distinguishes success from a typed failure.
- named structs fix field names and nested shapes at compile and bind time.

The public contract therefore does not ask policy code to probe arbitrary strings in a dynamic map. A runtime may still use an internal map as a VM carrier, but the registered host schema and the RSS consumer agree on one named type.

Simplified RSS-shaped pseudocode looks like this:

```rss
struct ReviewDecision {
    outcome: string,
    reason: Option<string>,
}

fn review(effect: PreparedEffect) -> Result<ReviewDecision, ReviewError> {
    let decision: ReviewDecision = guardian::review(effect)?;
    if decision.outcome == "allow" {
        Result::Ok(decision)
    } else if decision.outcome == "deny" || decision.outcome == "needs_user" {
        Result::Ok(decision)
    } else {
        Result::Err({code: "invalid_review_outcome"})
    }
}
```

This is more than nicer syntax. Typed contracts make source upgrades fail early when the host and policy disagree, and they prevent an omitted field from silently changing the meaning of an authority decision. See [Collections, Structs, and Optional Values](/docs/reference/rss/collections-and-structs/) and [Host Functions](/docs/reference/host-functions/) for the core model.

## Admission Pins Authority and Installed Graphs

A run is durably admitted with immutable run inputs and an authority snapshot. Together they capture prompt inputs, limits, model profile, workspace identity, and authority generation. Admission also retains immutable pins for the installed plugin and tool graphs used by the run.

Those graph pins matter because an installed plugin or tool graph may change while an older run is still in flight. Existing runs continue with the graph they admitted; later runs can use the newly activated graph. A long-running tool call cannot silently switch installed implementations halfway through its lifecycle.

The gateway's file-selected RSS agent source currently follows a different path. After durable admission—and potentially after the gateway has returned `202 Accepted`—the worker asks `cached_agent_runner` for a runner. For a file entry, that path digests the current module tree, compiles the current files, and checks the digest again before installing the compiled runner. The checks prevent a mixed source tree from being accepted during one compile, but the source identity is not stored as part of durable admission. A file change between acceptance and worker execution can therefore change which agent program executes.

Authority is checked before durable admission and checked again at effect and commit boundaries where necessary. Expensive admission preparation can happen outside a global commit gate, but the runtime revalidates the authority and installed graph inputs before it linearizes the run. If a relevant admitted input changed, preparation is repeated or admission fails. This guarantee prevents a run from referring to a stale workspace grant or a different installed graph pin; it does not yet make the later-resolved gateway file source immutable.

In Rust-shaped pseudocode, the boundary is roughly:

```rust
let prepared = prepare_admission_inputs_outside_commit_gate(request)?;

with_commit_gate(|| {
    let authority = revalidate_authority(&prepared)?;
    let graph_pins = seal_installed_graph_pins(&prepared.graphs, &authority)?;
    let admitted = durable_store.admit(request, graph_pins, prepared.snapshot)?;
    publish_in_memory_handle(admitted)
})
```

The implementation has more checks, but the ordering is the point: prepare first, revalidate, commit durable state, and only then expose a runnable handle.

## Sessions, Runs, Events, and Replay Cursors

The durable model separates four concepts:

- **Session:** the long-lived conversation and policy context.
- **Run:** one admitted execution with frozen limits and authority.
- **Event:** an ordered observation produced by that run.
- **Cursor:** the subscriber's position in the durable event sequence.

Events carry monotonically ordered sequence values. A reconnecting client requests events after its last sequence instead of asking the worker to reconstruct transient output. If the requested cursor predates retained history, the runtime reports that explicitly rather than wrapping or returning a misleading partial replay.

Durability does not imply magical exactly-once delivery. Subscribers may observe a durable event more than once after reconnecting. The stronger guarantee is inside the runtime protocol: completed model steps and committed tool results are recognized during replay, so recovery does not blindly repeat their underlying effects.

## Effects Use Prepare, Review, and Settlement

Tool calls are effects, even when the user-facing name sounds harmless. The runtime gives them an explicit lifecycle:

1. **Prepare.** Canonicalize the proposed action and bind it to the run, owner, graph, workspace branch, authority generation, deadline, and idempotency identity.
2. **Review.** Guardian evaluates that exact prepared action and returns `allow`, `deny`, or `needs_user`.
3. **Execute and commit.** An allowed action executes under the prepared capability. Its canonical result and durable effect record are committed together where the effect permits it.
4. **Roll back or abandon.** A denial, cancellation, stale authority, or execution failure releases prepared runtime-owned state and records the terminal disposition.

`needs_user` is not an implicit approval. It creates a durable handoff that must be resolved before execution. Likewise, a failed or malformed review fails closed; generated prose cannot be interpreted as a capability token.

Prepare and commit also make retries classifiable. If the runtime sees the same completed identity, it can replay the stored result. If it sees a prepared operation whose external outcome is unknown, it can preserve that indeterminate state instead of inventing success or executing again.

Rollback has a precise scope. The runtime can discard an unpublished workspace branch, retract a prepared artifact, or stop an owned process. It cannot promise to reverse every external system in the world. External effects need their own idempotency and reconciliation contracts.

## Managed Workspace Branches Make Publication Explicit

Directly mutating a shared workspace mixes execution with publication. RustScript Agent's managed workspace mode imports an immutable source tree and gives a run a private branch.

Reads and writes during the run target that branch. A successful file write can therefore be durable without immediately changing the source workspace. The branch can remain staged, be inspected, be discarded, or be published through a separate authorized transition.

Two completion semantics are useful:

- **Staged:** a run may complete while its branch remains private and unpublished.
- **Required publication:** the trusted host policy requires publication to commit in the same durable terminal transition as run completion.

Neither mode grants publication authority by itself. The branch identity, expected head, workspace grant, and publication permit must still match. Publication advances a managed pointer through a compare-and-swap style transition; it is not ambient permission to copy bytes anywhere on the host filesystem.

This design also clarifies rollback. Before publication, rollback means abandoning a private branch and its retained objects according to policy. After publication, changing the visible head is a new authorized operation with its own history, not a hidden filesystem undo.

## Restart Recovery Is Part of the Protocol

A durable runtime must assume interruption between any two boundaries. On restart, RustScript Agent runs `recovery.recover_active` in bounded pages, converts leftover active durable runs to `failed` with reason `gateway_restart`, reconciles pending effect records, and then reloads the repaired state.

Terminal commit retry is important because the worker may finish while storage is temporarily unavailable. While the process remains alive, the runtime keeps that state visible and retries the exact terminal transition for a bounded window. The `PendingTerminal` payload and its retry bookkeeping are process memory. If the process exits first, that original retry loop is gone; startup performs durable repair and effect reconciliation rather than resuming it.

Child processes follow the same ownership rule. A process handle belongs to an admitted owner and authority generation. Cancellation, timeout, or rollback closes the owned process, reaps it, and prevents a stale handle from being used by a later run. A process that outlives the call that created it is still a writer and remains subject to branch, token, and lifecycle ownership.

The goal is not to pretend crashes do not happen. It is to leave enough classified state that recovery can decide among replay, retry, refusal, and cleanup.

## Installed Graph Evolution Without Ambient Authority

Installed plugin and tool sources are prepared as closed, immutable graphs with content identities. Activation selects validated graphs for future admission. Runs retain those graph pins, including across restart, so a graph hot cut does not rewrite the installed tool implementations of earlier runs.

Rolling back an installed plugin or tool graph means selecting a previously prepared and authorized graph through the control boundary. It does not mean letting an RSS program read an arbitrary path, install code, or grant itself capabilities. Graph management can evolve that extension plane while Rust continues to enforce the same authority and durable-state rules.

The gateway agent program does not yet have the same durable pin. For file-selected agents, compilation proves the shape and consistency of the tree observed when the worker starts, while native authority still decides what the resulting program may do. Operators can replace the file to change later executions, but the runtime cannot currently claim an admission-bound source rollback for runs already accepted.

## Current Tradeoffs and Limits

The design intentionally pays costs for explicit boundaries:

- **Gateway file source is not durably pinned.** A file-selected agent is resolved and compiled when its worker starts. Pinning that source identity at admission would close the acceptance-to-execution window, but the current implementation does not yet do so.
- **Cold compilation exists.** A newly selected file-backed agent may incur compile work when its worker starts, while a fresh plugin/tool graph may incur preparation before admission. Caching and shared immutable preparation can amortize both paths, but a cold path is still visible.
- **Tool dispatch is serial.** The current coding loop runs one tool at a time. Parallel tool calls and subagent fan-out are not implemented.
- **One process owns one SQLite state file.** The durable store uses a single worker/connection model; multiple gateway processes sharing one state file are unsupported and can contend on SQLite's writer slot.
- **There is no durable scheduler.** Job records and management surfaces do not imply scheduled execution. A persistent scheduler is not implemented.
- **The project is pre-v1.** Contracts and operational surfaces can still change, and source status should not be read as a promise about every provider or deployment.
- **Rollback is bounded by ownership.** Runtime-owned prepared state can be abandoned or reclaimed. Arbitrary external effects cannot be reversed without cooperation from the external system.

These limits are easier to reason about because they are stated at protocol boundaries. "Serial tools" is a scheduler limitation. "One state file per process" is a storage ownership limitation. Neither is hidden behind model behavior.

## The Core Idea

An agent runtime is not a loop that sends text to a model until the model stops. It is a transaction protocol that happens to include model calls.

RustScript Agent keeps evolving decisions in RSS and keeps durable authority in Rust. Typed host contracts make absence and failure explicit. Immutable admission pins authority and installed plugin/tool graphs; file-backed gateway policy is resolved later and remains a documented source-pinning limit. Prepared effects pass through review before settlement. Managed branches separate private work from publication. Durable events, cursors, restart repair, and child ownership preserve the same boundaries across disconnects and process lifetimes.

That protocol is the product's core: model output proposes transitions; the runtime decides which transitions are authorized, durable, replayable, and recoverable.

## Related

- [RustScript Agent repository](https://github.com/rustscript-lang/rustscript-agent)
- [RustScript Agent](https://agent.rustscript.org/)
- [RustScript core documentation](/docs/reference/rustscript/)
- [Host Function ABI](../v06-host-function-abi/)
- [Async Suspension Without Coroutines](../v05-async-suspension/)
