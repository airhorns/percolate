(function() {
  var TableOfContents, TableOfContentsNode;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; }, __slice = Array.prototype.slice;

  TableOfContentsNode = (function() {

    TableOfContentsNode.handelize = function(text) {
      return text.toLowerCase().split('(')[0].split(':')[0].replace(/[\'\"\(\)\[\]]/g, '').replace(/\W/g, ' ').replace(/\ +/g, '-').replace(/(-+)$/g, '').replace(/^(-+)/g, '');
    };

    TableOfContentsNode._functionSignature = /\w+\(.*\)/i;

    TableOfContentsNode._classfunctionSignature = /@\w+\(.*\)/i;

    TableOfContentsNode._typeInformation = /\s*:\s*(?:\[\s*(?:\w|\|)+\s*\]|\w+)/ig;

    TableOfContentsNode._defaultArgumentValues = /(\w+)\s*\=\s*\w+/ig;

    TableOfContentsNode.extractSignature = function(text) {
      var result;
      result = text.replace(this._typeInformation, '');
      if (this._functionSignature.test(text)) {
        return result.replace(this._defaultArgumentValues, '$1');
      } else {
        return result;
      }
    };

    TableOfContentsNode.prototype.parent = null;

    TableOfContentsNode.prototype["class"] = "";

    function TableOfContentsNode(depth, text, searchable) {
      this.depth = depth;
      this.text = text;
      this.searchable = searchable;
      this.children = [];
      this._extractSignature();
    }

    TableOfContentsNode.prototype.hasChildren = function() {
      return this.children.length > 0;
    };

    TableOfContentsNode.prototype.addChild = function(child) {
      var grandChild, grandChildren, _i, _len;
      this._clearMemos();
      this.children.push(child);
      child.parent = this;
      if (this.id.length > 0) child.id = this.id + "-" + child.baseID;
      grandChildren = child.children.splice(0, child.children.length);
      for (_i = 0, _len = grandChildren.length; _i < _len; _i++) {
        grandChild = grandChildren[_i];
        child.addChild(grandChild);
      }
      return child;
    };

    TableOfContentsNode.prototype.index = function() {
      var child, item, q, _i, _len, _ref;
      if (!this._index) {
        this._index = {};
        q = [this];
        while (q.length > 0) {
          item = q.shift();
          _ref = item.children;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            child = _ref[_i];
            q.push(child);
          }
          if (item.handle) this._index[item.handle] = item.id;
        }
      }
      return this._index;
    };

    TableOfContentsNode.prototype.root = function() {
      var current;
      if (!this._root) {
        current = this;
        while (current.parent) {
          current = current.parent;
        }
        this._root = current;
      }
      return this._root;
    };

    TableOfContentsNode.prototype.autolink = function(linkContents) {
      var handle, id, index, rootIndex, signature;
      signature = this.constructor.extractSignature(linkContents);
      handle = this.constructor.handelize(signature);
      index = this.index();
      rootIndex = this.root().index();
      id = index[signature] || index[handle] || rootIndex[signature] || rootIndex[handle];
      if (id != null) {
        console.log("" + linkContents + " -> " + id);
        return "<a href=\"" + id + "\">" + linkContents + "</a>";
      } else {
        return linkContents;
      }
    };

    TableOfContentsNode.prototype._extractSignature = function() {
      var handle, old;
      old = this.text;
      this.text = this.constructor.extractSignature(this.text);
      handle = this.constructor.handelize(this.text);
      this["class"] = (function() {
        if (this.searchable) {
          switch (this.depth) {
            case 1:
              return "";
            case 2:
              return "class";
            case 3:
              if (this.text.match(this.constructor._classFunctionSignature)) {
                return "class-function";
              } else if (this.text.match(this.constructor._functionSignature)) {
                return "function";
              } else {
                return "property";
              }
              break;
            default:
              return "";
          }
        } else {
          return "";
        }
      }).call(this);
      return this.baseID = this.id = handle;
    };

    TableOfContentsNode.prototype._clearMemos = function() {
      delete this._index;
      return delete this._root;
    };

    return TableOfContentsNode;

  })();

  TableOfContents = (function() {

    __extends(TableOfContents, TableOfContentsNode);

    TableOfContents.prototype.parent = false;

    function TableOfContents() {
      TableOfContents.__super__.constructor.call(this, 0, "");
      this.id = "";
      this._root = this;
    }

    TableOfContents.prototype.merge = function() {
      var child, subject, subjects, _i, _j, _len, _len2, _ref;
      subjects = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this._clearMemos();
      for (_i = 0, _len = subjects.length; _i < _len; _i++) {
        subject = subjects[_i];
        _ref = subject.children;
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          child = _ref[_j];
          this.addChild(child);
        }
      }
      return this;
    };

    TableOfContents.prototype._extractSignature = function() {};

    return TableOfContents;

  })();

  module.exports = {
    TableOfContents: TableOfContents,
    TableOfContentsNode: TableOfContentsNode
  };

}).call(this);
