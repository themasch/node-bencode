/**
 * Encoder
 * @return {Encoder}
 */
function Encoder () {
  if (!(this instanceof Encoder)) {
    return new Encoder()
  }

  this.bytes = -1
  this._types = Encoder.types.slice()
  this._floatConversionDetected = false
}

Encoder.types = [
  function isString (value) { return typeof value === 'string' ? 'string' : void 0 },
  function isNumber (value) { return typeof value === 'number' ? 'number' : void 0 },
  function isBoolean (value) { return typeof value === 'boolean' ? 'boolean' : void 0 },
  function isBuffer (value) { return Buffer.isBuffer(value) ? 'buffer' : void 0 },
  function isArray (value) { return Array.isArray(value) ? 'array' : void 0 },
  function isObject (value) { return typeof value === 'object' ? 'object' : void 0 }
]

var buffE = new Buffer('e')
var buffD = new Buffer('d')
var buffL = new Buffer('l')

/**
 * Encoder prototype
 * @type {Object}
 */
Encoder.prototype = {

  constructor: Encoder,

  use: function (type, fn, check) {
    this[type] = fn
    this._types.unshift(function (value) {
      return check(value) ? type : void 0
    })
  },

  encode: function (data, buffer, offset) {
    var buffers = []
    var result = null

    this._encode(buffers, data)
    result = Buffer.concat(buffers)
    this.bytes = result.length

    if (Buffer.isBuffer(buffer)) {
      result.copy(buffer, offset)
      return buffer
    }

    return result
  },

  _typeof: function (value) {
    var type
    var len = this._types.length

    for (var i = 0; i < len; i++) {
      type = this._types[i](value)
      if (type) return type
    }
  },

  _encode: function (buffers, data) {
    var type = this._typeof(data)
    this[type](buffers, data)
  },

  buffer: function (buffers, data) {
    buffers.push(new Buffer(data.length + ':'))
    buffers.push(data)
  },

  string: function (buffers, data) {
    buffers.push(new Buffer(Buffer.byteLength(data) + ':' + data))
  },

  boolean: function (buffers, data) {
    this.number(buffers, data ? 1 : 0)
  },

  number: function (buffers, data) {
    var maxLo = 0x80000000
    var hi = (data / maxLo) << 0
    var lo = (data % maxLo) << 0
    var val = hi * maxLo + lo

    buffers.push(new Buffer('i' + val + 'e'))

    if (val !== data && !this._floatConversionDetected) {
      this._floatConversionDetected = true
      console.warn(
        'WARNING: Possible data corruption detected with value "' + data + '":',
        'Bencoding only defines support for integers, value was converted to "' + val + '"'
      )
      console.trace()
    }
  },

  object: function (buffers, data) {
    buffers.push(buffD)

    var j = 0
    var k
    // fix for issue #13 - sorted dicts
    var keys = Object.keys(data).sort()
    var kl = keys.length

    for (; j < kl; j++) {
      k = keys[j]
      this.string(buffers, k)
      this._encode(buffers, data[k])
    }

    buffers.push(buffE)
  },

  array: function (buffers, data) {
    var i = 0
    var c = data.length
    buffers.push(buffL)

    for (; i < c; i++) {
      this._encode(buffers, data[i])
    }

    buffers.push(buffE)
  }

}

// Exports
module.exports = Encoder
