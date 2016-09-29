var BigNumber = require('bignumber.js')
var bencode = module.exports

bencode.encode = require('../lib/encode')
bencode.decode = require('../lib/decode')

bencode.encode.number = function (buffers, data) {
  buffers.push(new Buffer('i' + data.toString() + 'e'))
}

bencode.decode.integer = function () {
  var end = bencode.decode.find(0x65)
  var number = bencode.decode.data.toString('ascii', bencode.decode.position + 1, end)

  bencode.decode.position += end + 1 - bencode.decode.position

  return new BigNumber(number, 10)
}
