const options = require("commander")
    .option("--dev")
    .option("--source [source]", "root")
    .parse(process.argv);

if (options.dev)
    require("./bootstrap");

const source = options.args[0] || process.cwd();
const destination = `${source}/_site`;
const cache = `${source}/_cache`;

require("../petrified")({ source: `${source}/pages`, destination, cache });
