nodeunit = require 'nodeunit'
Percolate = require '../src/percolate'

class TestWalker
  traversesTextNodes: false
  success: true
  exitedNode: (node) ->
    if node.success?
      @success = node.success() && @success
    true

module.exports = {
  Case: nodeunit.testCase

  getTestCase: (block) ->
    node = new Percolate.TestCaseNode false, 'test case', block

  getBaseCase: (block) ->
    node = new Percolate.BaseNode 'test case', block

  runTestCase: (tree) ->
    walker = new TestWalker
    tree.traverse walker
    walker.success
}
