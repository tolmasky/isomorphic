
const { base, getArguments } = require("generic-jsx");
const getMerkleChecksum = require("./get-merkle-checksum");
const incomplete = { };
const id = ({ children }) => children;


module.exports = function (value)
{
    var head = new node(<id>{ value }</id>);
    var cache = Object.create(null);

    while (head)
    {
        const [updated, result] = iterate(resolve, head);

        if (result !== incomplete)
            cache[getMerkleChecksum(head.call)] = result;

        if (!updated)
            return result;

        head = updated;
    }

    function resolve(value)
    {
        while (typeof value === "function")
        {
            const checksum = getMerkleChecksum(value);

            if (!hasOwnProperty.call(cache, checksum))
                return { value, resolved: false };

            value = cache[checksum];
        }

        return { value, resolved: true };
    }
}

function iterate(resolve, head)
{
    const { call, next } = head;
    const past = resolve(call);

    if (past.value !== call)
        return past.resolved ? [next, past.value] : unreachable();

    const { children } = getArguments(call);
    const candidates = children.map(resolve);
    const appended = candidates.reduce((head, { resolved, value }) =>
        resolved ? head : new node(value, head), head);

    if (appended !== head)
        return [appended, incomplete];

    const resolvedChildren = candidates.map(({ value }) => value);
    const flattenedChildren = flatten(resolvedChildren);

    if (flattenedChildren !== resolvedChildren)
    {
        const flattenedCall = <call children = { flattenedChildren } />;

        return [new node(flattenedCall, next), flattenedCall];
    }

    const result = <call children = { resolvedChildren } />();

    if (typeof result === "function")
        return [new node(result, next), result];

    return [next, result];
}

function flatten(array)
{
    for (const item of array)
        if (Array.isArray(item))
            return Object.assign(flatten(array), { flat: true });

    return Object.assign(array, { flat: true });

    function flatten(value)
    {
        if (Array.isArray(value))
            return [].concat(...value.map(flatten));

        return value;
    }
}

function unreachable()
{
    throw new Error("Should be unreachable");
}

function node(call, next)
{
    this.call = call;
    this.next = next;
    this.length = next ? next.length + 1 : 1;
}
