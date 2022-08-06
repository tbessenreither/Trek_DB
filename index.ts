import { TrekNode } from './TrekNode.ts';

const Config = {
	startingPort: 10000,
};


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

