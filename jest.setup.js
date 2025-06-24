/// jest.setup.js
import "@testing-library/jest-dom";

// Add TextEncoder and TextDecoder polyfills for Node.js environment
// Required for Prisma client in Jest tests
if (typeof global.TextEncoder === "undefined") {
    const { TextEncoder, TextDecoder } = require("util");
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

// Add fetch polyfill for Node.js environment using undici
// Required for Prisma Accelerate extension in Jest tests
if (typeof global.fetch === "undefined") {
    const { fetch, Headers, Request, Response } = require("undici");
    global.fetch = fetch;
    global.Headers = Headers;
    global.Request = Request;
    global.Response = Response;
}
