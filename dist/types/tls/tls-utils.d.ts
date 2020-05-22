/// <reference types="node" />
import * as forge from 'node-forge';
import { PeerCertificate } from 'tls';
import { CaConfig } from '../types/ca-config';
import { CaPair } from '../types/ca-pair';
export default class TlsUtils {
    static createCA(commonName: string): CaPair;
    static covertNodeCertToForgeCert(originCertificate: PeerCertificate): forge.pki.Certificate;
    static createFakeCertificateByDomain(caPair: CaPair, domain: string): CaPair;
    static createFakeCertificateByCA(caPair: CaPair, originCertificate: PeerCertificate): CaPair;
    static isBrowserRequest(userAgent: string): boolean;
    static isMappingHostName(DNSName: string, hostname: string): boolean;
    static getMappingHostNamesFormCert(cert: forge.pki.Certificate): string[];
    static initCA(basePath: string): CaConfig;
}
