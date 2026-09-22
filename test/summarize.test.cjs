/* Copyright (c) 2026 Voxgig Ltd, MIT License */

// The summarizer is what a reader actually looks at, so a line it drops is a
// failure nobody sees. Each case breaks exactly one thing in the log and
// requires the parse to notice.

const test = require('node:test')
const assert = require('node:assert')

const { parse, render } = require('../bin/summarize')

const LOG = [
  'config specs=specs/default.txt',
  'config targets=ts',
  'config editions=summary,github-pages',
  'config qa=on',
  'config decks=on',
  'config score=on',
  'config score_scope=',
  'config max_density=12',
  'config rerun=on',
  'config started=2026-09-21T00:00:00Z',
  'sdk=hubspot-marketing repo=voxgig-sdk/x-sdk spec=x.json',
  'hubspot-marketing_fetch_rc=0',
  'hubspot-marketing_version_docgen=0.25.0',
  'hubspot-marketing_version_sdkgen=4.23.0',
  'hubspot-marketing_version_apidef=8.15.0',
  'hubspot-marketing_scaffold_rc=0',
  'hubspot-marketing_build_rc=0',
  'hubspot-marketing_generate_rc=0',
  'hubspot-marketing_deck_rc=0',
  'hubspot-marketing_check_rc=0',
  'hubspot-marketing_checks_pass=17',
  'hubspot-marketing_checks_total=17',
  'hubspot-marketing_qa_rc=0',
  'hubspot-marketing_score_authored=72.9',
  'hubspot-marketing_density_authored=27.1',
  'hubspot-marketing_words_authored=22509',
  'hubspot-marketing_errors_authored=0',
  'hubspot-marketing_warnings_authored=45',
  'hubspot-marketing_suggestions_authored=210',
  'hubspot-marketing_score_all=89.7',
  'hubspot-marketing_density_all=10.3',
  'hubspot-marketing_words_all=101158',
  'hubspot-marketing_errors_all=11',
  'hubspot-marketing_warnings_all=98',
  'hubspot-marketing_suggestions_all=640',
  'hubspot-marketing_score_rc=0',
  'hubspot-marketing_rerun_rc=0',
  'result passed=1 total=1',
].join('\n')

const only = text => parse(text).sdks[0]

test('the score phase is a phase, parsed like every other rc', () => {
  assert.strictEqual(only(LOG).score_rc, 0)
})

test('a failing score gate is recorded as a failure, not lost', () => {
  const sdk = only(LOG.replace('_score_rc=0', '_score_rc=1'))
  assert.strictEqual(sdk.score_rc, 1)
})

test('prose metrics are parsed per scope and keep their decimals', () => {
  const prose = only(LOG).prose
  assert.deepStrictEqual(prose.authored,
    { score: 72.9, density: 27.1, words: 22509, errors: 0, warnings: 45, suggestions: 210 })
  assert.deepStrictEqual(prose.all,
    { score: 89.7, density: 10.3, words: 101158, errors: 11, warnings: 98, suggestions: 640 })
})

test('`score` as a metric name never shadows `score` as a phase', () => {
  // Both `<sdk>_score_rc=0` and `<sdk>_score_all=89.7` exist. Matching the
  // metric first would file the phase result under scope "rc".
  const sdk = only(LOG)
  assert.strictEqual(sdk.score_rc, 0)
  assert.strictEqual(sdk.prose.rc, undefined)
  assert.strictEqual(sdk.prose.all.score, 89.7)
})

test('an SDK name containing a hyphen is not dropped', () => {
  // `\w` does not match `-`, and every SDK in the default list has one.
  assert.strictEqual(only(LOG).name, 'hubspot-marketing')
  assert.strictEqual(only(LOG).prose.all.words, 101158)
})

test('a scope the run did not measure is absent rather than zero', () => {
  const trimmed = LOG.split('\n').filter(l => !l.includes('_authored=')).join('\n')
  const prose = only(trimmed).prose
  assert.strictEqual(prose.authored, undefined)
  assert.strictEqual(prose.all.score, 89.7)
})

