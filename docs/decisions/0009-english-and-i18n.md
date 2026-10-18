# 0009 – English codebase, i18n for UI

Status: Accepted

**Decision.** All code, identifiers, comments, docs, tests, commits and PRs are in English. The app is localized
(Polish and English) through i18n (separate issue); no hardcoded UI strings. Domain code returns codes and parameters,
not messages.

**Consequences.** Legacy Polish strings appear only as verbatim legacy data in characterization tests.
