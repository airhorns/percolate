Test = require './test_helper'
Percolate = require '../src/percolate'

exports['MultiAssertion transformation'] = Test.Case
  'should transform several assertions into one multi assertion when having not just assertions': (test) -> 
    root = Test.getTestCase ->
      @explain 'something'
      @equal true, -> true
      @equal 1, -> true
      @notEqual true, -> false
      @explain 'something else'
    
    (new Percolate.MultiAssertionTransformation).walk(root)

    test.equals root.children.length, 3
    test.equals root.children[1].children.length, 3
    test.done()

  'should transform several assertions into one multi assertion when having not just assertions': (test) -> 
    root = Test.getTestCase ->
      @explain 'something'
      @equal true, -> true
      @equal true, -> true
      @explain 'something in the middle'
      @equal 1, -> true
      @notEqual true, -> false
      @explain 'something else'
    
    (new Percolate.MultiAssertionTransformation).walk(root)
  
    test.equals root.children.length, 5
    test.equals root.children[1].children.length, 2
    test.equals root.children[3].children.length, 2
    test.done()

  'should transform several assertions into one multi assertion when only having assertions': (test) -> 
    root = Test.getTestCase ->
      @equal true, -> true
      @equal 1, -> true
      @notEqual true, -> false
    
    (new Percolate.MultiAssertionTransformation).walk(root)

    test.equals root.children.length, 1
    test.equals root.children[0].children.length, 3
    test.done()

  'should transform several assertions into one multi assertion in nested cases': (test) -> 
    root = Test.getTestCase ->
      @explain 'something'
      @test 'nestedTest', ->
        @explain 'start'
        @equal true, -> true
        @equal 1, -> true
        @explain 'end'
      @notEqual true, -> false
    
    (new Percolate.MultiAssertionTransformation).walk(root)

    test.equals root.children.length, 3
    test.equals root.children[1].children.length, 3
    test.equals root.children[1].children[1].children.length, 2
    test.done()
  
  'a weird case': (test) ->
    root = Test.getTestCase ->
      @example 'set a key on a smart object', ->
        @setup -> @obj.accessor 'baz'
          get: (key) -> @["_#{key}"]
          set: (key, value) -> @["_#{key}"] = value

        @equal 'qux', -> @obj.set 'baz', 'qux'
        @explain 'Note that while the above works, doing a vanilla JavaScript key access will not!'
        @equal undefined, -> @obj['baz']
        @equal undefined, -> @obj.baz
        @equal 'qux', -> @obj.get 'baz'

        @explain 'This is because `@obj` has some special keys on it, which can only be accessed through the Batman runtime. Using the runtime is as simple as always using `get` and `set` to retrieve or set properties on `Batman.Object`s. This is a departure from the usual way of doing things, and it takes more code, but it\'s the only way that the rest of the goodness Batman provides can be implemented.'
    
    (new Percolate.MultiAssertionTransformation).walk(root)
    test.equals root.children[0].children.length, 4
    test.done()
