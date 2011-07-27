Test = require './test_helper'
Percolate = require '../src/percolate'

exports['TestCase assertions'] = Test.Case

  'should accept equal and not equal assertions': (test) -> 
    test.expect(5)

    node = Test.getTestCase ->
      @equal true, -> 
        test.ok 'value retrieved'
        true
      @equal 1, -> 
        test.ok 'value retrieved'
        true
      @notEqual true, -> 
        test.ok 'value retrieved'
        false
      @notEqual {}, -> 
        test.ok 'value retrieved'
        {}
    
    test.ok Test.runTestCase(node), 'Test Case passes'
    test.done()

  'should accept strict equal and not strict equal assertions': (test) -> 
    test.expect(5)
    node = Test.getTestCase ->
      @strictEqual true, -> 
        test.ok 'value retrieved'
        true
      x = {}
      @strictEqual x, -> 
        test.ok 'value retrieved'
        x
      @notStrictEqual {}, -> 
        test.ok 'value retrieved'
        {}
      @notStrictEqual 1, -> 
        test.ok 'value retrieved'
        true
    
    test.ok Test.runTestCase(node), 'Test Case passes'
    test.done()

  'should accept strict equal and not strict equal assertions': (test) -> 
    test.expect(5)
    node = Test.getTestCase ->
      @strictEqual true, -> 
        test.ok 'value retrieved'
        true
      x = {}
      @strictEqual x, -> 
        test.ok 'value retrieved'
        x
      @notStrictEqual {}, -> 
        test.ok 'value retrieved'
        {}
      @notStrictEqual 1, -> 
        test.ok 'value retrieved'
        true
    
    test.ok Test.runTestCase(node), 'Test Case passes'
    test.done()

exports['TestCase setups'] = Test.Case

  'should run before assertions': (test) -> 
    test.expect(3)
    context = false
    node = Test.getTestCase ->
      @setup ->
        test.ok 'Setup called'
        this.wibble = "wobble"

      @equal true, -> 
        test.equal this.wibble, "wobble"
        true
    
    test.ok Test.runTestCase(node), 'Test Case passes'
    test.done()

  'should run before nested assertions': (test) -> 
    node = Test.getTestCase ->
      @setup ->
        test.ok 'Setup called'
        this.wibble = "wobble"
      
      @test 'nested', ->
        @setup ->
          test.ok 'Nested setup called'
          this.foo = 'bar'

        @equal true, -> 
          test.equal this.wibble, "wobble"
          test.equal this.foo, "bar"
          true

      @equal true, -> 
        test.equal this.wibble, "wobble"
        test.equal this.foo, undefined, "Setups in nested cases aren't run for parent cases"
        true
    
    test.ok Test.runTestCase(node), 'Test Case passes'
    test.done()

  tearDown: (callback) -> callback()
