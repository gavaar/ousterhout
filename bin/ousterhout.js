#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const metadata = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
const usage = `Install the Ousterhout skill and /ousterhout command globally for OpenCode.

Usage: bunx @gavaar/ousterhout@latest install
       ousterhout init      Alias for install
       ousterhout --help    Show this help

Rerun install to update. Unrelated and locally edited files are preserved.
Uses XDG_CONFIG_HOME, or ~/.config when unset. No OpenCode config edits.`;

function fingerprint(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

// In-place writes through a hard link would also change its backups.
function assertUnlinked(path, boundary) {
  for (let current = path; current !== boundary; current = dirname(current)) {
    let info;
    try {
      info = lstatSync(current);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (info?.isSymbolicLink()) {
      throw new Error(`Refusing symbolic link destination: ${current}`);
    }
    if (info?.isFile() && info.nlink > 1) {
      throw new Error(`Refusing hard link destination: ${current}`);
    }
  }
}

function install() {
  const configuredHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  if (!isAbsolute(configuredHome)) {
    throw new Error("XDG_CONFIG_HOME must be an absolute path.");
  }
  const configHome = resolve(configuredHome);
  const target = join(configHome, "opencode");
  const receiptPath = join(target, "skills/ousterhout/.ousterhout-install.json");
  assertUnlinked(receiptPath, configHome);
  const previous = existsSync(receiptPath)
    ? JSON.parse(readFileSync(receiptPath, "utf8"))
    : null;
  if (previous && (previous.format !== 1 || previous.package !== metadata.name || !previous.files)) {
    throw new Error(`Unrecognized installation record: ${receiptPath}`);
  }
  const files = [
    ...["SKILL.md", "LICENSE"].map((source) => [source, join("skills/ousterhout", source)]),
    ...readdirSync(join(packageRoot, "references")).map((name) => [
      join("references", name),
      join("skills/ousterhout/references", name),
    ]),
    ["commands/ousterhout.md", "commands/ousterhout.md"],
  ].map(([source, destination]) => {
    const path = join(target, destination);
    assertUnlinked(path, configHome);
    const contents = readFileSync(join(packageRoot, source));
    const current = existsSync(path) ? readFileSync(path) : null;
    return { destination, path, contents, current, hash: fingerprint(contents) };
  });

  const conflicts = files.filter((file) => file.current
    && !file.current.equals(file.contents)
    && fingerprint(file.current) !== previous?.files[file.destination]);
  if (conflicts.length) {
    throw new Error(`Refusing to overwrite unrelated or locally edited files:\n${conflicts.map((file) => file.path).join("\n")}\nBack up or move these files, then retry. No files were changed.`);
  }

  for (const file of files) {
    if (file.current?.equals(file.contents)) continue;
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.contents, { flag: file.current ? "w" : "wx" });
  }
  writeFileSync(receiptPath, `${JSON.stringify({
    format: 1,
    package: metadata.name,
    version: metadata.version,
    files: Object.fromEntries(files.map((file) => [file.destination, file.hash])),
  }, null, 2)}\n`);
  console.log(`Installed ousterhout in ${target}.\nIn OpenCode, run /ousterhout --help`);
}

try {
  const args = process.argv.slice(2);
  if (args.length === 0 || (args.length === 1 && ["--help", "-h"].includes(args[0]))) {
    console.log(usage);
  } else if (args.length === 1 && ["install", "init"].includes(args[0])) {
    install();
  } else {
    throw new Error(`Unknown arguments.\n${usage}`);
  }
} catch (error) {
  console.error(`ousterhout: ${error.message}`);
  process.exitCode = 1;
}
