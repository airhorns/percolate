fs = require 'fs'
path = require 'path'
helpers = require './helpers'
walkers = require './walkers'
parsers = require './parsers'
nodes = require './nodes'

Percolate =

  compile: (source, inputType = 'markdown', outputType = 'percolate') ->
    # Figure out which parser to use depending on the type of the source provided.
    parser = switch inputType
      when 'markdown', 'percolate', 'text' then parsers.MarkdownParser
      when 'coffee' then parsers.CoffeeScriptParser
      else throw new Error "Unsupported input type #{type}! Supported types are: markdown, percolate, coffeescript."

    walker = switch outputType
      when 'percolate' then walkers.PercolateHtmlWalker
      when 'html' then walkers.HtmlWalker
      else throw new Error "Unsupported output type #{type}! Supported types are: percolate, html."

    # Get the internal representation from the parser.
    percolateTree = parser.getPercolateTree(source)

    # Compile it.
    walker.getString(percolateTree)

  compileFromFile: (sourceFileName, inputType = null, outputType = 'percolate') ->
    source = fs.readFileSync(sourceFileName).toString()
    @compile(source, inputType || path.extname(sourceFileName).slice(1), outputType)

  compileInPlace: (sourceFileName) ->
    output = @compileFromFile(sourceFileName)

    (outputFileName = sourceFileName.split('.')).pop()
    outputFileName.push('html')
    outputFileName = outputFileName.join('.')

    fs.writeFileSync(outputFileName, output)

module.exports = helpers.extend Percolate, helpers, walkers, parsers, nodes
