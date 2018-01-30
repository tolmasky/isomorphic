const options = require("commander")
    .option("--dev")
    .option("--drafts")
    .option("--source [source]", "root")
    .parse(process.argv);

const source = options.args[0] || process.cwd();
const destination = `${source}/_site`;
const cache = `${source}/_cache`;
const drafts = options.drafts;

require("./bootstrap")({ dev: options.dev, source });
require("../petrified")({ drafts, source, destination, cache });

require("./watch")({ destination });
