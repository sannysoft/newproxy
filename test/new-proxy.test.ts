import { NewProxy, NewProxyBuilder } from "../dist/newproxy";
import { sleep } from "../src/utils/promises";
import http from "http";
import stream from "stream";
import got from "got";
import { HttpsProxyAgent } from "hpagent";

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

  it('Should proxy requests', async () => {
    const proxy = new NewProxyBuilder().port(8800).log(true).sslMitm(false).build();

    try {
      await proxy.run();

      const proxyAgent = new HttpsProxyAgent({
        proxy: 'http://127.0.0.1:8800',
      });

      const response = await got({
        method: 'get',
        url: 'https://www.yahoo.com/',
        agent: {
          https: proxyAgent,
        },
        rejectUnauthorized: false,
      });

      expect(response.statusCode).toEqual(200);
    } finally {
      await proxy.stop();
    }
  });

  it('Should use MITM', async () => {
    let interceptorCalled = false;
    let sslMitmCalled = false;

    const proxy = new NewProxyBuilder()
      .port(8800)
      .log(true)
      .errorLog(true)
      .sslMitm((req: http.IncomingMessage, clientSocket: stream.Duplex, head: Buffer) => {
        sslMitmCalled = true;
        return true;
      })
      .requestInterceptor(
        (requestOptions, clientReq, clientRes, ssl, connectRequest): Promise<void> => {
          interceptorCalled = true;
          return Promise.resolve();
        },
      )
      .build();

    let err = null;
    try {
      await proxy.run();

      const proxyAgent = new HttpsProxyAgent({
        proxy: 'http://127.0.0.1:8800',
        keepAlive: false,
      });

      const response = await got({
        method: 'get',
        url: 'https://www.yahoo.com/',
        agent: {
          https: proxyAgent,
        },
        rejectUnauthorized: false,
      });
    } catch (error) {
      err = error;
    } finally {
      await proxy.stop();
    }

    expect(err).toBeNull();
    expect(interceptorCalled).toEqual(true);
    expect(sslMitmCalled).toEqual(true);
  });

  it('Should intercept request & response', async () => {
    const proxy = new NewProxyBuilder()
      .port(8800)
      .log(true)
      .sslMitm(true)
      .requestInterceptor((requestOptions, clientReq, clientRes, ssl, connectRequest) => {
        if (requestOptions.headers) {
          requestOptions.headers['Request-Test'] = '1';
        }
        return Promise.resolve();
      })
      .responseInterceptor((clientReq, clientRes, proxyReq, proxyRes, ssl) => {
        proxyRes.headers['Response-Test'] = '2';
        return Promise.resolve();
      })
      .build();

    try {
      await proxy.run();

      const proxyAgent = new HttpsProxyAgent({
        keepAlive: false,
        proxy: 'http://127.0.0.1:8800',
      });

      const response = await got({
        method: 'get',
        url: 'https://httpbin.org/get',
        agent: {
          https: proxyAgent,
        },
        rejectUnauthorized: false,
      });

      expect(response.statusCode).toEqual(200);

      // Request intercepted
      const json = JSON.parse(response.body);
      expect(json['headers']['Request-Test']).toEqual('1');

      // Response intercepted
      expect(response.headers['response-test']).toEqual('2');
    } finally {
      await proxy.stop();
    }
  });
});
