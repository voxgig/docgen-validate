# docgen-validate run

Run: `post-2026-10-15-0`

- Started: 2026-10-17T04:09:02Z
- Finished: 2026-10-17T04:19:02Z
- Targets: `ts`
- Editions requested: `summary,github-pages,presentation`
- Editions active: `presentation,summary`
- Text QA: on (Vale off)
- Presentation decks: on
- Prose score: on (measured, not gated)
- Byte-stability rerun: on

**5/5 SDKs fully validated.**

An SDK passes when the deck build, the documentation checks, the text QA
gate, the prose score and the byte-stability rerun all succeed.

| SDK | fetch | scaffold | build | generate | deck | check | qa | score | rerun | doc checks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| openfoodfacts | ok | ok | ok | ok | ok | ok | ok | ok | ok | 11/11 |
| univec | ok | ok | ok | ok | ok | ok | ok | ok | ok | 11/11 |
| aareguru | ok | ok | ok | ok | ok | ok | ok | ok | ok | 11/11 |
| carbonintensity | ok | ok | ok | ok | ok | ok | ok | ok | ok | 11/11 |
| hubspotmarketing | ok | ok | ok | ok | ok | ok | ok | ok | ok | 11/11 |

## Prose score

Weighted alerts per 1000 words, over the project's own pinned Vale rules.
Score is 100 minus that density, floored at zero. `all` is every rendered
word, table cells included, which is where a vendor specification's own
descriptions land. `authored` is the narrower text, docgen's own prose.

| SDK | authored score | authored words | authored E/W/S | all score | all words | all E/W/S |
| --- | --- | --- | --- | --- | --- | --- |
| openfoodfacts | 87.9 | 1078 | 0/2/7 | 88.2 | 1104 | 0/2/7 |
| univec | 91.6 | 1187 | 0/2/4 | 91.8 | 1219 | 0/2/4 |
| aareguru | 62.3 | 1060 | 0/8/16 | 63.9 | 1107 | 0/8/16 |
| carbonintensity | 65.2 | 1148 | 0/7/19 | 68.3 | 1261 | 0/7/19 |
| hubspotmarketing | 95.5 | 3751 | 0/2/11 | 95.8 | 4048 | 0/2/11 |

## Per-SDK detail

### openfoodfacts

Source: `openfoodfacts-sdk`, spec `openfoodfacts_0.1.0.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- active editions: presentation, summary
- documentation checks: 11/11
- tools: docgen 0.30.2, sdkgen 4.35.0, apidef 8.25.3
- prose (authored): score 87.9, density 12.1 over 1078 words, 0E 2W 7S
- prose (all): score 88.2, density 11.8 over 1104 words, 0E 2W 7S
- all phases clean

### univec

Source: `univec-sdk`, spec `univec-openapi.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- active editions: presentation, summary
- documentation checks: 11/11
- tools: docgen 0.30.2, sdkgen 4.35.0, apidef 8.25.3
- prose (authored): score 91.6, density 8.4 over 1187 words, 0E 2W 4S
- prose (all): score 91.8, density 8.2 over 1219 words, 0E 2W 4S
- all phases clean

### aareguru

Source: `aareguru-sdk`, spec `aareguru_0.1.0.yaml`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- active editions: presentation, summary
- documentation checks: 11/11
- tools: docgen 0.30.2, sdkgen 4.35.0, apidef 8.25.3
- prose (authored): score 62.3, density 37.7 over 1060 words, 0E 8W 16S
- prose (all): score 63.9, density 36.1 over 1107 words, 0E 8W 16S
- all phases clean

### carbonintensity

Source: `carbon-intensity-sdk`, spec `carbon-intensity_0.1.0.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- active editions: presentation, summary
- documentation checks: 11/11
- tools: docgen 0.30.2, sdkgen 4.35.0, apidef 8.25.3
- prose (authored): score 65.2, density 34.8 over 1148 words, 0E 7W 19S
- prose (all): score 68.3, density 31.7 over 1261 words, 0E 7W 19S
- all phases clean

### hubspotmarketing

Source: `hubspot-marketing-sdk`, spec `hubspot-marketing-openapi.json`

- targets: ts=ok
- editions: summary=ok, github-pages=ok, presentation=ok
- active editions: presentation, summary
- documentation checks: 11/11
- tools: docgen 0.30.2, sdkgen 4.35.0, apidef 8.25.3
- prose (authored): score 95.5, density 4.5 over 3751 words, 0E 2W 11S
- prose (all): score 95.8, density 4.2 over 4048 words, 0E 2W 11S
- all phases clean
