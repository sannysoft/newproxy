import NewProxy from 'newproxy';

const proxy = new NewProxy()
  .sslConnectInterceptor(true)
  .externalProxy((clientReq, ssl) => {
    let host = clientReq['headers']['host'];

    if (host?.includes('google.com')) {
      clientReq['external_proxy'] = 1;
      return 'http://127.0.0.1:8888';
    }

    if (host?.includes('yahoo.com'))
      return {
        url: 'http://127.0.0.1:8888',
        login: 'username',
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
  proxy.close();
});

proxy.run();
