import NewProxy from '../src/new-proxy';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Dummy test
 */
describe('Proxy test', () => {
  jest.setTimeout(5 * 60e3);

  it('NewProxy is instantiable', () => {
    expect(new NewProxy({})).toBeInstanceOf(NewProxy);
  });

  it('', async () => {
    const proxy = new NewProxy()
      .log(message => {
        console.log(message);
      })
      .errorLog(error => {
        console.error(error);
      })
      .sslConnectInterceptor(() => true)
      .requestInterceptor((rOptions, clientReq, clientRes, ssl, next) => {
        clientReq.setTimeout(10000); // Set request timeout to 10 seconds

        console.log(`URL requested：${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}`);
        console.log('Cookie:', rOptions.headers.cookie);

        if (rOptions.url.includes('test')) {
          clientRes.setHeader('Content-Type', 'application/json');
          clientRes.end('Hello NewProxy!');
          // If we call clientRes.end and close client socket in request interception
          // then no other actions are performed
        }

        next();
      })
      .responseInterceptor((clientReq, clientRes, proxyReq, proxyRes, ssl, next) => {
        // proxyRes will be piped to clientRes, we can change proxyRes or write to clientRes directly here
        proxyRes.headers['test_header'] = 'test';

        if (proxyRes.statusCode === 301) {
          clientRes.setHeader('Content-Type', 'text/html');
          clientRes.statusCode = 404;
          clientRes.end('NO REDIRECTS HERE');
        }

        next();
      });
    proxy.run();
    await sleep(100000);
  });
});
