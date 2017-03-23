var test = require('tape')
var hyperlog = require('hyperlog')
var fdstore = require('fd-chunk-store')
var path = require('path')
var memdb = require('memdb')

var tmpdir = require('os').tmpdir()
var storefile0 = path.join(tmpdir, 'osm-store-' + Math.random())
var storefile1 = path.join(tmpdir, 'osm-store-' + Math.random())

var osmdb = require('osm-p2p-db')

var defork = require('../')

// Contains two versions of a node inside a way; the one with the newer
// timestamp should be included.
test('fork', function (t) {
  t.plan(10)
  var osm0 = osmdb({
    log: hyperlog(memdb(), { valueEncoding: 'json' }),
    db: memdb(),
    store: fdstore(4096, storefile0)
  })
  var osm1 = osmdb({
    log: hyperlog(memdb(), { valueEncoding: 'json' }),
    db: memdb(),
    store: fdstore(4096, storefile1),
    size: 4096
  })
  var docs = {
    A: { type: 'node', lat: 64.5, lon: -147.3 },
    B: { type: 'node', lat: 63.9, lon: -147.6 },
    C: { type: 'node', lat: 64.2, lon: -146.5 },
    D: { type: 'way', refs: [ 'A', 'B', 'C' ] }
  }
  var names = {}
  var nodes = {}
  var versions = {}

  var keys = Object.keys(docs).sort()
  ;(function next () {
    if (keys.length === 0) return ready()
    var key = keys.shift()
    var doc = docs[key]
    if (doc.refs) {
      doc.refs = doc.refs.map(function (ref) { return names[ref] })
    }
    doc.timestamp = 100
    osm0.create(doc, function (err, k, node) {
      t.ifError(err)
      names[key] = k
      if (!versions[key]) versions[key] = []
      versions[key].push(node.key)
      nodes[k] = node
      next()
    })
  })()

  function ready () {
    var r0 = osm0.log.replicate()
    var r1 = osm1.log.replicate()
    r0.pipe(r1).pipe(r0)
    r0.once('end', function () {
      var newdoc0 = { type: 'node', lat: 62.5, lon: -146.2 }
      var newdoc1 = { type: 'node', lat: 62.4, lon: -146.3 }
      newdoc0.timestamp = 101
      newdoc1.timestamp = 105
      osm0.put(names.C, newdoc0, function (err, node) {
        t.ifError(err)
        versions.C.push(node.key)

        osm1.put(names.C, newdoc1, function (err, node) {
          t.ifError(err)
          versions.C.push(node.key)
          replicate()
        })
      })
    })
  }

  function replicate () {
    var r0 = osm0.log.replicate()
    var r1 = osm1.log.replicate()
    r0.pipe(r1).pipe(r0)
    r0.once('end', function () {
      check()
    })
  }

  function check () {
    var q0 = [[-90,90],[-180,180]]
    var ex0 = [
      { type: 'node', lat: 64.5, lon: -147.3,
        id: names.A, version: versions.A[0] },
      { type: 'node', lat: 63.9, lon: -147.6,
        id: names.B, version: versions.B[0] },
      { type: 'node', lat: 62.5, lon: -146.2,
        id: names.C, version: versions.C[1] },
      { type: 'node', lat: 62.4, lon: -146.3,
        id: names.C, version: versions.C[2] },
      { type: 'way', refs: [ names.A, names.B, names.C ],
        id: names.D, version: versions.D[0] }
    ].sort(idcmp)
    // osm0.query(q0, function (err, res) {
    //   t.ifError(err)
    //   t.deepEqual(res.sort(idcmp), ex0, 'query 0 osm0')
    // })
    osm1.query(q0, function (err, res) {
      t.ifError(err)
      // t.deepEqual(res.sort(idcmp), ex0, 'query 0 osm1')

      console.log('---')
      console.log(res)
      console.log('---')
      console.log(defork(res))
    })
  }
})

function idcmp (a, b) {
  var aloc = a.lat + ',' + a.lon
  var bloc = b.lat + ',' + b.lon
  if (a.id === b.id) return aloc < bloc ? -1 : 1
  return a.id < b.id ? -1 : 1
}
