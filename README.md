sni-passthrough
===
A minimalistic SNI pass-through proxy. **Not** a full featured TLS termination or load-balancer!

## Usage
```JavaScript
require('sni-passthrough').createServer({
    sni: {
        'sni-1.com': '127.0.0.1:444',
        'sni-2.com': '> 127.0.0.1:445',
        'sni-3.com': '[::1]:446',
        '*':         '127.0.0.1:444'
    }
})
.listen(443)
```

## API

#### createServer(opts) => net.Server
###### opts.sni
Either an object or a function

**The object**: hostname => destination mapping  
destination is a `"host:port"` string, port must **NOT** be omitted.  
Wildcard and RegExp are not supported.  
Use destination `null` to blacklist a domain name.  
Prepend `>` to destination to mark a compatible backend.
Use hostname `'*'` to designate a fallback.

**The function**: `(hostname) => forwardFunc(conn, buf) || undefined`  
If SNI is not sent, `hostname` will be `null`  
If function returns `undefined`, incoming connection is dropped.  
Use this to implement load-balancing or complicated logic.  
`forwardFunc` should connect and pipe `conn` to backend.

`opts` will be passed to `net.createServer`, you can specify additional options

## Remote peer IP address
Use `>` to mark a compatible backend destination.  
In this case, remote peer's information is injected before piping.  
For example, see [sni-passthrough-backend](https://github.com/wacky6/sni-passthrough-backend)

Do not specify this flag for incompatible backend!

Maybe a `X-Forwarded-For` TLS extension? 🙃

## Performance
On loopback, with my 2015 MBP @ 2.4Ghz, I was able to achieve:

* ~8Ghz thorough-put
* ~1800 QPS for a single 2000 QPS backend (~10% loss, `wrk -c100`)

## Testing
1. Generate key, self-sign certificate
2. Put them at `key.pem`, `cert.pem`
3. In terminal, run `mocha`

## License
MIT
