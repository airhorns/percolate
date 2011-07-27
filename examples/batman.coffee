{Batman} = require 'batman'
Percolate = require '../src/percolate'

Percolate.document 'Batman', './examples/batman.html', ->
  @document 'Batman.Object', ->
    @function 'get', ->
      @see 'Batman.Object.prototype', 'get'
    @function 'set', ->
      @see 'Batman.Object.prototype', 'set'
    
  @document 'Batman.Object.prototype', ->
    @describe '`Batman.Object` is the heart of the `Batman` runtime. Instances and subclasses inherit all the `get`/`set` logic, the deep keypath resolution, the `accessor` computation logic, the `Observable` logic, the `event` logic, and more.'

    @function 'get', -> 
      @param 'key', String
      @describe '`get` retrieves any property from any `Batman.Object`. Instead of doing normal property lookups like you would in normal Javascript, you _must_ use `get` to retrieve anything from a Batman object. `get` also supports lookups on \'deep\' keys.'
      
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
      
      @example 'get a deep key', ->
        @setup -> @obj.qux = new Batman.Object({bar: new Batman.Object({baz: 'Bonus!'})})
        @equal 'Bonus!', -> @obj.get 'qux.bar.baz'
        

      @example 'get a deep key where a middle segment is missing', ->
        @show -> @obj.foo = {}
        @equal undefined, -> @obj.get 'foo.bar.baz'

        @explain "`get` is smart and will traverse the keypath as deep as it can. If an undefined key is encountered, the `get` will return undefined."

    @function 'set', ->
      @params
        'key': String
        'value': Object

      @describe '`set` stores a value in a property on any `Batman.Object`. Instead of doing normal sets like you would in normal Javascript, you _must_ use `set` to retrieve anything from a Batman object.'
      
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
      
    @function 'observe', ->
      @params
        'key': String
        'observer': 'function(newValue, oldValue)'
      
      @describe '`observe` adds a change listener to a `Batman.Object`, which then gets called any time the `key` changes. This is the heart of the binding system `Batman` uses in its views because it allows views to be notified when the data they represet changes, and thus update themselves.'
      
      @setup -> @obj = new Batman.Object

      @example 'observe a key for a change', ->
        @setup -> @spy = Percolate.createSpy()
        @show -> @obj.observe('foo', @spy)
        @show -> @obj.set('foo', 'bar')
        @deepEqual ['bar', undefined], -> @spy.lastCallArguments

    @function 'forget', ->
      @params
        'key': String
        'observer': 'function(newValue, oldValue)'
      
      @describe '`forget` removes a change listener from a `Batman.Object`'

  @document 'Batman.Hash.Prototype', ->
    @function 'get', ->

    @function 'set', ->
 
  @document 'Batman.Set.Prototype', ->
    @function 'add', ->

    @function 'hasItem', ->
