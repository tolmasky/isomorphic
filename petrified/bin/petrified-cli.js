const { resolve } = require("path");
const options = require("commander")
    .option("--dev")
    .option("--drafts")
    .option("--source [source]", "root")
    .parse(process.argv);

const source = resolve(options.args[0] || process.cwd());
const destination = `${source}/_site`;
const cache = `${source}/_cache`;
const drafts = options.drafts;
const site = require(`${source}/petrified.json`);

require("./bootstrap")({ dev: options.dev, source });
require("../petrified")({ site, drafts, source, destination, cache });

require("./watch")({ destination });
