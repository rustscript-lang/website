# Beyond the Agent Sandbox: Typed Contracts, Recoverable Effects, and Versioned Tool Graphs

*How RustScript Agent governs authority, durable outcomes, and tool evolution around model calls*

---

A sandbox can keep generated code inside a process, container, or virtual machine. That boundary matters, but it does not answer the questions an agent runtime faces after a model proposes an action: Which tool contract is in force? What authority does this run hold? Did the action commit before a disconnect? Which tool version must replay use? When does private work become public?

[RustScript Agent](https://github.com/rustscript-lang/rustscript-agent) adds that runtime layer. RustScript (`.rss`) expresses typed, evolving policy. Rust owns authority, durable state, resources, and commit boundaries. The model proposes actions; the host decides what those actions mean, whether they are allowed, and how their outcomes survive interruption.

This article describes the current pre-v1 design. The interfaces may evolve, but the boundaries are concrete enough to inspect today. See the [RustScript Agent landing page](https://agent.rustscript.org/), the [repository](https://github.com/rustscript-lang/rustscript-agent), and the [RustScript core documentation](/docs/reference/rustscript/) for the surrounding projects.

## What a Process Sandbox Solves—and What It Leaves Open

Infrastructure isolation and runtime governance solve different problems. RustScript Agent complements an OS sandbox; it does not replace one.

| Boundary | What it controls | What remains for the agent runtime |
| --- | --- | --- |
| OS policy | Filesystem, process, and network access for a command and its children | Tool identity, call ownership, approvals, durable results, and replay |
| Sandboxed container | System-call, resource, and network isolation around a workload | Per-run authority, private work, publication, and effect settlement |
| MicroVM | A separate kernel plus snapshot, resume, or fork of an execution environment | Typed call meaning, receipts, tool-version pins, and state-compatible rollback |
| RustScript Agent | Typed calls, admitted authority, managed effects, receipts, run pins, and recovery | It still relies on deployment isolation for kernel and tenant boundaries |

File-path confinement and managed-process confinement are separate. File tools resolve paths beneath the admitted workspace. Managed process confinement binds handles to a token-scoped owner and constrains the working directory and environment supplied at spawn. A spawned process is not chrooted: its host path and network access still depend on OS, container, or other deployment policy.

The missing layer is a protocol. It must bind a model proposal to one run, one authority snapshot, one tool graph, and one durable outcome without letting generated text become a permission proof.

## Why RustScript: Typed Contracts at the Host Boundary

RustScript is useful here because the language runtime and the native host meet at an explicit contract rather than an untyped tool map.

Three properties matter:

1. **Typed contracts.** Type metadata, resource ownership, and the Host ABI describe a call before execution. Named host records fix field names and nested shapes. `Unit`, `Option<T>`, and `Result<T, E>` keep no-value, absence, success, and failure distinct instead of inferring them from nulls or ad hoc objects.
2. **Host-controlled I/O.** RSS can select policy and compose a turn, but Rust holds filesystem, process, network, credential, workspace, and plugin-control authority. Opaque native resources are rebound to the admitted owner; guest state cannot mint a capability.
3. **Controlled execution.** Fuel, deadlines, cancellation, and suspend/resume boundaries let the host schedule long work without surrendering lifecycle control.

That produces a deliberate split:

| RustScript policy owns | Rust host owns |
| --- | --- |
| Agent loop, provider adaptation, prompt shaping, tool routing, and Guardian decisions | Admission, capacity, deadlines, cancellation, capability issuance, confinement, durable commit, and restart repair |
| Declarative plugin manifests and state migration programs | Package capture, graph validation, migration execution rules, root updates, and activation authority |
| `allow`, `deny`, or `needs_user` for the prepared action | The exact action preview, one-time approval handoff, opaque execution token, and durable receipt |

Typed contracts make incompatible source fail during compilation or binding instead of changing an authority decision through a missing field. The native side remains the final authority even when RSS recommends the next transition. The [Host Function ABI](../v06-host-function-abi/) explains the lower-level bridge, and [Async Suspension Without Coroutines](../v05-async-suspension/) describes the execution boundary.

## The Effect Sandbox: From Proposal to Receipt

Every tool request enters a call context that identifies the run, attempt, workspace, graph pin, deadline, and idempotency identity. The effect path then follows a compact chain:

**Contract → Grant → Token → Receipt**

| Stage | Runtime question | Durable or native result |
| --- | --- | --- |
| Contract | What typed action did the model propose? | Canonical tool name, arguments, risk, and expected workspace head |
| Grant | Does policy allow this exact action under the admitted authority? | `allow`, `deny`, or a durable `needs_user` handoff |
| Token | Which native operation may execute, for which owner and generation? | An opaque, scoped, revocable execution token |
| Receipt | What outcome committed for this attempt? | Canonical result, effect record, events, and managed head decision |

Preparation validates the frozen registry, owner, graph pin, arguments, cancellation state, and workspace head. Guardian reviews a bounded preview. An allowed action executes through the token-scoped host; RSS never receives raw native authority. Commit persists the canonical result and effect records before live publication.

A malformed review fails closed. `needs_user` suspends this call behind one durable approval; resolving it does not grant wider authority or authorize another attempt.

This is an effect sandbox because the runtime governs the meaning and settlement of actions, not because it claims to emulate a kernel. It can abandon private runtime-owned state when non-commit is proven. If an outcome is indeterminate, it keeps the owner or fence for reconciliation instead of guessing that the action failed.

## One File Write, Fully Accounted For

Consider one concrete action:

`write_file("race.txt", "first")`

In managed workspace mode, the write does not mutate the shared source directory directly.

| Phase | Private managed state | Published state | Durable evidence |
| --- | --- | --- | --- |
| 1. Write | The run writes `race.txt = first` into its private managed view from head H0 | The published pointer still names H0 | The prepared call is bound to the run, attempt, branch, and expected H0 |
| 2. Prepare | The writer closes and freezes candidate tree H1 plus the canonical tool result | Still H0 | Candidate identity, result, token owner, and expected head are ready for commit |
| 3. Commit | H1 becomes the branch head if the expected head and version still match | Publication is unchanged unless trusted policy requires it in the same terminal transition | Receipt, new branch head, result message, and events commit together |
| 4. Read back | The runtime reads the durable decision before reporting success | The visible publication pointer is whatever its own authorized transition selected | A lost acknowledgement can replay the stored result without running the write again |

Private durability and public visibility are separate. A run may finish with H1 staged for inspection. Publication requires native workspace authority, the branch identity, an expected head, and a publication permit. Retrying the same publication request returns its recorded receipt; it does not create ambient permission to copy bytes elsewhere.

### When Two Runs Start From H0

Suppose Run A and Run B both capture H0. A prepares `race.txt = first`; B prepares `race.txt = second`.

| Transition | Expected head | Decision | What remains readable |
| --- | --- | --- | --- |
| Run A commits first | H0 | Committed; branch head advances to H1 | A's committed H1 with `first` |
| Run B tries to commit | H0, but the branch is now H1 | `effect_head_conflict` | B's candidate containing `second` is retained for inspection or later management |

The compare-and-swap rule prevents a stale writer from silently replacing a newer head. One result commits and one conflicts; both candidates remain identifiable. Repeating Run A's completed attempt reads its receipt and canonical result rather than performing the filesystem mutation again.

Restore is also explicit. A checkpoint captures a frozen managed tree and history prefix, a captured tool-graph reference, public execution config, and the supported plugin-state roots. External high-water and boundary facts remain separate; the history prefix does not claim to settle or rewind those external systems. Restore creates a new branch and run, issues fresh native authority, and uses the checkpoint-selected graph and config. It does not rewind audit history, revive old handles, or resume an old process.

## Tool Graphs That Evolve Without Rewriting Live Runs

Tools are installed as closed, immutable graphs: captured package revisions, dependency and delegation edges, effect closure, entry points, Host ABI expectations, and compiler/runtime environment. Evolution follows **Candidate → Validate → Activate**.

Validation compiles the graph, checks its closed dependencies and ABI, and compares authority-relevant metadata. `PermissionDiff` reports additions, scope changes, and recovery downgrades that require review. It is review data only: neither `requires_reapproval = false` nor `requires_reapproval = true` authorizes activation. The trusted management boundary must still validate the expected generation and host-side install authority.

State migration has the same shape. A package may declare a bounded pure migration program with no direct or delegated effects. The native host evaluates it against the old schema, stores a new immutable state object, and advances the revisioned root through the managed transition. State migration is a compatibility and management operation, not a path for guest code to self-authorize I/O or replace another live run's state.

Run pins make activation predictable:

| Moment | Active generation for new runs | Existing pins |
| --- | --- | --- |
| Start | generation g → Graph A | Run α captures A |
| Validate Graph B | still g → A | Run α remains on A |
| Activate B | generation g + 1 → Graph B | Run α remains on A; new Run β captures B |
| Roll back to retained A | generation g + 2 → Graph A | Run α stays on A, Run β stays on B; new Run γ captures A |

Rollback selects a retained, authorized graph and activates it as a new generation for future admissions. The generation never moves backward, and existing runs are never rewritten. Replay consults the original run pin instead of whichever graph is active now.

## Recovery and Publication Are Separate Boundaries

Durability gives recovery facts, not magical exactly-once delivery. Events have stable identities and per-run sequence numbers, while subscribers may receive a durable event more than once after reconnecting. Completed provider steps and committed tool results replay from durable records without issuing the underlying work again. Retry-safe pending provider work may retry; unsafe or effectful unknown work becomes a typed interruption.

A live worker can temporarily hold a completed run in observable `terminal_pending` state and retry the exact terminal commit for a bounded window. That retry payload and bookkeeping are process-local. **Restart repair reconciles durable state rather than resuming the process-local terminal retry.** A graceful live stop or shutdown can revoke owned process-local capability tokens and reap owned child processes while their maps and tables still exist. After process termination, the token maps and process tables are gone. Startup repairs durable run records and effect records; it does not guarantee termination of surviving external processes.

Publication remains its own authorized operation. Managed writes target a private branch; a publication transition advances the visible managed pointer through an expected-head check. Before publication, rollback can abandon private runtime-owned state. After publication, changing the visible head is a new authorized history event, not a hidden filesystem undo.

The boundary ends where ownership ends. **Arbitrary external effects cannot be reversed** without cooperation from the external system. Remote APIs and processes outside the managed tree need their own idempotency, compensation, or reconciliation contracts; the runtime records them as outside-tree rather than promising universal rollback.

## Current Tradeoffs and Limits

The project is pre-v1, and the current source has explicit limits:

- **Gateway file-selected agent source is not durably pinned.** The worker resolves and compiles a file-backed entry after durable admission, potentially after `202 Accepted`. Digest checks prevent a mixed source tree within one compile, but an edit before worker execution can change which agent program runs. Installed plugin/tool graph pins do not close this separate source-selection gap.
- **Restart repair does not resume process-local retry state.** It repairs and reconciles durable records after the original in-memory terminal retry loop has disappeared.
- **Tool dispatch is serial.** The coding loop executes one tool at a time; parallel tool calls and subagent fan-out are not implemented.
- **One process owns one SQLite state file.** The store uses one serialized worker/connection model, and multiple gateway processes sharing a file are unsupported.
- **There is no durable scheduler.** Job records and management routes exist, but scheduled execution does not.
- **Cold compilation remains visible.** A newly selected file-backed agent can compile when its worker starts, and a fresh plugin/tool graph can require preparation before admission.
- **Rollback is ownership-bounded.** Arbitrary external effects cannot be reversed by restoring a managed file tree; external systems must expose their own recovery semantics.
- **Application confinement still needs deployment isolation.** The runtime narrows host calls and child ownership, while OS policy, containers, or MicroVMs continue to provide kernel and tenant boundaries.

These limits are easier to reason about when each is attached to a boundary: source selection, process memory, scheduling, storage ownership, external settlement, or infrastructure isolation.

## The Core Claim

An agent runtime is more than a loop that sends text to a model until the model stops.

RustScript Agent makes the model a proposer inside a governed protocol. Typed contracts define the action. The Effect Sandbox binds it to admitted authority and a durable outcome. The Tool Graph pins the implementation and lets future runs move to a validated generation without rewriting live ones. Private managed state, publication, replay, repair, and restore keep those decisions explicit across failures.

The core claim is compact: **the model proposes actions; the runtime governs their typed authority, durable outcome, and versioned implementation.**

## Related

- [RustScript Agent landing page](https://agent.rustscript.org/)
- [RustScript Agent repository](https://github.com/rustscript-lang/rustscript-agent)
- [RustScript core documentation](/docs/reference/rustscript/)
- [Host Function ABI](../v06-host-function-abi/)
- [Async Suspension Without Coroutines](../v05-async-suspension/)
