'use strict'

const {isString, isObject} = require('./types')

/*
 * parseHostname(decl)
 * decl:
 *     host:   '192.168.1.100:443' or '[2002:abcd::1]:443'
 *     object: pass directly to net.connect
 * returns an object that can be used with net.connect
 * throws decl is neither host string or object
 */
module.exports = function parseHost(decl) {
    if (isString(decl)) {
        let pos = decl.search(/:(\d+)$/)

        let hostStr = decl.substring(0, pos)
          , portStr = decl.substring(pos+1)
          , family  = hostStr.match(/^\[[0-9a-fA-F:]+\]$/) ? 6 : (hostStr.match(/^(\d+\.){3}(\d+)$/) ? 4 : undefined)
          , host    = family === 6 ? hostStr.slice(1, -1) : hostStr
          , port    = parseInt( portStr )

        if ( ''+port!==portStr || port>65535 || port<1 )
            throw new Error(`Invalid port: ${portStr}`)

        return {
            family: family,
            host:   host,
            port:   port
        }
    }

    if (isObject(decl))
        return decl

    throw new Error(`Invalid decleration: ${decl}`)
}
