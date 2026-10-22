// Portability guard (part of `pnpm lint`): the repository must not contain host-, user- or operator-specific
// data (machine names, home paths, local scheduler jobs, device serials) or references to a specific agent setup.
// Anyone must be able to clone the repo and work with it. Policy: AGENTS.md (Hard rules).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** Leading word boundary that works in both POSIX ERE (`git grep -E`) and JavaScript regular expressions. */
const START = "(^|[^a-z0-9])";

/**
 * Case-insensitive extended regular expressions, checked with `git grep` over tracked files. `hits` and `misses`
 * are injected samples verified on every run (self-test), so a broken pattern fails loudly instead of passing.
 * Only generic shapes live here; names tied to one specific setup are private terms (see below).
 */
const PATTERNS = [
  {
    label: "absolute home or temp path",
    pattern: "/Users/[A-Za-z]|/home/[a-z_][a-z0-9_-]*/|/private/tmp/",
    hits: [
      ["", "Users", "someone", "projects"].join("/"),
      "/home/alice/projects",
      "/private/tmp/wt",
    ],
    misses: ["see docs/home.md", "/home/"],
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
    pattern: "t3 code",
    hits: ["T3 Code"],
    misses: ["Hermes engine", "agent-device", "agent.act()"],
  },
  {
    label: "team role",
    pattern: `${START}(orchestrator|product owner|developer bot)`,
    hits: ["Orchestrator decision", "Product Owner review", "the Developer bot"],
    misses: ["a reviewer squash-merges", "developer build", "web developers"],
  },
];

/**
 * Private terms (host, user and tool names of one specific setup) must not be committed, not even here, so they are
 * read from a file outside the repository: `~/.budget-lens-local/forbidden-terms.json` by default, or the file named
 * by the `MACHINE_AGNOSTIC_TERMS_FILE` env var. Format: `{ "terms": [...] }` (template:
 * `scripts/forbidden-terms.example.json`). Terms match literally and case-insensitively. Without the file (e.g. in
 * CI) this part is skipped with a note; the generic patterns above still run.
 */
const PRIVATE_TERMS_FILE =
  process.env.MACHINE_AGNOSTIC_TERMS_FILE ||
  join(homedir(), ".budget-lens-local", "forbidden-terms.json");

/** Self-test for the private-terms matcher, with placeholder terms only. */
const PRIVATE_TERMS_SAMPLE = {
  terms: ["example-host", "Example Tool", "ex.ample"],
  hits: ["built on EXAMPLE-HOST", "run it with example tool", "see ex.ample/x", "example-hosting"],
  misses: ["an example host", "exXample", "example_tool"],
};

/** The `terms` array of the private terms file, or none when the file does not exist. */
function readPrivateTermsFile() {
  return existsSync(PRIVATE_TERMS_FILE)
    ? JSON.parse(readFileSync(PRIVATE_TERMS_FILE, "utf8")).terms
    : [];
}

function loadPrivateTerms() {
  const terms = readPrivateTermsFile();
  if (!Array.isArray(terms)) {
    throw new Error('Private terms file: expected { "terms": ["..."] }');
  }
  return [...new Set(terms.map((term) => String(term).trim()).filter(Boolean))];
}

/** An ERE (`git grep -E`) and JavaScript pattern matching any of `terms` literally, also inside longer words. */
function privateTermsPattern(terms) {
  return terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
}

/** GitHub configuration may name `agent:*` labels; everything else may not. */
const LABEL = {
  label: "agent label",
  pattern: "agent:[a-z]",
  hits: ["`agent:developer`"],
  misses: ["`agent.act()`", "agent-device"],
};

/**
 * The Expo app config must not name an Expo account: `eas init` writes `expo.owner`, but since SDK 53 EAS identifies
 * the project by `extra.eas.projectId` alone (docs/release/testflight.md). A key check, because the word "owner" is
 * fine elsewhere. `hits` and `misses` are self-tested like the patterns above.
 */
const APP_CONFIG = {
  label: "Expo account name (expo.owner)",
  file: "apps/mobile/app.json",
  hits: [{ expo: { name: "App", owner: "some-account" } }, { expo: { owner: "" } }],
  misses: [
    {
      expo: { name: "App", extra: { eas: { projectId: "00000000-0000-0000-0000-000000000000" } } },
    },
    { expo: { name: "App" } },
  ],
};

function hasExpoOwner(config) {
  return Object.hasOwn(config?.expo ?? {}, "owner");
}

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
  const appConfigFailures = [
    ...APP_CONFIG.hits.filter((sample) => !hasExpoOwner(sample)).map((s) => ["expected a hit", s]),
    ...APP_CONFIG.misses.filter((sample) => hasExpoOwner(sample)).map((s) => ["unexpected hit", s]),
  ].map(([problem, sample]) => `${APP_CONFIG.label}: ${problem} for ${JSON.stringify(sample)}`);
  return [
    ...[...PATTERNS, LABEL].flatMap((entry) => [
      ...mismatches(entry, entry.hits, true),
      ...mismatches(entry, entry.misses, false),
    ]),
    ...appConfigFailures,
    ...[true, false].flatMap((expected) =>
      mismatches(
        { label: "private terms", pattern: privateTermsPattern(PRIVATE_TERMS_SAMPLE.terms) },
        expected ? PRIVATE_TERMS_SAMPLE.hits : PRIVATE_TERMS_SAMPLE.misses,
        expected,
      ),
    ),
  ];
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
const privateTerms = loadPrivateTerms();
if (privateTerms.length > 0) {
  for (const line of grep(privateTermsPattern(privateTerms), []).split("\n").filter(Boolean)) {
    findings.push(`private term: ${line}`);
  }
} else {
  process.stdout.write(
    "Private-terms check skipped: no local terms file (see MACHINE_AGNOSTIC_TERMS_FILE).\n",
  );
}
for (const line of grep(LABEL.pattern, [":(exclude).github/**"]).split("\n").filter(Boolean)) {
  findings.push(`${LABEL.label}: ${line}`);
}

if (
  existsSync(APP_CONFIG.file) &&
  hasExpoOwner(JSON.parse(readFileSync(APP_CONFIG.file, "utf8")))
) {
  findings.push(
    `${APP_CONFIG.label}: ${APP_CONFIG.file} sets "owner"; commit only extra.eas.projectId`,
  );
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
