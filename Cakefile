muffin = require 'muffin'

option '-w', '--watch', 'continue to watch the files and rebuild them when they change'
option '-c', '--commit', 'operate on the git index instead of the working tree'

task 'build', 'compile percolate', (options) ->
  muffin.run
    files: './src/**/*'
    options: options
    map:
      'src/(.+).coffee'           : (matches) -> muffin.compileScript(matches[0], "lib/#{matches[1]}.js", options)
