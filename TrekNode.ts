import { TrekNodeServer, TrekNodeServerPackage } from "./TrekNodeServer.ts";
import { TrekRing } from './TrekRing.ts';
import { TrekNodeInterface, TrekNodeServerInfo } from './TrekNodeInterface.ts';

/**
 * The basic config for a TrekNode
 */
export type TrekNodeConfig = {
	name: string,
	port: number,
	nodes: string[],
};

/**
 * The TrekNode class is the main class of the TrekNode library.
 * It is responsible for handling the communication with other TrekNodes.
 * Also a lot of high level logic will be implemented here.
 */
export class TrekNode {
	#config: TrekNodeConfig;

	#ring = new TrekRing();
	#server: TrekNodeServer;

	constructor(config: TrekNodeConfig) {
		this.#config = config;

		this.#registerNodesInRing();

		this.#server = new TrekNodeServer(config.port);

		// here are all the incomming server requests bound to their corresponding methods
		this.#server.events.on('command-Test', this.#onTest.bind(this));
		this.#server.events.on('command-ServerSettingsName', this.#onServerSettingsName.bind(this));
		this.#server.events.on('command-ServerLookup', this.#onServerLookup.bind(this));
		this.#server.events.on('command-ServerInfo', this.#onServerInfo.bind(this));

		this.#server.events.on('command-DataStore', this.#onDataStore.bind(this));

	}

	/**
	 * @returns the name of the node
	 */
	getName(): string {
		return this.#config.name;
	}

	toString() {
		return `TrekNode ${this.#config.name}`;
	}

	/**
	 * Method to register this and all other known Nodes into the TrekRing module for future lookup
	 */
	#registerNodesInRing(): void {
		for (const nodeAddress of this.#config.nodes) {
			this.#ring.register(new TrekNodeInterface(nodeAddress));
		}
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
				hash: this.#ring.hash(testName),
				lookup: this.#ring.lookupNode(testName).get('name'),
			});
		}

		trekServerPackage.response.success(results);
	}

	#onServerInfo(trekServerPackage: TrekNodeServerPackage): void {
		const serverInfo: TrekNodeServerInfo = {
			name: this.#config.name,
			port: this.#config.port,
			nodes: this.#ring.getHashNameLookup(),
		};
		trekServerPackage.response.success(serverInfo);
	}

	#onDataStore(trekServerPackage: TrekNodeServerPackage): void {
		trekServerPackage.response.success({
			node: 1,
			hash: this.#ring.hash('test'),
		});
	}
}