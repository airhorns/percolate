fs = require 'fs'
path = require 'path'
helpers = require './helpers'
walkers = require './walkers'
parsers = require './parsers'
nodes = require './nodes'

Percolate = 

  compile: (source, type = 'markdown') ->
    # Figure out which parser to use depending on the type of the source provided.
    parser = switch type
      when 'markdown', 'percolate' then parsers.MarkdownParser
      when 'coffee' then parsers.CoffeeScriptParser
      else throw "Unsupported input type #{type}! Supported types are: markdown, percolate, coffeescript."
    
    # Get the internal representation from the parser.
    percolateTree = parser.getPercolateTree(source)

    # Compile it to HTML. FIXME: Convert to many output format functions.
    walkers.HtmlWalker.getString(percolateTree)

  compileFromFile: (sourceFileName) ->
    source = fs.readFileSync(sourceFileName).toString()
    @compile(source, path.extname(sourceFileName).slice(1))

  compileInPlace: (sourceFileName) ->
    output = @compileFromFile(sourceFileName)
    console.error output
    (outputFileName = sourceFileName.split('.')).pop()
    outputFileName.push('html')
    outputFileName = outputFileName.join('.')
    
    fs.writeFileSync(outputFileName, output)

module.exports = helpers.extend Percolate, helpers, walkers, parsers, nodes
