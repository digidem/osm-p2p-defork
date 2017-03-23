// Function that consumes an array of OSM elements (ways, nodes, etc) and
// filters out those with duplicate OSM IDs, keeping only the latest element
// for each present OSM ID.
//
// Note that this will also filter out nodes belonging to ways that are
// filtered.
module.exports = function (elements) {
  var latestFirst = elements.sort(cmpFork)
  var nonForkedElements = []
  var keepNodeRefs = {}
  var excludeNodeRefs = {}
  var seen = {}

  // Filter out the non-latest version of each element.
  nonForkedElements = latestFirst.filter(function (element) {
    if (!seen[element.id]) {
      seen[element.id] = true

      // Note that all of the nodes referenced by this way should be kept.
      if (element.type === 'way') {
        (element.nodes || element.refs).forEach(function (ref) {
          keepNodeRefs[ref] = true
        })
      }

      return true
    } else {
      seen[element.id] = true

      // Note that all of the nodes referenced by this way should be culled.
      if (element.type === 'way') {
        element.nodes.forEach(function (ref) {
          excludeNodeRefs[ref] = true
        })
      }

      return false
    }
  })

  // Filter out all nodes that are referenced in filtered ways.
  nonForkedElements = nonForkedElements.filter(function (elm) {
    if (elm.type === 'node' && (keepNodeRefs[elm.id] || !excludeNodeRefs[elm.id])) {
      return true
    } else if (elm.type !== 'node') {
      return true
    } else {
      return false
    }
  })

  // Sort by type
  nonForkedElements.sort(cmpType)

  return nonForkedElements
}

var typeOrder = { node: 0, way: 1, relation: 2 }
function cmpType (a, b) {
  return typeOrder[a.type] - typeOrder[b.type]
}

/**
 * Sort function to sort forks by most recent first, or by version id
 * if no timestamps are set
 */
function cmpFork (a, b) {
  if (a.timestamp && b.timestamp) {
    if (a.timestamp > b.timestamp) return -1
    if (a.timestamp < b.timestamp) return 1
    return 0
  }
  if (a.timestamp) return -1
  if (b.timestamp) return 1
  // Ensure sorting is stable between requests
  return a.version < b.version ? -1 : 1
}
