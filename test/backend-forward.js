'use strict'

const tls = require('tls')
const net = require('net')
const Backend = require('sni-passthrough-backend')
const Frontend = require('../')
const {readFileSync: read} = require('fs')
const {strictEqual, ok} = require('assert')

const BACKEND_PORT     = 10444
const FRONTEND_PORT    = 10443

const CERT = read('cert.pem')
const KEY  = read('key.pem')

const TEST_MSG = '===SOCKET DATA==='

/*
 * Node has problem with loopback's remoteAddress
 * IPv4 127.0.0.1 will be returned as ::ffff:127.0.0.1
 * This test uses IPv6 Loopback to avoid this problem
 */
describe('backend forward', function(){
    let frontend, backend
    before(function(next){
        backend = Backend.createServer({
            cert: CERT,
            key:  KEY
        }).listen(BACKEND_PORT, next)
    })
    before(function(next){
        frontend = Frontend.createServer({
            sni: {
                '*': '> 127.0.0.1:'+BACKEND_PORT
            }
        })
        frontend.listen(FRONTEND_PORT, next)
    })

    it('forwards to backend', function(done){
        let socket = tls.connect({
            host: '::1',
            port: FRONTEND_PORT,
            rejectUnauthorized: false
        }, ()=>{
            socket.write(TEST_MSG)
            socket.end()
        })

        backend.once('secureConnection', (conn)=>{
            strictEqual( conn.remoteAddress, socket.localAddress )
            strictEqual( conn.remotePort,    socket.localPort )
            strictEqual( conn.remoteFamily,  'IPv6' )
            conn.once('data', (data)=>{
                strictEqual(data.toString(), TEST_MSG)
            })
            conn.on('end', ()=>{
                conn.end()
                done()
            })
        })
    })

    after(function(){
        backend.close()
        frontend.close()
    })
})
