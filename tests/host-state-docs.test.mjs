import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const docsRoot = new URL("../content/docs/", import.meta.url);

async function collectMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) return collectMarkdown(url);
    if (!entry.name.endsWith(".md")) return [];
    return [[url.pathname, await readFile(url, "utf8")]];
  }));
  return files.flat();
}

test("host-state docs describe per-VM lifecycle and reject stale initializer claims", async () => {
  const files = await collectMarkdown(docsRoot);
  const hostStateFiles = files.filter(([, text]) => (
    /HostState|host-private state|hidden host state|RegexCache/i.test(text)
  ));
  assert.ok(hostStateFiles.length >= 3, "host-state claims must appear on multiple docs pages");

  for (const [path, text] of hostStateFiles) {
    assert.doesNotMatch(text, /per[- ]scope/i, `${path} still claims per-scope host state`);
    assert.doesNotMatch(text, /required initializer/i, `${path} still claims a required initializer`);
    assert.doesNotMatch(text, /required or lazy default/i, `${path} still claims wrappers carry initializers`);
    assert.doesNotMatch(text, /both carry a lifecycle/i, `${path} still claims wrappers carry a lifecycle`);
  }

  const hostFunctions = await readFile(new URL("reference/host-functions.md", docsRoot), "utf8");
  const terminology = await readFile(new URL("terminology.md", docsRoot), "utf8");
  const vmApi = await readFile(new URL("reference/rustscript/vm-api.md", docsRoot), "utf8");

  assert.match(hostFunctions, /Per-VM dependencies that guests must never see/);
  assert.match(hostFunctions, /HostState::initialize\(\)/);
  assert.match(hostFunctions, /HostContext::set_host_state/);
  assert.match(hostFunctions, /do not count toward guest arity/);
  assert.match(hostFunctions, /catalog fingerprint/);
  assert.match(hostFunctions, /never appear in the schema, catalog fingerprint, or VMBC/);
  assert.match(hostFunctions, /survives `Vm::reset_for_reuse`/);
  assert.match(hostFunctions, /drops with the VM/);
  assert.match(hostFunctions, /borrow guard/);
  assert.match(hostFunctions, /do not carry a lifecycle or initializer/);
  assert.doesNotMatch(hostFunctions, /the only fingerprint input/);
  assert.match(hostFunctions, /resource declarations/);
  assert.match(hostFunctions, /feed the catalog fingerprint/);
  assert.match(hostFunctions, /deny-by-default/);
  assert.match(hostFunctions, /HostFunctionRegistry::restricted/);

  assert.match(terminology, /Per-VM host-private state/);
  assert.match(terminology, /guest arity/);
  assert.match(terminology, /catalog fingerprint/);
  assert.match(terminology, /VMBC/);
  assert.match(terminology, /reset_for_reuse/);
  assert.match(terminology, /drops with the VM/);

  assert.match(vmApi, /hidden per-VM host state/);
  assert.match(vmApi, /RegexCacheVmExt/);
  assert.match(vmApi, /survives `Vm::reset_for_reuse`/);
  assert.match(vmApi, /never appears in guest arity, schema, catalog fingerprint, or VMBC/);
});
