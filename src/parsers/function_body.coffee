return_val_rx = /function \((?:.*)\) \{(?:.*)\s*return (.*);\s*\}/m
whitespace_rx = /\s+/g

module.exports =
  parse: (f) ->
    text = f.toString().replace(whitespace_rx, ' ').trim()
    matches = return_val_rx.exec(text)
    matches[1]

