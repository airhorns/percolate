nodeunit = require 'nodeunit'
Percolate = require '../src/percolate'

class TestWalker extends Percolate.Walker
  visit: (node) ->
    if node.success?
      node.success()
    else
      true

module.exports = {
  Case: nodeunit.testCase

  getTestCase: (block) ->
    node = new Percolate.TestCaseNode false, 'test case', block

  getBaseCase: (block) ->
    node = new Percolate.BaseNode 'test case', block

  runTestCase: (node) ->
    (new TestWalker).walk(node)
}
