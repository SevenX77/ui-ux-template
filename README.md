# ui-ux-template

Purpose: the owner's future projects share one interface design and behaviour across technology stacks.

This repository holds one stack-neutral design core and separate stack templates. Templates read core rather than redefining or copying it. HTML is the reference rendering; React 18 + TypeScript + Vite is the next template.

```text
core/                 tokens, styles, behaviour, language, content and rules
  dist/               generated core outputs; commit with source changes
templates/
  html/               handbook source and built reference rendering
  react/              React template (in progress; see decision 0009)
docs/
  ARCHITECTURE.md      standing architecture
  decisions/          decision records
references/           design references
archive/              retired versions
```

## Where to start

- Coding agents: [AGENTS.md](AGENTS.md), then [architecture](docs/ARCHITECTURE.md).
- Design: [UI rules](core/rules/UI-RULES.md) and [terms](core/rules/TERMS.md).
- Core files and generation: [core guide](core/README.md).
- Plain HTML use and reference handbook: [HTML guide](templates/html/README.md).
- Scope and implementation state: [decision 0009](docs/decisions/0009-design-core-and-stack-templates.md) and the [decision records](docs/decisions/).

Projects consume this repository by submodule or another path reference. [The architecture](docs/ARCHITECTURE.md#consuming-the-template-in-a-project) gives the command and import paths.
