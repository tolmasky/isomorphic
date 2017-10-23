"use strict";

require("..")(
    require("commander")
        .option("--root [root]", "root")
        .option("--destination [destination]", "destination")
        .option("--cache [cache]", "cache", "/tmp/isomorphic-cache")
        .parse(process.argv));
