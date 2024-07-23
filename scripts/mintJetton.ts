import { Address, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { compile, NetworkProvider } from '@ton/blueprint';
import { buildJettonContent } from '../wrappers/helper/utils'

export async function run(provider: NetworkProvider) {
    const jettonMinter = provider.open(JettonMinter.createFromAddress(Address.parse('kQAlpDioEUsIdqAKZGYicX9t0UE7SCrDp09ZKsO5__XH2zSj')));

    await jettonMinter.sendMint(provider.sender(), {
        toAddress: Address.parse('0QADWv59uy0pUQsEu4bb_Lk1GH045oLasaGUBY7cTiwCrHsf'),
        jettonAmount: toNano(500),
        amount: toNano(0.01),
        queryId: 1,
        value: toNano(0.01)
    })

    console.log("tokens successfully minted")
    // run methods on `jettonMinter`
}
