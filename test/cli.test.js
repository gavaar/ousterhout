import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = join(root, "bin/ousterhout.js");
const assets = [
  ["SKILL.md", "skills/ousterhout/SKILL.md"],
  ["LICENSE", "skills/ousterhout/LICENSE"],
  ["references/principles.md", "skills/ousterhout/references/principles.md"],
  ["references/scope.md", "skills/ousterhout/references/scope.md"],
  ["references/sources.md", "skills/ousterhout/references/sources.md"],
  ["commands/ousterhout.md", "commands/ousterhout.md"],
];

function sandbox(t) {
  const directory = mkdtempSync(join(tmpdir(), "ousterhout-cli-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const config = join(directory, "config with spaces");
  function run(entrypoint, args, environment = {}) {
    return spawnSync(process.execPath, [entrypoint, ...args], {
      cwd: directory,
      env: { ...process.env, HOME: directory, XDG_CONFIG_HOME: config, ...environment },
      encoding: "utf8",
    });
  }
  return {
    directory,
    config,
    run(...args) {
      return run(cli, args);
    },
    runRelease(release, ...args) {
      return run(join(release, "bin/ousterhout.js"), args);
    },
    runWithEnv(environment, ...args) {
      return run(cli, args, environment);
    },
  };
}

function updatedRelease(fixture) {
  const release = join(fixture.directory, "new release");
  mkdirSync(release);
  for (const name of ["bin", "package.json", "SKILL.md", "LICENSE", "references", "commands"]) {
    cpSync(join(root, name), join(release, name), { recursive: true });
  }
  writeFileSync(join(release, "SKILL.md"), "Updated upstream skill\n");
  const metadata = JSON.parse(readFileSync(join(release, "package.json"), "utf8"));
  metadata.version = "0.2.0";
  writeFileSync(join(release, "package.json"), JSON.stringify(metadata));
  return release;
}

test("install makes the complete skill and slash command available globally from any working directory", (t) => {
  const fixture = sandbox(t);
  const result = fixture.run("install");
  assert.equal(result.status, 0, result.stderr);
  for (const [source, destination] of assets) {
    assert.equal(
      readFileSync(join(fixture.config, "opencode", destination), "utf8"),
      readFileSync(join(root, source), "utf8"),
      destination,
    );
  }
  assert.match(result.stdout, /\/ousterhout --help/);
});

test("reinstall succeeds without removing personal files or changing other OpenCode configuration", (t) => {
  const fixture = sandbox(t);
  assert.equal(fixture.run("install").status, 0);
  const notes = join(fixture.config, "opencode/skills/ousterhout/my-notes.md");
  const config = join(fixture.config, "opencode/opencode.jsonc");
  writeFileSync(notes, "Personal review notes\n");
  writeFileSync(config, '{ "model": "my-model" }\n');

  const result = fixture.run("install");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(notes, "utf8"), "Personal review notes\n");
  assert.equal(readFileSync(config, "utf8"), '{ "model": "my-model" }\n');
});

test("rerunning install from a new release updates previously installed, unedited files", (t) => {
  const fixture = sandbox(t);
  assert.equal(fixture.run("install").status, 0);
  const release = updatedRelease(fixture);

  const result = fixture.runRelease(release, "install");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readFileSync(join(fixture.config, "opencode/skills/ousterhout/SKILL.md"), "utf8"),
    "Updated upstream skill\n",
  );
});

test("init is an alias for install", (t) => {
  const fixture = sandbox(t);
  const result = fixture.run("init");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readFileSync(join(fixture.config, "opencode/commands/ousterhout.md"), "utf8"),
    readFileSync(join(root, "commands/ousterhout.md"), "utf8"),
  );
});

test("help and a bare invocation explain installation without writing configuration", (t) => {
  const fixture = sandbox(t);
  for (const args of [[], ["--help"], ["-h"]]) {
    const result = fixture.run(...args);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /bunx @gavaar\/ousterhout@latest install/);
    assert.match(result.stdout, /init/);
    assert.equal(existsSync(fixture.config), false);
  }
});

test("install rejects relative XDG_CONFIG_HOME rather than installing inside the current project", (t) => {
  const fixture = sandbox(t);
  const result = fixture.runWithEnv({ XDG_CONFIG_HOME: "relative-config" }, "install");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /XDG_CONFIG_HOME.*absolute/i);
  assert.equal(existsSync(join(fixture.directory, "relative-config")), false);
});

