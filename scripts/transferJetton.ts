import { Address, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { compile, NetworkProvider } from '@ton/blueprint';
import { buildJettonContent } from '../wrappers/helper/utils'

export async function run(provider: NetworkProvider) {
    const jettonMinter = provider.open(JettonMinter.createFromAddress(Address.parse('kQDvX0oJ1LMNRVyFZ62iaWkvY1vofzmSRL7W2chQydKvUaei')));
    const jettonWalletAddress = await jettonMinter.getWalletAddress(provider.sender().address as Address)
    const jettonWalletContract = provider.open(JettonWallet.createFromAddress(jettonWalletAddress))

    await jettonWalletContract.sendTransfer(provider.sender(), {
        value: toNano(0.1),
        toAddress: Address.parse('0QCp8zdhCvR1P6q-DGu_LNSN1ObXwokmFdjMxHofg-Ukrk8l'),
        queryId: 1,
        fwdAmount: toNano(0.001),
        jettonAmount: toNano(20)
    })

    console.log("tokens successfully transferred")
    // run methods on `jettonMinter`
}
