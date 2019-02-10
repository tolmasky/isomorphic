if (parseInt(process.version.split(".")[0], 10) >= 10)
{
    const { mkdirSync } = require("fs");

    module.exports = path => mkdirSync(path, { relative: true });
}
else
{
    const { execSync } = require("child_process");

    module.exports = path => execSync(`mkdir -p ${JSON.stringify(path)}`);
}
