import * as bip39 from 'bip39'
import BIP32Factory from 'bip32'
import * as ecc from 'tiny-secp256k1'
import { payments, networks, Network } from 'bitcoinjs-lib'

const bip32 = BIP32Factory(ecc)

export class PlsUser {
  constructor(
    public readonly name: string,
    public readonly mnemonic: string,
    public readonly network: Network,
  ) { }

  public addressSinglesig(num: number = 0) {
    const { publicKey } = this.dataForSinglesig(num)
    const address = payments.p2wpkh({ pubkey: publicKey, network: this.network }).address!

    return address
  }

  public dataForSinglesig(num: number = 0) {
    const seed = bip39.mnemonicToSeedSync(this.mnemonic);
    const hdRoot = bip32.fromSeed(seed, this.network);
    const childNode = hdRoot.derivePath(`m/84'/1'/0'/0/${num}`)
    const publicKey = childNode.publicKey

    return { childNode, publicKey }
  }

  public dataForMultisig(num: number = 0) {
    const seed = bip39.mnemonicToSeedSync(this.mnemonic);
    const hdRoot = bip32.fromSeed(seed, this.network);
    const childNode = hdRoot.derivePath(`m/48'/1'/0'/2'/0/${num}`)
    const publicKey = childNode.publicKey

    return { childNode, publicKey }
  }
}
