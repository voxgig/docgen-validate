/* Copyright (c) 2026 Voxgig Ltd, MIT License */

// The documentation checks are only worth running if they fail when the
// documentation is wrong. Each case breaks one thing in a known-good tree and
// asserts that the matching check, and no other, goes red.

const test = require('node:test')
const assert = require('node:assert')
const Fs = require('node:fs')
const Os = require('node:os')
const Path = require('node:path')

const { checkDocs } = require('../bin/check-docs')

const MODEL = {
  main: {
    kit: {
      entity: {
        product: { active: true, op: { load: { points: [{}] }, list: { points: [{}] } } },
        search: { active: true, op: { list: { points: [{}, {}] } } },
      },
      target: { ts: { active: true } },
      feature: { test: { active: true }, retry: { active: false } },
      doc: {
        edition: {
          summary: { active: true, output: { path: 'SUMMARY.md' } },
          'github-pages': { active: true, output: { path: 'docs' } },
          presentation: { active: true, output: { path: 'docs/slidev' } },
        },
      },
    },
  },
}

const PAGE = title => `<!doctype html><html><head><title>${title}</title></head><body>` +
  '<p>' + 'Documentation body text that comfortably clears the stub floor. '.repeat(6) + '</p></body></html>'

const SUMMARY = `# Demo API

A description of the demo API that is long enough to clear the stub floor and
then some, so the summary is treated as real content.

The selected API surface contains 2 entities and 4 HTTP routes. There are 1 SDK targets.

The product entity and the search entity are both documented here.
`

const SLIDES = `---
theme: default
---

# Demo API

` + 'Slide body text that clears the stub floor comfortably. '.repeat(6)

function build() {
  const root = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'docgen-validate-'))
  const write = (rel, text) => {
    const full = Path.join(root, rel)
    Fs.mkdirSync(Path.dirname(full), { recursive: true })
    Fs.writeFileSync(full, text)
  }
  write('.sdk/model/sdk.json', JSON.stringify(MODEL))
  write('SUMMARY.md', SUMMARY)
  write('docs/index.html', PAGE('Demo API'))
  write('docs/api/index.html', PAGE('API'))
  write('docs/api/product.html', PAGE('product'))
  write('docs/api/search.html', PAGE('search'))
  write('docs/sdks/ts.html', PAGE('ts'))
  write('docs/features/test.html', PAGE('test'))
  for (const guide of ['authentication', 'concepts', 'errors', 'first-call']) {
    write(`docs/guides/${guide}.html`, PAGE(guide))
  }
  write('docs/slidev/slides.md', SLIDES)
  const files = [
    'SUMMARY.md', 'docs/index.html', 'docs/api/index.html', 'docs/api/product.html',
    'docs/api/search.html', 'docs/sdks/ts.html', 'docs/features/test.html',
    'docs/guides/authentication.html', 'docs/guides/concepts.html',
    'docs/guides/errors.html', 'docs/guides/first-call.html',
  ]
  write('.sdk/doc/qa-manifest.json', JSON.stringify({ config: '.sdk/doc/qa', files }))
  return root
}

const failures = root => checkDocs(root).checks.filter(c => !c.pass).map(c => c.name)

// Drop a page from the manifest as well as the disk, so removing a page tests
// entity coverage ALONE. Without this the manifest check fails too, and a case
// that trips two assertions cannot show which one is doing the work.
function unlist(root, ...rel) {
  const file = Path.join(root, '.sdk/doc/qa-manifest.json')
  const manifest = JSON.parse(Fs.readFileSync(file, 'utf8'))
  manifest.files = manifest.files.filter(f => !rel.includes(f))
  Fs.writeFileSync(file, JSON.stringify(manifest))
}

function enlist(root, ...rel) {
  const file = Path.join(root, '.sdk/doc/qa-manifest.json')
  const manifest = JSON.parse(Fs.readFileSync(file, 'utf8'))
  manifest.files.push(...rel)
  Fs.writeFileSync(file, JSON.stringify(manifest))
}

test('a correct documentation tree passes every check', () => {
  const root = build()
  try {
    const { checks } = checkDocs(root)
    assert.deepStrictEqual(failures(root), [], 'expected no failures')
    assert.ok(checks.length >= 14, 'expected a substantive check set')
  } finally { Fs.rmSync(root, { recursive: true, force: true }) }
})

