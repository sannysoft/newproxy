declare class CaConfig {
    caCertFileName: string;
    caKeyFileName: string;
    caName: string;
    getDefaultCABasePath(): string;
    getDefaultCACertPath(): string;
    getDefaultCaKeyPath(): string;
}
export declare const caConfig: CaConfig;
export {};
