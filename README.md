sni-passthrough
===
A minimalistic SNI proxy.

## Usage
```JavaScript
    require('sni-passthrough').createServer({
        sni: {
            'sni-1.com': '127.0.0.1:444',
            'sni-2.com': '127.0.0.1:445',
            'sni-3.com': '[::1]:446',
        },
        fallback: '127.0.0.1:444'
    })
    .listen(443)
```

## API

#### createServer(opts) => net.Server
###### opts.sni
hostname => destination mapping

destination is `"host:port"` string, port must **NOT** be omitted.  
Wildcard and RegExp are not supported.

###### opts.fallback
fallback destination

If `fallback` is not provided, and no SNI destination is found,
incoming connection will be closed (`socket.destroy()`).


`opts` will be passed to `net.createServer`, you can specify additional options

###### Event: 'forward'
returned server emits 'forward' event:

```JavaScript
    passthourghSvr.on('forward', (hostname, {host, port}) => {
        // hostname => SNI server name
        // host     => destination host or `null`
        // port     => destination port or `null`
    })
```

## Caveat
Backend nodes won't get remote peer's ip address.

## Performance
Not tested yet. :(

## License
MIT
