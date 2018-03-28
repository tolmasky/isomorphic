# Isomorphic Serialize

Isomorphic serialize is the serialization package used by the RunKit isomorphic
library. Isomorphic serialize can handle all native Javascript data types (including
circular references), and
[Immutable.js](https://facebook.github.io/immutable-js/).

[**Try it in your browser**](https://npm.runkit.com/@isomorphic/serialize).

## Serialization Features

* **IndexCompression** — This feature compresses the output and which can lead to a
size savings of around 30-35% but comes with a slight performance penalty. This option is on by default.

## Deserialization Features

* **immutable** — By passing the option `immutable` as `true` the deserialized value
will force all collections as [Immutable.js](https://facebook.github.io/immutable-js/)
collections, regardless of how they were originally serialized. This option is off
by default.
