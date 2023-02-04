import { plsStringHash } from './PlsHash'
import { PlsMultisig } from './PlsMultisig'
import { PlsUser } from "./PlsUser"

export class PlsContract {
  public version = '1'

  constructor(
    public state: string,
    public readonly user0Publickey: string,
    public user1Publickey: string,
    public readonly mediatorPublickey: string,
    public readonly arbitratorPublickey: string,
    public readonly daoPublickey: string,
    public readonly creationDate: number,
    public readonly expiringDate: number,
    public readonly fileHash: string
  ) { }

  public asJSON(pretty: boolean = true): string {
    return JSON.stringify(this, undefined, pretty ? 2 : undefined)
  }

  generatePlsContractHash(): string {
    return plsStringHash(this.asJSON(false))
  }
}
