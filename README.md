# osm-p2p-defork

> Convert forking osm-p2p documents into a linear history.

Transforms a list of [osm-p2p-db](https://github.com/digidem/osm-p2p-db/)
documents into a sublist with a linear (non-forking) history.

## Usage

```js
var defork = require('osm-p2p-defork')

osm.query([[-90, 90], [-180, 180]], function (err, docs) {
  docs = defork(docs)
  console.log(docs)
})
```

outputs the results from the `osm.query()`, but with a linear history (no forked
documents).

## API

```js
var defork = require('osm-p2p-defork')
```

### defork(docs)

Consumes a list of OSM documents, formatted as would be returned by
`osm-p2p-db`'s [query](https://github.com/digidem/osm-p2p-db/#osmqueryq-opts-cb)
function.

Returns the same documents, but with certain documents filtered to present a
linear history.

Timestamps (a `timestamp` field) should be present on all documents. If they
aren't, sorting happens based on the document's `version` field. This guarantees
a non-forking history, but it will not likely be semantically what you want.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install osm-p2p-defork
```

## License

ISC
