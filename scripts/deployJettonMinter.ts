import { Address, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { compile, NetworkProvider } from '@ton/blueprint';
import { buildJettonContent } from '../wrappers/helper/utils'

export async function run(provider: NetworkProvider) {
    const jettonMinter = provider.open(JettonMinter.createFromConfig({
        adminAddress: provider.sender().address as Address,
        content: buildJettonContent({
            name: 'OSMOSIS',
            symbol: 'OSMS',
            description: 'A meme token for the world',
            image: 'https://i.pinimg.com/564x/cd/bf/58/cdbf58d81201ec6eed72065d3e3f1054.jpg'
        }),
        jettonWalletCode: await compile('JettonWallet')
    }, await compile('JettonMinter')));

    await jettonMinter.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(jettonMinter.address);

    await jettonMinter.sendMint(provider.sender(), {
        toAddress: provider.sender().address as Address,
        jettonAmount: toNano(10000),
        amount: toNano(0.01),
        queryId: 1,
        value: toNano(0.01)
    })

    // run methods on `jettonMinter`
}
