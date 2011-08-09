(function() {
  var return_val_rx, whitespace_rx;
  return_val_rx = /function \((?:.*)\) \{(?:.*)\s*return (.*);\s*\}/m;
  whitespace_rx = /\s+/g;
  module.exports = {
    parse: function(f) {
      var matches, text;
      text = f.toString().replace(whitespace_rx, ' ').trim();
      matches = return_val_rx.exec(text);
      return matches[1];
    }
  };
}).call(this);
