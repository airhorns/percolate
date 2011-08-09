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

    test.equal output(tree.documentName), "Batman"
    test.done()

  'h2 should become object document title': (test) ->
    tree = getTree """
    # Batman
    
    ## Batman.Object
    
    A scary dude.
    """

    test.equal output(tree.documentName), "Batman"
    test.equal output(tree.children[0].objectName), "Batman.Object"
    test.done()

  'h3 should become function title': (test) ->
    tree = getTree """
    # Batman
    
    ## Batman.Object
    
    ### get(key: String)

    A scary dude.
    """

    test.equal output(tree.documentName), "Batman"
    test.equal output(tree.children[0].objectName), "Batman.Object"
    test.equal output(tree.children[0].children[0].key()), "get"
    test.done()
    
  'h4 should become example title': (test) ->
    tree = getTree """
    # Batman
    
    ## Batman.Object
    
    ### get(key: String)

    #### get a simple key

    A scary dude.
    """

    test.equal output(tree.documentName), "Batman"
    test.equal output(tree.children[0].objectName), "Batman.Object"
    test.equal output(tree.children[0].children[0].key()), "get"
    test.equal output(tree.children[0].children[0].children[0].caseName), "get a simple key"
    test.done()

exports['Nested markdown rendering'] = Test.Case
  'headings should support inline elements': (test) ->
    tree = getTree """
    # _Batman_
    
    ## __Batman.*Object*__
    
    ### get(key: String)

    #### get a simple key
    
    A scary dude.
    """
    
    test.equal output(tree.documentName), "<em>Batman</em>"
    test.equal output(tree.children[0].objectName), "<strong>Batman.<em>Object</em></strong>"
    test.done()

exports['Inline code execution'] = Test.Case
  'simple examples should be run': (test) ->
    tree = getTree """
    # Batman
    
    ## Object
    
        @show -> true

    """
    
    test.equals tree.children[0].setupFunctions.length, 1
    test.done()

exports['Reference pickups'] = Test.Case
  'references coming after the object defintion should be picked up': (test) ->
    tree = getTree """
    # Batman
    
    ## Object
    
    ## Hash
    
    see 'Batman.Object'

    """
    
    test.done()
