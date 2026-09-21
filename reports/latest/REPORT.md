# docgen-validate run

Run: `20260921T172022Z`

- Started: 2026-09-21T17:20:22Z
- Finished: 2026-09-21T17:21:57Z
- Targets: `ts`
- Editions: `summary,github-pages,presentation`
- Text QA: on (Vale off)
- Byte-stability rerun: on

**0/5 SDKs fully validated.**

An SDK passes when the documentation checks, the text QA gate and the
byte-stability rerun all succeed.

| SDK | fetch | scaffold | build | generate | check | qa | rerun | doc checks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| openfoodfacts | ok | ok | ok | ok | ok | FAIL | ok | 17/17 |
| univec | ok | ok | ok | ok | ok | FAIL | ok | 17/17 |
| aareguru | ok | ok | ok | ok | ok | FAIL | ok | 17/17 |
| carbonintensity | ok | ok | ok | ok | ok | FAIL | ok | 17/17 |
| hubspotmarketing | ok | ok | ok | ok | ok | FAIL | ok | 17/17 |

## Per-SDK detail

### openfoodfacts

Source: `openfoodfacts-sdk`, spec `openfoodfacts_0.1.0.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- failed phases: qa

### univec

Source: `univec-sdk`, spec `univec-openapi.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- failed phases: qa

### aareguru

Source: `aareguru-sdk`, spec `aareguru_0.1.0.yaml`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- failed phases: qa

### carbonintensity

Source: `carbon-intensity-sdk`, spec `carbon-intensity_0.1.0.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- failed phases: qa

### hubspotmarketing

Source: `hubspot-marketing-sdk`, spec `hubspot-marketing-openapi.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- failed phases: qa
