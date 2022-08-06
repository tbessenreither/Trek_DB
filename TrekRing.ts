import { createHash } from "https://deno.land/std@0.77.0/hash/mod.ts";
import { TrekNode } from "./TrekNode.ts";

export const RingSettings = {
	hexLength: 6,
	maxNodes: hexToDec("".padEnd(6, "f")),
	subNodes: 20,
};

/**
 * Converts a hex string into a decimal number
 * @param hex string of hexadecimal characters
 * @returns number The decimal value of the hex string
 */
export function hexToDec(hex: string): number {
	return parseInt(hex, 16);
}

/**
 * hashes a string into a number within the Rings range
 * @param str string to be hashed
 * @returns number The hash value of the string
 */
export function hash(str: string): number {
	const hash = createHash('md5').update(str).toString('hex');

	const hashShortened = hash.substring(0, RingSettings.hexLength);

	const hashDec = hexToDec(hashShortened);

	return hashDec;
}

/**
 * creates <subdivisions> numbers spread evenly over the Rings range
 * @param subdivisions number of subdivisions of the Ring
 * @returns number[] an array of numbers spread evenly over the Ring
 */
export function getSubdivisionIntervals(subdivisions: null | number = null): number[] {
	if (subdivisions === null) {
		subdivisions = RingSettings.subNodes;
	}
	const maxNodes = RingSettings.maxNodes;

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
export function getSubdivisionIntervalsForHash(ringHash: number, subdivisions: null | number = null): number[] {
	const subDivisionIntervals = getSubdivisionIntervals(subdivisions);

	for (const index in subDivisionIntervals) {
		subDivisionIntervals[index] = (subDivisionIntervals[index] + ringHash) % RingSettings.maxNodes;
	}

	subDivisionIntervals.sort((a, b) => a - b);

	return subDivisionIntervals;
}


const nodesIds: number[] = [];
const nodeLookup: { [key: number]: TrekNode } = {};
/**
 * registers a new node and it's virtual subnodes into the ring for lookup
 * @param name string The name of the new node
 * @param node TrekNode The node to be registered
 * @returns void
 */
export function register(name: string, node: TrekNode): void {
	const nodeHash = hash(name);

	const subNodeHashes = getSubdivisionIntervalsForHash(nodeHash);
	for (const subNodeHash of subNodeHashes) {

		nodesIds.push(subNodeHash);
		nodeLookup[subNodeHash] = node;
	}

	nodesIds.sort((a, b) => a - b);

	return;
}

/**
 * Lookup function to find the next node hash in the ring for a given key
 * @param key string The key to lookup
 * @returns number The hash of the next node in the ring
 */
export function lookup(key: string): number {
	const keyDec = hash(key);

	//find next biggest id in nodesIds
	const nextBiggestId = nodesIds.find((id) => id > keyDec) || nodesIds[0];

	return nextBiggestId;

}

/**
 * Lookup function to find the next TrekNode in the ring for a given key
 * @param key string The key to lookup
 * @returns TrekNode The next node in the ring
 */
export function lookupNode(key: string): TrekNode {
	const nodeHash = lookup(key);

	return nodeLookup[nodeHash];
}