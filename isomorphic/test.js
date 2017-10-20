
const express = require("./express");
const app = express();
const React = require("react");

app.use('/assets/', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    return <html entrypoint = "./test-component" __filename = { __filename } />;
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
