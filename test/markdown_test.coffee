Test = require './test_helper'
MarkdownParser = require '../src/parsers/markdown'
HtmlWalker = require '../src/walkers/html'

getTree = (source) ->
  MarkdownParser.getPercolateTree(source)

output = (tree) ->
  HtmlWalker.getString(tree)

exports['Simple markdown rendering'] = Test.Case
  'h1 should become document title': (test) ->
    tree = getTree """
    # Batman
    
    A scary dude.
    """

    test.equal output(tree.name), "Batman"
    test.done()

  'h2 should become object document title': (test) ->
    tree = getTree """
    # Batman
    
    ## Batman.Object
    
    A scary dude.
    """

    test.equal output(tree.name), "Batman"
    test.equal output(tree.children[0].name), "Batman.Object"
    test.done()

  'h3 should become function title': (test) ->
    tree = getTree """
    # Batman
    
    ## Batman.Object
    
    ### get(key: String)

    A scary dude.
    """

    test.equal output(tree.name), "Batman"
    test.equal output(tree.children[0].name), "Batman.Object"
    test.equal output(tree.children[0].children[0].name), "get(key: String)"
    test.done()
    
  'h4 should become example title': (test) ->
    tree = getTree """
    # Batman
    
    ## Batman.Object
    
    ### get(key: String)

    #### get a simple key

    A scary dude.
    """

    test.equal output(tree.name), "Batman"
    test.equal output(tree.children[0].name), "Batman.Object"
    test.equal output(tree.children[0].children[0].name), "get(key: String)"
    test.equal output(tree.children[0].children[0].children[0].name), "get a simple key"
    test.done()

exports['Nested markdown rendering'] = Test.Case
  'headings should support inline elements': (test) ->
    tree = getTree """
    # _Batman_
    
    ## __Batman.*Object*__
    
    ### get(`key`: ```String```)

    #### get a simple key
    
    A scary dude.
    """
    
    test.equal output(tree.name), "<em>Batman</em>"
    test.equal output(tree.children[0].name), "<strong>Batman.<em>Object</em></strong>"
    test.equal output(tree.children[0].children[0].name), "get(<code>key</code>: <code>String</code>)"
    test.done()

