/**
 * Decoder
 * @return {Decoder}
 */
function Decoder () {
  if (!(this instanceof Decoder)) {
    return new Decoder()
  }

  this.bytes = 0
  this.position = 0
  this.data = null
  this.encoding = null
}

/**
 * Decoder prototype
 * @type {Object}
 */
Decoder.prototype = {

  constructor: Decoder,

  use: function (type, fn) {
    this[type] = fn
  },

  decode: function (data, start, end, encoding) {
    if (typeof start !== 'number' && encoding == null) {
      encoding = start
      start = undefined
    }

    if (typeof end !== 'number' && encoding == null) {
      encoding = end
      end = undefined
    }

    this.position = 0
    this.encoding = encoding || null

    this.data = !(Buffer.isBuffer(data))
      ? new Buffer(data)
      : data.slice(start, end)

    this.bytes = this.data.length

    return this.next()
  },

  next: function () {
    switch (this.data[this.position]) {
      case 0x64: return this.object()
      case 0x6C: return this.array()
      case 0x69: return this.number()
      default: return this.buffer()
    }
  },

  find: function (chr) {
    var i = this.position
    var c = this.data.length
    var d = this.data

    while (i < c) {
      if (d[i] === chr) return i
      i++
    }

    throw new Error(
      'Invalid data: Missing delimiter "' + String.fromCharCode(chr) +
      '" [0x' + chr.toString(16) + ']'
    )
  },

  object: function () {
    this.position++

    var dict = {}

    while (this.data[this.position] !== 0x65) {
      dict[this.buffer()] = this.next()
    }

    this.position++

    return dict
  },

  array: function () {
    this.position++

    var lst = []

    while (this.data[this.position] !== 0x65) {
      lst.push(this.next())
    }

    this.position++

    return lst
  },

  number: function () {
    var end = this.find(0x65)
    var number = this.data.toString('ascii', this.position + 1, end)

    this.position += end + 1 - this.position

    return parseInt(number, 10)
  },

  buffer: function () {
    var sep = this.find(0x3A)
    var length = parseInt(this.data.toString('ascii', this.position, sep), 10)
    var end = ++sep + length

    this.position = end

    return this.encoding
      ? this.data.toString(this.encoding, sep, end)
      : this.data.slice(sep, end)
  }

}

// Exports
module.exports = Decoder
