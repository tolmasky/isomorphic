
const Route = require("route-parser");
const cached = { input: null, output: { } };


module.exports = function (options)
{
    if (cached.input === options)
        return cached.output;

    const outputs = toMatcher(options.outputs || { });
    const assets = toMatcher(options.assets || { });

    cached.input = options;
    cached.output = { route: toRoute(outputs, assets) };

    return cached.output;
}

function toRoute(outputs, assets)
{
    return function (input, compile)
    {
        if (!compile)
            return { input, URL: assets(input) };

        const output = outputs(input);
        const URL = assets(output);

        return { input, output, URL };
    }
}

function toMatcher(templates)
{
    const routes = Object
        .keys(templates)
        .map(input => [Route(input), Route(templates[input])]);

    return function (path)
    {
        for (const [input, output] of routes)
        {
            const captures = input.match(path);

            if (captures !== false)
                return output.reverse(captures);
        }

        throw new Error(`Could not find matching route for ${path}`);
    }
}
