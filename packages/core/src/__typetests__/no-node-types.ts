/**
 * Compile-time guard: packages/core src must not see Node.js types.
 *
 * Lives in src so it is always part of the src program (tsconfig.json). If Node.js
 * types ever leak into that program (e.g. via a tooling file or a `types` change), the
 * `@ts-expect-error` directives below become unused and `pnpm typecheck` fails with TS2578.
 * Never imported or executed; Fallow treats it as an entry point.
 */

// @ts-expect-error node:fs must not resolve in packages/core
import "node:fs";

// @ts-expect-error the `process` global must not be available in packages/core
process.env;

// @ts-expect-error the `Buffer` global must not be available in packages/core
Buffer.from("");
