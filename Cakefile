muffin = require 'muffin'
glob = require 'glob'
{exec} = require 'child_process'

option '-w', '--watch', 'continue to watch the files and rebuild them when they change'
option '-c', '--commit', 'operate on the git index instead of the working tree'
option '-d', '--compare', 'compare to git refs (stat task only)'

compileLanguage = (file, destination) ->
  [child, promise] = muffin.exec("language -g #{file} > #{destination}")
  promise.then(-> console.log "Compiled language #{file} successfully.").end()

task 'build', 'compile percolate', (options) ->
  muffin.run
    files: './src/**/*'
    options: options
    map:
      'src/(.+).coffee'           : (matches) -> muffin.compileScript(matches[0], "lib/#{matches[1]}.js", options)
      'src/parsers/([\\w\\s]+).language' : (matches) -> compileLanguage(matches[0], "lib/parsers/#{matches[1]}.js")

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

task 'dev', 'compile the examples/simple.html file when anything changes', (options) ->
  muffin.run
    files: ['./src/**/*.coffee', './templates/**/*', './examples/**/*']
    options: options
    map:
     'src/percolate.coffee'    : (matches) -> muffin.compileScript(matches[0], 'lib/percolate.js', options)
     'src/(.+).coffee'         : (matches) -> 
     'examples/batman.coffee'  : (matches) -> 
     'templates/(.+)'          : (matches) -> 
    after: ->
      console.log "Running examples/batman.coffee ..."
      exec 'coffee examples/batman.coffee', (stdout, stderr) ->
        for stream in arguments 
          if stream
            stream = stream.toString()
            console.log stream if stream.length > 0

task 'stats', 'print source code stats', (options) ->
  muffin.statFiles(glob.globSync('./src/**/*').concat(glob.globSync('./lib/**/*')), options)

task 'doc', 'autogenerate docco anotated source', (options) ->
  muffin.run
    files: './src/**/*'
    options: options
    map:
      'src/muffin.coffee'       : (matches) -> muffin.doccoFile(matches[0], options)
