muffin = require 'muffin'
glob = require 'glob'

option '-w', '--watch', 'continue to watch the files and rebuild them when they change'
option '-c', '--commit', 'operate on the git index instead of the working tree'
option '-d', '--compare', 'compare to git refs (stat task only)'

task 'build', 'compile percolate', (options) ->
  muffin.run
    files: './src/**/*'
    options: options
    map:
      'src/percolate.coffee'       : (matches) -> muffin.compileScript(matches[0], 'lib/percolate.js', options)

task 'test', 'compile shopify.js and the tests and run them on the command line', (options) ->
  runner = (require 'nodeunit').reporters.default
  require.paths.unshift(__dirname + '/deps')

  muffin.run
    files: ['./src/**/*.coffee', './lib/**/*.js', './test/**/*.coffee']
    options: options
    map:
     'src/(.+).coffee'      : (matches) -> 
     'test/(.+)_test.coffee'   : (matches) -> 
     'test/test_helper.coffee' : (matches) -> 
    after: ->
      tests = glob.globSync('./test/*_test.coffee')
      runner.run tests

task 'stats', 'print source code stats', (options) ->
  muffin.statFiles(glob.globSync('./src/**/*').concat(glob.globSync('./lib/**/*')), options)

task 'doc', 'autogenerate docco anotated source and node IDL files', (options) ->
  muffin.run
    files: './src/**/*'
    options: options
    map:
      'src/muffin.coffee'       : (matches) -> muffin.doccoFile(matches[0], options)
