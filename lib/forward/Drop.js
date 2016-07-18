'use strict'

const TLS_RECORD_ALERT = 21
const TLS_VERSION_MAJOR = 3
const TLS_VERSION_MINOR = 3

module.exports = function DropConnection() {
    return (conn) => {
        // Shutdown gracefully. Send TLS Alert.
        // check TLS version
        let buf = conn.read(2)
        let majorVer = buf[0]
        let minorVer = buf[1]

        // create TLS Alert Record
        let alertRecord = Buffer.allocUnsafe(7)
        alertRecord.writeUInt8(21, 0)        // Alert,         Record Type
        alertRecord.writeUInt16BE(0x0303, 1) // TLSv1.2,       Protocol Version
        alertRecord.writeUInt16BE(2, 3)      //                Length
        alertRecord.writeUInt8(2, 5)         // Fatal,         Alert Level
        alertRecord.writeUInt8(49, 6)        // Access Denied, Alert Description

        conn.write(alertRecord)
        conn.end()
    }
}
