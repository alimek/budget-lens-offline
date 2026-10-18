# 0009 – English codebase, i18n for UI

Status: Accepted (#20; [#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427))

**Decision.** All code, identifiers, comments, docs, tests, commits, PRs and issues are in English. The app is localized
(Polish and English) through i18n (separate issue); no hardcoded UI strings. Domain code returns codes and parameters,
not messages.

**Consequences.** Legacy Polish strings appear only as verbatim legacy data in characterization tests.
