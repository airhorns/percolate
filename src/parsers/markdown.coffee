CSTParser = require '../../lib/percolate_parser'
helpers = require '../helpers'
Nodes = require '../nodes'
InstanceMethodWalker = require '../walkers/instance_method'
CoffeeScript = require 'coffee-script'

class MarkdownConverter extends InstanceMethodWalker
  constructor: ->
    @base = new Nodes.BaseNode("Percolate Generated Documentation")

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
          throw node.message()
        else
          @case = @function = @document.function(text)
      when 4
        if !@function?
          node.error = "Can't start a test case outside of a function description! Use a ### header to describe a function before this test."
          throw node.message()
        else
          @case = @test = @function.example(text)

  enteredAtxHeading: (node) ->
    # Use the heading to start a new sub node, or maybe break out up the chain.
    # node is an AtxHeading with (AtxStart, Space, AtxInline+, AtxEnd) children.
    # The first child's length is the number of pounds, ie the header level. The 
    # third child through to the second last child are the text nodes for the 
    # heading which may contain more inline elements.
    textNode = new node.constructor('TextNode', node.source, node.range.location, node.range.length)
    textNode.children = node.children.slice(2, -1)
    @convertHeading(node.children[0].range.length, textNode, node)
    true
  
  # Called upon a block of CoffeeScript code.
  enteredVerbatim: (node) ->
    if !@case?
       node.error = "Can't run code outside of a function or object description! Try adding a second or third level heading."
       throw node.message()
    else
      coffeeScript = node.innerText()
      try
        js = CoffeeScript.compile(coffeeScript, {bare: true})
        f = new Function(js)
        f.call(@case)
      false
      

class MarkdownParser
  # Public API. Parses the given markdown source into a CST, and the builds the Percolate AST from that.
  @getPercolateTree: (markdownSource) ->
    
    CST = CSTParser.parse(markdownSource)
    walker = new MarkdownConverter
    CST.traverse walker
    walker.base

module.exports = MarkdownParser
