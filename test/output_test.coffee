Test = require './test_helper'
Percolate = require '../src/percolate'

exports['Function string parsing'] = Test.Case
  setUp: (callback) ->
    @walker = new Percolate.MarkdownOutputWalker
    callback()

  'should render simple functions': (test) ->
    test.equal @walker.renderFunction( -> @obj.method() ), 'this.obj.method()'
    test.done()
  
  'should render functions with calls to functions with arguments': (test) ->
    test.equal @walker.renderFunction( -> @obj.method(true, 'false', 10, {foo: 'bar'}) ), 'this.obj.method(true, \'false\', 10, { foo: \'bar\' })'
    test.done()

  'should render functions with multiple lines': (test) ->
    str = @walker.renderFunction ->
      @obj.testMethod one
      assignment = foo blah
      @obj.whatever { wibble: 'wobble'}

    test.equal str, 'this.obj.whatever({ wibble: \'wobble\' })'
    test.done()
