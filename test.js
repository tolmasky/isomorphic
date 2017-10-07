
const express = require("./express");
const app = express();
const React = require("react");
const Isomorphic = require("./isomorphic");
const TestComponent = require("./test-component");

app.use('/assets/', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    return  <TestComponent/>;
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