test('an SDK that never reached the score phase records no rc at all', () => {
  const stopped = LOG.split('\n')
    .filter(l => !l.startsWith('hubspot-marketing_score') && !l.includes('_density_') &&
      !l.includes('_words_') && !l.includes('_errors_') && !l.includes('_warnings_') &&
      !l.includes('_suggestions_'))
    .join('\n')
  const sdk = only(stopped)
  assert.strictEqual(sdk.score_rc, undefined, 'absent means not reached, never passed')
  assert.strictEqual(sdk.prose, undefined)
})

test('the gate threshold is carried through so the report can state it', () => {
  assert.strictEqual(parse(LOG).config.max_density, '12')
  assert.strictEqual(parse(LOG).config.score, 'on')
})

test('a metric line naming an SDK the log never announced is ignored', () => {
  const stray = LOG + '\nghost_score_all=1\nghost_score_rc=0\n'
  const data = parse(stray)
  assert.strictEqual(data.sdks.length, 1)
  assert.strictEqual(data.sdks[0].name, 'hubspot-marketing')
})

test('the deck phase is parsed, and a deck failure is not lost', () => {
  assert.strictEqual(only(LOG).deck_rc, 0)
  assert.strictEqual(only(LOG.replace('_deck_rc=0', '_deck_rc=2')).deck_rc, 2)
})

test('decks off is carried through so the report does not claim the phase ran', () => {
  const off = LOG.replace('config decks=on', 'config decks=off')
  assert.strictEqual(parse(off).config.decks, 'off')
})

// A run note carries the condition the run was performed under - an
// environment workaround, a narrowed selection - and it is worth recording
// only if it reaches the page a reader looks at, above the headline count.

test('a run note is reprinted above the headline count', () => {
  const noted = LOG.replace('config rerun=on',
    'config rerun=on\nconfig note=@tabnas/parser forced to 0.10.0 in each project')
  const report = render(parse(noted), '20260922T000000Z')
  assert.match(report, /> \*\*Run note:\*\* @tabnas\/parser forced to 0\.10\.0 in each project/)
  assert.ok(report.indexOf('Run note') < report.indexOf('SDKs fully validated'),
    'the note must precede the count it qualifies')
})

test('a run without a note claims no condition', () => {
  assert.ok(!render(parse(LOG), '20260922T000000Z').includes('Run note'))
})

// A run that names no version cannot be told apart from a run against a
// release two behind, so the versions are recorded per SDK and reprinted.

test('the tool versions a run exercised are parsed and reported', () => {
  assert.deepStrictEqual(only(LOG).versions,
    { docgen: '0.25.0', sdkgen: '4.23.0', apidef: '8.15.0' })
  assert.match(render(parse(LOG), 'r'), /- tools: docgen 0\.25\.0, sdkgen 4\.23\.0, apidef 8\.15\.0/)
})

test('an SDK whose versions were never recorded claims none', () => {
  const bare = LOG.split('\n').filter(l => !l.includes('_version_')).join('\n')
  assert.strictEqual(only(bare).versions, undefined)
  assert.ok(!render(parse(bare), 'r').includes('- tools:'))
})

test('a version line naming an SDK the log never announced is ignored', () => {
  const stray = parse(LOG + '\nghost_version_docgen=9.9.9\n')
  assert.strictEqual(stray.sdks.length, 1)
  assert.strictEqual(stray.sdks[0].versions.docgen, '0.25.0')
})

// The scaffold install is how an ephemeral dependency override reaches a
// project. It has to survive the parse - the phase list has no `install`
// token - and it has to reach the report, or a run that forced a package
// reads as an ordinary one.

