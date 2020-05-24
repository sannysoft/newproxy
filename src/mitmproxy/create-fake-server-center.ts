import * as fs from 'fs';
import * as forge from 'node-forge';
import * as chalk from 'chalk';
import { FakeServersCenter } from '../tls/fake-servers-center';
import { ProxyConfig } from '../types/proxy-config';
import { UpgradeHandlerFn } from '../types/functions/upgrade-handler-fn';
import { RequestHandlerFn } from '../types/functions/request-handler-fn';
import { log } from '../common/logger';

export function createFakeServerCenter(
  proxyConfig: ProxyConfig,
  requestHandler: RequestHandlerFn,
  upgradeHandler: UpgradeHandlerFn,
): FakeServersCenter {
  let caCert: forge.pki.Certificate;
  let caKey: forge.pki.PrivateKey;

  try {
    fs.accessSync(proxyConfig.caCertPath, fs.constants.F_OK);
    fs.accessSync(proxyConfig.caKeyPath, fs.constants.F_OK);
    const caCertPem = String(fs.readFileSync(proxyConfig.caCertPath));
    const caKeyPem = String(fs.readFileSync(proxyConfig.caKeyPath));
    caCert = forge.pki.certificateFromPem(caCertPem);
    caKey = forge.pki.privateKeyFromPem(caKeyPem);
  } catch (error) {
    log(`Can not find \`CA certificate\` or \`CA key\`.`, chalk.red);

    throw error;
  }

  return new FakeServersCenter(
    100,
    requestHandler,
    upgradeHandler,
    {
      key: caKey,
      cert: caCert,
    },
    proxyConfig.getCertSocketTimeout,
  );
}
