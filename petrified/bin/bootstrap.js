const { dirname, join } = require("path");

const pkg = dirname(__dirname);
const node_modules = `${pkg}/node_modules`;

const project = dirname(pkg);

const Module = require("module");
const oldResolveLookupPaths = Module._resolveLookupPaths;

module.exports = function ({ dev, source })
{
    if (dev)
        Module._resolveLookupPaths = function(request, parent, newReturn)
        {
            const result = oldResolveLookupPaths.apply(this, arguments);
            const node_modules = `${pkg}/node_modules`;
        
            if (newReturn)
                return (result || []).concat(node_modules, project);
        
            return [result[0], result[1].concat(node_modules, project)];
        }

    const node = process.versions.node;
    const match = pkg => (regexp => filename => regexp.test(filename))
        (new RegExp(`^${pkg}/[^/]*/(?!node_modules/[./]*).*`));

    require("isomorphic-preset");

    require("./multi-register")([
    {
        match: dev && match(project),
        presets: [ ["isomorphic-preset", { node, "generic-jsx": true }] ],
    },
    {
        match: match(source),
        presets: [ ["isomorphic-preset", { node, "react": true }] ],
        plugins: ["babel-plugin-emotion"]
    }]);
}