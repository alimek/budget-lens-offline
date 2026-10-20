# 0009 – English codebase, i18n for UI

Status: Accepted (#20; [#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427))

**Decision.** All code, identifiers, comments, docs, tests, commits, PRs and issues are in English. The app is localized
(Polish and English) through i18n (separate issue); no hardcoded UI strings. Domain code returns codes and parameters,
not messages.

**Consequences.** Legacy Polish strings appear only as verbatim legacy data in characterization tests.

**Update (#37, #77).** i18n uses i18next + react-i18next with bundled JSON resources per namespace. English is the
source language and the runtime fallback for missing Polish keys; there are no translation checks in CI
([final owner decision](https://github.com/alimek/budget-lens-offline/issues/37#issuecomment-6263102054)). The app
follows the device language with an in-app override. Details: [i18n](../i18n.md).
