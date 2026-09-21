/* Copyright (c) 2026 Voxgig Ltd, MIT License */

// The summarizer is what a reader actually looks at, so a line it drops is a
// failure nobody sees. Each case breaks exactly one thing in the log and
// requires the parse to notice.

const test = require('node:test')
const assert = require('node:assert')

const { parse } = require('../bin/summarize')

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
