qqunit = require 'qqunit'

getFancyArray = ->
  array = []
  array.clear = -> @pop() while @length > 0; true

  Object.defineProperty array, "last",
    enumerable: false
    get: -> @[@length - 1]

Environment =
  show: ->
  showLog: ->
  log: (args...) -> global.logged.push arg for arg in args; true
  logged: getFancyArray()

global[k] = v for k, v of Environment

QUnit.testDone ({name}) ->
  global.logged = Environment.logged = getFancyArray()
