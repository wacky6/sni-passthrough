sni-passthrough
===
A minimalistic SNI pass-through proxy. **Not** a full featured TLS termination or load-balancer!

## Usage
```JavaScript
require('sni-passthrough').createServer({
    sni: {
        'sni-1.com': '127.0.0.1:444',
        'sni-2.com': '127.0.0.1:445',
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
You can use hostname `'*'` to designate a fallback.

**The function**: `(hostname) => ({host, port}) || undefined`  
If SNI is not sent, `hostname` will be `null`  
If function returns `undefined`, incoming connection is dropped.  
You can use this to implement load-balancing or complicated logic.

`opts` will be passed to `net.createServer`, you can specify additional options

###### Event: 'forward'
returned server emits 'forward' event:
```JavaScript
passthourgh.on('forward', (hostname, {host, port}) => {
    // hostname => SNI server name
    // host     => destination host
    // port     => destination port
})
```

## Caveat
Backends won't get remote peer's ip address.

Maybe a `X-Forwarded-For` TLS extension? 🙃

## Performance
On loopback, with my 2015 MBP @ 2.4Ghz, I was able to achieve:

* ~8Ghz thorough-put
* ~1800 QPS for a single 2000 QPS backend (~10% loss, `wrk -c100`)


## License
MIT