test("an update refuses linked destination files instead of changing files outside the installation", (t) => {
  const fixture = sandbox(t);
  assert.equal(fixture.run("install").status, 0);
  const installed = join(fixture.config, "opencode/skills/ousterhout/SKILL.md");
  const external = join(fixture.directory, "external-skill.md");
  const original = readFileSync(installed, "utf8");
  writeFileSync(external, original);
  rmSync(installed);
  symlinkSync(external, installed);

  const result = fixture.runRelease(updatedRelease(fixture), "install");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /symbolic link/i);
  assert.equal(readFileSync(external, "utf8"), original);
});

test("an update refuses hard-linked backups before changing any installed asset", (t) => {
  const fixture = sandbox(t);
  assert.equal(fixture.run("install").status, 0);
  const command = join(fixture.config, "opencode/commands/ousterhout.md");
  const skill = join(fixture.config, "opencode/skills/ousterhout/SKILL.md");
  const backup = join(fixture.directory, "hard-linked-command-backup.md");
  const originalCommand = readFileSync(command, "utf8");
  const originalSkill = readFileSync(skill, "utf8");
  linkSync(command, backup);
  const release = updatedRelease(fixture);
  writeFileSync(join(release, "commands/ousterhout.md"), "Updated upstream command\n");

  const result = fixture.runRelease(release, "install");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /hard link/i);
  assert.equal(readFileSync(backup, "utf8"), originalCommand);
  assert.equal(readFileSync(command, "utf8"), originalCommand);
  assert.equal(readFileSync(skill, "utf8"), originalSkill);
});

test("an update preserves local edits and stops before changing any other installed asset", (t) => {
  const fixture = sandbox(t);
  assert.equal(fixture.run("install").status, 0);
  const command = join(fixture.config, "opencode/commands/ousterhout.md");
  const skill = join(fixture.config, "opencode/skills/ousterhout/SKILL.md");
  const original = readFileSync(skill, "utf8");
  writeFileSync(command, "My customized command\n");

  const result = fixture.runRelease(updatedRelease(fixture), "install");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /locally edited/);
  assert.equal(readFileSync(command, "utf8"), "My customized command\n");
  assert.equal(readFileSync(skill, "utf8"), original);
});

test("first install preserves an unrelated same-name command without leaving a partial skill installation", (t) => {
  const fixture = sandbox(t);
  const command = join(fixture.config, "opencode/commands/ousterhout.md");
  mkdirSync(join(fixture.config, "opencode/commands"), { recursive: true });
  writeFileSync(command, "An unrelated command\n");

  const result = fixture.run("install");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /unrelated/);
  assert.equal(readFileSync(command, "utf8"), "An unrelated command\n");
  assert.equal(existsSync(join(fixture.config, "opencode/skills")), false);
});

test("install adopts an identical manual copy so future releases can update it safely", (t) => {
  const fixture = sandbox(t);
  for (const [source, destination] of assets) {
    const target = join(fixture.config, "opencode", destination);
    mkdirSync(join(target, ".."), { recursive: true });
    cpSync(join(root, source), target);
  }

  const installed = fixture.run("install");
  assert.equal(installed.status, 0, installed.stderr);
  const updated = fixture.runRelease(updatedRelease(fixture), "install");
  assert.equal(updated.status, 0, updated.stderr);
  assert.equal(
    readFileSync(join(fixture.config, "opencode/skills/ousterhout/SKILL.md"), "utf8"),
    "Updated upstream skill\n",
  );
});

test("install defaults to the user's .config directory when XDG_CONFIG_HOME is empty", (t) => {
  const fixture = sandbox(t);
  const result = fixture.runWithEnv({ XDG_CONFIG_HOME: "" }, "install");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readFileSync(join(fixture.directory, ".config/opencode/commands/ousterhout.md"), "utf8"),
    readFileSync(join(root, "commands/ousterhout.md"), "utf8"),
  );
  assert.equal(existsSync(fixture.config), false);
});

test("unsupported commands and flags fail without writing configuration", (t) => {
  const fixture = sandbox(t);
  for (const args of [["publish"], ["install/init"], ["install", "--force"]]) {
    const result = fixture.run(...args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
    assert.equal(existsSync(fixture.config), false);
  }
});
