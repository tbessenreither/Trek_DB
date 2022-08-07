import { TrekNode } from './TrekNode.ts';

const Config = {
	startingPort: 10000,
	numberOfInstances: 3,
};

const nodeAddresses: string[] = [];
for (let i = 0; i < Config.numberOfInstances; i++) {
	nodeAddresses.push(`http://localhost:${Config.startingPort + i}`);
}

let instanceNumber = 0;
function spinnUpInstance() {
	const instance = new TrekNode({
		name: `TrekNode-${instanceNumber}`,
		port: Config.startingPort + instanceNumber,
		nodes: nodeAddresses,
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

spinnUpInstances(Config.numberOfInstances);
//console.log(instances);
