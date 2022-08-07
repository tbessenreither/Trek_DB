# Trek DB

A distributed node / replica based data storage system based on Ring or
Consistent Hashing.

Written in Typescript on deno

To setup just install deno version 1.24 and run via deno run --allow-net
index.ts

This project is a work in progress and is not yet production ready.

There are a lot of features missing.

Documentation will be added when they are planned out

## Architecture

### TrekRing.ts

The TrekRing Module handles all the hashing, registerying of nodes into the ring
hash as well as the lookup of keys within the ring.

```typescript
function hex2dec(hex: string): number;
function hash(str: string): number;
function getSubdivisionIntervals(subdivisions: null | number = null): number[];
function getSubdivisionIntervalsForHash(
  ringHash: number,
  subdivisions: null | number = null,
): number[];
function register(name: string, node: TrekNode): void;
function lookup(key: string): number;
function lookupNode(key: string): TrekNode;
```

### TrekNodeServer.ts

```typescript
class TrekNodeServerPackage {
  method: string;
  url: string;
  command: string;
  args: string[];
  response: TrekNodeServerResponse;

  respond(response?: TrekNodeServerResponse): void;
}

class TrekNodeServerResponse {
  events: EventEmitter;
  error(responseErrorMessage: string, statusCode = 500): void;
  success(responseData: any): void;
}

type TrekNodeServerHandler = (
  trekServerPackage: TrekNodeServerPackage,
) => TrekNodeServerResponse;

class TrekNodeServer {
  events: EventEmitter;

  constructor(port: number);
}
```

## Networking

Trek uses an http server for communication. Content is exclusively JSON.

Endpoints are

### /test

Sends a test reply

### /lookup

Performs an example lookup in the Trek Ring
