import { NewProxyBuilder } from 'newproxy';

const proxy = NewProxyBuilder.new()
  .log((message) => {
    console.log(message);
  })
  .errorLog((error) => {
    console.error(error);
  })
  .sslMitm(() => true)
  .requestInterceptor(async (rOptions, clientReq, clientRes, ssl) => {
    clientReq.setTimeout(30000); // Set request timeout to 10 seconds

    const url = rOptions.url || `${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}`;
    console.log(`URL requested：${url}`);
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
  .build();

process.once('SIGTERM', async function (code) {
  console.log('SIGTERM received...');
  await proxy.stop();
});

await proxy.run();
