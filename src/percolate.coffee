Generator = require './generator'
Environment = require './environment'

module.exports = {
  Generator
  Environment
  generate: (files..., callback) ->
    (new Generator(files)).generate(callback)
}
