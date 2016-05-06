'use strict'

const net      = require('net')
    , sniParse = require('./lib/sni-parse')

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

/* createServer({
 *     sni: {
 *         'hostname': 'hostname:port',
 *         ...
 *     },
 *     fallback: 'hostname:port',
 *     // options accepted by net.createServer
 * }) => net.Server
 *
 * wildcard / RegExp not supported
 */
function createServer(opts) {
    let sni      = opts.sni
    let fallback = opts.fallback
    let lookup   = {}

    if (fallback!==undefined)
        fallback = parseAddressPort(fallback)

    for (let hostname in sni)
        lookup[hostname] = parseAddressPort(sni[hostname])

    let server = net.createServer((conn)=>{
        conn.once('data', (buf)=>{

            let dest
            let hostname = sniParse(buf)

            if (hostname === null)
                dest = fallback
            else
                dest = lookup[hostname]

            server.emit('forward', hostname, dest ? dest : {host:null, port:0})

            if (dest===undefined) {
                conn.destroy()
            }else{
                let socket = net.connect(
                    dest.port,
                    dest.host,
                    ()=>{
                        socket.write(buf)
                        socket.pipe(conn)
                        conn.pipe(socket)
                        socket.on('error', (err)=>conn.destroy() )
                    }
                )
            }

        })
        .on('error', (err)=>{} )
    })

    return server
}

module.exports = {
    createServer: createServer
}
