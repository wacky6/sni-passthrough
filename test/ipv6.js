'use strict'

const tls = require('tls')
const net = require('net')
const Frontend = require('../')
const {readFileSync: read} = require('fs')
const {strictEqual, ok} = require('assert')

const BACKEND_PORT     = 10444
const SNI_BACKEND_PORT = 10445
const FRONTEND_PORT    = 10443

const CERT = read('cert.pem')
const KEY  = read('key.pem')

const TEST_MSG = '===SOCKET DATA==='

describe('pure ipv6', function(){
    let frontend, backend
    before(function(next){
        backend = tls.createServer({
            cert: CERT,
            key:  KEY
        }).listen(BACKEND_PORT, next)
    })
    before(function(next){
        frontend = Frontend.createServer({
            sni: {
                '*': '[::1]:'+BACKEND_PORT,
            }
        })
        frontend.listen(FRONTEND_PORT, next)
    })

    it('forwards IPv6 -> IPv6 -> IPv6', function(done){
        backend.once('secureConnection', (conn)=>{
            conn.once('data', (data)=>{
                strictEqual(data.toString(), TEST_MSG)
            })
            conn.on('end', ()=>{
                conn.end()
                done()
            })
        })
        let socket = tls.connect({
            family: 6,
            host:   '::1',
            port:   FRONTEND_PORT,
            rejectUnauthorized: false,
        }, ()=>{
            socket.write(TEST_MSG)
            socket.end()
        })
    })

    after(function(){
        backend.close()
        frontend.close()
    })
})
