# docgen-validate run

Run: `20260921T194254Z`

- Started: 2026-09-21T19:42:54Z
- Finished: 2026-09-21T19:51:50Z
- Targets: `ts`
- Editions: `summary,github-pages,presentation`
- Text QA: on (Vale on)
- Presentation decks: on
- Prose score: on (measured, not gated)
- Byte-stability rerun: on
- **Docgen: local checkout `/home/user/docgen/ts`, not the published package.**

**5/5 SDKs fully validated.**

An SDK passes when the deck build, the documentation checks, the text QA
gate, the prose score and the byte-stability rerun all succeed.

| SDK | fetch | scaffold | build | generate | deck | check | qa | score | rerun | doc checks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| openfoodfacts | ok | ok | ok | ok | ok | ok | ok | ok | ok | 17/17 |
| univec | ok | ok | ok | ok | ok | ok | ok | ok | ok | 17/17 |
| aareguru | ok | ok | ok | ok | ok | ok | ok | ok | ok | 17/17 |
| carbonintensity | ok | ok | ok | ok | ok | ok | ok | ok | ok | 17/17 |
| hubspotmarketing | ok | ok | ok | ok | ok | ok | ok | ok | ok | 17/17 |

## Prose score

Weighted alerts per 1000 words, over the project's own pinned Vale rules.
Score is 100 minus that density, floored at zero. `all` is every rendered
word, table cells included, which is where a vendor specification's own
descriptions land. `authored` is the narrower text, docgen's own prose.

| SDK | authored score | authored words | authored E/W/S | all score | all words | all E/W/S |
| --- | --- | --- | --- | --- | --- | --- |
| openfoodfacts | 94 | 2324 | 0/2/8 | 89.8 | 3431 | 0/4/23 |
| univec | 93.2 | 2653 | 0/2/12 | 67.1 | 3370 | 0/33/12 |
| aareguru | 79.1 | 2675 | 0/11/23 | 79.5 | 2736 | 0/11/23 |
| carbonintensity | 84.8 | 3876 | 0/9/32 | 29.7 | 5445 | 0/110/53 |
| hubspotmarketing | 72.9 | 22497 | 0/149/163 | 90.8 | 100846 | 0/252/176 |

## Per-SDK detail

### openfoodfacts

Source: `openfoodfacts-sdk`, spec `openfoodfacts_0.1.0.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- prose (authored): score 94, density 6 over 2324 words, 0E 2W 8S
- prose (all): score 89.8, density 10.2 over 3431 words, 0E 4W 23S
- all phases clean

### univec

Source: `univec-sdk`, spec `univec-openapi.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- prose (authored): score 93.2, density 6.8 over 2653 words, 0E 2W 12S
- prose (all): score 67.1, density 32.9 over 3370 words, 0E 33W 12S
- all phases clean

### aareguru

Source: `aareguru-sdk`, spec `aareguru_0.1.0.yaml`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- prose (authored): score 79.1, density 20.9 over 2675 words, 0E 11W 23S
- prose (all): score 79.5, density 20.5 over 2736 words, 0E 11W 23S
- all phases clean

### carbonintensity

Source: `carbon-intensity-sdk`, spec `carbon-intensity_0.1.0.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- prose (authored): score 84.8, density 15.2 over 3876 words, 0E 9W 32S
- prose (all): score 29.7, density 70.3 over 5445 words, 0E 110W 53S
- all phases clean

### hubspotmarketing

Source: `hubspot-marketing-sdk`, spec `hubspot-marketing-openapi.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- prose (authored): score 72.9, density 27.1 over 22497 words, 0E 149W 163S
- prose (all): score 90.8, density 9.2 over 100846 words, 0E 252W 176S
- all phases clean