const CASES = [
  ['a missing entity page is caught',
    root => { Fs.rmSync(Path.join(root, 'docs/api/product.html')); unlist(root, 'docs/api/product.html') },
    'every active entity has an API page'],
  ['a page for an entity the model lacks is caught',
    root => {
      Fs.copyFileSync(Path.join(root, 'docs/api/search.html'), Path.join(root, 'docs/api/ghost.html'))
      enlist(root, 'docs/api/ghost.html')
    },
    'no API page without an entity'],
  ['a missing SDK page is caught',
    root => { Fs.rmSync(Path.join(root, 'docs/sdks/ts.html')); unlist(root, 'docs/sdks/ts.html') },
    'every active target has an SDK page'],
  ['a missing feature page is caught',
    root => { Fs.rmSync(Path.join(root, 'docs/features/test.html')); unlist(root, 'docs/features/test.html') },
    'every active feature has a page'],
  ['a missing guide is caught',
    root => { Fs.rmSync(Path.join(root, 'docs/guides/errors.html')); unlist(root, 'docs/guides/errors.html') },
    'the guide set is complete'],
  ['a route count that disagrees with the model is caught',
    root => Fs.writeFileSync(Path.join(root, 'SUMMARY.md'),
      SUMMARY.replace('2 entities and 4 HTTP routes', '2 entities and 9 HTTP routes')),
    'summary entity and route counts match the model'],
  ['a summary that omits an entity is caught',
    root => Fs.writeFileSync(Path.join(root, 'SUMMARY.md'), SUMMARY.replace(/\bsearch\b/g, 'lookup')),
    'summary names every entity'],
  ['a leaked placeholder is caught',
    root => Fs.writeFileSync(Path.join(root, 'docs/index.html'), PAGE('Demo') + 'ProjectName'),
    'no placeholder leaks into the documentation'],
  ['a leaked jostraca ref is caught',
    root => Fs.writeFileSync(Path.join(root, 'docs/index.html'), PAGE('Demo') + '$$model.path$$'),
    'no placeholder leaks into the documentation'],
  ['an untitled page is caught',
    root => Fs.writeFileSync(Path.join(root, 'docs/guides/errors.html'),
      '<!doctype html><html><head></head><body><p>' +
      'Body text long enough to clear the stub floor entirely. '.repeat(6) + '</p></body></html>'),
    'every HTML page has a title'],
  ['a stub page is caught',
    root => Fs.writeFileSync(Path.join(root, 'docs/guides/errors.html'), PAGE('errors').slice(0, 120)),
    'no page is a stub'],
  ['a manifest entry with no file is caught',
    root => enlist(root, 'docs/api/absent.html'),
    'every manifest entry exists'],
  ['a page missing from the manifest is caught',
    root => unlist(root, 'docs/api/search.html'),
    'every emitted page is in the QA manifest'],
  ['a malformed manifest is caught',
    root => Fs.writeFileSync(Path.join(root, '.sdk/doc/qa-manifest.json'), '{ not json'),
    'QA manifest is readable'],
  ['a model that declares no edition is caught',
    root => {
      const file = Path.join(root, '.sdk/model/sdk.json')
      const model = JSON.parse(Fs.readFileSync(file, 'utf8'))
      model.main.kit.doc.edition = {}
      Fs.writeFileSync(file, JSON.stringify(model))
    },
    'the model declares at least one edition'],
]

// Each case must break EXACTLY the assertion it names. A mutation that trips a
// second check is not isolating anything, and would let a regression in the
// named check hide behind its collateral.
for (const [title, corrupt, expected] of CASES) {
  test(title, () => {
    const root = build()
    try {
      corrupt(root)
      assert.deepStrictEqual(failures(root), [expected])
    } finally { Fs.rmSync(root, { recursive: true, force: true }) }
  })
}

test('a missing edition output is caught', () => {
  const root = build()
  try {
    Fs.rmSync(Path.join(root, 'SUMMARY.md'))
    Fs.rmSync(Path.join(root, 'docs/slidev'), { recursive: true })
    const failed = failures(root)
    assert.ok(failed.includes('edition summary emits SUMMARY.md'), JSON.stringify(failed))
    assert.ok(failed.includes('edition presentation emits docs/slidev'), JSON.stringify(failed))
  } finally { Fs.rmSync(root, { recursive: true, force: true }) }
})

// An edition the project did not install must not be asserted: the check set
// follows the model, so a two-edition project is checked as a two-edition
// project rather than failing for the third.
test('only the editions the model declares are checked', () => {
  const root = build()
  try {
    const file = Path.join(root, '.sdk/model/sdk.json')
    const model = JSON.parse(Fs.readFileSync(file, 'utf8'))
    delete model.main.kit.doc.edition.presentation
    Fs.writeFileSync(file, JSON.stringify(model))
    Fs.rmSync(Path.join(root, 'docs/slidev'), { recursive: true })
    assert.deepStrictEqual(failures(root), [])
    const names = checkDocs(root).checks.map(c => c.name)
    assert.ok(!names.some(n => n.includes('presentation')), 'presentation must not be checked')
  } finally { Fs.rmSync(root, { recursive: true, force: true }) }
})

test('an uncompiled model is reported rather than crashing', () => {
  const root = build()
  try {
    Fs.rmSync(Path.join(root, '.sdk/model/sdk.json'))
    assert.deepStrictEqual(failures(root), ['model compiled'])
  } finally { Fs.rmSync(root, { recursive: true, force: true }) }
})
