
const express = require("isomorphic/express");
const app = express();
const React = require("react");

app.use("/assets/", express.static(__dirname + '/assets'));

app.get("/", () => 
    <html entrypoint = "./counter" />);

app.listen(3000, () =>
  console.log('Example app listening on port 3000!'));
