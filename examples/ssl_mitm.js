import NewProxy from 'newproxy';

const proxy = new NewProxy()
  .log(false)
  .errorLog(true)
  .sslConnectInterceptor((req, clientSocket, head) => {
    if (req.headers['host']?.includes('google.com') === true) {
      // Do not MITM google.com
      return false;
    }
    return true;
  })
  .responseInterceptor((clientReq, clientRes, proxyReq, proxyRes, ssl, next) => {
    // proxyRes will be piped to clientRes, we can change proxyRes or write to clientRes directly here
    proxyRes.headers['mitm'] = '1';
    next();
  });

process.once('SIGTERM', code => {
  console.log('SIGTERM received...');
  proxy.close();
});

proxy.run();
