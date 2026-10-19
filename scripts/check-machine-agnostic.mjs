// Portability guard (part of `pnpm lint`): the repository must not contain host-, user- or operator-specific
// data (machine names, home paths, local scheduler jobs, device serials) or references to a specific agent setup.
// Anyone must be able to clone the repo and work with it. Policy: AGENTS.md (Hard rules).
import { execFileSync } from "node:child_process";

/** Case-insensitive extended regular expressions, checked with `git grep` over tracked files. */
const PATTERNS = [
  ["host name", "aliclaw|trawowa|mac[ -]?studio"],
  ["absolute home or temp path", "/Users/[A-Za-z]|/private/tmp/"],
  ["local scheduler job", String.raw`launchd|LaunchAgents|com\.aliclaw\.`],
  ["local tooling path", String.raw`\.bl-(local|t3-client)|bl-watch`],
  ["device serial or local AVD", "emulator-[0-9]{4}|Pixel_[0-9]"],
  [
    "agent setup",
    "grok ?bot|t3 code|machineId|bl (developer|reviewer|designer|orchestrator|tester)",
  ],
];

/** GitHub configuration may name `agent:*` labels; everything else may not. */
const LABEL_PATTERN = ["agent label", "agent:[a-z]"];

const ALWAYS_EXCLUDED = [
  ":(exclude)scripts/check-machine-agnostic.mjs",
  ":(exclude)pnpm-lock.yaml",
];

// Temporary: PR #169 (issue #147) owns these files and is making them portable; drop the entries when it lands.
const PENDING = [":(exclude)scripts/agents/**", ":(exclude)docs/agents.md"];

function grep(pattern, extraExcludes) {
  try {
    return execFileSync(
      "git",
      [
        "grep",
        "-n",
        "-I",
        "-i",
        "-E",
        "-e",
        pattern,
        "--",
        ".",
        ...ALWAYS_EXCLUDED,
        ...PENDING,
        ...extraExcludes,
      ],
      { encoding: "utf8" },
    );
  } catch (error) {
    // `git grep` exits 1 when nothing matches.
    if (error.status === 1) {
      return "";
    }
    throw error;
  }
}

const findings = [];
for (const [label, pattern] of PATTERNS) {
  for (const line of grep(pattern, []).split("\n").filter(Boolean)) {
    findings.push(`${label}: ${line}`);
  }
}
for (const line of grep(LABEL_PATTERN[1], [":(exclude).github/**"]).split("\n").filter(Boolean)) {
  findings.push(`${LABEL_PATTERN[0]}: ${line}`);
}

if (findings.length > 0) {
  process.stderr.write(
    `Machine- or operator-specific content found (see AGENTS.md, Hard rules):\n${findings.join("\n")}\n`,
  );
  process.exit(1);
}
process.stdout.write(
  "Portability check passed: no host-, user- or agent-setup-specific content.\n",
);
