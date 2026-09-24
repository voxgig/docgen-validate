# docgen-validate run

Run: `20260924T125145Z`

- Started: 2026-09-24T12:51:45Z
- Finished: 2026-09-24T13:05:41Z
- Targets: `ts`
- Editions: `summary,github-pages,presentation`
- Text QA: on (Vale on)
- Presentation decks: on
- Prose score: on (measured, not gated)
- Byte-stability rerun: on

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
| openfoodfacts | 93.3 | 2251 | 0/2/9 | 89.7 | 3195 | 0/4/21 |
| univec | 93.6 | 2833 | 0/2/12 | 68.7 | 3550 | 0/33/12 |
| aareguru | 79 | 2810 | 0/11/26 | 79.4 | 2871 | 0/11/26 |
| carbonintensity | 84.1 | 4281 | 0/9/41 | 33 | 5850 | 0/110/62 |
| hubspotmarketing | 76 | 25422 | 0/149/163 | 91 | 103771 | 0/252/176 |

## Per-SDK detail

### openfoodfacts

Source: `openfoodfacts-sdk`, spec `openfoodfacts_0.1.0.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- tools: docgen 0.27.0, sdkgen 4.25.0, apidef 8.17.0
- prose (authored): score 93.3, density 6.7 over 2251 words, 0E 2W 9S
- prose (all): score 89.7, density 10.3 over 3195 words, 0E 4W 21S
- all phases clean

### univec

Source: `univec-sdk`, spec `univec-openapi.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- tools: docgen 0.27.0, sdkgen 4.25.0, apidef 8.17.0
- prose (authored): score 93.6, density 6.4 over 2833 words, 0E 2W 12S
- prose (all): score 68.7, density 31.3 over 3550 words, 0E 33W 12S
- all phases clean

### aareguru

Source: `aareguru-sdk`, spec `aareguru_0.1.0.yaml`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- tools: docgen 0.27.0, sdkgen 4.25.0, apidef 8.17.0
- prose (authored): score 79, density 21 over 2810 words, 0E 11W 26S
- prose (all): score 79.4, density 20.6 over 2871 words, 0E 11W 26S
- all phases clean

### carbonintensity

Source: `carbon-intensity-sdk`, spec `carbon-intensity_0.1.0.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- tools: docgen 0.27.0, sdkgen 4.25.0, apidef 8.17.0
- prose (authored): score 84.1, density 15.9 over 4281 words, 0E 9W 41S
- prose (all): score 33, density 67 over 5850 words, 0E 110W 62S
- all phases clean

### hubspotmarketing

Source: `hubspot-marketing-sdk`, spec `hubspot-marketing-openapi.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- documentation checks: 17/17
- tools: docgen 0.27.0, sdkgen 4.25.0, apidef 8.17.0
- prose (authored): score 76, density 24 over 25422 words, 0E 149W 163S
- prose (all): score 91, density 9 over 103771 words, 0E 252W 176S
- all phases clean
