// Portability guard (part of `pnpm lint`): the repository must not contain host-, user- or operator-specific
// data (machine names, home paths, local scheduler jobs, device serials) or references to a specific agent setup.
// Anyone must be able to clone the repo and work with it. Policy: AGENTS.md (Hard rules).
import { execFileSync } from "node:child_process";

/** Leading word boundary that works in both POSIX ERE (`git grep -E`) and JavaScript regular expressions. */
const START = "(^|[^a-z0-9])";

/**
 * Case-insensitive extended regular expressions, checked with `git grep` over tracked files. `hits` and `misses`
 * are injected samples verified on every run (self-test), so a broken pattern fails loudly instead of passing.
 */
const PATTERNS = [
  {
    label: "host name",
    pattern: "aliclaw|trawowa|mac[ -]?studio",
    hits: ["built on the Mac Studio", "MacStudio", "mac-studio"],
    misses: ["open it in Android Studio"],
  },
  {
    label: "absolute home or temp path",
    pattern: "/Users/[A-Za-z]|/home/[a-z_][a-z0-9_-]*/|/private/tmp/",
    hits: ["/Users/bob/projects", "/home/alice/projects", "/private/tmp/wt"],
    misses: ["see docs/home.md", "/home/"],
  },
  {
    label: "local scheduler job",
    pattern: String.raw`launchd|LaunchAgents|com\.aliclaw\.`,
    hits: ["a launchd job", "~/Library/LaunchAgents/x.plist"],
    misses: ["bundle id com.budgetlens.offline"],
  },
  {
    label: "local tooling path",
    pattern: String.raw`\.bl-(local|t3-client)|bl-watch`,
    hits: ["~/.bl-local/state", "bl-watch.sh"],
    misses: [],
  },
  {
    label: "device serial or local AVD",
    pattern: "emulator-[0-9]{4}|Pixel_[0-9]",
    hits: ["adb -s emulator-5556", "Pixel_10a"],
    misses: ["adb -s <emulator-serial>"],
  },
  {
    label: "agent setup",
    pattern:
      "grok ?bot|t3 code|machineId|bl (developer|reviewer|designer|orchestrator|tester)|paperclip",
    hits: ["Grok Bot", "T3 Code", "machineId", "BL Developer", "Paperclip"],
    misses: ["Hermes engine", "agent-device", "agent.act()"],
  },
  {
    label: "team role",
    pattern: `${START}(orchestrator|orkiestrator|product owner|developer bot)`,
    hits: [
      "Orchestrator decision",
      "the orkiestrator",
      "Product Owner review",
      "the Developer bot",
    ],
    misses: ["a reviewer squash-merges", "developer build", "web developers"],
  },
];

/** GitHub configuration may name `agent:*` labels; everything else may not. */
const LABEL = {
  label: "agent label",
  pattern: "agent:[a-z]",
  hits: ["`agent:tester`"],
  misses: ["`agent.act()`", "agent-device"],
};

const ALWAYS_EXCLUDED = [
  ":(exclude)scripts/check-machine-agnostic.mjs",
  ":(exclude)pnpm-lock.yaml",
];

/** Samples whose match result differs from `expected`, as readable failure lines. */
function mismatches({ label, pattern }, samples, expected) {
  const regex = new RegExp(pattern, "i");
  return samples
    .filter((sample) => regex.test(sample) !== expected)
    .map(
      (sample) =>
        `${label}: ${expected ? "expected a hit" : "unexpected hit"} for ${JSON.stringify(sample)}`,
    );
}

function selfTest() {
  return [...PATTERNS, LABEL].flatMap((entry) => [
    ...mismatches(entry, entry.hits, true),
    ...mismatches(entry, entry.misses, false),
  ]);
}

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

const selfTestFailures = selfTest();
if (selfTestFailures.length > 0) {
  process.stderr.write(`Portability check self-test failed:\n${selfTestFailures.join("\n")}\n`);
  process.exit(1);
}

const findings = [];
for (const { label, pattern } of PATTERNS) {
  for (const line of grep(pattern, []).split("\n").filter(Boolean)) {
    findings.push(`${label}: ${line}`);
  }
}
for (const line of grep(LABEL.pattern, [":(exclude).github/**"]).split("\n").filter(Boolean)) {
  findings.push(`${LABEL.label}: ${line}`);
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