test('a scaffold install is parsed and named in the report', () => {
  const forced = LOG.replace('config qa=on',
    'config scaffold_install=@tabnas/parser@0.10.0\nconfig qa=on')
    .replace('hubspot-marketing_scaffold_rc=0',
      'hubspot-marketing_scaffold_rc=0\nhubspot-marketing_scaffold_install_rc=0')
  const data = parse(forced)
  assert.strictEqual(data.sdks[0].scaffold_install_rc, 0)
  const report = render(data, 'r')
  assert.match(report, /Scaffold install: `@tabnas\/parser@0\.10\.0`/)
  assert.match(report, /- scaffold-install: ok/)
})

test('a failed scaffold install is reported as a failure', () => {
  const broken = LOG.replace('hubspot-marketing_scaffold_rc=0',
    'hubspot-marketing_scaffold_rc=0\nhubspot-marketing_scaffold_install_rc=1')
  assert.strictEqual(only(broken).scaffold_install_rc, 1)
  assert.match(render(parse(broken), 'r'), /- scaffold-install: FAIL/)
})

test('a run that forced nothing says nothing about a scaffold install', () => {
  const report = render(parse(LOG), 'r')
  assert.ok(!report.includes('Scaffold install'))
  assert.ok(!report.includes('scaffold-install'))
})

// A run the container killed records no `result` line. Reading that as
// measured failures is the same mistake as reading an absent phase as a pass,
// one level up: the count is of SDKs the run never got to.

test('a run that recorded no result is marked incomplete', () => {
  const killed = LOG.split('\n').filter(l => !l.startsWith('result ')).join('\n')
  const report = render(parse(killed), '20260922T000000Z')
  assert.match(report, /> \*\*Incomplete run:\*\*/)
  assert.ok(report.indexOf('Incomplete run') < report.indexOf('SDKs fully validated'),
    'the qualification must precede the count it qualifies')
})

test('a run that finished claims no incompleteness', () => {
  assert.ok(!render(parse(LOG), 'r').includes('Incomplete run'))
})

// The report is the only place absence is spelled out. Every phase the run
// stopped short of has to be NAMED, or a reader counts the ok cells and reads
// a short row as a clean one.

test('phases the run never reached are named, not called clean', () => {
  const stopped = LOG.split('\n')
    .filter(l => !/_(qa|score|rerun)_rc=/.test(l) && !/_(density|words|errors|warnings|suggestions|score)_(authored|all)=/.test(l))
    .join('\n')
  const report = render(parse(stopped), 'r')
  assert.match(report, /- phases not reached: qa, score, rerun/)
  assert.ok(!report.includes('all phases clean'))
})

test('a phase the run was told to skip is not reported as unreached', () => {
  const off = LOG.split('\n')
    .filter(l => !/_rerun_rc=/.test(l))
    .join('\n')
    .replace('config rerun=on', 'config rerun=off')
  const report = render(parse(off), 'r')
  assert.ok(!report.includes('phases not reached'))
  assert.match(report, /- all phases clean/)
})

test('a failed phase is named as failed rather than merely absent', () => {
  const report = render(parse(LOG.replace('_qa_rc=0', '_qa_rc=1')), 'r')
  assert.match(report, /- failed phases: qa/)
  assert.ok(!report.includes('all phases clean'))
})

// A count is only as wide as the gates that ran. A switched-off gate renders
// as `-` in the table, exactly like a phase the run never reached, so the one
// place it can be told apart is beside the count it narrows.

test('a run with a gate switched off says the count does not cover it', () => {
  const narrowed = LOG.replace('config qa=on', 'config qa=off')
    .replace('config rerun=on', 'config rerun=off')
  const report = render(parse(narrowed), 'r')
  assert.match(report, /> \*\*Narrowed run:\*\* the text QA gate, the byte-stability rerun switched off, so the count below does not cover them\./)
  assert.ok(report.indexOf('Narrowed run') < report.indexOf('SDKs fully validated'))
})

test('one gate off is named in the singular', () => {
  const report = render(parse(LOG.replace('config decks=on', 'config decks=off')), 'r')
  assert.match(report, /the deck build switched off, so the count below does not cover it\./)
})

test('a run with every gate on claims no narrowing', () => {
  assert.ok(!render(parse(LOG), 'r').includes('Narrowed run'))
})
