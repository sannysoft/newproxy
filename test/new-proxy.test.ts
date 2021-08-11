import { NewProxyBuilder } from '../src/new-proxy-builder';
import { NewProxy } from '../src/new-proxy';
import { sleep } from '../src/utils/promises';

/**
 * Dummy test
 */
describe('Proxy test', () => {
  jest.setTimeout(5 * 60e3);

  it('NewProxy is instantiable', () => {
    expect(NewProxyBuilder.new().build()).toBeInstanceOf(NewProxy);
  });

  it('Run proxy & stop it', async () => {
    const proxy = new NewProxyBuilder()
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
      })
      .build();

    await proxy.run();
    await sleep(1000);
    await proxy.stop();
  });
});
