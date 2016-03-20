var test = require('tape').test
var bencode = require('../lib')
var data = require('./data')

test('should be able to decode an integer', function (t) {
  t.equal(bencode.decode('i123e', 'utf8'), 123)
  t.equal(bencode.decode('i-123e', 'utf8'), -123)
  t.end()
})

test('should be able to decode a float (as int)', function (t) {
  t.equal(bencode.decode('i12.3e', 'utf8'), 12)
  t.equal(bencode.decode('i-12.3e', 'utf8'), -12)
  t.end()
})

test('should be able to decode a string', function (t) {
  t.equal(bencode.decode('5:asdfe', 'utf8'), 'asdfe')
  t.deepEqual(bencode.decode(data.binResultData.toString(), 'utf8'), data.binStringData.toString())
  t.end()
})

test('should be able to decode \'binary keys\'', function (t) {
  var decoded = bencode.decode(data.binKeyData, 'utf8')
  t.ok(decoded.files.hasOwnProperty(data.binKeyName.toString('utf8')))
  t.end()
})

test('should be able to decode a dictionary', function (t) {
  t.deepEqual(
    bencode.decode('d3:cow3:moo4:spam4:eggse', 'utf8'),
    { cow: 'moo', spam: 'eggs' }
  )

  t.deepEqual(
    bencode.decode('d4:spaml1:a1:bee', 'utf8'),
    { spam: [ 'a', 'b' ] }
  )

  t.deepEqual(
    bencode.decode('d9:publisher3:bob17:publisher-webpage15:www.example.com18:publisher.location4:homee', 'utf8'),
    { 'publisher': 'bob', 'publisher-webpage': 'www.example.com', 'publisher.location': 'home' }
  )

  t.end()
})

test('should be able to decode a list', function (t) {
  t.deepEqual(bencode.decode('l4:spam4:eggse', 'utf8'), [ 'spam', 'eggs' ])
  t.end()
})

test('should return the correct type', function (t) {
  t.ok(typeof bencode.decode('4:öö', 'utf8') === 'string')
  t.end()
})

test('should be able to decode stuff in dicts (issue #12)', function (t) {
  var someData = {
    string: 'Hello World',
    integer: 12345,
    dict: { key: 'This is a string within a dictionary' },
    list: [ 1, 2, 3, 4, 'string', 5, {} ]
  }
  var result = bencode.encode(someData)
  var dat = bencode.decode(result, 'utf8')
  t.equal(dat.integer, 12345)
  t.deepEqual(dat.string, 'Hello World')
  t.deepEqual(dat.dict.key, 'This is a string within a dictionary')
  t.deepEqual(dat.list, [ 1, 2, 3, 4, 'string', 5, {} ])
  t.end()
})