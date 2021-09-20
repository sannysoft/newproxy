import { NewProxyBuilder } from 'newproxy';

const proxy = NewProxyBuilder.new()
  .log(false)
  .errorLog(true)
  .sslMitm((req, clientSocket, head) => {
    if (req.headers['host']?.includes('google.com') === true) {
      // Do not MITM google.com
      return false;
    }
    return true;
  })
  .responseInterceptor((clientReq, clientRes, proxyReq, proxyRes, ssl) => {
    // proxyRes will be piped to clientRes, we can change proxyRes or write to clientRes directly here
    proxyRes.headers['mitm'] = '1';
  }).build;

process.once('SIGTERM', async (code) => {
  console.log('SIGTERM received...');
  await proxy.stop();
});

await proxy.run();
