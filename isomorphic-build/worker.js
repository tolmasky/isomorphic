const { declare, data, string } = require("@algebraic/type");
const { Cause, field, event } = require("@cause/cause");
const CACHE = "./cache";

const FIXME_ANY = declare({ is: () => true, serialize:[()=>0,true],deserialize:()=>undefined });
const Transform = data `Transform` (
    fromKeyPath => [FIXME_ANY, undefined],
    source  => string );

Transform.prototype.update = function (key, f)
{
    return Transform({ ...this, [key]: f(this[key]) });
}

Transform.prototype.update = function (key, f)
{
    return Transform({ ...this, [key]: f(this[key]) });
}


const Worker = Cause("Worker",
{
    [event._on (Transform)]: (worker, { source }) =>
    {console.log("OH...");
        const result = 
            require("../isomorphic-compile-javascript/compile-javascript")({ input: source, cache:CACHE, options: { } });
console.log(result);
        return [worker, []];
    }
});

module.exports = Worker;

Worker.Transform = Transform;
