import { PlsMultisig } from './PlsMultisig'
import { PlsTestsHelper } from './PlsTestsHelper'

console.log('starting...')

// hashing validation (move to unitary test)
// const plsHashed = plsStringHash('private law society')
// console.log('plsHashed', plsHashed, plsHashed === '5e886af3a2a2aa842b42151f8e6237cbe25d7d041865b9edebff6a0509105e2d')

const app = async() => {
  const printBalances = async (pls : PlsTestsHelper, multisig : PlsMultisig | null) => {
    console.log("\tBalances:")
    console.log('\t\tDAO balance:', await pls.balance(pls.dao.addressSinglesig(0)))
    console.log('\t\talice (libwriter) balance:', await pls.balance(pls.alice.addressSinglesig(0)))
    console.log('\t\tbob (privcomp) balance:', await pls.balance(pls.bob.addressSinglesig(0)))
    if (multisig != null) {
      console.log('\t\tmultisig balance:', await pls.balance(multisig.address(0)))
    }
    
    console.log('\t-----')
  }

  const pls = new PlsTestsHelper()
  var multisig : PlsMultisig | null = null

  // setup contract and multisig

  console.log("Welcome to Free Speech Challenge Proof of Concept")
  console.log("Part A: setting up the environment")
  console.log(" * Creating actor wallets")
  console.log('     DAO address0:', pls.dao.addressSinglesig(0))
  console.log('     Alice address0:', pls.alice.addressSinglesig(0))
  console.log('     Bob address0:', pls.bob.addressSinglesig(0))
  console.log(' * Funding wallets >>> alice and bob singlesig address 0s funding <<<')
  await pls.fundAddress(pls.alice.addressSinglesig(0), 20000)
  await pls.fundAddress(pls.bob.addressSinglesig(0), 20000)
  await printBalances(pls,multisig)
  
  console.log(' ')
  console.log(' ')
  console.log("Part B: Negociations (happens outside PLS)")
  console.log(" * Libwriter and Privcomp negotiate and write a contract-file (PDF)")
  console.log(" ")

  console.log("Part 1: Contract creating in PLS")
  console.log(" * One of the parties, let's say Alice, creates the contract")
  const contract = await pls.buildContract()
  console.log(' * Generates the PDF file hash and store on json')
  console.log('    fileHash', contract.fileHash)
  console.log(' * Sent contract at state "Configured" to the other party:')
  console.log('    contract.asJSON()', contract.asJSON())
  console.log('-----')
  console.log(" * The other party validate and finalize the configuration")
  console.log('    contractHash', contract.generatePlsContractHash())
  await pls.validateContract(contract)
  console.log('    contract.asJSON()', contract.asJSON())
  console.log('-----')

  await printBalances(pls,multisig)

  console.log(' ')
  console.log(' ')
  console.log("Part 2: Start contract")
  console.log(" * Create contract wallet (multisig 2 of 2)")
  multisig = await pls.buildMulitsig()
  console.log(
    '    Multisig address0:',
    multisig.address(0),
    multisig.address(0) === 'tb1qfzx3xvlcu7g9r928zhperqya2emmdq4ds3jryhwa5mfjqdyz9glqeutxj9' // testnet
      || multisig.address(0) === 'bcrt1qfzx3xvlcu7g9r928zhperqya2emmdq4ds3jryhwa5mfjqdyz9glq59pq8l' // regtest
  )

  console.log(' * Alice transfers collateral into the multisig <<<')
  const psbtAlice = await pls.buildSecurityDeposit({
    value: 18000,
    fromAddress: pls.alice.addressSinglesig(0),
    toAddress: multisig.address(0),
    signer: pls.alice.dataForSinglesig(0).childNode,
  })
  console.log('    alice txid:', psbtAlice.extractTransaction().getId())
  console.log('    alice tx hex:', psbtAlice.extractTransaction().toHex())
  await pls.broadcast(psbtAlice)
  await printBalances(pls,multisig)

  console.log(' * Bob transfers collateral into the multisig <<<')
  const psbtBob = await pls.buildSecurityDeposit({
    value: 18000,
    fromAddress: pls.bob.addressSinglesig(0),
    toAddress: multisig.address(0),
    signer: pls.bob.dataForSinglesig(0).childNode,
  })
  console.log('    bob txid:', psbtBob.extractTransaction().getId())
  console.log('    bob tx hex:', psbtBob.extractTransaction().toHex())
  await pls.broadcast(psbtBob)
  await printBalances(pls,multisig)

  console.log(' * Creates dispute transaction from multisig to DAO <<<')
  const psbtArbitrator = await pls.buildArbitrationTransaction({
    value: 35000,
    fromAddress: multisig.address(0),
    toAddress: pls.dao.addressSinglesig(0),
    signer: pls.bob.dataForMultisig(0).childNode,
    signer2: pls.alice.dataForMultisig(0).childNode,
    payment: multisig.payment(0),
  })

  console.log('    dispute txid:', psbtArbitrator.extractTransaction().getId())
  console.log('    dispute tx hex:', psbtArbitrator.extractTransaction().toHex())
  await printBalances(pls,multisig)
  contract.state = "Initiated"

  console.log('PART 3: Dispute')
  console.log('Any party can broadcast dispute transaction from multisig to start arbitration <<<')
  await pls.broadcast(psbtArbitrator)
  await printBalances(pls,multisig)
  contract.state = "Finished_Dispute"
  
}

app()
