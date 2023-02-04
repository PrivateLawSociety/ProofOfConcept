import BIP32Factory from 'bip32'
import * as ecc from 'tiny-secp256k1'
import { Network, payments } from 'bitcoinjs-lib'
import { PlsUser } from './PlsUser'

const bip32 = BIP32Factory(ecc)

export class PlsMultisig {
  constructor(
    public readonly user1: PlsUser,
    public readonly user2: PlsUser,
    public readonly network: Network,
  ) { }

  public address(num: number = 0) {
    const { address } = this.payment(num)

    return address!
  }

  public payment(num: number = 0) {
    const { publicKey: publickeyUsr1 } = this.user1.dataForMultisig(num)
    const { publicKey: publickeyUsr2 } = this.user2.dataForMultisig(num)

    const pubkeys = [publickeyUsr1, publickeyUsr2].sort()

    return payments.p2wsh({
      redeem: payments.p2ms({ m: 2, pubkeys, network: this.network }),
    })
  }
}
