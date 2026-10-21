// Development-route guard (part of `pnpm lint`): Expo Router ships every file under `apps/mobile/src/app`, and the
// `budget-lens` scheme lets any tapped link open one of them. `/dev/forget-key` deletes the key of the encrypted
// database, which would make a budget unreadable for good (#75 R7), so these screens and their effects must not
// exist in a release build. Every rule below carries samples that must be reported and samples that must pass, so a
// broken regular expression fails this check loudly instead of passing silently. Policy: docs/mobile-development.md.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const devDirectory = "apps/mobile/src/app/dev";
const layoutPath = "apps/mobile/src/app/_layout.tsx";
const dbKeyPath = "apps/mobile/src/db/db-key.ts";

/** The guarded block of the root layout, or `null` when the layout registers its development screens unguarded. */
function guardedBlock(source) {
  const block = /<Stack\.Protected[^>]*guard=\{__DEV__\}[^>]*>([\s\S]*?)<\/Stack\.Protected>/.exec(
    source,
  );
  return block?.[1] ?? null;
}

/** A development route runs its effect through `useDevEffect`, never through `useEffect` directly. */
function importsUseEffect(source) {
  return /import\s*\{[^}]*\buseEffect\b[^}]*\}\s*from\s*"react"/.test(source);
}

/** Whether a screen renders without checking `__DEV__`. */
function rendersWithoutGuard(source) {
  return !/if\s*\(\s*!__DEV__\s*\)/.test(source);
}

/**
 * Whether `forgetDatabaseKey` deletes the key before it checks `__DEV__`. The guard has to be the first thing the
 * function does, so a check further down does not count.
 */
function forgetsKeyWithoutGuard(source) {
  const declaration = /export async function forgetDatabaseKey[^{]*\{/.exec(source);
  if (declaration === null) {
    return false;
  }
  const body = source.slice(declaration.index + declaration[0].length);
  return !body.replace(/^(?:\s*(?:\/\/[^\n]*\n)*)\s*/, "").startsWith("if (!__DEV__)");
}

/** Every rule as samples: `reported` must be caught, `accepted` must pass. */
const RULES = [
  {
    rule: "development screens behind Stack.Protected",
    violates: (source) => guardedBlock(source) === null,
    reported: ['<Stack><Stack.Screen name="dev/x" /></Stack>'],
    accepted: [
      '<Stack><Stack.Protected guard={__DEV__}><Stack.Screen name="dev/x" /></Stack.Protected></Stack>',
    ],
  },
  {
    rule: "route effects through useDevEffect",
    violates: importsUseEffect,
    reported: ['import { useEffect, useState } from "react";'],
    accepted: [
      'import { useState } from "react";',
      'import { useDevEffect } from "@/dev/use-dev-effect";',
    ],
  },
  {
    rule: "__DEV__ guard in every development screen",
    violates: rendersWithoutGuard,
    reported: ['return <Screen testID="screen-x" />;', "if (!DEV) {"],
    accepted: [
      'if (!__DEV__) {\n    return <Redirect href="/" />;\n  }',
      "if (!__DEV__) return null;",
    ],
  },
  {
    rule: "__DEV__ guard as the first act of forgetDatabaseKey",
    violates: forgetsKeyWithoutGuard,
    reported: [
      "export async function forgetDatabaseKey(): Promise<boolean> {\n  const key = await readDatabaseKey();",
    ],
    accepted: [
      "export async function forgetDatabaseKey(): Promise<boolean> {\n  if (!__DEV__) {\n    return false;\n  }",
      "export async function forgetDatabaseKey(): Promise<boolean> {\n  // A note.\n  if (!__DEV__) {\n    return false;\n  }",
      "export function unrelated(): void {}",
    ],
  },
];

function assertSamples(rule, samples, expected) {
  for (const sample of samples) {
    if (rule.violates(sample) !== expected) {
      const seen = expected ? "misses a known violation" : "reports correct code";
      throw new Error(`the check for "${rule.rule}" ${seen}: ${sample.slice(0, 60)}`);
    }
  }
}

function runRuleSelfTests() {
  for (const rule of RULES) {
    assertSamples(rule, rule.reported, true);
    assertSamples(rule, rule.accepted, false);
  }
}

/** The route rules that read a development screen, as messages. */
const ROUTE_RULES = [
  {
    violates: importsUseEffect,
    message: (file) =>
      `${file}: imports useEffect from react; use useDevEffect so the body stays inside the __DEV__ guard`,
  },
  {
    violates: rendersWithoutGuard,
    message: (file) => `${file}: renders without an __DEV__ guard`,
  },
];

function routeFindings(file, guarded) {
  const source = readFileSync(file, "utf8");
  const name = basename(file).replace(/\.tsx$/, "");
  const outside = guarded.includes(`name="dev/${name}"`)
    ? []
    : [`${file}: not registered inside the guarded block of ${layoutPath}`];
  return [
    ...outside,
    ...ROUTE_RULES.filter((rule) => rule.violates(source)).map((rule) => rule.message(file)),
  ];
}

function layoutFindings(layout, guarded) {
  const unguarded = /name="(dev\/[^"]+)"/.exec(layout.replace(guarded, ""))?.[1];
  const routes = readdirSync(devDirectory)
    .filter((name) => name.endsWith(".tsx"))
    .flatMap((name) => routeFindings(join(devDirectory, name), guarded));
  return [
    ...(unguarded === undefined
      ? []
      : [`${layoutPath}: ${unguarded} is registered outside the guarded block of the layout`]),
    ...(routes.length > 0 ? routes : []),
  ];
}

function keyFindings() {
  return forgetsKeyWithoutGuard(readFileSync(dbKeyPath, "utf8"))
    ? [
        `${dbKeyPath}: forgetDatabaseKey deletes the key without an __DEV__ guard of its own (#75 R7)`,
      ]
    : [];
}

function findings() {
  const layout = readFileSync(layoutPath, "utf8");
  const guarded = guardedBlock(layout);
  if (guarded === null) {
    return [
      `${layoutPath}: the development screens are not inside <Stack.Protected guard={__DEV__}> (#75 R7)`,
    ];
  }
  return [...layoutFindings(layout, guarded), ...keyFindings()];
}

runRuleSelfTests();
if (!existsSync(layoutPath) || !existsSync(dbKeyPath)) {
  console.error(`scripts/check-dev-routes.mjs: ${layoutPath} or ${dbKeyPath} is missing`);
  process.exit(1);
}
const problems = findings();
if (problems.length > 0) {
  console.error(
    "Development-route check failed (#75 R7): a release build could run development code.",
  );
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}
console.log("Development routes: guarded by __DEV__ in the layout, the effects and the key.");
