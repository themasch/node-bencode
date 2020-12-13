var bencode = require('..')
var data = require('./data.js')
var test = require('tape').test
var Buffer = require('safe-buffer').Buffer

test('bencode#encode()', function (t) {
  // prevent the warning showing up in the test
  bencode.encode._floatConversionDetected = true

  t.test('should always return a Buffer', function (t) {
    t.plan(5)
    t.ok(Buffer.isBuffer(bencode.encode({})), 'its a buffer for empty dicts')
    t.ok(Buffer.isBuffer(bencode.encode('test')), 'its a buffer for strings')
    t.ok(Buffer.isBuffer(bencode.encode([3, 2])), 'its a buffer for lists')
    t.ok(Buffer.isBuffer(bencode.encode({ 'a': 'b', 3: 6 })), 'its a buffer for big dicts')
    t.ok(Buffer.isBuffer(bencode.encode(123)), 'its a buffer for numbers')
  })

  t.test('should sort dictionaries', function (t) {
    t.plan(1)
    var data = { string: 'Hello World', integer: 12345 }
    t.equal(bencode.encode(data).toString(), 'd7:integeri12345e6:string11:Hello Worlde')
  })

  t.test('should force keys to be strings', function (t) {
    t.plan(1)
    var data = {
      12: 'Hello World',
      34: 12345
    }
    t.equal(bencode.encode(data).toString(), 'd2:1211:Hello World2:34i12345ee')
  })

  t.test('should encode a Map as dictionary', function (t) {
    t.plan(1)
    var data = new Map([
      [ 12, 'Hello World' ],
      [ '34', 12345 ],
      [ Buffer.from('buffer key'), Buffer.from('buffer value') ]
    ])
    t.equal(bencode.encode(data).toString(), 'd2:1211:Hello World2:34i12345e10:buffer key12:buffer valuee')
  })

  t.test('should be able to encode a positive integer', function (t) {
    t.plan(1)
    t.equal(bencode.encode(123).toString(), 'i123e')
  })
  t.test('should be able to encode a negative integer', function (t) {
    t.plan(1)
    t.equal(bencode.encode(-123).toString(), 'i-123e')
  })
  t.test('should be able to encode a positive float (as int)', function (t) {
    t.plan(1)
    t.equal(bencode.encode(123.5).toString(), 'i123e')
  })
  t.test('should be able to encode a negative float (as int)', function (t) {
    t.plan(1)
    t.equal(bencode.encode(-123.5).toString(), 'i-123e')
  })

  t.test('should be able to safely encode numbers between -/+ 2 ^ 53 (as ints)', function (t) {
    var JAVASCRIPT_INT_BITS = 53
    var MAX_JAVASCRIPT_INT = Math.pow(2, JAVASCRIPT_INT_BITS)

    t.plan((JAVASCRIPT_INT_BITS - 1) * 6 + 3)
    t.equal(bencode.encode(0).toString(), 'i' + 0 + 'e')

    for (var exp = 1; exp < JAVASCRIPT_INT_BITS; ++exp) {
      var val = Math.pow(2, exp)
      // try the positive and negative
      t.equal(bencode.encode(val).toString(), 'i' + val + 'e')
      t.equal(bencode.encode(-val).toString(), 'i-' + val + 'e')

      // try the value, one above and one below, both positive and negative
      var above = val + 1
      var below = val - 1

      t.equal(bencode.encode(above).toString(), 'i' + above + 'e')
      t.equal(bencode.encode(-above).toString(), 'i-' + above + 'e')

      t.equal(bencode.encode(below).toString(), 'i' + below + 'e')
      t.equal(bencode.encode(-below).toString(), 'i-' + below + 'e')
    }
    t.equal(bencode.encode(MAX_JAVASCRIPT_INT).toString(), 'i' + MAX_JAVASCRIPT_INT + 'e')
    t.equal(bencode.encode(-MAX_JAVASCRIPT_INT).toString(), 'i-' + MAX_JAVASCRIPT_INT + 'e')
  })
  t.test('should be able to encode a previously problematice 64 bit int', function (t) {
    t.plan(1)
    t.equal(bencode.encode(2433088826).toString(), 'i' + 2433088826 + 'e')
  })
  t.test('should be able to encode a negative 64 bit int', function (t) {
    t.plan(1)
    t.equal(bencode.encode(-0xffffffff).toString(), 'i-' + 0xffffffff + 'e')
  })
  t.test('should be able to encode a positive 64 bit float (as int)', function (t) {
    t.plan(1)
    t.equal(bencode.encode(0xffffffff + 0.5).toString(), 'i' + 0xffffffff + 'e')
  })
  t.test('should be able to encode a negative 64 bit float (as int)', function (t) {
    t.plan(1)
    t.equal(bencode.encode(-0xffffffff - 0.5).toString(), 'i-' + 0xffffffff + 'e')
  })
  t.test('should be able to encode a string', function (t) {
    t.plan(2)
    t.equal(bencode.encode('asdf').toString(), '4:asdf')
    t.equal(bencode.encode(':asdf:').toString(), '6::asdf:')
  })
  t.test('should be able to encode a unicode string', function (t) {
    t.plan(2)
    t.deepEqual(bencode.encode(data.binStringData.toString()), data.binResultData)
    t.deepEqual(bencode.encode(data.binStringData.toString()), data.binResultData)
  })
  t.test('should be able to encode a buffer', function (t) {
    t.plan(2)
    t.equal(bencode.encode(Buffer.from('asdf')).toString(), '4:asdf')
    t.equal(bencode.encode(Buffer.from(':asdf:')).toString(), '6::asdf:')
  })
  t.test('should be able to encode an array', function (t) {
    t.plan(2)
    t.equal(bencode.encode([32, 12]).toString(), 'li32ei12ee')
    t.equal(bencode.encode([':asdf:']).toString(), 'l6::asdf:e')
  })
  t.test('should be able to encode a Set as a list', function (t) {
    t.plan(2)
    t.equal(bencode.encode(new Set([32, 12])).toString(), 'li32ei12ee')
    t.equal(bencode.encode(new Set([':asdf:'])).toString(), 'l6::asdf:e')
  })
  t.test('should be able to encode an object', function (t) {
    t.plan(3)
    t.equal(bencode.encode({ 'a': 'bc' }).toString(), 'd1:a2:bce')
    t.equal(bencode.encode({ 'a': '45', 'b': 45 }).toString(), 'd1:a2:451:bi45ee')
    t.equal(bencode.encode({ 'a': Buffer.from('bc') }).toString(), 'd1:a2:bce')
  })

  t.test('should encode new Number(1) as number', function (t) {
    var data = new Number(1) // eslint-disable-line
    var result = bencode.decode(bencode.encode(data))
    var expected = 1
    t.plan(1)
    t.strictEqual(result, expected)
  })

  t.test('should encode new Boolean(true) as number', function (t) {
    var data = new Boolean(true) // eslint-disable-line
    var result = bencode.decode(bencode.encode(data))
    var expected = 1
    t.plan(1)
    t.strictEqual(result, expected)
  })

  t.test('should encode Uint8Array as buffer', function (t) {
    var data = new Uint8Array([ 1, 2, 3, 4, 5, 6, 7, 8, 9 ])
    var result = bencode.decode(bencode.encode(data))
    var expected = Buffer.from(data.buffer)
    t.plan(1)
    t.deepEqual(result, expected)
  })

  t.test('should encode Uint32Array as buffer', function (t) {
    var data = new Uint32Array([ 0xF, 0xFF, 0xFFF, 0xFFFF, 0xFFFFF, 0xFFFFFF, 0xFFFFFFF, 0xFFFFFFFF ])
    var result = bencode.decode(bencode.encode(data))
    var expected = Buffer.from(data.buffer)
    t.plan(1)
    t.deepEqual(result, expected)
  })

  t.test('should encode ArrayBuffer as buffer', function (t) {
    var data = new Uint32Array([ 0xF, 0xFF, 0xFFF, 0xFFFF, 0xFFFFF, 0xFFFFFF, 0xFFFFFFF, 0xFFFFFFFF ])
    var result = bencode.decode(bencode.encode(data.buffer))
    var expected = Buffer.from(data.buffer)
    t.plan(1)
    t.deepEqual(result, expected)
  })

  t.test('should encode Float32Array as buffer', function (t) {
    var data = new Float32Array([ 1.2, 2.3, 3.4, 4.5, 5.6, 6.7, 7.8, 8.9, 9.0 ])
    var result = bencode.decode(bencode.encode(data))
    var expected = Buffer.from(data.buffer)
    t.plan(1)
    t.deepEqual(result, expected)
  })

  t.test('should encode DataView as buffer', function (t) {
    var data = new Uint8Array([ 1, 2, 3, 4, 5, 6, 7, 8, 9 ])
    var view = new DataView(data.buffer)
    var result = bencode.decode(bencode.encode(view))
    var expected = Buffer.from(data.buffer)
    t.plan(1)
    t.deepEqual(result, expected)
  })

  t.test('should encode Uint8Array subarray properly', function (t) {
    var data = new Uint8Array([ 1, 2, 3, 4, 5, 6, 7, 8, 9 ])
    var subData = data.subarray(5)
    var result = bencode.decode(bencode.encode(subData))
    var expected = Buffer.from(subData.buffer, subData.byteOffset, subData.byteLength)
    t.plan(1)
    t.deepEqual(result, expected)
  })

  t.test('should encode large numbers with full digits', function (t) {
    t.plan(1)
    var data = 340282366920938463463374607431768211456
    t.equal(bencode.encode(data).toString(), 'i340282366920938463463374607431768211456e')
  })
})
