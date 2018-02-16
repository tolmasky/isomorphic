const { EventEmitter } = require("events");

module.exports = function EmitterPromise(callback)
{
    const promise = new Promise((resolve, reject) =>
            setImmediate(() => callback(promise, resolve, reject)));

    const emitter = new EventEmitter();
    const prototype = EventEmitter.prototype;

    return Object.keys(prototype)
        .map(key => [key, emitter[key]])
        .filter(([key, value]) => typeof value === "function")
        .reduce((promise, [key, value]) =>
            Object.assign(promise, { [key]: value }), promise);
}
