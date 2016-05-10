'use strict'

const net      = require('net')
    , sniParse = require('./lib/sni-parse')
    , floor    = Math.floor
    , isFunction = require('util').isFunction
    , isObject   = require('util').isObject



function parseAddressPort(str) {
    let pos = str.search(/:(\d+)$/)

    let host    = str.substring(0, pos)
      , portStr = str.substring(pos+1)
      , port    = parseInt( portStr )

    if ( ''+port!==portStr || port>65535 || port<1 )
        throw new Error(`Invalid Port: ${portStr}`)

    return {
        host: host,
        port: port
    }
}



function createLookupFunction(opts) {
    if ( isFunction(opts.sni) )
        return opts.sni

    if ( isObject(opts.sni) ) {
        let lookup = {}

        for (let hostname in opts.sni)
            lookup[hostname] = parseAddressPort(opts.sni[hostname])

        return (hostname) => lookup[hostname || '*'] || lookup['*']
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
function createServer(opts) {
    const lookupFunc = createLookupFunction(opts)

    let server = net.createServer( (conn)=>{
        conn
        .on('error', (err)=>undefined )
        .once('data', (buf)=>{
            let hostname = sniParse(buf)
            let dest = lookupFunc(hostname)
            if (dest === undefined) {
                conn.destroy()
            }else{
                server.emit('forward', hostname, dest)
                let socket = net.connect(
                    dest.port,
                    dest.host,
                    ()=>{
                        socket.on('error', (err)=>conn.destroy() )
                        socket.write(buf)
                        socket.pipe(conn)
                        conn.pipe(socket)
                    }
                )
            }
        } )
    } )

    return server
}

module.exports = {
    createServer: createServer
}
