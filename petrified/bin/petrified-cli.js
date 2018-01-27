const options = require("commander")
    .option("--dev")
    .option("--source [source]", "root")
    .parse(process.argv);

const source = options.args[0] || process.cwd();
const destination = `${source}/_site`;
const cache = `${source}/_cache`;

require("./bootstrap")({ dev: options.dev, source });
require("../petrified")({ source, destination, cache });
