'use strict'

const parseHost = require('../lib/parse-host')
const {deepStrictEqual, throws} = require('assert')

describe('parseHost', function(){
    it('parses ipv6', function(){
        const expect = {
            family: 6,
            host:   '2002:abcd::1',
            port:   443
        }
        const input = '[2002:abcd::1]:443'
        deepStrictEqual( parseHost(input), expect )
    })
    it('parses ipv4', function(){
        const expect = {
            family: 4,
            host:   '192.168.1.100',
            port:   443
        }
        const input = '192.168.1.100:443'
        deepStrictEqual( parseHost(input), expect )
    })
    it('parses hostname / DNS name, family is undefined', function(){
        const expect = {
            family: undefined,
            host:   'www.sub.example.com',
            port:   443
        }
        const input = 'www.sub.example.com:443'
        deepStrictEqual( parseHost(input), expect )
    })
    it('throws on wrong port', function(){
        const inputs = [
            '192.168.1.100:0', '192.168.1.100:65536',
            '[2002:abcd::1]:0', '[2002:abcd::1]:65536'
        ]
        inputs.forEach( input => throws( ()=>parseHost(input) ) )
    })
    it('throws on wrong decl type', function(){
        const inputs = [
            undefined, null, 0, 1, 1.1, ()=>({})
        ]
        inputs.forEach( input =>
            throws( ()=>parseHost(input), Error, `Should throw for ${input}` )
        )
    })
})
