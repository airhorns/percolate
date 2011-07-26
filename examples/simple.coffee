{Batman} = require 'batman'
Percolate = require '../src/percolate'

Percolate.document 'Batman', ->
  @document 'Batman.Object', ->
    @function 'get', ->
      @see 'Batman.Object.prototype', 'get'
    @function 'set', ->
      @see 'Batman.Object.prototype', 'set'
    
  @document 'Batman.Object.prototype', ->
    @function 'get', ->
      @param 'key', String
      @description '`get` retrieves any property from any `Batman.Object`. Instead of doing normal property lookups like you would in normal Javascript, you _must_ use `get` to retrieve anything from a Batman object.'
      
      @setup -> @obj = new Batman.Object {foo: 'bar'}

      @example 'get a simple key', ->
        @equal 'bar', -> @obj.get 'foo'

      @example 'get a key on a smart object', ->
        @setup -> @obj.accessor 'baz'
          get: (key) -> true

        @equal true, -> @obj.get 'baz'
        @explain 'Note that while the above works, doing a vanilla JavaScript key access will not!'
        @equal undefined, -> @obj['baz']
        @equal undefined, -> @obj.baz

        @explain 'This is because `@obj` has some special keys on it, which can only be accessed through the Batman runtime. Using the runtime is as simple as always using `get` and `set` to retrieve or set properties on `Batman.Object`s. This is a departure from the usual way of doing things, and it takes more code, but it\'s the only way that the rest of the goodness Batman provides can be implemented.'
  
    @function 'set', ->
      @params
        'key': String
        'value': Object

      @description '`set` stores a value in a property on any `Batman.Object`. Instead of doing normal sets like you would in normal Javascript, you _must_ use `set` to retrieve anything from a Batman object.'
      
      @setup -> @obj = new Batman.Object {foo: 'bar'}

      @example 'set a simple key', ->
        @equal 'bar', -> @obj.set 'foo', 'bar'
        @equal 'bar', -> @obj.get 'foo'

      @example 'set a key on a smart object', ->
        @setup -> @obj.accessor 'baz'
          get: (key) -> @["_#{key}"]
          set: (key, value) -> @["_#{key}"] = value

        @equal 'qux', -> @obj.set 'baz', 'qux'
        @explain 'Note that while the above works, doing a vanilla JavaScript key access will not!'
        @equal undefined, -> @obj['baz']
        @equal undefined, -> @obj.baz
        @equal 'qux', -> @obj.get 'baz'

        @explain 'This is because `@obj` has some special keys on it, which can only be accessed through the Batman runtime. Using the runtime is as simple as always using `get` and `set` to retrieve or set properties on `Batman.Object`s. This is a departure from the usual way of doing things, and it takes more code, but it\'s the only way that the rest of the goodness Batman provides can be implemented.'
