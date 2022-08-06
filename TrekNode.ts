import { TrekNodeServer, TrekNodeServerPackage } from "./TrekNodeServer.ts";
import { hash, register, lookupNode } from './TrekRing.ts';

/**
 * The basic config for a TrekNode
 */
type TrekNodeConfig = {
	name: string,
	port: number,
};

/**
 * The TrekNode class is the main class of the TrekNode library.
 * It is responsible for handling the communication with other TrekNodes.
 * Also a lot of high level logic will be implemented here.
 */
export class TrekNode {
	#config: TrekNodeConfig;
	#nodeHash?: number;

	#server: TrekNodeServer;


	constructor(config: TrekNodeConfig) {
		this.#config = config;

		this.#nodeHash = hash(config.name);
		this.#registerNodesInRing();

		this.#server = new TrekNodeServer(config.port);

		// here are all the incomming server requests bound to their corresponding methods
		this.#server.events.on('command-Test', this.#onTest.bind(this));
		this.#server.events.on('command-ServerSettingsName', this.#onServerSettingsName.bind(this));
		this.#server.events.on('command-ServerLookup', this.#onServerLookup.bind(this));

	}

	/**
	 * Method to register this and all other known Nodes into the TrekRing module for future lookup
	 */
	#registerNodesInRing(): void {
		//register self
		register(this.#config.name, this);
		//register other nodes
		//todo: register other known nodes
	}

	// from here on are server request event Handlers
	#onServerSettingsName(trekServerPackage: TrekNodeServerPackage): void {
		trekServerPackage.response.success(this.#config?.name);
	}

	#onTest(trekServerPackage: TrekNodeServerPackage): void {
		trekServerPackage.response.success({
			message: "Test Reply",
		});
	}

	#onServerLookup(trekServerPackage: TrekNodeServerPackage): void {

		const results: { name?: string, hash?: number, lookup?: string }[] = [];
		for (let i = 0; i < 10; i++) {
			const testName = `teststring-${i}`;
			results.push({
				name: testName,
				//hash: hash(testName),
				lookup: lookupNode(testName).#config?.name,
			});
		}

		trekServerPackage.response.success(results);
	}

	#onRequest(trekServerPackage: TrekNodeServerPackage): void {
		trekServerPackage.response.success({
			other: "things",
			moep: [1, 3, 5],
			message: "Hello World!!",
		});
	}
}