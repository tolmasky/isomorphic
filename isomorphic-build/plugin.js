const { data, string, parameterized } = require("@algebraic/type");
const { Cause, field, event } = require("@cause/cause");
const Metadata = require("./plugin/metadata");
const CACHE = "./cache";

const Request = data `Request` (
    input           => string );

const Response = data `Response` (
    output          => string,
    metadata        => Metadata );

const Plugin = Cause(`Plugin`,
{
    [field `path`]: -1,

/*    [event.on (Cause.Start)]: (plugin)
    {
        console.log("hi...");
        return [
    },*/
    [event._on (Request)]: (plugin, { input }) =>
    {
    try {
        const x = [plugin, [require("../isomorphic-compile-javascript/compile-javascript")({ input, cache:CACHE, options: { } })]]
        
        return x;
        }
    catch (e)
    {
        console.log(e);
    } }
});

Plugin.Request = Request;
Plugin.Response = Response;

module.exports = Plugin;
