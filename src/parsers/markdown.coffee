CSTParser = require '../../lib/parsers/percolate'
helpers = require '../helpers'
Nodes = require '../nodes'
InstanceMethodWalker = require '../walkers/instance_method'
CoffeeScript = require 'coffee-script'

vm = require 'vm'
helpers = require '../helpers'

class MarkdownConverter extends InstanceMethodWalker
  constructor: ->
    @case = @base = new Nodes.BaseNode("Percolate Generated Documentation")
    #@executionContext = helpers.extend {}, {require, console}
    #@executionContext.global = @executionContext
    @depth = 0

  traversesTextNodes: false

  convertHeading: (level, text, node) ->
    switch level
      when 1
        @base.title(text)
      when 2
        @case = @document = @base.document(text)
        delete @function
        delete @test
      when 3
        if !@document?
          node.error = "Can't describe a function without an object above for it to belong to! Use a ## or --- header before this node."
          throw new Error(node.message())
        else
          @case = @function = @document.function(text)
      when 4
        if !@function?
          node.error = "Can't start a test case outside of a function description! Use a ### header to describe a function before this test."
          throw new Error(node.message())
        else
          @case = @test = @function.example(text)

  enteredAtxHeading: (node) ->
    # Use the heading to start a new sub node, or maybe break out up the chain.
    # node is an AtxHeading with (AtxStart, Space, AtxInline+, AtxEnd) children.
    # The first child's length is the number of pounds, ie the header level. The
    # third child through to the second last child are the text nodes for the
    # heading which may contain more inline elements.
    textNode = new node.constructor('Inline', node.source, node.range.location, node.range.length)
    textNode.children = node.children.slice(2, -1)
    @convertHeading(node.children[0].range.length, textNode, node)
    true


  # Add handlers for all the formatting elements that don't have any special meaning to Percolate.
  for k in ['BlockQuote', 'Verbatim', 'Reference', 'HorizontalRule', 'OrderedList', 'BulletList', 'HtmlBlock', 'Para', 'Plain']
    @::["entered#{k}"] = (node) ->
      @case.children.push node
      false

class MarkdownParser
  # Public API. Parses the given markdown source into a CST, and the builds the Percolate AST from that.
  @getPercolateTree: (markdownSource) ->

    CST = @getMarkdownTree(markdownSource)
    walker = new MarkdownConverter
    CST.traverse walker
    walker.base

  @getMarkdownTree: (markdownSource) ->
    CSTParser.parse(markdownSource)

module.exports = MarkdownParser
