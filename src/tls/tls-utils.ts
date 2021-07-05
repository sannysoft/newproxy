import * as forge from 'node-forge';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import * as fs from 'fs';
import { PeerCertificate } from 'tls';
import { CaConfig } from '../types/ca-config';
import { CaPair } from '../types/ca-pair';
import { caConfig } from '../common/ca-config';

export class TlsUtils {
  public static createCA(commonName: string): CaPair {
    const keys = forge.pki.rsa.generateKeyPair(2046);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = `${new Date().getTime()}`;
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 5);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 20);
    const attrs = [
      {
        name: 'commonName',
        value: commonName,
      },
      {
        name: 'countryName',
        value: 'RU',
      },
      {
        shortName: 'ST',
        value: 'Moscow',
      },
      {
        name: 'localityName',
        value: 'Moscow',
      },
      {
        name: 'organizationName',
        value: 'NewProxy',
      },
      {
        shortName: 'OU',
        value: 'https://github.com/sannysoft/newproxy',
      },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
      {
        name: 'basicConstraints',
        critical: true,
        cA: true,
      },
      {
        name: 'keyUsage',
        critical: true,
        keyCertSign: true,
      },
      {
        name: 'subjectKeyIdentifier',
      },
    ]);

    // self-sign certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());

    return {
      key: keys.privateKey,
      cert: cert,
    };
  }

  public static covertNodeCertToForgeCert(
    originCertificate: PeerCertificate,
  ): forge.pki.Certificate {
    const obj = forge.asn1.fromDer(originCertificate.raw.toString('binary'));
    return forge.pki.certificateFromAsn1(obj);
  }

  public static createFakeCertificateByDomain(caPair: CaPair, domain: string): CaPair {
    const keys = forge.pki.rsa.generateKeyPair(2046);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;

    cert.serialNumber = `${new Date().getTime()}`;
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
    const attrs = [
      {
        name: 'commonName',
        value: domain,
      },
      {
        name: 'countryName',
        value: 'RU',
      },
      {
        shortName: 'ST',
        value: 'Moscow',
      },
      {
        name: 'localityName',
        value: 'Moscow',
      },
      {
        name: 'organizationName',
        value: 'NewProxy',
      },
      {
        shortName: 'OU',
        value: 'https://github.com/sannysoft/newproxy',
      },
    ];

    cert.setIssuer(caPair.cert.subject.attributes);
    cert.setSubject(attrs);

    cert.setExtensions([
      {
        name: 'basicConstraints',
        critical: true,
        cA: false,
      },
      {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        contentCommitment: true,
        keyEncipherment: true,
        dataEncipherment: true,
        keyAgreement: true,
        keyCertSign: true,
        cRLSign: true,
        encipherOnly: true,
        decipherOnly: true,
      },
      {
        name: 'subjectAltName',
        altNames: [
          {
            type: 2,
            value: domain,
          },
        ],
      },
      {
        name: 'subjectKeyIdentifier',
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true,
      },
      {
        name: 'authorityKeyIdentifier',
      },
    ]);
    cert.sign(caPair.key, forge.md.sha256.create());

    return {
      key: keys.privateKey,
      cert: cert,
    };
  }

  public static createFakeCertificateByCA(
    caPair: CaPair,
    originCertificate: PeerCertificate,
  ): CaPair {
    // const certificate = TlsUtils.covertNodeCertToForgeCert(originCertificate);

    const keys = forge.pki.rsa.generateKeyPair(2046);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;

    cert.serialNumber = originCertificate.serialNumber;
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

    const attrs: forge.pki.CertificateField[] = [];
    Object.entries(originCertificate.subject).forEach(([name, value]) => {
      attrs.push({
        shortName: name,
        value: value,
      });
    });

    cert.setSubject(attrs);
    cert.setIssuer(caPair.cert.subject.attributes);

    const subjectAltNames = originCertificate.subjectaltname.split(', ').map((name) => {
      return {
        // 2 is DNS type
        type: 2,
        value: name.replace('DNS:', '').trim(),
      };
    });

    cert.setExtensions([
      {
        name: 'basicConstraints',
        critical: true,
        cA: false,
      },
      {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        contentCommitment: true,
        keyEncipherment: true,
        dataEncipherment: true,
        keyAgreement: true,
        keyCertSign: true,
        cRLSign: true,
        encipherOnly: true,
        decipherOnly: true,
      },
      {
        name: 'subjectAltName',
        altNames: subjectAltNames,
      },
      {
        name: 'subjectKeyIdentifier',
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true,
      },
      {
        name: 'authorityKeyIdentifier',
      },
    ]);
    cert.sign(caPair.key, forge.md.sha256.create());

    return {
      key: keys.privateKey,
      cert: cert,
    };
  }

  public static isBrowserRequest(userAgent: string): boolean {
    return /mozilla/i.test(userAgent);
  }

  public static isMappingHostName(DNSName: string, hostname: string): boolean {
    let reg = DNSName.replace(/\./g, '\\.').replace(/\*/g, '[^.]+');
    reg = `^${reg}$`;
    return new RegExp(reg).test(hostname);
  }

  public static getMappingHostNamesFormCert(cert: forge.pki.Certificate): string[] {
    let mappingHostNames = [cert.subject.getField('CN')?.value ?? []];

    // @ts-ignore
    const altNames = cert.getExtension('subjectAltName')?.altNames ?? [];

    mappingHostNames = mappingHostNames.concat(altNames.map((item: any) => item.value));

    return mappingHostNames;
  }

  public static initCA(basePath: string): CaConfig {
    const caCertPath = path.resolve(basePath, caConfig.caCertFileName);
    const caKeyPath = path.resolve(basePath, caConfig.caKeyFileName);

    try {
      fs.accessSync(caCertPath, fs.constants.F_OK);
      fs.accessSync(caKeyPath, fs.constants.F_OK);

      // has exist
      return {
        caCertPath,
        caKeyPath,
        create: false,
      };
    } catch {
      const caObj = TlsUtils.createCA(caConfig.caName);

      const caCert = caObj.cert;
      const cakey = caObj.key;

      const certPem = forge.pki.certificateToPem(caCert);
      const keyPem = forge.pki.privateKeyToPem(cakey);

      mkdirp.sync(path.dirname(caCertPath));
      fs.writeFileSync(caCertPath, certPem);
      fs.writeFileSync(caKeyPath, keyPem);
    }

    return {
      caCertPath,
      caKeyPath,
      create: true,
    };
  }
}
