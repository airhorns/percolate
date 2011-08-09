Test = require './test_helper'
Percolate = require '../src/percolate'
CSTParser = require '../lib/parsers/percolate_parser'

exports['identifier retreival'] = Test.Case
  setUp: (callback) -> 
    @identifierTree = CSTParser.parse('`Batman`._foo_')
    callback()

  'nodes should retrieve their identifiers': (test) ->
    node = new Percolate.DocumentationNode(false, @identifierTree, ->)
    
    test.equal node.identifier(), "Batman.foo"
    test.done()

  'function definitions should parse their arguments': (test) ->
    tree = CSTParser.parse 'get(foo: String, bar: Baz)'
    node = new Percolate.FunctionDocumentationNode({objectName: "Batman.Object"}, tree, ->)
    
    test.equal node.identifier(), "Batman.Object.get"
    test.equal node.paramTypes.foo, "String"
    test.equal node.paramTypes.bar, "Baz"
    test.done()
 
  'function definitions with complex arguments parse their arguments': (test) ->
    tree = CSTParser.parse 'get(foo: String, bar: function(value, observer))'
    node = new Percolate.FunctionDocumentationNode({objectName: "Batman.Object"}, tree, ->)
    
    test.equal node.identifier(), "Batman.Object.get"
    test.equal node.paramTypes.foo, "String"
    test.equal node.paramTypes.bar, "function(value, observer)"
    test.done()
 
exports['parent name retreival'] = Test.Case
  'functions should retrieve their parentName': (test) ->
    node = Test.getBaseCase ->
      @document 'some.parent', ->
        @function 'get'
        @function 'set'
    
    test.equal node.children[0].children[1].parentName(), 'some.parent'
    test.done()

