export type TrekNodeServerInfo = {
	name: string,
	port: number,
	nodes?: { [key: number]: string },
}

export class TrekNodeInterface {
	previousNode: TrekNodeInterface = this;
	nextNode: TrekNodeInterface = this;

	#ready: boolean | null = null;
	#address: string;
	#serverInfo?: TrekNodeServerInfo;

	constructor(address: string) {
		this.#address = address;

		this.#fetchServerInfo();
	}

	get<Key extends keyof TrekNodeServerInfo>(key: Key) {
		if (!this.#ready || !this.#serverInfo) {
			return;
		}
		return this.#serverInfo[key];
	}

	async #fetchServerInfo() {
		try {
			this.#serverInfo = await this.request('ServerInfo') as TrekNodeServerInfo;
			this.#ready = true;
		} catch (_e) {
			this.#ready = false;
		}
	}

	whenReady() {
		const poll = (resolve: any) => {
			if (this.#ready !== null) {
				resolve(this.#ready);
			} else {
				setTimeout(() => poll(resolve), 500);
			}
		};
		return new Promise(poll);
	}

	#commandToUrl(command: string) {
		return command.replace(/([a-z])([A-Z])/g, '$1\/$2').toLowerCase();
	}

	request(command: string, method = 'POST'): Promise<{}> {
		return new Promise((resolve, reject) => {
			const headers = new Headers();
			headers.append("Content-Type", "application/json");

			const bodyObj = {
				command: command,
			};
			const bodyString = JSON.stringify(bodyObj);

			const requestOptions: RequestInit = {
				method: method,
				headers: headers,
				body: bodyString,
				redirect: 'follow'
			};

			const commandUrl = this.#commandToUrl(command);
			const fetchUrl = `${this.#address}/${commandUrl}`;

			fetch(fetchUrl, requestOptions)
				.then(response => response.json())
				.then(data => {
					if (data.success) {
						resolve(data.data);
					} else {
						reject(data.error);
					}
				})
				.catch(reject);
		});

	}
}