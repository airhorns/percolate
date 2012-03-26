fs = require 'fs'
path = require 'path'
async = require 'async'
CoffeeScript = require 'coffee-script'
marked = require './marked'
pygments = require 'pygments'
TestBlock = require './test_block'
{TableOfContents, TableOfContentsNode} = require './table_of_contents'

module.exports = class TestFile
  codeBlockTemplate: false
  _required: false
  constructor: (@filePath) ->

  require: (callback) =>
    fs.readFile @filePath, (err, data) =>
      unless err
        @fileContents = data.toString()
        @tokens = marked.lexer(@fileContents)
        @tableOfContents = @_extractTableOfContents()
        @testBlocks = @_extractTestBlocks()
        @_required = true
        callback(err)

  output: (callback) ->
    throw new Error("Must require file first.") unless @_required
    @_highlightTokens (err) =>
      return callback(err) if err
      callback(null, @_renderMarkdown())

  _renderMarkdown: ->
    oldOnCode = marked.inline.onCode
    marked.inline.onCode = (contents) => @tableOfContents.autolink(contents)
    output = marked.parser(@tokens)
    marked.inline.onCode = oldOnCode
    output

  _extractTableOfContents: ->
    currentRoot = table = new TableOfContents
    for token, i in @tokens when token.type is 'heading'
      child = new TableOfContentsNode(token.depth, token.text, token.searchable)
      while child.depth <= currentRoot.depth
        currentRoot = currentRoot.parent
      currentRoot.addChild child
      token.id = child.id
      currentRoot = child
    table

  _extractTestBlocks: ->
    blocks = []
    try
      for token, i in @tokens
        if token.type in ['percolate_code', 'code']
          currentLanguage = token.lang || 'coffeescript'
          evaluate = token.type == 'percolate_code'
          block = TestBlock.for(token.text, currentLanguage, evaluate)
          block.token = token
          blocks.push block
    catch e
      console.warn "Error in file #{@filePath}!"
      throw e
    blocks

  _highlightTokens: (callback) ->
    queue = @_generateHighlightQueue()

    for block in @testBlocks
      if block.token.type is 'percolate_code'
        @_queuePercolateBlock(block, queue)
      else if block.token.type is 'code' && block.token.lang
        @_queueCodeToken(block.token, queue)

    if queue.length() > 0
      queue.drain = callback
    else
      callback()

  _queuePercolateBlock: (testBlock, queue) ->
    token = testBlock.token
    currentLanguage = token.lang || 'coffeescript'
    statements = testBlock.statements

    token.escaped = true
    token.lang = 'javascript'
    token.text = ''

    jobCreator = (text, callback) ->
      job = {text, lang: token.lang}
      if text.length > 0
        queue.push job, callback
      else
        callback(undefined, job)

    jobs = {}
    jobCount = statements.length - 1

    for statement, i in statements
      jobs["in#{i}"] = jobCreator.bind(@, statement['in'])
      jobs["out#{i}"] = jobCreator.bind(@, statement['out'])

    async.parallel jobs, (err, results) =>
      throw err if err
      renderContext =
        jobs: []
        title: testBlock.name
        language: token.lang

      for i in [0..jobCount]
        renderContext.jobs.push
          in: results["in#{i}"]
          out: results["out#{i}"]

      token.text = @codeBlockTemplate.render(renderContext)
      true

  _queueCodeToken: (token, queue) ->
    queue.push {text: token.text, lang: token.lang}, (err, job) ->
      token.text = job.text
      token.escaped = true

  _generateHighlightQueue: ->
    async.queue((job, callback) ->
      pygments.colorize job.text, job.lang, 'html', (text) ->
        job.text = text.slice(0, -1)
        callback(null, job)
    , 5)
