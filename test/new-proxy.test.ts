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
    // @ts-ignore
    const proxy = new NewProxy()
      .port(8800)
      .sslMitm(() => false)
      .externalProxyNoMitm(() => {
        return {
          url: 'http://127.0.0.1:8888',
          login: 'sanny',
          password: '123',
        };
      });

    proxy.run();
    await sleep(100000);
  });
});
