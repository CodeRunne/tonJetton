import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { buildJettonMetadataCell } from '../wrappers/utils/tep'
import { Address, Cell, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('JettonMinter', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('JettonMinter');
    });

    let blockchain: Blockchain;
    let bob: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonMinter: SandboxContract<JettonMinter>;
    let jettonWallet: any;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        alice = await blockchain.treasury('alice');
        bob = await blockchain.treasury('bob');
        deployer = await blockchain.treasury('deployer');

        jettonMinter = blockchain.openContract(JettonMinter.createFromConfig({
            adminAddress: deployer.address,
            content: buildJettonMetadataCell({
                name: 'Bille',
                symbol: 'BLE',
                description: 'A meme token',
                image: 'https://github.com/pharrelwilliams'
            }),
            jettonWalletCode: await compile('JettonWallet')
        }, code));

        const deployResult = await jettonMinter.sendDeploy(deployer.getSender(), toNano('1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
            success: true,
        });

        jettonWallet = async (address: Address) => blockchain.openContract(
            JettonWallet.createFromAddress( await jettonMinter.getWalletAddress(address) )
        )
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jettonMinter are ready to use
    });

    it('should fail if minter is not admin', async () => {

        const mintResult = await jettonMinter.sendMint(alice.getSender(), {
            toAddress: alice.address,
            jettonAmount: toNano(100),
            amount: toNano(0.02),
            queryId: 3,
            value: toNano(0.5)
        })

        expect(mintResult.transactions).toHaveTransaction({
            from: alice.address,
            to: jettonMinter.address,
            success: false
        })

    })

    it('should mint 100 tokens to alice', async () => {

        const aliceJettonContract = await jettonWallet(alice.address)
        const mintResult = await jettonMinter.sendMint(deployer.getSender(), {
            toAddress: alice.address,
            jettonAmount: toNano(100),
            amount: toNano(0.02),
            queryId: 3,
            value: toNano(0.5)
        })

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            success: true
        })

        const aliceBalance = await aliceJettonContract.getWalletBalance()
        expect(aliceBalance).toEqual(toNano(100))

    })

    it('transfer 50 tokens from alice to bob if alice is owner', async () => {

        const aliceJettonContract = await jettonWallet(alice.address)
        const bobJettonContract = await jettonWallet(bob.address)

        const mintResult = await jettonMinter.sendMint(deployer.getSender(), {
            toAddress: alice.address,
            jettonAmount: toNano(100),
            amount: toNano(0.02),
            queryId: 3,
            value: toNano(0.5)
        })

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            success: true
        })

        const transferResult = await aliceJettonContract.sendTransfer(alice.getSender(), {
            value: toNano(0.1),
            toAddress: bob.address,
            queryId: 2,
            fwdAmount: toNano(0.001),
            jettonAmount: toNano(20)
        })


        expect(transferResult.transactions).toHaveTransaction({
            from: alice.address,
            to: aliceJettonContract.a709ddress,
            success: true
        })

        expect(await bobJettonContract.getWalletBalance()).toEqual(toNano(20))
    })

    it('should not transfer tokens if sender is not owner', async () => {
        const aliceJettonContract = await jettonWallet(alice.address)
        const bobJettonContract = await jettonWallet(bob.address)

        const mintResult = await jettonMinter.sendMint(deployer.getSender(), {
            toAddress: alice.address,
            jettonAmount: toNano(100),
            amount: toNano(0.02),
            queryId: 3,
            value: toNano(0.5)
        })

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            success: true
        })

        const transferResult = await aliceJettonContract.sendTransfer(bob.getSender(), {
            value: toNano(0.1),
            toAddress: alice.address,
            queryId: 2,
            fwdAmount: toNano(0.001),
            jettonAmount: toNano(20)
        })


        expect(transferResult.transactions).toHaveTransaction({
            from: bob.address,
            to: aliceJettonContract.address,
            aborted: true,
            success: false
        })
    })

    it('should not burn token if sender is not ower', async () => {
        const aliceJettonContract = await jettonWallet(alice.address)
        const mintResult = await jettonMinter.sendMint(deployer.getSender(), {
            toAddress: alice.address,
            jettonAmount: toNano(100),
            amount: toNano(0.02),
            queryId: 3,
            value: toNano(0.5)
        })

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            success: true
        })

        const burnResult = await aliceJettonContract.sendBurn(bob.getSender(), {
            value: toNano(0.1),
            queryId: toNano(1),
            jettonAmount: toNano(30)
        })

        expect(burnResult.transactions).toHaveTransaction({
            from: bob.address,
            to: aliceJettonContract.address,
            exitCode: 705,
            aborted: true,
            success: false
        })

        const aliceBalance = await aliceJettonContract.getWalletBalance()
        expect(aliceBalance).toEqual(toNano(100))
    })

    it('should burn token if sender is ower', async () => {
        const aliceJettonContract = await jettonWallet(alice.address)
        const mintResult = await jettonMinter.sendMint(deployer.getSender(), {
            toAddress: alice.address,
            jettonAmount: toNano(100),
            amount: toNano(0.02),
            queryId: 3,
            value: toNano(0.5)
        })

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            success: true
        })

        const burnResult = await aliceJettonContract.sendBurn(alice.getSender(), {
            value: toNano(0.1),
            queryId: toNano(1),
            jettonAmount: toNano(30)
        })

        expect(burnResult.transactions).toHaveTransaction({
            from: alice.address,
            to: aliceJettonContract.address,
            success: true
        })

        const aliceBalance = await aliceJettonContract.getWalletBalance()
        expect(aliceBalance).toEqual(toNano(70))
    })

    it('cannot change admin if wallet is not minter admin', async () => {
        const adminResult = await jettonMinter.sendChangeAdmin(alice.getSender(), {
            value: toNano(0.1),
            queryId: toNano(1),
            new_admin: bob.address
        })

        expect(adminResult.transactions).toHaveTransaction({
            from: alice.address,
            to: jettonMinter.address,
            exitCode: 73,
            aborted: true,
            success: false
        })
    })

    it('can change admin if wallet is minter admin', async () => {
        const adminResult = await jettonMinter.sendChangeAdmin(deployer.getSender(), {
            value: toNano(0.1),
            queryId: toNano(1),
            new_admin: bob.address
        })

        expect(adminResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            success: true
        })
    })
    
});
