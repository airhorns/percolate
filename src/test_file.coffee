fs = require 'fs'
path = require 'path'
async = require 'async'
CoffeeScript = require 'coffee-script'
marked = require './marked'
pygments = require 'pygments'
TestBlock = require './test_block'
{TableOfContents, TableOfContentsNode} = require './table_of_contents'
module.exports = class TestFile
  _required: false
  constructor: (@filePath) ->

  require: (callback) =>
    fs.readFile @filePath, (err, data) =>
      unless err
        @fileContents = data.toString()
        @tokens = marked.lexer(@fileContents)
        @_required = true
        @tableOfContents = @_extractTableOfContents()
        @_highlightTokens(callback)

  output: ->
    throw new Error("Must require file first.") unless @_required
    marked.parser(@tokens)

  _extractTableOfContents: ->
    currentRoot = table = new TableOfContents
    for token, i in @tokens when token.type is 'heading'
      child = new TableOfContentsNode(token.depth, token.text, token.searchable)
      while child.depth <= currentRoot.depth
        currentRoot = currentRoot.parent
      currentRoot.addChild child
      currentRoot = child
    table

  _highlightTokens: (callback) ->
    queue = @_generateHighlightQueue()

    for token, i in @tokens
      if token.type is 'code'
        if token.percolate
          @_queuePercolateToken(token, queue)

        else if token.lang
          @_queueCodeToken(token, queue)
    if queue.length() > 0
      queue.drain = callback
    else
      callback()

  _queuePercolateToken: (token, queue) ->
    currentLanguage = token.lang || 'coffeescript'
    statements = TestBlock.for(token.text, currentLanguage).statements
    token.escaped = true
    token.lang = 'javascript'
    for statement in statements
      do (token, statement) =>
        async.parallel
          inJob: (callback) => queue.push {text: statement.in, lang: token.lang}, callback
          outJob: (callback) => queue.push {text: statement.out, lang: token.lang}, callback
        , (err, {inJob, outJob}) =>
          throw err if err
          token.text = "<div class=\"in\">#{inJob.text}</div><div class=\"out\">#{outJob.text}</div>"

  _queueCodeToken: (token, queue) ->
    queue.push {text: token.text, lang: token.lang}, (err, job) ->
      token.text = job.text
      token.escaped = true

  _generateHighlightQueue: ->
    async.queue((job, callback) ->
      debugger unless job.text? && job.lang?
      pygments.colorize job.text, job.lang, 'html', (text) ->
        job.text = text
        callback(null, job)
    , 5)
