const t = require("@babel/types");
const { isArray } = Array;
const { data, union, string } = require("@algebraic/type");
const { List, Map, Set, OrderedSet } = require("@algebraic/collections");
const innerTreeReduceBabel = require("@climb/inner-tree-reduce-babel");

const Metadata = data `Metadata` (
    dependencies    => OrderedSet(string),
    globals         => Set(string) );

const KeyPath = union `KeyPath` (
        data `Root` (),
        data `Parent` (
            key => string,
            child => KeyPath) );

KeyPath.from = function (keys)
{
    return keys.reduceRight((child, key) =>
        KeyPath.Parent({ key, child }),
        KeyPath.Root);
}

KeyPath.set = function (value, keyPath, node)
{
    if (keyPath === KeyPath.Root)
        return value;

    const { key } = keyPath;
    const child = KeyPath.set(value, keyPath.child, node[key]);

    return isArray(node) ?
        Object.assign([...node], { [key]: child }) :
        { ...node, [key]: child };
}

KeyPath.Parent.prototype.toString = function ()
{
    return this.key + "." + this.child;
}

const KeyPathList = Array;//List(KeyPath);
const EmptyKeyPathList = [];//KeyPathList();
const StartKeyPathList = [KeyPath.from(["arguments", "0"])];//KeyPathList([KeyPath.Root]);
const RequireKeyPaths = Map(string, KeyPathList);
const EmptyRequireKeyPaths = RequireKeyPaths();

const StringSet = Set(string);
const EmptyStringSet = StringSet();


module.exports = function (domain, node)
{
    const VariableSet = FiniteDomainSet(domain);
    const [requireKeyPaths, free] = reduceOn(VariableSet, node);
    
    const keys = requireKeyPaths.keySeq().toList().sort();
    const newNode = keys.reduce(function (node, request, index)
    {
        const keyPaths = requireKeyPaths.get(request);
        const reference = t.NumericLiteral(index);

        return keyPaths.reduce((node, keyPath) =>
            KeyPath.set(reference, keyPath, node), node);
    }, node);
    const dependencies = OrderedSet(string)(keys);
    const globals = VariableSet.toSet(free);

    return [newNode, Metadata({ dependencies, globals })];
}

function reduceOn(VariableSet, node)
{
    const { subtract, union, fromPatterns } = VariableSet;
    const reconcile = reconcileOn(VariableSet);

    return innerTreeReduceBabel.type(t,
    {
        Node(node, children)
        {
            return reconcile(node, children);
        },

        CallExpression(node, children)
        {
            if (node.callee.type !== "Identifier" ||
                node.callee.name !== "require" ||
                node.arguments.length !== 1)
                return reconcile(node, children);

            const argument = node.arguments[0];

            return argument.type !== "StringLiteral" ?
                reconcile(node, children) :
                [
                    RequireKeyPaths({ [argument.value]: StartKeyPathList }),
                    VariableSet.from(["require"]),
                    VariableSet.empty
                ];
        },

        Identifier(node)
        {
            return [EmptyRequireKeyPaths, fromPatterns(node), VariableSet.empty];
        },
        
        VariableDeclaration(node, children)
        {
            const [dependencies, free] = reconcile(node, children);
            const locals = fromPatterns(node
                .declarations.map(declarator => declarator.id));

            return [dependencies, subtract(free, locals), locals];
        },
        
        FunctionDeclaration(node, children)
        {
            const [dependencies, free] = reconcile(node, children);
            const { id, params } = node;
            const patterns = id ? [id, ...params] : params;

            return [dependencies,
                subtract(free, fromPatterns(patterns)),
                id ? fromPatterns(id) : VariableSet.empty];
        },

        FunctionExpression(node, children)
        {
            const [dependencies, free] = reconcile(node, children);
            const { id, params } = node;
            const patterns = id ? [id, ...params] : params;

            return [dependencies,
                subtract(free, fromPatterns(patterns)),
                VariableSet.empty];
        },

        ArrowFunctionExpression(node, children)
        {
            const [dependencies, free] = reconcile(node, children);
            const { id, params } = node;

            return [dependencies,
                subtract(free, fromPatterns(params)),
                VariableSet.empty];
        },

        BlockStatement(node, children)
        {
            const [dependencies, free] = reconcile(node, children);

            return [dependencies, free, VariableSet.empty];
        },

        CatchClause(node, children)
        {
            const [dependencies, free, locals] = reconcile(node, children);
            const { param } = node;

            return [dependencies, 
                param ? free : subtract(free, fromPatterns(param)),
                VariableSet.empty];
        }
    }, node);
}

function FiniteDomainSet(domain)
{
    const domainConstants = [...domain]
        .reduce((object, key, index) =>
            (object[key] = 1 << index, object),
            Object.create(null));

    const union = (lhs, rhs) =>
        typeof rhs === "number" ?
            lhs | rhs :
            rhs.reduce((lhs, string) =>
                lhs | (domainConstants[string] || 0),
                lhs);

    const subtract = (lhs, rhs) =>
        typeof rhs === "number" ?
            lhs & ~rhs :
            rhs.reduce((lhs, string) =>
                lhs & ~(domainConstants[string] || 0),
                lhs);

    const empty = 0;

    const from = items => union(empty, items);
    const fromPatterns = patterns => Array.isArray(patterns) ?
        patterns.reduce((accum, pattern) =>
            union(accum,
                variableNamesFromPattern({ empty, union, from }, pattern)),
            empty) :
        variableNamesFromPattern({ empty, union, from }, patterns);

    const toSet = finiteDomainSet => Set(string)(domain
        .filter(string => domainConstants[string] & finiteDomainSet));

    return { empty, union, subtract, from, fromPatterns, toSet };
}

function variableNamesFromPattern({ empty, union, from }, pattern)
{
    const type = pattern.type;
//                        element !== null && element !== undefined)
    return  type === "Identifier" ?
                from([pattern.name]) :
            type === "ArrayPattern" ?
                pattern.elements
                    .filter(element => !!element)
                    .map(variableNamesFromPattern)
                    .reduce(union, empty) :
            type === "AssignmentPattern" ?
                variableNamesFromPattern(pattern.left) :
            type === "RestElement" ?
                variableNamesFromPattern(pattern.argument) :
            from(pattern.properties.map(property => property.value));
}

function reconcileOn(VariableSet)
{
    const { union, subtract, empty } = VariableSet;

    return function (node, children)
    {
        const fields = node && node.type && t.VISITOR_KEYS[node.type];
        const dependencies = children.reduce(function (lhs, [rhs], index)
        {
            if (rhs === EmptyRequireKeyPaths)
                return lhs;
    
            const key = fields ? fields[index] : index + "";
    
            return rhs.reduce((accum, keyPaths, request) =>
                accum.updateIn(
                    [request],
                    EmptyKeyPathList,
                    accum => accum.concat(
                        keyPaths.map(child =>
                            KeyPath.Parent({ key, child })))), lhs);
        }, EmptyRequireKeyPaths);
        const locals = children.reduce((lhs, [,, locals]) =>
            union(lhs, locals), empty);
        const free = children.reduce((lhs, [, free]) =>
            subtract(union(lhs, free), locals), empty);

        return [dependencies, free, locals];
    }
}
