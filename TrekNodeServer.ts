import EventEmitter from "https://deno.land/x/events/mod.ts";

type ResponseCallback = (response: TrekNodeServerResponse) => void;
export type TrekNodeServerHandler = (trekServerPackage: TrekNodeServerPackage) => TrekNodeServerResponse;

/**
 * TrekNodeServerPackage
 * 
 * Incomming data package to be handled by TrekNode
 * Contains the request data / payload and the timeout handler as well as the response instance
 * 
 * The respond function triggers the corresponding callback. It is not reccomended to use the response method but the response instances error() and success() methods.
 * 
 */
export class TrekNodeServerPackage {
	method = ""
	url = ""
	command = ""
	args = []

	#timeout = 1000
	#timeoutRef = setTimeout(this.#respondTimeout.bind(this), this.#timeout);

	response = new TrekNodeServerResponse()

	#responseCallback?: ResponseCallback

	constructor(responseCallback: ResponseCallback) {
		this.#responseCallback = responseCallback;
		this.response.events.on('respond', this.respond.bind(this));
	}

	#respondTimeout(): void {
		this.response.error("Timeout");
	}

	respond(response?: TrekNodeServerResponse): void {
		clearTimeout(this.#timeoutRef);

		if (this.#responseCallback) {
			if (response) {
				this.#responseCallback(response);
			} else {
				this.#responseCallback(this.response);
			}
		}
	}
}


/**
 * TrekNodeServerResponse
 * 
 * Class for responding to a incomming request
 * use the error() and success() methods to respond to the request
 * 
 * while the geter are publicly available they are for use in the response generation only.
 */
export class TrekNodeServerResponse {
	events = new EventEmitter();

	#statusCode = 200
	#responseSuccess = true
	#responseErrorMessage: string | null = null
	#responseData: any = {}

	#contentType = "application/json"

	error(responseErrorMessage: string, statusCode = 500): void {
		this.#responseSuccess = false;
		this.#statusCode = statusCode;
		this.#responseErrorMessage = responseErrorMessage;
		this.#responseData = {};

		this.#respond();
	}

	success(responseData: any): void {
		this.#responseSuccess = true;
		this.#statusCode = 200;
		this.#responseErrorMessage = null;
		this.#responseData = responseData;

		this.#respond();
	}

	getBody() {
		return JSON.stringify({
			success: this.#responseSuccess,
			code: this.#statusCode,
			error: this.#responseErrorMessage,
			data: this.#responseData,
		});
	}

	getContentType() {
		return this.#contentType;
	}

	getCode() {
		return this.#statusCode;
	}

	#respond() {
		this.events.emit("respond");
	}
}


/**
 * TrekNodeServer
 * Emmits the following events
 * - command-<command>
 * - package
 * 
 * Methods are not supposed to be called from outside of TrekNodeServer
 */
export class TrekNodeServer {
	events = new EventEmitter();

	port: number;
	server: Deno.Listener;

	constructor(port: number) {
		this.port = port;
		this.server = this.#createServer();
		this.#listen();
	}

	#createServer(): Deno.Listener {
		const server = Deno.listen({ port: this.port });
		return server;
	}

	async #listen() {
		for await (const conn of this.server) {
			// In order to not be blocking, we need to handle each connection individually
			// without awaiting the function
			this.#serve(conn);
		}
	}

	async #serve(conn: Deno.Conn) {
		const httpConn = Deno.serveHttp(conn);

		for await (const requestEvent of httpConn) {
			this.#handle(requestEvent);
		}
	}

	#handle(requestEvent: Deno.RequestEvent) {
		const trekNodeServerPackage = new TrekNodeServerPackage((response) => {
			requestEvent.respondWith(
				new Response(response.getBody(), {
					status: response.getCode(),
					headers: {
						"content-type": response.getContentType(),
					},
				}),
			).catch(() => { });
		});

		trekNodeServerPackage.method = requestEvent.request.method;
		trekNodeServerPackage.url = this.#urlRemoveDomain(requestEvent.request.url);
		trekNodeServerPackage.command = this.#urlToCommand(requestEvent.request.url);

		this.events.emit('package', trekNodeServerPackage);
		this.events.emit(`command-${trekNodeServerPackage.command}`, trekNodeServerPackage);
	}


	#urlToCommand(url: string) {
		url = this.#urlRemoveDomain(url);

		return url.split('/').join(' ').replace(/(?:^\w|[A-Z]|\b\w)/g, function (word: string, _index: number) {
			return word.toUpperCase();
		}).replace(/\s+/g, '');
	}

	#urlRemoveDomain(url: string) {
		const urlParts = url.split('/');

		urlParts.shift();
		urlParts.shift();
		urlParts.shift();

		url = urlParts.join('/');

		return url;
	}
}

