'use strict'

const parseSNI = require('./lib/parse-sni')
const parseHost = require('./lib/parse-host')
const isHandshakeRecord = require('./lib/is-handshake-record')
const {isFunction, isObject} = require('./lib/types')
const {Normal, Backend, Drop} = require('./lib/forward')
const {createServer} = require('net')

function createForward(destDecl) {
    if (destDecl === null)
        return Drop()
    if (destDecl.startsWith('>'))
        return Backend( parseHost(destDecl.slice(1).trim()) )
    else
        return Normal( parseHost(destDecl) )
}


function createLookup(opts) {
    if ( isFunction(opts.sni) )
        return opts.sni

    if ( isObject(opts.sni) ) {
        let lookup = {}

        for (let hostname in opts.sni)
            lookup[hostname] = createForward(opts.sni[hostname])

        // default: Drop for catch-all address
        if ( !lookup['*'] )
            lookup['*'] = createForward(null)

        return (hostname) => (lookup[hostname] || lookup['*'])
    }

    throw new Error('opts.sni must be object or function')
}


/* createServer({
 *     sni: {
 *         'hostname': 'hostname:port',
 *         ...
 *         '*':        'fallback-hostname:port'
 *     },
 *     // options accepted by net.createServer
 * }) => net.Server
 */
function createSNIPassthroughServer(opts) {
    const getForwardFunc = createLookup(opts)

    return createServer( (conn)=>{
        conn
        .on('error', (err)=>undefined )
        .once('data', (buf)=>{
            conn.pause()
            conn.unshift(buf)

            if ( !isHandshakeRecord(buf) )
                return conn.destroy()

            let hostname = parseSNI(buf)
            let forward  = getForwardFunc(hostname)

            forward(conn)
        } )
    } )
}


module.exports = {
    createServer: createSNIPassthroughServer
}
