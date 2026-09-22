# docgen-validate

Scripts to validate [`@voxgig/docgen`](https://www.npmjs.com/package/@voxgig/docgen)
end-to-end by generating documentation for real SDKs from the
[`voxgig-sdk`](https://github.com/voxgig-sdk) organisation and then checking
that the documentation describes the model it was built from.

**Current state: read it from the run.** The most recent recorded run is
[`reports/latest/REPORT.md`](reports/latest/REPORT.md), with the same run as data
in [`reports/latest/report.json`](reports/latest/report.json). Its header carries
the count, the tool versions each project resolved, and any condition the run was
performed under. This page does not restate the number, because a count copied
into prose is a count that rots: this paragraph called every SDK a failure
while the report beside it recorded a full pass, and nothing told a reader which
of the two was current. [Findings](#findings) records what the runs have turned
up, and who owns each one.

This is the documentation counterpart to
[`sdkgen-validate`](https://github.com/voxgig/sdkgen-validate), and follows the
same shape: a bash driver, a spec list, per-phase logs, and a summarizer that
turns a run into `REPORT.md` and `report.json`.

## The SDKs

Five SDKs, chosen to span the documentation workload rather than to be
representative of any one API style. None of them appears in
`sdkgen-validate`'s list, so the two repositories exercise different specs.

| SDK | repo | paths | ops | schemas | format | why it is here |
| --- | --- | ---: | ---: | ---: | --- | --- |
| `openfoodfacts` | `openfoodfacts-sdk` | 4 | 4 | 4 | JSON 3.0.3 | the floor: the smallest documentation that is still a document |
| `univec` | `univec-sdk` | 8 | 8 | 11 | JSON 3.0.3 | ships its own generated docs upstream, so the output has a reference |
| `aareguru` | `aareguru-sdk` | 11 | 11 | 0 | YAML 3.0.1 | YAML input, and **no component schemas** at all, so every shape is inline |
| `carbonintensity` | `carbon-intensity-sdk` | 33 | 33 | 13 | JSON 3.0.3 | many routes against few schemas, which stresses the route tables |
| `hubspotmarketing` | `hubspot-marketing-sdk` | 100 | 133 | 313 | JSON 3.0.1 | the ceiling: 313 schemas is where reference rendering gets expensive |

The range matters more than the count. `aareguru` and `hubspotmarketing` differ
by an order of magnitude in operations and by 313 schemas to zero, and a
documentation bug rarely shows up at both ends.

## What a run does

For each SDK:

1. **fetch** — shallow-clone the SDK repo, or refresh an existing checkout, and
   take its `.sdk/def/<spec>`. A populated cache is refreshed rather than
   reused, so a run always validates the current spec; `--no-fetch` is the
   opt-out for offline use and for reproducing an earlier run.
2. **scaffold** — `npm create @voxgig/sdkgen@latest <name> -- --def <spec> --folder <out>`
3. **target add** — `voxgig-sdkgen target add ts` (documentation describes the targets)
4. **edition add** — `summary`, `github-pages`, `presentation`
5. **build** — `npm run build` in `<out>/.sdk`
6. **generate** — `npm run generate`
7. **deck** — build every presentation edition, exactly as the generated
   workflow does before it runs qa. The website links to the BUILT deck, so
   skipping this reports a broken link on every page. `--no-decks` opts out.
8. **check** — `bin/check-docs`
9. **qa** — `voxgig-docgen qa`
10. **score** — `bin/prose-score`, a deterministic prose score over the same
    Vale rules (below). Recorded always; a gate only with `--max-density`.
11. **rerun** — regenerate, and require the files docgen recorded as generated
    to be byte-identical

An SDK passes when 7 through 11 all succeed.

## The prose score

`voxgig-docgen qa` answers "is anything forbidden present", which is a pass or
a fail. It cannot show a release improving or drifting. `bin/prose-score` runs
the same rules over the same text and returns a number:

```
weighted = 10 x errors + 3 x warnings + 1 x suggestions
density  = weighted / (words / 1000)
score    = max(0, 100 - density)
```

Every input is pinned, so the same documentation gives the same score on any
machine: the binary is the exact `@vvago/vale` version `package.json` names
rather than a range an ordinary `npm update` could move a recorded score with,
the rules are the project's own `.sdk/doc/qa/vale.ini` (which pins Google's
package by release URL, not by name), the text is docgen's own extraction, and
every list in the output is sorted and every number fixed-precision.

It reports **two scopes**, and the gap between them is the point:

| scope | text | what it measures |
| --- | --- | --- |
| `all` | every rendered word, table cells included | the prose a reader **sees** |
| `authored` | table cells stripped | the prose docgen **wrote** |

`--max-density <n>` turns the score into a gate, read from `all` by default.
Without it the score is recorded and never fails a run.

One caveat travels with the `all` scope. The text it scores was table cells, and
`Vale.Repetition` reads a column of identical cells — `No`, `No`, `No` down a
"required" column — as a repeated word. On a table-heavy API that is most of the
density: on `carbonintensity` it was 102 of 110 warnings. The project's own
configuration already holds that rule advisory across those boundaries, and the
score is recorded rather than gated, but an `all` score read as a prose trend is
partly reading table shape.

## What `check-docs` asserts

`voxgig-docgen qa` already covers prose, broken local links and missing
anchors. It cannot tell whether the documentation *describes the model*,
because the manifest it reads is generated by the same run. `bin/check-docs`
covers that gap:

- every edition the model declares active emits at its declared output path
  (the edition list is read from the model, so a project that installs two of
  the three is checked as a two-edition project)
- one API page per active entity, and no page for an entity the model does not have
- one SDK page per active target, one page per active feature, and the full guide set
- the summary's own "N entities and M HTTP routes" sentence agrees with the model
- the summary names every entity
- no `ProjectName` / `PROJECTENV` / `$$ref$$` placeholder survives into published text
- every HTML page has a title, and no page is a stub
- every QA manifest entry exists, and every emitted page is in the manifest

The last one is load-bearing: a page missing from the manifest is a page
`voxgig-docgen qa` never opens, so a stale manifest silently narrows the gate.

These checks are themselves tested. `test/check-docs.test.cjs` builds a
known-good tree, breaks one thing at a time, and asserts that the failure set
is *exactly* the matching check — a check that cannot fail is not a check, and
a case that trips two of them is not isolating either.

## What the harness refuses to do

A validator that reports success when it validated nothing is worse than no
validator. These are deliberate hard failures:

- **Validating nothing is not passing.** An empty spec list, or an `--only`
  that matches no SDK, exits non-zero rather than reporting `0/0`. A mixed
  `--only` with one good name and one typo fails too.
- **A failed `target add` or `edition add` abandons the SDK.** `check-docs`
  derives what it expects from the resulting model, so an item that failed to
  install is simply absent from the expected set, and every later phase would
  pass without ever exercising it.
- **The byte-stability digest has no fallback.** The hasher is resolved at
  startup and its absence is fatal. A fallback that hashes anything but the
  documentation stream returns equal digests every time, which turns the gate
  into one that cannot fail.
- **Absent is "not reached", never "passed".** The driver abandons an SDK at
  its first failure, so later phases have no record. `REPORT.md` names them as
  not reached instead of calling the run clean. Two cousins of that rule are
  qualified beside the count rather than left to the reader: a run whose
  `summary.log` has no `result` record was killed rather than completed, and a
  run with a gate switched off validated less than the sentence under the count
  describes.

## Usage

```bash
make smoke     # the two smallest SDKs
make full      # all five
make test      # this repo's own tests
```

Extra flags go through `ARGS`:

```bash
make smoke ARGS='--only univec'
make full  ARGS='--targets ts,go --vale'
make full  ARGS='--max-density 15'      # make the prose score a gate
```

`bin/validate-docgen --help` lists every option. Three things decide what a
report can be read as:

- `--note <text>` records one line with the run, which the summarizer prints
  above the count. It is for a condition a reader has to know before reading the
  result at all: an environment workaround, a deliberately narrowed selection.
- `--scaffold-install <pkg@ver>` forces a package into each scaffolded project's
  own `.sdk` while its dependency tree is built, with `--no-save` and inside the
  run directory alone. The scaffold is created with `--no-install`, because the
  install it would run is the one that runs the project's `postinstall`, and an
  override applied after that install is applied too late. It is for a
  transitive dependency published broken (see [Findings](#findings)), not for an
  ordinary run, and the report names what was forced.
- Every run records which `@voxgig/docgen`, `@voxgig/sdkgen` and `@voxgig/apidef`
  each project resolved, so a clean report names the build it validated rather
  than leaving it to be inferred from the date.

## Prerequisites

Node `20 || >=22`, `npm` and `git`. That range is what `engines` in
`package.json` declares; it is the floor this repo's own dependency tree
already requires rather than a guess, and CI runs Node 24. Network access to
npm and to github.com, unless the SDK repos are already cloned into the cache
and `--no-fetch` is passed.

The deck phase installs Slidev per SDK, which is roughly 500MB and a minute
each. `--no-decks` skips it, at the cost of a broken-link report from qa.

Vale is optional for the **qa** phase: without `--vale` it runs `--local-only`,
which keeps the prose and link checks and skips the Vale pass.

Vale is required for the **score** phase, which is why it is a devDependency
here (`npm install`). If no binary can be found the run stops at startup rather
than skipping the phase: a phase that vanishes when a dependency is absent
reports the same clean run as a phase that passed. `--no-score` is the
explicit opt-out.

## `--create-sdkgen-path` and `--docgen-path`

Both overlay a local checkout so an unreleased change can be validated before
it ships. `--create-sdkgen-path` copies the scaffold-owned `.sdk/src` and
nothing else; `--docgen-path` links the generator.

```bash
make full ARGS='--create-sdkgen-path ../create-sdkgen'
```

Neither is needed for an ordinary run. The default path scaffolds from the
published `@voxgig/create-sdkgen`, which is exactly what a consumer gets.

## Findings

### A published `@tabnas/parser` broke every fresh install (fixed in 0.11.1)

`@tabnas/parser` 0.11.0 validated each option against the TYPE of its default.
The `ender` default is an array and `@tabnas/yaml` passes a string, so the
validator rejected a value the parser's own option reader accepts and splits
(`'string' === typeof opts.ender ? opts.ender.split('')`). `@voxgig/apidef`
requires `@tabnas/yaml` at module load, so requiring apidef threw before it
parsed anything:

```
Error: Tabnas: options.ender: expected array, got string
  at validateOptions (@tabnas/parser/dist/utility.js)
  at Yaml (@tabnas/yaml/dist/yaml.js)
  at @voxgig/apidef/dist/parse.js:12
```

Every scaffold in this harness hit it, and no manifest here could have stopped
it: a scaffolded `.sdk` runs `node build/docgen.js` as its `postinstall`,
docgen's `prepareProject` requires apidef, and `npm create @voxgig/sdkgen@latest`
exited 1 before a page existed. The defect was neither docgen's nor this
harness's.

0.11.1 repairs it. A fresh `npm install @voxgig/apidef` resolves the fixed
parser and requires cleanly, so a run needs no override, and a run that reports
`options.ender: expected array, got string` is resolving 0.11.0 from somewhere
rather than meeting an open defect.

The escape hatch built for it stays, because the shape of the failure is not
rare: a transitive dependency published broken, reached through a `postinstall`,
where nothing this repo commits can pin it. `--scaffold-install <pkg@ver>`
creates the scaffold with `--no-install` and then builds the dependency tree
with the named package forced in, so the install that runs the `postinstall` has
it. It is unsaved and confined to the run directory, so neither this repo's
`package.json` nor a generated project's manifest is touched. A report with no
`Scaffold install` line in its header forced nothing, which is the ordinary
case.

### A missing phase, not a docgen defect (corrected)

An earlier version of this file recorded the broken Slidev link as a docgen
defect. It was a defect in this harness, and the correction matters more than
the original report: the harness had every SDK failing for a reason that was
its own.

`voxgig-docgen qa` did fail on freshly generated output for every SDK, once
per page:

```
docs/index.html:     broken local link: slidev/index.html
docs/api/index.html: broken local link: ../slidev/index.html
```

The `github-pages` edition links to the BUILT deck, and the QA manifest
already routes that target to `docs/slidev/dist/index.html`. The generated
workflow builds every deck before it runs qa. This harness did not, so the
target was genuinely absent and the link check was right to say so.

Building the deck and re-running qa settles it:

```
$ npm install --prefix docs/slidev && npm run build --prefix docs/slidev
$ voxgig-docgen qa --local-only
Text QA passed: 13 files
```

There is now a **deck** phase that does what the workflow does. The lesson is
the one this repo already states about checks: a harness that omits a phase of
the pipeline it validates does not report a gap in the tool, it reports a gap
in itself, and it looks exactly the same from the outside.

### The prose gate read a fraction of the documentation (fixed)

`voxgig-docgen qa` handed Vale the output of docgen's `authored()`, which
strips table cells. A generated API reference keeps the vendor's schema
descriptions in exactly those cells, so most of what a reader sees was never
linted. Measuring both scopes made the gap a number:

| SDK | schemas | words linted | words rendered | linted |
| --- | ---: | ---: | ---: | ---: |
| `aareguru` | 0 | 2675 | 2736 | 98% |
| `univec` | 11 | 2653 | 3370 | 79% |
| `carbonintensity` | 13 | 3876 | 5445 | 71% |
| `openfoodfacts` | 4 | 2324 | 3431 | 68% |
| `hubspotmarketing` | 313 | 22509 | 101158 | **22%** |

`aareguru` is the control: it declares no component schemas at all, so it has
almost no table content and almost nothing was hidden. At the ceiling case
Vale read roughly one word in five.

### The rules judged text docgen did not write (fixed)

Widening the scope showed why the cells had been stripped. Every error the
wider scope found on `hubspotmarketing` was vendor text:

```
7x Vale.Spelling   last_paid_date, legitimate_interest, default_group, ...
4x Google.Spacing  {{ contact.NAME }}, {{ custom.NAME }}
```

None of it is in a docgen template. It is HubSpot's own OpenAPI descriptions,
carried through to the reference pages, and an SDK author cannot satisfy the
rules without editing the upstream specification.

But the text is not prose: `legitimate_interest` is an enumerated value and
`{{ contact.NAME }}` is a template slot. Neither should be linted as English.
The same went for the banned word `navigat(?:e|es|ed|ing)`, which the
local-only check reported on seven pages:

> This endpoint supports pagination to **navigate** through large sets of data.

Both are fixed in docgen, in opposite directions:

- Identifier shapes render as code, which both prose extractions ignore, so
  Vale can read the whole page. It then finds nothing, on all five SDKs.
- The banned vocabulary and the neutral-voice rule read only the prose docgen
  wrote, because they are house style. The rules that describe a defect (a
  repeated word, an em dash, an emoji) still read everything.

Both fixes ship in the published `@voxgig/docgen`, so neither needs a checkout
to reproduce against. Whether they stay closed is a question for a run rather
than for this page: the report names the version it resolved beside its own
result, so a later run that reopens either finding can be told apart from the
one that closed it.

Four of the five SDKs never hit any of this, and it took 313 schemas to
surface it. That is the argument for picking a complexity range rather than a
representative sample.

### The published scaffold did not compile (fixed in create-sdkgen 0.26.0)

The first run of this harness could not reach the documentation phases at all.
`@voxgig/create-sdkgen` 0.25.0 shipped a scaffold whose own
`.sdk/src/BuildSDK.ts` read the pre-compact field schema (`field.name`,
`field.type`), which `@voxgig/apidef` 8.14.0 renamed to `field.n` and
`field.t`. Every scaffolded project failed `npm run build` with six TS2339
errors before generation ran, so `npm create @voxgig/sdkgen@latest` produced a
project that did not compile.

The migration had been merged on create-sdkgen `main` and never released.
0.26.0 ships it, and the default path in this harness now builds and generates
for all five SDKs with no override.

This is the case for running the harness against published versions by
default. The break existed only between what was on `main` and what was on
npm, and nothing that tested a checkout would have seen it.

## Layout

```
bin/
  validate-docgen   # main driver (bash)
  check-docs        # documentation assertions (node)
  prose-score       # deterministic Vale score over the same text (node)
  summarize         # summary.log -> REPORT.md + report.json
  run-to.py         # process-group timeout wrapper
specs/
  default.txt       # the five SDKs
  smoke.txt         # the two smallest
test/
  check-docs.test.cjs
  prose-score.test.cjs
  summarize.test.cjs
reports/
  latest/           # the most recent recorded run
```
