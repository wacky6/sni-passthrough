'use strict'

const {connect} = require('net')

module.exports = function NormalForward(connOpts) {
    return (conn) => {
        let socket = connect(connOpts, ()=>{
            conn.pipe(socket)
            socket.pipe(conn)
        })
        socket.on('error', ()=>conn.destroy() )
    }
}
