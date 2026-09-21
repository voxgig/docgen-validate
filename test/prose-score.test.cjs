/* Copyright (c) 2026 Voxgig Ltd, MIT License */

// The score has to be defensible before it is useful: a number nobody can
// reproduce is worse than no number. These pin the arithmetic and the
// tokenisation, which are the parts that decide what the score MEANS. The
// Vale run itself is exercised by the driver's score phase against real
// generated documentation.

const test = require('node:test')
const assert = require('node:assert')

const { WEIGHT, words, round, gate, parseArgs } = require('../bin/prose-score')

test('severity weights rank a defect above an opinion', () => {
  assert.ok(WEIGHT.error > WEIGHT.warning, 'an error must outweigh a warning')
  assert.ok(WEIGHT.warning > WEIGHT.suggestion, 'a warning must outweigh a suggestion')
  // The ratio is the part that matters: it decides how many suggestions are
  // worth one error. Ten keeps a page of opinions from burying one defect.
  assert.strictEqual(WEIGHT.error / WEIGHT.suggestion, 10)
})

test('word counting is stable and ignores punctuation and markup noise', () => {
  assert.strictEqual(words('one two three'), 3)
  assert.strictEqual(words('one, two. three!'), 3)
  assert.strictEqual(words(''), 0)
  assert.strictEqual(words('123 456'), 0, 'bare numbers are not words')
  assert.strictEqual(words("don't hyphen-ated"), 2, 'contractions and hyphens stay one word')
})

test('word counting is deterministic across repeated calls', () => {
  const text = 'The quick brown fox jumps over the lazy dog, twice.'
  const first = words(text)
  for (let i = 0; i < 100; i++) assert.strictEqual(words(text), first)
})

test('rounding is fixed precision, so a score never drifts by float noise', () => {
  assert.strictEqual(round(1 / 3), 0.3)
  assert.strictEqual(round(0.05 + 0.05 + 0.05), 0.2)
  assert.strictEqual(round(27.149999), 27.1)
  assert.strictEqual(round(100), 100)
})

// The published formula, restated here so a change to it has to change this
// test too. density is weighted alerts per 1000 words; score is 100 minus
// density, floored at zero.
const density = (alerts, wordCount) => round(
  (WEIGHT.error * alerts.error + WEIGHT.warning * alerts.warning + WEIGHT.suggestion * alerts.suggestion)
  / (wordCount / 1000))

test('density normalises by length, so size is not mistaken for quality', () => {
  const alerts = { error: 0, warning: 3, suggestion: 1 }
  // The same alerts over twice the words is half the density.
  assert.strictEqual(density(alerts, 1000), 10)
  assert.strictEqual(density(alerts, 2000), 5)
})

test('a clean document scores 100', () => {
  assert.strictEqual(round(Math.max(0, 100 - density({ error: 0, warning: 0, suggestion: 0 }, 5000))), 100)
})

test('the score is floored at zero rather than going negative', () => {
  const awful = { error: 500, warning: 0, suggestion: 0 }
  assert.ok(density(awful, 1000) > 100)
  assert.strictEqual(round(Math.max(0, 100 - density(awful, 1000))), 0)
})

test('an error outweighs three warnings, and a warning three suggestions', () => {
  const one = density({ error: 1, warning: 0, suggestion: 0 }, 1000)
  const three = density({ error: 0, warning: 3, suggestion: 0 }, 1000)
  assert.ok(one > three, 'an error must cost more than three warnings')

  // 10:3:1 makes three warnings EXACTLY nine suggestions. That is the
  // exchange rate, stated rather than inferred: a rule demoted from warning
  // to suggestion has to draw two more hits to weigh the same.
  assert.strictEqual(three, density({ error: 0, warning: 0, suggestion: 9 }, 1000))
  assert.ok(density({ error: 0, warning: 1, suggestion: 0 }, 1000)
    > density({ error: 0, warning: 0, suggestion: 2 }, 1000))
})

// The gate is the half of this that can fail a run, so each way it can say no
// gets a case. A threshold nobody can trip is a threshold nobody needs.

test('no threshold means no gate', () => {
  for (const absent of [undefined, null, '']) {
    assert.deepStrictEqual(gate({ density: 9999 }, absent), { ok: true })
  }
})

test('a density at or under the threshold passes', () => {
  assert.deepStrictEqual(gate({ density: 4 }, '5'), { ok: true })
  assert.deepStrictEqual(gate({ density: 5 }, '5'), { ok: true }, 'the limit itself is allowed')
  assert.deepStrictEqual(gate({ density: 0 }, '0'), { ok: true })
})

test('a density over the threshold fails, and says by how much', () => {
  const verdict = gate({ density: 27.1 }, '10')
  assert.strictEqual(verdict.ok, false)
  assert.match(verdict.reason, /27\.1/)
  assert.match(verdict.reason, /10/)
})

test('a threshold that is not a number REFUSES rather than passing', () => {
  // `density > Number('ten')` is `density > NaN`, which is false, so a
  // mistyped threshold silently disables the gate it was meant to tighten.
  for (const bad of ['ten', 'abc', '--json']) {
    const verdict = gate({ density: 9999 }, bad)
    assert.strictEqual(verdict.ok, false, `${bad} must not pass`)
    assert.match(verdict.reason, /not a number/)
  }
})

test('a missing measurement REFUSES rather than passing', () => {
  for (const result of [{}, { density: null }, { density: NaN }, undefined]) {
    const verdict = gate(result, '10')
    assert.strictEqual(verdict.ok, false)
    assert.match(verdict.reason, /no density/)
  }
})

test('argument parsing separates the root from every flag value', () => {
  const { options, root } = parseArgs(
    ['--json', '--scope', 'all', '--vale', '/bin/vale', '--no-sync', '--max-density', '4', '/proj'])
  assert.strictEqual(root, '/proj')
  assert.strictEqual(options['--scope'], 'all')
  assert.strictEqual(options['--max-density'], '4')
  assert.strictEqual(options['--json'], true)
  assert.strictEqual(options['--no-sync'], true)
})

test('a flag value equal to another flag value does not swallow the root', () => {
  // The defect the scan replaced: locating a value by indexOf finds its FIRST
  // occurrence, so two flags sharing a value mis-identified which one it was.
  const { root } = parseArgs(['--scope', 'all', '--config', 'all', '/proj'])
  assert.strictEqual(root, '/proj')
})

test('the root defaults to the working directory', () => {
  assert.strictEqual(parseArgs(['--json']).root, '.')
})
