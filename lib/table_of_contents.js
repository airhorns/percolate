(function() {
  var TableOfContents, TableOfContentsNode;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; }, __slice = Array.prototype.slice;

  TableOfContentsNode = (function() {

    TableOfContentsNode.prototype.parent = null;

    function TableOfContentsNode(depth, text, searchable) {
      this.depth = depth;
      this.text = text;
      this.searchable = searchable;
      this.children = [];
    }

    TableOfContentsNode.prototype.addChild = function(child) {
      this.children.push(child);
      child.parent = this;
      return child;
    };

    TableOfContentsNode.prototype.duplicate = function() {
      var child, duplicate, _i, _len, _ref;
      duplicate = new this.constructor(this.depth, this.text, this.searchable);
      _ref = this.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        duplicate.addChild(child.duplicate());
      }
      return duplicate;
    };

    return TableOfContentsNode;

  })();

  TableOfContents = (function() {

    __extends(TableOfContents, TableOfContentsNode);

    TableOfContents.prototype.parent = false;

    TableOfContents.prototype.root = true;

    function TableOfContents() {
      TableOfContents.__super__.constructor.call(this, 0, "");
    }

    TableOfContents.prototype.merge = function() {
      var child, root, subject, subjects, _i, _j, _len, _len2, _ref;
      subjects = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      root = new TableOfContents;
      subjects.unshift(this);
      for (_i = 0, _len = subjects.length; _i < _len; _i++) {
        subject = subjects[_i];
        _ref = subject.duplicate().children;
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          child = _ref[_j];
          root.addChild(child);
        }
      }
      return root;
    };

    return TableOfContents;

  })();

  module.exports = {
    TableOfContents: TableOfContents,
    TableOfContentsNode: TableOfContentsNode
  };

}).call(this);
