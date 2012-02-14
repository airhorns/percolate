fs = require 'fs'
path = require 'path'
async = require 'async'
CoffeeScript = require 'coffee-script'
marked = require './marked'
pygments = require 'pygments'
TestBlock = require './test_block'

module.exports = class TestFile
  _required: false
  constructor: (@filePath) ->

  require: (callback) =>
    fs.readFile @filePath, (err, data) =>
      unless err
        @fileContents = data.toString()
        @_required = true
        @_parse(callback)

  _parse: (callback) ->
    @tokens = marked.lexer(@fileContents)
    highlightingQueue = async.queue (job, callback) ->
      pygments.colorize job.text, job.lang, 'html', (text) ->
        job.text = text
        callback(null, job)
    , 5

    for token, i in @tokens
      if token.type == 'code'
        if token.percolate
          currentLanguage = token.lang || 'coffeescript'
          statements = TestBlock.for(token.text, currentLanguage).statements
          token.escaped = true
          token.lang = 'javascript'
          for statement in statements
            do (token, statement) =>
              async.parallel
                inJob: (callback) -> highlightingQueue.push {text: statement.in, lang: token.lang}, callback
                outJob: (callback) -> highlightingQueue.push {text: statement.out, lang: token.lang}, callback
              , (err, {inJob, outJob}) =>
                throw err if err
                token.text = "<div class=\"in\">#{inJob.text}</div><div class=\"out\">#{outJob.text}</div>"

        else if token.lang
          highlightingQueue.push token

    if highlightingQueue.length() > 0
      highlightingQueue.drain = callback
    else
      callback()

  output: ->
    throw new Error("Must require file first.") unless @_required
    marked.parser(@tokens)
