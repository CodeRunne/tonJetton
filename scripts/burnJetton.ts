import { Address, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { compile, NetworkProvider } from '@ton/blueprint';
import { buildJettonContent } from '../wrappers/helper/utils'

export async function run(provider: NetworkProvider) {
    const jettonMinter = provider.open(JettonMinter.createFromAddress(Address.parse('kQDvX0oJ1LMNRVyFZ62iaWkvY1vofzmSRL7W2chQydKvUaei')));
    const jettonWalletAddress = await jettonMinter.getWalletAddress(provider.sender().address as Address)
    const jettonWalletContract = provider.open(JettonWallet.createFromAddress(jettonWalletAddress))

    await jettonWalletContract.sendBurn(provider.sender(), {
        value: toNano(0.1),
        queryId: 4,
        jettonAmount: toNano(100)
    })

    console.log("tokens successfully burned")
    // run methods on `jettonMinter`
}
