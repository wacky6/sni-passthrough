'use strict'

module.exports = {
    createHeader(payload) {
        let payloadStr = JSON.stringify(payload)
        let byteLen = Buffer.byteLength(payloadStr)
        let buf = Buffer.allocUnsafe(5+byteLen)
        // magic
        buf[0] = 0xAE
        buf[1] = 0x53
        // version
        buf[2] = 0xFF
        // payload leng
        buf.writeUInt16BE(byteLen, 3)
        // write payload buffer
        buf.write(payloadStr, 5)

        return buf
    }
}
