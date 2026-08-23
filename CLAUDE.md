# CLAUDE.md

## Comments & docstrings

Keep comments and JSDoc to two categories. Strip everything else, including
pre-existing/outdated ones in any file you're editing — not just the lines you changed.

**Keep:**
- Non-obvious WHY: a hidden constraint, a subtle invariant, a workaround for a specific bug,
  or behavior that would genuinely surprise a reader (e.g. why a piece of state is read from
  one place but written to another, or why a library type forces an `any` at some boundary).
- Public API docs: exported functions/hooks whose doc comment is load-bearing for callers in
  other files or apps in this monorepo.

**Don't write:**
- Comments that just restate what the code already says via naming (e.g. a comment on a type
  that only lists what its fields are for).

When adding a new comment, ask: is this a hidden constraint/invariant/bug workaround the
reader couldn't infer, or a doc comment another module actually depends on? If not, don't
write it.
