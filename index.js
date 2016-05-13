'use strict'

const net      = require('net')
    , sniParse = require('./lib/sni-parse')
    , isFunction = require('util').isFunction
    , isObject   = require('util').isObject
    , isNull     = require('util').isNull
    , isString   = require('util').isString



function parseDestination(decl) {
    if ( isString(decl) ) {
        let pos = decl.search(/:(\d+)$/)

        let hostStr = decl.substring(0, pos)
          , portStr = decl.substring(pos+1)
          , family  = hostStr.match(/^\[[^]]\]$/) ? 6 : 4
          , host    = family === 6 ? hostStr.slice(1, -1) : hostStr
          , port    = parseInt( portStr )

        if ( ''+port!==portStr || port>65535 || port<1 )
            throw new Error(`Invalid Port: ${portStr}`)

        return {
            family: family,
            host:   host,
            port:   port
        }
    }

    if ( isObject(decl) )
        return decl

    if ( isNull(decl) )
        return null

    throw new Error(`Invalid destination: ${decl}`)
}



function createLookupFunction(opts) {
    if ( isFunction(opts.sni) )
        return opts.sni

    if ( isObject(opts.sni) ) {
        let lookup = {}

        for (let hostname in opts.sni)
            lookup[hostname] = parseDestination(opts.sni[hostname])

        return (hostname) => {
            if (hostname in lookup)
                return lookup[hostname]
            else
                return lookup['*']
        }
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
            if ( !dest ) {
                conn.destroy()
            }else{
                server.emit('forward', hostname, {host: dest.host, port: dest.port})
                let socket = net.connect(
                    dest,
                    ()=>{
                        socket.write(buf)
                        socket.pipe(conn)
                        conn.pipe(socket)
                    }
                )
                .on('error', (err)=>{
                    conn.destroy()
                })
            }
        } )
    } )

    return server
}

module.exports = {
    createServer: createServer
}
