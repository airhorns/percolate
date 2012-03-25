Generator = require './generator'
Environment = require './environment'

module.exports = {
  Generator
  Environment
  generate: (projectDirectory, files..., callback) ->
    (new Generator(projectDirectory, files)).generate(callback)
  test: (projectDirectory, files..., callback) ->
    (new Generator(projectDirectory, files)).test(callback)
}
