path = require 'path'
fs = require 'fs'
percolate = require './percolate'

argv = require('optimist')
  .usage('Generate documentation for a file.\nUsage: $0')
  .demand(1)
  .default('filename', 'documentation.html')
  .describe('filename', 'The filename to write the output to.')
  .argv

docs = argv._.map (doc) -> path.resolve(process.cwd(), doc)

console.log "Running doc suite."
percolate.generate process.cwd(), docs..., (error, stats, output) ->
  throw error if error
  unless stats.failed > 0
    outputPath = path.join(process.cwd(), argv.filename)
    fs.writeFileSync outputPath, output
    console.log "Docs written to #{outputPath}."
  process.exit stats.failed

