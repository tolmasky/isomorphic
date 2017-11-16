
const ObjectAssign = Object.assign;
const hasOwnProperty = Object.prototype.hasOwnProperty;

const fs = require("fs");

const ok = ObjectAssign(
    value => ({ ok: value }),
    { or: (r, value) => error.is(r) ? value : r.ok });
const error = ObjectAssign(
    message => ({ error: Error(message) }),
    { is: r => hasOwnProperty.call(r, "error") });

exports.ok = ok;
exports.error = error; 

const to = f => function (...args)
{
    try { return ok(f.apply(this, arguments)) }
    catch (e) { return error(e) };
};

exports.to = to;
exports.read = to(fs.readFileSync);

const get = (o, [key, ...rest], r_o = ok(o)) =>
    error.is(r_o) ? r_o :
    (o => o === undefined || o === null ?
        error(`object does not contain ${key}`) :
        rest.length ? get(0, rest, ok(o)) : ok(o))(r_o.ok[key]);

exports.get = get;

exports.r = exports;
