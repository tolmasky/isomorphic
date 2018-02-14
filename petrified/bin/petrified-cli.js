const { resolve } = require("path");
const options = require("commander")
    .option("--dev")
    .option("--drafts")
    .option("--serve")
    .option("--watch")
    .option("--no-build")
    .option("--port [port]", 0)
    .option("--socket [socket]")
    .parse(process.argv);

const source = resolve(options.args[0] || process.cwd());
const destination = `${source}/_site`;
const cache = `${source}/_cache`;
const drafts = options.drafts;
const site = require(`${source}/petrified.json`);

require("./bootstrap")({ dev: options.dev, source });

const { build, serve, watch } = options;

if (build)
    require("./build")({ site, drafts, source, destination, cache });

if (serve)
    return require("./serve")({ source: destination, port: options.port, socket: options.socket })

if (watch)
    return require("./watch/watch_")({ source, destination, port: options.port })
