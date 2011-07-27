Test = require './test_helper'
Percolate = require '../src/percolate'

exports['TestCase assertions'] = Test.Case
  'functions should retrieve their parentName': (test) ->
    node = Test.getBaseCase ->
      @document 'some.parent', ->
        @function 'get'
        @function 'set'
    
    test.equal node.children[0].children[1].parentName(), 'some.parent'
    test.done()

  'functions should retrieve their parentName if nested': (test) ->
    node = Test.getBaseCase ->
      @document 'some.ancestor', ->
        @function 'get'
        @function 'set'

        @document 'some.parent', ->
          @function 'get'
          @function 'set'
    
    test.equal node.children[0].children[1].parentName(), 'some.ancestor'
    test.equal node.children[0].children[2].children[0].parentName(), 'some.parent'
    test.done()
