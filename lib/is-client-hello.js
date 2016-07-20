'use strict'

/*
 * NOTE: SSLv3 fails the check, this is intended.
 */
module.exports = function isClientHello(buf) {
    return (
            buf[0] === 22        // Handshake,    Record type
         && buf[1] === 0x03      // TLSv1,        TLS Major Version
         && buf[5] === 0x01      // Client Hello
    )
}
