var test = require('tape')
var defork = require('../')

// Contains two versions of a node inside a way; the one with the newer
// timestamp should be included.
test('fork', function (t) {
  var input = [
    { type: 'node',
      lat: 63.9,
      lon: -147.6,
      timestamp: 100,
      id: '2552852387437165718',
      version: 'b46af8c3794cc2be4177821f6ecd0dc9f6b3684f24375a94435eeb19d21c1a34' },
    { type: 'node',
      lat: 62.4,
      lon: -146.3,
      timestamp: 105,
      id: '3688784127941314493',
      version: 'bc0012fd7acb05597cf0f5792108fd936062ecafce440a51c9304ae12e03ef24' },
    { type: 'node',
      lat: 62.5,
      lon: -146.2,
      timestamp: 101,
      id: '3688784127941314493',
      version: '07ef85e47c1e8db10b11342b8bead27ef2b34c8f65f614b5277ae2a2fb768264' },
    { type: 'node',
      lat: 64.5,
      lon: -147.3,
      timestamp: 100,
      id: '14820318362135612004',
      version: 'b3de4a7d6c72f7fa0f8a6e41082e1f67f15ab0cee38c3f8a8c96ac97922d2be5' },
    { type: 'way',
      refs:
      [ '14820318362135612004',
        '2552852387437165718',
        '3688784127941314493' ],
      timestamp: 100,
      id: '13399941906737957041',
      version: '1c70645d13105610e993dec8d7e03b7b263959a5784aa1c500b8e817338bbcb9' }
  ]

  var actual = defork(input)
  actual.sort(idcmp)
  var expected = input.slice()
  expected.splice(2, 1)
  expected.sort(idcmp)

  t.deepEqual(actual, expected)
  t.end()
})

function idcmp (a, b) {
  var aloc = a.lat + ',' + a.lon
  var bloc = b.lat + ',' + b.lon
  if (a.id === b.id) return aloc < bloc ? -1 : 1
  return a.id < b.id ? -1 : 1
}
