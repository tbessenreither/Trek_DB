import { TrekNodeServer, TrekNodeServerPackage } from "./TrekNodeServer.ts";
import { hash, register, lookupNode } from './TrekRing.ts';

const Config = {
	startingPort: 10000,
};

type TrekNodeConfig = {
	name: string,
	port: number,
};

export class TrekNode {
	config?: TrekNodeConfig;
	nodeHash?: number;

	server: TrekNodeServer;


	constructor(config: TrekNodeConfig) {
		this.config = config;

		this.nodeHash = hash(config.name);


		this.server = new TrekNodeServer(config.port);

		this.server.events.on('command-Test', this.onTest.bind(this));
		this.server.events.on('command-ServerSettingsName', this.onServerSettingsName.bind(this));
		this.server.events.on('command-ServerLookup', this.onServerLookup.bind(this));

		register(config.name, this);
	}

	onServerSettingsName(trekServerPackage: TrekNodeServerPackage) {
		trekServerPackage.response.success(this.config?.name);
	}

	onTest(trekServerPackage: TrekNodeServerPackage) {
		trekServerPackage.response.success({
			message: "Test Reply",
		});
	}

	onServerLookup(trekServerPackage: TrekNodeServerPackage) {

		const results: { name?: string, hash?: number, lookup?: string }[] = [];
		for (let i = 0; i < 10; i++) {
			const testName = `teststring-${i}`;
			results.push({
				name: testName,
				//hash: hash(testName),
				lookup: lookupNode(testName).config?.name,
			});
		}

		trekServerPackage.response.success(results);
	}

	onRequest(trekServerPackage: TrekNodeServerPackage) {
		trekServerPackage.response.success({
			other: "things",
			moep: [1, 3, 5],
			message: "Hello World!!",
		});
	}
}


let instanceNumber = 0;
function spinnUpInstance() {
	const instance = new TrekNode({
		name: `TrekNode ${instanceNumber}`,
		port: Config.startingPort + instanceNumber,
	});
	instanceNumber++;

	return instance;
}

const instances: TrekNode[] = [];
function spinnUpInstances(number: number) {
	for (let i = 0; i < number; i++) {
		instances.push(spinnUpInstance());
	}
}

spinnUpInstances(2);
//console.log(instances);

