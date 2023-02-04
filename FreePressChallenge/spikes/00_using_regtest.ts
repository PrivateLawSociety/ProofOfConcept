import * as bitcoin from 'bitcoinjs-lib'
import { RegtestUtils } from 'regtest-client'
import * as ecc from 'tiny-secp256k1'
import ECPairFactory from 'ecpair'

const regtestUtils = new RegtestUtils()
const network = regtestUtils.network
const ECPair = ECPairFactory(ecc)

const validator = (
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer,
): boolean => ECPair.fromPublicKey(pubkey).verify(msghash, signature)

const app = async() => {
  // const keyPair0 = ECPair.makeRandom({ network })
  // const keyPair1 = ECPair.makeRandom({ network })
  const keyPair0 = ECPair.fromWIF('cUZdbtnd8y9sZMqRViXqdaBmrAmqon9rqsgDGqQ9jVpXkDFHt5Sb', network)
  const keyPair1 = ECPair.fromWIF('cSP9snZtsyZhKhr5xqtyHLQxZAegx4gKgthxJrUaJzrUATD2BPtv', network)
  const p2pkh0 = bitcoin.payments.p2pkh({ pubkey: keyPair0.publicKey, network })
  const p2pkh1 = bitcoin.payments.p2pkh({ pubkey: keyPair1.publicKey, network })

  // Tell the server to send you coins (satoshis)
  const unspent = await regtestUtils.faucet(p2pkh0.address!, 2e4)
  console.log('unspent', unspent)
  const unspentComplex = await regtestUtils.faucetComplex(p2pkh1.output!, 1e4)
  console.log('unspentComplex', unspentComplex)

  const userUnspents0 = await regtestUtils.unspents(p2pkh0.address!)
  // console.log('userUnspents 0', userUnspents0)
  const userUnspents1 = await regtestUtils.unspents(p2pkh1.address!)
  // console.log('userUnspents 1', userUnspents1)

  console.log('Current blockHeight:', await regtestUtils.height())
  console.log('User address 0:', p2pkh0.address)
  console.log('Address 0 balance:', userUnspents0.reduce((prev, curr) => curr.value + prev, 0))
  console.log('User address 1:', p2pkh1.address)
  console.log('Address 1 balance:', userUnspents1.reduce((prev, curr) => curr.value + prev, 0))

  // Mine 6 blocks, returns an Array of the block hashes. All payments will confirm
  // const results = await regtestUtils.mine(6)

  const utxoInput0 = userUnspents0[0]

  const utx = await regtestUtils.fetch(utxoInput0.txId)
  console.log('utx', utx)
  const nonWitnessUtxo = Buffer.from(utx.txHex, 'hex')
  // const witnessUtxo = {
  //   address: utx.outs[utxoInput0.vout].address,
  //   value: utx.outs[utxoInput0.vout].value,
  //   script: Buffer.from(utx.outs[utxoInput0.vout].script, 'hex')
  // }

  const fileHash = '3e910daf5f7a0...'
  const embed = bitcoin.payments.embed({ data: [
    Buffer.from(`PLS${fileHash}`, 'utf8')
  ] })

  console.log('embed', embed.output?.toString('utf8'))

  const psbt = new bitcoin.Psbt({ network })
  psbt.addInput({
    hash: utxoInput0.txId,
    index: utxoInput0.vout,
    nonWitnessUtxo,
    // witnessUtxo,
  })
  psbt.addOutput({
    address: p2pkh1.address!,
    value: 10000,
  })
  psbt.addOutput({
    script: embed.output!,
    value: 1000,
  })
  psbt.signInput(0, keyPair0)
  console.log('psbt.validateSignaturesOfInput(0, validator)', psbt.validateSignaturesOfInput(0, validator))
  psbt.finalizeAllInputs()
  console.log('psbt.extractTransaction().toHex()', psbt.extractTransaction().toHex())
  // console.log('psbt.extractTransaction()', psbt.extractTransaction())

  // broadcats transaction!!!
  // await regtestUtils.broadcast(psbt.extractTransaction().toHex())
}

app()
