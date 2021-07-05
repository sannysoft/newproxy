import NewProxy from '../src/new-proxy';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      .port(8800)
      .log(true)
      .sslMitm(() => false)
      .externalProxy({
        host: '127.0.0.1',
        port: 8888,
      })
      .externalProxyNoMitm(() => {
        return {
          host: '127.0.0.1',
          port: 8888,
        };
      });

    await proxy.run();
    await sleep(100000);
  });
});
