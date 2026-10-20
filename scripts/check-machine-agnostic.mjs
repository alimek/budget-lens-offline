// Portability guard (part of `pnpm lint`): the repository must not contain host-, user- or operator-specific
// data (machine names, home paths, local scheduler jobs, device serials) or references to a specific agent setup.
// Anyone must be able to clone the repo and work with it. Policy: AGENTS.md (Hard rules).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

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
