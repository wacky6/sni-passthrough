'use strict'

const tls = require('tls')
const net = require('net')
const http = require('http')
const Frontend = require('../')
const {readFileSync: read} = require('fs')
const {strictEqual, ok} = require('assert')

const BACKEND_PORT     = 10444
const SNI_BACKEND_PORT = 10445
const FRONTEND_PORT    = 10443

const CERT = read('cert.pem')
const KEY  = read('key.pem')

const TEST_MSG = '===SOCKET DATA==='

describe('normal forward', function(){
    let frontend, backend, sni_backend
    before(function(next){
        sni_backend = tls.createServer({
            cert: CERT,
            key:  KEY
        }).listen(SNI_BACKEND_PORT, next)
    })
    before(function(next){
        backend = tls.createServer({
            cert: CERT,
            key:  KEY
        }).listen(BACKEND_PORT, next)
    })
    before(function(next){
        frontend = Frontend.createServer({
            sni: {
                'sni':  '127.0.0.1:'+SNI_BACKEND_PORT,
                '*':    '127.0.0.1:'+BACKEND_PORT,
                'drop': null
            }
        })
        frontend.listen(FRONTEND_PORT, next)
    })

    it('fails for non Client-Hello', function(done){
        http.get('http://127.0.0.1:'+FRONTEND_PORT+'/', (res)=>{})
        .on('error', (err)=>{
            ok(err)
            done()
        })
    })

    it('forwards to SNI address', function(done){
        sni_backend.once('secureConnection', (conn)=>{
            conn.once('data', (data)=>{
                strictEqual(data.toString(), TEST_MSG)
            })
            conn.on('end', ()=>{
                conn.end()
                done()
            })
        })
        let socket = tls.connect({
            host: '127.0.0.1',
            port: FRONTEND_PORT,
            rejectUnauthorized: false,
            servername: 'sni'
        }, ()=>{
            socket.write(TEST_MSG)
            socket.end()
        })
    })

    it('forwards to catch-all address', function(done){
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
            host: '127.0.0.1',
            port: FRONTEND_PORT,
            rejectUnauthorized: false
        }, ()=>{
            socket.write(TEST_MSG)
            socket.end()
        })
    })

    it('drops for null address, response TLS Alert', function(done){
        let socket = tls.connect({
            host: '127.0.0.1',
            port: FRONTEND_PORT,
            rejectUnauthorized: false,
            servername: 'drop'
        }, ()=>{
            socket.write(TEST_MSG)
            socket.end()
        })
        socket.on('error', (err)=>{
            // Assume node uses OpenSSL, try to match err.message
            // This is a native error, no more information is provided
            ok(err.message.match(/access denied/i), 'Access denied Alert')
            done()
        })
    })

    after(function(){
        backend.close()
        sni_backend.close()
        frontend.close()
    })
})
