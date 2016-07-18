'use strict'

const {connect} = require('net')
const {createHeader} = require('../../header')

module.exports = function BackendForward(connOpts) {
    return (conn) => {
        let payload = {
            family:  conn.remoteFamily,
            address: conn.remoteAddress,
            port:    conn.remotePort
        }
        let socket = connect(connOpts, ()=>{
            socket.write(createHeader(payload))
            conn.pipe(socket)
            socket.pipe(conn)
        })
        socket.on('error', ()=>conn.destroy() )
    }
}
