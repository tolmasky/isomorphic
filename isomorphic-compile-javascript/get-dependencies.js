const t = require("@babel/types");
const { data, string } = require("@algebraic/type");
const { Set, OrderedSet } = require("@algebraic/collections");
const babelTreeMapAccum = require("@climb/babel-tree-map-accum");
const StringSet = Set(string);
const EmptySet = StringSet();

const Metadata = data `Metadata` (
    free => [StringSet, EmptySet],
    locals => [StringSet, StringSet(["arguments"])],
    dependencies => [OrderedSet(string), OrderedSet(string)()] );


module.exports = function (node)
{
    return babelTreeMapAccum.type(t,
    {
        Identifier(metadata, node)
        {
            if (metadata.locals.has(node.name) ||
                metadata.free.has(node.name))
                return [metadata, node];

            const free = metadata.free.add(node.name);

            return [Metadata({ ...metadata, free }), node];
        },
        
        FunctionDeclaration(metadata, node)
        {
            if (!node.id && node.params.length <= 0)
                return [metadata, node];

            const [free, locals] = reducePatterns(
                true,
                node.id ? [node.id] : [],
                reducePatterns(false, node.params,
                    [metadata.free, metadata.locals]));

            return [Metadata({ ...metadata, free, locals }), node];            
        },

        FunctionExpression(metadata, node)
        {
            if (!node.id && node.params.length <= 0)
                return [metadata, node];

            const [free, locals] = reducePatterns(
                false,
                node.id ? [node.id] : [],
                reducePatterns(false, node.params,
                    [metadata.free, metadata.locals]));

            return [Metadata({ ...metadata, free, locals }), node];            
        },

        ArrowFunctionExpression(metadata, node)
        {
            if (node.params.length <= 0)
                return [metadata, node];

            const [free, locals] = reducePatterns(
                false,
                node.params,
                [metadata.free, metadata.locals]);

            return [Metadata({ ...metadata, free, locals }), node];            
        },

        VariableDeclaration(metadata, node)
        {
            const [free, locals] = reducePatterns(
                true,
                node.declarations.map(declarator => declarator.id),
                [metadata.free, metadata.locals]);

            return [Metadata({ ...metadata, free, locals }), node];
        },
        
        CatchClause(metadata, node)
        {
            if (!node.param)
                return [metadata, node];

            const [free, locals] = reducePatterns(
                false,
                [node.param],
                [metadata.free, metadata.locals]);

            return [Metadata({ ...metadata, free, locals }), node];
        },

        CallExpression(metadata, node)
        {
            if (!t.isIdentifier(node.callee, { name: "require" }) ||
                node.arguments.length > 1)
                return [metadata, node];

            const argument = node.arguments[0];

            if (!t.isStringLiteral(argument))
                return [metadata, node];

            const unresolved = argument.value;
            const previous = metadata.dependencies.valueSeq()
                .findIndex(dependency => dependency === unresolved);
            const index = previous > -1 ? previous : metadata.dependencies.size;
            const dependencies = previous > -1 ?
                metadata.dependencies : metadata.dependencies.add(unresolved);
            const newNode = { ...node, arguments: [t.numericLiteral(index)] };

            return [Metadata({ ...metadata, dependencies }), newNode];
        }
    }, Metadata({}), node);
}

function reducePatterns(local, patterns, [free, locals])
{
    if (patterns.length <= 0)
        return [free, locals];

    const names = [].concat(...patterns.map(variableNamesFromPattern));

    return [remove(free, names), local ? add(locals, names) : locals];
}

function remove(set, strings)
{
    return strings.reduce((set, string) => set.remove(string), set);
}

function add(set, strings)
{
    return strings.reduce((set, string) => set.add(string), set);
}

function variableNamesFromPattern(pattern)
{
    const type = pattern.type;
//                        element !== null && element !== undefined)
    return  type === "Identifier" ?
                [pattern.name] :
            type === "ArrayPattern" ?
                [].concat(...pattern.elements
                    .filter(element => !!element)
                    .map(variableNamesFromPattern)) :
            type === "AssignmentPattern" ?
                variableNamesFromPattern(pattern.left) :
            type === "RestElement" ?
                variableNamesFromPattern(pattern.argument) :
            pattern.properties.map(property => property.value);
}

