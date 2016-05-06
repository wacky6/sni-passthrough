'use strict'

/* Modified from: https://github.com/jornane/sni/blob/binparser/index.js */

/**
 * Extract the SNI from a Buffer.
 * @param  {Buffer}      buf
 * @return {String|null}
 * @see http://stackoverflow.com/a/21926971/951387
 */

module.exports = (buf) => {
    try{
        let skip = buf.readInt8(43)               // Session ID length
        skip += buf.readInt16BE(skip+44)          // Cipher Suites Length
        skip += buf.readInt8(skip+46)             // Compression Methods Length

        let end = 49 + skip + buf.readInt16BE(skip+47)  // Extensions Length

        // Skip past extension != Server Name
        while(buf.readInt16BE(skip+49) !== 0) {
            skip += buf.readInt16BE(skip+51)
            skip += 4
            if (skip + 4 > end) return null;
        }

        // Skip past Server Name Type != host_name
        while(buf.readInt8(skip+55) !== 0) {
            skip += buf.readInt16BE(skip+56)
            skip += 3;
            if (skip + 3 > end) return null;
        }

        let len = buf.readInt16BE(skip+56)
        return buf.toString('utf8', skip+58, skip+58+len)

    }catch(e){
        return null
    }
}
