<img src="https://sannysoft.com/other/newproxy-logo.png" alt="NewProxy" width="300">


![npm](https://img.shields.io/npm/dm/newproxy)
![npm type definitions](https://img.shields.io/npm/types/newproxy)
![npm](https://img.shields.io/npm/v/newproxy)

JS Proxy library with support for request/response rewriting, optional SSL MITM (man-in-the-middle), external proxy.


### Adding as dependency

```bash
npm i newproxy
```

### Usage

```js
import { NewProxyBuilder }  from 'newproxy';

const proxy = NewProxyBuilder.new()
  .sslMitm((req, clientSocket, head) => true)
  .requestInterceptor(async (rOptions, clientReq, clientRes, ssl) => {
    clientReq.setTimeout(10000); // Set request timeout to 10 seconds

    console.log(`URL requested：${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}`);
    console.log('Cookie:', rOptions.headers.cookie);

    if (rOptions.url.includes('test')) {
      clientRes.setHeader('Content-Type', 'application/json');
      clientRes.end('Hello NewProxy!');
      // If we call clientRes.end and close client socket in request interception
      // then no other actions are performed
    }
  })
  .responseInterceptor(async (clientReq, clientRes, proxyReq, proxyRes, ssl) => {
    // proxyRes will be piped to clientRes, we can change proxyRes or write to clientRes directly here
    proxyRes.headers['test_header'] = 'test';

    if (proxyRes.statusCode === 301) {
      clientRes.setHeader('Content-Type', 'text/html');
      clientRes.statusCode = 404;
      clientRes.end('NO REDIRECTS HERE');
    }
  })
  .externalProxyNoMitm('http://127.0.0.1:8800') // Set external proxy for non-MITM SSL requests
  .externalProxy('http://127.0.0.1:8888')
  .build(); // We can set external proxy statically or by fn
  
// Start listening 
(async () => {
  await proxy.run();
})();

...

await proxy.stop();
```

### Features

 - Optional request/response interception
 - Optional MITM for SSL requests
 - Optional external proxy
 - Written in TypeScript
 
### Examples
 
 Multiple example files are available in /examples folder
 
