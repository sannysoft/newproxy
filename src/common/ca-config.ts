import path from "path";

class CaConfig {
  public caCertFileName: string = 'newproxy.ca.crt';

  public caKeyFileName: string = 'newproxy.ca.key.pem';

  public caName: string = 'NewProxy CA';

  // eslint-disable-next-line class-methods-use-this
  public getDefaultCABasePath(): string {
    const userHome = process.env.HOME || process.env.USERPROFILE || '';
    return path.resolve(userHome, './newproxy');
  }

  public getDefaultCACertPath(): string {
    return path.resolve(this.getDefaultCABasePath(), this.caCertFileName);
  }

  public getDefaultCaKeyPath(): string {
    return path.resolve(this.getDefaultCABasePath(), this.caKeyFileName);
  }
}

export const caConfig = new CaConfig();
