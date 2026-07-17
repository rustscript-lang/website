# pd-controller reference

## Service scope

pd-controller is the control plane for pd-edge. It accepts edge polling and result callbacks, schedules bytecode for named edges, stores state, exposes status and result queries, and coordinates remote debugging.

## Edge and program management

An edge identifies itself to the controller, polls for work, receives a program artifact, applies it, and reports results. Program management includes queued bytecode, edge-targeted delivery, and result inspection. The service guide documents the RPC boundary used for those operations.

## Debugging and operations

The controller exposes administrative command queues, health and metrics endpoints, persisted state, remote debug sessions, recordings, and a Web UI. The Web UI provides operational views and debug-session controls. Docker packaging and an end-to-end integration test cover service deployment and edge-controller interaction.

## Source

pd-controller README: `Cargo usage`, `Test`, `Service guide`, `Edge overview`, `Program management`, `Debugger`, `Run`, `Docker image`, `Example: enqueue bytecode for edge edge-1`, `End-to-end integration test`, `Web UI`, and `Debug sessions in Web UI`, revision `a8ac5405db30822199d6ccfff44afebf14d27602`.
