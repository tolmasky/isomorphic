
const checksums = { };
const URLKeys = { "script": "src", "link": "href", "img": "src" };


module.exports = function ({ URL, tag, ...rest })
{
    const integrity = checksums[URL];
    const bustedURL = URL + `?integrity=${integrity}`;
    const crossOrigin = "anonymous";

    return { ...rest, [URLKeys[tag] || "URL"]:  bustedURL, integrity, crossOrigin };
}
