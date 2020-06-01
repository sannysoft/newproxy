import NewProxy from 'newproxy';

const proxy = new NewProxy()
  .sslMitm((req, clientSocket, head) => {
    if (req.headers['host']?.includes('google.com') === true) {
      // Do not MITM google.com
      return false;
    }
    return true;
  })
  .externalProxyNoMitm({
    host: 'http://127.0.0.1:8888',
    username: 'test',
    password: '12345',
  })
  .externalProxy((clientReq, ssl, clientRes, connectReq) => {
    let host = clientReq['headers']['host'];

    if (host?.includes('google.com')) {
      clientReq['external_proxy'] = 1;
      return 'http://127.0.0.1:8888';
    }

    if (host?.includes('yahoo.com'))
      return {
        host: 'http://127.0.0.1:8888',
        username: 'username',
        password: 'password',
      };

    return null;
  })
  .responseInterceptor((clientReq, clientRes, proxyReq, proxyRes, ssl, next) => {
    if (clientReq['external_proxy'] === 1) proxyRes.headers['external_proxy'] = '1';

    next();
  });

process.once('SIGTERM', code => {
  console.log('SIGTERM received...');
  proxy.stop();
});

proxy.run();
