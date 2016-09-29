/**
 * @constructor
 * @return {Bencode}
 */
function Bencode () {
  if (!(this instanceof Bencode)) {
    return new Bencode()
  }

  this.encoder = new Bencode.Encoder()
  this.decoder = new Bencode.Decoder()
}

Bencode.Encoder = require('./encoder')
Bencode.Decoder = require('./decoder')

var encoder = new Bencode.Encoder()
var decoder = new Bencode.Decoder()

Bencode.encode = function (data, buffer, offset) {
  var result = encoder.encode(data, buffer, offset)
  Bencode.encode.bytes = encoder.bytes
  return result
}

Bencode.decode = function (data, start, end, encoding) {
  var result = decoder.decode(data, start, end, encoding)
  Bencode.decode.bytes = decoder.bytes
  return result
}

/**
 * Determines the amount of bytes
 * needed to encode the given value
 * @param  {Object|Array|Buffer|String|Number|Boolean} value
 * @return {Number} byteCount
 */
Bencode.byteLength = Bencode.encodingLength = function (value) {
  return Bencode.encode(value).length
}

/**
 * Bencode prototype
 * @type {Object}
 */
Bencode.prototype = {

  constructor: Bencode,

  encode: function (data, buffer, offset) {
    var result = this.encoder.encode(data, buffer, offset)
    this.encode.bytes = this.encoder.bytes
    return result
  },

  decode: function (data, start, end, encoding) {
    var result = this.decoder.decode(data, start, end, encoding)
    this.decode.bytes = this.decoder.bytes
    return result
  },

  use: function (customType, type, fns) {
    this.encoder.use(customType, fns.encode, fns.check)
    this.decoder.use(type, fns.decode)
    return this
  },

  byteLength: function (value) {
    return this.encode(value).length
  },

  encodingLength: function (value) {
    return this.byteLength(value)
  }

}

// Exports
module.exports = Bencode
