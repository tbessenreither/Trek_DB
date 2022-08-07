import { createHash } from "https://deno.land/std@0.77.0/hash/mod.ts";
import { TrekNodeInterface } from "./TrekNodeInterface.ts";

export class TrekRing {
	nodesHashes: number[] = [];
	nodesHashesIncludingSubnodes: number[] = [];
	nodeLookupByHash: { [key: number]: TrekNodeInterface } = {};


	RingSettings = {
		hexLength: 6,
		maxNodes: this.hexToDec("".padEnd(6, "f")),
		subNodes: 20,
	};

	/**
	 * Converts a hex string into a decimal number
	 * @param hex string of hexadecimal characters
	 * @returns number The decimal value of the hex string
	 */
	hexToDec(hex: string): number {
		return parseInt(hex, 16);
	}

	/**
	 * hashes a string into a number within the Rings range
	 * @param str string to be hashed
	 * @returns number The hash value of the string
	 */
	hash(str: string): number {
		const hash = createHash('md5').update(str).toString('hex');

		const hashShortened = hash.substring(0, this.RingSettings.hexLength);

		const hashDec = this.hexToDec(hashShortened);

		return hashDec;
	}

	/**
	 * creates <subdivisions> numbers spread evenly over the Rings range
	 * @param subdivisions number of subdivisions of the Ring
	 * @returns number[] an array of numbers spread evenly over the Ring
	 */
	getSubdivisionIntervals(subdivisions: null | number = null): number[] {
		if (subdivisions === null) {
			subdivisions = this.RingSettings.subNodes;
		}
		const maxNodes = this.RingSettings.maxNodes;

		const subNodeIntervals = [0];

		const subNodeInterval = Math.floor(maxNodes / subdivisions);
		for (let i = 0; i < subdivisions; i++) {
			subNodeIntervals.push(subNodeInterval * (i + 1));
		}

		return subNodeIntervals;
	}

	/**
	 * Creates <subdivisions> numbers based on <ringHash> spread evenly over the Rings range
	 * @param ringHash the hash number the spread is offset by
	 * @param subdivisions number of subdivisions of the Ring
	 * @returns number[] an array of numbers spread evenly over the Ring
	 */
	getSubdivisionIntervalsForHash(ringHash: number, subdivisions: null | number = null): number[] {
		const subDivisionIntervals = this.getSubdivisionIntervals(subdivisions);

		for (const index in subDivisionIntervals) {
			subDivisionIntervals[index] = (subDivisionIntervals[index] + ringHash) % this.RingSettings.maxNodes;
		}

		subDivisionIntervals.sort((a, b) => a - b);

		return subDivisionIntervals;
	}



	/**
	 * registers a new node and it's virtual subnodes into the ring for lookup
	 * @param node TrekNodeInterface The node to be registered
	 * @returns void
	 */
	async register(node: TrekNodeInterface) {

		const nodeReady = await node.whenReady();
		if (!nodeReady) {
			console.error('node was not ready');
			return;
		}
		const name = node.get('name');
		if (name === undefined) {
			throw new Error('ready node has no name');
		}
		const nodeHash = this.hash(name);
		this.nodesHashes.push(nodeHash);
		this.nodeLookupByHash[nodeHash] = node;

		for (let i = 0; i < this.RingSettings.subNodes; i++) {
			const subNodeHash = this.hash(`${name} - subnode ${i}`);
			this.nodesHashesIncludingSubnodes.push(subNodeHash);
			this.nodeLookupByHash[subNodeHash] = node;
		}

		this.#sortNodeHashes();
		this.updateNodePointers();

		return;
	}

	/**
	 * Helper function to sort the hash arrays
	 */
	#sortNodeHashes() {
		this.nodesHashes.sort((a, b) => a - b);
		this.nodesHashesIncludingSubnodes.sort((a, b) => a - b);
	}

	/**
	 * updates the previous and next pointers of all nodes in the ring
	 */
	updateNodePointers() {
		//update nextNode of all nodes
		for (let i = 0; i < this.nodesHashes.length; i++) {
			const previousNodeIndex = i === 0 ? this.nodesHashes.length - 1 : i - 1;
			const nextNodeIndex = i === this.nodesHashes.length - 1 ? 0 : i + 1;

			const currentNode = this.nodeLookupByHash[this.nodesHashes[i]];
			//console.info(`i=${i} previousNodeIndex=${previousNodeIndex} nextNodeIndex=${nextNodeIndex}`);

			const previousNode = this.nodeLookupByHash[this.nodesHashes[previousNodeIndex]];
			const nextNode = this.nodeLookupByHash[this.nodesHashes[nextNodeIndex]];

			currentNode.previousNode = previousNode;
			currentNode.nextNode = nextNode;
		}
	}

	/**
	 * Lookup function to find the next node hash in the ring for a given key
	 * @param key string The key to lookup
	 * @returns number The hash of the next node in the ring
	 */
	lookup(key: string): number {
		const keyDec = this.hash(key);

		console.log('find', keyDec, 'in', this.getHashNameLookup());

		//find next biggest id in nodesHashesIncludingSubnodes
		const nextBiggestId = this.nodesHashesIncludingSubnodes.find((id) => id > keyDec) || this.nodesHashesIncludingSubnodes[0];

		console.log('found next biggest id', nextBiggestId, this.nodeLookupByHash[nextBiggestId].get('name'));

		return nextBiggestId;

	}

	/**
	 * Lookup function to find the next TrekNodeInterface in the ring for a given key
	 * @param key string The key to lookup
	 * @returns TrekNodeInterface The next node in the ring
	 */
	lookupNode(key: string): TrekNodeInterface {
		const nodeHash = this.lookup(key);

		return this.nodeLookupByHash[nodeHash];
	}

	getHashNameLookup() {
		const lookup: { [key: number]: string } = {};

		for (const hash of this.nodesHashesIncludingSubnodes) {
			const node = this.nodeLookupByHash[hash];
			const nodeName: string = node.get('name') || 'unknown';
			lookup[hash] = nodeName;
		}

		return lookup;
	}
}