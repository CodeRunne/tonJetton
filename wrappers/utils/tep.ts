import { Dictionary, beginCell, Cell } from '@ton/core'
import { sha256_sync } from '@ton/crypto'
import { Sha256 } from '@aws-crypto/sha256-js'

export type JettonMetaDataKeys = 'name' | 'description' | 'image' | 'symbol'

const jettonOnchainMetadataSpec: { [key in JettonMetaDataKeys]: 'utf8' | 'ascii' | 'undefined' } = {
	name: 'utf8',
	symbol: 'utf8',
	image: 'ascii',
	description: 'utf8'
}

const sha256 = (str: string) => {
	const sha = new Sha256()
	sha.update(str)
	return Buffer.from(sha.digestSync())
}

export const buildJettonMetadataCell = (data: { [s: string]: string } ): Cell => {
	const PREFIX_SIZE = 8;
	const CELL_MAX_SIZE_BYTES = Math.floor((1023 - PREFIX_SIZE) / 8);
	const dict = Dictionary.empty(Dictionary.Keys.Buffer(256 / 8), Dictionary.Values.Cell())

	Object.entries(data).forEach(([k, v]: [string, string | undefined]) => {
		if (!jettonOnchainMetadataSpec[k as JettonMetaDataKeys]) throw new Error(`Unsupported onchain key ${k}`);
		if (v === undefined || v === '') return;

		let bufferToStore = Buffer.from(v);
		const rootCell = beginCell();
		rootCell.storeUint(0x00, PREFIX_SIZE);
		let currentCell = rootCell;

		while (bufferToStore.length > 0) {
			currentCell.storeBuffer(bufferToStore.subarray(0, CELL_MAX_SIZE_BYTES));
			bufferToStore = bufferToStore.subarray(CELL_MAX_SIZE_BYTES);
			if (bufferToStore.length > 0) {
				let newCell = beginCell();
				currentCell.storeRef(newCell)
				currentCell = newCell;
			}
		}

		dict.set(sha256(k), rootCell.endCell());
	})

	return beginCell().storeInt(0x00, PREFIX_SIZE).storeDict(dict).endCell();
}

export function buildJettonOfflineContent(uri: string): Cell {
	return beginCell()
		.storeInt(0x01, 8)
		.storeBuffer(Buffer.from(uri, 'ascii'))
	.endCell()
}

// ===== METHOD 2 ===== //

export function toSha256(s: string): bigint {
	return BigInt('0x' + sha256_sync(s).toString('hex'))
}

export function toTextCell(s: string): Cell {
	return beginCell().storeUint(0, 8).storeStringTail(s).endCell()
}

export type JettonContent = {
	name: string,
	symbol: string,
	description: string,
	image: string
}

export function buildJettonContent(content: JettonContent): Cell {
	const contentDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
		.set(toSha256('name'), toTextCell(content.name))
		.set(toSha256('symbol'), toTextCell(content.symbol))
		.set(toSha256('description'), toTextCell(content.description))
		.set(toSha256('image'), toTextCell(content.image))

	return beginCell()
			.storeUint(0, 8)
			.storeDict(contentDict)
		.endCell();
}