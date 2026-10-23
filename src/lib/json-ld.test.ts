import assert from 'node:assert/strict'
import test from 'node:test'
import { serializeJsonLd } from './json-ld'

test('JSON-LD escapes script-breaking and HTML-sensitive characters', () => {
  const serialized = serializeJsonLd({
    name: '</script><script>alert("xss")</script>',
    separator: '\u2028\u2029',
  })

  assert.equal(serialized.includes('</script>'), false)
  assert.equal(serialized.includes('<script>'), false)
  assert.match(serialized, /\\u003c\/script\\u003e/)
  assert.match(serialized, /\\u2028\\u2029/)
})
