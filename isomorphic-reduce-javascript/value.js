const { is, data, union, primitives } = require("@algebraic/type");
const ValueSymbol = Symbol("Value");

// Currently, we only consider values that have value equality as Definite
// values. Perhaps later we can incorporate literals like RegExp and Arrays.
const Definite = union `Definite` (
    primitives.boolean,
    primitives.number,
    primitives.string,
    primitives.tnull,
    primitives.tundefined );

const Indefinite = union `Indefinite` (
    data `Truthy` (),
    data `Falsey` (),
    data `Function` (),
    data `Object` (),
    data `Array` (),
    data `Symbol` (),
    data `RegExp` () );

const Value = union `Value` (
    Definite,
    Indefinite,
    data `Unknown` () );

module.exports = Value;

Value.Value = Value;

Value.Definite = Definite;
Value.Indefinite = Indefinite;

Value.from = function ValueGet(node)
{
    if (!node.hasOwnProperty(ValueSymbol))
        throw Error(`No value attached to ${node.type} node.`);

    return node[ValueSymbol];
}

Value.on = function ValueOn(node, value)
{
    node[ValueSymbol] = value;

    return node;
}

Value.isPureCoercableToBoolean = function isPureCoercableToBoolean(value)
{
    return value !== Value.Unknown;
}

Value.toBoolean = function toBoolean(value)
{
    if (!Value.isPureCoercableToBoolean(value))
        throw TypeError("Cannot convert Unknown to boolean.");

    if (is(Definite, value))
        return !!value;

    if (value === Indefinite.Truthy)
        return true;

    if (value === Indefinite.Falsey)
        return false;

    return true;
}

Value.isPureCoercableToNumber = function isPureCoercableToNumber(value)
{
    return is(Definite, value); 
}

Value.toNumber = function (value)
{
    if (!Value.isPureCoercableToNumber(value))
        throw TypeError("Cannot convert Unknown to boolean.");

    return +value;
}

Value.equals = function (lhs, rhs)
{
    return  is(Definite, lhs) &&
            is(Definite, rhs) &&
            Object.is(lhs, rhs);
}
