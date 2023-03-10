(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ptCompromise = factory());
})(this, (function () { 'use strict';

  let methods$n = {
    one: {},
    two: {},
    three: {},
    four: {},
  };

  let model$6 = {
    one: {},
    two: {},
    three: {},
  };
  let compute$9 = {};
  let hooks = [];

  var tmpWrld = { methods: methods$n, model: model$6, compute: compute$9, hooks };

  const isArray$9 = input => Object.prototype.toString.call(input) === '[object Array]';

  const fns$4 = {
    /** add metadata to term objects */
    compute: function (input) {
      const { world } = this;
      const compute = world.compute;
      // do one method
      if (typeof input === 'string' && compute.hasOwnProperty(input)) {
        compute[input](this);
      }
      // allow a list of methods
      else if (isArray$9(input)) {
        input.forEach(name => {
          if (world.compute.hasOwnProperty(name)) {
            compute[name](this);
          } else {
            console.warn('no compute:', input); // eslint-disable-line
          }
        });
      }
      // allow a custom compute function
      else if (typeof input === 'function') {
        input(this);
      } else {
        console.warn('no compute:', input); // eslint-disable-line
      }
      return this
    },
  };
  var compute$8 = fns$4;

  // wrappers for loops in javascript arrays

  const forEach = function (cb) {
    let ptrs = this.fullPointer;
    ptrs.forEach((ptr, i) => {
      let view = this.update([ptr]);
      cb(view, i);
    });
    return this
  };

  const map = function (cb, empty) {
    let ptrs = this.fullPointer;
    let res = ptrs.map((ptr, i) => {
      let view = this.update([ptr]);
      let out = cb(view, i);
      // if we returned nothing, return a view
      if (out === undefined) {
        return this.none()
      }
      return out
    });
    if (res.length === 0) {
      return empty || this.update([])
    }
    // return an array of values, or View objects?
    // user can return either from their callback
    if (res[0] !== undefined) {
      // array of strings
      if (typeof res[0] === 'string') {
        return res
      }
      // array of objects
      if (typeof res[0] === 'object' && (res[0] === null || !res[0].isView)) {
        return res
      }
    }
    // return a View object
    let all = [];
    res.forEach(ptr => {
      all = all.concat(ptr.fullPointer);
    });
    return this.toView(all)
  };

  const filter = function (cb) {
    let ptrs = this.fullPointer;
    ptrs = ptrs.filter((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    });
    let res = this.update(ptrs);
    return res
  };

  const find$1 = function (cb) {
    let ptrs = this.fullPointer;
    let found = ptrs.find((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    });
    return this.update([found])
  };

  const some = function (cb) {
    let ptrs = this.fullPointer;
    return ptrs.some((ptr, i) => {
      let view = this.update([ptr]);
      return cb(view, i)
    })
  };

  const random = function (n = 1) {
    let ptrs = this.fullPointer;
    let r = Math.floor(Math.random() * ptrs.length);
    //prevent it from going over the end
    if (r + n > this.length) {
      r = this.length - n;
      r = r < 0 ? 0 : r;
    }
    ptrs = ptrs.slice(r, r + n);
    return this.update(ptrs)
  };
  var loops = { forEach, map, filter, find: find$1, some, random };

  const utils = {
    /** */
    termList: function () {
      return this.methods.one.termList(this.docs)
    },
    /** return individual terms*/
    terms: function (n) {
      let m = this.match('.');
      // this is a bit faster than .match('.') 
      // let ptrs = []
      // this.docs.forEach((terms) => {
      //   terms.forEach((term) => {
      //     let [y, x] = term.index || []
      //     ptrs.push([y, x, x + 1])
      //   })
      // })
      // let m = this.update(ptrs)
      return typeof n === 'number' ? m.eq(n) : m
    },

    /** */
    groups: function (group) {
      if (group || group === 0) {
        return this.update(this._groups[group] || [])
      }
      // return an object of Views
      let res = {};
      Object.keys(this._groups).forEach(k => {
        res[k] = this.update(this._groups[k]);
      });
      // this._groups = null
      return res
    },
    /** */
    eq: function (n) {
      let ptr = this.pointer;
      if (!ptr) {
        ptr = this.docs.map((_doc, i) => [i]);
      }
      if (ptr[n]) {
        return this.update([ptr[n]])
      }
      return this.none()
    },
    /** */
    first: function () {
      return this.eq(0)
    },
    /** */
    last: function () {
      let n = this.fullPointer.length - 1;
      return this.eq(n)
    },

    /** grab term[0] for every match */
    firstTerms: function () {
      return this.match('^.')
    },

    /** grab the last term for every match  */
    lastTerms: function () {
      return this.match('.$')
    },

    /** */
    slice: function (min, max) {
      let pntrs = this.pointer || this.docs.map((_o, n) => [n]);
      pntrs = pntrs.slice(min, max);
      return this.update(pntrs)
    },

    /** return a view of the entire document */
    all: function () {
      return this.update().toView()
    },
    /**  */
    fullSentences: function () {
      let ptrs = this.fullPointer.map(a => [a[0]]); //lazy!
      return this.update(ptrs).toView()
    },
    /** return a view of no parts of the document */
    none: function () {
      return this.update([])
    },

    /** are these two views looking at the same words? */
    isDoc: function (b) {
      if (!b || !b.isView) {
        return false
      }
      let aPtr = this.fullPointer;
      let bPtr = b.fullPointer;
      if (!aPtr.length === bPtr.length) {
        return false
      }
      // ensure pointers are the same
      return aPtr.every((ptr, i) => {
        if (!bPtr[i]) {
          return false
        }
        // ensure [n, start, end] are all the same
        return ptr[0] === bPtr[i][0] && ptr[1] === bPtr[i][1] && ptr[2] === bPtr[i][2]
      })
    },

    /** how many seperate terms does the document have? */
    wordCount: function () {
      return this.docs.reduce((count, terms) => {
        count += terms.filter(t => t.text !== '').length;
        return count
      }, 0)
    },

    // is the pointer the full sentence?
    isFull: function () {
      let ptrs = this.pointer;
      if (!ptrs) {
        return true
      }
      let document = this.document;
      for (let i = 0; i < ptrs.length; i += 1) {
        let [n, start, end] = ptrs[i];
        // it's not the start
        if (n !== i || start !== 0) {
          return false
        }
        // it's too short
        if (document[n].length > end) {
          return false
        }
      }
      return true
    },

    // return the nth elem of a doc
    getNth: function (n) {
      if (typeof n === 'number') {
        return this.eq(n)
      } else if (typeof n === 'string') {
        return this.if(n)
      }
      return this
    }

  };
  utils.group = utils.groups;
  utils.fullSentence = utils.fullSentences;
  utils.sentence = utils.fullSentences;
  utils.lastTerm = utils.lastTerms;
  utils.firstTerm = utils.firstTerms;
  var util = utils;

  const methods$m = Object.assign({}, util, compute$8, loops);

  // aliases
  methods$m.get = methods$m.eq;
  var api$h = methods$m;

  class View {
    constructor(document, pointer, groups = {}) {
      // invisible props
      [
        ['document', document],
        ['world', tmpWrld],
        ['_groups', groups],
        ['_cache', null],
        ['viewType', 'View']
      ].forEach(a => {
        Object.defineProperty(this, a[0], {
          value: a[1],
          writable: true,
        });
      });
      this.ptrs = pointer;
    }
    /* getters:  */
    get docs() {
      let docs = this.document;
      if (this.ptrs) {
        docs = tmpWrld.methods.one.getDoc(this.ptrs, this.document);
      }
      return docs
    }
    get pointer() {
      return this.ptrs
    }
    get methods() {
      return this.world.methods
    }
    get model() {
      return this.world.model
    }
    get hooks() {
      return this.world.hooks
    }
    get isView() {
      return true //this comes in handy sometimes
    }
    // is the view not-empty?
    get found() {
      return this.docs.length > 0
    }
    // how many matches we have
    get length() {
      return this.docs.length
    }
    // return a more-hackable pointer
    get fullPointer() {
      let { docs, ptrs, document } = this;
      // compute a proper pointer, from docs
      let pointers = ptrs || docs.map((_d, n) => [n]);
      // do we need to repair it, first?
      return pointers.map(a => {
        let [n, start, end, id, endId] = a;
        start = start || 0;
        end = end || (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n] && document[n][start]) {
          id = id || document[n][start].id;
          if (document[n][end - 1]) {
            endId = endId || document[n][end - 1].id;
          }
        }
        return [n, start, end, id, endId]
      })
    }
    // create a new View, from this one
    update(pointer) {
      let m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer && pointer.length > 0) {
        // only keep cache if it's a full-sentence
        let cache = [];
        pointer.forEach((ptr, i) => {
          let [n, start, end] = ptr;
          if (ptr.length === 1) {
            cache[i] = this._cache[n];
          } else if (start === 0 && this.document[n].length === end) {
            cache[i] = this._cache[n];
          }
        });
        if (cache.length > 0) {
          m._cache = cache;
        }
      }
      m.world = this.world;
      return m
    }
    // create a new View, from this one
    toView(pointer) {
      return new View(this.document, pointer || this.pointer)
    }
    fromText(input) {
      const { methods } = this;
      //assume ./01-tokenize is installed
      let document = methods.one.tokenize.fromString(input, this.world);
      let doc = new View(document);
      doc.world = this.world;
      doc.compute(['normal', 'lexicon']);
      if (this.world.compute.preTagger) {
        doc.compute('preTagger');
      }
      return doc
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0);    //node 17: structuredClone(document);
      document = document.map(terms => {
        return terms.map(term => {
          term = Object.assign({}, term);
          term.tags = new Set(term.tags);
          return term
        })
      });
      // clone only sub-document ?
      let m = this.update(this.pointer);
      m.document = document;
      m._cache = this._cache; //clone this too?
      return m
    }
  }
  Object.assign(View.prototype, api$h);
  var View$1 = View;

  var version$1 = '14.8.2';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$6(plugin)) {
      for (const key in plugin) {
        if (isObject$6(plugin[key])) {
          if (!model[key]) Object.assign(model, { [key]: {} });
          mergeDeep(model[key], plugin[key]); //recursion
          // } else if (isArray(plugin[key])) {
          // console.log(key)
          // console.log(model)
        } else {
          Object.assign(model, { [key]: plugin[key] });
        }
      }
    }
    return model
  }
  // const merged = mergeDeep({ a: 1 }, { b: { c: { d: { e: 12345 } } } })
  // console.dir(merged, { depth: 5 })

  // vroom
  function mergeQuick(model, plugin) {
    for (const key in plugin) {
      model[key] = model[key] || {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  const addIrregulars = function (model, conj) {
    let m = model.two.models || {};
    Object.keys(conj).forEach(k => {
      // verb forms
      if (conj[k].pastTense) {
        if (m.toPast) {
          m.toPast.exceptions[k] = conj[k].pastTense;
        }
        if (m.fromPast) {
          m.fromPast.exceptions[conj[k].pastTense] = k;
        }
      }
      if (conj[k].presentTense) {
        if (m.toPresent) {
          m.toPresent.exceptions[k] = conj[k].presentTense;
        }
        if (m.fromPresent) {
          m.fromPresent.exceptions[conj[k].presentTense] = k;
        }
      }
      if (conj[k].gerund) {
        if (m.toGerund) {
          m.toGerund.exceptions[k] = conj[k].gerund;
        }
        if (m.fromGerund) {
          m.fromGerund.exceptions[conj[k].gerund] = k;
        }
      }
      // adjective forms
      if (conj[k].comparative) {
        if (m.toComparative) {
          m.toComparative.exceptions[k] = conj[k].comparative;
        }
        if (m.fromComparative) {
          m.fromComparative.exceptions[conj[k].comparative] = k;
        }
      }
      if (conj[k].superlative) {
        if (m.toSuperlative) {
          m.toSuperlative.exceptions[k] = conj[k].superlative;
        }
        if (m.fromSuperlative) {
          m.fromSuperlative.exceptions[conj[k].superlative] = k;
        }
      }
    });
  };

  const extend = function (plugin, world, View, nlp) {
    const { methods, model, compute, hooks } = world;
    if (plugin.methods) {
      mergeQuick(methods, plugin.methods);
    }
    if (plugin.model) {
      mergeDeep(model, plugin.model);
    }
    if (plugin.irregulars) {
      addIrregulars(model, plugin.irregulars);
    }
    // shallow-merge compute
    if (plugin.compute) {
      Object.assign(compute, plugin.compute);
    }
    // append new hooks
    if (hooks) {
      world.hooks = hooks.concat(plugin.hooks || []);
    }
    // assign new class methods
    if (plugin.api) {
      plugin.api(View);
    }
    if (plugin.lib) {
      Object.keys(plugin.lib).forEach(k => nlp[k] = plugin.lib[k]);
    }
    if (plugin.tags) {
      nlp.addTags(plugin.tags);
    }
    if (plugin.words) {
      nlp.addWords(plugin.words);
    }
    if (plugin.mutate) {
      plugin.mutate(world);
    }
  };
  var extend$1 = extend;

  /** log the decision-making to console */
  const verbose = function (set) {
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  const isObject$5 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const isArray$8 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (isArray$8(term.tags)) {
          term.tags = new Set(term.tags);
        }
        return term
      })
    })
  };

  // interpret an array-of-arrays
  const preTokenized = function (arr) {
    return arr.map((a) => {
      return a.map(str => {
        return {
          text: str,
          normal: str,//cleanup
          pre: '',
          post: ' ',
          tags: new Set()
        }
      })
    })
  };

  const inputs = function (input, View, world) {
    const { methods } = world;
    let doc = new View([]);
    doc.world = world;
    // support a number
    if (typeof input === 'number') {
      input = String(input);
    }
    // return empty doc
    if (!input) {
      return doc
    }
    // parse a string
    if (typeof input === 'string') {
      let document = methods.one.tokenize.fromString(input, world);
      return new View(document)
    }
    // handle compromise View
    if (isObject$5(input) && input.isView) {
      return new View(input.document, input.ptrs)
    }
    // handle json input
    if (isArray$8(input)) {
      // pre-tokenized array-of-arrays 
      if (isArray$8(input[0])) {
        let document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      let document = fromJson(input);
      return new View(document)
    }
    return doc
  };
  var handleInputs = inputs;

  let world = Object.assign({}, tmpWrld);

  const nlp = function (input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    let doc = handleInputs(input, View$1, world);
    if (input) {
      doc.compute(world.hooks);
    }
    return doc
  };
  Object.defineProperty(nlp, '_world', {
    value: world,
    writable: true,
  });

  /** don't run the POS-tagger */
  nlp.tokenize = function (input, lex) {
    const { compute } = this._world;
    // add user-given words to lexicon
    if (lex) {
      nlp.addWords(lex);
    }
    // run the tokenizer
    let doc = handleInputs(input, View$1, world);
    // give contractions a shot, at least
    if (compute.contractions) {
      doc.compute(['alias', 'normal', 'machine', 'contractions']); //run it if we've got it
    }
    return doc
  };

  /** extend compromise functionality */
  nlp.plugin = function (plugin) {
    extend$1(plugin, this._world, View$1, this);
    return this
  };
  nlp.extend = nlp.plugin;


  /** reach-into compromise internals */
  nlp.world = function () {
    return this._world
  };
  nlp.model = function () {
    return this._world.model
  };
  nlp.methods = function () {
    return this._world.methods
  };
  nlp.hooks = function () {
    return this._world.hooks
  };

  /** log the decision-making to console */
  nlp.verbose = verbose;
  /** current library release version */
  nlp.version = version$1;

  var nlp$1 = nlp;

  const createCache = function (document) {
    let cache = document.map(terms => {
      let stuff = new Set();
      terms.forEach(term => {
        // add words
        if (term.normal !== '') {
          stuff.add(term.normal);
        }
        // cache switch-status - '%Noun|Verb%'
        if (term.switch) {
          stuff.add(`%${term.switch}%`);
        }
        // cache implicit words, too
        if (term.implicit) {
          stuff.add(term.implicit);
        }
        if (term.machine) {
          stuff.add(term.machine);
        }
        if (term.root) {
          stuff.add(term.root);
        }
        // cache slashes words, etc
        if (term.alias) {
          term.alias.forEach(str => stuff.add(str));
        }
        let tags = Array.from(term.tags);
        for (let t = 0; t < tags.length; t += 1) {
          stuff.add('#' + tags[t]);
        }
      });
      return stuff
    });
    return cache
  };
  var cacheDoc = createCache;

  var methods$l = {
    one: {
      cacheDoc,
    },
  };

  const methods$k = {
    /** */
    cache: function () {
      this._cache = this.methods.one.cacheDoc(this.document);
      return this
    },
    /** */
    uncache: function () {
      this._cache = null;
      return this
    },
  };
  const addAPI$3 = function (View) {
    Object.assign(View.prototype, methods$k);
  };
  var api$g = addAPI$3;

  var compute$7 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$1 = {
    api: api$g,
    compute: compute$7,
    methods: methods$l,
  };

  var caseFns = {
    /** */
    toLowerCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toLowerCase();
      });
      return this
    },
    /** */
    toUpperCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toUpperCase();
      });
      return this
    },
    /** */
    toTitleCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
      });
      return this
    },
    /** */
    toCamelCase: function () {
      this.docs.forEach(terms => {
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
          }
          if (i !== terms.length - 1) {
            t.post = '';
          }
        });
      });
      return this
    },
  };

  // case logic
  const isTitleCase$1 = (str) => /^\p{Lu}[\p{Ll}'???]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      let args = [index, 0].concat(child);
      Array.prototype.splice.apply(parent, args);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-??????]/;
    let lastTerm = terms[terms.length - 1];
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // sentence-ending punctuation should move in append
  const movePunct = (source, end, needle) => {
    const juicy = /[-.?!,;:)??????'"]/g;
    let wasLast = source[end - 1];
    if (!wasLast) {
      return
    }
    let post = wasLast.post;
    if (juicy.test(post)) {
      let punct = post.match(juicy).join(''); //not perfect
      let last = needle[needle.length - 1];
      last.post = punct + last.post;
      // remove it, from source
      wasLast.post = wasLast.post.replace(juicy, '');
    }
  };


  const moveTitleCase = function (home, start, needle) {
    let from = home[start];
    // should we bother?
    if (start !== 0 || !isTitleCase$1(from.text)) {
      return
    }
    // titlecase new first term
    needle[0].text = toTitleCase(needle[0].text);
    // should we un-titlecase the old word?
    let old = home[start];
    if (old.tags.has('ProperNoun') || old.tags.has('Acronym')) {
      return
    }
    if (isTitleCase$1(old.text) && old.text.length > 1) {
      old.text = toLowerCase(old.text);
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document) {
    let [n, start, end] = ptr;
    // introduce spaces appropriately
    if (start === 0) {
      // at start - need space in insert
      endSpace(needle);
    } else if (end === document[n].length) {
      // at end - need space in home
      endSpace(needle);
    } else {
      // in middle - need space in home and insert
      endSpace(needle);
      endSpace([home[ptr[1]]]);
    }
    moveTitleCase(home, start, needle);
    // movePunct(home, end, needle)
    spliceArr(home, start, needle);
  };

  const cleanAppend = function (home, ptr, needle, document) {
    let [n, , end] = ptr;
    let total = (document[n] || []).length;
    if (end < total) {
      // are we in the middle?
      // add trailing space on self
      movePunct(home, end, needle);
      endSpace(needle);
    } else if (total === end) {
      // are we at the end?
      // add a space to predecessor
      endSpace(home);
      // very end, move period
      movePunct(home, end, needle);
      // is there another sentence after?
      if (document[n + 1]) {
        needle[needle.length - 1].post += ' ';
      }
    }
    spliceArr(home, ptr[2], needle);
    // set new endId
    ptr[4] = needle[needle.length - 1].id;
  };

  /*
  unique & ordered term ids, based on time & term index

  Base 36 (numbers+ascii)
    3 digit 4,600
    2 digit 1,200
    1 digit 36

    TTT|NNN|II|R

  TTT -> 46 terms since load
  NNN -> 46 thousand sentences (>1 inf-jest)
  II  -> 1,200 words in a sentence (nuts)
  R   -> 1-36 random number 

  novels: 
    avg 80,000 words
      15 words per sentence
    5,000 sentences

  Infinite Jest:
    36,247 sentences
    https://en.wikipedia.org/wiki/List_of_longest_novels

  collisions are more-likely after
      46 seconds have passed,
    and 
      after 46-thousand sentences

  */
  let index$2 = 0;

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    index$2 += 1;

    //don't overflow index
    index$2 = index$2 > 46655 ? 0 : index$2;
    //don't overflow sentences
    n = n > 46655 ? 0 : n;
    // //don't overflow terms
    i = i > 1294 ? 0 : i;

    // 3 digits for time
    let id = pad3(index$2.toString(36));
    // 3 digit  for sentence index (46k)
    id += pad3(n.toString(36));

    // 1 digit for term index (36)
    let tx = i.toString(36);
    tx = tx.length < 2 ? '0' + tx : tx; //pad2
    id += tx;

    // 1 digit random number
    let r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  var uuid = toId;

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we inserting inside a contraction?
  // expand it first
  const expand$1 = function (m) {
    if (m.has('@hasContraction') && typeof m.contractions === 'function') {//&& m.after('^.').has('@hasContraction')
      let more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  const isArray$7 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // set new ids for each terms
  const addIds$2 = function (terms) {
    terms = terms.map((term) => {
      term.id = uuid(term);
      return term
    });
    return terms
  };

  const getTerms = function (input, world) {
    const { methods } = world;
    // create our terms from a string
    if (typeof input === 'string') {
      return methods.one.tokenize.fromString(input, world)[0] //assume one sentence
    }
    //allow a view object
    if (typeof input === 'object' && input.isView) {
      return input.clone().docs[0] || [] //assume one sentence
    }
    //allow an array of terms, too
    if (isArray$7(input)) {
      return isArray$7(input[0]) ? input[0] : input
    }
    return []
  };

  const insert = function (input, view, prepend) {
    const { document, world } = view;
    view.uncache();
    // insert words at end of each doc
    let ptrs = view.fullPointer;
    let selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      let ptr = m.fullPointer[0];
      let [n] = ptr;
      // add-in the words
      let home = document[n];
      let terms = getTerms(input, world);
      // are we inserting nothing?
      if (terms.length === 0) {
        return
      }
      terms = addIds$2(terms);
      if (prepend) {
        expand$1(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document);
      } else {
        expand$1(view.update([ptr]).lastTerm());
        cleanAppend(home, ptr, terms, document);
      }
      // harden the pointer
      if (document[n] && document[n][ptr[1]]) {
        ptr[3] = document[n][ptr[1]].id;
      }
      // change self backwards by len
      selfPtrs[i] = ptr;
      // extend the pointer
      ptr[2] += terms.length;
      ptrs[i] = ptr;
    });
    let doc = view.toView(ptrs);
    // shift our self pointer, if necessary
    view.ptrs = selfPtrs;
    // try to tag them, too
    doc.compute(['id', 'index', 'lexicon']);
    if (doc.world.compute.preTagger) {
      doc.compute('preTagger');
    }
    return doc
  };

  const fns$3 = {
    insertAfter: function (input) {
      return insert(input, this, false)
    },
    insertBefore: function (input) {
      return insert(input, this, true)
    },

  };
  fns$3.append = fns$3.insertAfter;
  fns$3.prepend = fns$3.insertBefore;
  fns$3.insert = fns$3.insertAfter;

  var insert$1 = fns$3;

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  const titleCase$2 = function (str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
  };

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn) {
    main.forEach(m => {
      let out = fn(m);
      m.replaceWith(out);
    });
    return main
  };

  // support 'foo $0' replacements
  const subDollarSign = function (input, main) {
    if (typeof input !== 'string') {
      return input
    }
    let groups = main.groups();
    input = input.replace(dollarStub, (a) => {
      let num = a.replace(/\$/, '');
      if (groups.hasOwnProperty(num)) {
        return groups[num].text()
      }
      return a
    });
    return input
  };

  fns$2.replaceWith = function (input, keep = {}) {
    let ptrs = this.fullPointer;
    let main = this;
    this.uncache();
    if (typeof input === 'function') {
      return replaceByFn(main, input)
    }
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    let original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    // slide this in
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
    main.insertAfter(input);
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      let more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    main.delete(original); //science.
    // what should we return?
    let m = main.toView(ptrs).compute(['index', 'lexicon']);
    if (m.world.compute.preTagger) {
      m.compute('preTagger');
    }
    // replace any old tags
    if (keep.tags) {
      m.terms().forEach((term, i) => {
        term.tagSafe(oldTags[i]);
      });
    }
    // try to co-erce case, too
    if (keep.case && m.docs[0] && m.docs[0][0] && m.docs[0][0].index[1] === 0) {
      m.docs[0][0].text = titleCase$2(m.docs[0][0].text);
    }
    // console.log(input.docs[0])
    // let regs = input.docs[0].map(t => {
    //   return { id: t.id, optional: true }
    // })
    // m.after('(a|hoy)').debug()
    // m.growRight('(a|hoy)').debug()
    // console.log(m)
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && !input) {
      return this.replaceWith(match, keep)
    }
    let m = this.match(match);
    if (!m.found) {
      return this
    }
    this.soften();
    return m.replaceWith(input, keep)
  };
  var replace = fns$2;

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    let last = terms.length - 1;
    let from = terms[last];
    let to = terms[last - len];
    if (to && from) {
      to.post += from.post; //this isn't perfect.
      to.post = to.post.replace(/ +([.?!,;:])/, '$1');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = to.post.replace(/[,;:]+([.?!])/, '$1');
    }
  };

  // remove terms from document json
  const pluckOut = function (document, nots) {
    nots.forEach(ptr => {
      let [n, start, end] = ptr;
      let len = end - start;
      if (!document[n]) {
        return // weird!
      }
      if (end === document[n].length && end > 1) {
        repairPunct(document[n], len);
      }
      document[n].splice(start, len); // replaces len terms at index start
    });
    // remove any now-empty sentences
    // (foreach + splice = 'mutable filter')
    for (let i = document.length - 1; i >= 0; i -= 1) {
      if (document[i].length === 0) {
        document.splice(i, 1);
        // remove any trailing whitespace before our removed sentence
        if (i === document.length && document[i - 1]) {
          let terms = document[i - 1];
          let lastTerm = terms[terms.length - 1];
          if (lastTerm) {
            lastTerm.post = lastTerm.post.trimEnd();
          }
        }
        // repair any downstream indexes
        // for (let k = i; k < document.length; k += 1) {
        //   document[k].forEach(term => term.index[0] -= 1)
        // }
      }
    }
    return document
  };

  var pluckOutTerm = pluckOut;

  const fixPointers$1 = function (ptrs, gonePtrs) {
    ptrs = ptrs.map(ptr => {
      let [n] = ptr;
      if (!gonePtrs[n]) {
        return ptr
      }
      gonePtrs[n].forEach(no => {
        let len = no[2] - no[1];
        // does it effect our pointer?
        if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
          ptr[2] -= len;
        }
      });
      return ptr
    });

    // decrement any pointers after a now-empty pointer
    ptrs.forEach((ptr, i) => {
      // is the pointer now empty?
      if (ptr[1] === 0 && ptr[2] == 0) {
        // go down subsequent pointers
        for (let n = i + 1; n < ptrs.length; n += 1) {
          ptrs[n][0] -= 1;
          if (ptrs[n][0] < 0) {
            ptrs[n][0] = 0;
          }
        }
      }
    });
    // remove any now-empty pointers
    ptrs = ptrs.filter(ptr => ptr[2] - ptr[1] > 0);

    // remove old hard-pointers
    ptrs = ptrs.map((ptr) => {
      ptr[3] = null;
      ptr[4] = null;
      return ptr
    });
    return ptrs
  };

  const methods$j = {
    /** */
    remove: function (reg) {
      const { indexN } = this.methods.one.pointer;
      this.uncache();
      // two modes:
      //  - a. remove self, from full parent
      let self = this.all();
      let not = this;
      //  - b. remove a match, from self
      if (reg) {
        self = this;
        not = this.match(reg);
      }
      let isFull = !self.ptrs;
      // is it part of a contraction?
      if (not.has('@hasContraction') && not.contractions) {
        let more = not.grow('@hasContraction');
        more.contractions().expand();
      }

      let ptrs = self.fullPointer;
      let nots = not.fullPointer.reverse();
      // remove them from the actual document)
      let document = pluckOutTerm(this.document, nots);
      // repair our pointers
      let gonePtrs = indexN(nots);
      ptrs = fixPointers$1(ptrs, gonePtrs);
      // clean up our original inputs
      self.ptrs = ptrs;
      self.document = document;
      self.compute('index');
      // if we started zoomed-out, try to end zoomed-out
      if (isFull) {
        self.ptrs = undefined;
      }
      if (!reg) {
        this.ptrs = [];
        return self.none()
      }
      let res = self.toView(ptrs); //return new document
      return res
    },
  };

  // aliases
  methods$j.delete = methods$j.remove;
  var remove = methods$j;

  const methods$i = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      this.docs.forEach(terms => {
        let term = terms[0];
        if (concat === true) {
          term.pre += str;
        } else {
          term.pre = str;
        }
      });
      return this
    },

    /** add this punctuation or whitespace after each match: */
    post: function (str, concat) {
      if (str === undefined) {
        let last = this.docs[this.docs.length - 1];
        return last[last.length - 1].post
      }
      this.docs.forEach(terms => {
        let term = terms[terms.length - 1];
        if (concat === true) {
          term.post += str;
        } else {
          term.post = str;
        }
      });
      return this
    },

    /** remove whitespace from start/end */
    trim: function () {
      if (!this.found) {
        return this
      }
      let docs = this.docs;
      let start = docs[0][0];
      start.pre = start.pre.trimStart();
      let last = docs[docs.length - 1];
      let end = last[last.length - 1];
      end.post = end.post.trimEnd();
      return this
    },

    /** connect words with hyphen, and remove whitespace */
    hyphenate: function () {
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.pre = '';
          }
          if (terms[i + 1]) {
            t.post = '-';
          }
        });
      });
      return this
    },

    /** remove hyphens between words, and set whitespace */
    dehyphenate: function () {
      const hasHyphen = /[-??????]/;
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach(t => {
          if (hasHyphen.test(t.post)) {
            t.post = ' ';
          }
        });
      });
      return this
    },

    /** add quotations around these matches */
    toQuotations: function (start, end) {
      start = start || `"`;
      end = end || `"`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        let last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      start = start || `(`;
      end = end || `)`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        let last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },
  };
  methods$i.deHyphenate = methods$i.dehyphenate;
  methods$i.toQuotation = methods$i.toQuotations;

  var whitespace = methods$i;

  /** alphabetical order */
  const alpha = (a, b) => {
    if (a.normal < b.normal) {
      return -1
    }
    if (a.normal > b.normal) {
      return 1
    }
    return 0
  };

  /** count the # of characters of each match */
  const length = (a, b) => {
    let left = a.normal.trim().length;
    let right = b.normal.trim().length;
    if (left < right) {
      return 1
    }
    if (left > right) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const wordCount$2 = (a, b) => {
    if (a.words < b.words) {
      return 1
    }
    if (a.words > b.words) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const sequential = (a, b) => {
    if (a[0] < b[0]) {
      return 1
    }
    if (a[0] > b[0]) {
      return -1
    }
    return a[1] > b[1] ? 1 : -1
  };

  /** sort by # of duplicates in the document*/
  const byFreq = function (arr) {
    let counts = {};
    arr.forEach(o => {
      counts[o.normal] = counts[o.normal] || 0;
      counts[o.normal] += 1;
    });
    // sort by freq
    arr.sort((a, b) => {
      let left = counts[a.normal];
      let right = counts[b.normal];
      if (left < right) {
        return 1
      }
      if (left > right) {
        return -1
      }
      return 0
    });
    return arr
  };

  var methods$h = { alpha, length, wordCount: wordCount$2, sequential, byFreq };

  // aliases
  const seqNames = new Set(['index', 'sequence', 'seq', 'sequential', 'chron', 'chronological']);
  const freqNames = new Set(['freq', 'frequency', 'topk', 'repeats']);
  const alphaNames = new Set(['alpha', 'alphabetical']);

  // support function as parameter
  const customSort = function (view, fn) {
    let ptrs = view.fullPointer;
    ptrs = ptrs.sort((a, b) => {
      a = view.update([a]);
      b = view.update([b]);
      return fn(a, b)
    });
    view.ptrs = ptrs; //mutate original
    return view
  };

  /** re-arrange the order of the matches (in place) */
  const sort = function (input) {
    let { docs, pointer } = this;
    this.uncache();
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input = input || 'alpha';
    let ptrs = pointer || docs.map((_d, n) => [n]);
    let arr = docs.map((terms, n) => {
      return {
        index: n,
        words: terms.length,
        normal: terms.map(t => t.machine || t.normal || '').join(' '),
        pointer: ptrs[n],
      }
    });
    // 'chronological' sorting
    if (seqNames.has(input)) {
      input = 'sequential';
    }
    // alphabetical sorting
    if (alphaNames.has(input)) {
      input = 'alpha';
    }
    // sort by frequency
    if (freqNames.has(input)) {
      arr = methods$h.byFreq(arr);
      return this.update(arr.map(o => o.pointer))
    }
    // apply sort method on each phrase
    if (typeof methods$h[input] === 'function') {
      arr = arr.sort(methods$h[input]);
      return this.update(arr.map(o => o.pointer))
    }
    return this
  };

  /** reverse the order of the matches, but not the words or index */
  const reverse$2 = function () {
    let ptrs = this.pointer || this.docs.map((_d, n) => [n]);
    ptrs = [].concat(ptrs);
    ptrs = ptrs.reverse();
    if (this._cache) {
      this._cache = this._cache.reverse();
    }
    return this.update(ptrs)
  };

  /** remove any duplicate matches */
  const unique = function () {
    let already = new Set();
    let res = this.filter(m => {
      let txt = m.text('machine');
      if (already.has(txt)) {
        return false
      }
      already.add(txt);
      return true
    });
    // this.ptrs = res.ptrs //mutate original?
    return res//.compute('index')
  };

  var sort$1 = { unique, reverse: reverse$2, sort };

  const isArray$6 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      let end = homeDocs[homeDocs.length - 1];
      let last = end[end.length - 1];
      if (/ /.test(last.post) === false) {
        last.post += ' ';
      }
    }
    homeDocs = homeDocs.concat(inputDocs);
    return homeDocs
  };

  const combineViews = function (home, input) {
    // is it a view from the same document?
    if (home.document === input.document) {
      let ptrs = home.fullPointer.concat(input.fullPointer);
      return home.toView(ptrs).compute('index')
    }
    // update n of new pointer, to end of our pointer
    let ptrs = input.fullPointer;
    ptrs.forEach(a => {
      a[0] += home.document.length;
    });
    home.document = combineDocs(home.document, input.docs);
    return home.all()
  };

  var concat = {
    // add string as new match/sentence
    concat: function (input) {
      // parse and splice-in new terms
      if (typeof input === 'string') {
        let more = this.fromText(input);
        // easy concat
        if (!this.found || !this.ptrs) {
          this.document = this.document.concat(more.document);
        } else {
          // if we are in the middle, this is actually a splice operation
          let ptrs = this.fullPointer;
          let at = ptrs[ptrs.length - 1][0];
          this.document.splice(at, 0, ...more.document);
        }
        // put the docs
        return this.all().compute('index')
      }
      // plop some view objects together
      if (typeof input === 'object' && input.isView) {
        return combineViews(this, input)
      }
      // assume it's an array of terms
      if (isArray$6(input)) {
        let docs = combineDocs(this.document, input);
        this.document = docs;
        return this.all()
      }
      return this
    },
  };

  // add indexes to pointers
  const harden = function () {
    this.ptrs = this.fullPointer;
    return this
  };
  // remove indexes from pointers
  const soften = function () {
    let ptr = this.ptrs;
    if (!ptr || ptr.length < 1) {
      return this
    }
    ptr = ptr.map(a => a.slice(0, 3));
    this.ptrs = ptr;
    return this
  };
  var harden$1 = { harden, soften };

  const methods$g = Object.assign({}, caseFns, insert$1, replace, remove, whitespace, sort$1, concat, harden$1);

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$g);
  };
  var api$f = addAPI$2;

  const compute$5 = {
    id: function (view) {
      let docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          let term = docs[n][i];
          term.id = term.id || uuid(term);
        }
      }
    }
  };

  var compute$6 = compute$5;

  var change = {
    api: api$f,
    compute: compute$6,
  };

  var contractions$4 = [
    // simple mappings
    { word: '@', out: ['at'] },
    { word: 'alot', out: ['a', 'lot'] },
    { word: 'brb', out: ['be', 'right', 'back'] },
    { word: 'cannot', out: ['can', 'not'] },
    { word: 'cant', out: ['can', 'not'] },
    { word: 'dont', out: ['do', 'not'] },
    { word: 'dun', out: ['do', 'not'] },
    { word: 'wont', out: ['will', 'not'] },
    { word: "can't", out: ['can', 'not'] },
    { word: "shan't", out: ['should', 'not'] },
    { word: "won't", out: ['will', 'not'] },
    { word: "that's", out: ['that', 'is'] },
    { word: "what's", out: ['what', 'is'] },
    { word: "let's", out: ['let', 'us'] },
    { word: "there's", out: ['there', 'is'] },
    { word: 'dunno', out: ['do', 'not', 'know'] },
    { word: 'gonna', out: ['going', 'to'] },
    { word: 'gotta', out: ['have', 'got', 'to'] }, //hmm
    { word: 'gimme', out: ['give', 'me'] },
    { word: 'tryna', out: ['trying', 'to'] },
    { word: 'gtg', out: ['got', 'to', 'go'] },
    { word: 'im', out: ['i', 'am'] },
    { word: 'imma', out: ['I', 'will'] },
    { word: 'imo', out: ['in', 'my', 'opinion'] },
    { word: 'irl', out: ['in', 'real', 'life'] },
    { word: 'ive', out: ['i', 'have'] },
    { word: 'rn', out: ['right', 'now'] },
    { word: 'tbh', out: ['to', 'be', 'honest'] },
    { word: 'wanna', out: ['want', 'to'] },
    { word: `c'mere`, out: ['come', 'here'] },
    { word: `c'mon`, out: ['come', 'on'] },
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },
    // shoulda, coulda
    { word: 'shoulda', out: ['should', 'have'] },
    { word: 'coulda', out: ['coulda', 'have'] },
    { word: 'woulda', out: ['woulda', 'have'] },
    { word: 'musta', out: ['must', 'have'] },

    // { after: `cause`, out: ['because'] },
    { word: "tis", out: ['it', 'is'] },
    { word: "twas", out: ['it', 'was'] },
    { word: `y'know`, out: ['you', 'know'] },
    { word: "ne'er", out: ['never'] },
    { word: "o'er", out: ['over'] },
    // contraction-part mappings
    { after: 'll', out: ['will'] },
    { after: 've', out: ['have'] },
    { after: 're', out: ['are'] },
    { after: 'm', out: ['am'] },
    // french contractions
    { before: 'c', out: ['ce'] },
    { before: 'm', out: ['me'] },
    { before: 'n', out: ['ne'] },
    { before: 'qu', out: ['que'] },
    { before: 's', out: ['se'] },
    { before: 't', out: ['tu'] }, // t'aime
  ];

  var model$5 = { one: { contractions: contractions$4 } };

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    let [n, w] = point;
    if (!words || words.length === 0) {
      return
    }
    words = words.map((word, i) => {
      word.implicit = word.text;
      word.machine = word.text;
      word.pre = '';
      word.post = '';
      word.text = '';
      word.normal = '';
      word.index = [n, w + i];
      return word
    });
    if (words[0]) {
      // move whitespace over
      words[0].pre = document[n][w].pre;
      words[words.length - 1].post = document[n][w].post;
      // add the text/normal to the first term
      words[0].text = document[n][w].text;
      words[0].normal = document[n][w].normal; // move tags too?
    }
    // do the splice
    document[n].splice(w, 1, ...words);
  };
  var splice = insertContraction;

  const hasContraction$1 = /'/;
  //look for a past-tense verb
  // const hasPastTense = (terms, i) => {
  //   let after = terms.slice(i + 1, i + 3)
  //   return after.some(t => t.tags.has('PastTense'))
  // }
  // he'd walked -> had
  // how'd -> did
  // he'd go -> would

  const alwaysDid = new Set([
    'what',
    'how',
    'when',
    'where',
    'why',
  ]);

  // after-words
  const useWould = new Set([
    'be',
    'go',
    'start',
    'think',
    'need',
  ]);

  const useHad = new Set([
    'been',
    'gone'
  ]);
  // they'd gone
  // they'd go


  // he'd been
  //    he had been
  //    he would been

  const _apostropheD = function (terms, i) {
    let before = terms[i].normal.split(hasContraction$1)[0];

    // what'd, how'd
    if (alwaysDid.has(before)) {
      return [before, 'did']
    }
    if (terms[i + 1]) {
      // they'd gone
      if (useHad.has(terms[i + 1].normal)) {
        return [before, 'had']
      }
      // they'd go
      if (useWould.has(terms[i + 1].normal)) {
        return [before, 'would']
      }
    }
    return null
    //   if (hasPastTense(terms, i) === true) {
    //     return [before, 'had']
    //   }
    //   // had/would/did
    //   return [before, 'would']
  };
  var apostropheD = _apostropheD;

  //ain't -> are/is not
  const apostropheT = function (terms, i) {
    if (terms[i].normal === "ain't" || terms[i].normal === 'aint') {
      return null //do this in ./two/
    }
    let before = terms[i].normal.replace(/n't/, '');
    return [before, 'not']
  };

  var apostropheT$1 = apostropheT;

  const hasContraction = /'/;

  // l'amour
  const preL = (terms, i) => {
    // le/la
    let after = terms[i].normal.split(hasContraction)[1];
    // quick french gender disambig (rough)
    if (after && after.endsWith('e')) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    let after = terms[i].normal.split(hasContraction)[1];
    // quick guess for noun-agreement (rough)
    if (after && after.endsWith('e')) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => {
    let after = terms[i].normal.split(hasContraction)[1];
    return ['je', after]
  };

  var french = {
    preJ,
    preL,
    preD,
  };

  const isRange = /^([0-9.]{1,4}[a-z]{0,2}) ?[-??????] ?([0-9]{1,4}[a-z]{0,2})$/i;
  const timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-??????] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;
  const phoneNum = /^[0-9]{3}-[0-9]{4}$/;

  const numberRange = function (terms, i) {
    let term = terms[i];
    let parts = term.text.match(isRange);
    if (parts !== null) {
      // 123-1234 is a phone number, not a number-range
      if (term.tags.has('PhoneNumber') === true || phoneNum.test(term.text)) {
        return null
      }
      return [parts[1], 'to', parts[2]]
    } else {
      parts = term.text.match(timeRange);
      if (parts !== null) {
        return [parts[1], 'to', parts[4]]
      }
    }
    return null
  };
  var numberRange$1 = numberRange;

  const numUnit = /^([+-]?[0-9][.,0-9]*)([a-z????????/]+)$/; //(must be lowercase)

  const notUnit = new Set([
    'st',
    'nd',
    'rd',
    'th',
    'am',
    'pm',
    'max',
    '??',
    's', // 1990s
    'e' // 18e - french/spanish ordinal
  ]);

  const numberUnit = function (terms, i) {
    let term = terms[i];
    let parts = term.text.match(numUnit);
    if (parts !== null) {
      // is it a recognized unit, like 'km'?
      let unit = parts[2].toLowerCase().trim();
      // don't split '3rd'
      if (notUnit.has(unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };
  var numberUnit$1 = numberUnit;

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-??????]*[-??????].*?[0-9]/;

  // run tagger on our new implicit terms
  const reTag = function (terms, view, start, len) {
    let tmp = view.update();
    tmp.document = [terms];
    // offer to re-tag neighbours, too
    let end = start + len;
    if (start > 0) {
      start -= 1;
    }
    if (terms[end]) {
      end += 1;
    }
    tmp.ptrs = [[0, start, end]];
  };

  const byEnd = {
    // ain't
    t: (terms, i) => apostropheT$1(terms, i),
    // how'd
    d: (terms, i) => apostropheD(terms, i),
  };

  const byStart = {
    // j'aime
    j: (terms, i) => french.preJ(terms, i),
    // l'amour
    l: (terms, i) => french.preL(terms, i),
    // d'amerique
    d: (terms, i) => french.preD(terms, i),
  };

  // pull-apart known contractions from model
  const knownOnes = function (list, term, before, after) {
    for (let i = 0; i < list.length; i += 1) {
      let o = list[i];
      // look for word-word match (cannot-> [can, not])
      if (o.word === term.normal) {
        return o.out
      }
      // look for after-match ('re -> [_, are])
      else if (after !== null && after === o.after) {
        return [before].concat(o.out)
      }
      // look for before-match (l' -> [le, _])
      else if (before !== null && before === o.before) {
        return o.out.concat(after)
        // return [o.out, after] //typeof o.out === 'string' ? [o.out, after] : o.out(terms, i)
      }
    }
    return null
  };

  const toDocs = function (words, view) {
    let doc = view.fromText(words.join(' '));
    doc.compute(['id', 'alias']);
    return doc.docs[0]
  };

  //really easy ones
  const contractions$2 = (view) => {
    let { world, document } = view;
    const { model, methods } = world;
    let list = model.one.contractions || [];
    new Set(model.one.units || []);
    // each sentence
    document.forEach((terms, n) => {
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal) === true) {
          [before, after] = terms[i].normal.split(byApostrophe);
        }
        // any known-ones, like 'dunno'?
        let words = knownOnes(list, terms[i], before, after);
        // ['foo', 's']
        if (!words && byEnd.hasOwnProperty(after)) {
          words = byEnd[after](terms, i, world);
        }
        // ['j', 'aime']
        if (!words && byStart.hasOwnProperty(before)) {
          words = byStart[before](terms, i);
        }
        // actually insert the new terms
        if (words) {
          words = toDocs(words, view);
          splice(document, [n, i], words);
          reTag(document[n], view, i, words.length);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange$1(terms, i);
          if (words) {
            words = toDocs(words, view);
            splice(document, [n, i], words);
            methods.one.setTag(words, 'NumberRange', world);//add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
            reTag(document[n], view, i, words.length);
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit$1(terms, i);
        if (words) {
          words = toDocs(words, view);
          splice(document, [n, i], words);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
    });
  };
  var contractions$3 = contractions$2;

  var compute$4 = { contractions: contractions$3 };

  const plugin = {
    model: model$5,
    compute: compute$4,
    hooks: ['contractions'],
  };
  var contractions$1 = plugin;

  // scan-ahead to match multiple-word terms - 'jack rabbit'
  const checkMulti = function (terms, i, lexicon, setTag, world) {
    let max = i + 4 > terms.length ? terms.length - i : 4;
    let str = terms[i].machine || terms[i].normal;
    for (let skip = 1; skip < max; skip += 1) {
      let t = terms[i + skip];
      let word = t.machine || t.normal;
      str += ' ' + word;
      if (lexicon.hasOwnProperty(str) === true) {
        let tag = lexicon[str];
        let ts = terms.slice(i, i + skip + 1);
        setTag(ts, tag, world, false, '1-multi-lexicon');

        // special case for phrasal-verbs - 2nd word is a #Particle
        if (tag && tag.length === 2 && (tag[0] === 'PhrasalVerb' || tag[1] === 'PhrasalVerb')) {
          setTag([ts[1]], 'Particle', world, false, '1-phrasal-particle');
        }
        return true
      }
    }
    return false
  };

  const multiWord = function (terms, i, world) {
    const { model, methods } = world;
    // const { fastTag } = methods.one
    const setTag = methods.one.setTag;
    const multi = model.one._multiCache || {};
    const lexicon = model.one.lexicon || {};
    // basic lexicon lookup
    let t = terms[i];
    let word = t.machine || t.normal;
    // multi-word lookup
    if (terms[i + 1] !== undefined && multi[word] === true) {
      return checkMulti(terms, i, lexicon, setTag, world)
    }
    return null
  };
  var multiWord$1 = multiWord;

  const prefix$1 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
  // anti|non|extra|inter|intra|over
  const allowPrefix = new Set(['Verb', 'Infinitive', 'PastTense', 'Gerund', 'PresentTense', 'Adjective', 'Participle']);

  // tag any words in our lexicon
  const checkLexicon = function (terms, i, world) {
    const { model, methods } = world;
    // const fastTag = methods.one.fastTag
    const setTag = methods.one.setTag;
    const lexicon = model.one.lexicon;

    // basic lexicon lookup
    let t = terms[i];
    let word = t.machine || t.normal;
    // normal lexicon lookup
    if (lexicon[word] !== undefined && lexicon.hasOwnProperty(word)) {
      let tag = lexicon[word];
      setTag([t], tag, world, false, '1-lexicon');
      // fastTag(t, tag, '1-lexicon')
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      let found = t.alias.find(str => lexicon.hasOwnProperty(str));
      if (found) {
        let tag = lexicon[found];
        setTag([t], tag, world, false, '1-lexicon-alias');
        // fastTag(t, tag, '1-lexicon-alias')
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$1.test(word) === true) {
      let stem = word.replace(prefix$1, '');
      if (lexicon.hasOwnProperty(stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, false, '1-lexicon-prefix');
          // fastTag(t, lexicon[stem], '1-lexicon-prefix')
          return true
        }
      }
    }
    return null
  };
  var singleWord = checkLexicon;

  // tag any words in our lexicon - even if it hasn't been filled-up yet
  // rest of pre-tagger is in ./two/preTagger
  const lexicon$5 = function (view) {
    const world = view.world;
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        if (terms[i].tags.size === 0) {
          let found = null;
          found = found || multiWord$1(terms, i, world);
          // lookup known words
          found = found || singleWord(terms, i, world);
        }
      }
    });
  };

  var compute$3 = {
    lexicon: lexicon$5
  };

  // derive clever things from our lexicon key-value pairs
  const expand = function (words) {
    // const { methods, model } = world
    let lex = {};
    // console.log('start:', Object.keys(lex).length)
    let _multi = {};
    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      let tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      word = word.replace(/'s\b/, '');
      // cache multi-word terms
      let split = word.split(/ /);
      if (split.length > 1) {
        _multi[split[0]] = true;
      }
      lex[word] = lex[word] || tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };
  var expandLexicon = expand;

  var methods$f = {
    one: {
      expandLexicon,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords = function (words) {
    const world = this.world();
    const { methods, model } = world;
    if (!words) {
      return
    }
    // normalize tag vals
    Object.keys(words).forEach(k => {
      if (typeof words[k] === 'string' && words[k].startsWith('#')) {
        words[k] = words[k].replace(/^#/, '');
      }
    });
    // add some words to our lexicon
    if (methods.two.expandLexicon) {
      // do fancy ./two version
      let { lex, _multi } = methods.two.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    } else if (methods.one.expandLexicon) {
      // do basic ./one version
      let { lex, _multi } = methods.one.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    } else {
      //no fancy-business
      Object.assign(model.one.lexicon, words);
    }
  };

  var lib$5 = { addWords };

  const model$4 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
    }
  };

  var lexicon$4 = {
    model: model$4,
    methods: methods$f,
    compute: compute$3,
    lib: lib$5,
    hooks: ['lexicon']
  };

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto B??rigo.

  const tokenize$2 = function (phrase, world) {
    const { methods, model } = world;
    let terms = methods.one.tokenize.splitTerms(phrase, model).map(t => methods.one.tokenize.splitWhitespace(t, model));
    return terms.map(term => term.text.toLowerCase())
  };

  // turn an array or object into a compressed aho-corasick structure
  const buildTrie = function (phrases, world) {

    // const tokenize=methods.one.
    let goNext = [{}];
    let endAs = [null];
    let failTo = [0];

    let xs = [];
    let n = 0;
    phrases.forEach(function (phrase) {
      let curr = 0;
      // let wordsB = phrase.split(/ /g).filter(w => w)
      let words = tokenize$2(phrase, world);
      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if (goNext[curr] && goNext[curr].hasOwnProperty(word)) {
          curr = goNext[curr][word];
        } else {
          n++;
          goNext[curr][word] = n;
          goNext[n] = {};
          curr = n;
          endAs[n] = null;
        }
      }
      endAs[curr] = [words.length];
    });
    // f(s) = 0 for all states of depth 1 (the ones from which the 0 state can transition to)
    for (let word in goNext[0]) {
      n = goNext[0][word];
      failTo[n] = 0;
      xs.push(n);
    }

    while (xs.length) {
      let r = xs.shift();
      // for each symbol a such that g(r, a) = s
      let keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        let word = keys[i];
        let s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !goNext[n].hasOwnProperty(word)) {
          n = failTo[n];
        }
        if (goNext.hasOwnProperty(n)) {
          let fs = goNext[n][word];
          failTo[s] = fs;
          if (endAs[fs]) {
            endAs[s] = endAs[s] || [];
            endAs[s] = endAs[s].concat(endAs[fs]);
          }
        } else {
          failTo[s] = 0;
        }
      }
    }
    return { goNext, endAs, failTo }
  };
  var build = buildTrie;

  // console.log(buildTrie(['smart and cool', 'smart and nice']))

  // follow our trie structure
  const scanWords = function (terms, trie, opts) {
    let n = 0;
    let results = [];
    for (let i = 0; i < terms.length; i++) {
      let word = terms[i][opts.form] || terms[i].normal;
      // main match-logic loop:
      while (n > 0 && (trie.goNext[n] === undefined || !trie.goNext[n].hasOwnProperty(word))) {
        n = trie.failTo[n] || 0; // (usually back to 0)
      }
      // did we fail?
      if (!trie.goNext[n].hasOwnProperty(word)) {
        continue
      }
      n = trie.goNext[n][word];
      if (trie.endAs[n]) {
        let arr = trie.endAs[n];
        for (let o = 0; o < arr.length; o++) {
          let len = arr[o];
          let term = terms[i - len + 1];
          let [no, start] = term.index;
          results.push([no, start, start + len, term.id]);
        }
      }
    }
    return results
  };

  const cacheMiss = function (words, cache) {
    for (let i = 0; i < words.length; i += 1) {
      if (cache.has(words[i]) === true) {
        return false
      }
    }
    return true
  };

  const scan = function (view, trie, opts) {
    let results = [];
    opts.form = opts.form || 'normal';
    let docs = view.docs;
    if (!trie.goNext || !trie.goNext[0]) {
      console.error('Compromise invalid lookup trie');//eslint-disable-line
      return view.none()
    }
    let firstWords = Object.keys(trie.goNext[0]);
    // do each phrase
    for (let i = 0; i < docs.length; i++) {
      // can we skip the phrase, all together?
      if (view._cache && view._cache[i] && cacheMiss(firstWords, view._cache[i]) === true) {
        continue
      }
      let terms = docs[i];
      let found = scanWords(terms, trie, opts);
      if (found.length > 0) {
        results = results.concat(found);
      }
    }
    return view.update(results)
  };
  var scan$1 = scan;

  const isObject$4 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  function api$e (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      let trie = isObject$4(input) ? input : build(input, this.world);
      let res = scan$1(this, trie, opts);
      res = res.settle();
      return res
    };
  }

  // chop-off tail of redundant vals at end of array
  const truncate = (list, val) => {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] !== val) {
        list = list.slice(0, i + 1);
        return list
      }
    }
    return list
  };

  // prune trie a bit
  const compress = function (trie) {
    trie.goNext = trie.goNext.map(o => {
      if (Object.keys(o).length === 0) {
        return undefined
      }
      return o
    });
    // chop-off tail of undefined vals in goNext array
    trie.goNext = truncate(trie.goNext, undefined);
    // chop-off tail of zeros in failTo array
    trie.failTo = truncate(trie.failTo, 0);
    // chop-off tail of nulls in endAs array
    trie.endAs = truncate(trie.endAs, null);
    return trie
  };
  var compress$1 = compress;

  /** pre-compile a list of matches to lookup */
  const lib$4 = {
    /** turn an array or object into a compressed trie*/
    buildTrie: function (input) {
      const trie = build(input, this.world());
      return compress$1(trie)
    }
  };
  // add alias
  lib$4.compile = lib$4.buildTrie;

  var lookup = {
    api: api$e,
    lib: lib$4
  };

  const relPointer = function (ptrs, parent) {
    if (!parent) {
      return ptrs
    }
    ptrs.forEach(ptr => {
      let n = ptr[0];
      if (parent[n]) {
        ptr[0] = parent[n][0]; //n
        ptr[1] += parent[n][1]; //start
        ptr[2] += parent[n][1]; //end
      }
    });
    return ptrs
  };

  // make match-result relative to whole document
  const fixPointers = function (res, parent) {
    let { ptrs, byGroup } = res;
    ptrs = relPointer(ptrs, parent);
    Object.keys(byGroup).forEach(k => {
      byGroup[k] = relPointer(byGroup[k], parent);
    });
    return { ptrs, byGroup }
  };

  const isObject$3 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // did they pass-in a compromise object?
  const isView = val => val && isObject$3(val) && val.isView === true;

  const isNet = val => val && isObject$3(val) && val.isNet === true;


  // is the pointer the full sentence?
  // export const isFull = function (ptr, document) {
  //   let [n, start, end] = ptr
  //   if (start !== 0) {
  //     return false
  //   }
  //   if (document[n] && document[n][end - 1] && !document[n][end]) {
  //     return true
  //   }
  //   return false
  // }

  const parseRegs = function (regs, opts, world) {
    const one = world.methods.one;
    if (typeof regs === 'number') {
      regs = String(regs);
    }
    // support param as string
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, world);
      regs = one.parseMatch(regs, opts, world);
    }
    return regs
  };

  const match$2 = function (regs, group, opts) {
    const one = this.methods.one;
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.settle()
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const matchOne = function (regs, group, opts) {
    const one = this.methods.one;
    // support at view as a param
    if (isView(regs)) {
      return this.intersection(regs).eq(0)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false, matchOne: true }).view
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group, justOne: true };
    let res = one.match(this.docs, todo, this._cache);
    let { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    let view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const has = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      let ptrs = regs.fullPointer; // support a view object as input
      return ptrs.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.found
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group, justOne: true };
    let ptrs = one.match(this.docs, todo, this._cache).ptrs;
    return ptrs.length > 0
  };

  // 'if'
  const ifFn = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      let m = this.sweep(regs, { tagger: false }).view.settle();
      return this.if(m)//recurse with result
    }
    regs = parseRegs(regs, opts, this.world);
    let todo = { regs, group, justOne: true };
    let ptrs = this.fullPointer;
    let cache = this._cache || [];
    ptrs = ptrs.filter((ptr, i) => {
      let m = this.update([ptr]);
      let res = one.match(m.docs, todo, cache[i]).ptrs;
      return res.length > 0
    });
    let view = this.update(ptrs);
    // try and reconstruct the cache
    if (this._cache) {
      view._cache = ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  const ifNo = function (regs, group, opts) {
    const { methods } = this;
    const one = methods.one;
    // support a view object as input
    if (isView(regs)) {
      return this.filter(m => !m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      let m = this.sweep(regs, { tagger: false }).view.settle();
      return this.ifNo(m)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    let cache = this._cache || [];
    let view = this.filter((m, i) => {
      let todo = { regs, group, justOne: true };
      let ptrs = one.match(m.docs, todo, cache[i]).ptrs;
      return ptrs.length === 0
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$3 = { matchOne, match: match$2, has, if: ifFn, ifNo };

  const before = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    let pre = [];
    let byN = indexN(this.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest match in the sentence
      let first = byN[k].sort((a, b) => (a[1] > b[1] ? 1 : -1))[0];
      if (first[1] > 0) {
        pre.push([first[0], 0, first[1]]);
      }
    });
    let preWords = this.toView(pre);
    if (!regs) {
      return preWords
    }
    return preWords.match(regs, group, opts)
  };

  const after = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    let post = [];
    let byN = indexN(this.fullPointer);
    let document = this.document;
    Object.keys(byN).forEach(k => {
      // check only the latest match in the sentence
      let last = byN[k].sort((a, b) => (a[1] > b[1] ? -1 : 1))[0];
      let [n, , end] = last;
      if (end < document[n].length) {
        post.push([n, end, document[n].length]);
      }
    });
    let postWords = this.toView(post);
    if (!regs) {
      return postWords
    }
    return postWords.match(regs, group, opts)
  };

  const growLeft = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[regs.length - 1].end = true;// ensure matches are beside us ???
    let ptrs = this.fullPointer;
    this.forEach((m, n) => {
      let more = m.before(regs, group);
      if (more.found) {
        let terms = more.terms();
        ptrs[n][1] -= terms.length;
        ptrs[n][3] = terms.docs[0][0].id;
      }
    });
    return this.update(ptrs)
  };

  const growRight = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[0].start = true;// ensure matches are beside us ???
    let ptrs = this.fullPointer;
    this.forEach((m, n) => {
      let more = m.after(regs, group);
      if (more.found) {
        let terms = more.terms();
        ptrs[n][2] += terms.length;
        ptrs[n][4] = null; //remove end-id
      }
    });
    return this.update(ptrs)
  };

  const grow = function (regs, group, opts) {
    return this.growRight(regs, group, opts).growLeft(regs, group, opts)
  };

  var lookaround = { before, after, growLeft, growRight, grow };

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const isArray$5 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc$3 = (reg, view, group) => {
    if (typeof reg === 'string' || isArray$5(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
  };

  const addIds$1 = function (ptr, view) {
    let [n, start, end] = ptr;
    if (view.document[n] && view.document[n][start]) {
      ptr[3] = ptr[3] || view.document[n][start].id;
      if (view.document[n][end - 1]) {
        ptr[4] = ptr[4] || view.document[n][end - 1].id;
      }
    }
    return ptr
  };

  const methods$e = {};
  // [before], [match], [after]
  methods$e.splitOn = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      res.push(o.match);
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before], [match after]
  methods$e.splitBefore = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      if (o.match && o.after) {
        // console.log(combine(o.match, o.after))
        res.push(combine(o.match, o.after));
      } else {
        res.push(o.match);
        res.push(o.after);
      }
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before match], [after]
  methods$e.splitAfter = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    let splits = getDoc$3(m, this, group).fullPointer;
    let all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      if (o.before && o.match) {
        res.push(combine(o.before, o.match));
      } else {
        res.push(o.before);
        res.push(o.match);
      }
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };
  methods$e.split = methods$e.splitAfter;

  var split$1 = methods$e;

  const methods$d = Object.assign({}, match$3, lookaround, split$1);
  // aliases
  methods$d.lookBehind = methods$d.before;
  methods$d.lookBefore = methods$d.before;

  methods$d.lookAhead = methods$d.after;
  methods$d.lookAfter = methods$d.after;

  methods$d.notIf = methods$d.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$d);
  };
  var api$d = matchAPI;

  // match  'foo /yes/' and not 'foo/no/bar'
  const bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
  // match '(yes) but not foo(no)bar'
  const byParentheses = /([!~[^]*(?:<[^<]*>)?\([^)]+[^\\)]\)[?\]+*$~]*)(?:\s|$)/;
  // okay
  const byWord = / /g;

  const isBlock = str => {
    return /^[![^]*(<[^<]*>)?\(/.test(str) && /\)[?\]+*$~]*$/.test(str)
  };
  const isReg = str => {
    return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str)
  };

  const cleanUp = function (arr) {
    arr = arr.map(str => str.trim());
    arr = arr.filter(str => str);
    return arr
  };

  const parseBlocks = function (txt) {
    // parse by /regex/ first
    let arr = txt.split(bySlashes);
    let res = [];
    // parse by (blocks), next
    arr.forEach(str => {
      if (isReg(str)) {
        res.push(str);
        return
      }
      res = res.concat(str.split(byParentheses));
    });
    res = cleanUp(res);
    // split by spaces, now
    let final = [];
    res.forEach(str => {
      if (isBlock(str)) {
        final.push(str);
      } else if (isReg(str)) {
        final.push(str);
      } else {
        final = final.concat(str.split(byWord));
      }
    });
    final = cleanUp(final);
    return final
  };
  var parseBlocks$1 = parseBlocks;

  const hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
  const andSign = /&&/;
  // const hasDash = /\p{Letter}[-??????]\p{Letter}/u
  const captureName = new RegExp(/^<\s*(\S+)\s*>/);
  /* break-down a match expression into this:
  {
    word:'',
    tag:'',
    regex:'',

    start:false,
    end:false,
    negative:false,
    anything:false,
    greedy:false,
    optional:false,

    named:'',
    choices:[],
  }
  */
  const titleCase$1 = str => str.charAt(0).toUpperCase() + str.substring(1);
  const end = (str) => str.charAt(str.length - 1);
  const start = (str) => str.charAt(0);
  const stripStart = (str) => str.substring(1);
  const stripEnd = (str) => str.substring(0, str.length - 1);

  const stripBoth = function (str) {
    str = stripStart(str);
    str = stripEnd(str);
    return str
  };
  //
  const parseToken = function (w, opts) {
    let obj = {};
    //collect any flags (do it twice)
    for (let i = 0; i < 2; i += 1) {
      //end-flag
      if (end(w) === '$') {
        obj.end = true;
        w = stripEnd(w);
      }
      //front-flag
      if (start(w) === '^') {
        obj.start = true;
        w = stripStart(w);
      }
      //capture group (this one can span multiple-terms)
      if (start(w) === '[' || end(w) === ']') {
        obj.group = null;
        if (start(w) === '[') {
          obj.groupStart = true;
        }
        if (end(w) === ']') {
          obj.groupEnd = true;
        }
        w = w.replace(/^\[/, '');
        w = w.replace(/\]$/, '');
        // Use capture group name
        if (start(w) === '<') {
          const res = captureName.exec(w);
          if (res.length >= 2) {
            obj.group = res[1];
            w = w.replace(res[0], '');
          }
        }
      }
      //back-flags
      if (end(w) === '+') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (w !== '*' && end(w) === '*' && w !== '\\*') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (end(w) === '?') {
        obj.optional = true;
        w = stripEnd(w);
      }
      if (start(w) === '!') {
        obj.negative = true;
        // obj.optional = true
        w = stripStart(w);
      }
      //soft-match
      if (start(w) === '~' && end(w) === '~' && w.length > 2) {
        w = stripBoth(w);
        obj.fuzzy = true;
        obj.min = opts.fuzzy || 0.85;
        if (/\(/.test(w) === false) {
          obj.word = w;
          return obj
        }
      }

      //wrapped-flags
      if (start(w) === '(' && end(w) === ')') {
        // support (one && two)
        if (andSign.test(w)) {
          obj.choices = w.split(andSign);
          obj.operator = 'and';
        } else {
          obj.choices = w.split('|');
          obj.operator = 'or';
        }
        //remove '(' and ')'
        obj.choices[0] = stripStart(obj.choices[0]);
        let last = obj.choices.length - 1;
        obj.choices[last] = stripEnd(obj.choices[last]);
        // clean up the results
        obj.choices = obj.choices.map(s => s.trim());
        obj.choices = obj.choices.filter(s => s);
        //recursion alert!
        obj.choices = obj.choices.map(str => {
          return str.split(/ /g).map(s => parseToken(s, opts))
        });
        w = '';
      }
      //regex
      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      //root/sense overloaded
      if (start(w) === '{' && end(w) === '}') {
        w = stripBoth(w);
        // obj.sense = w
        obj.root = w;
        if (/\//.test(w)) {
          let split = obj.root.split(/\//);
          obj.root = split[0];
          obj.pos = split[1];
          if (obj.pos === 'adj') {
            obj.pos = 'Adjective';
          }
          // titlecase
          obj.pos = obj.pos.charAt(0).toUpperCase() + obj.pos.substr(1).toLowerCase();
          // add sense-number too
          if (split[2] !== undefined) {
            obj.sense = split[2];
          }
        }
        return obj
      }
      //chunks
      if (start(w) === '<' && end(w) === '>') {
        w = stripBoth(w);
        obj.chunk = titleCase$1(w);
        obj.greedy = true;
        return obj
      }
      if (start(w) === '%' && end(w) === '%') {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
    }
    // support foo{1,9}
    if (hasMinMax.test(w) === true) {
      w = w.replace(hasMinMax, (_a, b, c) => {
        if (c === undefined) {
          // '{3}'	Exactly three times
          obj.min = Number(b);
          obj.max = Number(b);
        } else {
          c = c.replace(/, */, '');
          if (b === undefined) {
            // '{,9}' implied zero min
            obj.min = 0;
            obj.max = Number(c);
          } else {
            // '{2,4}' Two to four times
            obj.min = Number(b);
            // '{3,}' Three or more times
            obj.max = Number(c || 999);
          }
        }
        // use same method as '+'
        obj.greedy = true;
        // 0 as min means the same as '?'
        if (!obj.min) {
          obj.optional = true;
        }
        return ''
      });
    }
    //do the actual token content
    if (start(w) === '#') {
      obj.tag = stripStart(w);
      obj.tag = titleCase$1(obj.tag);
      return obj
    }
    //dynamic function on a term object
    if (start(w) === '@') {
      obj.method = stripStart(w);
      return obj
    }
    if (w === '.') {
      obj.anything = true;
      return obj
    }
    //support alone-astrix
    if (w === '*') {
      obj.anything = true;
      obj.greedy = true;
      obj.optional = true;
      return obj
    }
    if (w) {
      //somehow handle encoded-chars?
      w = w.replace('\\*', '*');
      w = w.replace('\\.', '.');
      if (opts.caseSensitive) {
        obj.use = 'text';
      } else {
        w = w.toLowerCase();
      }
      obj.word = w;
    }
    return obj
  };
  var parseToken$1 = parseToken;

  const hasDash$2 = /[a-z0-9][-??????][a-z]/i;

  // match 're-do' -> ['re','do']
  const splitHyphens$1 = function (regs, world) {
    let prefixes = world.model.one.prefixes;
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      let reg = regs[i];
      if (reg.word && hasDash$2.test(reg.word)) {
        let words = reg.word.split(/[-??????]/g);
        // don't split 're-cycle', etc
        if (prefixes.hasOwnProperty(words[0])) {
          continue
        }
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          let obj = Object.assign({}, reg);
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };
  var splitHyphens$2 = splitHyphens$1;

  // add all conjugations of this verb
  const addVerbs = function (token, world) {
    let { all } = world.methods.two.transform.verb || {};
    let str = token.root;
    // if (toInfinitive) {
    //   str = toInfinitive(str, world.model)
    // }
    if (!all) {
      return []
    }
    return all(str, world.model)
  };

  // add all inflections of this noun
  const addNoun = function (token, world) {
    let { all } = world.methods.two.transform.noun || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // add all inflections of this adjective
  const addAdjective = function (token, world) {
    let { all } = world.methods.two.transform.adjective || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // turn '{walk}' into 'walking', 'walked', etc
  const inflectRoot = function (regs, world) {
    // do we have compromise/two?
    regs = regs.map(token => {
      // a reg to convert '{foo}'
      if (token.root) {
        // check if compromise/two is loaded
        if (world.methods.two && world.methods.two.transform) {
          let choices = [];
          // have explicitly set from POS - '{sweet/adjective}'
          if (token.pos) {
            if (token.pos === 'Verb') {
              choices = choices.concat(addVerbs(token, world));
            } else if (token.pos === 'Noun') {
              choices = choices.concat(addNoun(token, world));
            } else if (token.pos === 'Adjective') {
              choices = choices.concat(addAdjective(token, world));
            }
          } else {
            // do verb/noun/adj by default
            choices = choices.concat(addVerbs(token, world));
            choices = choices.concat(addNoun(token, world));
            choices = choices.concat(addAdjective(token, world));
          }
          choices = choices.filter(str => str);
          if (choices.length > 0) {
            token.operator = 'or';
            token.fastOr = new Set(choices);
          }
        } else {
          // if no compromise/two, drop down into 'machine' lookup
          token.machine = token.root;
          delete token.id;
          delete token.root;
        }
      }
      return token
    });

    return regs
  };
  var inflectRoot$1 = inflectRoot;

  // name any [unnamed] capture-groups with a number
  const nameGroups = function (regs) {
    let index = 0;
    let inGroup = null;
    //'fill in' capture groups between start-end
    for (let i = 0; i < regs.length; i++) {
      const token = regs[i];
      if (token.groupStart === true) {
        inGroup = token.group;
        if (inGroup === null) {
          inGroup = String(index);
          index += 1;
        }
      }
      if (inGroup !== null) {
        token.group = inGroup;
      }
      if (token.groupEnd === true) {
        inGroup = null;
      }
    }
    return regs
  };

  // optimize an 'or' lookup, when the (a|b|c) list is simple or multi-word
  const doFastOrMode = function (tokens) {
    return tokens.map(token => {
      if (token.choices !== undefined) {
        // make sure it's an OR
        if (token.operator !== 'or') {
          return token
        }
        if (token.fuzzy === true) {
          return token
        }
        // are they all straight-up words? then optimize them.
        let shouldPack = token.choices.every(block => {
          if (block.length !== 1) {
            return false
          }
          let reg = block[0];
          // ~fuzzy~ words need more care
          if (reg.fuzzy === true) {
            return false
          }
          // ^ and $ get lost in fastOr
          if (reg.start || reg.end) {
            return false
          }
          if (reg.word !== undefined && reg.negative !== true && reg.optional !== true && reg.method !== true) {
            return true //reg is simple-enough
          }
          return false
        });
        if (shouldPack === true) {
          token.fastOr = new Set();
          token.choices.forEach(block => {
            token.fastOr.add(block[0].word);
          });
          delete token.choices;
        }
      }
      return token
    })
  };

  // support ~(a|b|c)~
  const fuzzyOr = function (regs) {
    return regs.map(reg => {
      if (reg.fuzzy && reg.choices) {
        // pass fuzzy-data to each OR choice
        reg.choices.forEach(r => {
          if (r.length === 1 && r[0].word) {
            r[0].fuzzy = true;
            r[0].min = reg.min;
          }
        });
      }
      return reg
    })
  };

  const postProcess = function (regs) {
    // ensure all capture groups names are filled between start and end
    regs = nameGroups(regs);
    // convert 'choices' format to 'fastOr' format
    regs = doFastOrMode(regs);
    // support ~(foo|bar)~
    regs = fuzzyOr(regs);
    return regs
  };
  var postProcess$1 = postProcess;

  /** parse a match-syntax string into json */
  const syntax = function (input, opts, world) {
    // fail-fast
    if (input === null || input === undefined || input === '') {
      return []
    }
    opts = opts || {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks$1(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken$1(str, opts));
    // '~re-do~'
    tokens = splitHyphens$2(tokens, world);
    // '{walk}'
    tokens = inflectRoot$1(tokens, world);
    //clean up anything weird
    tokens = postProcess$1(tokens);
    // console.log(tokens)
    return tokens
  };
  var parseMatch = syntax;

  const anyIntersection = function (setA, setB) {
    for (let elem of setB) {
      if (setA.has(elem)) {
        return true
      }
    }
    return false
  };
  // check words/tags against our cache
  const failFast = function (regs, cache) {
    for (let i = 0; i < regs.length; i += 1) {
      let reg = regs[i];
      if (reg.optional === true || reg.negative === true || reg.fuzzy === true) {
        continue
      }
      // is the word missing from the cache?
      if (reg.word !== undefined && cache.has(reg.word) === false) {
        return true
      }
      // is the tag missing?
      if (reg.tag !== undefined && cache.has('#' + reg.tag) === false) {
        return true
      }
      // perform a speedup for fast-or
      if (reg.fastOr && anyIntersection(reg.fastOr, cache) === false) {
        return false
      }
    }
    return false
  };
  var failFast$1 = failFast;

  // fuzzy-match (damerau-levenshtein)
  // Based on  tad-lispy /node-damerau-levenshtein
  // https://github.com/tad-lispy/node-damerau-levenshtein/blob/master/index.js
  // count steps (insertions, deletions, substitutions, or transpositions)
  const editDistance = function (strA, strB) {
    let aLength = strA.length,
      bLength = strB.length;
    // fail-fast
    if (aLength === 0) {
      return bLength
    }
    if (bLength === 0) {
      return aLength
    }
    // If the limit is not defined it will be calculate from this and that args.
    let limit = (bLength > aLength ? bLength : aLength) + 1;
    if (Math.abs(aLength - bLength) > (limit || 100)) {
      return limit || 100
    }
    // init the array
    let matrix = [];
    for (let i = 0; i < limit; i++) {
      matrix[i] = [i];
      matrix[i].length = limit;
    }
    for (let i = 0; i < limit; i++) {
      matrix[0][i] = i;
    }
    // Calculate matrix.
    let j, a_index, b_index, cost, min, t;
    for (let i = 1; i <= aLength; ++i) {
      a_index = strA[i - 1];
      for (j = 1; j <= bLength; ++j) {
        // Check the jagged distance total so far
        if (i === j && matrix[i][j] > 4) {
          return aLength
        }
        b_index = strB[j - 1];
        cost = a_index === b_index ? 0 : 1; // Step 5
        // Calculate the minimum (much faster than Math.min(...)).
        min = matrix[i - 1][j] + 1; // Deletion.
        if ((t = matrix[i][j - 1] + 1) < min) min = t; // Insertion.
        if ((t = matrix[i - 1][j - 1] + cost) < min) min = t; // Substitution.
        // Update matrix.
        let shouldUpdate =
          i > 1 && j > 1 && a_index === strB[j - 2] && strA[i - 2] === b_index && (t = matrix[i - 2][j - 2] + cost) < min;
        if (shouldUpdate) {
          matrix[i][j] = t;
        } else {
          matrix[i][j] = min;
        }
      }
    }
    // return number of steps
    return matrix[aLength][bLength]
  };
  // score similarity by from 0-1 (steps/length)
  const fuzzyMatch = function (strA, strB, minLength = 3) {
    if (strA === strB) {
      return 1
    }
    //don't even bother on tiny strings
    if (strA.length < minLength || strB.length < minLength) {
      return 0
    }
    const steps = editDistance(strA, strB);
    let length = Math.max(strA.length, strB.length);
    let relative = length === 0 ? 0 : steps / length;
    let similarity = 1 - relative;
    return similarity
  };
  var fuzzy = fuzzyMatch;

  // these methods are called with '@hasComma' in the match syntax
  // various unicode quotation-mark formats
  const startQuote =
    /([\u0022\uFF02\u0027\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F])/;

  const endQuote = /([\u0022\uFF02\u0027\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4])/;

  const hasHyphen$1 = /^[-??????]$/;
  const hasDash$1 = / [-??????]{1,3} /;

  /** search the term's 'post' punctuation  */
  const hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
  /** search the term's 'pre' punctuation  */
  const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1;

  const methods$c = {
    /** does it have a quotation symbol?  */
    hasQuote: term => startQuote.test(term.pre) || endQuote.test(term.post),
    /** does it have a comma?  */
    hasComma: term => hasPost(term, ','),
    /** does it end in a period? */
    hasPeriod: term => hasPost(term, '.') === true && hasPost(term, '...') === false,
    /** does it end in an exclamation */
    hasExclamation: term => hasPost(term, '!'),
    /** does it end with a question mark? */
    hasQuestionMark: term => hasPost(term, '?') || hasPost(term, '??'),
    /** is there a ... at the end? */
    hasEllipses: term => hasPost(term, '..') || hasPost(term, '???') || hasPre(term, '..') || hasPre(term, '???'),
    /** is there a semicolon after term word? */
    hasSemicolon: term => hasPost(term, ';'),
    /** is there a colon after term word? */
    hasColon: term => hasPost(term, ':'),
    /** is there a slash '/' in term word? */
    hasSlash: term => /\//.test(term.text),
    /** a hyphen connects two words like-term */
    hasHyphen: term => hasHyphen$1.test(term.post) || hasHyphen$1.test(term.pre),
    /** a dash separates words - like that */
    hasDash: term => hasDash$1.test(term.post) || hasDash$1.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    /** does it have any tags */
    isKnown: term => term.tags.size > 0,
    /** uppercase first letter, then a lowercase */
    isTitleCase: term => /^\p{Lu}[a-z'\u00C0-\u00FF]/u.test(term.text),
    /** uppercase all letters */
    isUpperCase: term => /^\p{Lu}+$/u.test(term.text),
  };
  // aliases
  methods$c.hasQuotation = methods$c.hasQuote;

  var termMethods = methods$c;

  //declare it up here
  let wrapMatch = function () { };
  /** ignore optional/greedy logic, straight-up term match*/
  const doesMatch$1 = function (term, reg, index, length) {
    // support '.'
    if (reg.anything === true) {
      return true
    }
    // support '^' (in parentheses)
    if (reg.start === true && index !== 0) {
      return false
    }
    // support '$' (in parentheses)
    if (reg.end === true && index !== length - 1) {
      return false
    }
    // match an id
    if (reg.id !== undefined && reg.id === term.id) {
      return true
    }
    //support a text match
    if (reg.word !== undefined) {
      // check case-sensitivity, etc
      if (reg.use) {
        return reg.word === term[reg.use]
      }
      //match contractions, machine-form
      if (term.machine !== null && term.machine === reg.word) {
        return true
      }
      // term aliases for slashes and things
      if (term.alias !== undefined && term.alias.hasOwnProperty(reg.word)) {
        return true
      }
      // support ~ fuzzy match
      if (reg.fuzzy === true) {
        if (reg.word === term.root) {
          return true
        }
        let score = fuzzy(reg.word, term.normal);
        if (score >= reg.min) {
          return true
        }
      }
      // match slashes and things
      if (term.alias && term.alias.some(str => str === reg.word)) {
        return true
      }
      //match either .normal or .text
      return reg.word === term.text || reg.word === term.normal
    }
    //support #Tag
    if (reg.tag !== undefined) {
      return term.tags.has(reg.tag) === true
    }
    //support @method
    if (reg.method !== undefined) {
      if (typeof termMethods[reg.method] === 'function' && termMethods[reg.method](term) === true) {
        return true
      }
      return false
    }
    //support whitespace/punctuation
    if (reg.pre !== undefined) {
      return term.pre && term.pre.includes(reg.pre)
    }
    if (reg.post !== undefined) {
      return term.post && term.post.includes(reg.post)
    }
    //support /reg/
    if (reg.regex !== undefined) {
      let str = term.normal;
      if (reg.use) {
        str = term[reg.use];
      }
      return reg.regex.test(str)
    }
    //support <chunk>
    if (reg.chunk !== undefined) {
      return term.chunk === reg.chunk
    }
    //support %Noun|Verb%
    if (reg.switch !== undefined) {
      return term.switch === reg.switch
    }
    //support {machine}
    if (reg.machine !== undefined) {
      return term.normal === reg.machine || term.machine === reg.machine || term.root === reg.machine
    }
    //support {word/sense}
    if (reg.sense !== undefined) {
      return term.sense === reg.sense
    }
    // support optimized (one|two)
    if (reg.fastOr !== undefined) {
      // {work/verb} must be a verb
      if (reg.pos && !term.tags.has(reg.pos)) {
        return null
      }
      let str = term.root || term.implicit || term.machine || term.normal;
      return reg.fastOr.has(str) || reg.fastOr.has(term.text)
    }
    //support slower (one|two)
    if (reg.choices !== undefined) {
      // try to support && operator
      if (reg.operator === 'and') {
        // must match them all
        return reg.choices.every(r => wrapMatch(term, r, index, length))
      }
      // or must match one
      return reg.choices.some(r => wrapMatch(term, r, index, length))
    }
    return false
  };
  // wrap result for !negative match logic
  wrapMatch = function (t, reg, index, length) {
    let result = doesMatch$1(t, reg, index, length);
    if (reg.negative === true) {
      return !result
    }
    return result
  };
  var matchTerm = wrapMatch;

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    let reg = Object.assign({}, state.regs[state.r], { start: false, end: false });
    let start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      //stop for next-reg match
      if (endReg && matchTerm(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
        return state.t
      }
      let count = state.t - start + 1;
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (matchTerm(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length) === false) {
        // is it too short?
        if (reg.min !== undefined && count < reg.min) {
          return null
        }
        return state.t
      }
    }
    return state.t
  };

  const greedyTo = function (state, nextReg) {
    let t = state.t;
    //if there's no next one, just go off the end!
    if (!nextReg) {
      return state.terms.length
    }
    //otherwise, we're looking for the next one
    for (; t < state.terms.length; t += 1) {
      if (matchTerm(state.terms[t], nextReg, state.start_i + t, state.phrase_length) === true) {
        // console.log(`greedyTo ${state.terms[t].normal}`)
        return t
      }
    }
    //guess it doesn't exist, then.
    return null
  };

  const isEndGreedy = function (reg, state) {
    if (reg.end === true && reg.greedy === true) {
      if (state.start_i + state.t < state.phrase_length - 1) {
        let tmpReg = Object.assign({}, reg, { end: false });
        if (matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  const getGroup$2 = function (state, term_index) {
    if (state.groups[state.inGroup]) {
      return state.groups[state.inGroup]
    }
    state.groups[state.inGroup] = {
      start: term_index,
      length: 0,
    };
    return state.groups[state.inGroup]
  };

  //support 'unspecific greedy' .* properly
  // its logic is 'greedy until', where it's looking for the next token
  // '.+ foo' means we check for 'foo', indefinetly
  const doAstrix = function (state) {
    let { regs } = state;
    let reg = regs[state.r];

    let skipto = greedyTo(state, regs[state.r + 1]);
    //maybe we couldn't find it
    if (skipto === null || skipto === 0) {
      return null
    }
    // ensure it's long enough
    if (reg.min !== undefined && skipto - state.t < reg.min) {
      return null
    }
    // reduce it back, if it's too long
    if (reg.max !== undefined && skipto - state.t > reg.max) {
      state.t = state.t + reg.max;
      return true
    }
    // set the group result
    if (state.hasGroup === true) {
      const g = getGroup$2(state, state.t);
      g.length = skipto - state.t;
    }
    state.t = skipto;
    // log(`??? |greedy|`)
    return true
  };
  var doAstrix$1 = doAstrix;

  const isArray$4 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const doOrBlock$1 = function (state, skipN = 0) {
    let block = state.regs[state.r];
    let wasFound = false;
    // do each multiword sequence
    for (let c = 0; c < block.choices.length; c += 1) {
      // try to match this list of tokens
      let regs = block.choices[c];
      if (!isArray$4(regs)) {
        return false
      }
      wasFound = regs.every((cr, w_index) => {
        let extra = 0;
        let t = state.t + w_index + skipN + extra;
        if (state.terms[t] === undefined) {
          return false
        }
        let foundBlock = matchTerm(state.terms[t], cr, t + state.start_i, state.phrase_length);
        // this can be greedy - '(foo+ bar)'
        if (foundBlock === true && cr.greedy === true) {
          for (let i = 1; i < state.terms.length; i += 1) {
            let term = state.terms[t + i];
            if (term) {
              let keepGoing = matchTerm(term, cr, state.start_i + i, state.phrase_length);
              if (keepGoing === true) {
                extra += 1;
              } else {
                break
              }
            }
          }
        }
        skipN += extra;
        return foundBlock
      });
      if (wasFound) {
        skipN += regs.length;
        break
      }
    }
    // we found a match -  is it greedy though?
    if (wasFound && block.greedy === true) {
      return doOrBlock$1(state, skipN) // try it again!
    }
    return skipN
  };

  const doAndBlock$1 = function (state) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    let reg = state.regs[state.r];
    let allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      let allWords = block.every((cr, w_index) => {
        let tryTerm = state.t + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return matchTerm(state.terms[tryTerm], cr, tryTerm, state.phrase_length)
      });
      if (allWords === true && block.length > longest) {
        longest = block.length;
      }
      return allWords
    });
    if (allDidMatch === true) {
      // console.log(`doAndBlock ${state.terms[state.t].normal}`)
      return longest
    }
    return false
  };

  const orBlock = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let skipNum = doOrBlock$1(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      // tuck in as named-group
      if (state.hasGroup === true) {
        const g = getGroup$2(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        let end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`??? |found-or|`)
      return true
    } else if (!reg.optional) {
      return null //die
    }
    return true
  };
  var doOrBlock = orBlock;

  // '(foo && #Noun)' - require all matches on the term
  const andBlock = function (state) {
    const { regs } = state;
    let reg = regs[state.r];

    let skipNum = doAndBlock$1(state);
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      if (state.hasGroup === true) {
        const g = getGroup$2(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        let end = state.phrase_length - 1;
        if (state.t + state.start_i !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`??? |found-and|`)
      return true
    } else if (!reg.optional) {
      return null //die
    }
    return true
  };
  var doAndBlock = andBlock;

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = matchTerm(state.terms[t], reg, state.start_i + state.t, state.phrase_length);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = matchTerm(state.terms[t], nextReg, state.start_i + state.t, state.phrase_length);
        if (found) {
          break
        }
      }
      skip += 1;
      // is it max-length now?
      if (reg.max !== undefined && skip === reg.max) {
        break
      }
    }
    if (skip === 0) {
      return false //dead
    }
    // did we satisfy min for !foo{min,max}
    if (reg.min && reg.min > skip) {
      return false//dead
    }
    state.t += skip;
    // state.r += 1
    return true
  };

  var negGreedy$1 = negGreedy;

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    let reg = regs[state.r];

    // match *anything* but this term
    let tmpReg = Object.assign({}, reg);
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    let found = matchTerm(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
    if (found) {
      return false//bye
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      let nextReg = regs[state.r + 1];
      if (nextReg) {
        let fNext = matchTerm(state.terms[state.t], nextReg, state.start_i + state.t, state.phrase_length);
        if (fNext) {
          state.r += 1;
        } else if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          let fNext2 = matchTerm(state.terms[state.t], regs[state.r + 2], state.start_i + state.t, state.phrase_length);
          if (fNext2) {
            state.r += 2;
          }
        }
      }
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      return negGreedy$1(state, tmpReg, regs[state.r + 1])
    }
    state.t += 1;
    return true
  };
  var doNegative$1 = doNegative;

  // 'foo? foo' matches are tricky.
  const foundOptional = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let term = state.terms[state.t];
    // does the next reg match it too?
    let nextRegMatched = matchTerm(term, regs[state.r + 1], state.start_i + state.t, state.phrase_length);
    if (reg.negative || nextRegMatched) {
      // but does the next reg match the next term??
      // only skip if it doesn't
      let nextTerm = state.terms[state.t + 1];
      if (!nextTerm || !matchTerm(nextTerm, regs[state.r + 1], state.start_i + state.t, state.phrase_length)) {
        state.r += 1;
      }
    }
  };

  var foundOptional$1 = foundOptional;

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    let reg = regs[state.r];
    state.t = getGreedy(state, regs[state.r + 1]);
    if (state.t === null) {
      return null //greedy was too short
    }
    // foo{2,4} - has a greed-minimum
    if (reg.min && reg.min > state.t) {
      return null //greedy was too short
    }
    // 'foo+$' - if also an end-anchor, ensure we really reached the end
    if (reg.end === true && state.start_i + state.t !== phrase_length) {
      return null //greedy didn't reach the end
    }
    return true
  };
  var greedyMatch$1 = greedyMatch;

  // for: ['we', 'have']
  // a match for "we have" should work as normal
  // but matching "we've" should skip over implict terms
  const contractionSkip = function (state) {
    let term = state.terms[state.t];
    let reg = state.regs[state.r];
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      let nextTerm = state.terms[state.t + 1];
      // ensure next word is implicit
      if (!nextTerm.implicit) {
        return
      }
      // we matched "we've" - skip-over [we, have]
      if (reg.word === term.normal) {
        state.t += 1;
      }
      // also skip for @hasContraction
      if (reg.method === 'hasContraction') {
        state.t += 1;
      }
    }
  };
  var contractionSkip$1 = contractionSkip;

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    let reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$2(state, startAt);
    // Update group - add greedy or increment length
    if (state.t > 1 && reg.greedy) {
      g.length += state.t - startAt;
    } else {
      g.length++;
    }
  };

  // when a reg matches a term
  const simpleMatch = function (state) {
    const { regs } = state;
    let reg = regs[state.r];
    let term = state.terms[state.t];
    let startAt = state.t;
    // if it's a negative optional match... :0
    if (reg.optional && regs[state.r + 1] && reg.negative) {
      return true
    }
    // okay, it was a match, but if it's optional too,
    // we should check the next reg too, to skip it?
    if (reg.optional && regs[state.r + 1]) {
      foundOptional$1(state);
    }
    // Contraction skip:
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      contractionSkip$1(state);
    }
    //advance to the next term!
    state.t += 1;
    //check any ending '$' flags
    //if this isn't the last term, refuse the match
    if (reg.end === true && state.t !== state.terms.length && reg.greedy !== true) {
      return null //die
    }
    // keep 'foo+' going...
    if (reg.greedy === true) {
      let alive = greedyMatch$1(state);
      if (!alive) {
        return null
      }
    }
    // log '[foo]' as a group
    if (state.hasGroup === true) {
      setGroup(state, startAt);
    }
    return true
  };
  var simpleMatch$1 = simpleMatch;

  // i formally apologize for how complicated this is.

  /** 
   * try a sequence of match tokens ('regs') 
   * on a sequence of terms, 
   * starting at this certain term.
   */
  const tryHere = function (terms, regs, start_i, phrase_length) {
    // console.log(`\n\n:start: '${terms[0].text}':`)
    if (terms.length === 0 || regs.length === 0) {
      return null
    }
    // all the variables that matter
    let state = {
      t: 0,
      terms: terms,
      r: 0,
      regs: regs,
      groups: {},
      start_i: start_i,
      phrase_length: phrase_length,
      inGroup: null,
    };

    // we must satisfy every token in 'regs'
    // if we get to the end, we have a match.
    for (; state.r < regs.length; state.r += 1) {
      let reg = regs[state.r];
      // Check if this reg has a named capture group
      state.hasGroup = Boolean(reg.group);
      // Reuse previous capture group if same
      if (state.hasGroup === true) {
        state.inGroup = reg.group;
      } else {
        state.inGroup = null;
      }
      //have we run-out of terms?
      if (!state.terms[state.t]) {
        //are all remaining regs optional or negative?
        const alive = regs.slice(state.r).some(remain => !remain.optional);
        if (alive === false) {
          break //done!
        }
        return null // die
      }
      // support 'unspecific greedy' .* properly
      if (reg.anything === true && reg.greedy === true) {
        let alive = doAstrix$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-OR - multi-word OR (a|b|foo bar)
      if (reg.choices !== undefined && reg.operator === 'or') {
        let alive = doOrBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-AND - multi-word AND (#Noun && foo) blocks
      if (reg.choices !== undefined && reg.operator === 'and') {
        let alive = doAndBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support '.' as any-single
      if (reg.anything === true) {
        // '!.' negative anything should insta-fail
        if (reg.negative && reg.anything) {
          return null
        }
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support 'foo*$' until the end
      if (isEndGreedy(reg, state) === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, it doesn't match - but maybe it wasn't *supposed* to?
      if (reg.negative) {
        // we want *anything* but this term
        let alive = doNegative$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, finally test the term-reg
      // console.log('   - ' + state.terms[state.t].text)
      let hasMatch = matchTerm(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
      if (hasMatch === true) {
        let alive = simpleMatch$1(state);
        if (!alive) {
          return null
        }
        continue
      }
      // console.log('=-=-=-= here -=-=-=-')

      //ok who cares, keep going
      if (reg.optional === true) {
        continue
      }

      // finally, we die
      return null
    }
    //return our results, as pointers
    let pntr = [null, start_i, state.t + start_i];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    let groups = {};
    Object.keys(state.groups).forEach(k => {
      let o = state.groups[k];
      let start = start_i + o.start;
      groups[k] = [null, start, start + o.length];
    });
    return { pointer: pntr, groups: groups }
  };
  var fromHere = tryHere;

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
  const getGroup = function (res, group) {
    let ptrs = [];
    let byGroup = {};
    if (res.length === 0) {
      return { ptrs, byGroup }
    }
    if (typeof group === 'number') {
      group = String(group);
    }
    if (group) {
      res.forEach(r => {
        if (r.groups[group]) {
          ptrs.push(r.groups[group]);
        }
      });
    } else {
      res.forEach(r => {
        ptrs.push(r.pointer);
        Object.keys(r.groups).forEach(k => {
          byGroup[k] = byGroup[k] || [];
          byGroup[k].push(r.groups[k]);
        });
      });
    }
    return { ptrs, byGroup }
  };
  var getGroup$1 = getGroup;

  const notIf = function (results, not, docs) {
    results = results.filter(res => {
      let [n, start, end] = res.pointer;
      let terms = docs[n].slice(start, end);
      for (let i = 0; i < terms.length; i += 1) {
        let slice = terms.slice(i);
        let found = fromHere(slice, not, i, terms.length);
        if (found !== null) {
          return false
        }
      }
      return true
    });
    return results
  };

  var notIf$1 = notIf;

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n) {
    let res = fromHere(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$2 = function (docs, todo, cache) {
    cache = cache || [];
    let { regs, group, justOne } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }

    const minLength = regs.filter(r => r.optional !== true && r.negative !== true).length;
    docs: for (let n = 0; n < docs.length; n += 1) {
      let terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast$1(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        let foundStart = handleStart(terms, regs, n);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        let slice = terms.slice(i);
        // ensure it's long-enough
        if (slice.length < minLength) {
          break
        }
        let res = fromHere(slice, regs, i, terms.length);
        // did we find a result?
        if (res) {
          // res = addSentence(res, index[0])
          res = addSentence(res, n);
          results.push(res);
          // should we stop here?
          if (justOne === true) {
            break docs
          }
          // skip ahead, over these results
          let end = res.pointer[2];
          if (Math.abs(end - 1) > i) {
            i = Math.abs(end - 1);
          }
        }
      }
    }
    // ensure any end-results ($) match until the last term
    if (regs[regs.length - 1].end === true) {
      results = results.filter(res => {
        let n = res.pointer[0];
        return docs[n].length === res.pointer[2]
      });
    }
    if (todo.notIf) {
      results = notIf$1(results, todo.notIf, docs);
    }
    // grab the requested group
    results = getGroup$1(results, group);
    // add ids to pointers
    results.ptrs.forEach(ptr => {
      let [n, start, end] = ptr;
      ptr[3] = docs[n][start].id;//start-id
      ptr[4] = docs[n][end - 1].id;//end-id
    });
    return results
  };

  var match$1 = runMatch$2;

  const methods$a = {
    one: {
      termMethods,
      parseMatch,
      match: match$1,
    },
  };

  var methods$b = methods$a;

  var lib$3 = {
    /** pre-parse any match statements */
    parseMatch: function (str, opts) {
      const world = this.world();
      let killUnicode = world.methods.one.killUnicode;
      if (killUnicode) {
        str = killUnicode(str, world);
      }
      return world.methods.one.parseMatch(str, opts, world)
    }
  };

  var match = {
    api: api$d,
    methods: methods$b,
    lib: lib$3,
  };

  const isClass = /^\../;
  const isId = /^#./;

  const escapeXml = (str) => {
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&apos;');
    return str
  };

  // interpret .class, #id, tagName
  const toTag = function (k) {
    let start = '';
    let end = '</span>';
    k = escapeXml(k);
    if (isClass.test(k)) {
      start = `<span class="${k.replace(/^\./, '')}"`;
    } else if (isId.test(k)) {
      start = `<span id="${k.replace(/^#/, '')}"`;
    } else {
      start = `<${k}`;
      end = `</${k}>`;
    }
    start += '>';
    return { start, end }
  };

  const getIndex = function (doc, obj) {
    let starts = {};
    let ends = {};
    Object.keys(obj).forEach(k => {
      let res = obj[k];
      let tag = toTag(k);
      if (typeof res === 'string') {
        res = doc.match(res);
      }
      res.docs.forEach(terms => {
        // don't highlight implicit terms
        if (terms.every(t => t.implicit)) {
          return
        }
        let a = terms[0].id;
        starts[a] = starts[a] || [];
        starts[a].push(tag.start);
        let b = terms[terms.length - 1].id;
        ends[b] = ends[b] || [];
        ends[b].push(tag.end);
      });
    });
    return { starts, ends }
  };

  const html = function (obj) {
    // index ids to highlight
    let { starts, ends } = getIndex(this, obj);
    // create the text output
    let out = '';
    this.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        let t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          out += starts[t.id].join('');
        }
        out += t.pre || '' + t.text || '';
        if (ends.hasOwnProperty(t.id)) {
          out += ends[t.id].join('');
        }
        out += t.post || '';
      }
    });
    return out
  };
  var html$1 = { html };

  const trimEnd = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4???-]+$/;
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\u201D\]]/;
  const isHyphen = /^[-??????]$/;
  const hasSpace = / /;

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach((t) => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
        pre = pre.replace(trimStart, '');
        // replace a hyphen with a space
        if (isHyphen.test(post)) {
          post = ' ';
        }
        post = post.replace(punctToKill, '');
        // cleanup exclamations
        post = post.replace(/\?!+/, '?');
        post = post.replace(/!+/, '!');
        post = post.replace(/\?+/, '?');
        // kill elipses
        post = post.replace(/\.{2,}/, '');
        // kill abbreviation periods
        if (t.tags.has('Abbreviation')) {
          post = post.replace(/\./, '');
        }
      }
      if (opts.whitespace === 'some') {
        pre = pre.replace(/\s/, ''); //remove pre-whitespace
        post = post.replace(/\s+/, ' '); //replace post-whitespace with a space
      }
      if (!opts.keepPunct) {
        pre = pre.replace(trimStart, '');
        if (post === '-') {
          post = ' ';
        } else {
          post = post.replace(trimEnd, '');
        }
      }
      // grab the correct word format
      let word = t[opts.form || 'text'] || t.normal || '';
      if (opts.form === 'implicit') {
        word = t.implicit || t.text;
      }
      if (opts.form === 'root' && t.implicit) {
        word = t.root || t.implicit || t.normal;
      }
      // add an implicit space, for contractions
      if ((opts.form === 'machine' || opts.form === 'implicit' || opts.form === 'root') && t.implicit) {
        if (!post || !hasSpace.test(post)) {
          post += ' ';
        }
      }
      txt += pre + word + post;
    });
    if (keepSpace === false) {
      txt = txt.trim();
    }
    if (opts.lowerCase === true) {
      txt = txt.toLowerCase();
    }
    return txt
  };

  const textFromDoc = function (docs, opts) {
    let text = '';
    if (!docs || !docs[0] || !docs[0][0]) {
      return text
    }
    for (let i = 0; i < docs.length; i += 1) {
      // middle
      text += textFromTerms(docs[i], opts, true);
    }
    if (!opts.keepSpace) {
      text = text.trim();
    }
    if (opts.keepPunct === false) {
      // don't remove ':)' etc
      if (!docs[0][0].tags.has('Emoticon')) {
        text = text.replace(trimStart, '');
      }
      let last = docs[docs.length - 1];
      if (!last[last.length - 1].tags.has('Emoticon')) {
        text = text.replace(trimEnd, '');
      }
    }
    if (opts.cleanWhitespace === true) {
      text = text.trim();
    }
    return text
  };

  const fmts = {
    text: {
      form: 'text',
    },
    normal: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'normal',
    },
    machine: {
      keepSpace: false,
      whitespace: 'some',
      punctuation: 'some',
      case: 'none',
      unicode: 'some',
      form: 'machine',
    },
    root: {
      keepSpace: false,
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'root',
    },
    implicit: {
      form: 'implicit',
    }
  };
  fmts.clean = fmts.normal;
  fmts.reduced = fmts.root;
  var fmts$1 = fmts;

  /* eslint-disable no-bitwise */
  /* eslint-disable no-mixed-operators */
  /* eslint-disable no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  let k = [], i$1 = 0;
  for (; i$1 < 64;) {
    k[i$1] = 0 | Math.sin(++i$1 % Math.PI) * 4294967296;
  }

  function md5(s) {
    let b, c, d,
      h = [b = 0x67452301, c = 0xEFCDAB89, ~b, ~c],
      words = [],
      j = decodeURI(encodeURI(s)) + '\x80',
      a = j.length;

    s = (--a / 4 + 2) | 15;

    words[--s] = a * 8;

    for (; ~a;) {
      words[a >> 2] |= j.charCodeAt(a) << 8 * a--;
    }

    for (i$1 = j = 0; i$1 < s; i$1 += 16) {
      a = h;

      for (; j < 64;
        a = [
          d = a[3],
          (
            b +
            ((d =
              a[0] +
              [
                b & c | ~b & d,
                d & b | ~d & c,
                b ^ c ^ d,
                c ^ (b | ~d)
              ][a = j >> 4] +
              k[j] +
              ~~words[i$1 | [
                j,
                5 * j + 1,
                3 * j + 5,
                7 * j
              ][a] & 15]
            ) << (a = [
              7, 12, 17, 22,
              5, 9, 14, 20,
              4, 11, 16, 23,
              6, 10, 15, 21
            ][4 * a + j++ % 4]) | d >>> -a)
          ),
          b,
          c
        ]
      ) {
        b = a[1] | 0;
        c = a[2];
      }
      for (j = 4; j;) h[--j] += a[j];
    }

    for (s = ''; j < 32;) {
      s += ((h[j >> 3] >> ((1 ^ j++) * 4)) & 15).toString(16);
    }

    return s;
  }

  // console.log(md5('food-safety'))

  const defaults$1 = {
    text: true,
    terms: true,
  };

  let opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return Object.assign({}, a, b)
  };

  const fns$1 = {
    text: (terms) => textFromTerms(terms, { keepPunct: true }, false),
    normal: (terms) => textFromTerms(terms, merge(fmts$1.normal, { keepPunct: true }), false),
    implicit: (terms) => textFromTerms(terms, merge(fmts$1.implicit, { keepPunct: true }), false),

    machine: (terms) => textFromTerms(terms, opts, false),
    root: (terms) => textFromTerms(terms, merge(opts, { form: 'root' }), false),

    hash: (terms) => md5(textFromTerms(terms, { keepPunct: true }, false)),

    offset: (terms) => {
      let len = fns$1.text(terms).length;
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start,
        length: len,
      }
    },
    terms: (terms) => {
      return terms.map(t => {
        let term = Object.assign({}, t);
        term.tags = Array.from(t.tags);
        return term
      })
    },
    confidence: (_terms, view, i) => view.eq(i).confidence(),
    syllables: (_terms, view, i) => view.eq(i).syllables(),
    sentence: (_terms, view, i) => view.eq(i).fullSentence().text(),
    dirty: (terms) => terms.some(t => t.dirty === true)
  };
  fns$1.sentences = fns$1.sentence;
  fns$1.clean = fns$1.normal;
  fns$1.reduced = fns$1.root;

  const toJSON = function (view, option) {
    option = option || {};
    if (typeof option === 'string') {
      option = {};
    }
    option = Object.assign({}, defaults$1, option);
    // run any necessary upfront steps
    if (option.offset) {
      view.compute('offset');
    }
    return view.docs.map((terms, i) => {
      let res = {};
      Object.keys(option).forEach(k => {
        if (option[k] && fns$1[k]) {
          res[k] = fns$1[k](terms, view, i);
        }
      });
      return res
    })
  };


  const methods$9 = {
    /** return data */
    json: function (n) {
      let res = toJSON(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };
  methods$9.data = methods$9.json;
  var json = methods$9;

  /* eslint-disable no-console */
  const logClientSide = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      let terms = m.docs[0];
      let out = terms.map(t => {
        let text = t.text || '-';
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        let tags = '[' + Array.from(t.tags).join(', ') + ']';
        return { text, tags }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };
  var logClientSide$1 = logClientSide;

  // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
  const reset = '\x1b[0m';

  //cheaper than requiring chalk
  const cli = {
    green: str => '\x1b[32m' + str + reset,
    red: str => '\x1b[31m' + str + reset,
    blue: str => '\x1b[34m' + str + reset,
    magenta: str => '\x1b[35m' + str + reset,
    cyan: str => '\x1b[36m' + str + reset,
    yellow: str => '\x1b[33m' + str + reset,
    black: str => '\x1b[30m' + str + reset,
    dim: str => '\x1b[2m' + str + reset,
    i: str => '\x1b[3m' + str + reset,
  };
  var cli$1 = cli;

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!model.one.tagSet.hasOwnProperty(tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli$1[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
    let { docs, model } = view;
    if (docs.length === 0) {
      console.log(cli$1.blue('\n     ??????????????????'));
    }
    docs.forEach(terms => {
      console.log(cli$1.blue('\n  ??????????????????????????????'));
      terms.forEach(t => {
        let tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = cli$1.yellow(text);
        let word = "'" + text + "'";
        if (t.reference) {
          let str = view.update([t.reference]).text('normal');
          word += ` - ${cli$1.dim(cli$1.i('[' + str + ']'))}`;
        }
        word = word.padEnd(18);
        let str = cli$1.blue('  ??? ') + cli$1.i(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
  };
  var showTags$1 = showTags;

  /* eslint-disable no-console */

  const showChunks = function (view) {
    let { docs } = view;
    console.log('');
    docs.forEach(terms => {
      let out = [];
      terms.forEach(term => {
        if (term.chunk === 'Noun') {
          out.push(cli$1.blue(term.implicit || term.normal));
        } else if (term.chunk === 'Verb') {
          out.push(cli$1.green(term.implicit || term.normal));
        } else if (term.chunk === 'Adjective') {
          out.push(cli$1.yellow(term.implicit || term.normal));
        } else if (term.chunk === 'Pivot') {
          out.push(cli$1.red(term.implicit || term.normal));
        } else {
          out.push(term.implicit || term.normal);
        }
      });
      console.log(out.join(' '), '\n');
    });
  };
  var showChunks$1 = showChunks;

  const split = (txt, offset, index) => {
    let buff = index * 9; //there are 9 new chars addded to each highlight
    let start = offset.start + buff;
    let end = start + offset.length;
    let pre = txt.substring(0, start);
    let mid = txt.substring(start, end);
    let post = txt.substring(end, txt.length);
    return [pre, mid, post]
  };

  const spliceIn = function (txt, offset, index) {
    let parts = split(txt, offset, index);
    return `${parts[0]}${cli$1.blue(parts[1])}${parts[2]}`
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    let bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] = bySentence[ptr[0]] || [];
      bySentence[ptr[0]].push(ptr);
    });
    Object.keys(bySentence).forEach(k => {
      let full = doc.update([[Number(k)]]);
      let txt = full.text();
      let matches = doc.update(bySentence[k]);
      let json = matches.json({ offset: true });
      json.forEach((obj, i) => {
        txt = spliceIn(txt, obj.offset, i);
      });
      console.log(txt); // eslint-disable-line
    });
  };
  var showHighlight$1 = showHighlight;

  /* eslint-disable no-console */

  function isClientSide() {
    return typeof window !== 'undefined' && window.document
  }
  //output some helpful stuff to the console
  const debug = function (opts = {}) {
    let view = this;
    if (typeof opts === 'string') {
      let tmp = {};
      tmp[opts] = true; //allow string input
      opts = tmp;
    }
    if (isClientSide()) {
      logClientSide$1(view);
      return view
    }
    if (opts.tags !== false) {
      showTags$1(view);
      console.log('\n');
    }
    // output chunk-view, too
    if (opts.chunks === true) {
      showChunks$1(view);
      console.log('\n');
    }
    // highlight match in sentence
    if (opts.highlight === true) {
      showHighlight$1(view);
      console.log('\n');
    }
    return view
  };
  var debug$1 = debug;

  const toText$2 = function (term) {
    let pre = term.pre || '';
    let post = term.post || '';
    return pre + term.text + post
  };

  const findStarts = function (doc, obj) {
    let starts = {};
    Object.keys(obj).forEach(reg => {
      let m = doc.match(reg);
      m.fullPointer.forEach(a => {
        starts[a[3]] = { fn: obj[reg], end: a[2] };
      });
    });
    return starts
  };

  const wrap = function (doc, obj) {
    // index ids to highlight
    let starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        let t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          let { fn, end } = starts[t.id];
          let m = doc.update([[n, i, end]]);
          text += terms[i].pre || '';
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText$2(t);
        }
      }
    });
    return text
  };
  var wrap$1 = wrap;

  const isObject$2 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // sort by frequency
  const topk = function (arr) {
    let obj = {};
    arr.forEach(a => {
      obj[a] = obj[a] || 0;
      obj[a] += 1;
    });
    let res = Object.keys(obj).map(k => {
      return { normal: k, count: obj[k] }
    });
    return res.sort((a, b) => (a.count > b.count ? -1 : 0))
  };

  /** some named output formats */
  const out = function (method) {
    // support custom outputs
    if (isObject$2(method)) {
      return wrap$1(this, method)
    }
    // text out formats
    if (method === 'text') {
      return this.text()
    }
    if (method === 'normal') {
      return this.text('normal')
    }
    if (method === 'root') {
      return this.text('root')
    }
    if (method === 'machine' || method === 'reduced') {
      return this.text('machine')
    }
    if (method === 'hash' || method === 'md5') {
      return md5(this.text())
    }

    // json data formats
    if (method === 'json') {
      return this.json()
    }
    if (method === 'offset' || method === 'offsets') {
      this.compute('offset');
      return this.json({ offset: true })
    }
    if (method === 'array') {
      let arr = this.docs.map(terms => {
        return terms
          .reduce((str, t) => {
            return str + t.pre + t.text + t.post
          }, '')
          .trim()
      });
      return arr.filter(str => str)
    }
    // return terms sorted by frequency
    if (method === 'freq' || method === 'frequency' || method === 'topk') {
      return topk(this.json({ normal: true }).map(o => o.normal))
    }

    // some handy ad-hoc outputs
    if (method === 'terms') {
      let list = [];
      this.docs.forEach(s => {
        let terms = s.terms.map(t => t.text);
        terms = terms.filter(t => t);
        list = list.concat(terms);
      });
      return list
    }
    if (method === 'tags') {
      return this.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    }
    if (method === 'debug') {
      return this.debug() //allow
    }
    return this.text()
  };

  const methods$8 = {
    /** */
    debug: debug$1,
    /** */
    out,
    /** */
    wrap: function (obj) {
      return wrap$1(this, obj)
    },
  };

  var out$1 = methods$8;

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && fmts$1.hasOwnProperty(fmt)) {
        opts = Object.assign({}, fmts$1[fmt]);
      } else if (fmt && isObject$1(fmt)) {
        opts = Object.assign({}, fmt);//todo: fixme
      }
      if (opts.keepSpace === undefined && this.pointer) {
        opts.keepSpace = false;
      }
      if (opts.keepPunct === undefined && this.pointer) {
        let ptr = this.pointer[0];
        if (ptr && ptr[1]) {
          opts.keepPunct = false;
        } else {
          opts.keepPunct = true;
        }
      }
      // set defaults
      if (opts.keepPunct === undefined) {
        opts.keepPunct = true;
      }
      if (opts.keepSpace === undefined) {
        opts.keepSpace = true;
      }
      return textFromDoc(this.docs, opts)
    },
  };

  const methods$7 = Object.assign({}, out$1, text, json, html$1);

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$7);
  };
  var api$c = addAPI$1;

  var output = {
    api: api$c,
    methods: {
      one: {
        hash: md5
      }
    }
  };

  // do the pointers intersect?
  const doesOverlap = function (a, b) {
    if (a[0] !== b[0]) {
      return false
    }
    let [, startA, endA] = a;
    let [, startB, endB] = b;
    // [a,a,a,-,-,-,]
    // [-,-,b,b,b,-,]
    if (startA <= startB && endA > startB) {
      return true
    }
    // [-,-,-,a,a,-,]
    // [-,-,b,b,b,-,]
    if (startB <= startA && endB > startA) {
      return true
    }
    return false
  };

  // get widest min/max
  const getExtent = function (ptrs) {
    let min = ptrs[0][1];
    let max = ptrs[0][2];
    ptrs.forEach(ptr => {
      if (ptr[1] < min) {
        min = ptr[1];
      }
      if (ptr[2] > max) {
        max = ptr[2];
      }
    });
    return [ptrs[0][0], min, max]
  };

  // collect pointers by sentence number
  const indexN = function (ptrs) {
    let byN = {};
    ptrs.forEach(ref => {
      byN[ref[0]] = byN[ref[0]] || [];
      byN[ref[0]].push(ref);
    });
    return byN
  };

  // remove exact duplicates
  const uniquePtrs = function (arr) {
    let obj = {};
    for (let i = 0; i < arr.length; i += 1) {
      obj[arr[i].join(',')] = arr[i];
    }
    return Object.values(obj)
  };

  // a before b
  // console.log(doesOverlap([0, 0, 4], [0, 2, 5]))
  // // b before a
  // console.log(doesOverlap([0, 3, 4], [0, 1, 5]))
  // // disjoint
  // console.log(doesOverlap([0, 0, 3], [0, 4, 5]))
  // neighbours
  // console.log(doesOverlap([0, 1, 3], [0, 3, 5]))
  // console.log(doesOverlap([0, 3, 5], [0, 1, 3]))

  // console.log(
  //   getExtent([
  //     [0, 3, 4],
  //     [0, 4, 5],
  //     [0, 1, 2],
  //   ])
  // )

  // split a pointer, by match pointer
  const pivotBy = function (full, m) {
    let [n, start] = full;
    let mStart = m[1];
    let mEnd = m[2];
    let res = {};
    // is there space before the match?
    if (start < mStart) {
      let end = mStart < full[2] ? mStart : full[2]; // find closest end-point
      res.before = [n, start, end]; //before segment
    }
    res.match = m;
    // is there space after the match?
    if (full[2] > mEnd) {
      res.after = [n, mEnd, full[2]]; //after segment
    }
    return res
  };

  const doesMatch = function (full, m) {
    return full[1] <= m[1] && m[2] <= full[2]
  };

  const splitAll = function (full, m) {
    let byN = indexN(m);
    let res = [];
    full.forEach(ptr => {
      let [n] = ptr;
      let matches = byN[n] || [];
      matches = matches.filter(p => doesMatch(ptr, p));
      if (matches.length === 0) {
        res.push({ passthrough: ptr });
        return
      }
      // ensure matches are in-order
      matches = matches.sort((a, b) => a[1] - b[1]);
      // start splitting our left-to-right
      let carry = ptr;
      matches.forEach((p, i) => {
        let found = pivotBy(carry, p);
        // last one
        if (!matches[i + 1]) {
          res.push(found);
        } else {
          res.push({ before: found.before, match: found.match });
          if (found.after) {
            carry = found.after;
          }
        }
      });
    });
    return res
  };

  var splitAll$1 = splitAll;

  const max$1 = 20;

  // sweep-around looking for our start term uuid
  const blindSweep = function (id, doc, n) {
    for (let i = 0; i < max$1; i += 1) {
      // look up a sentence
      if (doc[n - i]) {
        let index = doc[n - i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n - i, index]
        }
      }
      // look down a sentence
      if (doc[n + i]) {
        let index = doc[n + i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n + i, index]
        }
      }
    }
    return null
  };

  const repairEnding = function (ptr, document) {
    let [n, start, , , endId] = ptr;
    let terms = document[n];
    // look for end-id
    let newEnd = terms.findIndex(t => t.id === endId);
    if (newEnd === -1) {
      // if end-term wasn't found, so go all the way to the end
      ptr[2] = document[n].length;
      ptr[4] = terms.length ? terms[terms.length - 1].id : null;
    } else {
      ptr[2] = newEnd; // repair ending pointer
    }
    return document[n].slice(start, ptr[2] + 1)
  };

  /** return a subset of the document, from a pointer */
  const getDoc$1 = function (ptrs, document) {
    let doc = [];
    ptrs.forEach((ptr, i) => {
      if (!ptr) {
        return
      }
      let [n, start, end, id, endId] = ptr; //parsePointer(ptr)
      let terms = document[n] || [];
      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = terms.length;
      }
      if (id && (!terms[start] || terms[start].id !== id)) {
        // console.log('  repairing pointer...')
        let wild = blindSweep(id, document, n);
        if (wild !== null) {
          let len = end - start;
          terms = document[wild[0]].slice(wild[1], wild[1] + len);
          // actually change the pointer
          let startId = terms[0] ? terms[0].id : null;
          ptrs[i] = [wild[0], wild[1], wild[1] + len, startId];
        }
      } else {
        terms = terms.slice(start, end);
      }
      if (terms.length === 0) {
        return
      }
      if (start === end) {
        return
      }
      // test end-id, if it exists
      if (endId && terms[terms.length - 1].id !== endId) {
        terms = repairEnding(ptr, document);
      }
      // otherwise, looks good!
      doc.push(terms);
    });
    doc = doc.filter(a => a.length > 0);
    return doc
  };
  var getDoc$2 = getDoc$1;

  // flat list of terms from nested document
  const termList = function (docs) {
    let arr = [];
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        arr.push(docs[i][t]);
      }
    }
    return arr
  };

  var methods$6 = {
    one: {
      termList,
      getDoc: getDoc$2,
      pointer: {
        indexN,
        splitAll: splitAll$1,
      }
    },
  };

  // a union is a + b, minus duplicates
  const getUnion = function (a, b) {
    let both = a.concat(b);
    let byN = indexN(both);
    let res = [];
    both.forEach(ptr => {
      let [n] = ptr;
      if (byN[n].length === 1) {
        // we're alone on this sentence, so we're good
        res.push(ptr);
        return
      }
      // there may be overlaps
      let hmm = byN[n].filter(m => doesOverlap(ptr, m));
      hmm.push(ptr);
      let range = getExtent(hmm);
      res.push(range);
    });
    res = uniquePtrs(res);
    return res
  };
  var getUnion$1 = getUnion;

  // two disjoint
  // console.log(getUnion([[1, 3, 4]], [[0, 1, 2]]))
  // two disjoint
  // console.log(getUnion([[0, 3, 4]], [[0, 1, 2]]))
  // overlap-plus
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 6]]))
  // overlap
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 3]]))
  // neighbours
  // console.log(getUnion([[0, 1, 3]], [[0, 3, 5]]))

  const subtract = function (refs, not) {
    let res = [];
    let found = splitAll$1(refs, not);
    found.forEach(o => {
      if (o.passthrough) {
        res.push(o.passthrough);
      }
      if (o.before) {
        res.push(o.before);
      }
      if (o.after) {
        res.push(o.after);
      }
    });
    return res
  };
  var getDifference = subtract;

  // console.log(subtract([[0, 0, 2]], [[0, 0, 1]]))
  // console.log(subtract([[0, 0, 2]], [[0, 1, 2]]))

  // [a,a,a,a,-,-,]
  // [-,-,b,b,b,-,]
  // [-,-,x,x,-,-,]
  const intersection = function (a, b) {
    // find the latest-start
    let start = a[1] < b[1] ? b[1] : a[1];
    // find the earliest-end
    let end = a[2] > b[2] ? b[2] : a[2];
    // does it form a valid pointer?
    if (start < end) {
      return [a[0], start, end]
    }
    return null
  };

  const getIntersection = function (a, b) {
    let byN = indexN(b);
    let res = [];
    a.forEach(ptr => {
      let hmm = byN[ptr[0]] || [];
      hmm = hmm.filter(p => doesOverlap(ptr, p));
      // no sentence-pairs, so no intersection
      if (hmm.length === 0) {
        return
      }
      hmm.forEach(h => {
        let overlap = intersection(ptr, h);
        if (overlap) {
          res.push(overlap);
        }
      });
    });
    return res
  };
  var getIntersection$1 = getIntersection;

  // console.log(getIntersection([[0, 1, 3]], [[0, 2, 4]]))

  const isArray$3 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc = (m, view) => {
    if (typeof m === 'string' || isArray$3(m)) {
      return view.match(m)
    }
    if (!m) {
      return view.none()
    }
    // support pre-parsed reg object
    return m
  };

  // 'harden' our json pointers, again
  const addIds = function (ptrs, docs) {
    return ptrs.map(ptr => {
      let [n, start] = ptr;
      if (docs[n] && docs[n][start]) {
        ptr[3] = docs[n][start].id;
      }
      return ptr
    })
  };

  const methods$5 = {};

  // all parts, minus duplicates
  methods$5.union = function (m) {
    m = getDoc(m, this);
    let ptrs = getUnion$1(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$5.and = methods$5.union;

  // only parts they both have
  methods$5.intersection = function (m) {
    m = getDoc(m, this);
    let ptrs = getIntersection$1(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // only parts of a that b does not have
  methods$5.not = function (m) {
    m = getDoc(m, this);
    let ptrs = getDifference(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$5.difference = methods$5.not;

  // get opposite of a
  methods$5.complement = function () {
    let doc = this.all();
    let ptrs = getDifference(doc.fullPointer, this.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // remove overlaps
  methods$5.settle = function () {
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion$1(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };


  const addAPI = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$5);
  };
  var api$b = addAPI;

  var pointers = {
    methods: methods$6,
    api: api$b,
  };

  var lib$2 = {
    // compile a list of matches into a match-net
    buildNet: function (matches) {
      const methods = this.methods();
      let net = methods.one.buildNet(matches, this.world());
      net.isNet = true;
      return net
    }
  };

  const api$9 = function (View) {

    /** speedy match a sequence of matches */
    View.prototype.sweep = function (net, opts = {}) {
      const { world, docs } = this;
      const { methods } = world;
      let found = methods.one.bulkMatch(docs, net, this.methods, opts);

      // apply any changes
      if (opts.tagger !== false) {
        methods.one.bulkTagger(found, docs, this.world);
      }
      // fix the pointers
      // collect all found results into a View
      found = found.map(o => {
        let ptr = o.pointer;
        let term = docs[ptr[0]][ptr[1]];
        let len = ptr[2] - ptr[1];
        if (term.index) {
          o.pointer = [
            term.index[0],
            term.index[1],
            ptr[1] + len
          ];
        }
        return o
      });
      let ptrs = found.map(o => o.pointer);
      // cleanup results a bit
      found = found.map(obj => {
        obj.view = this.update([obj.pointer]);
        delete obj.regs;
        delete obj.needs;
        delete obj.pointer;
        delete obj._expanded;
        return obj
      });
      return {
        view: this.update(ptrs),
        found
      }
    };

  };
  var api$a = api$9;

  // extract the clear needs for an individual match token
  const getTokenNeeds = function (reg) {
    // negatives can't be cached
    if (reg.optional === true || reg.negative === true) {
      return null
    }
    if (reg.tag) {
      return '#' + reg.tag
    }
    if (reg.word) {
      return reg.word
    }
    if (reg.switch) {
      return `%${reg.switch}%`
    }
    return null
  };

  const getNeeds = function (regs) {
    let needs = [];
    regs.forEach(reg => {
      needs.push(getTokenNeeds(reg));
      // support AND (foo && tag)
      if (reg.operator === 'and' && reg.choices) {
        reg.choices.forEach(oneSide => {
          oneSide.forEach(r => {
            needs.push(getTokenNeeds(r));
          });
        });
      }
    });
    return needs.filter(str => str)
  };

  const getWants = function (regs) {
    let wants = [];
    let count = 0;
    regs.forEach(reg => {
      if (reg.operator === 'or' && !reg.optional && !reg.negative) {
        // add fast-or terms
        if (reg.fastOr) {
          Array.from(reg.fastOr).forEach(w => {
            wants.push(w);
          });
        }
        // add slow-or
        if (reg.choices) {
          reg.choices.forEach(rs => {
            rs.forEach(r => {
              let n = getTokenNeeds(r);
              if (n) {
                wants.push(n);
              }
            });
          });
        }
        count += 1;
      }
    });
    return { wants, count }
  };

  const parse$2 = function (matches, world) {
    const parseMatch = world.methods.one.parseMatch;
    matches.forEach(obj => {
      obj.regs = parseMatch(obj.match, {}, world);
      // wrap these ifNo properties into an array
      if (typeof obj.ifNo === 'string') {
        obj.ifNo = [obj.ifNo];
      }
      if (obj.notIf) {
        obj.notIf = parseMatch(obj.notIf, {}, world);
      }
      // cache any requirements up-front 
      obj.needs = getNeeds(obj.regs);
      let { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
    });
    return matches
  };

  var parse$3 = parse$2;

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$3(matches, world);

    // collect by wants and needs
    let hooks = {};
    matches.forEach(obj => {
      // add needs
      obj.needs.forEach(str => {
        hooks[str] = hooks[str] || [];
        hooks[str].push(obj);
      });
      // add wants
      obj.wants.forEach(str => {
        hooks[str] = hooks[str] || [];
        hooks[str].push(obj);
      });
    });
    // remove duplicates
    Object.keys(hooks).forEach(k => {
      let already = {};
      hooks[k] = hooks[k].filter(obj => {
        if (already[obj.match]) {
          return false
        }
        already[obj.match] = true;
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    let always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      always
    }
  };

  var buildNet$1 = buildNet;

  // for each cached-sentence, find a list of possible matches
  const getHooks = function (docCaches, hooks) {
    return docCaches.map((set, i) => {
      let maybe = [];
      Object.keys(hooks).forEach(k => {
        if (docCaches[i].has(k)) {
          maybe = maybe.concat(hooks[k]);
        }
      });
      // remove duplicates
      let already = {};
      maybe = maybe.filter(m => {
        if (already[m.match]) {
          return false
        }
        already[m.match] = true;
        return true
      });
      return maybe
    })
  };

  var getHooks$1 = getHooks;

  // filter-down list of maybe-matches
  const localTrim = function (maybeList, docCache) {
    return maybeList.map((list, n) => {
      let haves = docCache[n];
      // ensure all stated-needs of the match are met
      list = list.filter(obj => {
        return obj.needs.every(need => haves.has(need))
      });
      // ensure nothing matches in our 'ifNo' property
      list = list.filter(obj => {
        if (obj.ifNo !== undefined && obj.ifNo.some(no => haves.has(no)) === true) {
          return false
        }
        return true
      });
      // ensure atleast one(?) of the wants is found
      list = list.filter(obj => {
        if (obj.wants.length === 0) {
          return true
        }
        // ensure there's one cache-hit
        let found = obj.wants.filter(str => haves.has(str)).length;
        return found >= obj.minWant
      });
      return list
    })
  };
  var trimDown = localTrim;

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, docCache, methods, opts) {
    let results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      for (let i = 0; i < maybeList[n].length; i += 1) {
        let m = maybeList[n][i];
        // ok, actually do the work.
        let res = methods.one.match([document[n]], m);
        // found something.
        if (res.ptrs.length > 0) {
          res.ptrs.forEach(ptr => {
            ptr[0] = n; // fix the sentence pointer
            // check ifNo
            // if (m.ifNo !== undefined) {
            //   let terms = document[n].slice(ptr[1], ptr[2])
            //   for (let k = 0; k < m.ifNo.length; k += 1) {
            //     const no = m.ifNo[k]
            //     // quick-check cache
            //     if (docCache[n].has(no)) {
            //       if (no.startsWith('#')) {
            //         let tag = no.replace(/^#/, '')
            //         if (terms.find(t => t.tags.has(tag))) {
            //           console.log('+' + tag)
            //           return
            //         }
            //       } else if (terms.find(t => t.normal === no || t.tags.has(no))) {
            //         console.log('+' + no)
            //         return
            //       }
            //     }
            //   }
            // }
            let todo = Object.assign({}, m, { pointer: ptr });
            if (m.unTag !== undefined) {
              todo.unTag = m.unTag;
            }
            results.push(todo);
          });
          //ok cool, can we stop early?
          if (opts.matchOne === true) {
            return [results[0]]
          }
        }
      }
    }
    return results
  };
  var runMatch$1 = runMatch;

  const tooSmall = function (maybeList, document) {
    return maybeList.map((arr, i) => {
      let termCount = document[i].length;
      arr = arr.filter(o => {
        return termCount >= o.minWords
      });
      return arr
    })
  };

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    let docCache = methods.one.cacheDoc(document);
    // collect possible matches for this document
    let maybeList = getHooks$1(docCache, net.hooks);
    // ensure all defined needs are met for each match
    maybeList = trimDown(maybeList, docCache);
    // add unchacheable matches to each sentence's todo-list
    if (net.always.length > 0) {
      maybeList = maybeList.map(arr => arr.concat(net.always));
    }
    // if we don't have enough words
    maybeList = tooSmall(maybeList, document);

    // now actually run the matches
    let results = runMatch$1(maybeList, document, docCache, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };
  var bulkMatch = sweep$1;

  // is this tag consistent with the tags they already have?
  const canBe = function (terms, tag, model) {
    let tagSet = model.one.tagSet;
    if (!tagSet.hasOwnProperty(tag)) {
      return true
    }
    let not = tagSet[tag].not || [];
    for (let i = 0; i < terms.length; i += 1) {
      let term = terms[i];
      for (let k = 0; k < not.length; k += 1) {
        if (term.tags.has(not[k]) === true) {
          return false //found a tag conflict - bail!
        }
      }
    }
    return true
  };
  var canBe$1 = canBe;

  const tagger$1 = function (list, document, world) {
    const { model, methods } = world;
    const { getDoc, setTag, unTag } = methods.one;
    const looksPlural = methods.two.looksPlural;
    if (list.length === 0) {
      return list
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env.DEBUG_TAGS) {
      console.log(`\n\n  \x1b[32m??? ${list.length} post-tagger:\x1b[0m`); //eslint-disable-line
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      let reason = todo.reason || todo.match;
      let terms = getDoc([todo.pointer], document)[0];
      // handle 'safe' tag
      if (todo.safe === true) {
        // check for conflicting tags
        if (canBe$1(terms, todo.tag, model) === false) {
          return
        }
        // dont tag half of a hyphenated word
        if (terms[terms.length - 1].post === '-') {
          return
        }
      }
      if (todo.tag !== undefined) {
        setTag(terms, todo.tag, world, todo.safe, `[post] '${reason}'`);
        // quick and dirty plural tagger
        if (todo.tag === 'Noun' && looksPlural) {
          let term = terms[terms.length - 1];
          if (looksPlural(term.text)) {
            setTag([term], 'Plural', world, todo.safe, 'quick-plural');
          } else {
            setTag([term], 'Singular', world, todo.safe, 'quick-singular');
          }
        }
      }
      if (todo.unTag !== undefined) {
        unTag(terms, todo.unTag, world, todo.safe, reason);
      }
      // allow setting chunks, too
      if (todo.chunk) {
        terms.forEach(t => t.chunk = todo.chunk);
      }
    })
  };
  var bulkTagger = tagger$1;

  var methods$4 = {
    buildNet: buildNet$1,
    bulkMatch,
    bulkTagger
  };

  var sweep = {
    lib: lib$2,
    api: api$a,
    methods: {
      one: methods$4,
    }
  };

  const isMulti = / /;

  const addChunk = function (term, tag) {
    if (tag === 'Noun') {
      term.chunk = tag;
    }
    if (tag === 'Verb') {
      term.chunk = tag;
    }
  };

  const tagTerm = function (term, tag, tagSet, isSafe) {
    // does it already have this tag?
    if (term.tags.has(tag) === true) {
      return null
    }
    // allow this shorthand in multiple-tag strings
    if (tag === '.') {
      return null
    }
    // for known tags, do logical dependencies first
    let known = tagSet[tag];
    if (known) {
      // first, we remove any conflicting tags
      if (known.not && known.not.length > 0) {
        for (let o = 0; o < known.not.length; o += 1) {
          // if we're in tagSafe, skip this term.
          if (isSafe === true && term.tags.has(known.not[o])) {
            return null
          }
          term.tags.delete(known.not[o]);
        }
      }
      // add parent tags
      if (known.parents && known.parents.length > 0) {
        for (let o = 0; o < known.parents.length; o += 1) {
          term.tags.add(known.parents[o]);
          addChunk(term, known.parents[o]);
        }
      }
    }
    // finally, add our tag
    term.tags.add(tag);
    // now it's dirty?
    term.dirty = true;
    // add a chunk too, if it's easy
    addChunk(term, tag);
    return true
  };

  // support '#Noun . #Adjective' syntax
  const multiTag = function (terms, tagString, tagSet, isSafe) {
    let tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      let tag = tags[i];
      if (tag) {
        tag = tag.replace(/^#/, '');
        tagTerm(term, tag, tagSet, isSafe);
      }
    });
  };

  const isArray$2 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // verbose-mode tagger debuging
  const log = (terms, tag, reason = '') => {
    const yellow = str => '\x1b[33m\x1b[3m' + str + '\x1b[0m';
    const i = str => '\x1b[3m' + str + '\x1b[0m';
    let word = terms.map(t => {
      return t.text || '[' + t.implicit + ']'
    }).join(' ');
    if (typeof tag !== 'string' && tag.length > 2) {
      tag = tag.slice(0, 2).join(', #') + ' +'; //truncate the list of tags
    }
    tag = typeof tag !== 'string' ? tag.join(', #') : tag;
    console.log(` ${yellow(word).padEnd(24)} \x1b[32m???\x1b[0m #${tag.padEnd(22)}  ${i(reason)}`); // eslint-disable-line
  };

  // add a tag to all these terms
  const setTag = function (terms, tag, world = {}, isSafe, reason) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env && env.DEBUG_TAGS) {
      log(terms, tag, reason);
    }
    if (isArray$2(tag) === true) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe));
      return
    }
    if (typeof tag !== 'string') {
      console.warn(`compromise: Invalid tag '${tag}'`);// eslint-disable-line
      return
    }
    tag = tag.trim();
    // support '#Noun . #Adjective' syntax
    if (isMulti.test(tag)) {
      multiTag(terms, tag, tagSet, isSafe);
      return
    }
    tag = tag.replace(/^#/, '');
    // let set = false
    for (let i = 0; i < terms.length; i += 1) {
      tagTerm(terms[i], tag, tagSet, isSafe);
    }
  };
  var setTag$1 = setTag;

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet) {
    tag = tag.trim().replace(/^#/, '');
    for (let i = 0; i < terms.length; i += 1) {
      let term = terms[i];
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        continue
      }
      // for known tags, do logical dependencies first
      let known = tagSet[tag];
      // removing #Verb should also remove #PastTense
      if (known && known.children.length > 0) {
        for (let o = 0; o < known.children.length; o += 1) {
          term.tags.delete(known.children[o]);
        }
      }
      term.tags.delete(tag);
    }
  };
  var unTag$1 = unTag;

  const e=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e({id:t}))),n}return [e({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e({});return t.forEach((t=>{if((t=e(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r(s=c).forEach(e),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("??? "));let i="";return r(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,!0)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f$1=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;class g$1{constructor(e={}){Object.defineProperty(this,"json",{enumerable:!1,value:e,writable:!0});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=!0),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g$1(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e({});return new g$1(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e({id:t,props:n});return this.json.children.push(r),new g$1(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r(this.json)}fillDown(){var e;return e=this.json,r(e,((e,t)=>{t.props=f$1(t.props,e.props);})),this}depth(){u(this.json);let e=r(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}}const _=function(e){let t=s(e);return new g$1(t)};_.prototype.plugin=function(e){e(this);};

  // i just made these up
  const colors = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Preposition: 'cyan',
    Conjunction: 'cyan',
    Determiner: 'cyan',
    Hyphenated: 'cyan',
    Adverb: 'cyan',
  };

  var colors$1 = colors;

  const getColor = function (node) {
    if (colors$1.hasOwnProperty(node.id)) {
      return colors$1[node.id]
    }
    if (colors$1.hasOwnProperty(node.is)) {
      return colors$1[node.is]
    }
    let found = node._cache.parents.find(c => colors$1[c]);
    return colors$1[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    nodes.forEach(node => {
      let { not, also, is, novel } = node.props;
      let parents = node._cache.parents;
      if (also) {
        parents = parents.concat(also);
      }
      res[node.id] = {
        is,
        not,
        novel,
        also,
        parents,
        children: node._cache.children,
        color: getColor(node)
      };
    });
    // lastly, add all children of all nots
    Object.keys(res).forEach(k => {
      let nots = new Set(res[k].not);
      res[k].not.forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
    });
    return res
  };

  var fmt$1 = fmt;

  const toArr = function (input) {
    if (!input) {
      return []
    }
    if (typeof input === 'string') {
      return [input]
    }
    return input
  };

  const addImplied = function (tags, already) {
    Object.keys(tags).forEach(k => {
      // support deprecated fmts
      if (tags[k].isA) {
        tags[k].is = tags[k].isA;
      }
      if (tags[k].notA) {
        tags[k].not = tags[k].notA;
      }
      // add any implicit 'is' tags
      if (tags[k].is && typeof tags[k].is === 'string') {
        if (!already.hasOwnProperty(tags[k].is) && !tags.hasOwnProperty(tags[k].is)) {
          tags[tags[k].is] = {};
        }
      }
      // add any implicit 'not' tags
      if (tags[k].not && typeof tags[k].not === 'string' && !tags.hasOwnProperty(tags[k].not)) {
        if (!already.hasOwnProperty(tags[k].not) && !tags.hasOwnProperty(tags[k].not)) {
          tags[tags[k].not] = {};
        }
      }
    });
    return tags
  };


  const validate = function (tags, already) {

    tags = addImplied(tags, already);

    // property validation
    Object.keys(tags).forEach(k => {
      tags[k].children = toArr(tags[k].children);
      tags[k].not = toArr(tags[k].not);
    });
    // not links are bi-directional
    // add any incoming not tags
    Object.keys(tags).forEach(k => {
      let nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not) {
          tags[no].not.push(k);
        }
      });
    });
    return tags
  };
  var validate$1 = validate;

  // 'fill-down' parent logic inference
  const compute$2 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      let o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is, novel: o.novel };
      return { id: k, parent: o.is, props, children: [] }
    });
    const graph = _(flatList).cache().fillDown();
    return graph.out('array')
  };

  const fromUser = function (tags) {
    Object.keys(tags).forEach(k => {
      tags[k] = Object.assign({}, tags[k]);
      tags[k].novel = true;
    });
    return tags
  };

  const addTags$1 = function (tags, already) {
    // are these tags internal ones, or user-generated?
    if (Object.keys(already).length > 0) {
      tags = fromUser(tags);
    }
    tags = validate$1(tags, already);

    let allTags = Object.assign({}, already, tags);
    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$2(allTags);
    // convert it to our final format
    const res = fmt$1(nodes);
    return res
  };
  var addTags$2 = addTags$1;

  var methods$3 = {
    one: {
      setTag: setTag$1,
      unTag: unTag$1,
      addTags: addTags$2
    },
  };

  /* eslint no-console: 0 */
  const isArray$1 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };
  const fns = {
    /** add a given tag, to all these terms */
    tag: function (input, reason = '', isSafe) {
      if (!this.found || !input) {
        return this
      }
      let terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, world } = this;
      // logger
      if (verbose === true) {
        console.log(' +  ', input, reason || '');
      }
      if (isArray$1(input)) {
        input.forEach(tag => methods.one.setTag(terms, tag, world, isSafe, reason));
      } else {
        methods.one.setTag(terms, input, world, isSafe, reason);
      }
      // uncache
      this.uncache();
      return this
    },

    /** add a given tag, only if it is consistent */
    tagSafe: function (input, reason = '') {
      return this.tag(input, reason, true)
    },

    /** remove a given tag from all these terms */
    unTag: function (input, reason) {
      if (!this.found || !input) {
        return this
      }
      let terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, model } = this;
      // logger
      if (verbose === true) {
        console.log(' -  ', input, reason || '');
      }
      let tagSet = model.one.tagSet;
      if (isArray$1(input)) {
        input.forEach(tag => methods.one.unTag(terms, tag, tagSet));
      } else {
        methods.one.unTag(terms, input, tagSet);
      }
      // uncache
      this.uncache();
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      tag = tag.replace(/^#/, '');
      let tagSet = this.model.one.tagSet;
      // everything can be an unknown tag
      if (!tagSet.hasOwnProperty(tag)) {
        return this
      }
      let not = tagSet[tag].not || [];
      let nope = [];
      this.document.forEach((terms, n) => {
        terms.forEach((term, i) => {
          let found = not.find(no => term.tags.has(no));
          if (found) {
            nope.push([n, i, i + 1]);
          }
        });
      });
      let noDoc = this.update(nope);
      return this.difference(noDoc)
    },
  };
  var tag$1 = fns;

  const tagAPI = function (View) {
    Object.assign(View.prototype, tag$1);
  };
  var api$8 = tagAPI;

  // wire-up more pos-tags to our model
  const addTags = function (tags) {
    const { model, methods } = this.world();
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    let res = fn(tags, tagSet);
    model.one.tagSet = res;
    return this
  };

  var lib$1 = { addTags };

  const boringTags = new Set(['Auxiliary', 'Possessive']);

  const sortByKids = function (tags, tagSet) {
    tags = tags.sort((a, b) => {
      // (unknown tags are interesting)
      if (boringTags.has(a) || !tagSet.hasOwnProperty(b)) {
        return 1
      }
      if (boringTags.has(b) || !tagSet.hasOwnProperty(a)) {
        return -1
      }
      let kids = tagSet[a].children || [];
      let aKids = kids.length;
      kids = tagSet[b].children || [];
      let bKids = kids.length;
      return aKids - bKids
    });
    return tags
  };

  const tagRank = function (view) {
    const { document, world } = view;
    const tagSet = world.model.one.tagSet;
    document.forEach(terms => {
      terms.forEach(term => {
        let tags = Array.from(term.tags);
        term.tagRank = sortByKids(tags, tagSet);
      });
    });
  };
  var tagRank$1 = tagRank;

  var tag = {
    model: {
      one: { tagSet: {} }
    },
    compute: {
      tagRank: tagRank$1
    },
    methods: methods$3,
    api: api$8,
    lib: lib$1
  };

  // split by periods, question marks, unicode ???, etc
  const initSplit = /([.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s)/g;
  // merge these back into prev sentence
  const splitsOnly = /^[.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s$/;
  const newLine = /((?:\r?\n|\r)+)/; // Match different new-line formats

  // Start with a regex:
  const basicSplit = function (text) {
    let all = [];
    //first, split by newline
    let lines = text.split(newLine);
    for (let i = 0; i < lines.length; i++) {
      //split by period, question-mark, and exclamation-mark
      let arr = lines[i].split(initSplit);
      for (let o = 0; o < arr.length; o++) {
        // merge 'foo' + '.'
        if (arr[o + 1] && splitsOnly.test(arr[o + 1]) === true) {
          arr[o] += arr[o + 1];
          arr[o + 1] = '';
        }
        if (arr[o] !== '') {
          all.push(arr[o]);
        }
      }
    }
    return all
  };
  var simpleSplit = basicSplit;

  const hasLetter$1 = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    let chunks = [];
    for (let i = 0; i < splits.length; i++) {
      let s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (hasSomething$1.test(s) === false || hasLetter$1.test(s) === false) {
        //add it to the last one
        if (chunks[chunks.length - 1]) {
          chunks[chunks.length - 1] += s;
          continue
        } else if (splits[i + 1]) {
          //add it to the next one
          splits[i + 1] = s + splits[i + 1];
          continue
        }
      }
      //else, only whitespace, no terms, no sentence
      chunks.push(s);
    }
    return chunks
  };
  var simpleMerge = notEmpty;

  //loop through these chunks, and join the non-sentence chunks back together..
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    let sentences = [];
    for (let i = 0; i < chunks.length; i++) {
      let c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && isSentence(c, abbrevs) === false) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
    return sentences
  };
  var smartMerge$1 = smartMerge;

  // merge embedded quotes into 1 sentence
  // like - 'he said "no!" and left.' 
  const MAX_QUOTE = 280;// ??\_(???)_/??

  // don't support single-quotes for multi-sentences
  const pairs = {
    '\u0022': '\u0022', // 'StraightDoubleQuotes'
    '\uFF02': '\uFF02', // 'StraightDoubleQuotesWide'
    // '\u0027': '\u0027', // 'StraightSingleQuotes'
    '\u201C': '\u201D', // 'CommaDoubleQuotes'
    // '\u2018': '\u2019', // 'CommaSingleQuotes'
    '\u201F': '\u201D', // 'CurlyDoubleQuotesReversed'
    // '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
    '\u201E': '\u201D', // 'LowCurlyDoubleQuotes'
    '\u2E42': '\u201D', // 'LowCurlyDoubleQuotesReversed'
    '\u201A': '\u2019', // 'LowCurlySingleQuotes'
    '\u00AB': '\u00BB', // 'AngleDoubleQuotes'
    '\u2039': '\u203A', // 'AngleSingleQuotes'
    '\u2035': '\u2032', // 'PrimeSingleQuotes'
    '\u2036': '\u2033', // 'PrimeDoubleQuotes'
    '\u2037': '\u2034', // 'PrimeTripleQuotes'
    '\u301D': '\u301E', // 'PrimeDoubleQuotes'
    // '\u0060': '\u00B4', // 'PrimeSingleQuotes'
    '\u301F': '\u301E', // 'LowPrimeDoubleQuotesReversed'
  };
  const openQuote = RegExp('(' + Object.keys(pairs).join('|') + ')', 'g');
  const closeQuote = RegExp('(' + Object.values(pairs).join('|') + ')', 'g');

  const closesQuote = function (str) {
    if (!str) {
      return false
    }
    let m = str.match(closeQuote);
    if (m !== null && m.length === 1) {
      return true
    }
    return false
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    let arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      let split = splits[i];
      // do we have an open-quote and not a closed one?
      let m = split.match(openQuote);
      if (m !== null && m.length === 1) {

        // look at the next sentence for a closing quote,
        if (closesQuote(splits[i + 1]) && splits[i + 1].length < MAX_QUOTE) {
          splits[i] += splits[i + 1];// merge them
          arr.push(splits[i]);
          splits[i + 1] = '';
          i += 1;
          continue
        }
        // look at n+2 for a closing quote,
        if (closesQuote(splits[i + 2])) {
          let toAdd = splits[i + 1] + splits[i + 2];// merge them all
          //make sure it's not too-long
          if (toAdd.length < MAX_QUOTE) {
            splits[i] += toAdd;
            arr.push(splits[i]);
            splits[i + 1] = '';
            splits[i + 2] = '';
            i += 2;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };
  var quoteMerge$1 = quoteMerge;

  const MAX_LEN = 250;// ??\_(???)_/??

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen = /\(/g;
  const hasClosed = /\)/g;
  const mergeParens = function (splits) {
    let arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      let split = splits[i];
      let m = split.match(hasOpen);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          let m2 = splits[i + 1].match(hasClosed);
          if (m2 !== null && m.length === 1 && !hasOpen.test(splits[i + 1])) {
            // merge in 2nd sentence
            splits[i] += splits[i + 1];
            arr.push(splits[i]);
            splits[i + 1] = '';
            i += 1;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };
  var parensMerge = mergeParens;

  //(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
  // Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
  //regs-
  const hasSomething = /\S/;
  const startWhitespace = /^\s+/;

  const splitSentences = function (text, world) {
    text = text || '';
    text = String(text);
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
      return []
    }
    // cleanup unicode-spaces
    text = text.replace('\xa0', ' ');
    // First do a greedy-split..
    let splits = simpleSplit(text);
    // Filter-out the crap ones
    let sentences = simpleMerge(splits);
    //detection of non-sentence chunks:
    sentences = smartMerge$1(sentences, world);
    // allow 'he said "no sir." and left.'
    sentences = quoteMerge$1(sentences);
    // allow 'i thought (no way!) and left.'
    sentences = parensMerge(sentences);
    //if we never got a sentence, return the given text
    if (sentences.length === 0) {
      return [text]
    }
    //move whitespace to the ends of sentences, when possible
    //['hello',' world'] -> ['hello ','world']
    for (let i = 1; i < sentences.length; i += 1) {
      let ws = sentences[i].match(startWhitespace);
      if (ws !== null) {
        sentences[i - 1] += ws[0];
        sentences[i] = sentences[i].replace(startWhitespace, '');
      }
    }
    return sentences
  };
  var splitSentences$1 = splitSentences;

  const hasHyphen = function (str, model) {
    let parts = str.split(/[-??????]/);
    if (parts.length <= 1) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    // l-theanine, x-ray
    if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
      return false
    }
    //dont split 're-do'
    if (prefixes.hasOwnProperty(parts[0])) {
      return false
    }
    //dont split 'flower-like'
    parts[1] = parts[1].trim().replace(/[.?!]$/, '');
    if (suffixes.hasOwnProperty(parts[1])) {
      return false
    }
    //letter-number 'aug-20'
    let reg = /^([a-z\u00C0-\u00FF`"'/]+)[-??????]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str) === true) {
      return true
    }
    //number-letter '20-aug'
    let reg2 = /^([0-9]{1,4})[-??????]([a-z\u00C0-\u00FF`"'/-]+$)/i;
    if (reg2.test(str) === true) {
      return true
    }
    return false
  };

  const splitHyphens = function (word) {
    let arr = [];
    //support multiple-hyphenated-terms
    const hyphens = word.split(/[-??????]/);
    let whichDash = '-';
    let found = word.match(/[-??????]/);
    if (found && found[0]) {
      whichDash = found;
    }
    for (let o = 0; o < hyphens.length; o++) {
      if (o === hyphens.length - 1) {
        arr.push(hyphens[o]);
      } else {
        arr.push(hyphens[o] + whichDash);
      }
    }
    return arr
  };

  // combine '2 - 5' like '2-5' is
  // 2-4: 2, 4
  const combineRanges = function (arr) {
    const startRange = /^[0-9]{1,4}(:[0-9][0-9])?([a-z]{1,2})? ?[-??????] ?$/;
    const endRange = /^[0-9]{1,4}([a-z]{1,2})? ?$/;
    for (let i = 0; i < arr.length - 1; i += 1) {
      if (arr[i + 1] && startRange.test(arr[i]) && endRange.test(arr[i + 1])) {
        arr[i] = arr[i] + arr[i + 1];
        arr[i + 1] = null;
      }
    }
    return arr
  };
  var combineRanges$1 = combineRanges;

  const isSlash = /\p{L} ?\/ ?\p{L}+$/u;

  // 'he / she' should be one word
  const combineSlashes = function (arr) {
    for (let i = 1; i < arr.length - 1; i++) {
      if (isSlash.test(arr[i])) {
        arr[i - 1] += arr[i] + arr[i + 1];
        arr[i] = null;
        arr[i + 1] = null;
      }
    }
    return arr
  };
  var combineSlashes$1 = combineSlashes;

  const wordlike = /\S/;
  const isBoundary = /^[!?.]+$/;
  const naiiveSplit = /(\S+)/;

  let notWord = ['.', '?', '!', ':', ';', '-', '???', '???', '--', '...', '(', ')', '[', ']', '"', "'", '`', '??', '??', '*'];
  notWord = notWord.reduce((h, c) => {
    h[c] = true;
    return h
  }, {});

  const isArray = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  //turn a string into an array of strings (naiive for now, lumped later)
  const splitWords = function (str, model) {
    let result = [];
    let arr = [];
    //start with a naiive split
    str = str || '';
    if (typeof str === 'number') {
      str = String(str);
    }
    if (isArray(str)) {
      return str
    }
    const words = str.split(naiiveSplit);
    for (let i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen(words[i], model) === true) {
        arr = arr.concat(splitHyphens(words[i]));
        continue
      }
      arr.push(words[i]);
    }
    //greedy merge whitespace+arr to the right
    let carry = '';
    for (let i = 0; i < arr.length; i++) {
      let word = arr[i];
      //if it's more than a whitespace
      if (wordlike.test(word) === true && notWord.hasOwnProperty(word) === false && isBoundary.test(word) === false) {
        //put whitespace on end of previous term, if possible
        if (result.length > 0) {
          result[result.length - 1] += carry;
          result.push(word);
        } else {
          //otherwise, but whitespace before
          result.push(carry + word);
        }
        carry = '';
      } else {
        carry += word;
      }
    }
    //handle last one
    if (carry) {
      if (result.length === 0) {
        result[0] = '';
      }
      result[result.length - 1] += carry; //put it on the end
    }
    // combine 'one / two'
    result = combineSlashes$1(result);
    result = combineRanges$1(result);
    // remove empty results
    result = result.filter(s => s);
    return result
  };
  var splitTerms = splitWords;

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation

  //we have slightly different rules for start/end - like #hashtags.
  const isLetter = /\p{Letter}/u;
  const isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['???]$/;

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    let { prePunctuation, postPunctuation, emoticons } = model.one;
    let original = str;
    let pre = '';
    let post = '';
    let chars = Array.from(str);

    // punctuation-only words, like '<3'
    if (emoticons.hasOwnProperty(str.trim())) {
      return { str: str.trim(), pre, post: ' ' } //not great
    }

    // pop any punctuation off of the start
    let len = chars.length;
    for (let i = 0; i < len; i += 1) {
      let c = chars[0];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        continue//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-') && isNumber.test(chars[1])) {
        break//done
      }
      // '97 - year short-form
      if (c === "'" && c.length === 3 && isNumber.test(chars[1])) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // punctuation
      pre += chars.shift();//keep going
    }

    // pop any punctuation off of the end
    len = chars.length;
    for (let i = 0; i < len; i += 1) {
      let c = chars[chars.length - 1];
      // keep any declared chars
      if (postPunctuation[c] === true) {
        continue//keep it
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // F.B.I.
      if (c === '.' && hasAcronym.test(original) === true) {
        continue//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original) === true) {
        continue//keep it
      }
      // punctuation
      post = chars.pop() + post;//keep going
    }

    str = chars.join('');
    //we went too far..
    if (str === '') {
      // do a very mild parse, and hope for the best.
      original = original.replace(/ *$/, after => {
        post = after || '';
        return ''
      });
      str = original;
      pre = '';
    }
    return { str, pre, post }
  };
  var tokenize$1 = normalizePunctuation;

  const parseTerm = (txt, model) => {
    // cleanup any punctuation as whitespace
    let { str, pre, post } = tokenize$1(txt, model);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };
  var splitWhitespace = parseTerm;

  // 'Bj??rk' to 'Bjork'.
  const killUnicode = function (str, world) {
    const unicode = world.model.one.unicode || {};
    str = str || '';
    let chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };
  var killUnicode$1 = killUnicode;

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str = str || '';
    str = str.toLowerCase();
    str = str.trim();
    let original = str;
    //punctuation
    str = str.replace(/[,;.!?]+$/, '');
    //coerce Unicode ellipses
    str = str.replace(/\u2026/g, '...');
    //en-dash
    str = str.replace(/\u2013/g, '-');
    //strip leading & trailing grammatical punctuation
    if (/^[:;]/.test(str) === false) {
      str = str.replace(/\.{3,}$/g, '');
      str = str.replace(/[",.!:;?)]+$/g, '');
      str = str.replace(/^['"(]+/g, '');
    }
    // remove zero-width characters
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
    //do this again..
    str = str.trim();
    //oh shucks,
    if (str === '') {
      str = original;
    }
    //no-commas in numbers
    str = str.replace(/([0-9]),([0-9])/g, '$1$2');
    return str
  };
  var cleanup = clean;

  // do acronyms need to be ASCII?  ... kind of?
  const periodAcronym$1 = /([A-Z]\.)+[A-Z]?,?$/;
  const oneLetterAcronym$1 = /^[A-Z]\.,?$/;
  const noPeriodAcronym$1 = /[A-Z]{2,}('s|,)?$/;
  const lowerCaseAcronym$1 = /([a-z]\.)+[a-z]\.?$/;

  const isAcronym$2 = function (str) {
    //like N.D.A
    if (periodAcronym$1.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym$1.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym$1.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym$1.test(str) === true) {
      return true
    }
    return false
  };

  const doAcronym = function (str) {
    if (isAcronym$2(str)) {
      str = str.replace(/\./g, '');
    }
    return str
  };
  var doAcronyms = doAcronym;

  const normalize$1 = function (term, world) {
    const killUnicode = world.methods.one.killUnicode;
    // console.log(world.methods.one)
    let str = term.text || '';
    str = cleanup(str);
    //(very) rough ASCII transliteration -  bj??rk -> bjork
    str = killUnicode(str, world);
    str = doAcronyms(str);
    term.normal = str;
  };
  var normal = normalize$1;

  // turn a string input into a 'document' json format
  const parse$1 = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input = input || '';
    // split into sentences
    let sentences = splitSentences(input, world);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(t => splitWhitespace(t, model));
      // add normalized term format, always
      terms.forEach((t) => {
        normal(t, world);
      });
      return terms
    });
    return input
  };
  var fromString = parse$1;

  const isAcronym$1 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse = /(?:\u2026|\.{2,}) *$/; // '...'
  const hasLetter = /\p{L}/u;
  const leadInit = /^[A-Z]\. $/; // "W. Kensington"

  /** does this look like a sentence? */
  const isSentence = function (str, abbrevs) {
    // must have a letter
    if (hasLetter.test(str) === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$1.test(str) === true) {
      return false
    }
    // check for leading initial - "W. Kensington"
    if (str.length === 3 && leadInit.test(str)) {
      return false
    }
    //check for '...'
    if (hasEllipse.test(str) === true) {
      return false
    }
    let txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    let words = txt.split(' ');
    let lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.'
    if (abbrevs.hasOwnProperty(lastWord) === true) {
      return false
    }
    // //check for jeopardy!
    // if (blacklist.hasOwnProperty(lastWord)) {
    //   return false
    // }
    return true
  };
  var isSentence$1 = isSentence;

  var methods$2 = {
    one: {
      killUnicode: killUnicode$1,
      tokenize: {
        splitSentences: splitSentences$1,
        isSentence: isSentence$1,
        splitTerms,
        splitWhitespace,
        fromString,
      },
    },
  };

  const aliases = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
    'plz': 'please',
    'bein': 'being',
  };
  var aliases$1 = aliases;

  var misc$2 = [
    'approx',
    'apt',
    'bc',
    'cyn',
    'eg',
    'esp',
    'est',
    'etc',
    'ex',
    'exp',
    'prob', //probably
    'pron', // Pronunciation
    'gal', //gallon
    'min',
    'pseud',
    'fig', //figure
    'jd',
    'lat', //latitude
    'lng', //longitude
    'vol', //volume
    'fm', //not am
    'def', //definition
    'misc',
    'plz', //please
    'ea', //each
    'ps',
    'sec', //second
    'pt',
    'pref', //preface
    'pl', //plural
    'pp', //pages
    'qt', //quarter
    'fr', //french
    'sq',
    'nee', //given name at birth
    'ss', //ship, or sections
    'tel',
    'temp',
    'vet',
    'ver', //version
    'fem', //feminine
    'masc', //masculine
    'eng', //engineering/english
    'adj', //adjective
    'vb', //verb
    'rb', //adverb
    'inf', //infinitive
    'situ', // in situ
    'vivo',
    'vitro',
    'wr', //world record
  ];

  var honorifics = [
    'adj',
    'adm',
    'adv',
    'asst',
    'atty',
    'bldg',
    'brig',
    'capt',
    'cmdr',
    'comdr',
    'cpl',
    'det',
    'dr',
    'esq',
    'gen',
    'gov',
    'hon',
    'jr',
    'llb',
    'lt',
    'maj',
    'messrs',
    'mlle',
    'mme',
    'mr',
    'mrs',
    'ms',
    'mstr',
    'phd',
    'prof',
    'pvt',
    'rep',
    'reps',
    'res',
    'rev',
    'sen',
    'sens',
    'sfc',
    'sgt',
    'sir',
    'sr',
    'supt',
    'surg'
    //miss
    //misses
  ];

  var months = ['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];

  var nouns$1 = [
    'ad',
    'al',
    'arc',
    'ba',
    'bl',
    'ca',
    'cca',
    'col',
    'corp',
    'ft',
    'fy',
    'ie',
    'lit',
    'ma',
    'md',
    'pd',
    'tce',
  ];

  var organizations = ['dept', 'univ', 'assn', 'bros', 'inc', 'ltd', 'co'];

  var places = [
    'rd',
    'st',
    'dist',
    'mt',
    'ave',
    'blvd',
    'cl',
    // 'ct',
    'cres',
    'hwy',
    //states
    'ariz',
    'cal',
    'calif',
    'colo',
    'conn',
    'fla',
    'fl',
    'ga',
    'ida',
    'ia',
    'kan',
    'kans',

    'minn',
    'neb',
    'nebr',
    'okla',
    'penna',
    'penn',
    'pa',
    'dak',
    'tenn',
    'tex',
    'ut',
    'vt',
    'va',
    'wis',
    'wisc',
    'wy',
    'wyo',
    'usafa',
    'alta',
    'ont',
    'que',
    'sask',
  ];

  // units that are abbreviations too
  var units = [
    'dl',
    'ml',
    'gal',
    // 'ft', //ambiguous
    'qt',
    'pt',
    'tbl',
    'tsp',
    'tbsp',
    'km',
    'dm', //decimeter
    'cm',
    'mm',
    'mi',
    'td',
    'hr', //hour
    'hrs', //hour
    'kg',
    'hg',
    'dg', //decigram
    'cg', //centigram
    'mg', //milligram
    '??g', //microgram
    'lb', //pound
    'oz', //ounce
    'sq ft',
    'hz', //hertz
    'mps', //meters per second
    'mph',
    'kmph', //kilometers per hour
    'kb', //kilobyte
    'mb', //megabyte
    // 'gb', //ambig
    'tb', //terabyte
    'lx', //lux
    'lm', //lumen
    // 'pa', //ambig
    'fl oz', //
    'yb',
  ];

  // add our abbreviation list to our lexicon
  let list = [
    [misc$2],
    [units, 'Unit'],
    [nouns$1, 'Noun'],
    [honorifics, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  let abbreviations$1 = {};
  // add them to a future lexicon
  let lexicon$3 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations$1[w] = true;
      // future-lexicon
      lexicon$3[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$3[w] = [lexicon$3[w], a[1]];
      }
    });
  });

  // dashed prefixes that are not independent words
  //  'mid-century', 'pre-history'
  var prefixes = [
    'anti',
    'bi',
    'co',
    'contra',
    'de',
    'extra',
    'infra',
    'inter',
    'intra',
    'macro',
    'micro',
    'mis',
    'mono',
    'multi',
    'peri',
    'pre',
    'pro',
    'proto',
    'pseudo',
    're',
    'sub',
    'supra',
    'trans',
    'tri',
    'un',
    'out', //out-lived
    'ex',//ex-wife

    // 'counter',
    // 'mid',
    // 'out',
    // 'non',
    // 'over',
    // 'post',
    // 'semi',
    // 'super', //'super-cool'
    // 'ultra', //'ulta-cool'
    // 'under',
    // 'whole',
  ].reduce((h, str) => {
    h[str] = true;
    return h
  }, {});

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'
  var suffixes = {
    'like': true,
    'ish': true,
    'less': true,
    'able': true,
    'elect': true,
    'type': true,
    'designate': true,
    // 'fold':true,
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E
  let compact$1 = {
    '!': '??',
    '?': '????',
    '"': '??????"??????',
    "'": '???????????????',
    '-': '??????',
    a: '??????????????????????????????????????????????????????????????????????????????????????????????????????',
    b: '????????????????????????????????????????????????',
    c: '????????????????????????????????????????????????????????????',
    d: '????????????????????',
    e: '??????????????????????????????????????????????????????????????????????????????????????????????',
    f: '??????????????????',
    g: '??????????????????????????????',
    h: '??????????????????????????????????????????????????',
    I: '????????',
    i: '????????????????????????????????????????????????????????????',
    j: '??????????????????',
    k: '??????????????????????????????????????????????',
    l: '????????????????????????????????????????',
    m: '??????????????',
    n: '??????????????????????????????????????????????????????????????????????????????????',
    o: '??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????',
    p: '??????????????????????',
    q: '????',
    r: '??????????????????????????????????????????',
    s: '??????????????????????????????',
    t: '????????????????????????????????????????',
    u: '??????????????????????????????????????????????????????????????????????????????????????',
    v: '??????????',
    w: '????????????????????????????',
    x: '??????????????????????????',
    y: '??????????????????????????????????????????????????????????????????????????',
    z: '????????????????????????',
  };
  //decompress data into two hashes
  let unicode$2 = {};
  Object.keys(compact$1).forEach(function (k) {
    compact$1[k].split('').forEach(function (s) {
      unicode$2[s] = k;
    });
  });
  var unicode$3 = unicode$2;

  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7Bpunctuation%7D

  // punctuation to keep at start of word
  const prePunctuation = {
    '#': true, //#hastag
    '@': true, //@atmention
    '_': true,//underscore
    '??': true,
    // '+': true,//+4
    // '\\-',//-4  (escape)
    // '.',//.4
    // zero-width chars
    '\u200B': true,
    '\u200C': true,
    '\u200D': true,
    '\uFEFF': true
  };

  // punctuation to keep at end of word
  const postPunctuation = {
    '%': true,//88%
    '_': true,//underscore
    '??': true,//degrees, italian ordinal
    // '\'',// sometimes
    // zero-width chars
    '\u200B': true,
    '\u200C': true,
    '\u200D': true,
    '\uFEFF': true
  };

  const emoticons = {
    '<3': true,
    '</3': true,
    '<\\3': true,
    ':^P': true,
    ':^p': true,
    ':^O': true,
    ':^3': true,
  };

  var model$3 = {
    one: {
      aliases: aliases$1,
      abbreviations: abbreviations$1,
      prefixes,
      suffixes,
      prePunctuation,
      postPunctuation,
      lexicon: lexicon$3, //give this one forward
      unicode: unicode$3,
      emoticons
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['???]s$/

  const addAliases = function (term, world) {
    let str = term.normal || term.text || term.machine;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (aliases.hasOwnProperty(str)) {
      term.alias = term.alias || [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      let arr = str.split(hasSlash);
      // don't split urls and things
      if (arr.length <= 2) {
        arr.forEach(word => {
          word = word.trim();
          if (word !== '') {
            term.alias = term.alias || [];
            term.alias.push(word);
          }
        });
      }
    }
    // aliases for apostrophe-s
    // if (hasApostrophe.test(str)) {
    //   let main = str.replace(hasApostrophe, '').trim()
    //   term.alias = term.alias || []
    //   term.alias.push(main)
    // }
    return term
  };
  var alias = addAliases;

  const hasDash = /^\p{Letter}+-\p{Letter}+$/u;
  // 'machine' is a normalized form that looses human-readability
  const doMachine = function (term) {
    let str = term.implicit || term.normal || term.text;
    // remove apostrophes
    str = str.replace(/['???]s$/, '');
    str = str.replace(/s['???]$/, 's');
    //lookin'->looking (make it easier for conjugation)
    str = str.replace(/([aeiou][ktrp])in'$/, '$1ing');
    //turn re-enactment to reenactment
    if (hasDash.test(str)) {
      str = str.replace(/-/g, '');
    }
    //#tags, @mentions
    str = str.replace(/^[#@]/, '');
    if (str !== term.normal) {
      term.machine = str;
    }
  };
  var machine = doMachine;

  // sort words by frequency
  const freq = function (view) {
    let docs = view.docs;
    let counts = {};
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        let word = term.machine || term.normal;
        counts[word] = counts[word] || 0;
        counts[word] += 1;
      }
    }
    // add counts on each term
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        let word = term.machine || term.normal;
        term.freq = counts[word];
      }
    }
  };
  var freq$1 = freq;

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    let docs = view.document; //start from the actual-top
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        let term = docs[i][t];
        term.offset = {
          index: index,
          start: elapsed + term.pre.length,
          length: term.text.length,
        };
        elapsed += term.pre.length + term.text.length + term.post.length;
        index += 1;
      }
    }
  };


  var offset$1 = offset;

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    // console.log('reindex')
    let document = view.document;
    for (let n = 0; n < document.length; n += 1) {
      for (let i = 0; i < document[n].length; i += 1) {
        document[n][i].index = [n, i];
      }
    }
    // let ptrs = b.fullPointer
    // console.log(ptrs)
    // for (let i = 0; i < docs.length; i += 1) {
    //   const [n, start] = ptrs[i]
    //   for (let t = 0; t < docs[i].length; t += 1) {
    //     let term = docs[i][t]
    //     term.index = [n, start + t]
    //   }
    // }
  };

  var index$1 = index;

  const wordCount = function (view) {
    let n = 0;
    let docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        if (docs[i][t].normal === '') {
          continue //skip implicit words
        }
        n += 1;
        docs[i][t].wordCount = n;
      }
    }
  };

  var wordCount$1 = wordCount;

  // cheat-method for a quick loop
  const termLoop = function (view, fn) {
    let docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        fn(docs[i][t], view.world);
      }
    }
  };

  const methods$1 = {
    alias: (view) => termLoop(view, alias),
    machine: (view) => termLoop(view, machine),
    normal: (view) => termLoop(view, normal),
    freq: freq$1,
    offset: offset$1,
    index: index$1,
    wordCount: wordCount$1,
  };
  var compute$1 = methods$1;

  var tokenize = {
    compute: compute$1,
    methods: methods$2,
    model: model$3,
    hooks: ['alias', 'machine', 'index', 'id'],
  };

  // const plugin = function (world) {
  //   let { methods, model, parsers } = world
  //   Object.assign({}, methods, _methods)
  //   Object.assign(model, _model)
  //   methods.one.tokenize.fromString = tokenize
  //   parsers.push('normal')
  //   parsers.push('alias')
  //   parsers.push('machine')
  //   // extend View class
  //   // addMethods(View)
  // }
  // export default plugin

  // lookup last word in the type-ahead prefixes
  const typeahead$1 = function (view) {
    const prefixes = view.model.one.typeahead;
    const docs = view.docs;
    if (docs.length === 0 || Object.keys(prefixes).length === 0) {
      return
    }
    let lastPhrase = docs[docs.length - 1] || [];
    let lastTerm = lastPhrase[lastPhrase.length - 1];
    // if we've already put whitespace, end.
    if (lastTerm.post) {
      return
    }
    // if we found something
    if (prefixes.hasOwnProperty(lastTerm.normal)) {
      let found = prefixes[lastTerm.normal];
      // add full-word as an implicit result
      lastTerm.implicit = found;
      lastTerm.machine = found;
      lastTerm.typeahead = true;
      // tag it, as our assumed term
      if (view.compute.preTagger) {
        view.last().unTag('*').compute(['lexicon', 'preTagger']);
      }
    }
  };

  var compute = { typeahead: typeahead$1 };

  // assume any discovered prefixes
  const autoFill = function () {
    const docs = this.docs;
    if (docs.length === 0) {
      return this
    }
    let lastPhrase = docs[docs.length - 1] || [];
    let term = lastPhrase[lastPhrase.length - 1];
    if (term.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api$6 = function (View) {
    View.prototype.autoFill = autoFill;
  };
  var api$7 = api$6;

  // generate all the possible prefixes up-front
  const getPrefixes = function (arr, opts, world) {
    let index = {};
    let collisions = [];
    let existing = world.prefixes || {};
    arr.forEach((str) => {
      str = str.toLowerCase().trim();
      let max = str.length;
      if (opts.max && max > opts.max) {
        max = opts.max;
      }
      for (let size = opts.min; size < max; size += 1) {
        let prefix = str.substring(0, size);
        // ensure prefix is not a word
        if (opts.safe && world.model.one.lexicon.hasOwnProperty(prefix)) {
          continue
        }
        // does it already exist?
        if (existing.hasOwnProperty(prefix) === true) {
          collisions.push(prefix);
          continue
        }
        if (index.hasOwnProperty(prefix) === true) {
          collisions.push(prefix);
          continue
        }
        index[prefix] = str;
      }
    });
    // merge with existing prefixes
    index = Object.assign({}, existing, index);
    // remove ambiguous-prefixes
    collisions.forEach((str) => {
      delete index[str];
    });
    return index
  };

  var allPrefixes = getPrefixes;

  const isObject = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const defaults = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    let model = this.model();
    opts = Object.assign({}, defaults, opts);
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    let prefixes = allPrefixes(words, opts, this.world());
    // manually combine these with any existing prefixes
    Object.keys(prefixes).forEach(str => {
      // explode any overlaps
      if (model.one.typeahead.hasOwnProperty(str)) {
        delete model.one.typeahead[str];
        return
      }
      model.one.typeahead[str] = prefixes[str];
    });
    return this
  };

  var lib = {
    typeahead: prepare
  };

  const model$2 = {
    one: {
      typeahead: {} //set a blank key-val
    }
  };
  var typeahead = {
    model: model$2,
    api: api$7,
    lib,
    compute,
    hooks: ['typeahead']
  };

  // order here matters
  nlp$1.extend(change); //0kb
  nlp$1.extend(output); //0kb
  nlp$1.extend(match); //10kb
  nlp$1.extend(pointers); //2kb
  nlp$1.extend(tag); //2kb
  nlp$1.plugin(contractions$1); //~6kb
  nlp$1.extend(tokenize); //7kb
  nlp$1.plugin(cache$1); //~1kb
  nlp$1.extend(lookup); //7kb
  nlp$1.extend(typeahead); //1kb
  nlp$1.extend(lexicon$4); //1kb
  nlp$1.extend(sweep); //1kb

  // generated in ./lib/lexicon
  var lexData = {
    "Adjective": "true??0:B9;1:AQ;2:BK;3:A7;4:9P;5:AA;6:BF;7:BC;8:9Z;9:BB;A:BJ;B:AP;C:AN;D:AB;E:A9;F:B8;G:AT;H:AL;I:A2;aADb9Uc8Pd7Ve6Nf64g5Vh5Ii4Rj4Lk4Gl44m3Kn3Bo32p22qu1Xr1Fs0Tt0Du0BvVwSxQyPzM??g85??nL??K??J;ltim2BniAt84;bv6ti4B;gre7Jteg8;an8GeJoa0;lJn;adBTo1;eats5Noungu5Nuppie;aJen??fobo,od??;bouquA7r8J;eKiJorkaholic;ld5Jndsurf48;b45sleya7S;aWePiKoJulner9??AB;g4r2I;br5gMngaErLsKtJvo;al,orB;co1ionIto;il,t6M;ar40il5oC;lOnNrJtori4;dJgon94mel90s??t7K??diA;adeKeJ;!-esmeralda;!i8;cB9er9;ho,oz;i81lJs2z6;enDio1oC;ltraJnific9Hrba7Bsa0;paA1ss??83;aXeTira79oRrK??c82??J??xiA;mi0piA;aLiJ;ang68bu2Ql??ng8GstJunf4;e,on8M;diciona6AiLnJpac9Gt5;quiABsJ;ig3par3;dAW??o9D;c5lerJpo,t4;anD??v7;dBi8BmLnKrJ;no,r8C;de9It92;enDporI;gare2Jlen4Q;a01eTiQoLuJ??b6??r6??li0;ave,bli6Afo9Kjo,l,perJrpree69t6T;!fi42iAMpovoa0st9T;berba,ciMfLlJnh8Wrr0Csse76vi54z2I;iJ??2Q;dItI;isti9Fri0;a94??v7;le97mpKnJ;ce8g5M;les,??H;dOgNlvagem,melh5nKreJ;lepe,no;sJtiment4;aJ??v7;ci19to;re0uinD;entJutA7;o,??r6;d6g12l6Qpe82rc8AtisfJud9;aJei2;tA0z;aZeMiLoKuJ??51??gi0;de,im,s4A;b36m??nHxo;co,goCson7L;aSbel6YcQfi8Wg2ZincPjeiFlNno5JsJvolF;er68iLpJ;eitJo2Q;a0??v7;li3st3;aJev5igBuz3;p1xa0;id3;eJhonchu0ic5U;nDpE;is,lJ;!iJ;s93za0;bug84ci0Ldi5ivo3UncoCro,so,zo9;aLeJis3L;nDrJ;en4Ri0;dGlJ;ifi8Dquer;a0Ee07harmaceuHi05le3YoZrKuJ??stu1T??b9G;besc3ro;azeCeRiNoKud3??H??J;pr6spe8xi1Q;ble70dKfun0tet9BvJ;is??r1Z??v7;igBuE;mKncipa7VvJ;a0ileg5Q;eirJoC;a8To8T;cMgui4Doc0DpLsKtJveni0;ensio3Co;ente8Qidiar6taEun4B;aGot3;iJonce44;piFso;b8IdNlMnLp45rtugu26sJt3uc50;iEsJ;es8L??v7;deGtu4;u??0??4C??H;eCre;c5e5LoJ;n78r;ga5Sno1que4VrLsJ;a0sJ;im18oa7B;feLitone4sJturb6Y;ever5ist3picJ;az;ccion14i2;cLrale7WssKtrJ;on4;i87??v7;a2i3;bPcOdBesDficia3Qportun0ZrLtKuJ;sa0t8;im0X??r6;dKgJigin4;ani5Oul61;ei8inI;upa0;ce75e4IsJ;erv6Iti75;aQeMoKuJ;lo,meros47;b7Oj6NrJst??l6Bt9vo;m4te;cessLgJrvo1ur??H;ativ0LligenJro;ci9te;iF??r6;c0Zrcis0Itur4;aXeSiPoLuK??J??di3X??ni0B;giAxi0A;do,it3Xltim??d0Kndi4;deKl4JneJrt4ti45;t??r0I;rJs2;a0no;ma0nJst4Nxuru5N;ucB??scuJ;la;dCiXlMnLsJ;mo,quJ;in57;or,sa67tiC;anc??7Khor5B;du8gMi7Ijes1JlLnKrJu;avil57c5;d6Zho1;and8do1icBva0;n??49oa0ro;aSePiOoLuK??J??3V;ci2;t5Mx2G;ca2Li8nKuJ;co,v9;go;ber4mpo,n0terIv6R;al,do,gJn2tGve;al,??tiJ;mo;p??n6rJ;anja,go;aKeplJ;er0V;ntiKrdecJ;is6F;a32s6E;ei0XoMuJ;bi1IdKstJ;ic5Bo;ia;co1vJ;em,i4;de4g08l07m04nLrrJ;espoJiF;ns9;cZdXfWgUjToSquie2sPtJve3P;eJrome1E;i8lig3n1rJ;di2ess5nJ;aJo;!cJ;iona54;eKuJ;port9stent9;gu8nsa2;c3v4O;us2;lJra2??nuo;??s;ant2Fel0Ti7;eJivi1A??genas;ci1pe2U;oJr3Q;er3mpet3;bat3Oort4pJ??v7;arJerfei2oss3Nrevis3Nul5S;ci4;imiFu1I;nor5u4;aTeroiAiPoLumJ;anJil2Y;a,itIo;nLrrKsJ;pital4Ct21;oC??v7;es2or9ra0;drodin??1AlLpKstJ;??0N??1K;n??H??cri57;ari5??r6;bili2HrmonBvaJ;ia1S;aQenOig5lorBoMrJu09;aKossJ;ei8o;cBn2Jto,ve;r0sJ;to1;erJi4t1Mu??1L;aEo1;it3Vlante3Pna45;aYeUiRoOrJundamenta40??c1J??39??t1J;aJio,ustG;cLncJ;eJo,??s;sa;a44o;fo,rJ;mJte;id9o1;el,nJr0R??v7;anceirJgi0;a4Qo;de0Wio,lLminiKnomen4rJ;i0oz,tiliz5voC;na;iz;buKc3El1nJscin5;t31??H;lo1;du3Rfici3go4Al0Mmp0Kn0Dpid??r0Cqu0ArGsRuPxJ;cNig3pMtJ;ern0SrJ;aordinIoverJ;ti0;eri3lo4E;el3iF;f??Jropeu;riA;bel2c00foZlav??n6pOtJ;aMouGrKudB??v7??J;pi0;anJe3E;geir0Jho;dua33;aReLirJl??01ont??neo;itJ;uo1;cMrKtacJ;ular;anJto;??o1;iaJ??13;is,l;nJ??o1;hol,to1;m23rS;lare0Lu8;eJi0H;st3L;miA;cantadoOgraNorMtJ;eKusiasJ;ma0;ndi0;me;??a0;!r;en0HolgaJ;do,nD;eK??tJ;ri1M;g5itoJ;ra2A;eTiLoKuJ;ro,vi0E;ce,enDuG;f??cPgOre30sMverK??riJ;a,o;sJti0;os;cipli2Dpon0ZsimuJtW;la0;no;il;boc00c3di28li28nZpXsJtermi29;aUconQeOlMmotiLoJporE;beJnes2;di3;va0;eJumbr5;al,ixa0;ja0nvol2quiJspeG;libG;fLheKtJ;ra??0;ci0;ia0;fi19grad9peJ;ga0;eJres2L;nd3;go1igraE;ha0;a0De0Bh06i03la8oRrMuJ??Q??mo0;idaKl2rJ;io1to;do1;iKonoestratigr??Ju7??H;fiA;aEog??KtJ;erB;niA;er3mNnMrKvarJ;de;aJdi4re2;jo1;fi5tempor??nea,veni3;ov3pMuJ;m,nJ;iJs;caEtI;etKle2orFrJul1Z;een1Yi0;enDiE;nz0Qum0QvilJ;!iJ;za0;aLeiKiqJ;ue;o,ro1;rJto;mo1;r2ssJ;??v7;lRnsaQpaOrKstanJtiv5;ho;enDiJo;do1nKoRsJ;m??H;ho1;ciFzJ;!es;do,ti1F;mo,oC;aXeWiToPrL??J;siJ;ca;aLiKonzJu2;ea0;lh5ncalh11;nAsilYvo;mKnJ;do1i2;!bJ;??sH;camar4ol??JrrVsbilhotT;giA;al;lo,s0Q;iLrKtalhJ;ad17;a2ulhP;on0Rxo;ber2c10d0XfasFg0Pl0Im09n03pZrrog5sserEtQutOvKzJ;e0ul;arLenturJ;ei8;ro;en2;oritI??nH;??r6;eNrKuaJ;is;a3eJ;vi0;enD;ncB;ti0G;anD;te;aixoLliKreJ;ssa0;ca0;na0;imMsBtJ;eri0IiJ;gJp??H;a,o04;a0??sH;tiA;aNbKig9oC;ro1;icB;io1;so;do,rJ;eKguG;ra0;lo;eMoc9tJ;iTo,ruJ;??sJ;ta;gKmJ;??o;re;rKuiarJ;ense;ad9esK??colaJ;!s;siJ;vo;ta0;do;mir9or9;??v7;el;et??NolhLusatJ;??r6;io;edJ;or;liA;co;to",
    "Noun": "true??0:CT;1:D3;2:CP;3:CS;4:D7;5:D5;6:D9;7:CJ;8:CW;9:A7;A:CZ;B:CL;C:BV;D:D2;E:C2;F:AV;G:CI;H:8U;I:D6;aBVbBIc8Wd82e6Yf6Bg5Zh5Ti59j52l4Pm3Vn3Mo3Ap20qu1Xr17s0Jt02uYvMzoAQ??K??m5U??poBJ??ndiJ??rg0;ce,o;g4Plco6DrJ;ea,vo4A;aSePiLoJ??tiAB;lJntaDAt6Cz;ta,u91;aLdKla,nEol??BsJt5RzinE;iC??o;a,ro;!gH;loAWnKrJstiAz,??8O;e9Ms0??o;da9Wto;lJnt4Jri3;e,or;niKsJtilizaC1;o,uCP;dJversCV??o;aCWo;aYeQiPoNrJur3Y??AK;aKibunC2oJ;ca,pa;balh5Hd9GnsJta0B;fo4Wpor5;m,rJ;no,re;a,me,o,po,ro;at9cPleOmMnLor4rJs5xto9H;mo,rJ;a,eBXit0R;d??BtaBZ;a,pJ;e3Yo;fone,v7A;iAnolog4;be7YmanErefa,xa;a04eTiRoMuL??K??J??c2;mboA3t2;cuA2r6E;bs9Ac8Lj6Uperf??c6Drpre9O;cie8lMmLnKrJ;riIte;ho,o;!b6;!daAo,u??0;l??nc2nJste0Ytu3;al,dica1;cRde,guOlec??0ma9EnKq8BrviBLss0xJ;o,tP;adoBYhorLs3tJ;enGiJ;do,mD;!a;ndKrJ;anGo;a-f50;retJ??0;ar4??r2;l69nJu8??7??BS;gAIto;a05eMiKoJua,??d2;cA0da,mance,s1u5J;o,sJt2S;co,o;aZcYdXfWgUiTlQn7pOsLtra1u1OvJ;isJol7R;ta,??o;erAZi59ol7PpJto,ul6V;ei1oJ;nsa0PsC;ort2YresentaJ??bli9K;n5??0;aJigi0;tJ??0;??r2;!no;iJra;me,??o;e7Lor88;e,u??0;eiCurI;c??0liJ;daB4z3;iKmo,paJto,z0??a;ri5Sz;n9Co,z;aKeJil??89;da,st0;d9li8nti8;a0Je0Bint0Alan09o02rJublA1??gi88??o,??;aZeWiVoK??8J??J??nci3M;d2m2;cRduPfOgraNj9OpLteKvJ;a,??B;c??0s1;osCrieJ??si1;daAQtAH;ma7J;essFi7E;toJ??0;!r,s;eJu6;dAOsI;meiro-minist9n14s0vatiz3;feit8Cju??zo,ocup3sJ??o;enGidJo,s0;en5??B;ia,zJ??a;er,o;eOl??NntMpul3rt7YsJtenci9Lvo;i??0sJ;e,iJ;bili8;a,e,o73;c4ti8C;ma,s4ta;eCo70ta;or,u6;dPiOle,nNrKsJtr??0D??a;co9Lo,qui7Gsoa;da,gunCi9Cna,sJtencA9??oA;onaJpec9G;gHli8;a,s6M;to,xe;a9FiAra;dr6Yg6JiQlPpOrLssKtrJu,z,??s;im??n2??o;agHe2o;!e9Tl6Gq8KtJ??grafo;e,iJ??cu5B;cip3d7C;a,el;av6??c2;!x0;bQcasi0lEmb9n7pNrKsIuJvo;ro,tub9;dHganiKiJ??68;e8NgH;s0Nz3;er3iKoJ??0;rtuni8s65;ni0;jeKrJserv3;a68ig3;ctJti35;i34o;aQeOoLuvH??v7Y??J;cJme9;leo;i5me7KrKtJvi8;a,??c4;des5ma;cessi8gJto;oci3??c2;da,sc97tur7Cv2??0;a07eWiSoOuL??qui6D??K??J??s,??si76;di79toA;e,o;d5Blh6HnJseu;do,iJ;c??p2;dLe7mDntKr5tJv90??a;i2Nor;an75e;a,e6Jo;lLnJss0;a,istJu1;ro,??r2;h3Dit3D;canRdPmOnNrcaAsLtJ;aJro;de,l;a,tJ;re;in64s01;b9??r4;iJo;ci5Rda;isJ;mo;dMi5RnLrKs5QtJ;eri7K??r4;!c2JgHiAqu??s;da1ei6h??,ifest3;ei6ruga7;aUeRiNo0KuM??L??J;d5PngJ;ua;b2gri55;a,c9g2Sta,z;ber8der4Fga75mi5nKsCteJv9;ra8D;guJha;agH;iJs5t6;!tJ;e,or,u6;do,n??4J;aOei1oKuJ;iz,lg4HnCro,stiGven6J;gKrnalJ;!isC;adorJo;!es;ne38rdim;d01gre00l5ZmWnKrm??J;!o;dTfQgl??s,iPstNteLveJ??c2;r6XstiJ;g3mD;n??0rJ;es6PiFpret3ve68;aJitu43r6G;l3n5;cia6Umi6P;lKoJ;rm3;a??0u??B;epend??Biv??duo,??str4;agHpJ;ac1oKreJ??r2;n4Lss0;r46s1;ja;a75e4;abitan5iMoK??J;bi1;mHn6rJspit6At5P;a,izon5??r2;p??te67stJ;??r4;aTePoMrKuJ??s,??ne9;ar7er6;aJe66i1upo;u,??a;lKs1vernJ;adFo;pe;nLrKstJ;o,??o;a??0en5;er5Wte;bine5do,rant4to;a03e00iXlorWoTrQuK??bri4Q??J??rmu25;!r4;nLtJ;ebJu9;ol;cionKdJ??0;a??0o;amD??r2;a5LeKontJu1;ei6;gues4n5q2K;go,l4Mme,n5rJtograf4;maJ??a;!??0;!esC;gu6lKm,naJo;l,nci2T;h3Qme,osof4;der3iKn??me5Gr9stJ;a,iv5B;ra,to;cJi40lCm??l4se,vFzen7;e,tFul8;conom4d0Jf0Ile0Hm0En0Bquip09r9sUtaTvSxJ;a1Qcep??0ePiOpKteJ??rci1;ns0riF;a0ZeLlKoJre2M;rt3s2J;ic3or3;cta58r22;st??B;cutiJmp3Hrc0D;vo;en1ol1V;pa;cTfor55pOquer7tJ;aMi3CrJud2D;aKeJuc5W;i1la;da,ng0Lt??g4;bel5Ldo,??0;a4ZeK??cJ??ri1;ie;cKlEraJ;!nG;ial2Et??0X;aLolKritJ;a,or;a,ha;da,la;aJe;!mD;cont9erg4genh08si4ItJ;i8rJ;a7ev25;o??0preJ;go,sJ;a,??r2;i??0mDvaA;ei1;iJuc3;fJ??0;??c2;a0Be01iNoMroL??ca7??K??lJ??K;ar;vi7;ga;c3QenGm??n2n2Cr,utF;aVfUmeTnhSrPsKvJ??lo40;is0;cLpos1CtJ;riJ??B;bu1Ato;o,uJ;rIss0;eJig4Q;cJi1;tF??0;ei9;ns0;erenGicul8;!bo;ba5cRdo,fQmocrac4nPpNrroCsJus;af2eKign3pe1OtJ;aq31i3M;jo,mpenEnJr1;ho,volv4C;art0UuJ;taA;ominaAte;e1Hin0S;is0lar3;do,nGta;a1De17h14i0Zl0WoRrOuM??lL??ma6??o,??J??rL??di3B;luJu;la;cu1O;idaAlJrIs1;pa,tu6;esc3ZiJuz,??di1??1I;aJme,se,t??r2;nG??0;isa0Ml0Km08nQpa,rLstJzin23;a,uJ;me;!aLda,on2CpKrJte;edFi7;o,us;gH??0;em;cYd08fVgrUh3Njun1sNtJver0X;aLeKin3Qo,rJ;ac1ole,??r2;x1??A;!c1;cOeMtKumJ;idFo;itu01rJ;u??0;lEqJ;u??B;i??B;esI;eKiJli1;anG;r??B;eJlus0urI;i1lEp??0;andTba5iSpKuniJ??rc2;c3da31;anhPetOlexo,oLrKutJ;adF;a,imDomisI;n34rtKsJ;i??0to;amD;i??0;ei9ia;ss0;an5o;eJu01??g2;c??0ga;!s;assKiJube;en5ma;e,if1P;c0AdadMentLgar9ma,neKrcunsJ??B;t??B;ma;isC;e,??o;aKeJu1V??o;fe,ga7i9;ma7p??u,ve;nJrt0L;a,tJ??r2;eLro,??J;met9;ro;na;b07dei06f??,i05lFm01nZpUrNsLtegKuJvaW;sa;or4;aJo,teT;!l,mD;aNgMne,rLtKvalE??ctJ;er;a,??o;ei6o;a,o;!cter??sJ;tiZ;aMitL??J;tuJ;lo;al,??o;ci8;al,didatJto,??0;o,u6;aKinEpJ;anXeona1o;!da;or;xa;a,ra;eJo;lo,??a;aPelOicEloNoKra0XusJ;ca;caKlJ;a,sa;!do;co;eza;nMrLseKtalJ;ha;!aA;co,ro;co,dJ;a,ei6;ber1Dc0Vd0Rg0Pju7l0Dm0Bn08p02rXsUtQuLvJ;ali3eJi0??;!ni7;la,mDs??BtJ;arqu4oJ;m??vKrJ;!es,i8;el;aqLeKiJ;tu0T;n??0;ue;a,pKsJ;emble4ociaRun1;ec1;!gMma,quitec0YtJ;e,iJ;go,sC;ta;umD;arelElMo2rJto;eseKovaJ;do,??0;nt3;ic3;ho;imKo,??liJ;se;al;bi0GeaGiJor;go;de4egr4iQmOtKuJ;no;erJu6;a??0naJ;tiJ;va;a,oJ;??o;aJmD;do,nG;??a;da;en5ricul06??B;nc4;ministr3vJ;ersJogaA;??r2;io;adem4esIidWoQtJ??0;ivMoLu3;a??0;??o;!r;i8o;daJ;de;ntKrA;do;ecJ;imD;en1;to;en5;te;so;ia;tu6;ra",
    "Adverb": "true??0:0Z;a0Tb0Rc0Jd07e01f00grand0Ohoje,iWjVlSmOnMoLpEquDrCs5t2u1;ltim0nA;a1o6u6??o;m1n0Dr19;b??m,pouF;alvo,e5im4o1??;brem1m0U;anei13o1;do;!plesm0Rultane0;gur0lvat1mpre,n??o;ic0;ar0eaY;ase,i????;er02o4r1;ese08i2o1;fund0posit7vaJ;mDncipaT;r2ssiHu1;co;qu??,ventu0Q;n0Hutro0P;aturaOenh0Kome1;ad0;a3e2ui1;!to;io,nos;is,l;evWi1onge,??;g1vrV;eir0;amais,??;mediat0n1;c1tens0;l6ontesta1;veB;elizm00inaAo0A;fet5n4x1;c1trem0;ess3l1;us2;fim,tremeD;iv0;aBe5i2o1;n04rav05;a2fici1;lmQ;n03ri0;ba5cer4fron02ma2ntro,pressa,trTv1;agar,erK;is,siad1;amLo;to;iZlV;ntQ;alm0e7lar0o1??;m5n1rajos0;comita2se1;gui1que1;nt1;emC;plet0umB;do,rt0;astMem,reve1;!m8;baiNcMdIfGgoHinda,lBmAnt5onJpen4qu3ss2tr1vK??;av??s,??s;az,im;i,??m;as;e3ig0;am1;enE;on1s;tem;anh??,i??9;erta,g3h2i1;??s;ur2;o,ur1;es;inal,o1;ra;i2re1;de;an1;te;aso,ima,ol??;xo",
    "Infinitive": "true??0:0MC;1:0LV;2:0M0;3:0JR;4:0JD;5:0L8;6:0LI;7:0LT;8:0LO;9:0K3;A:0LG;B:0KI;C:0LJ;D:0LL;E:0FV;F:0HW;G:0B2;H:0FJ;I:0JI;a0C5b0ALc04DdWVeOTfN0gM3hLNiIUjILlHLmFQnFAoEDp9Yqu9Sr5As2Kt0Vu0LvSxOzJ;aLeDGiguezag0BPoKuJ;mb1n1r03P;ar,mb0;nJrp0;g0z0;avLSerKingJ;ar,u0GE;et0ocJ;ar,oI3;a04eWiMoKulJ;gar7Lnera04B;ar,cif7ej0g0lJm8t0ze0;it0tD5v2;aRbr0cQdr0gPlipen0BKnOol0KHr0BZsMtLvJziC??0;eJif4;nG1r;al3im0o0HMup7;ar,iJlum00Eto0HLu05N;on0t0;c0BHdi07Yg0;er,i04Jor0;ej0i0;b07Uj0;d0g0HGic0JIlN1nNrJst1t0x0;!bLdKe0gaYCif4mJsN0t2;eBin0;a0KBej0;al3er0;c2d0EQer0iaKtJ;ar,il0;g0l3;ciOdi0gMi0lLmp0KYnglo0H7p0CIrJscuBticAz0;ar,ej0iJr2;ar,eg0;ar,er,id0or0HL;aJir,ue0;bundFr;l0n0;f0CDiv0lPmed6nMrLsJt07E;ar,uJ;fY9rp0;bY4d1g1in0r0;g1h0iJt0;fJr,vers04X;ic0orm3;c7tJul0;im0raJ;j0pa0GC;a12e0Ti0No0FrNuJ;f0mLn0rKtJ;el0or0;b0v0;ef09Zul05M;aSeOiMoKuJ;c01Tf0nc0;ar,c0mb0n0pJt0u??0v0F7??0;e??0ic0;bBFc0KZl0F0n0HLpJtDunf0;l4u0AB;beBin0l2mKn0p0ECsJ;a0DPpa0FZva0GE;eJul0;lHJr;baBcHdHIfZg0ir,j0lh0m071nOpaB2quMsLtFuKvJz2??0;ar,e0FV;m0ELte0;bo0IJl0CPpa0FT;e0CViJ;n0t0BJ;caSqu06JsJ??0;aCGbo0IFcQfOgrXViNlMmLpJto03Zud0vas0;aJir0la5or05D;r6ss0;it1uY6;ad0it7uz1;g1t0;er1igDo01GuJ;g1nd1s0;e0DBoHDr06H;fi0r;eg0ic0;ar,caPi08RlOmNnMp0rKsJt03Vuc0;ar,cAHq03Ws1t0;c2nFpe08RrJtD;ar,ef093;if4te0;ar,b0;d0er0h2;i0r;c0li5nNpGrKsn0tuJ;be0l0;aKit0oJ;cAne0te0;n3r;g1ir;cQim0lePmNnMor3rLsJ;ar,oDtJ;ar,emuCif4;!give046mA??0;ci9d2tF;er,pJ;er0or3;f9v0E0;er,l0;cMgar0IBl0DPmpLnKpFrJtJJx0;a0JQd0j0tamu085;ar,geUF;ar,on0;ar,h0te0;a1Te1Ei16nO2o0GuJ;a0Eb00cZfYgWic009jVlc0mUng0pPrNsJtD;c8pKsuSOtJ;ar,e0HD;eJir0;it0nd2;d1f0g1pree0CArJt1;ar,iF3uF3;erLlKor043riJ;m1r;a5e0B5icZJ;aJest0BWin03l0J8p0D4visN8;bu0C0r;a0EOir;ar,e8;ar,eJ;r1s02X;oc0rSI;ed2umb1;-r0J8div04GeUir,jDYlSmQorPp0CWsKt2FveJ;n0GYrt2;crMiLtJum1;aJi029;b7ZnE;di0st1;ev2it0;dAn0;eJin0FZ;rg1t2;ev0iJoc0;m0nh0;nJst0BC;te0BK;r,v3;ar,b00cZerYfVjDJlPmOnNpMrKss0I2tJv0??oWW;eRRop0CG;r1tJv2;e0ir;es0it0r0;ar,d0eg0h0;ar,b09S;aNd0eMfHiKt0uJv2;ci9??0;c8dJ;ar3Mif4;n3tr0v0;p0r;isKreJ;ar,n0r;m0t4;!gu2;ar,i01OoF3;ej0p0BZrJ;ar,eJ;carr0HIlev0n0A0pNsKvJ;iWFo0;cr042sJt0;aJer;ir,lt0;or,uj0;ar,b0BVgnGlPmNnKste0A3tJ;i0u0;al0DSgKtJ;et3on3;r0ulJS;bBCpJul0;at3lG;ab0enEv0;cWdUgRlPmeOnMpLq9MrKvJ;ar,iE;!en0i0pe91r0v1;ar0u07R;ho08Ws02HtJ;ar,enEir;ar,lh0nt0;ar,eJ;c01Kt0;ar,me5reKuJ;ir,nd0r0;d0g0;ar,iJuz1;ar,me5;ar,ci9i9r0CSu0A2;bVcSf0gr0ir,lOmb0nNpMq06DraLtJud0z9;iJur0;r3sf061;co05Lr;a05Ke0DQ;ar,ci9e0gr0tG;d0g0iLp4tKud0vaJ;gua0EUr;ar,e0it0;e5v0;aKh0i0olHrJud1;a08Tif4;ne0r;atAer,oJ;re0t0;a3QeWiUoMuJ;ar,bKfZBgi09UiQGmJt0AS;ar,in0orH;or3r4;bPc0dOer,g0j0l0mMn04XsKtJub0xe0??0;ar,e0ul0;et0n0tJ;e0i0GP;anJp2;ce0t3;ar,e0oCA;or0ust6;bo04Ecoche04Xdic63f0m0nJp0r,sc0tm0v001??0;ch0gJH;a35b30c2Ed2Be27f1Wg1Ni1Lj1Jl1Cm15n12o10p0Oqu0Lr,s03tRun1vKzJ;ar,i035;alX4eMiLoJ;ar,g0lJ;t0u0EAv2;d0g0AHr062s0F0v2;l0nKrJst1z0;!b7d6enEt2;d2ir;aSeRiQoOrJu043;aRTiQWoJuc0;aLced2grKtJ;ra1;ad0ed1;g1r;c0m0rJ;c2n0qu1;f4n1r0;r,s0;lJrd0;h0i0;cZeYfWgViUmu02LoTJpRsNtKuJv0EI;lt0m1;aKiZ4rJ;i0CPutD;b4Tr,ur0;aLeKoVJuJ;m0rg1sc8;c0nt1qu1;bi0ir,lZ4rc1;aT2e8iKlJUonJ;d2sab01G;g0ng0r0;d1gn0st1;at0ua0DA;olJri0;eg0g0;nh0rv0;e08AiQQ;eKiJ;nt0r1s8;br0r2st0;aTeSiRl4oPrKt0uJ;bl4di0gn0ls0t0x0;eLiKoJ;ch0dBVv0;m1s0;e081sJ;ar,e6J;l1nt0rZUsJus0;i0D0t0;c0nt0s0;l1ns0rcVUt1;r065ss0;cROrJuv1;gRLie5;aKd07Teg0g040h1oJunE;me0v0;sc2v0EA;aMeLiKoJun7;d0DEer,nt0rNAst0v2??0;r,t1;dUZm08Wnd0ss0t2x2;nJr,t0;ch0eJ;j0sc2;aLeKin01YuJ;t0z1;g0mSUr,v0;ci9mpKnJr,t0x0;ce0D7??0;aJe06M;dHg03Kr;e8uJ;b08Dvene0BG;f4mpr6FnJt7vind4;ar,cZRiEteYBve5;aQePiOoNrMuJ;laJrg8;me5rJ;!iz0;ar,e2B;ug0zij0;me5st09P;n7r;l0nh0r,te0??0;az2eRin0lOoMrLuJ;gJlg1t0;ar,iT2;at0e069ig7;g0rJ;m03C??0;eKorJu1;e0AXir;ct1t1xi9;rJst0CF;e06Kir;diNWlQ2mbols0nKrgu2sJxpQZ;crZStrutD;cJtr0vi0;amiConI;arOEiKoRXuJ;nd0z1;g1m1re0BJz2;a02e00hZiYlXoNrKuJ;ar,p7s0;eERiKuJ;de0AJt0;ar,mA;br04QlRmOnKp07ErJst0;d0r2t0;ci03GdLfo0BIh6qWXsJt0v1;id7tJ;iWMru1;i0B8uz1;eKpJ;ens0or;nd0??0;h2oc0;am0in0us0;cl0prM3t0;a??0e0;ar,b2it0nJpVI;d2se0;ir,lcJmbi0pit0AKv0;ar,iI;aMeLoKuJ;sc0??0;ar,c0l047;l0nt0;ix0t2;bOce05PdNfiTSg1lMn05GpLssum1t5FvJ;er,iJ;ar,r,v0;ar6rese5;iz0oc0??0;m17q09M;il8r1;bi0B2cQdiPf0iJUj0lOmNng2p0BBreMsJtEOzo0??o0;ar,cKg0p0tJur0;e04Pre0;ar,uC;ar,f01C;aBif4;ar,e0h0;ar,ca0A1;h0ioJ;cAn0;aMeKiJ;c0et0t0z06A;bra0A6d0iJr057sW3;m0x0;drJlGntGr0;ar,u5I;a35e27i1Zl1Wo1JrNuJ??r;bl4gn0ir,lLnKrJtref00Zx0;g0if4;ci9g1ir;ar,s0ul0vZC;a1Ce0Ei0CoLuK??-J;coziClQY;ir,r1;blem05Rc06d05f03g00ib1jeZlYmXnWpPrr0C5sNtLvJ;ar,er,iJoc0;dVXr;eJocGGra1;g2l0st0;ar,crXVe0p7seMKtJ;eV4iV3r0;aNeMiLorKuJ;gn0lsFP;!ci9;ci0n0;l1nd2;gaJl0;n002r;tGunE;et2ov2uM3;at0if7oY8;ct0t0;noMWrJ;am0eJ;d1ss0;an0eJl084u045;r1ssE1t3;iga08Xuz1;eKl063rJur0;astAi0;d2ss0;m0nci6Xor3vJ;ar,ileNJ;ar,c0Bd08e06f04g02jud4l01mZnYoXpVsPteMvJz0;aKeJ;n1r;l6r4;j0nd2rJxt0;ir,mJnat42;it1;ar,cNeLid1sKtJum1;ar,iNA;aN9eCLi9up04R;nJrv0;ci0tCW;iM5rWV;ar0oJ;nd7r;cNGrd041;d03Ms0unE;eJi0un1;d8r;e08Kib0uZY;ar,o0uJ;i??0nt0;aEer1iJ;gDx0;nch2stabJ;el6;eKiJomA;c0sp049z2;stAtermA;aMeLiKonJ;c03Liz0;p8s0;d2iUQ;t0v2;gJnYMt4zenYM;ar,uH;d032eUit0lSnRpQrPsKtencV9uJvo0;p0s0;ar,iMp03YsKtJ;ar,e05Qul0;ar,ibiliJu1;t0z0;ci9t079;ej0fi0men00Qt0;ulBX;d7t9Q;ar3emiJi34u1viB;c0z0;r,t05R;aJeiY7urTB;gi0in0nJsm0;ar,e01Vh1if4tF;ar,c03Pf0g01KlPnNor0pMrKsJt0;ar,c0oY3;aJu055;mb0r,te0;il0oc0;ar,cJg0ic0taWD;el0h0;ar,h0ot0;ar,c0Fd0Eg0iN3jC6l0Dn08rQsMtJ;iKrJ;eWRif4;ci9sc0;ar,cKg0p08Tqu03MsoSWtJ;anH;ar,oJ;ce0;aQScZdYeXfVgu5iUmTnSor0pPq067sKtJu0veS5;enc2u00C;crMeLiKonJuLP;al3if4;gn0st1;gu1v7;ut0;a044eJ;nd00JtJ;r0u0;e0o8;an6e0it1ut0;cl8g0;az2eiJil02Wu073;ci9??o0;c2grAr86;er,o0ur0;ar,eb2o5Qut1;a06DdLeKh02XitSSs0teJ;ar,lh0;ir0tr0;er,uJ;l0r0;ar,e00R;al0ir;ar,hinVWuAJ;c09d08g07ir0je0l04n060p01qu7rSsNtKuK4vJ;i00Done0;eKin0rJ;ocAuB;ar,nWUt0;c2m0sKtJ;ar,orF;aJe0;ge0j0mZ5rJtempe0;!iC;aPeVGir,lameOoNtJ??0;ej0iJ;cJlh0r;iJulA6;on0p0;di0l0;ntF;ben3fJl02Bme5r,s8;ra04Jus0;aJe0oc0;gJrWW;ai0ue0;avZ9eKi0mJpU4r0;ar,e0iB;ar,sI;ar,oWB;ec2rV1;if4tu0;b05c03di0f00jV1lZmXnVpSrOsMt22uLvaKxiJ;d0g011;ci9r;rFMs0to03Cv1;cJte5;il0ul0;ar,den01LgLiKl0naPIqJtP7vaB??0;uesI;e5gA;an3uB;er0in0orKrJt0;im1;!tun3;dJer0;e0ul0;bYOiJ;n0t1;e0faVPh0vO0;eJiciQSu05P;g0nd2rJ;e19t0;aZVo44uJ;lt0p0;c6GdDeRjetQlit7nub013r98sLtJvi0;eJur0;mp7r;cur6eMtJ;aKin0rJ;i03Wu1;cul3r;cr0d0qQIrv0;ar,iv0;d6r0;aUeQiPoKuJ;bl0lGm7tr1;iv0mVCrLtJ;aORiJ;ci0f4;maJte0;l3t3;n0v059;cKgJutrQ5vYS;aUJligQMoErH;ess8roJ;p00Ns0;c4Ld0mor9Xn0rr0sLtKuJv05Y;frFWse0;urPZ;al3c2;a0Oe0Ci05oQuJ;d0g1ltNmGnLrKss8tJ;il0u0;ar,ch0mD;g1iJ;ci0r;ar,iJ;pl4;bilWch0dTer,f0lSnQqVArMsLtKurHvJ;er,iY0;ej0iv0;c0tr0;a03OdKn0rJs05ItG;a??0er;er,iJ;c0sc0;d0g2it04opJt0;ol3;d00Me030h0;eJif4oF1ul0;l0rJ;ar,n3;ar,h0i01Y;ar,ct0gr0j0mOnLr01BsJt02Ix0;cigZ1er0tJ;if4ur0;ar,gu0iKor0uJ;ci0t0;m3sI;ar,o023;ar,dSlRmQnNrLsKtJxUG;amorfo021er,rG;cl0quiCtURur0;c0eJguB;c2nd0;ci9d026e0osKsJtAZ;tru0ur0;cab0prez0;or01A;ar,hZHinCG;iJr0;ar,caN6r,t0;c06d04g02is-qU1jZElYmXnSpe0quiRrPsLtKxJ??KK;im3;ar,eriOPiz0rWOu03Q;cB5sKtJ;ig0uW8;aJif4;cr0ge0;aviBcZ1eX6ge0id0oSXr0tJ;el0ir3;ar,lYZn0;ar,cYYdMeX3g0iLj0oJ8quKt2uJ;fatDse0;ej0it02L;et0fe01Zp02F;ar,ria04X;ar,parW5;anBXbar032dKeJh0iEoORqTLtr032uc0;ar,fiE;ar,iJ;z2??o0;ic0nJo0;et3if4;e03UrJur00Q;ug0;aqTOer0hRCul0;a02eXiPoLuJ;brGcr0dibZZf0sJt0x0z1;itH5tr0;ar,br017cLgr0mb0nKr04FtFuvaJ;miCr;dVQgiX5;a01Zomov2uplZV;ar,bOcODdNg0mMnLquKsJtigKLvr0x0;onje0tZV;efT4idQW;d0guUA;ar,it0p0;ar,er0;ar,erJr0;a01Rt0;ci9gLmIEn1rKs83tGvJ;a01Zed0it0;!de0;a01NiJ;sl0tWN;bXcVdUgrim52mSnQpKPqT3rOsMtKuVBvJx0??0;ar,or0r0;eJir;j0r;c0s0tJ;im0rF;aJg0;pi0;cJh0??0;e0h0in0;bJe5in0uZ6;ar,eIQi024uz0;e0r0;ar,er0rJt0;ar,im4O;or0ut0;aQeju0oOuJ;bXHdi0gSXlg0nMraLFstJ;aKiJ;f4??0;pXAr;c0g1t0;e02Lg0rJ;naRTr0;ct0nt0z2;d29g28l25m1KnMrKsJt7??0;c0e5ol0;!ar,iNHmU2on3rJ;aSJiAUomp2;a1Fc13d0YebYNf0Pg0Oi0Nj0Lo0Jqu0Hs08tQuPvJ??0;aNeKiJoc0;abOZt0;ct00Dj0ntarKrJsti8E;n0t2;!i0;d1lJQ;m0nd0tOU;eOiNox4rKuJ;ir,meZZ;ig0oJuj0;dJmNK;uz1;c0mW7t00D;gPGir0nTrJ;aRcOdiLQeXTfSYlZImeNn0pMroLvJ;al0erJir;!t2;g0mp2;el0oTUrY5;di0t2;al0eKoJ;rr2;d2pt0;g1tu0;ci9d2sP3t0;cQerE3iPpOtKuJ;fl0lt0rg1;aLiKruJ;ir,menDN;g0l0tu1;l0r,ur0;e008ir0;nu0st1;rOAulp1;er1iJ;et0n0r1;cJv0;e5ul0;et0uJ;ng1ri0;b1cN5;er1les0reX2;aQeMiLlJoIYriYWuDB;aJe23ig1uM1;m0r;lIrm0;cLl3LrJst0t0;iJnXS;or3r;ci9i9t0;m0rt0;ag0eMiKuJ;lt0stX6z1;cHXgJspVJvidZ9;it0n0;fRTn3;aTenRh0iQlPoMrLuJ;b0lJmb1t1;c0p0;eTDimA;mod0nstitucKrJ;pVMr2;ionKY;in0u1;d1n7t0;dJs0tYM;er,i0;ndeYCpac8;bRdimYLl0ugD;a02b01er00iZoYpKuJ;n3t0;aUeSiY3lRoNrKuJ;gn0ls54t0;eKim1oJ;b0vVC;c0gn0ns0sTR;rKssibJ;il8;!tJ;ar,un0;a5eSSic0o3J;d1l1nd2rJtr0;ar,fe00ImeaIV;cJr;ie5t0;bMNl0rtKB;scu1tS2;ec2g1;r4u1;gAnt0;h0iKuJ;d1mAsI;b0d1;nUQuZ7;eJolaI;aY4ntG;aVeUiRoKumJ;anWEiB;mNnMrLsJ;pJtM9;ed0itJW;rR4t0;eXFr0;enMOizi0oJ;gene3l00G;beJKerarUGpJstoVP;not3otJ;ec0;bVNrd0s8;biJrmNCsOJur1v2;l8tJ;ar,u0;a08e01i00loZoWrNuJ;arLerRCiJst0;ar,nJs0;ch0d0;d0n6;aLiKuJ;d0nh1p0;f0t0;cHdNf0mMnLsKtJvM0;if4ul0;n0s0;ar,je0;ar,pe0;e0u0;lKrJst0tHveIZz0;ar,golHje0;e0f0pe0;riTWs0;ng0r0z0;ar,l0mOnMrLsJ;s0tiJ;cX0on0;ar,enEir,mA;erIXufleJ;ct1;er,in0;b0f0guHlMm0nGCrKst0tiCzeJ;ar,te0;aJf0gaBoXYr1;nt1tD5;aJg0opF;nNLrJ;!do0;a0We0Pi0Kl0Ao01rSuJ;gQElPmNnLrXSsKtJx4zT2??0;r4ur0;i9tVS;ci9dJg0;aGWe0ir;aJeg0;rOO??0;gJmA;ir,ur0;aMeLiKuJ;ir,sItG;cWQg1s0t0;ar,m1qRUt0;cMgQLnKqueQVtJud0;e1Yur0;j0quJz1;e0i0;aTOi9;cQf7KgNPiNZlPme5rJss0tG7;cNj0mLnKr0tJ??0;al6if4;ec2iDO;aJig0ul0;l3r,t0;ar,ej0;g0hFi0;aVZiC;aOeMorKuJ;ir,tu0;eJir;ar,sc2;cJrt0xi9;h0t1;gLmKnJutF;ar,qN9;ar,b0ej0;el0r0;ar,cS2gDlMnKrm0sJt0x0;cHKg0sD;aJc0d0g1t0;l3nE;ar,h0i0m0osof0tr0;cOderNOit0lNmeMnLrJstH;ir,me5rQ2tJRvJ;eVRiB;d2ec2;nt1;ic8;h0uQJ;bWcVdUiQ0lRmiPnOrLscAtKuBvJz2;ar,or6;iKTur0;aKej0faBiJofi0re0t0;nRMsc0;ndVAr;ar,taRO;liJ;ar3;ar,ec2hKir,sJt0;ar,e0if4;ar,oc0;ar,ig0;e0il8uNJ;r4ul0;bul1c7Hd7Ef7Cgu0iv0j7Bl75m62n3Dqu38r35s0Lt0Jv0DxJ;a0Bc07e04foNDi03o01pRsE8tKuJ;b7lt0m0;aRCeNiMorqu1rJ;aJem0;ir,pUVvJ;as0i0;n7Vrp0;nu0rJ;iNUmAn0;aReOiSLlMorHSrKuJ;gn0ls0rg0;eS1im1oJ;b0pSF;an0icJ4oJ;d1r0;ctKd1l1nd2riJ;enEme5;ar,or0;nd1tS9;n7rJ;ar,b8c3t0;b1g1l0m1st1;cKmplJArcJ;er,it0;r0ut0;arc7eKit0lGYoJrS3;g8muJA;d2lJtu0;er,ir;ceNLg7lV6mAr0sp7ur1;aNeFCiMoJ;c0lJ;ar,uJv2;ci9ir;dGDsc7t0;cu0d1ngel3pQH;eJi4U;rn3;b1Wc1Bf15g0Zm0Vn3Pp0Cqu09tLvJ;aJoTO;ec2ir,n6zi0;aYeWiUoTrMuJ;ar,d0f0g0m0pKrrJ;ar,ic0;or0r0;aNeMiLoKuJ;m0tD;mp0ndFpi0;ar,b0p0;ar,buJ9g0it0l0m6p0ss0;g0l0nJtG??aB;gTFh0;nK9rAZur0;ar,c0gmPMlJmL8ol0pTDr0v0;ar,hT9;ar,nd2rJ;c0il3;bPcOf0gNi0lN0mMnLpe0qKTrKtJ;el0u1;!r6;cBVdard3;br0in0p0;i0n0;ar,i9;el6il3;aKeSIiJ;ar,n0v0;dIZrtH;aVeRiNlMoLrJuTH;ai0eJ;guKLit0m2;c0li0rFs0;and6eO6;ar,cLnKon0rJ;ar,iEBr0;afr0h0;a??0h0;cKdSMlh0rJss0t0v8ziC;aV9dKDne0t0;ar,iJt0ul0;al3f4;ir6lNnLrKtJv0U??0;if0;g1rPStHz1;ar,c0hJt0;olQV;h0m0;aLer0iKoJu41;er,l0r6;gaBu??0;ec2g0lt0r;aMoLrKuJ;eTYiI2;avSZim1;el0t0;n0rJ;avSW??0;aNoMrLuJ;maJzi0;r,??0;eg0i0;lAQme0r??0;cT2lf0qJKrT2;aVlar6oNrLuJ;d0lJreRFs0t0;aHPhaI9p1t0;av3evCJiJut0;tDv0;ar,iPlOnMrJv0;ar,ch0i0rJ;a??0eJ;g0r;d2juJ;nt0r0;h2t0;ce0m0;ch0lPmNnLpKrJsQKv0;afunHDnQ5r0;ar,ul1;cOXdJe0gaB;al3ir;ar,oJ;s0te0;ar,d0on0pSH;aMoKravHuJ;gaBlh0rKP;feI7rJ??0;o0raH3;fJgR7nj0rr0t2;or1;ar,gu2iKm0od1raJuDTv0;d4r;g1??0;aMiJ;li7UpKvJ;al2oc0;arJ9;ci9l3;a26c1Md1Ie1Hf15g0Rj0Ql0No0Mqua0Lr0Gs0BtTuSvMxJ;aKer12oJug0;t0vaB;d0gu0;aNeKiJo70;ar,d0es0l6;lh6nMLrJ;ed0gJn3;ar,oC;id6s0;m7nE;aZeVoSrKuJ;lh0p1rm0siasm0;aOeLiKoJ;nc0s0ux0;ncheS9st6;abr1g0lQHme94pMVteKvJ;ar,er,iQ3;c2r;j0nJr,v0;h0??0;ar,c0j0nKrJ;n0p6t0;ar,t6;di0nLrKsJ;ar,oD;n6r0;d2e6Z;lMOpO6rd6;aLeKin0oJurd6;berb6p0;b0j0;bo0c0iJMnJ;d6gLM;aiMed0iLoKuJ;bePJg0st1;diBl0sc0;c0jOJqu6;v6z0;dr0;br6do0it6j0vQY;aKeJou1T;ar,v0;me0??0;aPSe8o0;aRePlOoMrKuJ;i??0lh0;aJen0oN7;nd6v8Ux0??0;d0lJm0rdMT;f0ir;ob0;lh0nJss0;dr0h0;bQKiPNj0lISnMr9LsLtJ;ar,iJ;lh0nh0;g0t0;ar,ch0;aSeOiNoMrKuJ;n0r6;a19eJ;ar,nt0;c0rDL;ar,leQW;ar,iKrJst0z0;m0r5J;tJx0;ar,i??0;d0ix0rJsLLt3;ar,iCt0;gr6rv0;eLiKoJur6;idNJss0;re8v84;nt0re??0us0;aVeThSiRlausDoNrLuJ;b0rJ;rPXt0v0;av0eJu0;nc0sp0;br1lLmKnIrJst0v0;aj0p0;eJXi0pr7V;er3h2;lh0m0;aGOer;nJrMLt0;ar,d2;bOde0fu0ixLOlh0mNnMp0rKsJ;quMG;aJc7d1ec2n0rQD;cOLr;ar,de0t0;iCp0;e??0ul0;lt6mKY;a0Jb02e01i00oZpKuJ;d6l0;aSePiNoMrKuJ;nh0rr0x0;az0eJ;eJIg0nh0sPB;ar,br6d7ePTlg0rOYss0??0;lh0n0pJ;oc0;c2dKnKIrJstFz0??0;r0tN8;e1Jr0;cL4lMnKp0reJt0;d0lh0;ar,tuJ;rr0;h0id6;ci9ldDst0;gr0t1;nd0rg1;aVeSirLRoQrKuJ;ch0rr0t1;aMeLiKom0uJ;lh0t6;ag0;ar,nh0;nJv6;qu6;lJrc0sc0t0;ar,or0s0;beKleJv6;c2z0;d0r;ci0iI8lLr41sKtJ??0;er,uBP;ar,bGO;ar,sKK;gr6nJraCscNA;ar,cAP;aNeMiLoKucJ;id0u3X;gi0ng0;ci0d1g1mA;g2nc0tr3v0;bJPr;acN2et0;eJlu1;c9XrveMIt7F;iKuJ;c0z1;f4t0;lKoJ;ar,nom3;ips0od1;a6Te0QiQoLrKuJ;el0pl4r0v5Y;amJ0en0ibl0og0;ar,bKQcMe1LmKrmiI7s0t0uJ;r0trA;ar,e0KiJ;ciF6n0;il3uGX;a0Gf0Cg0Al07minu1nam3plom0r05sOt0vKzJ;er,im0;ag0erLiKorEuJ;lg0;d1n3s0;g1sGt1;cVfaK8pSsOtJ;aMeHQinLorc2rJuFY;a0GiJ;bu1;gu1;nEr;eLiKoJu17;ci0lv2n0;di0mM7p0;c0mAnt1rt0;araHMeKoJut0;n9Hr;ns0rs0;ar,eLiplAor8UrKuJ;rs0t1;ep0imA;rn1;eMCiJ;g1m1;aKig8DuJ;c51ir;c7p50t0;er1iJlaDLnAV;taLU;am0erKicuEDuJ;nd1;enJir;ci0??0;gnoJlOA;st4;a5Kb5Fc58d55f4Xg4Ti4SjJJl4Mm4Jn4Fp47r41sRtNvJ;aKer,ir,oJ;lv2r0t0;ne0sJ;s0t0;aBeKon0raJurp0;ir,t0;ct0rJst0;!g1iHZmA;a2Sb2Pc23d21e1Df16g12i0Wl0Tm0Nn0Lo0Ep00quZrespe8seYtQuPvJ;aMeKiJ;ar,ncLAr87;l0nJst1;ciBd0;ir0lJn6ri0;er,or3;m09n1;aPeOiNoMrJ;a70inKoJu1;nK3??0;ch0??0;ar,rc2;l0nE1tu1;c2rr0;c0mp0p0;c0de5rv1;alGit0;aVeQiPoOrJ;az2eLoJ;tJv2;eg2;g0nd2stiJz0;gi0;j0nt0r,s0vo0;r,st0;dMg0it0j0l0nLrJ;cGBdCAsuJt0;ad1;c0d2h0te0;a??0ir;ch0rafGH;bNcMl0nLpGVrJv0;dG6gJie5;an3;er0r0;up0;ed6rJIstJ;ru1;atu9DorB4uJ;d0tr1;aMeListGoJ;biCPnt0rJ;al3on0;d1m0Unt1r6;i0m0nJrc0scHHt0;ch0d0tL4;eKiJoc0um0R;g0nd0z0;ix0m0P;gNlud1mpMnJst1;ch0feKib1teJ;gr0reHE;cK9t0;ed1;n0uKW;aLoKrJuarn6;a??0ud0;st0ve5I;rr0st0;aNeMiLrJ;aJut0;ld0;ar,gDl0;ar,ch0r1;lJvor6z2;c0ec2;j0mZnKquili07rJsperaM2;d0t0;cTfRgaQh0le0rNtKvoJ;lv2;eKoJYraCuJ;lh0p1;nd2rr0;aKed0oJ;l0sc0;iz0sc0;n0t0;asFOerrJo2Lre0;uj0;aKh2oJr0I;nIrBKst0;de0ix0lh0miCnt0rJv0;d1n0;aObKpJ;aJZenFFoGHrKV;aKoJruB;c0ls0;iCl0rJ??0;aFVc0g0;l0raC;ar,eCiz2oJ;br0;a00eYhancJTlassGoMrKuJ;id0lp0mpr1r0;av0eJimA;r,v2;br1lTmpSnLrKsJ;er,tD;ar,tA;cNe55fi0ge4Sh6ju5sMtKvJ;e5Air;ar,e5i3ZrJ;a1ol0;eJ1id7;eJoIN;nIrt0;l4or;ar,orC3;nJr0E;d2tr49;beCLir,l??0m0nLrJsHA;ar,rJt0;eg0ilEN;j4s0;aKloq9Pot0rJ;av0;nc0rITst0;b0Ec0Cf0Ag07l06m03n02pVrRssPtMuLvJ;ez0iJ;ar,r;tB7xiAI;aKen3IiJrJ0;n0v0;c0r;e0i5SoJ;ci0ssJQ;mLrJtBR;aJoBum0;ig0nj0;ar,on3;aNeLo5rJ;eD0oJ;pFKv0xCQ;g0rJ;cDBt0;ix9rJ;afDJeDH;c0d0im0uJ3;aJpEV;rJss0;!r0;e5iCoj0;rJu0;aJeg0;d0v0;az2iJog0;ar,n0;at0el7oJred8;nseBrd0st9H;aLoKrJ;ig0o6X;n0to0;f0r;iv0rJ;aMeLib0oKuJ;b0ir;c0g0t0;ar,t2;m0p0;aPenNil0lDIoMrJuHW;av0eJim1;cJd0eC6;ar,i0;r3Zs8;ar,dJic0;er,ur0;rABup7;eKoJt0unE;mAt0;gJrv0;ar,r1;aKit1oJud0;crCSl1nsIr0sIv2;nd0rc0;aMeLiJo5N;b7ci0m8nJr8N;e0qu1;g0it0t0;pJt0;id0;t0x0;eLlKol0rJuFU;ad0ed0ingGE;ut1;l0n7;as0eOinNlMoLrJum0;aJo5;ud0;rm0;a2Hu1;h0ir;c0nJr1;d2esI;ar,et3iKuJ;r0z1;c0lh0;aOepNiMlLoJreAS;dGl0mpC5rJt0;ar,r2;aGFin0;d1fr0m0;ar,ci9;ir,lc0nt0p8;aMel0iLlat7o5GruKuJ;lh0t0;ar,??0;c0l8t0;nd0t2;mbFJ;dF8nNrMtJ;ar,ilJ;ogJ;raf0;!dH;ar,iJ??0;f4nh0;a4Ge4Bh3Wi3Ll3HoXrSuJ;id0lOmMnh0rLsJt4I;p1tJ;ar,e0o70;ar,s0t1v0;priJul0;me5r;mApaKtJ;iv0u0;b3Dr;av0eLiKoc8uJ;ciBSe5z0;ar,mAsm0t4v0;d8m0p8r,sJ;c2t0;a2Yb2Xc2UdGexi2Tfi0g2Si2Ql2Km1UnXoVpTrNsLtKxe0zJ??0;er,iC;ar,ej0iz0;er,tJ;e0uFF;ar,nFo0porGrKtJ;ar,ej0in0;eKig1oJ;bBAer,mp2;f7Ag2laJr,spo9Z;ci9t0;iJul0;ar,l0;pJrdAA;er0t0;c17d13e12f0Rg0Mh6j0Jl0Iot0q0Hs04tPvJ;aleDYeLiKoJul9L;c0l0;d0r,v2ziC;ncKrJ;g1s0t2;er,i9;aWeSiRorQrKuJ;nd1rb0;aMiLoJ;l0veJ;rt2;bu1st0;balaC7ca5diJf5Eir,pAFri0st0t0v1;t0z2;c2n0;nu0;mpLnKr,st0xJ;tuY;d2t0;l0or3;b27ct0gi0mAr,t0;a0Acient3eRiQoPpOtKuJ;bst2Blt0m7L;a9AeLiKrJ;a05iD5u1;tu1;rn0;ir0u5R;ci0l9IrE;d7gn0st1;gu1nKrJ;t0v0;suJt1;al3;uiD2;ui0;eKuJ;g0mAnt0r0;ctDtD;eLrJ;aJeg0;tDB??0;l0sJ;ti9;abD8eQiOlMorDRrKuJ;nd1t0;aJo5;ng2;aJit0u1;gr0;ar,dJgDn0rm0sc0;enE;cKit0rJss0;enEir;ci9i9;ct0;eKiJo2uz1;ci9me5r,z2;c9GnJsce86;ar,s0;at8JeNhEOiMlLorKret3uJ;rs0;d0r2;am0u1;li0t0;b2d2iKnIrJ;n1t0;tu0;a7Sb06e02i01ov2pLuJ;nJt0;g0ic0;aTeRil0lPorOrKuJ;ls0ng1t0;aLee7Rim1oJ;mJv0;et2;r,z2;!t0;eJic0;me5t0;l1nJt1;di0eIs0;d6rKss0tJ;ib0G;ar,ec2tiJ;cJlh0r;ip0;ch0n0s76;d1m8MnLrJt2??0;!cJ;iaC0;sDt0;aJin0oi0ur1;l1t2;aNeLg0h2iKoJ;c0n3r5K;d1g5Jm0;ar,cJt0;i9t0;b8Bps0r;b1ncJs0;id1;it0nomA;st1;ar,hJ;ar,iJ;ch0l0;i??0r58;b8dLgKlh0rJx0;!ct0;ir,ul0;juv0un0;aKiJ;c0m7K;m0rJssGud4;e0if4;cSentGfr0me5nRrLsKt0vJ;il3;c0m0;a6DcuJ;it0l0nJ;d0sJ;crKtJ;anE;ev2;d1g1t7Ez0;atr3i0;aPeOiNoLuJ;ch0f0mb0pJt0viBS;ar,it0;caDCraJv2;miZr;ar,co1Nfr0lrFng0sp0;c0fi0g0ir0;cOfuAYg0lNmLnJp0te0;cBRtJ;age0;ar,eJuBJ;g0j0;eC9r0;in0oJ;aBte0;ar,d2g0if0lebr8WnLrJss0v0;cFr0tJz1;ar,if4;sDtJ;raAG;b0Qc0Nd0Mg0i0Kl0Im0Fn0Bp04rWsUtPuNvKxiJ??4Z;ng0;aKoJ;uc0;lg0r;ci9sJtY;ar,t4;aMeLiKuJ;c0rr0;ng0v0;ar,g3Bqu3;lCPr;ar,c0s0tJ;ig0r0;aObNcom2d0eMg0iLmAne0p3QrJtF;ar,eJ;ar,g0;ar,ci0mb0;ar,c2;on3;ctJtJ;er3;aOeNiKot0riJt6X;ch0;n0tJ;aJul0;l3ne0;ar,ng0;c8r;al3cAMdidAAon3s0tJ;arKe0oJ;riC;!ej0ol0;bJiCpFufl0;aJi0o0;le0r;ar,cJej0h0m0uni0??0;ar,in0ul0;ar,nh0rJ;!el0;asIenEuc0;arHet0hJ;ar,e0iJon04;mb0;eJul0;ce0r;a0Ie08i05l04oUrLuJ;f0l1mb0nd0rJsc0zA;il0l0;aPeOiMoKuJ;n1xu0M;c5EnJq0It0x0;q0Hze0;g0lh0nJs0t0;c0d0;c0tanh3;cHd0m2KnJvaO;d2Jq0C;bRcHiQlPmbNnGquHrJt0;bKd0rJ;ar,if0;oleJuB;te0;arJe0;de0;ar,e0in0s0;ar,cAY;e0in0;asf6Cef0i3Poq01;c0fKrr0sJt8L;ar,bilhAU;ar,u0G;atGbPiOli99m-LnKrr0sJt0;t0u5;diz2efiEz2;fKqJ;uer2;az2;j0r0;erJ;!ic0;if4;b01d96f00gu66iZjYlRmbPnOqNrLsKtJ;aBer,iz0uc0;ar,e0t0;aJbe0gaCr0;lh0te0;ue0;al3c0de0h0ir,z0;e0oJ;le0;aNbuLdFe0iKoJ;i??0;r,z0;ci0rJ;di0;nJr;ce0??0;ar,ul0;l0nh0x0;ej0or0;a31uj0;b8Uc7Hd6Rf6Bg5Vi0j5Sl4Tm49n3Op2Iqu2Er1Gs0Xt07u01vRzM??J;ambaKoNuJ;c4Vl0;rc0;aLeKuJ;crAl0;d0it0;f4LrJ;!ar;aPeMiLoJuW;c0lJ;um0;ar,lt0nh0r,s8Cv0ziC;l0nKrJss0;b0i37meB;t4A??0;caBli5PnJri0ss86;tJ??0;aj0;fNgDme5sLtKxiJ;li0;ent4or3u0;cuJe5piE;lt0;er1;a03eXiVoTrLuJ;a6Vc03lh0rJ;ar,d1;aNeMiKoJ;ar,fi0p7S;buJt0;ir,l0;l0v2;c0iKpaBs0vJ;a4Re43;r,??o0;ch0l0rJ;ar,do0me5;c0l0nJr0v0??0;ar,g1;ar,mNnMrJst0;!m0rJ;ar,iJor3;ss0z0;d2t0u0;or3;baMc0lh0rKvi0zJ;an0;!a5ef0rJ;ac0;f0l4M;ar,ce1Gfixi0il0pZsJ;aWeRiOoKuJ;ar,m1nt0st0;a8JbKci0l0mJpr0vi0;ar,br0;eJi0;rb0;b2Cm2CnaKsJ;ar,t1;l0r;ar,di0gDmeBnKsJv7;s2Ft0;hoKtJ;ar,ir;re0;c0lJnh0r,ssA;a3Lt0;ar,eJir0;ar,rg1;a0Fb0Ec0d2e0Df0gu0Ci0Bma0Ao08p07qu04rKtJv27x0;ic5K;a00eMiLoKuJ;ar,in0m0;ch0g0j0l0mb0st0t0x0;ar,b0m0sc0;ar,bUcTdSf6gPlOmMnLpJst0;eJi0;l0nd2;d0eg0;at0eJ;d0ss0t2;i0v0;aKiJl0;me5;l0??0;ar,o0D;ad0;aJe5it0;nh0t0;ig0m0nJs66zo0;c1Gh0j0;eKiJ;t2Wv0;ar,j0;ar,o0;maJ;r,t3;r,z0K;ar,sc0;ir,me5;ar,j0ng0;iIor3;nh0r;eLiJ;eJl5Cn33;sc2t0;bra5c2nt0;a0Fe07i06l04oXrKuJ;nh5Lp0r0;azUeRiQoJum0;fuOnt0pMvKxJ;im0;ar,e8iJ;si9;iJri0;nqu0;nd0;m0Vsi9;ci0eKgo0nd2sJ??0;ar,e5s0t0;nd2;ar,er;dOi0nt0qNrMsJuc0;e5tJ;aJil0;r,t0;!riCt0;ue5;ar,er0r6;aJic0;c0in0n0ud1;ed0me5nh0t0;ar,drHg0lOnMquLrJt6ziC;cJfe5Wre0t0;eb2;en0;ar,dJs0;er,o0;ar,id0;ej0;drQg0ix9lPnNrJsce5v08ziO;aKeJtF;c2lh0nt0;fJr;us0;h0iJ;gu0;avr0p0;iCo0;a00cZdYeWgUiRoQsi0tLuJ;ir,l0nEvi0;ci0;eKipJ;at3;cKpJv2;or;ed2ip0;it6t0;ma36nKquJsM;il0;ar,h0;a0YusJ;ti0;l0steJx0;si0;ar,ej0o0;or0;lKrJ;qu3;is0;aVbTeRiQoLpJu0S;ar0liJut0;ar,f4;fAlMnto0rKsJtA;s0t0O;ar,d2Ken0n0ro0tJ;ec2iz0;ar,d0ec2g0;m0ud0;aJdro5ig0n3sIziC;lh0??0;iJul0;ci9e5;ci0dur0Zin0lNme5nMrJss0;!ar,el0YfaCgKiCrJ;ar,ot0;ar,ur0;d0h0Vs0;d4DgJ;am0;a0Dbe0Cc09e07f04g03h02iXmVoUteSuOvJ??0;eMiKorJ;ar,ec2o??0;ssJtr0;ar0;it0j0;cAd1g0ir,mLnJ;ar,iJ;ss0;br0i0;ar,rJ;ar,c0n0;c0j0ng0uc0;ej0oJ;r??0??0;ar,cLen0ge3Hj0me5nJs2Yvi0;d0haJ;r,v0;eJi0;r??0;an0e0;em0;abet00inKorJ;ri0;et0;gJij0nt0rt0va5;ar,r0;aKoJuC;ol3v8;n??0;rg0;g0rKsIvaJ;nc0;!dFg0m0;ar,e0;e8oeKuJ;d0iz0nt0st0;ir0lh0;aWenViUlToRrMuJ;aKdJe5lh0??0;ar,iz0;nt0r3G;aLeKilJup0;ho0;d1g0;ci0dJv0;ar,ec2;niJur0;ar,z0;om7utA;ga5l3ot0r,t0;ci0d0;ch0rr0sJ;aBt0;aVeSiQlPoMroLuJ;ge5nJ;d0il0;nt0ux0;b0f0g0it0rJ;ar,moJr0;se0;ar,ig1or0u1;a33gDli0nJrm0v1Kx0;ar,c0;ar,ct0iKrJt0;ir,r0ve5;t0??o0;dKg0m0n0st0zeJ;nd0r;ig0;apt0e03i01jXmToPqOstriNuLvJ;erJir,og0;s0t1;b0lJz1;ar,t7;ng1;uir1;c4ec2id0leLpt0rJt0??0;ar,meJn0;c2nt0;sc2;iKoeJ;st0;nJr0t1;isI;etLuJ;d4nt0;ic0;iv0;a03ci9mJr,t0viC;pl1;j0lgMnLqu0rKsI;tr0;e??0ir,n0;s0tr0;a??0;a0Le0Hh0Bi08l06oRrOtLuJ;ar,d1mJr0s0;ul0;uaJ;l3r;iz0;eKisJ;ol0;d8sceO;beWcViUlTmRnOpl0rMsKtov0DvaJ;rd0;s0tJ;ar,um0;d0reJ;nt0r;ch11diJseBt6;ci9;on0;et2od0paJ;nh0ss0;h2it0;m0t0;h0or0;rt0;aJimM;m0r0;cKdJon0rr0;ar,e5;at0;aMeg0inKoJ;ch0ut0??0;caB;lh0;c0r,t0vaJ;sc0;d2iLl7nKrJss0t0;c0t0;ar,d2tu0;r0t0;bRlQmPnOrLsKt0utJ??ap0;el0;al0;ar,e0iKreJt0;ar,t0;ci0nh0;h0to0;ar,p0;c0e5m0or0;ar,ruC;-r0Ua0Fd0De08i05jDlu1n03oXrPsKuJ;nd0s0;oMtJ;erKrJ;a1u1;!g2;lv2rv2;aMeLiJ;g0lha5r;nt0;vi0;c0nLsJ??0;ar,ileJ;ir0;d0g2;caCi0lLmAn0rJto0;d0r6t0;in0;ar,ir,or6;ec2;nh0;eg0;ur0;c0sJ;co8m0;it0;b7cLir0nJ;dJ??o0;i??o0;ar,ed0;er0;ic0uz1;ir;bWf0ix0lUnQrOsKtJul0;at0er;m0tJ;arKec2;er;!d0;c0rJ;ot0;aLc0dJ;aJon0;lh0r;n0r;aJiz0ro0;n??0r;ad0el0;og0;ar",
    "Ordinal": "true??cIdHmilJnonFoCq5s2t0vigJ;erceirKr0;ecGigH;e0??tH;gundHpt5tiAx0;agEcDtG;u1??in0;gBq2;a2in0;g9q0tC;uag9;dr0rtA;ag7i2;ct0itav8;i0og5;ng3;a0g2o6;!g2s;uc0??c2;ent0;??s0;im0;a0o0;!s",
    "LastName": "true??0:2Z;1:36;2:34;3:2A;4:2T;5:2V;a36b2Wc2Jd2Ae27f22g1Wh1Mi1Hj1Bk14l0Wm0Mn0Io0Fp04rXsMtHvFwCxBy8zh6;a6ou,u;ng,o;a6eun2Poshi1Hun;ma6ng;da,guc1Wmo23sh1YzaQ;iao,u;a7il6o4right,u;li36s2;gn0lk0ng,tanabe;a6ivaldi;ssilj32zqu1;a9h8i2Bo7r6sui,urn0;an,ynisI;lst0Mrr1Rth;atch0omps2;kah0Snaka,ylor;aDchCemjon3himizu,iBmiAo9t7u6zabo;ar1lliv25zuD;a6ein0;l1Yrm0;sa,u4;rn3th;lva,mmo1Zngh;midt,neid0ulz;ito,n7sa6to;ki;ch1dLtos,z;amBeag1Vi9o7u6;bio,iz,sD;b6dri1JgIj0Rme20osevelt,ssi,ux;erts,ins2;c6ve0D;ci,hards2;ir1os;aEeAh8ic6ow1W;as6hl0;so;a6illips;m,n1P;ders5et8r7t6;e0Lr3;ez,ry;ers;h1Xrk0t6vl3;el,te0H;baBg09liveiZr6;t6w1K;ega,iz;a6eils2guy5ix2owak,ym1A;gy,ka6;ji6muU;ma;aDeBiAo8u6;ll0n6rr09ssolini,??6;oz;lina,oIr6zart;al0Keau,r0R;hhail3ll0;rci0ssi6y0;!er;eVmmad3r6tsu06;in,tin1;aCe8i6op1uo;!n6u;coln,dholm;fe7n0Or6w0I;oy;bv6v6;re;mmy,rs5u;aBennedy,imuAle0Jo8u7wo6;k,n;mar,znets3;bay6vacs;asY;ra;hn,rl9to,ur,zl3;aAen9ha4imen1o6u4;h6nYu4;an6ns2;ss2;ki0Cs5;cks2nsse0B;glesi9ke8noue,shik7to,vano6;u,v;awa;da;as;aBe8itchcock,o7u6;!a4b0ghNynh;a4ffmann,rvat;mingw7nde6rM;rs2;ay;ns5rrPs7y6;asDes;an3hi6;moI;a9il,o8r7u6;o,tierr1;ayli4ub0;m1nzal1;nd6o,rcia;hi;er9lor8o7uj6;ita;st0urni0;es;nand1;d7insteGsposi6vaK;to;is2wards;aBevi,i9omin8u6;bo6rand;is;gu1;az,mitr3;ov;nkula,rw7vi6;es,s;in;aFhBlarkAo6;h5l6op0rbyn,x;em7li6;ns;an;!e;an8e7iu,o6ristens5u4we;i,ng,u4w,y;!n,on6u4;!g;mpb7rt0st6;ro;ell;aBe8ha4oyko,r6yrne;ooks,yant;ng;ck7ethov5nnett;en;er,ham;ch,h8iley,rn6;es,i0;er;k,ng;dDl9nd6;ers6rA;en,on,s2;on;eks7iy8var1;ez;ej6;ev;ams",
    "MaleName": "true??0:C8;1:BF;2:BW;3:BN;4:AZ;5:BT;6:AN;7:9P;8:B7;9:AR;A:AI;B:BY;aAZbA3c92d83e7Df6Wg6Eh5Ui5Gj4Jk49l3Qm2Pn2Eo28p22qu20r1As0Rt07u06v01wOxavi3yHzC;aCor0;cCh8Dne;hDkC;!aAW;ar4ZeAV;ass2i,oDuC;sEu25;nFsEusC;oCsD;uf;ef;at0g;aKeIiDoCyaAK;lfgang,odrow;lCn1O;bEey,frBElC;aA0iC;am,e,s;e84ur;i,nde7sC;!l6t1;de,lDrr5yC;l1ne;lCt3;a8Yy;aFern1iC;cDha0nceCrg96va0;!nt;ente,t58;lentin47n8Tughn;lyss4Ksm0;aUePhLiJoFrDyC;!l3ro8s1;av9LeCist0oy,um0;nt9Dv52y;bEd7SmCny;as,mCoharu;aATie,y;i7Yy;mCt9;!my,othy;adEeoDia78omC;!as;!do7H;!de9;dFrC;en8CrC;an8BeCy;ll,n8A;!dy;dgh,ic9Onn3req,ts43;aRcotPeOhKiIoGpenc3tCur1Nylve8Czym1;anEeCua76;f0phAAvCwa75;e55ie;!islaw,l6;lom1n9YuC;leyma8ta;dCl7Em1;!n6;aEeC;lCrm0;d1t1;h6Nne,qu0Uun,wn,y8;am9basti0k1Wl3Zrg3Yth,ymo9D;!tC;!ie,y;lDmCnti21q4Hul;!mAu4;ik,vato6R;aXeThe8YiPoGuDyC;an,ou;b6HdDf9pe6MssC;!elAE;ol2Ty;an,bJcIdHel,geGh0la7DmFnEry,sDyC;!ce;coe,s;a91nA;an,eo;l3Ir;e4Pg3n6olfo,ri64;co,ky;bAe9Q;cCl6;ar5Lc5KhDkC;!ey,ie,y;a81ie;gDid,ub5x,yCza;ansh,nT;g8SiC;na8Os;ch5Ufa4lEmDndCpha4sh6Qul,ymo6W;al9Uol2Ay;i9Eon;f,ph;ent2inC;cy,t1;aGeEhilDier5Yol,reC;st1;!ip,lip;d97rcy,tC;ar,e2U;b3Rdra6Bt43ul;ctav2Uliv3m92rGsDtCum8Qw5;is,to;aDc8OvC;al4Z;ma;i,vK;athKeIiEoC;aCel,l0ma0r2W;h,m;cDg4i3HkC;h6Qola;hol5TkCol5T;!ol5S;al,d,il,ls1vC;il4X;anCy;!a4i4;aWeTiKoGuDyC;l20r1;hamDr5VstaC;fa,p4D;ed,mF;dibo,e,hamDis1Wnty,sCussa;es,he;ad,ed,mC;ad,ed;cHgu4kFlEnDtchC;!e7;a75ik;house,o04t1;e,olC;aj;ah,hCk6;a4eC;al,l;hDlv2rC;le,ri7v2;di,met;ck,hOlMmPnu4rIs1tEuricDxC;!imilianBwe7;e,io;eo,hDi4ZtC;!eo,hew,ia;eCis;us,w;cEio,kBlDqu6Dsha7tCv2;i2Hy;in,on;!el,oLus;achCcolm,ik;ai,y;amCdi,moud;adC;ou;aReOiNlo2RoJuDyC;le,nd1;cFiEkCth3;aCe;!s;gi,s;as,iaC;no;g0nn6OrenEuCwe7;!iC;e,s;!zo;am,on4;a78evi,la4PnDonCst3vi;!a5Yel;!ny;mDnCr65ur4Rwr4R;ce,d1;ar,o4L;aJeEhaled,iCrist4Tu46y3A;er0p,rC;by,k,ollos;en0iFnCrmit,v2;!dDnCt5A;e0Zy;a7ri4L;r,th;na66rCthem;im,l;aZeRiPoEuC;an,liCst2;an,us;aqu2eKhnJnHrFsC;eDhCi79ue;!ua;!ph;dCge;an,i,on;!aCny;h,s,th4V;!ath4Uie,nA;!l,sCy;ph;an,e,mC;!mA;d,ffHrEsC;sCus;!e;a5HemDmai8oCry;me,ni0P;i6Sy;!e56rC;ey,y;cId5kHmGrEsDvi3yC;!d5s1;on,p3;ed,od,rCv4K;e4Xod;al,es,is1;e,ob,ub;k,ob,quC;es;aObrahNchika,gLkeKlija,nuJrHsEtCv0;ai,sC;uki;aCha0i6Dma4sac;ac,iaC;h,s;a,vinCw2;!g;k,nngu50;!r;nacCor;io;im;in,n;aKeGina4ToEuCyd54;be23gCmber4AsE;h,o;m3ra31sCwa3V;se2;aEctDitDn4CrC;be1Ym0;or;th;bLlKmza,nJo,rEsDyC;a41d5;an,s0;lFo4DrEuCv6;hi3Yki,tC;a,o;is1y;an,ey;k,s;!im;ib;aReNiMlenLoJrFuC;illerDsC;!tavo;mo;aEegCov3;!g,orC;io,y;dy,h55nt;nzaCrd1;lo;!n;lbe4Ono,ovan4P;ne,oErC;aCry;ld,rdB;ffr6rge;bri4l5rCv2;la1Xr3Cth,y;aReOiMlKorr0HrC;anEedCitz;!dAeCri22;ri21;cEkC;!ie,lC;in,yn;esJisC;!co,zek;etch3oC;yd;d4lConn;ip;deriDliCng,rnan01;pe,x;co;bi0di;arZdUfrTit0lNmHnGo2rDsteb0th0uge8vCym5zra;an,ere2U;gi,iDnCrol,v2w2;estBie;c06k;och,rique,zo;aGerFiDmC;aFe2O;lCrh0;!io;s1y;nu4;be09d1iFliEmDt1viCwood;n,s;er,o;ot1Ts;!as,j43sC;ha;a2en;!dAg32mFuDwC;a25in;arC;do;o0Su0S;l,nC;est;aYeOiLoFrEuDwCyl0;ay8ight;a8dl6nc0st2;ag0ew;minicGnEri0ugDyC;le;!l03;!a29nCov0;e7ie,y;!k;armuDeCll1on,rk;go;id;anJj0lbeImetri9nGon,rFsEvDwCxt3;ay8ey;en,in;hawn,mo09;ek,ri0G;is,nCv3;is,y;rt;!dC;re;lLmJnIrEvC;e,iC;!d;en,iEne7rCyl;eCin,yl;l2Wn;n,o,us;e,i4ny;iCon;an,en,on;e,lC;as;a07e05hXiar0lMoHrFuDyrC;il,us;rtC;!is;aCistobal;ig;dy,lFnDrC;ey,neli9y;or,rC;ad;by,e,in,l2t1;aHeEiCyJ;fCnt;fo0Dt1;meDt9velaC;nd;nt;rEuDyC;!t1;de;enC;ce;aGeFrisDuC;ck;!tC;i0oph3;st3;d,rlCs;eCie;s,y;cCdric;il;lFmer1rC;ey,lDro7y;ll;!os,t1;eb,v2;ar03eVilUlaToQrDuCyr1;ddy,rtJ;aKeFiEuDyC;an,ce,on;ce,no;an,ce;nDtC;!t;dDtC;!on;an,on;dDndC;en,on;!foCl6y;rd;bDrCyd;is;!by;i8ke;al,lA;nGrCshoi;at,nDtC;!r11;aCie;rdB;!edict,iDjam2nA;ie,y;to;n6rCt;eCy;tt;ey;ar0Yb0Od0Kgust2hm0Hid5ja0Fl00mYnQputsiPrGsaFuDveCya0ziz;ry;gust9st2;us;hi;aJchIi4jun,maGnEon,tCy0;hCurB;ur;av,oC;ld;an,nd;el;ie;ta;aq;dHgelBtC;hoFoC;i8nC;!iBy;ne;ny;reCy;!as,s,w;ir,mCos;ar;an,bePd5eJfGi,lFonEphonIt1vC;aNin;on;so,zo;an,en;onDrC;edB;so;c,jaFksandEssaFxC;!and3;er;ar,er;ndC;ro;rtB;ni;en;ad,eC;d,t;in;aDolfBri0vik;!o;mCn;!a;dGeFraDuC;!bakr,lfazl;hCm;am;!l;allFel,oulaye,ulC;!lDrahm0;an;ah,o;ah;av,on",
    "Preposition": "true??aAc9de6e4junto c9p2s0vind8??s;em,ob0;!re;ara0or;! c5;m0ntre;! cim6b1;!b0ntr1pois,s6;aix0;o 4;om; partir 2cerc1l??m,t0;rav??s 1??;a 0;de",
    "Person": "true??ashton kutchRbQcLdJeHgastMhFinez,jDkClebron james,mBnettIoAp8r4s3t2v0;a0irgin maF;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssIlobodan milosevic,uA;ay romano,eese witherspoHo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipI;lmHris hiltC;prah winfrEra;essiaen,itt romnDubarek;anye west,iefer sutherland,obe bryant;aime,effers8k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt2ick wolf;lt1nte;ar1lint0;on;dinal wols1son0;! palm2;ey;arack obama,rock;er",
    "Conjunction": "true??como,e3logo,mas,nem,ou,po0q2;is,r0;q0??m;ue;!mbora,nt??o",
    "Pronoun": "true??aPcJeHisGlFmDnBo9qu8s7t6v0;o0??s;c??Qs0;!sa 0;majes1s0;anti0enhoria;ta4;e,i,u;e,i;al,em; senhor,c??,n0s senhores;de;os,??0;is,s;e0im;!rit??ssimo;aCheCoC;so,to;l9s0u;s8t8;o1uj0??;a7o7;m2n0;no0o0s1t1;sco;igo; 3qu0s senhoras;el0ilo;a0e0;!s;gente,senhora",
    "Determiner": "true??a2el,o2u0;m0ns;!a0;!s",
    "City": "true??0:45;a3Ub39c2Gd27e1Zf1Tg1Oh1Hi1Fj1Bk17l11m0Ln0Ho0Ep08q05rZsJtDuCv8w7x5y3za1;greb,po1;p2Drizh0;a1okohama;ng20roslavl;ang2Vi1un0F;'an,an;roclaw,uh28;a3i2o1;lgog3Bronezh;e3Flni2E;l??nc0rs29;fa,lyanov2P;bilisi,e4i3o2rujil9u1??quP;cum25r33;gliatti,ron39;anj1Ujua39ra39;er??1gucigal3Hresi38;!o;a8e7he5kopje,tuttga1Cu4??o 1??f0;bernardo do campo,francis28gon??a2lu??s,p1;au1eters1L;lo;c10rra2W;ffield,n1;ya27zh1M;ul,vi08;l7n2ra1;go??a,tB; 4t1;a cruz de la sier35iago1o domin23;! de 1;cZlos caballer0U;anton5die20jose,pedro su2Q;vador,??nica;angum,ecife,i5o1yaz1G;ma,s1tterd2F;t2??r1;io;ov;a30ga,o de janei24;ingdao,u1;er??ta22i1;nxa9to;a5e4hoenix,o2rEu1;eb2Ene;rto 1zna??;alegUpr??ncipe;n0Mqu25rm;ler0Qr03;de2r0Es1ttawa;a0Flo;ssa;a2ezahualc??yotl,izhny novgorod,ova i1??pol1U;gua??u,orq29;berezhnye chelny,go0n1t8ucalp0W;qu1X;aBe9i8o3u2ykolaO??l1;aga;mb1Dniq24;nt2sco1;u,vo;e2re1;al;rrey,vid??u;ami,l29n18;dell??n,ndo04xic1;ali;cei??,drid,khachka1Rn4r1;aca2se1;lha;ibo,y;a0OchestMi1N??gua;a3eipzig,i2o1uan01v8y03??03;dz,ndr19s angel19;ma,pet0YsbA; p2gMho1;re;az,la1Q;a3hark2iev,r1uala lumpur;asnodar,yvyi rih;iv;rachi,z05;ac3in04o1;anesU??o pess1;oa;ar1Iksonville;erev00ndian??pol1stambul,zhev0M;is;a3elsinq1Ao1yder1P; 0Bng1ustM; ko0Duecong18;ider1JmMn1rbQva15;c2ov1;er;heu;anja,lasgow,o3ua1??nova;dalaja1Arulh1yaquil;os;i??n0t1;emE;ilad??lf0o3rankfu2ukuo1;ka;rt;rt1shJ; worth,ale1;za;cate6dmont5l al0Ps1;sBt1;ocol2ugar1;da;mo;on;pec,rim1;burR;a7etroit,nip01o5resd4u2??l1??sseldorf;hi,i;bl1isburg,que de caxi0O;in;en;n1rtmund;etOggu2;ca,li1r es sala01;an;aMhEi9o5rac4u1??rdo2??cu0G;liac2riti1;ba;??n;??v0;l2ncepci??n,penhag1;a,ue;umb1??n0??n0;us;dade d2udad 1;guayaZju??rez;a guatemaWe ho 2o m??xi1;co;chi minh;e4i1ongqi2;ca2ttago1??in??u;ng;go;lyabin3n1;ai,gdu,n1;ai;sk;i6l5mp4nt00r1;ac2t1;ageLum;as,hi;inRo granY;cu7gary;ro;aCe7irmingh6ogo5r4u1;car2dap2enos air1;es;es7;as??l0uxelK;t??;am;l2rl1;im;g2o horizon1??m;te;rado;gd8ku,ng5r1;celo3quisime2ranquil1;la;to;na;alor2kok,uecoq1;ue;!e;aB??;hmedClexandr0m6nca5requi4strac??,t1;en2lan1;ta;as;pa;ra;e1sterd??;d2sterd1;??o;aba1;de;ia;abad",
    "Region": "true??0:23;1:1U;a21b1Tc1Jd1Ees1Df1Ag14h11i0Yj0Wk0Ul0Rm0GnZoXpTqQrNsEtButAv7w4y2zacatec23;o05u2;cat19kZ;a2est vi5isconsin,yomi15;rwick1shington2;! dc;er3i2;rgin1T;acruz,mont;ah,tar pradesh;a3e2laxca1EuscaB;nnessee,x1S;bas0Lmaulip1RsmK;a7i5o3taf0Pu2ylh14;ffVrr01s0Z;me11uth 2;cSdR;ber1Jc2naloa;hu0Tily;n3skatchew0Sxo2;ny; luis potosi,ta catari0;a2hode8;j2ngp03;asth0Nshahi;inghai,u2;e2intana roo;bec,ensXreta0F;ara0e3rince edward2; isV;i,nnsylv2rnambu03;an15;axa0Pdisha,h2klaho1Dntar2reg5x06;io;ayarit,eCo4u2;evo le2nav0N;on;r2tt0Tva scot0Z;f7mandy,th2; 2ampton1;c4d3yo2;rk1;ako10;aroli0;olk;bras0Zva03w2; 3foundland2;! and labrador;brunswick,hamp1jers3mexiLyork2;! state;ey;a7i3o2;nta0relos;ch4dlanCn3ss2;issippi,ouri;as geraHneso0N;igRoacR;dhya,harasht05ine,ni4r2ssachusetts;anhao,y2;land;p2toba;ur;anca1e2incoln1ouis9;e2iI;ds;a2entucky,hul0;ns09rnata0Eshmir;alis2iangxi;co;daho,llino3nd2owa;ia0;is;a3ert2idalFunB;ford1;mp1waii;ansu,eorgXlou6u2;an3erre2izhou,jarat;ro;ajuato,gdo2;ng;cester1;lori3uji2;an;da;sex;e5o3uran2;go;rs2;et;lawaFrby1;a9ea8hi7o2umbrI;ahui5l4nnectic3rsi2ventry;ca;ut;iNorado;la;apFhuahua;ra;l9m2;bridge1peche;a6r5uck2;ingham1;shi2;re;emen,itish columb4;h3ja cal2sque,var3;iforn2;ia;guascalientes,l5r2;izo0kans2;as;na;a3ber2;ta;ba3s2;ka;ma",
    "Country": "true??0:2M;a29b1Vc1Hd1Fe18f12g0Uh0Ti0Mj0Kk0Jl0Bm03nXom??,pTquSrKsAt5u4v3z2??1??16;frica Eustr0;imbabwe,??1L;anuatu,enezue2EietA;cr2Hg0LruSzbe1N;a4imor-les1Ho3rinidad e toba09u1;n??s0rqu1valu;emen2Gia;go,nR;i0Wji1Inz2C;a7e6ingapu28om20ri lanka,u2??o 1??rv0??r0;crist??v??o e nevis,tom?? e pr??ncipe,vicente e granad0W;azi0Td??o2ri1??c0??0R;name;! 1;do s16;neg0Jrra le3ychell1D;m2n1; mariVta l??c0;oa;e1om1Su05??1H;ino unido,p??blica 1;c4d1;a macedVemocr??tica do 2o1; 1min3;conP;entro-afr1he16;ica1N;irgu1V??n0;a2e9o1;lOrtug05;l03nam??,pua-nova guin??,qu1Sra1??ses baix1A;guai;a4ep02i3o1??ger;rue1va ze07;ga;car??gua,gG;m??b0u1;ru;a4icrOo2yanm7??xi1??na1;co;ld??v0n1??ambiL;g??l0tenegro;dag??sc3l2rroc0Yur1;it1D??c0;awi,div0Zi,ta,??s0;ar;a0Ue6i4uxembur3??b1;a1ia;no;go;b1echtenst0Stu16;??r0;soXt1;??n0;iribaXuwait;a1ord11;mai0Bp13;lhas 6nd5r2s1t0O??men;l??Jrael;a2l1??;an0R;que;on??s0;marshall,salom0W;aiNondur0Fungr0;a7e??rg0r6u1??T;atema0Mi1;a0In??1;! equatori2-biss1;au;al;ana0G??c0;b0Nna;i2ran1;??a;ji,lip3n1;l??1;nd0;in01;gi6l salv5mirados ??rabe4qu5ritre0s1ti??p0;lov2p0Bt1;ado2??n0;??qu0??n0;s unidT;ador;to;inamarHjibou1ominiH;ti;a9h7o1ro??c0uba;l??5morBreia do 2sta 1;do marfKriD;nor2s1;ul;te;mb0;a6i1;le,na,pre;bo ver4m2nad??,za1;quW;ar??1boja;es;de;a9e7ielorr??6o5r4u2??lgi1??snia e herzegoviJ;ca;lg??r0r1tR;kina faso,undi;asil,unei;l??v0tswaE;ss0;lize,n1;im;h2ngladesh,rbad1;os;am2r1;ein;as;feganElAn6r2ustr1zerbaijF;??l0;g2m1??bia saudita;??n0;enti1??l0;na;dor3go2t??gua e barbu1;da;la;ra;b2em1;anha;??n0;ia;ist1;??o",
    "FemaleName": "true??0:FV;1:FZ;2:FO;3:FA;4:F9;5:FP;6:EO;7:GC;8:EW;9:EM;A:G8;B:E2;C:G5;D:FL;E:FI;F:ED;aDZbD1cB8dAIe9Gf91g8Hh83i7Sj6Uk60l4Om38n2To2Qp2Fqu2Er1Os0Qt04ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7EeHol1TvG;et9onB8;le0sen3;an8endBMhiB3iG;lInG;if3AniGo0;e,f39;a,helmi0lGma;a,ow;aMeJiG;cHviG;an9XenFY;kCWtor3;da,l8Vnus,rG;a,nGoniCZ;a,iD9;leGnesE9;nDIrG;i1y;aSePhNiMoJrGu6y4;acG0iGu0E;c3na,sG;h9Mta;nHrG;a,i;i9Jya;a97ffaCDna,s5;al3eGomasi0;a,l8Go6Xres1;g7Uo6WrHssG;!a,ie;eFi,ri7;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmC7ra;!ka;a,t5;at5it5;a05carlet2Ye04hUiSkye,oQtMuHyG;bFGlvi1;e,sHzG;an2Tet9ie,y;anGi7;!a,e,nG;aEe;aIeG;fGl3DphG;an2;cF5r6;f3nGphi1;d4ia,ja,ya;er4lv3mon1nGobh75;dy;aKeGirlBIo0y6;ba,e0i6lIrG;iGrBMyl;!d70;ia,lBS;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;l5Yre0;bMdLi8lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBKome;e,ie;in1ri0;a02eXhViToHuG;by,thBH;bQcPlOnNsHwe0xG;an93ie,y;aHeGie,lC;ann7ll1marBCtB;!lGnn1;iGyn;e,nG;a,d7W;da,i,na;an8;hel53io;bin,erByn;a,cGkki,na,ta;helBWki;ea,iannDUoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;cAOkaE;chGe,i0mo0n5EquCAvDy0;aC9elGi8;!e,le;een2ia0;aMeLhJoIrG;iGudenAT;scil1Uyamva8;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvaB8tHulG;a,et9in1;ricGsy,tA5;a,e,ia;ctav3deHfATlGphAT;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeD;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoAZk8AolG;a,eBE;!mh;l7Sna,risF;dIi5PnHo23taG;li1s5;cy,et9;eAiCL;a01ckenz2eViLoIrignayani,uriBDyG;a,rG;a,na,tAP;i4ll9UnG;a,iG;ca,ka,qB1;a,chOkaNlJmi,nIrGtzi;aGiam;!n8;dy,erva,h,n2;a,dIi9GlG;iGy;cent,e;red;!e6;ae6el3G;ag4KgKi,lHrG;edi61isFyl;an2iGliF;nGsAJ;a,da;!an,han;b08c9Bd06e,g04i03l01nZrKtJuHv6Sx85yGz2;a,bell,ra;de,rG;a,eD;h74il8t2;a,cSgOiJjor2l6In2s5tIyG;!aGbe5QjaAlou;m,n9P;a,ha,i0;!aIbAIeHja,lCna,sGt53;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri9;!t;!ry;et3IiB;elGi61y;a,l1;dGon,ue6;akranBy;iGlo36;a,ka,n8;a,re,s2;daGg2;!l2W;alCd2elGge,isBDon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9PnGsAN;!a,e9O;a,sAL;aAYcJelIiFlHna,pG;e,iB;a,u;a,la;iGy;a2Ae,l25n8;is,l1GrHtt2uG;el6is1;aIeHi7na,rG;a6Xi7;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Ket9z2;a,et9;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8De;!n4F;b7Qerty;!n5Q;aNda,e0iLla,nKoIslAOtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Pi6kes5rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5A;a,en,iGy;!e,n48;ri,urtn97;aMerLl96mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6MiJlInHrG;a,i,ri;d4na;ey,i,l9Ns2y;ra,s5;c8Ti5UlOma6nyakumari,rMss5JtJviByG;!e,lG;a,eG;e,i75;a5CeHhGi3PlCri0y;ar5Aer5Aie,leDr9Cy;!lyn70;a,en,iGl4Tyn;!ma,n31sF;ei6Zi,l2;a04eVilToMuG;anKdJliGst54;aHeGsF;!nAt0W;!n8U;i2Ry;a,iB;!anLcelCd5Sel6Yhan6FlJni,sHva0yG;a,ce;eGie;fi0lCph4V;eGie;en,n1;!a,e,n36;!i10lG;!i0Z;anLle0nIrHsG;i5Nsi5N;i,ri;!a,el6Mif1RnG;a,et9iGy;!e,f1P;a,e6ZiHnG;a,e6YiG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min7;a7eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGob6R;do4;!belGdo4;!a,e,l2G;en1i0ma;a,di4es,gr5O;el8ogG;en1;a,eAia0o0se;aNeKilHoGyacin1N;ll2rten1H;aHdGlaH;a,egard;ry;ath0WiHlGnrietBrmiAst0W;en24ga;di;il72lKnJrGtt2yl72z6A;iGmo4Cri4D;etG;!te;aEnaE;ey,l2;aYeTiOlMold12rIwG;enGyne18;!dolC;acHetGisel8;a,chD;e,ieG;!la;adys,enGor3yn1Y;a,da,na;aJgi,lHna,ov6YselG;a,e,le;da,liG;an;!n0;mYnIorgHrG;ald33i,m2Rtru70;et9i0;a,eGna;s1Nvieve;briel3Cil,le,rnet,yle;aReOio0loMrG;anHe8iG;da,e8;!cG;esHiGoi0G;n1s3S;!ca;!rG;a,en40;lHrnG;!an8;ec3ic3;rHtiGy7;ma;ah,rah;d0FileDkBl00mUn47rRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2F;geni1la,ni3O;h4Zta;meral8peranJtG;eHhGrel6;er;l2Mr;za;iGma,nest27yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoG;lor4Yminiq3Vn0rGtt2;a,eDis,la,othGthy;ea,y;an08naEonAx2;anPbOde,eNiLja,lImetr3nGsir4R;a,iG;ce,se;a,iHla,orGphiA;es,is;a,l5G;dGrdG;re;!d4Jna;!b29oraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1TyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et9iG;!ca,el17ka;arGia;is;a0Oe0Lh03i01lToIrHynG;di,th3;is2Ay03;lOnLrHurG;tn1B;aId26iGn26riA;!nG;a,e,n1;!l1Q;n2sG;tanGuelo;ce,za;eGleD;en,t9;aIeoHotG;il49;!pat4;ir7rIudG;et9iG;a,ne;e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;isJlHmG;aiA;a,eGot9;n1t9;!sa;d4el1NtG;al,el1M;cGli3E;el3ilG;e,ia,y;iXlWmilVndUrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2FsG;a2Eie;iLlJmelIolHrG;ie,ol;!e,in1yn;!a,la;a,eGie,y;ne,y;na,sF;a0Di0D;a,e,l1;isBl2;tlG;in,yn;arb0CeYianXlVoTrG;andRePiIoHyG;an0nn;nwCok7;an2NdgKg0ItG;n27tG;!aHnG;ey,i,y;ny;etG;!t7;an0e,nG;da,na;i7y;bbi7nG;iBn2;ancGossom,ytG;he;ca;aRcky,lin8niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy7;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et9iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi7yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t9;an19elG;le;aYdWeUgQiOja,nHtoGya;inet9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;la;bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n8;da;aTba,eNiKlIyG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i7y;!e;il;ah",
    "Place": "true??aLbJcHdGeEfDgAh9i8jfk,kul,l7m5new eng4ord,p2s1the 0upIyyz;bronx,hamptons;fo,oho,under2yd;acifLek,h0;l,x;land;a0co,idCuc;libu,nhattJ;ax,gw,hr;ax,cn,ndianGst;arlem,kg,nd;ay village,re0;at 0enwich;britain,lak2;co,ra;urope,verglad0;es;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m5ntar1r1sia,tl0;!ant1;ct0;ic0; oce0;an;ericas,s",
    "Month": "true??a6dez5fever4j1ma0nov5set5;io,r??o;an2u0;l0n0;ho;eiro ;embro;bril,gosto",
    "WeekDay": "true??domingo,qu0s??bado,ter??1;art0int0;a-feira",
    "FirstName": "true??aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "Cardinal": "true??bilh??o,cLdDmAnove9o6qu3se2tr0vinte,zero;eze0inO??s;!ntE;is5ssLte6;a1in0;hAze;rItro2;it0nL;enHo0;!c6;!c5nF;eia,il0;!h0;??o,??es;ez4o3u0;as,z0;ent0;as,os;is,ze;!a0e0oi8;nove,sse0;is,te;ator6e4in0;co,q0;u0??0;en0;ta;m,n0;to;ze"
  };

  const BASE = 36;
  const seq = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const cache = seq.split('').reduce(function (h, c, i) {
    h[c] = i;
    return h
  }, {});

  // 0, 1, 2, ..., A, B, C, ..., 00, 01, ... AA, AB, AC, ..., AAA, AAB, ...
  const toAlphaCode = function (n) {
    if (seq[n] !== undefined) {
      return seq[n]
    }
    let places = 1;
    let range = BASE;
    let s = '';
    for (; n >= range; n -= range, places++, range *= BASE) {}
    while (places--) {
      const d = n % BASE;
      s = String.fromCharCode((d < 10 ? 48 : 55) + d) + s;
      n = (n - d) / BASE;
    }
    return s
  };

  const fromAlphaCode = function (s) {
    if (cache[s] !== undefined) {
      return cache[s]
    }
    let n = 0;
    let places = 1;
    let range = BASE;
    let pow = 1;
    for (; places < s.length; n += range, places++, range *= BASE) {}
    for (let i = s.length - 1; i >= 0; i--, pow *= BASE) {
      let d = s.charCodeAt(i) - 48;
      if (d > 10) {
        d -= 7;
      }
      n += d * pow;
    }
    return n
  };

  var encoding = {
    toAlphaCode,
    fromAlphaCode
  };

  const symbols = function (t) {
    //... process these lines
    const reSymbol = new RegExp('([0-9A-Z]+):([0-9A-Z]+)');
    for (let i = 0; i < t.nodes.length; i++) {
      const m = reSymbol.exec(t.nodes[i]);
      if (!m) {
        t.symCount = i;
        break
      }
      t.syms[encoding.fromAlphaCode(m[1])] = encoding.fromAlphaCode(m[2]);
    }
    //remove from main node list
    t.nodes = t.nodes.slice(t.symCount, t.nodes.length);
  };
  var parseSymbols = symbols;

  // References are either absolute (symbol) or relative (1 - based)
  const indexFromRef = function (trie, ref, index) {
    const dnode = encoding.fromAlphaCode(ref);
    if (dnode < trie.symCount) {
      return trie.syms[dnode]
    }
    return index + dnode + 1 - trie.symCount
  };

  const toArray = function (trie) {
    const all = [];
    const crawl = (index, pref) => {
      let node = trie.nodes[index];
      if (node[0] === '!') {
        all.push(pref);
        node = node.slice(1); //ok, we tried. remove it.
      }
      const matches = node.split(/([A-Z0-9,]+)/g);
      for (let i = 0; i < matches.length; i += 2) {
        const str = matches[i];
        const ref = matches[i + 1];
        if (!str) {
          continue
        }
        const have = pref + str;
        //branch's end
        if (ref === ',' || ref === undefined) {
          all.push(have);
          continue
        }
        const newIndex = indexFromRef(trie, ref, index);
        crawl(newIndex, have);
      }
    };
    crawl(0, '');
    return all
  };

  //PackedTrie - Trie traversal of the Trie packed-string representation.
  const unpack$2 = function (str) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0
    };
    //process symbols, if they have them
    if (str.match(':')) {
      parseSymbols(trie);
    }
    return toArray(trie)
  };

  var traverse = unpack$2;

  const unpack = function (str) {
    if (!str) {
      return {}
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('??');
      h[arr[0]] = arr[1];
      return h
    }, {});
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      const arr = traverse(obj[cat]);
      //special case, for botched-boolean
      if (cat === 'true') {
        cat = true;
      }
      for (let i = 0; i < arr.length; i++) {
        const k = arr[i];
        if (all.hasOwnProperty(k) === true) {
          if (Array.isArray(all[k]) === false) {
            all[k] = [all[k], cat];
          } else {
            all[k].push(cat);
          }
        } else {
          all[k] = cat;
        }
      }
    });
    return all
  };

  var unpack$1 = unpack;

  // 01- full-word exceptions
  const checkEx = function (str, ex = {}) {
    if (ex.hasOwnProperty(str)) {
      return ex[str]
    }
    return null
  };

  // 02- suffixes that pass our word through
  const checkSame = function (str, same = []) {
    for (let i = 0; i < same.length; i += 1) {
      if (str.endsWith(same[i])) {
        return str
      }
    }
    return null
  };

  // 03- check rules - longest first
  const checkRules = function (str, fwd, both = {}) {
    fwd = fwd || {};
    let max = str.length - 1;
    // look for a matching suffix
    for (let i = max; i >= 1; i -= 1) {
      let size = str.length - i;
      let suff = str.substring(size, str.length);
      // check fwd rules, first
      if (fwd.hasOwnProperty(suff) === true) {
        return str.slice(0, size) + fwd[suff]
      }
      // check shared rules
      if (both.hasOwnProperty(suff) === true) {
        return str.slice(0, size) + both[suff]
      }
    }
    // try a fallback transform
    if (fwd.hasOwnProperty('')) {
      return str += fwd['']
    }
    if (both.hasOwnProperty('')) {
      return str += both['']
    }
    return null
  };

  //sweep-through all suffixes
  const convert = function (str = '', model = {}) {
    // 01- check exceptions
    let out = checkEx(str, model.ex);
    // 02 - check same
    out = out || checkSame(str, model.same);
    // check forward and both rules
    out = out || checkRules(str, model.fwd, model.both);
    //return unchanged
    out = out || str;
    return out
  };
  var convert$1 = convert;

  const flipObj = function (obj) {
    return Object.entries(obj).reduce((h, a) => {
      h[a[1]] = a[0];
      return h
    }, {})
  };

  const reverse = function (model = {}) {
    return {
      reversed: true,
      // keep these two
      both: flipObj(model.both),
      ex: flipObj(model.ex),
      // swap this one in
      fwd: model.rev || {}
    }
  };
  var reverse$1 = reverse;

  const prefix = /^([0-9]+)/;

  const toObject = function (txt) {
    let obj = {};
    txt.split('??').forEach(str => {
      let [key, vals] = str.split(':');
      vals = (vals || '').split(',');
      vals.forEach(val => {
        obj[val] = key;
      });
    });
    return obj
  };

  const growObject = function (key = '', val = '') {
    val = String(val);
    let m = val.match(prefix);
    if (m === null) {
      return val
    }
    let num = Number(m[1]) || 0;
    let pre = key.substring(0, num);
    let full = pre + val.replace(prefix, '');
    return full
  };

  const unpackOne = function (str) {
    let obj = toObject(str);
    return Object.keys(obj).reduce((h, k) => {
      h[k] = growObject(k, obj[k]);
      return h
    }, {})
  };

  const uncompress = function (model = {}) {
    if (typeof model === 'string') {
      model = JSON.parse(model);
    }
    model.fwd = unpackOne(model.fwd || '');
    model.both = unpackOne(model.both || '');
    model.rev = unpackOne(model.rev || '');
    model.ex = unpackOne(model.ex || '');
    return model
  };
  var uncompress$1 = uncompress;

  // generated in ./lib/models
  var model$1 = {
    "adjectives": {
      "f": {
        "fwd": "1:os,a",
        "both": "1:??o,??,z,e??2:em,el,il??3:aso,zul??4a:nhol????ia:eu??esa:??s????:au??a:o",
        "rev": "4:anja??1m:oa??2s:co??3s:ito",
        "ex": "2a:bom"
      },
      "mp": {
        "fwd": "s:??eis:il",
        "both": "1:????3:nja??2es:m??o??2is:vel??2a:itos??1??is:hol??1es:z??1is:ul??1a:cos??eses:??s??ns:m",
        "rev": "1:os,us??2:ves,des,tes??3:bres,oces??4:remes??1il:ceis??1o:sa",
        "ex": "3a:raso"
      },
      "fp": {
        "fwd": "2:os??eis:il??1is:el",
        "both": "3:nja??4ias:ropeu??3s:aso??2as:ol??2es:iz??1s:??o,e??1ns:em??1as:om??1is:ul??esas:??s????s:au??as:o",
        "rev": "1:????3:cos??4:itos??1il:ceis??2l:veis",
        "ex": "2:s??"
      }
    },
    "conditional": {
      "first": {
        "fwd": "ia:??oria:??r??coitaria:??oitar??1ria:izer??2ria:fazer??2caria:in??ar",
        "both": "4ria:sprazer??3caria:tro??ar,bra??ar",
        "rev": "2:eria,iria,oria??3:maria,daria,laria,taria,garia,??aria,oaria,haria,varia,saria,jaria,paria,baria,zaria,naria,iaria,earia,uaria,xaria??4:ncaria,traria,araria,oraria,uraria,iraria,icaria,ucaria,nraria,graria,braria,eraria,rraria,draria,rcaria,ecaria,scaria,fraria,lcaria,ufaria,craria,lraria,vraria,ofaria,ifaria,afaria,lfaria??5:mpraria,locaria,vocaria,opraria,tacaria,hocaria,focaria,lacaria,upraria,pocaria,bocaria,pacaria,hacaria,arfaria,tocaria??2??ar:mocaria??3zer:sfaria,sdiria,ldiria,-faria??4zer:radiria,endiria,mefaria,safaria,erdiria??4??ar:trincaria??5zer:trafaria,rrefaria",
        "ex": "2ria:fazer,dizer??3ria:trazer,afazer??2caria:co??ar,ro??ar,la??ar??3caria:cal??ar,for??ar,ati??ar??4caria:remo??ar??2ia:ir??3ia:dar??1oria:p??r??5ia:tocar,focar,tacar,sacar,locar,socar,arfar??4ria:refazer,redizer??6ia:trocar,brocar,blefar,surfar??4ia:orar,irar,arar,erar??5ria:condizer,perfazer,predizer??10ia:reciprocar,embasbacar??8ia:triunfar,derrocar,atarefar??7ia:atracar,xerocar,ensacar,assacar??1coitaria:a??oitar??7ria:putrefazer,liquefazer??6ria:rarefazer??9ia:atarracar,esburacar"
      },
      "second": {
        "fwd": "ias:??orias:??r??coitarias:??oitar??1rias:izer??2rias:fazer??2carias:in??ar",
        "both": "4rias:sprazer??3carias:tro??ar,bra??ar",
        "rev": "2:erias,irias,orias??3:marias,darias,larias,tarias,garias,??arias,oarias,harias,varias,sarias,jarias,parias,barias,zarias,narias,iarias,earias,uarias,xarias??4:ncarias,trarias,ararias,orarias,urarias,irarias,icarias,ucarias,nrarias,grarias,brarias,erarias,rrarias,drarias,rcarias,ecarias,scarias,frarias,lcarias,ufarias,crarias,lrarias,vrarias,ofarias,ifarias,afarias,lfarias??5:mprarias,locarias,vocarias,oprarias,tacarias,hocarias,focarias,lacarias,uprarias,pocarias,bocarias,pacarias,hacarias,arfarias,tocarias??2??ar:mocarias??3zer:sfarias,sdirias,ldirias,-farias??4zer:radirias,endirias,mefarias,safarias,erdirias??4??ar:trincarias??5zer:trafarias,rrefarias",
        "ex": "2rias:fazer,dizer??3rias:trazer,afazer??2carias:co??ar,ro??ar,la??ar??3carias:cal??ar,for??ar,ati??ar??4carias:remo??ar??2ias:ir??3ias:dar??1orias:p??r??5ias:tocar,focar,tacar,sacar,locar,socar,arfar??4rias:refazer,redizer??6ias:trocar,brocar,blefar,surfar??4ias:orar,irar,arar,erar??5rias:condizer,perfazer,predizer??10ias:reciprocar,embasbacar??8ias:triunfar,derrocar,atarefar??7ias:atracar,xerocar,ensacar,assacar??1coitarias:a??oitar??7rias:putrefazer,liquefazer??6rias:rarefazer??9ias:atarracar,esburacar"
      },
      "third": {
        "fwd": "ia:??oria:??r??coitaria:??oitar??1ria:izer??2ria:fazer??2caria:in??ar",
        "both": "4ria:sprazer??3caria:tro??ar,bra??ar",
        "rev": "2:eria,iria,oria??3:maria,daria,laria,taria,garia,??aria,oaria,haria,varia,saria,jaria,paria,baria,zaria,naria,iaria,earia,uaria,xaria??4:ncaria,traria,araria,oraria,uraria,iraria,icaria,ucaria,nraria,graria,braria,eraria,rraria,draria,rcaria,ecaria,scaria,fraria,lcaria,ufaria,craria,lraria,vraria,ofaria,ifaria,afaria,lfaria??5:mpraria,locaria,vocaria,opraria,tacaria,hocaria,focaria,lacaria,upraria,pocaria,bocaria,pacaria,hacaria,arfaria,tocaria??2??ar:mocaria??3zer:sfaria,sdiria,ldiria,-faria??4zer:radiria,endiria,mefaria,safaria,erdiria??4??ar:trincaria??5zer:trafaria,rrefaria",
        "ex": "2ria:fazer,dizer??3ria:trazer,afazer??2caria:co??ar,ro??ar,la??ar??3caria:cal??ar,for??ar,ati??ar??4caria:remo??ar??2ia:ir??3ia:dar??1oria:p??r??5ia:tocar,focar,tacar,sacar,locar,socar,arfar??4ria:refazer,redizer??6ia:trocar,brocar,blefar,surfar??4ia:orar,irar,arar,erar??5ria:condizer,perfazer,predizer??10ia:reciprocar,embasbacar??8ia:triunfar,derrocar,atarefar??7ia:atracar,xerocar,ensacar,assacar??1coitaria:a??oitar??7ria:putrefazer,liquefazer??6ria:rarefazer??9ia:atarracar,esburacar"
      },
      "firstPlural": {
        "fwd": "??amos:??or??amos:??r??coitar??amos:??oitar??1r??amos:izer??2r??amos:fazer??2car??amos:in??ar",
        "both": "4r??amos:sprazer??3car??amos:tro??ar,bra??ar",
        "rev": "2:er??amos,ir??amos,or??amos??3:mar??amos,dar??amos,lar??amos,tar??amos,gar??amos,??ar??amos,oar??amos,har??amos,var??amos,sar??amos,jar??amos,par??amos,bar??amos,zar??amos,nar??amos,iar??amos,ear??amos,uar??amos,xar??amos??4:ncar??amos,trar??amos,arar??amos,orar??amos,urar??amos,irar??amos,icar??amos,ucar??amos,nrar??amos,grar??amos,brar??amos,erar??amos,rrar??amos,drar??amos,rcar??amos,ecar??amos,scar??amos,frar??amos,lcar??amos,ufar??amos,crar??amos,lrar??amos,vrar??amos,ofar??amos,ifar??amos,afar??amos,lfar??amos??5:mprar??amos,locar??amos,vocar??amos,oprar??amos,tacar??amos,hocar??amos,focar??amos,lacar??amos,uprar??amos,pocar??amos,bocar??amos,pacar??amos,hacar??amos,arfar??amos,tocar??amos??2??ar:mocar??amos??3zer:sfar??amos,sdir??amos,ldir??amos,-far??amos??4zer:radir??amos,endir??amos,mefar??amos,safar??amos,erdir??amos??4??ar:trincar??amos??5zer:trafar??amos,rrefar??amos",
        "ex": "2r??amos:fazer,dizer??3r??amos:trazer,afazer??2car??amos:co??ar,ro??ar,la??ar??3car??amos:cal??ar,for??ar,ati??ar??4car??amos:remo??ar??2??amos:ir??3??amos:dar??1or??amos:p??r??5??amos:tocar,focar,tacar,sacar,locar,socar,arfar??4r??amos:refazer,redizer??6??amos:trocar,brocar,blefar,surfar??4??amos:orar,irar,arar,erar??5r??amos:condizer,perfazer,predizer??10??amos:reciprocar,embasbacar??8??amos:triunfar,derrocar,atarefar??7??amos:atracar,xerocar,ensacar,assacar??1coitar??amos:a??oitar??7r??amos:putrefazer,liquefazer??6r??amos:rarefazer??9??amos:atarracar,esburacar"
      },
      "secondPlural": {
        "fwd": "??eis:??or??eis:??r??coitar??eis:??oitar??1r??eis:izer??2r??eis:fazer??2car??eis:in??ar",
        "both": "4r??eis:sprazer??3car??eis:tro??ar,bra??ar",
        "rev": "2:er??eis,ir??eis,or??eis??3:mar??eis,dar??eis,lar??eis,tar??eis,gar??eis,??ar??eis,oar??eis,har??eis,var??eis,sar??eis,jar??eis,par??eis,bar??eis,zar??eis,nar??eis,iar??eis,ear??eis,uar??eis,xar??eis??4:ncar??eis,trar??eis,arar??eis,orar??eis,urar??eis,irar??eis,icar??eis,ucar??eis,nrar??eis,grar??eis,brar??eis,erar??eis,rrar??eis,drar??eis,rcar??eis,ecar??eis,scar??eis,frar??eis,lcar??eis,ufar??eis,crar??eis,lrar??eis,vrar??eis,ofar??eis,ifar??eis,afar??eis,lfar??eis??5:mprar??eis,locar??eis,vocar??eis,oprar??eis,tacar??eis,hocar??eis,focar??eis,lacar??eis,uprar??eis,pocar??eis,bocar??eis,pacar??eis,hacar??eis,arfar??eis,tocar??eis??2??ar:mocar??eis??3zer:sfar??eis,sdir??eis,ldir??eis,-far??eis??4zer:radir??eis,endir??eis,mefar??eis,safar??eis,erdir??eis??4??ar:trincar??eis??5zer:trafar??eis,rrefar??eis",
        "ex": "2r??eis:fazer,dizer??3r??eis:trazer,afazer??2car??eis:co??ar,ro??ar,la??ar??3car??eis:cal??ar,for??ar,ati??ar??4car??eis:remo??ar??2??eis:ir??3??eis:dar??1or??eis:p??r??5??eis:tocar,focar,tacar,sacar,locar,socar,arfar??4r??eis:refazer,redizer??6??eis:trocar,brocar,blefar,surfar??4??eis:orar,irar,arar,erar??5r??eis:condizer,perfazer,predizer??10??eis:reciprocar,embasbacar??8??eis:triunfar,derrocar,atarefar??7??eis:atracar,xerocar,ensacar,assacar??1coitar??eis:a??oitar??7r??eis:putrefazer,liquefazer??6r??eis:rarefazer??9??eis:atarracar,esburacar"
      },
      "thirdPlural": {
        "fwd": "iam:??oriam:??r??coitariam:??oitar??1riam:izer??2riam:fazer??2cariam:in??ar",
        "both": "4riam:sprazer??3cariam:tro??ar,bra??ar",
        "rev": "2:eriam,iriam,oriam??3:mariam,dariam,lariam,tariam,gariam,??ariam,oariam,hariam,variam,sariam,jariam,pariam,bariam,zariam,nariam,iariam,eariam,uariam,xariam??4:ncariam,trariam,arariam,orariam,urariam,irariam,icariam,ucariam,nrariam,grariam,brariam,erariam,rrariam,drariam,rcariam,ecariam,scariam,frariam,lcariam,ufariam,crariam,lrariam,vrariam,ofariam,ifariam,afariam,lfariam??5:mprariam,locariam,vocariam,oprariam,tacariam,hocariam,focariam,lacariam,uprariam,pocariam,bocariam,pacariam,hacariam,arfariam,tocariam??2??ar:mocariam??3zer:sfariam,sdiriam,ldiriam,-fariam??4zer:radiriam,endiriam,mefariam,safariam,erdiriam??4??ar:trincariam??5zer:trafariam,rrefariam",
        "ex": "2riam:fazer,dizer??3riam:trazer,afazer??2cariam:co??ar,ro??ar,la??ar??3cariam:cal??ar,for??ar,ati??ar??4cariam:remo??ar??2iam:ir??3iam:dar??1oriam:p??r??5iam:tocar,focar,tacar,sacar,locar,socar,arfar??4riam:refazer,redizer??6iam:trocar,brocar,blefar,surfar??4iam:orar,irar,arar,erar??5riam:condizer,perfazer,predizer??10iam:reciprocar,embasbacar??8iam:triunfar,derrocar,atarefar??7iam:atracar,xerocar,ensacar,assacar??1coitariam:a??oitar??7riam:putrefazer,liquefazer??6riam:rarefazer??9iam:atarracar,esburacar"
      }
    },
    "futureTense": {
      "first": {
        "fwd": "ei:??orei:??r??1rei:izer??2rei:fazer??2carei:ti??ar",
        "both": "4??:doer??3carei:bra??ar??coitarei:??oitar",
        "rev": "2:erei,irei,orei??3:marei,darei,larei,garei,??arei,rarei,oarei,harei,sarei,jarei,parei,barei,zarei,narei,iarei,uarei,varei,earei,xarei??4:starei,ntarei,ncarei,ltarei,scarei,rcarei,atarei,ocarei,ucarei,icarei,ptarei,etarei,otarei,rtarei,ctarei,utarei,ecarei,afarei,nfarei,ufarei,xtarei,ofarei??5:eitarei,ditarei,vitarei,sitarei,tacarei,litarei,ritarei,mitarei,citarei,pitarei,lacarei,gitarei??:????2??ar:alcarei??3zer:sfarei,efarei,sdirei,ldirei??4zer:radirei,erfarei,endirei",
        "ex": "2rei:fazer,dizer??3rei:trazer,afazer??4??:doer??7??:aprazer,grassar??2carei:co??ar,ro??ar,la??ar??6??:prazer??3carei:cal??ar,for??ar,ati??ar??9??:concernir??5??:urgir??2ei:ir??3ei:dar??1orei:p??r??5rei:condizer,predizer??5ei:citar,tacar,fitar,sacar,ditar,arfar??7ei:habitar,atracar??4ei:atar??6ei:quitar,grifar??8ei:inculcar"
      },
      "second": {
        "fwd": "??s:??or??s:??r??1r??s:izer??2r??s:fazer??2car??s:ti??ar",
        "both": "4??o:doer??3car??s:bra??ar??coitar??s:??oitar",
        "rev": "2:er??s,ir??s,or??s??3:mar??s,dar??s,lar??s,gar??s,??ar??s,rar??s,oar??s,har??s,sar??s,jar??s,par??s,bar??s,zar??s,nar??s,iar??s,uar??s,var??s,ear??s,xar??s??4:star??s,ntar??s,ncar??s,ltar??s,scar??s,rcar??s,atar??s,ocar??s,ucar??s,icar??s,ptar??s,etar??s,otar??s,rtar??s,ctar??s,utar??s,ecar??s,afar??s,nfar??s,ufar??s,xtar??s,ofar??s??5:eitar??s,ditar??s,vitar??s,sitar??s,tacar??s,litar??s,ritar??s,mitar??s,citar??s,pitar??s,lacar??s,gitar??s??:??o??2??ar:alcar??s??3zer:sfar??s,efar??s,sdir??s,ldir??s??4zer:radir??s,erfar??s,endir??s",
        "ex": "2r??s:fazer,dizer??3r??s:trazer,afazer??4??o:doer??7??o:aprazer,grassar??2car??s:co??ar,ro??ar,la??ar??6??o:prazer??3car??s:cal??ar,for??ar,ati??ar??9??o:concernir??5??o:urgir??2??s:ir??3??s:dar??1or??s:p??r??5r??s:condizer,predizer??5??s:citar,tacar,fitar,sacar,ditar,arfar??7??s:habitar,atracar??4??s:atar??6??s:quitar,grifar??8??s:inculcar"
      },
      "third": {
        "fwd": "??:??or??:??r??1r??:izer??2r??:fazer??2car??:ti??ar",
        "both": "3car??:bra??ar??coitar??:??oitar",
        "rev": "2:er??,ir??,or????3:mar??,dar??,lar??,gar??,??ar??,rar??,oar??,har??,sar??,jar??,par??,bar??,zar??,nar??,iar??,uar??,var??,ear??,xar????4:star??,ntar??,ncar??,ltar??,scar??,rcar??,atar??,ocar??,ucar??,icar??,ptar??,etar??,otar??,rtar??,ctar??,utar??,ecar??,afar??,nfar??,ufar??,xtar??,ofar????5:eitar??,ditar??,vitar??,sitar??,tacar??,litar??,ritar??,mitar??,citar??,pitar??,lacar??,gitar????2??ar:alcar????3zer:sfar??,efar??,sdir??,ldir????4zer:radir??,erfar??,endir??",
        "ex": "2r??:fazer,dizer??3r??:trazer,afazer??2car??:co??ar,ro??ar,la??ar??3car??:cal??ar,for??ar,ati??ar??2??:ir??3??:dar??1or??:p??r??5r??:condizer,predizer??5??:citar,tacar,fitar,sacar,ditar,arfar??7??:habitar,atracar??4??:atar??6??:quitar,grifar??8??:inculcar"
      },
      "firstPlural": {
        "fwd": "emos:??oremos:??r??1remos:izer??2remos:fazer??2caremos:ti??ar",
        "both": "3caremos:bra??ar??coitaremos:??oitar",
        "rev": "2:eremos,iremos,oremos??3:maremos,daremos,laremos,garemos,??aremos,raremos,oaremos,haremos,saremos,jaremos,paremos,baremos,zaremos,naremos,iaremos,uaremos,varemos,earemos,xaremos??4:staremos,ntaremos,ncaremos,ltaremos,scaremos,rcaremos,ataremos,ocaremos,ucaremos,icaremos,ptaremos,etaremos,otaremos,rtaremos,ctaremos,utaremos,ecaremos,afaremos,nfaremos,ufaremos,xtaremos,ofaremos??5:eitaremos,ditaremos,vitaremos,sitaremos,tacaremos,litaremos,ritaremos,mitaremos,citaremos,pitaremos,lacaremos,gitaremos??2??ar:alcaremos??3zer:sfaremos,efaremos,sdiremos,ldiremos??4zer:radiremos,erfaremos,endiremos",
        "ex": "2remos:fazer,dizer??3remos:trazer,afazer??2caremos:co??ar,ro??ar,la??ar??3caremos:cal??ar,for??ar,ati??ar??2emos:ir??3emos:dar??1oremos:p??r??5remos:condizer,predizer??5emos:citar,tacar,fitar,sacar,ditar,arfar??7emos:habitar,atracar??4emos:atar??6emos:quitar,grifar??8emos:inculcar"
      },
      "secondPlural": {
        "fwd": "eis:??oreis:??r??1reis:izer??2reis:fazer??2careis:ti??ar",
        "both": "3careis:bra??ar??coitareis:??oitar",
        "rev": "2:ereis,ireis,oreis??3:mareis,dareis,lareis,gareis,??areis,rareis,oareis,hareis,sareis,jareis,pareis,bareis,zareis,nareis,iareis,uareis,vareis,eareis,xareis??4:stareis,ntareis,ncareis,ltareis,scareis,rcareis,atareis,ocareis,ucareis,icareis,ptareis,etareis,otareis,rtareis,ctareis,utareis,ecareis,afareis,nfareis,ufareis,xtareis,ofareis??5:eitareis,ditareis,vitareis,sitareis,tacareis,litareis,ritareis,mitareis,citareis,pitareis,lacareis,gitareis??2??ar:alcareis??3zer:sfareis,efareis,sdireis,ldireis??4zer:radireis,erfareis,endireis",
        "ex": "2reis:fazer,dizer??3reis:trazer,afazer??2careis:co??ar,ro??ar,la??ar??3careis:cal??ar,for??ar,ati??ar??2eis:ir??3eis:dar??1oreis:p??r??5reis:condizer,predizer??5eis:citar,tacar,fitar,sacar,ditar,arfar??7eis:habitar,atracar??4eis:atar??6eis:quitar,grifar??8eis:inculcar"
      },
      "thirdPlural": {
        "fwd": "??o:??or??o:??r??1r??o:izer??2r??o:fazer??2car??o:ti??ar",
        "both": "3car??o:bra??ar??coitar??o:??oitar",
        "rev": "2:er??o,ir??o,or??o??3:mar??o,dar??o,lar??o,gar??o,??ar??o,rar??o,oar??o,har??o,sar??o,jar??o,par??o,bar??o,zar??o,nar??o,iar??o,uar??o,var??o,ear??o,xar??o??4:star??o,ntar??o,ncar??o,ltar??o,scar??o,rcar??o,atar??o,ocar??o,ucar??o,icar??o,ptar??o,etar??o,otar??o,rtar??o,ctar??o,utar??o,ecar??o,afar??o,nfar??o,ufar??o,xtar??o,ofar??o??5:eitar??o,ditar??o,vitar??o,sitar??o,tacar??o,litar??o,ritar??o,mitar??o,citar??o,pitar??o,lacar??o,gitar??o??2??ar:alcar??o??3zer:sfar??o,efar??o,sdir??o,ldir??o??4zer:radir??o,erfar??o,endir??o",
        "ex": "2r??o:fazer,dizer??3r??o:trazer,afazer??2car??o:co??ar,ro??ar,la??ar??3car??o:cal??ar,for??ar,ati??ar??2??o:ir??3??o:dar??1or??o:p??r??5r??o:condizer,predizer??5??o:citar,tacar,fitar,sacar,ditar,arfar??7??o:habitar,atracar??4??o:atar??6??o:quitar,grifar??8??o:inculcar"
      }
    },
    "imperativeNeg": {
      "first": {
        "fwd": "onhas:??r??jas:gir,ger??igas:eguir??iras:erir??as:uer????as:cir??urtas:ortir??coites:??oitar??1jas:aver??1as:mer,rer,ber,her,per,ser,hir??1gas:izer??1es:iar??2as:ndir,rter,mbir,ulir,idir,irir,rdir??2eies:nsiar??2??as:pedir,medir??2ques:in??ar??3es:iguar,nquar??3as:arrir??4es:inguar,coitar",
        "both": "5as:ementir,flectir,mprazer??5jas:terver??5ejas:brestar??5nhas:treter??4ues:umegar,amegar,elegar??4es:foitar,noitar??4as:inibir,opelir,xceler,rreter,epolir,rantir,orrir??4intas:ressentir??4jas:tever??4eies:cendiar??4iras:equerer??4enhas:tervir??3as:bolir,arzir,abrir,orver,anzir,enzer,xibir,rguir,order,meter,rever,artir??3ues:iegar,pegar,negar,fegar,segar,vegar,regar,hegar??3es:bitar,titar,vitar,ejuar,pitar,uitar,gitar,litar,citar,sitar,mitar,ditar,ritar,eitar??3ques:emo??ar,tro??ar,bra??ar??3idas:egredir,sgredir??3ias:crer??3eies:mediar??3nhas:ster,bter,nter??3enhas:rovir??2as:lpir,orir,cuir,urir,alir,odir,plir,adir,tuir,ater,upir,imir,ozer,trir,udir,buir,nguir,over,lver,nuir,uzir,eder,utir,luir,itir,ruir,stir,suir,umir,prir,ubir,iver,nder,air??2es:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,rtar,tuar,etar,utar,atar,nuar,ltar,star,ntar??2??les:baular??2enhas:avir,evir,nvir??2??zes:juizar??2intas:smentir,nsentir??2ues:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar??2ilas:mpelir,xpelir??2??nes:ruinar??2ita:mpetir??2has:aler??2cas:erder??1??des:iudar??1irvas:servir??1??as:uvir,azer??1??zes:aizar,eizar??1??ces:iu??ar??1??sques:aiscar??1??guas:saguar??1es:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar??1irjas:vergir??1??gues:xaguar??1iras:arir??1??bas:oibir??1as:oer,nir,xer??1ulas:golir??1??nas:eunir??1itas:letir??1ies:ear??1nhas:or??1ibas:aber??1ssas:oder????legues:olegar??irzas:erzir????nquas:inquir??igras:egrir??ispas:espir??ubras:obrir????ques:equar??irtas:ertir??ussas:ossir????as:cer??ces:??ar??ques:car??urmas:ormir",
        "rev": "ar:??s??entir:intas??ervir:irvas??udar:??des??iliar:??lies??ectir:ictas??1rer:eiras??1zer:agas??1r:eias??1gir:ijas,ujas,ljas??1eguir:sigas??1erir:firas,diras,giras,siras,tiras??1etir:pitas??1edir:ridas??1enir:vinas??1estir:vistas??1ar:tes??1ir:venhas??2ar:stejas,vies,pies,oies,fies,cies,ries,gies,dies,aies,ties,bies,sies,zies,nies,uies,mies,xies??2er:omas,rras,ebas,chas,fras,etas,emas,osas,mpas??2gir:injas,urjas,eajas,erjas,oajas,unjas,arjas??2r:vejas,tenhas??2ger:lejas,anjas,rejas,onjas??2zer:digas??2cir:ar??as??2uer:rgas??3ir:vidas,cidas,undas,uspas,andas,indas,sidas,lidas,uiras,unhas,bulas,redas,urzas,feras,ardas??3ger:otejas??3er:olhas,ambas,ervas,ertas,ueras,relas,essas??3ar:ilies,plies,alies,olies??3dir:xpe??as??4dir:espe??as,impe??as,esme??as??4gir:terajas??4ar:zigues,relies??4ir:cumbas,apulas,sentas,lanhas??4??ar:trinques??4ger:sterjas??5ar:pinques,ginques,anigues",
        "ex": "v??s:ir????gues:aguar??2jas:ser,ver,haver,reger,viger??1enhas:vir??3ejas:estar??2nhas:ter??1??s:dar??3iras:querer??3gas:trazer??2as:rir??2ias:ler??1intas:sentir,mentir??2??as:pedir,medir??3as:abrir,dever,meter,jazer,arder,bulir,urdir??3ias:crer??3ues:pegar,negar,regar,cegar,legar,segar??5jas:prover,prever??1istas:vestir??1irvas:servir??4jas:rever??2eies:odiar??4nhas:deter,reter??3itas:repetir??1ulas:polir??4as:curtir,cuspir,ferver,inibir,treler,zurzir,zumbir,condir,surdir,garrir??2es:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar??3idas:agredir??3eies:mediar,ansiar??4inas:prevenir??3enhas:advir??3istas:investir,revestir??2??des:saudar??2ques:co??ar,ro??ar,la??ar??3nhas:ater??5idas:progredir??3ques:cal??ar,for??ar,ati??ar??3es:citar,fitar,ditar,pitar,eguar,aliar,chiar??4ues:alegar??3??lies:mobiliar??3intas:assentir??7jas:entrever??2enhas:avir??4ias:reler??4intas:ressentir??7as:dissentir??1as:rer??9as:retrogredir??8as:correferir??2ictas:flectir??4es:poitar??1onhas:p??r??2gas:dizer??1jas:agir??1igas:seguir??1iras:ferir,gerir??4??as:impedir??7es:averiguar??1urtas:sortir??5es:minguar??1coites:a??oitar"
      },
      "second": {
        "fwd": "onha:??r??ja:gir,ger??iga:eguir??ira:erir??a:uer??urta:ortir??coite:??oitar??1ja:aver??1a:mer,rer,ber,her,per,ser,hir??1ga:izer??1e:iar??2a:ndir,rter,mbir,ulir,idir,irir,rdir??2eie:nsiar??2??a:pedir,medir??2que:in??ar??3e:iguar,nquar??3a:arrir??4e:inguar,coitar",
        "both": "5a:ementir,flectir,mprazer??5ja:terver??5eja:brestar??5nha:treter??4ue:umegar,amegar,elegar??4e:foitar,noitar??4a:inibir,opelir,xceler,rreter,epolir,rantir,orrir??4inta:ressentir??4ja:tever??4eie:cendiar??4ira:equerer??4enha:tervir??3a:bolir,arzir,abrir,orver,anzir,enzer,xibir,rguir,order,meter,rever,artir??3ue:iegar,pegar,negar,fegar,segar,vegar,regar,hegar??3e:bitar,titar,vitar,ejuar,pitar,uitar,gitar,litar,citar,sitar,mitar,ditar,ritar,eitar??3que:emo??ar,tro??ar,bra??ar??3ida:egredir,sgredir??3ia:crer??3eie:mediar??3nha:ster,bter,nter??3enha:rovir??2a:lpir,orir,cuir,urir,alir,odir,plir,adir,tuir,ater,upir,imir,ozer,trir,udir,buir,nguir,over,lver,nuir,uzir,eder,utir,luir,itir,ruir,stir,suir,umir,prir,ubir,iver,nder,air??2e:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,rtar,tuar,etar,utar,atar,nuar,ltar,star,ntar??2??le:baular??2enha:avir,evir,nvir??2??ze:juizar??2inta:smentir,nsentir??2ue:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar??2ila:mpelir,xpelir??2??ne:ruinar??2itas:mpetir??2ha:aler??2ca:erder??1??de:iudar??1irva:servir??1??a:uvir,azer??1??ze:aizar,eizar??1??ce:iu??ar??1??sque:aiscar??1??gua:saguar??1e:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar??1irja:vergir??1??gue:xaguar??1ira:arir??1??ba:oibir??1a:oer,nir,xer??1ula:golir??1??na:eunir??1ita:letir??1ie:ear??1nha:or??1iba:aber??1ssa:oder????legue:olegar??irza:erzir????nqua:inquir??igra:egrir????as:cir??ispa:espir??ubra:obrir????que:equar??irta:ertir??ussa:ossir????a:cer??ce:??ar??que:car??urma:ormir",
        "rev": "ar:????entir:inta??ervir:irva??udar:??de??iliar:??lie??ectir:icta??1rer:eira??1zer:aga??1r:eia??1gir:ija,uja,lja??1eguir:siga??1erir:fira,dira,gira,sira,tira??1etir:pita??1edir:rida??1enir:vina??1estir:vista??1ar:te??1ir:venha??2ar:steja,vie,pie,oie,fie,cie,rie,gie,die,aie,tie,bie,sie,zie,nie,uie,mie,xie??2er:oma,rra,eba,cha,fra,eta,ema,osa,mpa??2gir:inja,urja,eaja,erja,oaja,unja,arja??2r:veja,tenha??2ger:leja,anja,reja,onja??2zer:diga??2uer:rga??3ir:vida,cida,unda,uspa,anda,inda,sida,lida,uira,unha,bula,reda,urza,fera,arda??3ger:oteja??3er:olha,amba,erva,erta,uera,rela,essa??3ar:ilie,plie,alie,olie??3dir:xpe??a??4dir:espe??a,impe??a,esme??a??4gir:teraja??4ar:zigue,relie??4ir:cumba,apula,senta,lanha??4??ar:trinque??4ger:sterja??5ar:pinque,ginque,anigue",
        "ex": "v??:ir????gue:aguar??2ja:ser,ver,haver,reger,viger??1enha:vir??3eja:estar??2nha:ter??1??:dar??3ira:querer??3ga:trazer??2a:rir??2ia:ler??1inta:sentir,mentir??2??a:pedir,medir??3a:abrir,dever,meter,jazer,arder,bulir,urdir??3ia:crer??3ue:pegar,negar,regar,cegar,legar,segar??5ja:prover,prever??1ista:vestir??1irva:servir??4ja:rever??2eie:odiar??4nha:deter,reter??3ita:repetir??1ula:polir??4a:curtir,cuspir,ferver,inibir,treler,zurzir,zumbir,condir,surdir,garrir??2e:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar??3ida:agredir??3eie:mediar,ansiar??4ina:prevenir??3enha:advir??3ista:investir,revestir??2??de:saudar??2que:co??ar,ro??ar,la??ar??3nha:ater??5ida:progredir??3que:cal??ar,for??ar,ati??ar??3e:citar,fitar,ditar,pitar,eguar,aliar,chiar??4ue:alegar??3??lie:mobiliar??3inta:assentir??7ja:entrever??2enha:avir??4ia:reler??4inta:ressentir??7a:dissentir??1a:rer??9a:retrogredir??8a:correferir??2icta:flectir??4e:poitar??1onha:p??r??2ga:dizer??1ja:agir??1iga:seguir??1ira:ferir,gerir??4??a:impedir??7e:averiguar??1urta:sortir??5e:minguar??1coite:a??oitar"
      },
      "third": {
        "fwd": "onhamos:??r??jamos:gir,ger??igamos:eguir??iramos:erir??amos:uer????amos:cir??urtamos:ortir??coitemos:??oitar??1amos:mer,rer,ber,bir,her,per,ser,hir??1gamos:izer??2amos:idir,ndir,rter,nzer,ulir,irir,rdir??2??amos:pedir,medir??2quemos:in??ar??3amos:urtir,arrir",
        "both": "5amos:ementir,flectir,mprazer??5ejamos:brestar??5mos:saguar??5nhamos:treter??4amos:morder,opelir,xceler,inquir,rreter,orrir??4nhamos:uster,bster??4jamos:tever??4iramos:equerer??4enhamos:tervir??3amos:scuir,bolir,arzir,urzir,abrir,anzir,polir,rguir,meter,uspir,antir,ssuir,artir??3quemos:emo??ar,tro??ar??3intamos:essentir??3idamos:egredir,sgredir??3iamos:crer??3inamos:revenir??3enhamos:rovir??3nhamos:nter??2amos:lpir,orir,urir,alir,odir,ater,plir,upir,imir,eder,trir,udir,buir,nguir,tuir,adir,nuir,uzir,ruir,utir,luir,itir,umir,prir,stir,nder,air??2intamos:smentir,nsentir??2istamos:evestir??2ilamos:mpelir,xpelir??2enhamos:avir,evir,nvir??2ita:mpetir??2hamos:aler??2camos:erder??1irvamos:servir??1irjamos:vergir??1iramos:arir??1amos:oer,nir,xer,ver??1ulamos:golir??1itamos:letir??1nhamos:or??1uemos:gar??1??amos:uvir,azer??1ssamos:oder??irzamos:erzir??igramos:egrir??ispamos:espir??ubramos:obrir??irtamos:ertir??ussamos:ossir????amos:cer??cemos:??ar??quemos:car??urmamos:ormir??emos:ar",
        "rev": "entir:intamos??ervir:irvamos??ectir:ictamos??1rer:eiramos??1zer:agamos??1r:eiamos??1ber:aibamos??1gir:ijamos,ujamos,ljamos??1eguir:sigamos??1erir:firamos,diramos,giramos,siramos,tiramos??1etir:pitamos??1edir:ridamos??1ir:venhamos??1estir:vistamos??2ar:stejamos??2er:omamos,rramos,ebamos,framos,emamos,chamos,azamos,mpamos,osamos??2gir:injamos,urjamos,eajamos,erjamos,oajamos,unjamos,arjamos??2r:vejamos,tenhamos??2ger:lejamos,anjamos,rejamos??2zer:digamos??2cir:ar??amos??2uer:rgamos??3ir:vidamos,cidamos,undamos,oibamos,andamos,umbamos,indamos,pulamos,sidamos,entamos,uiramos,redamos,nibamos,urdamos,anhamos??3ger:otejamos??3er:olhamos,ordamos,ambamos,ertamos,enzamos,ueramos,relamos??3??ar:braquemos??3dir:xpe??amos,sme??amos??4dir:espe??amos,impe??amos??4gir:terajamos??4iar:obilemos??4ir:olidamos,runhamos,cardamos,eferamos??4??ar:trinquemos??5er:bressamos",
        "ex": "vamos:ir??2jamos:ser,ver,haver,reger,viger??1enhamos:vir??3ejamos:estar??2nhamos:ter??3iramos:querer??3gamos:trazer??2amos:rir??2iamos:ler??2ibamos:saber,caber??1intamos:sentir,mentir??2??amos:pedir,medir??3amos:abrir,meter,jazer,cozer,arder,subir,bulir,urdir??3iamos:crer??5jamos:prover,prever??1istamos:vestir??1irvamos:servir??4jamos:rever??4nhamos:deter,reter,obter??3itamos:repetir??1ulamos:polir??4quemos:abra??ar??4amos:morder,treler,curtir,exibir,ebulir,elidir,ilidir,condir,garrir??3idamos:agredir??3enhamos:advir??3istamos:investir??2quemos:co??ar,ro??ar,la??ar??3nhamos:ater??5idamos:progredir??3quemos:cal??ar,for??ar,ati??ar??5emos:mobiliar??3intamos:assentir??7jamos:entrever,interver??2enhamos:avir??4iamos:reler??7amos:dissentir??1amos:rer??9amos:retrogredir??8amos:correferir??2ictamos:flectir??1onhamos:p??r??2gamos:dizer??1jamos:agir??1igamos:seguir??1iramos:ferir,gerir??4??amos:impedir??1urtamos:sortir??1coitemos:a??oitar??3jamos:monger??6jamos:absterger"
      },
      "firstPlural": {
        "fwd": "onhais:??r??jais:gir,ger??igais:eguir??irais:erir??ais:uer????ais:cir??urtais:ortir??coiteis:??oitar??1ais:mer,rer,ber,bir,her,per,ser,hir??1gais:izer??2ais:idir,ndir,rter,nzer,ulir,irir,rdir??2??ais:pedir,medir??2queis:in??ar??3ais:urtir,arrir",
        "both": "5ais:ementir,flectir,mprazer??5ejais:brestar??5is:saguar??5nhais:treter??4ais:morder,opelir,xceler,inquir,rreter,orrir??4nhais:uster,bster??4jais:tever??4irais:equerer??4enhais:tervir??3ais:scuir,bolir,arzir,urzir,abrir,anzir,polir,rguir,meter,uspir,antir,ssuir,artir??3queis:emo??ar,tro??ar??3intais:essentir??3idais:egredir,sgredir??3iais:crer??3inais:revenir??3enhais:rovir??3nhais:nter??2ais:lpir,orir,urir,alir,odir,ater,plir,upir,imir,eder,trir,udir,buir,nguir,tuir,adir,nuir,uzir,ruir,utir,luir,itir,umir,prir,stir,nder,air??2intais:smentir,nsentir??2istais:evestir??2ilais:mpelir,xpelir??2enhais:avir,evir,nvir??2itamos:mpetir??2hais:aler??2cais:erder??1irvais:servir??1irjais:vergir??1irais:arir??1ais:oer,nir,xer,ver??1ulais:golir??1itais:letir??1nhais:or??1ueis:gar??1??ais:uvir,azer??1ssais:oder??irzais:erzir??igrais:egrir??ispais:espir??ubrais:obrir??irtais:ertir??ussais:ossir????ais:cer??ceis:??ar??queis:car??urmais:ormir??eis:ar",
        "rev": "entir:intais??ervir:irvais??ectir:ictais??1rer:eirais??1zer:agais??1r:eiais??1ber:aibais??1gir:ijais,ujais,ljais??1eguir:sigais??1erir:firais,dirais,girais,sirais,tirais??1etir:pitais??1edir:ridais??1ir:venhais??1estir:vistais??2ar:stejais??2er:omais,rrais,ebais,frais,emais,chais,azais,mpais,osais??2gir:injais,urjais,eajais,erjais,oajais,unjais,arjais??2r:vejais,tenhais??2ger:lejais,anjais,rejais??2zer:digais??2cir:ar??ais??2uer:rgais??3ir:vidais,cidais,undais,oibais,andais,umbais,indais,pulais,sidais,entais,uirais,redais,nibais,urdais,anhais??3ger:otejais??3er:olhais,ordais,ambais,ertais,enzais,uerais,relais??3??ar:braqueis??3dir:xpe??ais,sme??ais??4dir:espe??ais,impe??ais??4gir:terajais??4ir:olidais,runhais,cardais,eferais??4??ar:trinqueis??5er:bressais",
        "ex": "vades:ir??2jais:ser,ver,haver,reger,viger??1enhais:vir??3ejais:estar??2nhais:ter??3irais:querer??3gais:trazer??2ais:rir??2iais:ler??2ibais:saber,caber??1intais:sentir,mentir??2??ais:pedir,medir??3ais:abrir,meter,jazer,cozer,arder,subir,bulir,urdir??3iais:crer??5jais:prover,prever??1istais:vestir??1irvais:servir??4jais:rever??4nhais:deter,reter,obter??3itais:repetir??1ulais:polir??4queis:abra??ar??4ais:morder,treler,curtir,exibir,ebulir,elidir,ilidir,condir,garrir??3idais:agredir??3enhais:advir??3istais:investir??2queis:co??ar,ro??ar,la??ar??3nhais:ater??5idais:progredir??3queis:cal??ar,for??ar,ati??ar??3intais:assentir??7jais:entrever,interver??2enhais:avir??4iais:reler??7ais:dissentir??1ais:rer??9ais:retrogredir??8ais:correferir??2ictais:flectir??1onhais:p??r??2gais:dizer??1jais:agir??1igais:seguir??1irais:ferir,gerir??4??ais:impedir??1urtais:sortir??1coiteis:a??oitar??3jais:monger??6jais:absterger"
      },
      "secondPlural": {
        "fwd": "onham:??r??jam:gir,ger??igam:eguir??iram:erir??am:uer????am:cir??urtam:ortir??coitem:??oitar??1jam:aver??1am:mer,rer,ber,her,per,ser,hir??1gam:izer??1em:iar??2am:ndir,rter,mbir,ulir,idir,irir,rdir??2eiem:nsiar??2??am:pedir,medir??2quem:in??ar??3em:iguar,nquar??3am:arrir??4em:inguar,coitar",
        "both": "5am:ementir,flectir,mprazer??5jam:terver??5ejam:brestar??5nham:treter??4uem:umegar,amegar,elegar??4em:foitar,noitar??4am:inibir,opelir,xceler,rreter,epolir,rantir,orrir??4intam:ressentir??4jam:tever??4eiem:cendiar??4iram:equerer??4enham:tervir??3am:bolir,arzir,abrir,orver,anzir,enzer,xibir,rguir,order,meter,rever,artir??3uem:iegar,pegar,negar,fegar,segar,vegar,regar,hegar??3em:bitar,titar,vitar,ejuar,pitar,uitar,gitar,litar,citar,sitar,mitar,ditar,ritar,eitar??3quem:emo??ar,tro??ar,bra??ar??3idam:egredir,sgredir??3iam:crer??3eiem:mediar??3nham:ster,bter,nter??3enham:rovir??2am:lpir,orir,cuir,urir,alir,odir,plir,adir,tuir,ater,upir,imir,ozer,trir,udir,buir,nguir,over,lver,nuir,uzir,eder,utir,luir,itir,ruir,stir,suir,umir,prir,ubir,iver,nder,air??2em:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,rtar,tuar,etar,utar,atar,nuar,ltar,star,ntar??2??lem:baular??2enham:avir,evir,nvir??2??zem:juizar??2intam:smentir,nsentir??2uem:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar??2ilam:mpelir,xpelir??2??nem:ruinar??2itais:mpetir??2ham:aler??2cam:erder??1??dem:iudar??1irvam:servir??1??am:uvir,azer??1??zem:aizar,eizar??1??cem:iu??ar??1??squem:aiscar??1??guam:saguar??1em:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar??1irjam:vergir??1??guem:xaguar??1iram:arir??1??bam:oibir??1am:oer,nir,xer??1ulam:golir??1??nam:eunir??1itam:letir??1iem:ear??1nham:or??1ibam:aber??1ssam:oder????leguem:olegar??irzam:erzir????nquam:inquir??igram:egrir??ispam:espir??ubram:obrir????quem:equar??irtam:ertir??ussam:ossir????am:cer??cem:??ar??quem:car??urmam:ormir",
        "rev": "ar:eem??entir:intam??ervir:irvam??udar:??dem??iliar:??liem??ectir:ictam??1rer:eiram??1zer:agam??1r:eiam??1gir:ijam,ujam,ljam??1eguir:sigam??1erir:firam,diram,giram,siram,tiram??1etir:pitam??1edir:ridam??1enir:vinam??1estir:vistam??1ar:tem??1ir:venham??2ar:stejam,viem,piem,oiem,fiem,ciem,riem,giem,diem,aiem,tiem,biem,siem,ziem,niem,uiem,miem,xiem??2er:omam,rram,ebam,cham,fram,etam,emam,osam,mpam??2gir:injam,urjam,eajam,erjam,oajam,unjam,arjam??2r:vejam,tenham??2ger:lejam,anjam,rejam,onjam??2zer:digam??2cir:ar??am??2uer:rgam??3ir:vidam,cidam,undam,uspam,andam,indam,sidam,lidam,uiram,unham,bulam,redam,urzam,feram,ardam??3ger:otejam??3er:olham,ambam,ervam,ertam,ueram,relam,essam??3ar:iliem,pliem,aliem,oliem??3dir:xpe??am??4dir:espe??am,impe??am,esme??am??4gir:terajam??4ar:ziguem,reliem??4ir:cumbam,apulam,sentam,lanham??4??ar:trinquem??4ger:sterjam??5ar:pinquem,ginquem,aniguem",
        "ex": "v??o:ir????guem:aguar??2jam:ser,ver,haver,reger,viger??1enham:vir??3ejam:estar??2nham:ter??1eem:dar??3iram:querer??3gam:trazer??2am:rir??2iam:ler??1intam:sentir,mentir??2??am:pedir,medir??3am:abrir,dever,meter,jazer,arder,bulir,urdir??3iam:crer??3uem:pegar,negar,regar,cegar,legar,segar??5jam:prover,prever??1istam:vestir??1irvam:servir??4jam:rever??2eiem:odiar??4nham:deter,reter??3itam:repetir??1ulam:polir??4am:curtir,cuspir,ferver,inibir,treler,zurzir,zumbir,condir,surdir,garrir??2em:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar??3idam:agredir??3eiem:mediar,ansiar??4inam:prevenir??3enham:advir??3istam:investir,revestir??2??dem:saudar??2quem:co??ar,ro??ar,la??ar??3nham:ater??5idam:progredir??3quem:cal??ar,for??ar,ati??ar??3em:citar,fitar,ditar,pitar,eguar,aliar,chiar??4uem:alegar??3??liem:mobiliar??3intam:assentir??7jam:entrever??2enham:avir??4iam:reler??4intam:ressentir??7am:dissentir??1am:rer??9am:retrogredir??8am:correferir??2ictam:flectir??4em:poitar??1onham:p??r??2gam:dizer??1jam:agir??1igam:seguir??1iram:ferir,gerir??4??am:impedir??7em:averiguar??1urtam:sortir??5em:minguar??1coitem:a??oitar"
      },
      "thirdPlural": {
        "fwd": "",
        "both": "itam:etir",
        "rev": "",
        "ex": ""
      }
    },
    "imperative": {
      "first": {
        "fwd": "??e:??r??urte:ortir??coita:??oitar??1e:sir,cir??1??i:roer??1ole:pulir??2e:idir,ngir,olir,ndir,etir,inir,odir,atir,elir,mbir,nzir,rdir??2eia:nsiar??2ca:in??ar??3e:ertir,urtir,arrir",
        "both": "2:izer??3:fazer??5:sprazer??5e:sservir,nsfugir??5??:brestar??5??:ntrever??5eia:ncendiar??5??i:onstruir??4e:emunir,parzir,smedir,esunir,cernir,olorir,esumir,eragir,ssumir??4ca:stro??ar??4??:terver??4??i:estruir??4i:caver??4??m:treter,tervir??3e:talir,anhir,nibir,runir,ornir,bulir,oagir,unhir,ramir,pedir,rquir,xibir,ludir,audir,eagir,nguir,eguir,artir??3ca:emo??ar,bra??ar??3??:mbair??3ide:sgredir??3??:tever??3eia:mediar??3??m:rovir??2e:lpir,urir,lgir,plir,ctir,irir,brir,rpir,adir,imir,anir,trir,uzir,rgir,utir,itir,erir,ntir,prir,stir,igir,uvir,rmir??2??m:avir,evir,dvir,ster,bter,nvir,nter??2??za:juizar??2ome:bsumir,nsumir??2??:crer??2??na:ruinar??1??da:iudar??1??za:aizar,eizar??1????a:iu??ar??1??sca:aiscar??1??i:moer??1ode:cudir??1??be:oibir??1??ne:eunir??1ia:ear????lega:olegar??irze:erzir????nque:inquir??igre:egrir??ope:upir????gua:aguar??ospe:uspir????qua:equar??obe:ubir????e:or??:r",
        "rev": "er:??, ou dize??ugir:oge??udar:??da??iliar:??lia??ular:??la??1er:z ou faze,r,t??m??1ar:t????1r:ei??1edir:ride??1enir:vine??1ir:v??m??2er:az??2ir:une,are,uge,ene,ore??2oer:rr??i??2ulir:apole??3ir:vide,inge,cide,pete,bole,unde,gole,fine,lode,ande,arce,pele,umbe,inde,side,unge,rode,lide,arde,urze,urde??4ir:flete,emole,epole,ranze,grede??4??ar:trinca??5ir:iverte,dverte",
        "ex": "4:querer,trazer??vai:ir????gua:aguar??1??:ser,ver,ler??3 ou faze:fazer??1em:vir??3??:estar??2m:ter??1??:dar,haver??3 ou dize:dizer??2e:agir,unir??3e:pedir,medir,punir,parir,rugir,mugir,munir,zunir,balir,lenir,latir,ungir,delir,tinir,urdir??2??:crer??5i:reaver??1oge:fugir??1ome:sumir??4??:prover,prever??4e:servir,despir,fremir,zurzir,tossir,curtir,condir,garrir??3??:rever,reler??2eia:odiar??3??m:deter,reter??1ule:polir??1??i:roer,moer,soer??3ide:agredir??3eia:mediar,ansiar??4ine:prevenir??2??da:saudar??2ca:co??ar,ro??ar,la??ar??2??m:ater,avir??2ege:frigir??5ide:progredir??4a:prazer??3ca:cal??ar,for??ar,ati??ar??1ole:bulir??3??lia:mobiliar??4ide:regredir??1usca:moscar??5e:revenir,retinir??3oge:refugir??9e:retrogredir??3??la:abaular??6e:reflorir??1??e:p??r??1urte:sortir??1coita:a??oitar"
      },
      "second": {
        "fwd": "onha:??r??ja:gir,ger??iga:eguir??ira:erir??ita:etir??a:uer????a:cir??urta:ortir??coite:??oitar??1ja:aver??1a:mer,rer,ber,her,per,ser,hir??1ga:izer??1e:iar??2a:itir,ndir,nzer,idir,mbir,rter,nzir,ulir,irir??2eie:nsiar??2??a:pedir,medir??2que:in??ar??3a:urtir,arrir??3e:iguar,nquar??4e:inguar",
        "both": "3:emir,amir,rpir,anir??4:celir,ernir,aurir,rquir??5:turdir,randir,epelir,olorir,emolir??5a:ementir,flectir,mprazer,estruir,nstruir??5eja:brestar??5nha:treter??4a:florir,mburir,etinir,opelir,xceler,esunir,rreter,epolir,efinir,rantir,orrir??4ue:umegar,amegar,elegar??4e:ltitar,noitar??4??a:sprazer??4inta:ressentir??4ia:screr??4ida:nsgredir??4ja:tever??4eie:cendiar??4ira:equerer??4enha:tervir??3a:munir,rurir,arzir,runir,ardir,abrir,reler,nibir,orver,xibir,rguir,fruir,order,meter,rever,artir??3??:rruir??3ue:iegar,negar,fegar,segar,pegar,vegar,regar,hegar??3e:vitar,bitar,pitar,uitar,gitar,litar,citar,sitar,mitar,ditar,ritar,eitar??3que:emo??ar,tro??ar,bra??ar??3inta:esmentir??3ida:egredir??3ila:ompelir??3eie:mediar??3nha:ster,bter,nter??3ina:revenir??3enha:rovir??2a:cuir,alir,odir,plir,tuir,adir,upir,imir,ater,trir,udir,buir,nguir,over,lver,nuir,uzir,eder,utir,luir,stir,suir,umir,prir,ubir,iver,nder,air??2e:fuar,ruar,suar,duar,muar,xtar,juar,ctar,cuar,ptar,otar,rtar,tuar,etar,utar,atar,nuar,ltar,star,ntar??2??le:baular??2ue:sgar,lgar,ngar,rgar,agar,igar,ugar,ogar??2enha:avir,evir,dvir,nvir??2??ze:juizar??2ista:evestir??2??ne:ruinar??2ila:xpelir??2inta:nsentir??2??a:fazer??2ha:aler??2ca:erder??1??de:iudar??1irva:servir??1??a:uvir??1??ze:aizar,eizar??1??ce:iu??ar??1??sque:aiscar??1e:far,xar,nar,zar,bar,par,var,har,oar,jar,rar,sar,dar,lar,mar??1irja:vergir??1ira:arir??1??ba:oibir??1a:oer,xer??1ula:golir??1??na:eunir??1ie:ear??1nha:or??1iba:aber??1ssa:oder????legue:olegar??irza:erzir????nqua:inquir??igra:egrir????gue:aguar??ispa:espir??ubra:obrir????que:equar??irta:ertir??ussa:ossir????a:cer??ce:??ar??que:car??urma:ormir",
        "rev": "ar:????entir:inta??ervir:irva??udar:??de??er:am??ir:????iliar:??lie??ectir:icta??1zer:a??a,aga??1rer:eira??1r:eia,i,ei??1gir:ija,uja,lja??1eguir:siga??1erir:fira,dira,gira,sira,tira??1etir:pita,lita??1edir:rida??1estir:vista??1ar:te??1ir:venha??2ar:steja,vie,pie,oie,fie,cie,rie,gie,die,aie,tie,bie,sie,zie,nie,uie,mie,xie??2er:oma,rra,eba,cha,fra,eta,ema,mpa,osa??2gir:inja,urja,eaja,erja,oaja,unja,arja??2r:veja,tenha??2ger:leja,anja,reja,onja??2zer:diga??2ir:una,rua,rna,ena,ola,lpa??2cir:ar??a??2uer:rga??3ir:vida,cida,uira,unda,uspa,mita,anda,inda,sida,anza,umba,bula,lida,reda,urza??3ger:oteja??3er:olha,amba,erva,enza,erta,uera,essa??3ar:ilie,plie,alie,olie,elie??3dir:xpe??a,sme??a??4dir:espe??a,impe??a??4gir:teraja??4ar:zigue,nigue??4ir:apula,runha,senta,efera??4??ar:trinque??5ar:pinque,ginque??5ger:bsterja",
        "ex": "4:latir,ungir,munir,delir,tinir??5:abolir,fulgir??6:impelir??7:esculpir,impingir??v??:ir????gue:aguar??2ja:ser,ver,haver,reger,viger??2??a:fazer,pedir,medir??1enha:vir??3eja:estar??2nha:ter??1??:dar??3ira:querer??3ga:trazer??2a:rir,unir??2ia:ler??1inta:sentir,mentir??3a:abrir,dever,punir,meter,jazer,cozer,arder,zunir,urdir,lenir,bulir??3ia:crer??3ue:pegar,negar,regar,cegar,legar,segar??5ja:prover,prever??1ista:vestir??1irva:servir??4ja:rever??2eie:odiar??4nha:deter,reter??1ula:polir??2e:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar??4a:cuspir,ferver,fornir,zurzir,surdir,curtir,condir,garrir??3ida:agredir??3eie:mediar,ansiar??3ista:investir??2??de:saudar??2que:co??ar,ro??ar,la??ar??3nha:ater??5ida:progredir??4am:prazer??3que:cal??ar,for??ar,ati??ar??3e:citar,fitar,ditar,pitar,eguar,aliar,chiar??3i:soer??2??:ruir,puir??4ue:alegar??3??lie:mobiliar??3inta:assentir??6a:obstruir??7ja:entrever,interver??2enha:avir??4ia:reler??3??:fruir,pruir??1usque:moscar??4inta:ressentir??9??:desobstruir??7a:dissentir,insculpir??5a:revenir,rebolir,planhir??1a:rer??9a:retrogredir??8a:correferir??5e:afoitar,minguar??6??:abstruir??8e:abiscoitar??2icta:flectir??4e:poitar??1onha:p??r??2ga:dizer??1ja:agir??1iga:seguir??1ira:ferir,gerir??4??a:impedir??7e:averiguar??1urta:sortir??1coite:a??oitar"
      },
      "third": {
        "fwd": "onhamos:??r??jamos:gir,ger??igamos:eguir??iramos:erir??itamos:etir??amos:uer????amos:cir??urtamos:ortir??coitemos:??oitar??1amos:mer,rer,ber,bir,her,per,ser,hir??1gamos:izer??2amos:idir,itir,ndir,nzer,ulir,rter,irir,rdir??2??amos:pedir,medir??2quemos:in??ar??3amos:urtir,arrir",
        "both": "5amos:ementir,flectir,mprazer??5ejamos:brestar??5nhamos:treter??4amos:morder,opelir,xceler,inquir,rreter,orrir??4nhamos:uster,bster??4jamos:tever??4iramos:equerer??4enhamos:tervir??3amos:scuir,bolir,arzir,urzir,abrir,anzir,polir,rguir,meter,uspir,antir,ssuir,artir??3quemos:emo??ar,tro??ar??3intamos:essentir,onsentir??3idamos:egredir,sgredir??3iamos:crer??3inamos:revenir??3enhamos:rovir??3nhamos:nter??2amos:lpir,orir,urir,alir,odir,plir,upir,imir,eder,udir,trir,ater,buir,nguir,tuir,adir,nuir,uzir,ruir,utir,luir,umir,prir,stir,nder,air??2intamos:smentir??2istamos:evestir??2ilamos:mpelir,xpelir??2enhamos:avir,evir,dvir,nvir??2hamos:aler??2camos:erder??1irvamos:servir??1irjamos:vergir??1iramos:arir??1amos:oer,nir,xer,ver??1ulamos:golir??1nhamos:or??1uemos:gar??1??amos:uvir,azer??1ssamos:oder??irzamos:erzir??igramos:egrir??ispamos:espir??ubramos:obrir??irtamos:ertir??ussamos:ossir????amos:cer??cemos:??ar??quemos:car??urmamos:ormir??emos:ar",
        "rev": "entir:intamos??ervir:irvamos??ectir:ictamos??1rer:eiramos??1zer:agamos??1r:eiamos??1ber:aibamos??1gir:ijamos,ujamos,ljamos??1eguir:sigamos??1erir:firamos,diramos,giramos,siramos,tiramos??1etir:pitamos,litamos??1edir:ridamos??1estir:vistamos??1ir:venhamos??2ar:stejamos??2er:omamos,rramos,ebamos,framos,emamos,chamos,azamos,mpamos,osamos??2gir:injamos,urjamos,eajamos,erjamos,oajamos,unjamos,arjamos??2r:vejamos,tenhamos??2ger:lejamos,anjamos,rejamos??2zer:digamos??2cir:ar??amos??2uer:rgamos??3ir:vidamos,cidamos,uiramos,undamos,oibamos,andamos,mitamos,umbamos,indamos,pulamos,sidamos,unhamos,entamos,bulamos,lidamos,redamos,nibamos,urdamos,anhamos??3ger:otejamos??3er:olhamos,ordamos,ambamos,ertamos,enzamos??3??ar:braquemos??3dir:xpe??amos,sme??amos??4dir:espe??amos,impe??amos??4gir:terajamos??4iar:obilemos??4er:queramos??4ir:cardamos,eferamos??4??ar:trinquemos??5er:bressamos",
        "ex": "vamos:ir??2jamos:ser,ver,haver,reger,viger??1enhamos:vir??3ejamos:estar??2nhamos:ter??3iramos:querer??3gamos:trazer??2amos:rir??2iamos:ler??2ibamos:saber,caber??1intamos:sentir,mentir??2??amos:pedir,medir??3amos:abrir,meter,jazer,cozer,arder,subir,bulir,urdir??3iamos:crer??5jamos:prover,prever??1istamos:vestir??1irvamos:servir??4jamos:rever??4nhamos:deter,reter,obter??1ulamos:polir??4quemos:abra??ar??4amos:morder,treler,curtir,exibir,condir,garrir??3idamos:agredir??3istamos:investir??2quemos:co??ar,ro??ar,la??ar??3nhamos:ater??5idamos:progredir??3quemos:cal??ar,for??ar,ati??ar??5emos:mobiliar??3intamos:assentir??7jamos:entrever,interver??2enhamos:avir??4iamos:reler??7amos:dissentir??1amos:rer??9amos:retrogredir??8amos:correferir??2ictamos:flectir??1onhamos:p??r??2gamos:dizer??1jamos:agir??1igamos:seguir??1iramos:ferir,gerir??4??amos:impedir??1urtamos:sortir??1coitemos:a??oitar??3jamos:monger??6jamos:absterger"
      },
      "firstPlural": {
        "fwd": "onde:??r??coitai:??oitar??3cai:rin??ar",
        "both": "2:hir,cir,zir,pir,nir,lir,rir,bir,dir,gir,mir,tir??3:ssir??4:nquir,nguir,eguir??5:servir??5de:terver??5nde:treter,tervir??4de:tever,orrir??4nde:rovir??3cai:tro??ar??3de:crer??3nde:avir,evir,ster,bter,nvir,nter??2??ais:ouvir??1??:uir,air??1nde:or??i:r",
        "rev": "r:nde??1r:ede,ide??2r:vi??2??ar:mocai??3??ar:bracai??4??ar:trincai",
        "ex": "4:ouvir??5:servir??1de:ir??2de:ser,ver,rir,ler??2nde:vir,ter??3de:crer??5de:prover,prever??4de:rever,reler??4nde:deter,reter,advir??4cai:abra??ar,remo??ar??2cai:co??ar,ro??ar,la??ar??3nde:ater,avir??3cai:cal??ar,for??ar,ati??ar??7de:entrever??1onde:p??r??1coitai:a??oitar"
      },
      "secondPlural": {
        "fwd": "onham:??r??jam:gir,ger??igam:eguir??iram:erir??itam:etir??am:uer????am:cir??urtam:ortir??coitem:??oitar??1jam:aver??1am:mer,rer,ber,her,per,ser,hir??1gam:izer??1em:iar??2am:itir,ndir,rter,mbir,ulir,idir,irir,rdir??2eiem:nsiar??2??am:pedir,medir??2quem:in??ar??3em:iguar,nquar??3am:arrir??4em:inguar,coitar",
        "both": "5am:ementir,flectir,mprazer??5jam:terver??5ejam:brestar??5idam:ansgredir??5nham:treter??4uem:umegar,amegar,elegar??4em:foitar,noitar??4am:inibir,opelir,xceler,sorver,rreter,epolir,rantir,orrir??4intam:ressentir??4jam:tever??4eiem:cendiar??4iram:equerer??4enham:tervir??3am:bolir,arzir,abrir,anzir,enzer,xibir,rguir,order,meter,rever,artir??3uem:iegar,pegar,negar,fegar,segar,vegar,regar,hegar??3em:bitar,titar,gitar,vitar,ejuar,pitar,uitar,sitar,litar,citar,mitar,ditar,ritar,eitar??3quem:emo??ar,tro??ar,bra??ar??3idam:egredir??3iam:crer??3eiem:mediar??3nham:ster,bter,nter??3enham:rovir??2am:lpir,orir,cuir,urir,alir,odir,plir,adir,ater,upir,imir,ozer,trir,over,udir,buir,nguir,tuir,lver,nuir,uzir,eder,utir,luir,ruir,stir,suir,umir,prir,ubir,iver,nder,air??2em:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,tuar,etar,rtar,utar,atar,nuar,ltar,star,ntar??2??lem:baular??2??zem:juizar??2intam:smentir,nsentir??2uem:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar??2ilam:mpelir,xpelir??2??nem:ruinar??2enham:avir,evir,dvir,nvir??2ham:aler??2cam:erder??1??dem:iudar??1irvam:servir??1??am:uvir,azer??1??zem:aizar,eizar??1??cem:iu??ar??1??squem:aiscar??1em:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar??1irjam:vergir??1iram:arir??1??bam:oibir??1am:oer,nir,xer??1ulam:golir??1??nam:eunir??1iem:ear??1nham:or??1ibam:aber??1ssam:oder????leguem:olegar??irzam:erzir????nquam:inquir??igram:egrir????guem:aguar??ispam:espir??ubram:obrir????quem:equar??irtam:ertir??ussam:ossir????am:cer??cem:??ar??quem:car??urmam:ormir",
        "rev": "ar:eem??entir:intam??ervir:irvam??udar:??dem??iliar:??liem??ectir:ictam??1rer:eiram??1zer:agam??1r:eiam??1gir:ijam,ujam,ljam??1eguir:sigam??1erir:firam,diram,giram,siram,tiram??1etir:pitam,litam??1edir:ridam??1enir:vinam??1estir:vistam??1ar:tem??1ir:venham??2ar:stejam,viem,piem,oiem,fiem,ciem,riem,giem,diem,aiem,tiem,biem,siem,ziem,niem,uiem,miem,xiem??2er:omam,rram,ebam,cham,fram,etam,emam,mpam,osam??2gir:injam,urjam,eajam,erjam,oajam,unjam,arjam??2r:vejam,tenham??2ger:lejam,anjam,rejam,onjam??2zer:digam??2cir:ar??am??2uer:rgam??3ir:vidam,cidam,uiram,undam,uspam,mitam,andam,indam,sidam,lidam,unham,umbam,bulam,redam,urzam,feram,ardam??3ger:otejam??3er:olham,ambam,ervam,ertam,ueram,orvam,relam,essam??3ar:iliem,pliem,aliem,oliem??3dir:xpe??am??4dir:espe??am,impe??am,esme??am??4gir:terajam??4ar:ziguem,reliem??4ir:apulam,sentam,lanham??4??ar:trinquem??4ger:sterjam??5ar:pinquem,ginquem,aniguem",
        "ex": "v??o:ir????guem:aguar??2jam:ser,ver,haver,reger,viger??1enham:vir??3ejam:estar??2nham:ter??1eem:dar??3iram:querer??3gam:trazer??2am:rir??2iam:ler??1intam:sentir,mentir??2??am:pedir,medir??3am:abrir,dever,meter,jazer,arder,bulir,urdir??3iam:crer??3uem:pegar,negar,regar,cegar,legar,segar??5jam:prover,prever??1istam:vestir??1irvam:servir??4jam:rever??2eiem:odiar??4nham:deter,reter??1ulam:polir??4am:curtir,cuspir,ferver,inibir,sorver,treler,zurzir,condir,surdir,garrir??2em:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar??3idam:agredir??3eiem:mediar,ansiar??4inam:prevenir??3istam:investir,revestir??2??dem:saudar??2quem:co??ar,ro??ar,la??ar??3nham:ater??5idam:progredir??3quem:cal??ar,for??ar,ati??ar??3em:citar,fitar,ditar,pitar,eguar,aliar,chiar??4uem:alegar??3??liem:mobiliar??3intam:assentir??7jam:entrever??2enham:avir??4iam:reler??1usquem:moscar??4intam:ressentir??7am:dissentir??1am:rer??9am:retrogredir??8am:correferir??2ictam:flectir??4em:poitar??1onham:p??r??2gam:dizer??1jam:agir??1igam:seguir??1iram:ferir,gerir??4??am:impedir??7em:averiguar??1urtam:sortir??5em:minguar??1coitem:a??oitar"
      },
      "thirdPlural": {
        "fwd": "",
        "both": "",
        "rev": "",
        "ex": ""
      }
    },
    "imperfect": {
      "first": {
        "fwd": "ia:er??unha:??r??1a:ir??2cava:ti??ar",
        "both": "5nha:tervir??4va:pitar,citar,gitar,litar,bitar,ritar,mitar,sitar,vitar,ditar,eitar??4nha:rovir??4inha:treter??4??a:ossuir??3va:xtar,ctar,otar,etar,ptar,utar,atar,rtar,ltar,ntar,star??3nha:avir,evir,dvir,nvir??2??a:moer,doer,roer,tuir,buir,nuir,luir,ruir??2va:far,xar,ear,par,uar,iar,nar,jar,zar,bar,rar,sar,var,har,oar,??ar,gar,car,lar,dar,mar??2inha:ster,bter,nter??1??a:air??coitava:??oitar??unha:or",
        "rev": "1er:via,cia,xia,o??a,hia,tinha,oia??1ir:u??a??2er:azia,omia,izia,ndia,abia,ebia,atia,rria,fria,egia,mpia,ozia,osia,cria??2r:uia,lia,nia,vinha??2??ar:alcava??3er:ueria,erdia,metia,ordia,ambia,remia,cedia,angia,valia,enzia??3r:rmia,ntia,uvia,igia,ubia,ugia,pria,ssia,umia,stia,oria,idia,utia,rgia,bria,uzia,spia,itia,agia,udia,ibia,upia,uria,lpia,rpia,imia,adia,rzia,iria,nhia??4r:artia,ingia,feria,petia,geria,letia,undia,redia,lodia,seria,andia,india,arcia,egria,teria,ortia,pedia,umbia,anzia,ramia,urdia,ungia??4er:rretia??5er:nvertia,evertia,bvertia,rvertia",
        "ex": "era:ser??1a:ir??2nha:vir??1inha:ter??2va:dar??2??a:doer,roer,moer,soer,ruir,puir??3inha:deter,reter??4cava:abra??ar??2cava:co??ar,ro??ar,la??ar??2inha:ater??4??a:arguir??3cava:cal??ar,for??ar,ati??ar??4va:citar,fitar,ditar??3va:atar??5va:quitar??3nha:avir??1ia:ver,ler??3ia:poder,valer,ceder,feder,gemer,temer,meter,viger,arder,reler??1unha:p??r??2a:rir??5a:sorrir,servir,aderir,curtir,nutrir,surtir??3a:agir,adir??4a:pedir,medir,ferir,parir,latir,gerir,remir,ungir??2ia:crer??7a:divertir,advertir??4ia:erguer,verter"
      },
      "second": {
        "fwd": "ias:er??unhas:??r??2as:tir,mir,dir,gir,bir,rir,pir,zir,cir,hir??2cavas:ti??ar",
        "both": "5vas:abitar??5vam:rassar??4vas:gitar,pitar,uitar,litar,ritar,mitar,citar,vitar,sitar,ditar,eitar??4inhas:treter??3vas:xtar,ptar,ctar,otar,etar,utar,atar,rtar,ltar,ntar,star??3as:quir,guir,ssir,uvir??2??as:nuir,moer,roer,tuir,buir,luir,ruir,suir??2??am:doer??2vas:far,par,jar,zar,oar,iar,nar,gar,bar,uar,var,har,xar,sar,ear,rar,??ar,car,dar,lar,mar??2inhas:ster,bter,nter??2as:nir,lir??2nhas:vir??1??as:air??coitavas:??oitar??unhas:or",
        "rev": "er:??am??1er:cias,xias,hias,tinhas,o??as,ziam,oias??1ir:u??as??2er:azias,avias,omias,izias,ndias,abias,evias,ebias,egias,atias,rrias,ovias,frias,lvias,ivias,mpias,ozias,osias,crias??2??ar:alcavas??2r:niam,giam??3er:uerias,erdias,metias,ordias,ambias,remias,cedias,angias,valias,enzias,orvias??3r:rmias,ntias,igias,ubias,ugias,prias,umias,stias,orias,idias,utias,rgias,brias,uzias,spias,itias,agias,udias,ibias,upias,urias,lpias,rpias,imias,adias,rzias,irias,nhias??4r:artias,ingias,ferias,petias,gerias,letias,undias,redias,lodias,serias,andias,indias,arcias,egrias,terias,ortias,urtias,anzias,ramias,urdias,ungias??4er:rretias,tervias??5r:spedias,mpedias,xpedias,cumbias??5er:nvertias,bvertias,rvertias",
        "ex": "eras:ser??1as:ir??2nhas:vir??1inhas:ter??2vas:dar??2as:rir??2??am:doer??5as:servir,sorrir,aderir,nutrir,zumbir??3inhas:deter,reter??4cavas:abra??ar??2??as:roer,moer,soer,ruir,puir??5iam:aprazer??2cavas:co??ar,ro??ar,la??ar??2inhas:ater??4??as:arguir??4iam:prazer??3cavas:cal??ar,for??ar,ati??ar??4vas:citar,fitar,ditar??3vas:atar??8am:concernir??4am:urgir??1ias:ver,ler??3ias:poder,valer,ceder,feder,gemer,temer,meter,viger,arder,reler??1unhas:p??r??3as:agir,adir??4as:pedir,medir,ferir,parir,latir,gerir,remir,ungir??2ias:crer??7as:divertir,advertir??4ias:erguer,ferver,verter??6ias:reverter"
      },
      "third": {
        "fwd": "ia:er??unha:??r??1a:ir??2cava:ti??ar",
        "both": "5nha:tervir??4va:pitar,citar,gitar,litar,bitar,ritar,mitar,sitar,vitar,ditar,eitar??4nha:rovir??4??a:ossuir??3va:xtar,ctar,otar,etar,ptar,utar,atar,rtar,ltar,ntar,star??3nha:avir,evir,dvir,nvir??2??a:moer,roer,tuir,buir,nuir,luir,ruir??2va:far,xar,ear,bar,par,uar,iar,nar,jar,zar,rar,sar,var,har,oar,??ar,gar,car,lar,dar,mar??2inha:ster,bter,nter??1??a:air??coitava:??oitar??unha:or",
        "rev": "1er:via,cia,xia,tinha,hia,o??a,oia??1ir:u??a??2er:azia,omia,izia,ndia,abia,ebia,atia,rria,fria,egia,mpia,ozia,osia,cria??2r:uia,lia,nia,vinha??2??ar:alcava??3er:ueria,erdia,metia,ordia,ambia,remia,cedia,angia,valia,enzia??3r:rmia,ntia,uvia,igia,ubia,ugia,pria,ssia,umia,stia,oria,idia,utia,rgia,bria,uzia,spia,itia,agia,udia,ibia,upia,uria,lpia,rpia,imia,adia,rzia,iria,nhia??4r:artia,ingia,feria,petia,geria,letia,undia,redia,lodia,seria,andia,india,arcia,egria,teria,ortia,pedia,umbia,anzia,ramia,urdia,ungia??4er:rretia??5er:nvertia,evertia,bvertia,rvertia",
        "ex": "era:ser??1a:ir??2nha:vir??1inha:ter??2va:dar??6inha:entreter??3inha:deter,reter??4cava:abra??ar??2??a:roer,moer,soer,ruir,puir??2cava:co??ar,ro??ar,la??ar??2inha:ater??4??a:arguir??3cava:cal??ar,for??ar,ati??ar??4va:citar,fitar,ditar??3va:atar??5va:quitar??3nha:avir??1ia:ver,ler??3ia:poder,valer,ceder,feder,gemer,temer,meter,viger,arder,reler??1unha:p??r??2a:rir??5a:sorrir,servir,aderir,curtir,nutrir,surtir??3a:agir,adir??4a:pedir,medir,ferir,parir,latir,gerir,remir,ungir??2ia:crer??7a:divertir,advertir??4ia:erguer,verter"
      },
      "firstPlural": {
        "fwd": "??amos:er,ir????nhamos:??r",
        "both": "5??nhamos:ntreter??4??nhamos:tervir??3??nhamos:rovir??2??nhamos:avir,evir,ster,bter,nvir,nter??coit??vamos:??oitar????nhamos:or????vamos:ar",
        "rev": "1er:v??amos,c??amos,x??amos,h??amos,t??nhamos,o??amos??1ir:a??amos,u??amos,l??amos,n??amos,v??nhamos??2er:az??amos,om??amos,iz??amos,nd??amos,ab??amos,eb??amos,eg??amos,at??amos,rr??amos,fr??amos,mp??amos,oz??amos,cr??amos??2ir:rm??amos,nt??amos,uv??amos,ig??amos,id??amos,st??amos,pr??amos,ss??amos,br??amos,it??amos,rg??amos,er??amos,uz??amos,sp??amos,ad??amos,um??amos,ag??amos,ud??amos,or??amos,im??amos,ib??amos,ug??amos,ur??amos,lp??amos,gr??amos,rp??amos,rz??amos,ut??amos,up??amos,am??amos,nh??amos??3ir:art??amos,ing??amos,uir??amos,pet??amos,let??amos,und??amos,ped??amos,lod??amos,and??amos,utr??amos,arc??amos,urt??amos,umb??amos,ind??amos,urd??amos,ung??amos??3er:uer??amos,erd??amos,met??amos,amb??amos,ced??amos,ang??amos,val??amos,enz??amos,rem??amos??3??ar:brac??vamos??4ir:gred??amos,ranz??amos??4er:rret??amos??5ir:ivert??amos??5er:nvert??amos,evert??amos,bvert??amos,rvert??amos",
        "ex": "??amos:ir????ramos:ser??1??nhamos:vir,ter??3??nhamos:deter,reter,advir??4c??vamos:abra??ar??2c??vamos:co??ar,ro??ar,la??ar??2??nhamos:ater,avir??3c??vamos:cal??ar,for??ar,ati??ar??1??amos:ver,rir,ler??3??amos:poder,pedir,subir,medir,valer,ceder,feder,gemer,temer,parir,meter,latir,viger,arder,coser,remir,ungir,reler??1??nhamos:p??r??4??amos:sorrir,servir,morder,erguer,sortir,verter??2??amos:agir,crer,adir??6??amos:advertir"
      },
      "secondPlural": {
        "fwd": "??eis:er,ir????nheis:??r",
        "both": "5??nheis:ntreter??4??nheis:tervir??3??nheis:rovir??2??nheis:avir,evir,ster,bter,nvir,nter??coit??veis:??oitar????nheis:or????veis:ar",
        "rev": "1er:v??eis,c??eis,x??eis,h??eis,t??nheis,o??eis??1ir:a??eis,u??eis,l??eis,n??eis,v??nheis??2er:az??eis,om??eis,iz??eis,nd??eis,ab??eis,eb??eis,eg??eis,at??eis,rr??eis,fr??eis,mp??eis,oz??eis,cr??eis??2ir:rm??eis,nt??eis,uv??eis,ig??eis,id??eis,st??eis,pr??eis,ss??eis,br??eis,it??eis,rg??eis,er??eis,uz??eis,sp??eis,ad??eis,um??eis,ag??eis,ud??eis,or??eis,im??eis,ib??eis,ug??eis,ur??eis,lp??eis,gr??eis,rp??eis,rz??eis,ut??eis,up??eis,am??eis,nh??eis??3ir:art??eis,ing??eis,uir??eis,pet??eis,let??eis,und??eis,ped??eis,lod??eis,and??eis,utr??eis,arc??eis,urt??eis,umb??eis,ind??eis,urd??eis,ung??eis??3er:uer??eis,erd??eis,met??eis,amb??eis,ced??eis,ang??eis,val??eis,enz??eis,rem??eis??3??ar:brac??veis??4ir:gred??eis,ranz??eis??4er:rret??eis??5ir:ivert??eis??5er:nvert??eis,evert??eis,bvert??eis,rvert??eis",
        "ex": "??eis:ir????reis:ser??1??nheis:vir,ter??3??nheis:deter,reter,advir??4c??veis:abra??ar??2c??veis:co??ar,ro??ar,la??ar??2??nheis:ater,avir??3c??veis:cal??ar,for??ar,ati??ar??1??eis:ver,rir,ler??3??eis:poder,pedir,subir,medir,valer,ceder,feder,gemer,temer,parir,meter,latir,viger,arder,coser,remir,ungir,reler??1??nheis:p??r??4??eis:sorrir,servir,morder,erguer,sortir,verter??2??eis:agir,crer,adir??6??eis:advertir"
      },
      "thirdPlural": {
        "fwd": "iam:er??unham:??r??1am:ir??2cavam:ti??ar",
        "both": "5nham:tervir??4vam:pitar,citar,gitar,litar,bitar,ritar,mitar,sitar,vitar,ditar,eitar??4nham:rovir??4??am:ossuir??3vam:xtar,ctar,otar,etar,ptar,utar,atar,rtar,ltar,ntar,star??3nham:avir,evir,dvir,nvir??2??am:moer,roer,tuir,buir,nuir,luir,ruir??2vam:far,xar,ear,bar,par,uar,iar,nar,jar,zar,rar,sar,var,har,oar,??ar,gar,car,lar,dar,mar??2inham:ster,bter,nter??1??am:air??coitavam:??oitar??unham:or",
        "rev": "1er:viam,ciam,xiam,tinham,hiam,o??am,oiam??1ir:u??am??2er:aziam,omiam,iziam,ndiam,abiam,ebiam,atiam,rriam,friam,egiam,mpiam,oziam,osiam,criam??2r:uiam,liam,niam,vinham??2??ar:alcavam??3er:ueriam,erdiam,metiam,ordiam,ambiam,remiam,cediam,angiam,valiam,enziam??3r:rmiam,ntiam,uviam,igiam,ubiam,ugiam,priam,ssiam,umiam,stiam,oriam,idiam,utiam,rgiam,briam,uziam,spiam,itiam,agiam,udiam,ibiam,upiam,uriam,lpiam,rpiam,imiam,adiam,rziam,iriam,nhiam??4r:artiam,ingiam,feriam,petiam,geriam,letiam,undiam,rediam,lodiam,seriam,andiam,indiam,arciam,egriam,teriam,ortiam,pediam,umbiam,anziam,ramiam,urdiam,ungiam??4er:rretiam??5er:nvertiam,evertiam,bvertiam,rvertiam",
        "ex": "eram:ser??1am:ir??2nham:vir??1inham:ter??2vam:dar??6inham:entreter??3inham:deter,reter??4cavam:abra??ar??2??am:roer,moer,soer,ruir,puir??2cavam:co??ar,ro??ar,la??ar??2inham:ater??4??am:arguir??3cavam:cal??ar,for??ar,ati??ar??4vam:citar,fitar,ditar??3vam:atar??5vam:quitar??3nham:avir??1iam:ver,ler??3iam:poder,valer,ceder,feder,gemer,temer,meter,viger,arder,reler??1unham:p??r??2am:rir??5am:sorrir,servir,aderir,curtir,nutrir,surtir??3am:agir,adir??4am:pedir,medir,ferir,parir,latir,gerir,remir,ungir??2iam:crer??7am:divertir,advertir??4iam:erguer,verter"
      }
    },
    "pastTense": {
      "first": {
        "fwd": "2:tir,mir,gir,dir,bir,rir,lir,pir,cir,hir??3:ssir??i:er??us:??r??coitei:??oitar??2ive:ster??2quei:in??ar",
        "both": "2:nir,zir??3:quir,uvir??4:nguir,eguir??5:servir??5ive:brestar??5m:tervir??4ou:rassar??4m:rovir??4ive:treter??3m:avir,evir,dvir,nvir??3quei:tro??ar,bra??ar??3iz:sprazer??3u:doer??3ouve:mprazer??2??:moer,roer??2ive:bter,nter??1iz:fazer??1??:uir,air??1ouve:eaver??1uei:gar??1sse:izer??us:or??cei:??ar??quei:car??oube:aber??ude:oder??ei:ar",
        "rev": "azer:iz,ouve/prazeu??erer:is??r:m??1azer:rouxe,rouve??1er:ci,xi,o??,oi??1r:iu??2er:omi,rri,evi,ebi,egi,ati,ovi,lhi,chi,fri,avi,etive,lvi,ivi,azi,ozi,mpi,osi,cri??2r:oeu,teu??2??ar:moquei??3er:endi,erdi,meti,bstive,rgui,ambi,cedi,angi,erti,vali,enzi,orvi,reli,celi,essi,ordi??3r:nti,igi,ubi,ugi,pri,umi,sti,bri,idi,uti,oli,eri,spi,iti,agi,udi,ori,tri,imi,upi,uri,lpi,rgi,rpi,adi,ibi,uli,pli,iri,nhi,odi,lgi,cti??4r:arti,ormi,ingi,leti,undi,redi,andi,indi,arci,peli,pedi,umbi,rami,urdi,ungi,bali,medi,ardi??4er:pondi,condi,rreti,premi??4??ar:trinquei??5er:equeri,-queri,lqueri??5r:epeti,mpeti,negri,stali",
        "ex": "2:rir??3:agir,adir??4:pedir,medir,falir,parir,latir,remir,ungir,delir,balir,urdir??5:servir,sorrir,tossir,curtir,sortir,surtir,fremir,condir,garrir??7:divertir,advertir??fui:ir??1iz:fazer??2m:vir??3ive:estar,deter,reter??1ive:ter??1ouve:haver??2is:querer??2ouxe:trazer??3u:doer??2??:roer,moer,soer??3ouve:aprazer??2quei:co??ar,ro??ar,la??ar??2ive:ater??2ouve/prazeu:prazer??3quei:cal??ar,for??ar,ati??ar??8u:concernir??4u:urgir,later??3m:avir??4quei:remo??ar??9u:obstringir??1i:ver,ler??1us:p??r??2i:crer??3i:valer,ceder,feder,gemer,temer,meter,viger,arder,reler??4i:tremer,ferver,premer,monger??4ive:suster??6i:interver??1coitei:a??oitar??7i:absterger"
      },
      "second": {
        "fwd": "useste:??r??coitaste:??oitar??2iveste:ster??2caste:in??ar",
        "both": "5iveste:brestar??5iste:ntrever??5este:tervir??4caste:stro??ar??4iste:terver??4am:doer??4este:rovir??4iveste:treter??3regulamentasseiaste:baciar??3caste:emo??ar,bra??ar??3izeste:sprazer??3este:avir,evir,nvir??3ouveste:mprazer??3iste:tever??2??ste:cuir,buir,tuir,nuir,luir,ruir,suir??2iveste:bter,nter??1izeste:fazer??1ouveste:eaver??1??ste:air??1sseste:izer??useste:or??oubeste:aber??udeste:oder??ste:r",
        "rev": "2:aram,iram??3:oeram,teram??azer:izeste,ouveram??erer:iseste??ir:??ste??1r:ieste??1azer:rouxeste,rouveram/prazeram??2er:eviste,etiveste??3er:ustiveste??4??ar:trincaste",
        "ex": "foste:ir??1izeste:fazer??2este:vir??1iste:ver??3iveste:estar,deter,reter??1iveste:ter??1este:dar??1ouveste:haver??2iseste:querer??2ouxeste:trazer??4am:doer??4iste:prever??3iste:rever??4este:advir??3ouveram:aprazer??2caste:co??ar,ro??ar,la??ar??2iveste:ater??4??ste:arguir??2ouveram/prazeram:prazer??3caste:cal??ar,for??ar,ati??ar??7am:grassar??2??ste:ruir,puir??9am:concernir??5am:urgir,later??3este:avir??10am:obstringir??1useste:p??r??4iveste:abster??1coitaste:a??oitar"
      },
      "third": {
        "fwd": "coitou:??oitar??1s:??r??2cou:in??ar??3ve:ster",
        "both": "5eve:brestar??5u:rreter??5ve:treter??4iu:terver,ntever??4u:orver,meter,caver,rever??4ouve:omprazer??4ve:onter??4eio:tervir??3cou:emo??ar,tro??ar,bra??ar??3u:nzer,iver,rter,ozer,mber,lver,eder,over,ater,rder,eber,nder??3eio:rovir??2u:ser,uer,ler,per,oer,her,xer,ger,cer,rer,mer??2eio:avir,evir,dvir,nvir??1ouve:eaver??1sse:izer??1u:ir????s:or??oube:aber??ou:ar????de:oder??ez:azer",
        "rev": "ir:eio??erer:is??1azer:rouxe??1r:eu??2er:eviu??3r:nteve,eteve??4r:bsteve,usteve??4??ar:trincou",
        "ex": "foi:ir??1eio:vir??1iu:ver??3eve:estar??2ve:ter??1eu:dar??1ouve:haver??2is:querer??2ouxe:trazer??2u:ler,rer??5ve:manter??4u:dever,meter,jazer??4iu:prever??3iu:rever??4ve:deter,reter,obter??2cou:co??ar,ro??ar,la??ar??3ve:ater??5u:ferver??3cou:cal??ar,for??ar,ati??ar??6iu:entrever??2eio:avir??2s:p??r??1coitou:a??oitar"
      },
      "firstPlural": {
        "fwd": "usemos:??r??coitamos:??oitar??2mos:xer,ser??2ivemos:ster??2camos:in??ar??3mos:iver??5mos:coitar",
        "both": "5mos:quitar,ltitar,noitar,rreter??5ivemos:brestar??5imos:ntrever??5emos:tervir??4mos:pitar,gitar,orver,vitar,litar,sitar,enzer,bitar,ritar,citar,mitar,meter,ditar,eitar,caver,rever??4imos:terver,ntever??4emos:rovir??4ivemos:treter??3camos:emo??ar,tro??ar??3mos:xtar,rder,eder,ctar,ater,otar,rter,mber,etar,ptar,rtar,lver,utar,atar,eber,over,ltar,star,nder,ntar??3emos:evir,avir,dvir,nvir??3??mos:ssuir??2??mos:cuir,tuir,buir,nuir,luir,ruir??2mos:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,sar,var,har,oar,cer,jar,??ar,gar,dar,rer,lar,mer,mar??2ivemos:bter,nter??1ouvemos:eaver??1??mos:air??1ssemos:izer??1mos:ir??usemos:or??oubemos:aber??udemos:oder??izemos:azer",
        "rev": "erer:isemos??ir:??mos??1r:iemos??1azer:rouxemos,rouvemos??2er:evimos,etivemos??2r:temos,tamos??3r:evemos,azemos,ozemos,osemos,exemos??3??ar:bracamos??4r:vivemos,ervemos??4??ar:trincamos??5r:ressemos",
        "ex": "fomos:ir??2emos:vir??1imos:ver??3ivemos:estar,deter,reter??1ivemos:ter??1emos:dar??1ouvemos:haver??2isemos:querer??2ouxemos:trazer??2mos:ler,rer??4mos:dever,meter,jazer,cozer,citar,fitar,ditar,pitar,viver??4imos:prever??3imos:rever??4camos:abra??ar??2camos:co??ar,ro??ar,la??ar??2ivemos:ater??4??mos:arguir??5mos:ferver,quitar,poitar??5ouvemos:comprazer??3camos:cal??ar,for??ar,ati??ar??2??mos:ruir,puir??3mos:atar??3emos:avir??6mos:afoitar??8mos:circuitar??1usemos:p??r??4ivemos:abster,suster??1coitamos:a??oitar"
      },
      "secondPlural": {
        "fwd": "usestes:??r??coitastes:??oitar??2stes:xer,ser??2ivestes:ster??2castes:in??ar??3stes:iver??5stes:coitar",
        "both": "5stes:quitar,ltitar,noitar,rreter??5ivestes:brestar??5istes:ntrever??5estes:tervir??4stes:pitar,gitar,orver,vitar,litar,sitar,enzer,bitar,ritar,citar,mitar,meter,ditar,eitar,caver,rever??4istes:terver,ntever??4estes:rovir??4ivestes:treter??3castes:emo??ar,tro??ar??3stes:xtar,rder,eder,ctar,ater,otar,rter,mber,etar,ptar,rtar,lver,utar,atar,eber,over,ltar,star,nder,ntar??3estes:evir,avir,dvir,nvir??3??stes:ssuir??2??stes:cuir,tuir,buir,nuir,luir,ruir??2stes:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,sar,var,har,oar,cer,jar,??ar,gar,dar,rer,lar,mer,mar??2ivestes:bter,nter??1ouvestes:eaver??1??stes:air??1ssestes:izer??1stes:ir??usestes:or??oubestes:aber??udestes:oder??izestes:azer",
        "rev": "erer:isestes??ir:??stes??1r:iestes??1azer:rouxestes,rouvestes??2er:evistes,etivestes??2r:testes,tastes??3r:evestes,azestes,ozestes,osestes,exestes??3??ar:bracastes??4r:vivestes,ervestes??4??ar:trincastes??5r:ressestes",
        "ex": "fostes:ir??2estes:vir??1istes:ver??3ivestes:estar,deter,reter??1ivestes:ter??1estes:dar??1ouvestes:haver??2isestes:querer??2ouxestes:trazer??2stes:ler,rer??4stes:dever,meter,jazer,cozer,citar,fitar,ditar,pitar,viver??4istes:prever??3istes:rever??4castes:abra??ar??2castes:co??ar,ro??ar,la??ar??2ivestes:ater??4??stes:arguir??5stes:ferver,quitar,poitar??5ouvestes:comprazer??3castes:cal??ar,for??ar,ati??ar??2??stes:ruir,puir??3stes:atar??3estes:avir??6stes:afoitar??8stes:circuitar??1usestes:p??r??4ivestes:abster,suster??1coitastes:a??oitar"
      },
      "thirdPlural": {
        "fwd": "useram:??r??coitaram:??oitar??2iveram:ster??2caram:in??ar??3am:xer,ser??4am:iver",
        "both": "5am:po??ar,na??ar,ha??ar,ma??ar,en??ar,pa??ar,bitar,ga??ar,la??ar,ba??ar,gitar,oa??ar,do??ar,pitar,uitar,un??ar,orver,citar,ritar,litar,meter,nguir,mitar,vitar,an??ar,sitar,ditar,eitar,caver,eguir,rever??5iveram:brestar,ntreter??5iram:ntrever??4am:xtar,e??ar,nzer,u??ar,i??ar,quir,ctar,r??ar,lver,rter,mber,otar,etar,ptar,rtar,star,utar,atar,eder,over,ater,ltar,rder,eber,uvir,nder,ntar??4iram:terver??4ou:saguar??4eram:rovir??3caram:emo??ar,tro??ar,bra??ar??3am:hir,far,ler,cir,per,zir,uer,mer,ger,oer,zar,pir,nir,her,lir,iar,nar,cer,rir,bar,uar,par,var,sir,har,xar,bir,ear,oar,jar,rar,sar,gar,car,dir,gir,mir,rer,lar,dar,tir,mar??3eram:avir,evir,dvir,nvir??3ouveram:mprazer??3iram:tever??2iveram:bter,nter??1??ram:uir,air??1ouveram:eaver??1sseram:izer??useram:or??ouberam:aber??uderam:oder??izeram:azer",
        "rev": "3:??aram,teram,taram,uiram??4:everam,azeram,ozeram,oseram,exeram??5:viveram,erveram,esseram??erer:iseram??1r:ieram??1azer:rouxeram??2er:eviram,etiveram??3er:bstiveram,ustiveram??4??ar:trincaram",
        "ex": "foram:ir??2eram:vir??1iram:ver??3iveram:estar,deter,reter??1iveram:ter??1eram:dar??1ouveram:haver??2iseram:querer??2ouxeram:trazer??3am:rir,ler,rer??7eram:intervir??5am:dever,ca??ar,meter,jazer,cozer,citar,fitar,al??ar,ditar,ma??ar,pitar,in??ar,viver??7am:almo??ar,amea??ar,real??ar,esbo??ar,acho??ar,afoitar??4iram:prever??6am:servir,tra??ar,ferver,poitar??3iram:rever??2caram:co??ar,ro??ar,la??ar??2iveram:ater??3caram:cal??ar,for??ar,ati??ar??8am:derreter,saltitar,engra??ar,morra??ar??4am:atar,i??ar??10am:despeda??ar,escorra??ar,abiscoitar??3eram:avir??9am:descal??ar,redarguir,espica??ar,pernoitar,embara??ar,amorda??ar,desgra??ar,alvoro??ar,espeda??ar,congra??ar,desservir??12am:desembara??ar??1useram:p??r??1coitaram:a??oitar"
      }
    },
    "pluperfect": {
      "first": {
        "fwd": "a:??usera:??r??coitara:??oitar??2ivera:ster??2cara:in??ar",
        "both": "5ivera:brestar??5ira:ntrever??5era:tervir??4cara:stro??ar??4ira:terver??4era:rovir??4ivera:treter??3cara:emo??ar,bra??ar??3izera:sprazer??3era:avir,evir,nvir??3ouvera:mprazer??3ira:tever??2??ra:cuir,buir,tuir,nuir,luir,ruir,suir??2ivera:bter,nter??1izera:fazer??1ouvera:eaver??1??ra:air??1ssera:izer??usera:or??oubera:aber??udera:oder",
        "rev": "3:mara,tira,dara,lara,rera,mira,gira,dira,gara,rira,??ara,uira,jara,cera,eara,rara,sara,xara,hara,lera,tera,tara,oera,hera,zara,lira,nara,oara,para,iara,uara,zira,nira,pira,vara,mera,uera,bara,pera,gera,bira,fara,hira??4:ndera,evera,ncara,ebera,ssira,overa,avera,rcara,lvera,icara,ecara,scara,ucara,edera,rdera,lcara,exera,rvera,uvira,osera??5:locara,vivera,arcira,tacara,vocara,hocara,focara,lacara,pocara,bocara,pacara,hacara,essera,sacara,bacara??azer:izera,ouvera/prazera??erer:isera??ir:??ra??1r:iera??1azer:rouxera,rouvera??2er:evira,etivera??3er:bstivera,ustivera",
        "ex": "fora:ir??1izera:fazer??2era:vir??1ira:ver??3ivera:estar,deter,reter??1ivera:ter??1era:dar??1ouvera:haver??2isera:querer??2ouxera:trazer??4ira:prever??3ira:rever??4era:advir??3ouvera:aprazer??2cara:co??ar,ro??ar,la??ar??2ivera:ater??4??ra:arguir??2ouvera/prazera:prazer??3cara:cal??ar,for??ar,ati??ar??2??ra:ruir,puir??3era:avir??1usera:p??r??3a:rir,ler,rer??5a:viver,tocar,focar,jazer,cozer,tacar,sacar,locar,socar??6a:servir,trocar,lamber,benzer,brocar??10a:reciprocar??7a:atracar,xerocar,retocar,entocar??1coitara:a??oitar??7cara:destrin??ar??8a:derrocar??9a:atarracar,desservir,esburacar"
      },
      "second": {
        "fwd": "as:??useras:??r??coitaras:??oitar??2iveras:ster??2caras:in??ar",
        "both": "5iveras:brestar??5iras:ntrever??5eras:tervir??4caras:stro??ar??4iras:terver??4am:doer??4eras:rovir??4iveras:treter??3caras:emo??ar,bra??ar??3izeras:sprazer??3eras:avir,evir,nvir??3ouveras:mprazer??3iras:tever??2??ras:cuir,buir,tuir,nuir,luir,ruir,suir??2iveras:bter,nter??1izeras:fazer??1ouveras:eaver??1??ras:air??1sseras:izer??useras:or??ouberas:aber??uderas:oder",
        "rev": "2:aram,iram??3:maras,tiras,daras,laras,reras,miras,giras,diras,garas,riras,??aras,uiras,jaras,ceras,earas,raras,saras,xaras,haras,leras,teras,taras,oeram,heras,zaras,liras,naras,oaras,paras,iaras,uaras,ziras,niras,piras,varas,meras,ueras,baras,peras,geras,biras,oeras,faras,hiras,teram??4:nderas,everas,ncaras,eberas,ssiras,overas,averas,rcaras,lveras,icaras,ecaras,scaras,ucaras,ederas,rderas,lcaras,exeras,rveras,uviras,oseras??5:locaras,viveras,arciras,tacaras,vocaras,hocaras,focaras,lacaras,pocaras,bocaras,pacaras,hacaras,esseras,sacaras,bacaras??azer:izeras,ouveram,ouveram/prazeram??erer:iseras??ir:??ras??1r:ieras??1azer:rouxeras??2er:eviras,etiveras??3er:bstiveras,ustiveras",
        "ex": "foras:ir??1izeras:fazer??2eras:vir??1iras:ver??3iveras:estar,deter,reter??1iveras:ter??1eras:dar??1ouveras:haver??2iseras:querer??2ouxeras:trazer??4am:doer??4iras:prever??3iras:rever??4eras:advir??3ouveram:aprazer??2caras:co??ar,ro??ar,la??ar??2iveras:ater??4??ras:arguir??2ouveram/prazeram:prazer??3caras:cal??ar,for??ar,ati??ar??7am:grassar??2??ras:ruir,puir??9am:concernir??5am:urgir,later??3eras:avir??10am:obstringir??1useras:p??r??3as:rir,ler,rer??5as:viver,tocar,focar,jazer,cozer,tacar,sacar,locar,socar??6as:servir,trocar,lamber,benzer,brocar??10as:reciprocar??7as:atracar,xerocar,retocar,entocar??1coitaras:a??oitar??7caras:destrin??ar??8as:derrocar??9as:atarracar,desservir,esburacar"
      },
      "third": {
        "fwd": "usera:??r??coitara:??oitar??2ivera:ster??2cara:in??ar??3a:xer,ser??4a:iver",
        "both": "5a:po??ar,na??ar,ha??ar,ma??ar,en??ar,pa??ar,bitar,ga??ar,la??ar,ba??ar,gitar,oa??ar,do??ar,pitar,uitar,un??ar,orver,citar,ritar,litar,meter,nguir,mitar,vitar,an??ar,sitar,ditar,eitar,caver,eguir,rever??5ivera:brestar,ntreter??5ira:ntrever??4a:xtar,e??ar,nzer,u??ar,i??ar,quir,ctar,r??ar,lver,rter,mber,otar,etar,ptar,rtar,star,utar,atar,eder,over,ater,ltar,rder,eber,uvir,nder,ntar??4ira:terver??4era:rovir??3cara:emo??ar,tro??ar,bra??ar??3a:hir,far,ler,cir,per,zir,uer,mer,ger,oer,zar,pir,nir,her,lir,iar,nar,cer,rir,bar,uar,par,var,sir,har,xar,bir,ear,oar,jar,rar,sar,gar,car,dir,gir,mir,rer,lar,dar,tir,mar??3era:avir,evir,dvir,nvir??3ouvera:mprazer??3ira:tever??2ivera:bter,nter??1??ra:uir,air??1ouvera:eaver??1ssera:izer??usera:or??oubera:aber??udera:oder??izera:azer",
        "rev": "3:??ara,tera,tara,uira??4:evera,azera,ozera,osera,exera??5:vivera,ervera,essera??erer:isera??1r:iera??1azer:rouxera??2er:evira,etivera??3er:bstivera,ustivera??4??ar:trincara",
        "ex": "fora:ir??2era:vir??1ira:ver??3ivera:estar,deter,reter??1ivera:ter??1era:dar??1ouvera:haver??2isera:querer??2ouxera:trazer??3a:rir,ler,rer??7era:intervir??5a:dever,ca??ar,meter,jazer,cozer,citar,fitar,al??ar,ditar,ma??ar,pitar,in??ar,viver??7a:almo??ar,amea??ar,real??ar,esbo??ar,acho??ar,afoitar??4ira:prever??6a:servir,tra??ar,ferver,poitar??3ira:rever??2cara:co??ar,ro??ar,la??ar??2ivera:ater??3cara:cal??ar,for??ar,ati??ar??8a:derreter,saltitar,engra??ar,morra??ar??4a:atar,i??ar??10a:despeda??ar,escorra??ar,abiscoitar??3era:avir??9a:descal??ar,redarguir,espica??ar,pernoitar,embara??ar,amorda??ar,desgra??ar,alvoro??ar,espeda??ar,congra??ar,desservir??12a:desembara??ar??1usera:p??r??1coitara:a??oitar"
      },
      "firstPlural": {
        "fwd": "us??ramos:??r??coit??ramos:??oitar??2iv??ramos:ster??2c??ramos:in??ar",
        "both": "5iv??ramos:brestar??5??ramos:ntrever??5??ramos:tervir??4??ramos:terver??4??ramos:rreter??4ouv??ramos:omprazer??4??ramos:rovir??4iv??ramos:treter??3c??ramos:tro??ar,bra??ar??3??ramos:avir,evir,nvir??3??ramos:tever??3??ramos:meter??3iv??ramos:onter,anter??2??ramos:nzer,rter,ozer,mber,rder,eder,ater,eber,nder??2iv??ramos:bter??1??ramos:xer,ser,per,uer,ger,oer,her,ler,cer,ver,rer,mer??1ouv??ramos:eaver??1ss??ramos:izer??us??ramos:or??oub??ramos:aber????ramos:ar????ramos:ir??ud??ramos:oder??iz??ramos:azer",
        "rev": "erer:is??ramos??er:??ramos??1r:i??ramos??1azer:roux??ramos??2er:ev??ramos,etiv??ramos??2??ar:moc??ramos??3er:bstiv??ramos,ustiv??ramos??4??ar:trinc??ramos",
        "ex": "f??ramos:ir??2??ramos:vir??1??ramos:ver??3iv??ramos:estar,deter,reter??1iv??ramos:ter??1??ramos:dar??1ouv??ramos:haver??2is??ramos:querer??2oux??ramos:trazer??1??ramos:ler,rer??4??ramos:prever??3??ramos:rever??4??ramos:advir??3??ramos:meter,jazer??2c??ramos:co??ar,ro??ar,la??ar??2iv??ramos:ater??3c??ramos:cal??ar,for??ar,ati??ar??3??ramos:avir??4c??ramos:remo??ar??1us??ramos:p??r??1coit??ramos:a??oitar"
      },
      "secondPlural": {
        "fwd": "us??reis:??r??coit??reis:??oitar??2iv??reis:ster??2c??reis:in??ar",
        "both": "5iv??reis:brestar??5??reis:ntrever??5??reis:tervir??4??reis:terver??4??reis:rreter??4ouv??reis:omprazer??4??reis:rovir??4iv??reis:treter??3c??reis:tro??ar,bra??ar??3??reis:avir,evir,nvir??3??reis:tever??3??reis:meter??3iv??reis:onter,anter??2??reis:nzer,rter,ozer,mber,rder,eder,ater,eber,nder??2iv??reis:bter??1??reis:xer,ser,per,uer,ger,oer,her,ler,cer,ver,rer,mer??1ouv??reis:eaver??1ss??reis:izer??us??reis:or??oub??reis:aber????reis:ar????reis:ir??ud??reis:oder??iz??reis:azer",
        "rev": "erer:is??reis??er:??reis??1r:i??reis??1azer:roux??reis??2er:ev??reis,etiv??reis??2??ar:moc??reis??3er:bstiv??reis,ustiv??reis??4??ar:trinc??reis",
        "ex": "f??reis:ir??2??reis:vir??1??reis:ver??3iv??reis:estar,deter,reter??1iv??reis:ter??1??reis:dar??1ouv??reis:haver??2is??reis:querer??2oux??reis:trazer??1??reis:ler,rer??4??reis:prever??3??reis:rever??4??reis:advir??3??reis:meter,jazer??2c??reis:co??ar,ro??ar,la??ar??2iv??reis:ater??3c??reis:cal??ar,for??ar,ati??ar??3??reis:avir??4c??reis:remo??ar??1us??reis:p??r??1coit??reis:a??oitar"
      },
      "thirdPlural": {
        "fwd": "useram:??r??coitaram:??oitar??2iveram:ster??2caram:in??ar??3am:xer,ser??4am:iver",
        "both": "5am:po??ar,na??ar,ha??ar,ma??ar,en??ar,pa??ar,bitar,ga??ar,la??ar,ba??ar,gitar,oa??ar,do??ar,pitar,uitar,un??ar,orver,citar,ritar,litar,meter,nguir,mitar,vitar,an??ar,sitar,ditar,eitar,caver,eguir,rever??5iveram:brestar,ntreter??5iram:ntrever??4am:xtar,e??ar,nzer,u??ar,i??ar,quir,ctar,r??ar,lver,rter,mber,otar,etar,ptar,rtar,star,utar,atar,eder,over,ater,ltar,rder,eber,uvir,nder,ntar??4iram:terver??4eram:rovir??3caram:emo??ar,tro??ar,bra??ar??3am:hir,far,ler,cir,per,zir,uer,mer,ger,oer,zar,pir,nir,her,lir,iar,nar,cer,rir,bar,uar,par,var,sir,har,xar,bir,ear,oar,jar,rar,sar,gar,car,dir,gir,mir,rer,lar,dar,tir,mar??3eram:avir,evir,dvir,nvir??3ouveram:mprazer??3iram:tever??2iveram:bter,nter??1??ram:uir,air??1ouveram:eaver??1sseram:izer??useram:or??ouberam:aber??uderam:oder??izeram:azer",
        "rev": "3:??aram,teram,taram,uiram??4:everam,azeram,ozeram,oseram,exeram??5:viveram,erveram,esseram??erer:iseram??1r:ieram??1azer:rouxeram??2er:eviram,etiveram??3er:bstiveram,ustiveram??4??ar:trincaram",
        "ex": "foram:ir??2eram:vir??1iram:ver??3iveram:estar,deter,reter??1iveram:ter??1eram:dar??1ouveram:haver??2iseram:querer??2ouxeram:trazer??3am:rir,ler,rer??7eram:intervir??5am:dever,ca??ar,meter,jazer,cozer,citar,fitar,al??ar,ditar,ma??ar,pitar,in??ar,viver??7am:almo??ar,amea??ar,real??ar,esbo??ar,acho??ar,afoitar??4iram:prever??6am:servir,tra??ar,ferver,poitar??3iram:rever??2caram:co??ar,ro??ar,la??ar??2iveram:ater??3caram:cal??ar,for??ar,ati??ar??8am:derreter,saltitar,engra??ar,morra??ar??4am:atar,i??ar??10am:despeda??ar,escorra??ar,abiscoitar??3eram:avir??9am:descal??ar,redarguir,espica??ar,pernoitar,embara??ar,amorda??ar,desgra??ar,alvoro??ar,espeda??ar,congra??ar,desservir??12am:desembara??ar??1useram:p??r??1coitaram:a??oitar"
      }
    },
    "presentTense": {
      "first": {
        "fwd": "o:ar,uer??onho:??r??urmo:ormir??jo:gir,ger??igo:eguir????o:cer,cir??isto:estir??iro:erir??ito:etir??ino:enir??igro:egrir??urto:ortir??usco:oscar??1sso:oder??1o:mer,rer,xer,her,per,ser??1go:izer??1??o:uvir??1ulo:golir??2o:air,nder,iver,ubir,prir,umir,over,idir,itir,utir,eder,ndir,nuir,nguir,inir,odir,udir,ater,rter,trir,imir,ulir,upir,adir,nzer,tuir,roer,mbir,nzir,plir,irir,nhir??2co:erder??2ho:aler??2??o:pedir??3o:artir,rrir,istir,antir,order??3io:eler??4o:rreter",
        "both": "5:rassar??5jo:terver??5ou:brestar??5e:ncernir??5es:scernir??5o:mprazer??5nho:treter??4es:randir,culpir,olorir??4io:screr??4enho:esavir,tervir??4o:epolir,crever??4jo:tever??4mos:caver,eaver??4iro:equerer??3o:nibir,orver,xibir,rguir,amber,meter,ssuir??3ilo:ompelir??3mos:emir,alir??3es:arpir,aurir,rquir,molir,bolir??3eio:endiar,mediar??3nho:ster,nter??3co:bra??ar??3enho:rovir??2es:rdir,amir,anir??2ilo:xpelir??2enho:evir,dvir,nvir??2o:ruir,lver,buir,uzir,luir,eber??2eio:nsiar??2??o:fazer??1??zo:aizar,uizar,eizar??1????o:iu??ar??1??sco:aiscar??1??i:doer??1??no:uinar??1irjo:vergir??1??lio:biliar??1iro:arir??1??bo:oibir??1ido:redir??1??no:eunir??1io:ear??1nho:or??coito:??oitar????lego:olegar??irzo:erzir????nquo:inquir????guo:aguar??ispo:espir??ubro:obrir????quo:equar??irto:ertir??usso:ossir??into:entir",
        "rev": "oer:??i,??is??ervir:irvo??ir:es,e??r:mos??udar:??do??1ar:tou,oo,xo,fo??1ber:aibo??1eguir:sigo??1cer:e??o,s??o??1erir:firo,diro,giro,siro??1enir:vino??1er:z??1egrir:nigro??1ir:venho??2ar:alo,nco,ogo,nso,amo,tro,lto,iso,cho,aro,oco,rso,oro,ero,uro,o??o,abo,ago,izo,lgo,aso,rno,vio,rco,rio,pio,rdo,uco,ico,nro,ano,oio,ono,rmo,uso,fio,uio,uvo,cio,oto,rbo,eco,lpo,ezo,rgo,ugo,gio,dro,cto,elo,ngo,mio,lso,dio,eso,eno,pto,avo,i??o,apo,cuo,gno,sgo,clo,smo,opo,ldo,tio,bio,sio,epo,zio,ipo,lmo,l??o,blo,ojo,nio,juo,cro,duo,lro,vro,xto,hio,flo,rlo??2gir:rijo,eajo,dijo,injo,lijo,erjo,oajo,urjo,unjo??2cer:en??o??2etir:epito,flito,mpito??2r:tenho,uis??2olir:ngulo??2iar:edeio??2zer:digo??2estir:nvisto??2??ar:alco??2er:oso,moo??3ar:tudo,osto,an??o,iajo,alho,asso,sejo,onto,inho,judo,ento,eito,anto,rego,rito,unto,gino,cupo,impo,dito,ilho,anho,rumo,uido,oubo,esso,esto,rato,orto,nimo,asto,eimo,buzo,obro,vido,tumo,rado,erro,mino,leto,rigo,etuo,esco,rolo,novo,piro,urro,miro,usto,mulo,culo,ra??o,alio,modo,egro,huto,arro,ailo,ligo,sego,rubo,pejo,plio,tato,opro,cejo,ruto,tino,ulho,taco,iguo,puto,feto,vego,ea??o,ru??o,ruzo,tivo,elho,ilio,gato,sito,maio,irro,mejo,uivo,cito,timo,isso,mbro,uedo,aspo,cino,levo,uito,ngro,rivo,lino,pedo,nguo,ieto,isco,ibro,nejo,uilo,colo,lato,da??o,tigo,iedo,ombo,asco,ifro,redo,bsto,tuno,zijo,utuo,dulo,urvo,tulo,sato,pumo,nulo,gu??o,zino,agro,lu??o,mato,cado,cato,oa??o,uejo,ulco,cilo,rejo,pego,pido,vito,gito,gemo,dejo,rino,bolo,pino,viro,solo,hego,ampo,ba??o,jeto,la??o,julo,pujo??3er:endo,hovo,ofro,bato,movo,ompo,cedo,vivo,valho,enzo,rroo,remo,mexo??3ger:otejo??3ir:rimo,uiro,uspo,vado,sumo,ludo,tupo,dimo,uado,umbo,anzo,luto,sido??3r:evejo,raio,caio??3cer:xer??o,tor??o??3cir:sar??o??4r:orrio,ssaio??4ar:ompro,ome??o,tinuo,uisto,oximo,scovo,senho,heiro,omito,ssino,stejo,farto,servo,perto,berto,egulo,far??o,for??o,ilito,lebro,mendo,lerto,ecuto,nsaio,abito,gonho,preto,imito,penho,ferto,gun??o,rindo,cha??o,onsto,teiro,carto,neiro,etomo,nvejo,mpato,certo,lpito,icido,ontuo,entuo,imilo,ngajo,chilo,migro,ipito,bituo,inquo,tenuo,rrujo,ultuo,cundo,imido,mando,traco,efuto,banjo,izimo,placo,ncimo,elido,denho,raudo,fusco,ica??o,apito,rosso,serto,ltejo??4ir:sisto,umpro,xisto,ecido,rmito,ranto,minuo,tituo,efino,plodo,laudo,pando,dmito,smito,cindo,emito,ncido,apulo,implo,rcuto,mbuto,ncuto,runho??4er:pondo,corro,condo,colho,verto??4dir:espe??o??4gir:terajo??4ger:branjo,tranjo??5ir:iscuto,eparto,ifundo??5uir:stingo,xtingo??5ar:rranjo,mprovo,templo,eprovo,rope??o,corajo,dere??o,emunho,arreto,svendo,nipulo,ecreto,ofundo,erendo,lucido,uiteto,solido,lmor??o,ceituo,nsinuo,bebedo,stupro,artejo,essumo,icer??o??5er:eencho,erreto,sprovo",
        "ex": "4:prazer??5:aprazer??vou:ir????guo:aguar??1ou:ser,dar??2??o:fazer,pedir,medir,ouvir??1enho:vir??2jo:ver,fugir,reger,viger,rugir,mugir??3ou:estar??2nho:ter??1ei:haver,saber??3go:trazer??2o:rir,unir,roer,moer,poer,amar,usar,suar,orar,atar,fiar,miar,irar,arar,i??ar,piar,erar,elar,liar,azar??2io:ler??2ibo:caber??3o:abrir,dever,punir,meter,jazer,cozer,arder,comer,sair,andar,viver,cair,pular,subir,levar,olhar,mexer,bater,sumir,pegar,nadar,tomar,mudar,ligar,tirar,ceder,feder,matar,virar,lutar,errar,negar,lidar,ca??ar,mover,gemer,temer,fumar,erguer,assar,colar,gozar,atuar,regar,rolar,sujar,girar,rodar,citar,nevar,somar,bulir,uivar,mirar,catar,podar,vaiar,remar,tacar,mimar,fu??ar,fitar,cegar,pirar,or??ar,sacar,vazar,aliar,anuir,urrar,ditar,mijar,legar,domar,rimar,vetar,untar,bolar,vedar,sedar,raiar,ninar,rumar,sovar,pilar??3io:crer??5jo:prover,prever,reeleger??1??i:doer??1irvo:servir??4jo:rever??2eio:odiar??4nho:deter,reter,obter??4o:curtir,cuspir,ferver,remoer,partir,querer,correr,mandar,morrer,sonhar,buscar,encher,beijar,salvar,varrer,pintar,colher,emitir,morder,provar,suprir,nutrir,acudir,poupar,molhar,imitar,atirar,chupar,eximir,omitir,peidar,alegar,tolher,reinar,fartar,tatuar,findar,furtar,fundir,apitar,trajar,forrar,verter,manjar,fossar,intuir,situar,lograr,rondar,listar,forjar,sondar,mondar,migrar,ter??ar,folhar,borrar,torrar,lindar??3eio:mediar??3es:latir,ungir,munir,delir??5mos:florir??2??do:saudar??2co:co??ar,ro??ar,la??ar??3nho:ater??3co:cal??ar,for??ar,ati??ar,perder??1??is:soer??3s:ruir,puir??5es:repelir,impelir??7jo:entrever??3e:urgir??2enho:avir??3mos:adir??4s:fruir??2sso:poder??1onho:p??r??2go:dizer??1urmo:dormir??1jo:agir??5o:dividir,ensinar,escutar,quebrar,retirar,treinar,avistar,aprovar,sacudir,agendar,esvair,validar,inundar,apartar,pelejar,afundar,colidir,latejar,vegetar,aleijar,velejar,delegar,espetar??1igo:seguir??3ho:valer??1isto:vestir??1iro:ferir??7o:confundir,compartir??3jo:exigir,eleger,ranger,tanger??4??o:impedir,expedir??3??o:torcer??6o:combinar,trovejar,perfumar,mendigar,registar??9o:entrevistar??4iro:preterir??1urto:sortir??3isto:revestir??4io:reler??1usco:moscar"
      },
      "second": {
        "fwd": "??es:??r??ines:enir??oles:ulir??urtes:ortir??uscas:oscar??1es:gir,sir,cir??1??is:roer??2es:idir,etir,ndir,odir,mbir,nzir??3es:ertir",
        "both": "5??s:brestar??5em:ncernir??5e:scernir??5m:rassar??5??is:onstruir??4??s:terver,trever??4e:randir,olorir??4es:xpelir,epolir,esumir,efinir,ssumir,ngolir??4eias:cendiar??4??is:estruir??4is:caver,eaver??4??ns:treter??3e:aurir,rquir,molir,bolir??3es:ludir,nibir,xibir,audir,nguir,espir,pedir,eguir,artir??3m:doer??3??s:tever??3eias:mediar??3cas:bra??ar??3??ns:anter??2es:nhir,irir,plir,adir,imir,trir,arir,uzir,utir,itir,erir,stir,ntir,prir,brir,uvir,rmir??2e:rdir,rpir,lpir,anir,atir??2??s:eler,crer??2omes:bsumir,nsumir??2??ns:ster,bter??2eias:nsiar??1??zas:aizar,uizar,eizar??1????as:iu??ar??1??scas:aiscar??1??is:moer??1??nas:uinar??1??lias:biliar??1odes:cudir??1??bes:oibir??1ides:redir??1??nes:eunir??1ias:ear??1??ns:vir??coitas:??oitar????legas:olegar??irzes:erzir????nques:inquir??igres:egrir??opes:upir????guas:aguar??ospes:uspir????quas:equar??obes:ubir????es:or??s:r",
        "rev": "er:??s??ugir:oges??olir:ules??udar:??das??oer:??i??ir:e??1ar:t??s??1er:t??ns??1enir:vines??1igir:reges??1ir:gem??2ir:sses,rges,unes,ages,uges,eles??2r:oem,zem,ui??2iar:edeias??2oer:rr??is??2ulir:apoles??3ir:riges,inges,cides,petes,undes,xiges,lodes,indes,arces,diges,sides,umbes,anzes,liges??4ir:ivides,fletes,pandes,olides??5ir:ivertes,dvertes",
        "ex": "3:ruir,puir??4:fruir??vais:ir????s:ser????guas:aguar??1ens:vir??1??s:ver,ler??3??s:estar??2ns:ter??1??s:dar,haver??3es:pedir,medir,punir??2??s:crer??1oges:fugir??1omes:sumir??4??s:prover,prever??3m:doer??4??ns:conter??4es:servir,curtir,pungir??3??s:rever??2eias:odiar??3??ns:deter,reter??1ules:polir??2es:unir,agir??1??is:roer,moer??3eias:mediar??6m:aprazer??2??das:saudar??2cas:co??ar,ro??ar,la??ar??2??ns:ater??2eges:frigir??5m:prazer??3cas:cal??ar,for??ar,ati??ar??1??i:soer??5e:repelir,impelir??6es:compelir??3e:ungir,munir,delir??3em:urgir??4e:bramir??1??es:p??r??1oles:bulir??1urtes:sortir??1uscas:moscar"
      },
      "third": {
        "fwd": "??:aver????e:??r??ine:enir??ole:ulir??urte:ortir??usca:oscar??1e:gir,sir,cir??1??i:roer??2e:idir,etir,ndir,inir,odir,mbir,nzir??3e:ertir,urtir",
        "both": "2:izer,uzir,erer,azer??5??:brestar??5??:ntrever??5mos:epelir??5??i:onstruir??4??:terver??4mos:ernir,rquir,molir,bolir??4e:epolir,esumir,ssumir,ngolir??4??i:estruir??4??m:treter??3mos:rdir,amir,rpir,lpir,urir,anir,orir??3e:ludir,pedir,xibir,audir,nguir,espir,eguir,artir??3??:tever??3eia:mediar??3ca:bra??ar??3??m:anter??2e:nhir,irir,plir,adir,imir,trir,arir,utir,itir,erir,stir,ntir,prir,brir,uvir,rmir??2??:eler,crer??2ome:bsumir,nsumir??2eia:ndiar,nsiar??2??m:ster,bter??1??za:aizar,uizar,eizar??1????a:iu??ar??1??sca:aiscar??1??i:moer??1??na:uinar??1??lia:biliar??1ode:cudir??1??be:oibir??1ide:redir??1??ne:eunir??1ia:ear??1??m:vir??coita:??oitar????lega:olegar??irze:erzir????nque:inquir??igre:egrir??ope:upir????gua:aguar??ospe:uspir????qua:equar??obe:ubir????e:or??:r",
        "rev": "er:????ugir:oge??olir:ule??udar:??da??ir:??mos??1ar:t????1er:t??m??1enir:vine??1r:imos,emos??1igir:rege??2ir:sse,rge,une,age,uge,ele,ibe??2iar:edeia??2??ar:alca??2oer:rr??i??2ulir:apole??3ir:rige,inge,cide,pete,unde,xige,fine,lode,inde,arce,dige,side,umbe,anze,lige??4ir:ivide,flete,pande,olide??5ir:iverte,dverte",
        "ex": "vai:ir????:ser????gua:aguar??1em:vir??1??:ver,ler??3??:estar??2m:ter??1??:dar,haver??3e:pedir,medir,punir??2??:crer??1oge:fugir??1ome:sumir??4??:prover,prever??4??m:conter??4e:servir,inibir,curtir,pungir??3??:rever??2eia:odiar??3??m:deter,reter??1ule:polir??2e:unir,agir??1??i:roer,moer??3eia:mediar??4mos:latir,ungir,munir,delir??2??da:saudar??2ca:co??ar,ro??ar,la??ar??2??m:ater??2ege:frigir??3ca:cal??ar,for??ar,ati??ar??3mos:soer??2??mos:ruir,puir??5e:expelir??6e:compelir??6mos:impelir,brandir??3??mos:fruir??1??e:p??r??1ole:bulir??1urte:sortir??1usca:moscar"
      },
      "firstPlural": {
        "fwd": "2camos:ti??ar",
        "both": "5s:randir,culpir,emolir??4s:ernir,rquir,bolir??3s:rdir,amir,rpir,urir,atir,orir??3camos:bra??ar??2??mos:buir,tuir,nuir,luir,ruir,suir??1??mos:air??coitamos:??oitar??mos:r",
        "rev": "ir:??mos,??s??1r:is,eis??2??ar:alcamos",
        "ex": "vamos:ir??1omos:ser,p??r??4s:banir,ungir,munir,delir??2camos:co??ar,ro??ar,la??ar??4??mos:arguir??3camos:cal??ar,for??ar,ati??ar??3is:soer??2??s:ruir,puir??6s:repelir,impelir??3??s:fruir"
      },
      "secondPlural": {
        "fwd": "ondes:??r??2cais:ti??ar",
        "both": "5des:terver,trever??5s:xpelir,epolir,ngolir??5ndes:treter??4em:randir,epelir??4s:nquir,nguir,eunir,eguir??4des:tever??4??s:ossuir??3des:eler,crer,rrir??3s:plir,upir,ulir,enir,inir,spir,ssir??3em:rquir??3??s:rguir??3ndes:ster,bter,nter??3cais:bra??ar??2s:hir,cir,bir,zir,rir,dir,gir,mir,tir??2em:rdir,amir,rnir,rpir,lpir,urir,anir,orir??2??s:buir,tuir,nuir,ruir,luir??2ndes:vir??1ndes:or??1??s:air??coitais:??oitar??is:r",
        "rev": "er:ois??r:ndes??ir:em??1r:edes,ides??2r:vis,nis,oem??2??ar:alcais??3r:olis,elis",
        "ex": "1des:ir??1ois:ser??2ndes:vir,ter??2des:ver,rir,ler??4s:ouvir,polir,punir??3des:crer??5des:prover,prever??5s:servir??4des:rever??4ndes:deter,reter??4em:abolir??3s:unir??5em:demolir,impelir??3em:latir,ungir,munir,fruir,delir??2cais:co??ar,ro??ar,la??ar??3ndes:ater??3cais:cal??ar,for??ar,ati??ar??3m:soer??2em:ruir,puir??7s:compelir??1ondes:p??r"
      },
      "thirdPlural": {
        "fwd": "??o:aver????em:??r??em:ir??inem:enir??olem:ulir??urtem:ortir??uscam:oscar",
        "both": "5??o:brestar??5em:trever??5oem:onstruir??4em:tever??4oem:estruir??4??m:treter,tervir??3em:eler,crer,rrir??3eiam:mediar??3??m:rovir??2??zam:juizar??2omem:bsumir,nsumir??2??m:ster,avir,evir,dvir,bter,nvir,nter??2eiam:ndiar,nsiar??1??zam:aizar,eizar??1????am:iu??ar??1??scam:aiscar??1??nam:uinar??1??liam:biliar??1odem:cudir??1??bem:oibir??1idem:redir??1??nem:eunir??1iam:ear??coitam:??oitar????legam:olegar??irzem:erzir????nquem:inquir??igrem:egrir??opem:upir????guam:aguar??ospem:uspir????quam:equar??obem:ubir????em:or??m:r",
        "rev": "ugir:ogem??olir:ulem??udar:??dam??1r:eem??1ir:aem,v??m??1er:t??m??1enir:vinem??1igir:regem??2ar:st??o??2ir:rmem,uvem,brem,stem,prem,ssem,suem,item,luem,utem,rgem,ntem,uzem,nuem,buem,umem,tuem,agem,unem,udem,ruem,trem,imem,ugem,elem,adem,ibem,plem,irem,nhem??2??ar:alcam??2ulir:apolem??3ir:artem,rigem,videm,ingem,ferem,cidem,petem,gerem,undem,xigem,eguem,finem,serem,andem,arcem,digem,sidem,pedem,anzem,umbem,ungem??3??ar:bracam??4ir:fletem,ngolem,inguem,cindem,epolem,fligem,olidem,plodem??5ir:ivertem,dvertem,reterem,darguem",
        "ex": "v??o:ir????guam:aguar??1??o:ser,dar,haver??1??m:vir,ter??2em:ver,rir,ler,agir,unir??3??o:estar??3em:crer,pedir,medir,ferir,parir,gerir??1ogem:fugir??1omem:sumir??5em:prover,prever??4em:rever,servir,aderir,curtir,despir,arguir??2eiam:odiar??3??m:deter,reter??1ulem:polir??4cam:abra??ar??3eiam:mediar??2??dam:saudar??2cam:co??ar,ro??ar,la??ar??2??m:ater,avir??2egem:frigir??3cam:cal??ar,for??ar,ati??ar??7em:interver??1??em:p??r??1olem:bulir??1urtem:sortir??1uscam:moscar"
      }
    },
    "infinitivo": {
      "first": {
        "fwd": ":??2car:ti??ar",
        "both": "3car:bra??ar??coitar:??oitar",
        "rev": "2:er,ir,??r,or??3:mar,dar,lar,gar,??ar,rar,oar,har,sar,jar,par,bar,zar,nar,iar,uar,var,ear,xar,far??4:star,ntar,icar,ocar,rcar,atar,utar,ltar,ptar,etar,otar,scar,rtar,ncar,ecar,ctar,ucar,xtar??5:eitar,ditar,vitar,sitar,tacar,litar,ritar,mitar,citar,pitar,lacar,gitar??2??ar:alcar",
        "ex": "2:ir??3:dar??4:atar??5:citar,tacar,fitar,sacar,ditar??6:quitar??7:habitar,atracar??8:inculcar??2car:co??ar,ro??ar,la??ar??3car:cal??ar,for??ar,ati??ar"
      },
      "second": {
        "fwd": "es:",
        "both": "4em:doer??3cares:bra??ar??2??res:nuir,tuir,buir,luir,ruir,suir??1??res:air??coitares:??oitar",
        "rev": "2:eres,ires,ores??3:mares,dares,lares,gares,??ares,rares,oares,hares,sares,jares,pares,bares,zares,nares,iares,uares,vares,eares,xares,fares??4:stares,ntares,icares,ocares,rcares,atares,utares,ltares,ptares,etares,otares,scares,rtares,ncares,ecares,ctares,ucares,xtares??5:eitares,ditares,vitares,sitares,tacares,litares,ritares,mitares,citares,pitares,lacares,gitares??:em??ir:??res??2??ar:alcares",
        "ex": "1ores:p??r??4em:doer??7em:aprazer,grassar??2cares:co??ar,ro??ar,la??ar??4??res:arguir??6em:prazer??3cares:cal??ar,for??ar,ati??ar??2??res:ruir,puir??9em:concernir??5em:urgir??2es:ir??3es:dar??5es:citar,tacar,fitar,sacar,ditar??7es:habitar,atracar??4es:atar??6es:quitar??8es:inculcar"
      },
      "third": {
        "fwd": ":??2car:ti??ar",
        "both": "3car:bra??ar??coitar:??oitar",
        "rev": "2:er,ir,??r,or??3:mar,dar,lar,gar,??ar,rar,oar,har,sar,jar,par,bar,zar,nar,iar,uar,var,ear,xar,far??4:star,ntar,icar,ocar,rcar,atar,utar,ltar,ptar,etar,otar,scar,rtar,ncar,ecar,ctar,ucar,xtar??5:eitar,ditar,vitar,sitar,tacar,litar,ritar,mitar,citar,pitar,lacar,gitar??2??ar:alcar",
        "ex": "2:ir??3:dar??4:atar??5:citar,tacar,fitar,sacar,ditar??6:quitar??7:habitar,atracar??8:inculcar??2car:co??ar,ro??ar,la??ar??3car:cal??ar,for??ar,ati??ar"
      },
      "firstPlural": {
        "fwd": "mos:??2carmos:ti??ar",
        "both": "3carmos:bra??ar??coitarmos:??oitar",
        "rev": "2:ermos,irmos,ormos??3:marmos,darmos,larmos,garmos,??armos,rarmos,oarmos,harmos,sarmos,jarmos,parmos,barmos,zarmos,narmos,iarmos,uarmos,varmos,earmos,xarmos,farmos??4:starmos,ntarmos,icarmos,ocarmos,rcarmos,atarmos,utarmos,ltarmos,ptarmos,etarmos,otarmos,scarmos,rtarmos,ncarmos,ecarmos,ctarmos,ucarmos,xtarmos??5:eitarmos,ditarmos,vitarmos,sitarmos,tacarmos,litarmos,ritarmos,mitarmos,citarmos,pitarmos,lacarmos,gitarmos??2??ar:alcarmos",
        "ex": "1ormos:p??r??2carmos:co??ar,ro??ar,la??ar??3carmos:cal??ar,for??ar,ati??ar??2mos:ir??3mos:dar??5mos:citar,tacar,fitar,sacar,ditar??7mos:habitar,atracar??4mos:atar??6mos:quitar??8mos:inculcar"
      },
      "secondPlural": {
        "fwd": "des:??2cardes:ti??ar",
        "both": "3cardes:bra??ar??coitardes:??oitar",
        "rev": "2:erdes,irdes,ordes??3:mardes,dardes,lardes,gardes,??ardes,rardes,oardes,hardes,sardes,jardes,pardes,bardes,zardes,nardes,iardes,uardes,vardes,eardes,xardes,fardes??4:stardes,ntardes,icardes,ocardes,rcardes,atardes,utardes,ltardes,ptardes,etardes,otardes,scardes,rtardes,ncardes,ecardes,ctardes,ucardes,xtardes??5:eitardes,ditardes,vitardes,sitardes,tacardes,litardes,ritardes,mitardes,citardes,pitardes,lacardes,gitardes??2??ar:alcardes",
        "ex": "1ordes:p??r??2cardes:co??ar,ro??ar,la??ar??3cardes:cal??ar,for??ar,ati??ar??2des:ir??3des:dar??5des:citar,tacar,fitar,sacar,ditar??7des:habitar,atracar??4des:atar??6des:quitar??8des:inculcar"
      },
      "thirdPlural": {
        "fwd": "em:??2carem:ti??ar",
        "both": "3carem:bra??ar??2??rem:buir,ruir,tuir,nuir,luir,suir??1??rem:air??coitarem:??oitar",
        "rev": "2:erem,irem,orem??3:marem,darem,larem,garem,??arem,rarem,oarem,harem,sarem,jarem,parem,barem,zarem,narem,iarem,uarem,varem,earem,xarem,farem??4:starem,ntarem,icarem,ocarem,rcarem,atarem,utarem,ltarem,ptarem,etarem,otarem,scarem,rtarem,ncarem,ecarem,ctarem,ucarem,xtarem??5:eitarem,ditarem,vitarem,sitarem,tacarem,litarem,ritarem,mitarem,citarem,pitarem,lacarem,gitarem??ir:??rem??2??ar:alcarem",
        "ex": "1orem:p??r??2carem:co??ar,ro??ar,la??ar??4??rem:arguir??3carem:cal??ar,for??ar,ati??ar??2??rem:ruir,puir??2em:ir??3em:dar??5em:citar,tacar,fitar,sacar,ditar??7em:habitar,atracar??4em:atar??6em:quitar??8em:inculcar"
      }
    },
    "gerunds": {
      "gerunds": {
        "fwd": "",
        "both": "3cando:bra??ar??ndo:r",
        "rev": "",
        "ex": "1ondo:p??r??2cando:co??ar"
      }
    },
    "pastParticiple": {
      "pastParticiple": {
        "fwd": "ido:er??osto:??r??1to:izer??2do:tir,mir,dir,bir,gir,zir??3do:rrir,erir",
        "both": "5do,entregue:tregar??5ndo:tervir??4do:utrir,eguir??4do,inserto:serir??4??do:minuir??4ndo:rovir??4do,impresso:rimir??3do:orir,arir,irir,ssir,prir??3ndo:dvir,nvir??3ido,eleito:leger??3cado:bra??ar??3do,salvo:lvar??2??do:buir,tuir,luir,ruir,suir??2do:pir,nir,lir??2ito:crever??1ido,roto:per??1eito:fazer??1??do:air,oer??1sto:or??1erto:brir??1do:ar",
        "rev": "r:ndo,do ou ganho,do, pago,do,aceito,do ou gasto,do,solto,do,extinto??er:ido,morto,isto,ido,preso,ido,aceso??1er:vido,cido,xido,hido??1r:ado,morto,ado,expresso??2er:omido,azido,ndido,abido,ebido,rdido,egido,frido,rrido,btido,emido,mbido??2zer:dito??3r:rtido,rmido,uvido,idido,stido,ugido,ngido,umido,itido,utido,rgido,uzido,agido,udido??3er:uerido,ontido,retido,metido,bstido,batido??4r:entido,rigido,ferido,ervido,petido,gerido,letido,pedido,xigido,nguido,lodido,andido??5r:rantido,fundido,gredido??5er:nvertido",
        "ex": "1do:ir??1eito:fazer??2ndo:vir??1isto:ver??2do:rir??4do:ouvir,pedir,subir,medir,ferir,latir??5do ou ganho:ganhar??4ido,morto:morrer??4do, pago:pagar??4isto:prever??5do:servir,sorrir,aderir??3isto:rever??6do,aceito:aceitar??4do,morto:matar??5ido,preso:prender??5ido,aceso:acender??8do,expresso:expressar??9do:distinguir,prescindir??5do ou gasto:gastar??5do,solto:soltar??8do,extinto:extinguir??2cado:co??ar??1ido:ser,ter,ler??3ido:poder,valer,bater,deter,ceder,feder,reter,meter,viger??1osto:p??r??2to:dizer??3do:agir??4ido:manter,erguer??2ido:crer,ater??6do:invadir,proibir"
      }
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress$1(model$1[k][form]);
    });
  });

  const forms$2 = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural'];

  let {
    conditional: conditional$1,
    futureTense: futureTense$1,
    imperativeNeg: imperativeNeg$1,
    imperative: imperative$1,
    imperfect: imperfect$1,
    pastTense: pastTense$1,
    pluperfect: pluperfect$1,
    presentTense: presentTense$1,
    gerunds: gerunds$1,
    pastParticiple: pastParticiple$1,
    infinitivo: infinitivo$1
  } = model$1;


  const allForms$1 = function (str, m) {
    return forms$2.reduce((h, form) => {
      h[form] = convert$1(str, m[form]);
      return h
    }, {})
  };

  const toConditional$1 = (str) => allForms$1(str, conditional$1);
  const toFutureTense$1 = (str) => allForms$1(str, futureTense$1);
  const toImperativeNeg$1 = (str) => allForms$1(str, imperativeNeg$1);
  const toImperative$1 = (str) => allForms$1(str, imperative$1);
  const toImperfect$1 = (str) => allForms$1(str, imperfect$1);
  const toPastTense$1 = (str) => allForms$1(str, pastTense$1);
  const toPluperfect$1 = (str) => allForms$1(str, pluperfect$1);
  const toPresentTense$1 = (str) => allForms$1(str, presentTense$1);
  const toInfinitivo$1 = (str) => allForms$1(str, infinitivo$1);
  const toGerund$1 = (str) => convert$1(str, gerunds$1);
  const toPastParticiple$1 = (str) => convert$1(str, pastParticiple$1);




  // // an array of every inflection, for '{inf}' syntax
  const all$1 = function (str) {
    let res = [str].concat(
      Object.values(toConditional$1(str)),
      Object.values(toFutureTense$1(str)),
      Object.values(toImperativeNeg$1(str)),
      Object.values(toImperative$1(str)),
      Object.values(toImperfect$1(str)),
      Object.values(toPastTense$1(str)),
      Object.values(toPluperfect$1(str)),
      Object.values(toPresentTense$1(str)),
      Object.values(toInfinitivo$1(str)),
      toGerund$1(str),
      toPastParticiple$1(str),
    ).filter(s => s);
    res = new Set(res);
    return Array.from(res)
  };
  // console.log(all('broxar'))

  const forms$1 = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural'];

  let {
    conditional,
    futureTense,
    imperativeNeg,
    imperative,
    imperfect,
    pastTense,
    pluperfect,
    presentTense,
    gerunds,
    pastParticiple,
    infinitivo
  } = model$1;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse$1(m[k]);
      return h
    }, {})
  };

  conditional = revAll(conditional);
  futureTense = revAll(futureTense);
  imperativeNeg = revAll(imperativeNeg);
  imperative = revAll(imperative);
  imperfect = revAll(imperfect);
  pastTense = revAll(pastTense);
  pluperfect = revAll(pluperfect);
  presentTense = revAll(presentTense);
  infinitivo = revAll(infinitivo);
  gerunds = reverse$1(gerunds.gerunds);
  pastParticiple = reverse$1(pastParticiple.pastParticiple);


  const allForms = function (str, m) {
    return forms$1.reduce((h, form) => {
      h[form] = convert$1(str, m[form]);
      return h
    }, {})
  };

  const fromConditional = (str) => allForms(str, conditional);
  const fromFutureTense = (str) => allForms(str, futureTense);
  const fromImperativeNeg = (str) => allForms(str, imperativeNeg);
  const fromImperative = (str) => allForms(str, imperative);
  const fromImperfect = (str) => allForms(str, imperfect);
  const fromPastTense = (str) => allForms(str, pastTense);
  const fromPluperfect = (str) => allForms(str, pluperfect);
  const fromPresentTense = (str) => allForms(str, presentTense);
  const fromInfinitivo = (str) => allForms(str, infinitivo);
  const fromGerund = (str) => convert$1(str, gerunds);
  const fromPastParticiple = (str) => convert$1(str, pastParticiple);

  let { f, mp, fp } = model$1.adjectives;

  let fRev = reverse$1(f);
  let mpRev = reverse$1(mp);
  let fpRev = reverse$1(fp);

  const toFemale = (str) => convert$1(str, f);
  const toPlural = (str) => convert$1(str, mp);
  const toFemalePlural = (str) => convert$1(str, fp);
  const fromFemale = (str) => convert$1(str, fRev);
  const toSingular = (str) => convert$1(str, mpRev);
  const fromFemalePlural = (str) => convert$1(str, fpRev);

  const all = function (str) {
    let arr = [str];
    arr.push(toFemale(str));
    arr.push(toPlural(str));
    arr.push(toFemalePlural(str));
    arr = arr.filter(s => s);
    arr = new Set(arr);
    return Array.from(arr)
  };
  // console.log(all('maravilhoso'))
  // console.log(toPlural("maravilhoso"))

  var methods = {
    verb: {
      all: all$1, toConditional: toConditional$1, toFutureTense: toFutureTense$1, toImperativeNeg: toImperativeNeg$1, toImperative: toImperative$1, toImperfect: toImperfect$1,
      toPastTense: toPastTense$1, toPluperfect: toPluperfect$1, toPresentTense: toPresentTense$1, toGerund: toGerund$1, toPastParticiple: toPastParticiple$1, toInfinitivo: toInfinitivo$1,

      fromConditional, fromFutureTense, fromImperativeNeg, fromImperative, fromImperfect,
      fromPastTense, fromPluperfect, fromPresentTense,
      fromGerund, fromPastParticiple, fromInfinitivo
    },
    noun: {},
    adjective: {
      all: all, toFemale, toPlural, toFemalePlural, fromFemale, toSingular, fromFemalePlural,
    },
  };

  let lex = {
    'n??o': 'Negative',
    'nunca': 'Negative',
    // 'qu??': 'QuestionWord',//what?
    'o que': 'QuestionWord',//what?
    'quem': 'QuestionWord',//who?
    'qual': 'QuestionWord',//which?
    'porqu??': 'QuestionWord',//why?
    'quando': 'QuestionWord',//when?
    'onde': 'QuestionWord',//where?
    // 'como': 'QuestionWord',//how?
    'quanto': 'QuestionWord',
    'qu??o': 'QuestionWord',
  };

  //possessive pronouns
  let poss = [
    'meu',
    'meus',// (masc.)
    'minha',
    'minhas',// (fem.)	my/mine
    'teu',
    'teus',// (masc.)
    'tua',
    'tuas',// (fem.)  
    'seu',
    'seus',// (masc.)
    'sua',
    'suas',// (fem.)	your/yours (singular)
    'dele',
    'dela',	//his/hers/its
    'nosso',
    'nossos',// (masc.)
    'nossa',
    'nossas',// (fem.)	our/ours
    'vosso',
    'vossos',// (masc.)
    'vossa',
    'vossas',// (fem.)	your/yours (plural)
    'deles',
    'delas',	//their/theirs
  ];
  poss.forEach(str => {
    lex[str] = ['Possessive', 'Pronoun'];
  });

  const forms = ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'];
  const addCopulas = (arr, tag) => {
    arr.forEach((str, i) => {
      lex[str] = lex[str] || ['Copula', forms[i], tag];
    });
  };
  // copula ser
  lex['sido'] = ['PastParticiple', 'Copula'];
  lex['sendo'] = ['Gerund', 'Copula'];
  lex['s??'] = ['Imperative', 'Copula', 'SecondPerson'];
  lex['sede'] = ['Imperative', 'Copula', 'SecondPersonPlural'];
  addCopulas(['ser', 'seres', 'ser', 'sermos', 'serdes', 'serem'], 'Infinitive');
  addCopulas(['sou', '??s', '??', 'somos', 'sois', 's??o'], 'PresentTense');
  addCopulas(['fui', 'foste', 'foi', 'fomos', 'fostes', 'foram'], 'PastTense');
  addCopulas(['era', 'eras', 'era', '??ramos', '??reis', 'eram'], 'Imperfect');
  addCopulas(['fora', 'foras', 'fora', 'f??ramos', 'f??reis', 'foram'], 'Pluperfect');
  addCopulas(['serei', 'ser??s', 'ser??', 'seremos', 'sereis', 'ser??o'], 'FutureTense');
  addCopulas(['seria', 'serias', 'seria', 'ser??amos', 'ser??eis', 'seriam'], 'ConditionalVerb');
  addCopulas(['seja', 'sejas', 'seja', 'sejamos', 'sejais', 'sejam'], 'PresentTense');// (Subjunctive)
  addCopulas(['fosse', 'fosses', 'fosse', 'f??ssemos', 'f??sseis', 'fossem'], 'Imperfect');// (Subjunctive)
  addCopulas(['for', 'fores', 'for', 'formos', 'fordes', 'forem'], 'FutureTense');// (Subjunctive)

  // copula estar
  lex['estado'] = ['PastParticiple', 'Copula'];
  lex['estando'] = ['Gerund', 'Copula'];
  lex['est??'] = ['Imperative', 'Copula', 'SecondPerson'];
  lex['estai'] = ['Imperative', 'Copula', 'SecondPersonPlural'];
  addCopulas(['estar', 'estares', 'estar', 'estarmos', 'estardes', 'estarem'], 'Infinitive');
  addCopulas(['estou', 'est??s', 'est??', 'estamos', 'estais', 'est??o'], 'PresentTense');
  addCopulas(['estive', 'estiveste', 'esteve', 'estivemos', 'estivestes', 'estiveram'], 'PastTense');
  addCopulas(['estava', 'estavas', 'estava', 'est??vamos', 'est??veis', 'estavam'], 'Imperfect');
  addCopulas(['estivera', 'estiveras', 'estivera', 'estiv??ramos', 'estiv??reis', 'estiveram'], 'Pluperfect');
  addCopulas(['estarei', 'estar??s', 'estar??', 'estaremos', 'estareis', 'estar??o'], 'FutureTense');
  addCopulas(['estaria', 'estarias', 'estaria', 'estar??amos', 'estar??eis', 'estariam'], 'ConditionalVerb');
  addCopulas(['esteja', 'estejas', 'esteja', 'estejamos', 'estejais', 'estejam'], 'PresentTense');
  addCopulas(['estivesse', 'estivesses', 'estivesse', 'estiv??ssemos', 'estiv??sseis', 'estivessem'], 'Imperfect');
  addCopulas(['estiver', 'estiveres', 'estiver', 'estivermos', 'estiverdes', 'estiverem'], 'FutureTense');


  var misc$1 = lex;

  const { toPresentTense, toPastTense, toFutureTense, toConditional, toImperative,
    toImperativeNeg, toImperfect, toPluperfect, toGerund, toPastParticiple, toInfinitivo } = methods.verb;
  let lexicon$1 = {};

  const tagMap = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };
  const addToLex = function (obj, tag, lex) {
    Object.keys(obj).forEach(k => {
      let w = obj[k];
      if (!lex[w]) {
        lex[w] = [tag, tagMap[k]];
      }
    });
  };

  Object.keys(lexData).forEach(tag => {
    let wordsObj = unpack$1(lexData[tag]);
    Object.keys(wordsObj).forEach(w => {
      lexicon$1[w] = tag;

      // add conjugations for our verbs
      if (tag === 'Infinitive') {
        // add present tense
        let obj = toPresentTense(w);
        addToLex(obj, 'PresentTense', lexicon$1);
        // add past tense
        obj = toPastTense(w);
        addToLex(obj, 'PastTense', lexicon$1);
        // add future tense
        obj = toFutureTense(w);
        addToLex(obj, 'FutureTense', lexicon$1);
        // add conditional
        obj = toConditional(w);
        addToLex(obj, 'Conditional', lexicon$1);
        // add imperative
        obj = toImperative(w);
        addToLex(obj, 'Imperative', lexicon$1);
        obj = toImperativeNeg(w);
        addToLex(obj, 'Imperative', lexicon$1);
        // add Imperfect
        obj = toImperfect(w);
        addToLex(obj, 'Imperfect', lexicon$1);
        // add toPluperfect
        obj = toPluperfect(w);
        addToLex(obj, 'Pluperfect', lexicon$1);
        // add toInfinitivo
        obj = toInfinitivo(w);
        addToLex(obj, 'Infinitive', lexicon$1);
        // add gerund
        let str = toGerund(w);
        lexicon$1[str] = lexicon$1[str] || 'Gerund';
        // add PastParticiple
        str = toPastParticiple(w);
        lexicon$1[str] = lexicon$1[str] || 'PastParticiple';
      }
      if (tag === 'Adjective') {
        let s = methods.adjective.toPlural(w);
        lexicon$1[s] = lexicon$1[s] || ['Adjective', 'MaleAdjective', 'PluralAdjective'];
        let f = methods.adjective.toFemale(w);
        lexicon$1[f] = lexicon$1[f] || ['Adjective', 'FemaleAdjective', 'SingularAdjective'];
        let fs = methods.adjective.toFemalePlural(w);
        lexicon$1[fs] = lexicon$1[fs] || ['Adjective', 'FemaleAdjective', 'PluralAdjective'];
      }
      if (tag === 'Cardinal') {
        lexicon$1[w] = ['Cardinal', 'TextValue'];
      }
      if (tag === 'Ordinal') {
        lexicon$1[w] = ['Ordinal', 'TextValue'];
      }
    });
  });

  Object.assign(lexicon$1, misc$1);
  // console.log(lexicon['ele'])


  var lexicon$2 = lexicon$1;

  const root = function (view) {
    view.world.methods.two.transform;
    view.docs.forEach(terms => {
      terms.forEach(term => {
        term.implicit || term.normal || term.text;
      });
    });

  };
  var root$1 = root;

  var lexicon = {
    words: lexicon$2,
    compute: { root: root$1 },
    methods: {
      two: {
        transform: methods
      }
    },
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E


  // ??	Alt + 0225
  // ??	Alt + 0233
  // ??	Alt + 0237
  // ??	Alt + 024
  // ??	Alt + 0250
  // ??	Alt + 0252
  // ??	Alt + 0241
  // ??	Alt + 0191
  // ??	Alt + 0161
  // ?? ?? &#195;
  // ?? ?? &#213;

  let compact = {
    '?': '??',
    '"': '??????"??????',
    "'": '???????????????',
    '-': '??????',
    a: '??????????????????????????????????????????????????????????????????????????????????',
    b: '??????????????????????????????????????????????',
    c: '????????????????????????????????????????????????????????',
    d: '????????????????????',
    e: '??????????????????????????????????????????????????????????????????????????????',
    f: '??????????????????',
    g: '??????????????????????????????',
    h: '??????????????????????????????????????????????????',
    i: '????????????????????????????????????????????????????',
    j: '??????????????????',
    k: '??????????????????????????????????????????????',
    l: '????????????????????????????????????????',
    m: '??????????????',
    n: '??????????????????????????????????????????????????????????????????????????????',
    o: '??????????????????????????????????????????????????????????????????????????????????????????????????????????????',
    p: '??????????????????????',
    q: '????',
    r: '??????????????????????????????????????????',
    s: '??????????????????????????????',
    t: '????????????????????????????????????????',
    u: '??????????????????????????????????????????????????????????????????????????',
    v: '??????????',
    w: '????????????????????????????',
    x: '??????????????????????????',
    y: '??????????????????????????????????????????????????????????????????????????',
    z: '????????????????????????',
  };
  //decompress data into two hashes
  let unicode = {};
  Object.keys(compact).forEach(function (k) {
    compact[k].split('').forEach(function (s) {
      unicode[s] = k;
    });
  });
  var unicode$1 = unicode;

  // https://pt.wiktionary.org/wiki/Ap%C3%AAndice:Combina%C3%A7%C3%B5es_e_contra%C3%A7%C3%B5es_do_portugu%C3%AAs
  var contractions = [
    // preposittion-article
    { word: 'do', out: ['de', 'o'] },
    { word: 'da', out: ['de', 'a'] },
    { word: 'dos', out: ['de', 'os'] },
    { word: 'das', out: ['de', 'as'] },

    { word: 'no', out: ['em', 'o'] },
    { word: 'na', out: ['em', 'a'] },
    // { word: 'nos', out: ['em', 'os'] },
    { word: 'nas', out: ['em', 'as'] },

    { word: 'pelo', out: ['por', 'o'] },
    { word: 'pela', out: ['por', 'a'] },
    { word: 'pelos', out: ['por', 'os'] },
    { word: 'pelas', out: ['por', 'as'] },

    { word: 'ao', out: ['a', 'o'] },
    { word: '??', out: ['a', 'a'] },
    { word: 'aos', out: ['a', 'os'] },
    { word: '??s', out: ['a', 'as'] },

    { word: 'pro', out: ['para', 'o'] },
    { word: 'pr??', out: ['para', 'o'] },
    { word: 'pr??', out: ['para', 'a'] },
    { word: 'pros', out: ['para', 'os'] },
    { word: 'pr??s', out: ['para', 'os'] },
    { word: 'pr??s', out: ['para', 'as'] },

    { word: 'c??', out: ['com', 'o'] },
    { word: 'coa', out: ['com', 'a'] },
    { word: 'c??s', out: ['com', 'os'] },
    { word: 'coas', out: ['com', 'as'] },

    // 
    { word: 'dum', out: ['de', 'um'] },
    { word: 'duma', out: ['de', 'uma'] },
    { word: 'duns', out: ['de', 'uns'] },
    { word: 'dumas', out: ['de', 'umas'] },

    { word: 'num', out: ['em', 'um'] },
    { word: 'numa', out: ['em', 'uma'] },
    { word: 'nuns', out: ['em', 'uns'] },
    { word: 'numas', out: ['em', 'umas'] },

    { word: 'prum', out: ['para', 'um'] },
    { word: 'pruma', out: ['para', 'uma'] },
    { word: 'pruns', out: ['para', 'uns'] },
    { word: 'prumas', out: ['para', 'umas'] },

    { word: 'cum', out: ['com', 'um'] },
    { word: 'cuma', out: ['com', 'uma'] },
    { word: 'cuns', out: ['com', 'uns'] },
    { word: 'cumas', out: ['com', 'umas'] },

    { word: '??', out: ['a', 'a'] },
    { word: '??s', out: ['a', 'as'] },
    { word: 'ao', out: ['a', 'o'] },
    { word: 'aos', out: ['a', 'os'] },
    { word: 'coa', out: ['com', 'a'] },
    { word: 'coas', out: ['com', 'as'] },
    { word: 'co', out: ['com', 'o'] },
    { word: 'cos', out: ['com', 'os'] },
    { word: 'do', out: ['de', 'o'] },
    { word: 'da', out: ['de', 'a'] },
    { word: 'dos', out: ['de', 'os'] },
    { word: 'das', out: ['de', 'as'] },
    { word: 'no', out: ['em', 'o'] },
    { word: 'na', out: ['em', 'a'] },
    // { word: 'nos', out: ['em', 'os'] },
    { word: 'nas', out: ['em', 'as'] },
    { word: 'pro', out: ['para', 'o'] },
    { word: 'pra', out: ['para', 'a'] },
    { word: 'pros', out: ['para', 'os'] },
    { word: 'pras', out: ['para', 'as'] },
    { word: 'pelo', out: ['por', 'o'] },
    { word: 'pela', out: ['por', 'a'] },
    { word: 'pelos', out: ['por', 'os'] },
    { word: 'pelas', out: ['por', 'as'] },
    { word: 'cum', out: ['com', 'um'] },
    { word: 'cuns', out: ['com', 'uns'] },
    { word: 'cuma', out: ['com', 'uma'] },
    { word: 'cumas', out: ['com', 'umas'] },
    { word: 'dum', out: ['de', 'um'] },
    { word: 'duns', out: ['de', 'uns'] },
    { word: 'duma', out: ['de', 'uma'] },
    { word: 'dumas', out: ['de', 'umas'] },
    { word: 'num', out: ['em', 'um'] },
    { word: 'nuns', out: ['em', 'uns'] },
    { word: 'numa', out: ['em', 'uma'] },
    { word: 'numas', out: ['em', 'umas'] },
    { word: 'prum', out: ['para', 'um'] },
    { word: 'pruns', out: ['para', 'uns'] },
    { word: 'pruma', out: ['para', 'uma'] },
    { word: 'prumas', out: ['para', 'umas'] },
    { word: 'comigo', out: ['com', 'mim'] },
    { word: 'contigo', out: ['com', 'ti'] },
    { word: 'consigo', out: ['com', 'si'] },
    { word: 'conosco', out: ['com', 'n??s'] },
    { word: 'convosco', out: ['com', 'v??s'] },
    { word: 'dele', out: ['de', 'ele'] },
    { word: 'dela', out: ['de', 'ela'] },
    { word: 'deles', out: ['de', 'eles'] },
    { word: 'delas', out: ['de', 'elas'] },
    { word: 'nele', out: ['em', 'ele'] },
    { word: 'nela', out: ['em', 'ela'] },
    { word: 'neles', out: ['em', 'eles'] },
    { word: 'nelas', out: ['em', 'elas'] },
    { word: '??quele', out: ['a', 'aquele'] },
    { word: '??quela', out: ['a', 'aquela'] },
    { word: '??queles', out: ['a', 'aqueles'] },
    { word: '??quelas', out: ['a', 'aquelas'] },
    { word: '??quilo', out: ['a', 'aquilo'] },
    { word: 'deste', out: ['de', 'este'] },
    { word: 'desta', out: ['de', 'esta'] },
    { word: 'destes', out: ['de', 'estes'] },
    { word: 'destas', out: ['de', 'estas'] },
    { word: 'disto', out: ['de', 'isto'] },
    { word: 'desse', out: ['de', 'esse'] },
    { word: 'dessa', out: ['de', 'essa'] },
    { word: 'desses', out: ['de', 'esses'] },
    { word: 'dessas', out: ['de', 'essas'] },
    { word: 'disso', out: ['de', 'isso'] },
    { word: 'daquele', out: ['de', 'aquele'] },
    { word: 'daquela', out: ['de', 'aquela'] },
    { word: 'daqueles', out: ['de', 'aqueles'] },
    { word: 'daquelas', out: ['de', 'aquelas'] },
    { word: 'daquilo', out: ['de', 'aquilo'] },
    { word: 'neste', out: ['em', 'este'] },
    { word: 'nesta', out: ['em', 'esta'] },
    { word: 'nestes', out: ['em', 'estes'] },
    { word: 'nestas', out: ['em', 'estas'] },
    { word: 'nisto', out: ['em', 'isto'] },
    { word: 'nesse', out: ['em', 'esse'] },
    { word: 'nessa', out: ['em', 'essa'] },
    { word: 'nesses', out: ['em', 'esses'] },
    { word: 'nessas', out: ['em', 'essas'] },
    { word: 'nisso', out: ['em', 'isso'] },
    { word: 'naquele', out: ['em', 'aquele'] },
    { word: 'naquela', out: ['em', 'aquela'] },
    { word: 'naqueles', out: ['em', 'aqueles'] },
    { word: 'naquelas', out: ['em', 'aquelas'] },
    { word: 'naquilo', out: ['em', 'aquilo'] },
    { word: 'doutro', out: ['de', 'outro'] },
    { word: 'doutra', out: ['de', 'outra'] },
    { word: 'doutros', out: ['de', 'outros'] },
    { word: 'doutras', out: ['de', 'outras'] },
    { word: 'doutrem', out: ['de', 'outrem'] },
    { word: 'doutrora', out: ['de', 'outrora'] },
    { word: 'dalgum', out: ['de', 'algum'] },
    { word: 'dalguma', out: ['de', 'alguma'] },
    { word: 'dalguns', out: ['de', 'alguns'] },
    { word: 'dalgumas', out: ['de', 'algumas'] },
    { word: 'dalgu??m', out: ['de', 'algu??m'] },
    { word: 'dalgo', out: ['de', 'algo'] },
    { word: 'dalgures', out: ['de', 'algures'] },
    { word: 'dalhures', out: ['de', 'alhures'] },
    { word: 'noutro', out: ['em', 'outro'] },
    { word: 'noutra', out: ['em', 'outra'] },
    { word: 'noutros', out: ['em', 'outros'] },
    { word: 'noutras', out: ['em', 'outras'] },
    { word: 'noutrem', out: ['em', 'outrem'] },
    { word: 'nalgum', out: ['em', 'algum'] },
    { word: 'nalguma', out: ['em', 'alguma'] },
    { word: 'nalguns', out: ['em', 'alguns'] },
    { word: 'nalgumas', out: ['em', 'algumas'] },
    { word: 'nalgu??m', out: ['em', 'algu??m'] },
    { word: 'aonde', out: ['a', 'onde'] },
    { word: 'daqui', out: ['de', 'aqui'] },
    { word: 'da??', out: ['de', 'a??'] },
    { word: 'dali', out: ['de', 'ali'] },
    { word: 'daqu??m', out: ['de', 'aqu??m'] },
    { word: 'dal??m', out: ['de', 'al??m'] },
    { word: 'dentre', out: ['de', 'entre'] },
    { word: 'dantes', out: ['de', 'antes'] },
    { word: 'dacol??', out: ['de', 'acol??'] },
    { word: 'donde', out: ['de', 'onde'] },
    { word: 'pronde', out: ['para', 'onde'] },
    { word: 'pela??', out: ['por', 'a??'] },

    { word: 'estoutro', out: ['este', 'outro'] },
    { word: 'estoutra', out: ['esta', 'outra'] },
    { word: 'estoutros', out: ['estes', 'outros'] },
    { word: 'estoutras', out: ['estas', 'outras'] },
    { word: 'essoutro', out: ['esse', 'outro'] },
    { word: 'essoutra', out: ['essa', 'outra'] },
    { word: 'essoutros', out: ['esses', 'outros'] },
    { word: 'essoutras', out: ['essas', 'outras'] },
    { word: 'aqueloutro', out: ['aquele', 'outro'] },
    { word: 'aqueloutra', out: ['aquela', 'outra'] },
    { word: 'aqueloutros', out: ['aqueles', 'outros'] },
    { word: 'aqueloutras', out: ['aquelas', 'outras'] },

    { word: 'doravante', out: ['de', 'ora', 'avante'] },
    { word: 'destoutro', out: ['de', 'este', 'outro'] },
    { word: 'destoutra', out: ['de', 'esta', 'outra'] },
    { word: 'destoutros', out: ['de', 'estes', 'outros'] },
    { word: 'destoutras', out: ['de', 'estas', 'outras'] },
    { word: 'dessoutro', out: ['de', 'esse', 'outro'] },
    { word: 'dessoutra', out: ['de', 'essa', 'outra'] },
    { word: 'dessoutros', out: ['de', 'esses', 'outros'] },
    { word: 'dessoutras', out: ['de', 'essas', 'outras'] },
    { word: 'daqueloutro', out: ['de', 'aquele', 'outro'] },
    { word: 'daqueloutra', out: ['de', 'aquela', 'outra'] },
    { word: 'daqueloutros', out: ['de', 'aqueles', 'outros'] },
    { word: 'daqueloutras', out: ['de', 'aquelas', 'outras'] },
    { word: 'nestoutro', out: ['em', 'este', 'outro'] },
    { word: 'nestoutra', out: ['em', 'esta', 'outra'] },
    { word: 'nestoutros', out: ['em', 'estes', 'outros'] },
    { word: 'nestoutras', out: ['em', 'estas', 'outras'] },
    { word: 'nessoutro', out: ['em', 'esse', 'outro'] },
    { word: 'nessoutra', out: ['em', 'essa', 'outra'] },
    { word: 'nessoutros', out: ['em', 'esses', 'outros'] },
    { word: 'nessoutras', out: ['em', 'essas', 'outras'] },
    { word: 'naqueloutro', out: ['em', 'aquele', 'outro'] },
    { word: 'naqueloutra', out: ['em', 'aquela', 'outra'] },
    { word: 'naqueloutros', out: ['em', 'aqueles', 'outros'] },
    { word: 'naqueloutras', out: ['em', 'aquelas', 'outras'] },
  ];

  var abbreviations = {
    seg: true,
    qua: true,
    qui: true,
    sex: true,
    ter: true,
    dom: true,
    jan: true,
    fev: true,
    abr: true,
    mai: true,
    jun: true,
    jul: true,
    ago: true,
    out: true,
    nov: true,
    mar: true,
    set: true,
    dez: true,
  };

  var tokenizer = {
    mutate: (world) => {
      world.model.one.unicode = unicode$1;

      world.model.one.contractions = contractions;

      // pt abbreviations for sentence parser
      Object.assign(world.model.one.abbreviations, abbreviations);

      // 'que' -> 'quebec'
      delete world.model.one.lexicon.que;
    }
  };

  const hasApostrophe = /['???????????????`??]/;

  // normal regexes
  const doRegs = function (str, regs) {
    for (let i = 0; i < regs.length; i += 1) {
      if (regs[i][0].test(str) === true) {
        return regs[i]
      }
    }
    return null
  };

  const checkRegex = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    let { regexText, regexNormal, regexNumbers } = world.model.two;
    let normal = term.machine || term.normal;
    let text = term.text;
    // keep dangling apostrophe?
    if (hasApostrophe.test(term.post) && !hasApostrophe.test(term.pre)) {
      text += term.post.trim();
    }
    let arr = doRegs(text, regexText) || doRegs(normal, regexNormal);
    // hide a bunch of number regexes behind this one
    if (!arr && /[0-9]/.test(normal)) {
      arr = doRegs(normal, regexNumbers);
    }
    if (arr) {
      setTag([term], arr[1], world, false, `1-regex- '${arr[2] || arr[0]}'`);
      term.confidence = 0.6;
      return true
    }
    return null
  };
  var checkRegex$1 = checkRegex;

  const isTitleCase = function (str) {
    return /^[A-Z??????][a-z'\u00C0-\u00FF]/.test(str) || /^[A-Z??????]$/.test(str)
  };

  // add a noun to any non-0 index titlecased word, with no existing tag
  const titleCaseNoun = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    // don't over-write any tags
    if (term.tags.size > 0) {
      return
    }
    // skip first-word, for now
    if (i === 0) {
      return
    }
    if (isTitleCase(term.text)) {
      setTag([term], 'Noun', world, false, `1-titlecase`);
    }
  };
  var titleCase = titleCaseNoun;

  const min = 1400;
  const max = 2100;

  const dateWords = new Set(['pendant', 'dans', 'avant', 'apres', 'pour', 'en']);

  const seemsGood = function (term) {
    if (!term) {
      return false
    }
    if (dateWords.has(term.normal)) {
      return true
    }
    if (term.tags.has('Date') || term.tags.has('Month') || term.tags.has('WeekDay')) {
      return true
    }
    return false
  };

  const seemsOkay = function (term) {
    if (!term) {
      return false
    }
    if (term.tags.has('Ordinal')) {
      return true
    }
    return false
  };

  // recognize '1993' as a year
  const tagYear = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('NumericValue') && term.tags.has('Cardinal') && term.normal.length === 4) {
      let num = Number(term.normal);
      // number between 1400 and 2100
      if (num && !isNaN(num)) {
        if (num > min && num < max) {
          if (seemsGood(terms[i - 1]) || seemsGood(terms[i + 1])) {
            setTag([term], 'Year', world, false, '1-tagYear');
            return true
          }
          // or is it really-close to a year?
          if (num > 1950 && num < 2025) {
            if (seemsOkay(terms[i - 1]) || seemsOkay(terms[i + 1])) {
              setTag([term], 'Year', world, false, '1-tagYear-close');
              return true
            }
          }
        }
      }
    }
    return null
  };
  var checkYear = tagYear;

  const oneLetterAcronym = /^[A-Z??????]('s|,)?$/;
  const isUpperCase = /^[A-Z-??????]+$/;
  const periodAcronym = /([A-Z??????]\.)+[A-Z??????]?,?$/;
  const noPeriodAcronym = /[A-Z??????]{2,}('s|,)?$/;
  const lowerCaseAcronym = /([a-z??????]\.)+[a-z??????]\.?$/;



  const oneLetterWord = {
    I: true,
    A: true,
    O: true,
  };
  // just uppercase acronyms, no periods - 'UNOCHA'
  const isNoPeriodAcronym = function (term, model) {
    let str = term.text;
    // ensure it's all upper-case
    if (isUpperCase.test(str) === false) {
      return false
    }
    // long capitalized words are not usually either
    if (str.length > 5) {
      return false
    }
    // 'I' is not a acronym
    if (oneLetterWord.hasOwnProperty(str)) {
      return false
    }
    // known-words, like 'PIZZA' is not an acronym.
    if (model.one.lexicon.hasOwnProperty(term.normal)) {
      return false
    }
    //like N.D.A
    if (periodAcronym.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym.test(str) === true) {
      return true
    }
    return false
  };

  const isAcronym = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    //these are not acronyms
    if (term.tags.has('RomanNumeral') || term.tags.has('Acronym')) {
      return null
    }
    //non-period ones are harder
    if (isNoPeriodAcronym(term, world.model)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-no-period-acronym');
      return true
    }
    // one-letter acronyms
    // if (!oneLetterWord.hasOwnProperty(term.text) && oneLetterAcronym.test(term.text)) {
    //   term.tags.clear()
    //   setTag([term], ['Acronym', 'Noun'], world, false, '3-one-letter-acronym')
    //   return true
    // }
    //if it's a very-short organization?
    if (term.tags.has('Organization') && term.text.length <= 3) {
      setTag([term], 'Acronym', world, false, '3-org-acronym');
      return true
    }
    // upper-case org, like UNESCO
    if (term.tags.has('Organization') && isUpperCase.test(term.text) && term.text.length <= 6) {
      setTag([term], 'Acronym', world, false, '3-titlecase-acronym');
      return true
    }
    return null
  };
  var acronym = isAcronym;

  // const isTitleCase = function (str) {
  //   return /^[A-Z??????][a-z'\u00C0-\u00FF]/.test(str) || /^[A-Z??????]$/.test(str)
  // }

  // const hasNoVerb = function (terms) {
  //   return !terms.find(t => t.tags.has('#Verb'))
  // }

  const fallback = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    if (term.tags.size === 0) {
      setTag([term], 'Noun', world, false, '2-fallback');
    }
  };
  var fallback$1 = fallback;

  const verbPhrase = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    // handle dropped-s in  'lavamo-nos' (lavamos + nos)
    if (terms[i + 1] && terms[i + 1].normal === 'nos') {
      let t = terms[i];
      if (/mo$/.test(t.normal)) {
        setTag([t], 'FirstPersonPlural', world, false, '2-dropped-s');
      }
    }
  };
  var verbPhrase$1 = verbPhrase;

  //sweep-through all suffixes
  const suffixLoop = function (str = '', suffixes = []) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 1; i -= 1) {
      let suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        let tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  // decide tag from the ending of the word
  const suffixCheck = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let suffixes = world.model.two.suffixPatterns;
    let term = terms[i];
    if (term.tags.size === 0) {
      let tag = suffixLoop(term.normal, suffixes);
      if (tag !== null) {
        setTag([term], tag, world, false, '2-suffix');
        term.confidence = 0.7;
        return true
      }
      // try implicit form of word, too
      if (term.implicit) {
        tag = suffixLoop(term.implicit, suffixes);
        if (tag !== null) {
          setTag([term], tag, world, false, '2-implicit-suffix');
          term.confidence = 0.7;
          return true
        }
      }
    }
    return null
  };
  var suffixCheck$1 = suffixCheck;

  // 1st pass
  // // 3rd
  // import guessNounGender from './3rd-pass/noun-gender.js'
  // import guessPlural from './3rd-pass/noun-plural.js'
  // import adjPlural from './3rd-pass/adj-plural.js'
  // import adjGender from './3rd-pass/adj-gender.js'
  // import verbForm from './3rd-pass/verb-form.js'


  // these methods don't care about word-neighbours
  const firstPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      //  is it titlecased?
      let found = titleCase(terms, i, world);
      // try look-like rules
      found = found || checkRegex$1(terms, i, world);
      // turn '1993' into a year
      checkYear(terms, i, world);
    }
  };
  const secondPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      let found = acronym(terms, i, world);
      found = found || suffixCheck$1(terms, i, world);
      found = found || verbPhrase$1(terms, i, world);
      // found = found || neighbours(terms, i, world)
      found = found || fallback$1(terms, i, world);
    }
  };

  // const thirdPass = function (terms, world) {
  //   for (let i = 0; i < terms.length; i += 1) {
  //     guessNounGender(terms, i, world)
  //     guessPlural(terms, i, world)
  //     adjPlural(terms, i, world)
  //     adjGender(terms, i, world)
  //     verbForm(terms, i, world)
  //   }
  // }


  const tagger = function (view) {
    let world = view.world;
    view.docs.forEach(terms => {
      firstPass(terms, world);
      secondPass(terms, world);
      // thirdPass(terms, world)
    });
    return view
  };
  var preTagger$1 = tagger;

  var regexNormal = [
    //web tags
    [/^[\w.]+@[\w.]+\.[a-z]{2,3}$/, 'Email'],
    [/^(https?:\/\/|www\.)+\w+\.[a-z]{2,3}/, 'Url', 'http..'],
    [/^[a-z0-9./].+\.(com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)/, 'Url', '.com'],

    // timezones
    [/^[PMCE]ST$/, 'Timezone', 'EST'],

    //names
    [/^ma?c'.*/, 'LastName', "mc'neil"],
    [/^o'[drlkn].*/, 'LastName', "o'connor"],
    [/^ma?cd[aeiou]/, 'LastName', 'mcdonald'],

    //slang things
    [/^(lol)+[sz]$/, 'Expression', 'lol'],
    [/^wo{2,}a*h?$/, 'Expression', 'wooah'],
    [/^(hee?){2,}h?$/, 'Expression', 'hehe'],
    [/^(un|de|re)\\-[a-z\u00C0-\u00FF]{2}/, 'Verb', 'un-vite'],

    // m/h
    [/^(m|k|cm|km)\/(s|h|hr)$/, 'Unit', '5 k/m'],
    // ??g/g
    [/^(ug|ng|mg)\/(l|m3|ft3)$/, 'Unit', 'ug/L'],
  ];

  var regexNumbers = [

    [/^@1?[0-9](am|pm)$/i, 'Time', '3pm'],
    [/^@1?[0-9]:[0-9]{2}(am|pm)?$/i, 'Time', '3:30pm'],
    [/^'[0-9]{2}$/, 'Year'],
    // times
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])$/, 'Time', '3:12:31'],
    [/^[012]?[0-9](:[0-5][0-9])?(:[0-5][0-9])? ?(am|pm)$/i, 'Time', '1:12pm'],
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])? ?(am|pm)?$/i, 'Time', '1:12:31pm'], //can remove?

    // iso-dates
    [/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/i, 'Date', 'iso-date'],
    [/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,4}$/, 'Date', 'iso-dash'],
    [/^[0-9]{1,4}\/[0-9]{1,2}\/[0-9]{1,4}$/, 'Date', 'iso-slash'],
    [/^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,4}$/, 'Date', 'iso-dot'],
    [/^[0-9]{1,4}-[a-z]{2,9}-[0-9]{1,4}$/i, 'Date', '12-dec-2019'],

    // timezones
    [/^utc ?[+-]?[0-9]+$/, 'Timezone', 'utc-9'],
    [/^(gmt|utc)[+-][0-9]{1,2}$/i, 'Timezone', 'gmt-3'],

    //phone numbers
    [/^[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '421-0029'],
    [/^(\+?[0-9][ -])?[0-9]{3}[ -]?[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '1-800-'],


    //money
    //like $5.30
    [
      /^[-+]?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6][-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?([kmb]|bn)?\+?$/,
      ['Money', 'Value'],
      '$5.30',
    ],
    //like 5.30$
    [
      /^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]\+?$/,
      ['Money', 'Value'],
      '5.30??',
    ],
    //like
    [/^[-+]?[$??]?[0-9]([0-9,.])+(usd|eur|jpy|gbp|cad|aud|chf|cny|hkd|nzd|kr|rub)$/i, ['Money', 'Value'], '$400usd'],

    //numbers
    // 50 | -50 | 3.23  | 5,999.0  | 10+
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\+?$/, ['Cardinal', 'NumericValue'], '5,999'],
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th|??)$/, ['Ordinal', 'NumericValue'], '53rd'],
    // .73th
    [/^\.[0-9]+\+?$/, ['Cardinal', 'NumericValue'], '.73th'],
    //percent
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?%\+?$/, ['Percent', 'Cardinal', 'NumericValue'], '-4%'],
    [/^\.[0-9]+%$/, ['Percent', 'Cardinal', 'NumericValue'], '.3%'],
    //fraction
    [/^[0-9]{1,4}\/[0-9]{1,4}(st|nd|rd|th)?s?$/, ['Fraction', 'NumericValue'], '2/3rds'],
    //range
    [/^[0-9.]{1,3}[a-z]{0,2}[-??????][0-9]{1,3}[a-z]{0,2}$/, ['Value', 'NumberRange'], '3-4'],
    //time-range
    [/^[0-9]{1,2}(:[0-9][0-9])?(am|pm)? ?[-??????] ?[0-9]{1,2}(:[0-9][0-9])?(am|pm)$/, ['Time', 'NumberRange'], '3-4pm'],
    //with unit
    [/^[0-9.]+([a-z]{1,4})$/, 'Value', '9km'],
  ];

  var regexText = [
    // #coolguy
    [/^#[a-z0-9_\u00C0-\u00FF]{2,}$/i, 'HashTag'],

    // @spencermountain
    [/^@\w{2,}$/, 'AtMention'],

    // period-ones acronyms - f.b.i.
    [/^([A-Z??????]\.){2}[A-Z??????]?/i, ['Acronym', 'Noun'], 'F.B.I'], //ascii-only

    // ending-apostrophes
    [/.{3}[lkmnp]in['???????????????`??]$/, 'Gerund', "chillin'"],
    [/.{4}s['???????????????`??]$/, 'Possessive', "flanders'"],
  ];

  const rb = 'Adverb';
  const nn = 'Noun';
  const vb = 'Verb';
  const jj = 'Adjective';
  const cond = 'Conditional';
  const fut = 'FutureTense';
  // const inf = 'Infinitive'
  const g = 'Gerund';
  const ref = 'Reflexive';
  const first = 'FirstPerson';

  var suffixPatterns = [
    null,
    {
      // one-letter suffixes
      '??': vb,
    },
    {
      // two-letter suffixes
      al: jj,
      ??o: jj,
      // no: jj,
      // do: vb,
      // ar: vb,
      an: vb,
      'i??': vb,
      en: vb,
      ir: vb,
      er: vb,
      't??': vb,
    },
    {
      // three-letter suffixes
      ico: jj,
      // ica: jj,
      ble: jj,
      nal: jj,
      ial: jj,
      oso: jj,
      iso: jj,
      ito: jj,
      ita: jj,
      izo: jj,
      cto: jj,
      ana: jj,
      eos: jj,
      ais: jj,
      // ado: vb,
      ndo: first,
      ada: vb,
      ron: vb,
      // ido: vb,
      aba: vb,
      tar: vb,
      gar: vb,
      nar: vb,
      '??an': vb,
      rar: vb,
      r??a: cond,
      ar??: fut,
      ir??: fut,
      er??: fut,
      r??s: fut,
      ar??: fut,
      ado: vb,
      pto: jj,
      osa: jj,
      tos: jj,

      // ida: vb,
    },
    {
      // four-letter suffixes
      itas: jj,
      itos: jj,
      icos: jj,
      icas: jj,
      tico: jj,
      fica: jj,
      gica: jj,
      mica: jj,
      nica: jj,
      lica: jj,
      tica: jj,
      able: jj,
      tivo: jj,
      sivo: jj,
      esco: jj,
      iaco: jj,
      ??aco: jj,
      ??ceo: jj,
      ??neo: jj,
      icio: jj,
      culo: jj,
      aria: jj,
      bles: jj,
      tiva: jj,
      ante: jj,
      ente: jj,
      ??nea: jj,
      siva: jj,
      ular: jj,
      osas: jj,
      ales: jj,
      iles: jj,
      anos: jj,
      osos: jj,
      'ci??n': nn,
      idad: nn,
      ento: nn,
      ncia: nn,
      'si??n': nn,
      ando: g,
      endo: g,
      // ados: vb,
      aron: vb,
      adas: vb,
      tado: first,
      r??as: cond,
      amos: cond,
      ??ais: cond,
      r??an: cond,
      r??is: fut,
      ar??n: fut,
      // refexive verbs
      arse: ref,
      arte: ref,
      arme: ref,
      irse: ref,
      irte: ref,
      erse: ref,
      dose: ref,
      ario: jj,
      orio: jj,
      iano: jj,
      dero: jj,
      fero: jj,
      jero: jj,
      lero: jj,
      nero: jj,
      tero: jj,
      ares: jj,
      ores: jj,
      rios: jj,
      ivos: jj,
      ??ias: jj,
    },
    { // five-letter suffixes
      aci??n: nn,
      ??rios: nn,
      arios: nn,
      mente: rb,
      ??simo: jj,
      icano: jj,
      ntino: jj,
      tivas: jj,
      and??s: jj,
      adora: jj,
      antes: jj,
      iendo: g,
      yendo: g,
      ieron: vb,
      remos: fut,
      iente: jj,
      entes: jj,
    },
    {
      // six-letter suffixes
      ??stica: jj,
      ciones: nn,
      adores: nn,
    },
    {
      // seven-letter suffixes
      aciones: nn
    }
  ];

  var model = {
    regexNormal,
    regexNumbers,
    regexText,
    suffixPatterns
  };

  // import methods from './methods/index.js'

  var preTagger = {
    compute: {
      preTagger: preTagger$1
    },
    model: {
      two: model
    },
    // methods,
    hooks: ['preTagger']
  };

  const postTagger$1 = function (doc) {
    // oitenta e tr??s
    doc.match('#Value [e] #Cardinal', 0).tag('Cardinal', 'val-e-val');
    doc.match('#Value [e] #Value', 0).tag('Value', 'val-e-val');

    doc.match('#Value e #Value e #Value').tag('Value', 'val-e-val');
    // vinte e uma
    doc.match('#Value e? (uma|um)').tag('Cardinal', 'val-e-uma');
    // uma milh??o
    doc.match('(uma|um) #Value').tag('Value', 'uma-milh??o');
    // menos noventa
    doc.match('menos #Value').tag('Value', 'menos-noventa');
    // cantar ?? bom
    doc.match('[#Infinitive] #Copula', 0).tag('Noun', 'gerund-noun');
    // a o => to the
    doc.match('[a] #Determiner', 0).tag('Preposition', 'to-the');
    // o jantar
    doc.match('o [#Infinitive]', 0).tag('Noun', 'o-verb');
    // Que chato!
    doc.match('^que #Adjective').tag('Expression', 'how-nice');
    // according to
    doc.match('^[segundo] #Noun').tag('Preposition', 'segundo-salles');

    // ===auxiliary verbs==
    // est?? a comer
    doc.match('[{estar} a?] #Verb', 0).tag('Auxiliary', 'est??-a-verb');
    // ele vai cantar
    doc.match('[{ir}] #Verb', 0).tag('Auxiliary', 'ir-verb');
    // ele havia falado
    doc.match('[{haver}] #Verb', 0).tag('Auxiliary', 'haver-verb');
    // Ele quer mostrar
    doc.match('[{querer}] #Verb', 0).tag('Auxiliary', 'querer-verb');
    // future tense
    doc.match('[{ser}] #Verb', 0).tag('Auxiliary', 'ser-verb');
    // ==modals==
    doc.match('[{poder}] #Verb', 0).tag('Modal', 'could-verb');
    doc.match('{poder} ter #Noun').tag('#Modal #Auxiliary #Verb', 'could-have-noun');
    doc.match('[{poder} ter] #Verb', 0).tag('#Modal #Auxiliary', 'could-have-verb');
    // must 
    doc.match('[{dever}] #Verb', 0).tag('Modal', 'must-verb');

    // ==reflexive verbs==
    doc.match('#Verb [(me|se|te|nos)]', 0).tag('Reflexive', 'verb-se');
    doc.match('[(me|se|te|nos)] #Verb', 0).tag('Reflexive', 'se-verb');

    // ==numbers==
    doc.match('#Value [(primeiro|primeira|primeiros|primeiras)]', 0).tag('Ordinal', 'val-primeiro');
    // ==misc==
    // four vs room
    doc.match('#Determiner [quarto]', 0).tag('Noun', 'quatro-room');
  };
  var postTagger$2 = postTagger$1;

  var postTagger = {
    compute: {
      postTagger: postTagger$2
    },
    hooks: ['postTagger']
  };

  const entity = ['Person', 'Place', 'Organization'];

  var nouns = {
    Noun: {
      not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
    },
    Singular: {
      is: 'Noun',
      not: ['Plural'],
    },
    ProperNoun: {
      is: 'Noun',
    },
    Person: {
      is: 'Singular',
      also: ['ProperNoun'],
      not: ['Place', 'Organization', 'Date'],
    },
    FirstName: {
      is: 'Person',
    },
    MaleName: {
      is: 'FirstName',
      not: ['FemaleName', 'LastName'],
    },
    FemaleName: {
      is: 'FirstName',
      not: ['MaleName', 'LastName'],
    },
    LastName: {
      is: 'Person',
      not: ['FirstName'],
    },
    Honorific: {
      is: 'Noun',
      not: ['FirstName', 'LastName', 'Value'],
    },
    Place: {
      is: 'Singular',
      not: ['Person', 'Organization'],
    },
    Country: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['City'],
    },
    City: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['Country'],
    },
    Region: {
      is: 'Place',
      also: ['ProperNoun'],
    },
    Address: {
      // is: 'Place',
    },
    Organization: {
      is: 'ProperNoun',
      not: ['Person', 'Place'],
    },
    SportsTeam: {
      is: 'Organization',
    },
    School: {
      is: 'Organization',
    },
    Company: {
      is: 'Organization',
    },
    Plural: {
      is: 'Noun',
      not: ['Singular'],
    },
    Uncountable: {
      is: 'Noun',
    },
    Pronoun: {
      is: 'Noun',
      not: entity,
    },
    Actor: {
      is: 'Noun',
      not: entity,
    },
    Activity: {
      is: 'Noun',
      not: ['Person', 'Place'],
    },
    Unit: {
      is: 'Noun',
      not: entity,
    },
    Demonym: {
      is: 'Noun',
      also: ['ProperNoun'],
      not: entity,
    },
    Possessive: {
      is: 'Noun',
    },

    FemaleNoun: {
      is: 'Noun',
      not: ['MaleNoun']
    },
    MaleNoun: {
      is: 'Noun',
      not: ['FemaleNoun']
    },

  };

  var verbs$1 = {
    Verb: {
      not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
    },
    PresentTense: {
      is: 'Verb',
      not: ['PastTense'],
    },
    Infinitive: {
      is: 'PresentTense',
      not: ['Gerund'],
    },
    Gerund: {
      is: 'PresentTense',
      not: ['Copula', 'FutureTense'],
    },
    PastTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'FutureTense'],
    },
    FutureTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'PastTense'],
    },
    Copula: {
      is: 'Verb',
    },
    Negative: {
      is: 'Verb',
    },
    Modal: {
      is: 'Auxiliary',
      not: ['Infinitive', 'PresentTense', 'PastTense', 'FutureTense'],
    },
    PerfectTense: {
      is: 'Verb',
      not: ['Gerund'],
    },
    Pluperfect: {
      is: 'Verb',
    },
    Participle: {
      is: 'PastTense',
    },
    PhrasalVerb: {
      is: 'Verb',
    },
    Particle: {
      is: 'PhrasalVerb',
      not: ['PastTense', 'PresentTense', 'Copula', 'Gerund'],
    },
    Auxiliary: {
      is: 'Verb',
      not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction', 'Copula'],
    },
    Conditional: {
      is: 'Verb',
      not: ['Infinitive', 'Imperative'],
    },
    Reflexive: {
      is: 'Verb',
    },
    // sometimes 'pret??rito'
    Perfecto: {
      is: 'Verb',
    },
    // moods
    Imperative: {
      is: 'Verb',
      Subjunctive: ['Subjunctive']
    },
    Subjunctive: {
      is: 'Verb',
      not: ['Imperative']
    },
    Imperfect: {
      is: 'PastTense',
      not: ['Imperative']
    },


    // 
    FirstPerson: {
      is: 'Verb',
      not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPerson: {
      is: 'Verb',
      not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPerson: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    FirstPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
    },
  };

  var values = {
    Value: {
      not: ['Verb', 'Adjective', 'Adverb'],
    },
    Ordinal: {
      is: 'Value',
      not: ['Cardinal'],
    },
    Cardinal: {
      is: 'Value',
      not: ['Ordinal'],
    },
    Fraction: {
      is: 'Value',
      not: ['Noun'],
    },
    Multiple: {
      is: 'Value',
    },
    RomanNumeral: {
      is: 'Cardinal',
      not: ['TextValue'],
    },
    TextValue: {
      is: 'Value',
      not: ['NumericValue'],
    },
    NumericValue: {
      is: 'Value',
      not: ['TextValue'],
    },
    Money: {
      is: 'Cardinal',
    },
    Percent: {
      is: 'Value',
    },
  };

  var dates = {
    Date: {
      not: ['Verb', 'Adverb', 'Adjective'],
    },
    Month: {
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      is: 'Noun',
      also: ['Date'],
    },
    Year: {
      is: 'Date',
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      is: 'Date',
      not: 'Fraction',
    },
    // 'easter'
    Holiday: {
      is: 'Date',
      also: ['Noun'],
    },
    // 'summer'
    Season: {
      is: 'Date',
    },
    Timezone: {
      is: 'Noun',
      also: ['Date'],
      not: ['ProperNoun'],
    },
    Time: {
      is: 'Date',
      not: ['AtMention'],
    },
    // 'months'
    Duration: {
      is: 'Noun',
      also: ['Date'],
    },
  };

  const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'];

  var misc = {
    Adjective: {
      not: ['Noun', 'Verb', 'Adverb', 'Value'],
    },
    FemaleAdjective: {
      is: 'Adjective',
      not: ['MaleAdjective'],
    },
    MaleAdjective: {
      is: 'Adjective',
      not: ['FemaleAdjective'],
    },
    PluralAdjective: {
      is: 'Adjective',
      not: ['SingularAdjective'],
    },
    SingularAdjective: {
      is: 'Adjective',
      not: ['PluralAdjective'],
    },
    Comparable: {
      is: 'Adjective',
    },
    Comparative: {
      is: 'Adjective',
    },
    Superlative: {
      is: 'Adjective',
      not: ['Comparative'],
    },
    NumberRange: {},
    Adverb: {
      not: ['Noun', 'Verb', 'Adjective', 'Value'],
    },

    Determiner: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction', 'Preposition'], //allow 'a' to be a Determiner/Value
    },
    Conjunction: {
      not: anything,
    },
    Preposition: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
    },
    QuestionWord: {
      not: ['Determiner'],
    },
    Currency: {
      is: 'Noun',
    },
    Expression: {
      not: ['Noun', 'Adjective', 'Verb', 'Adverb', 'Expression', 'Conjunction'],
    },
    Abbreviation: {},
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {},
    AtMention: {
      is: 'Noun',
      not: ['HashTag', 'Email'],
    },
    Emoji: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Emoticon: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Email: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Acronym: {
      not: ['Plural', 'RomanNumeral'],
    },
    Condition: {
      not: ['Verb', 'Adjective', 'Noun', 'Value'],
    },
  };

  let tags = Object.assign({}, nouns, verbs$1, values, dates, misc);

  var tagset = {
    tags
  };

  const findNumbers = function (view) {
    let m = view.match('#Value+');
    //5-8
    m = m.splitAfter('#NumberRange');
    // june 5th 1999
    m = m.splitBefore('#Year');
    return m
  };
  var find = findNumbers;

  var data = {
    ones: [
      [1, 'um', 'primeiro'],    // [1, 'uma'],
      [2, 'dois', 'segundo'],    // [2, 'duos'],
      [3, 'tr??s', 'terceiro'],
      [4, 'quatro', 'quarto'],
      [5, 'cinco', 'quinto'],
      [6, 'seis', 'sexto'],
      [7, 'sete', 's??timo'],
      [8, 'oito', 'oitavo'],
      [9, 'nove', 'nono'],
      [10, 'dez', 'd??cimo'],
      [11, 'onze', 'd??cimo primeiro'],
      [12, 'doze', 'd??cimo segundo'],
      [13, 'treze', 'd??cimo terceiro'],
      [14, 'catorze', 'd??cimo quarto'],
      [15, 'quinze', 'd??cimo quinto'],
      [16, 'dezesseis', 'd??cimo sexto'],//    [16, 'dezasseis'],
      [17, 'dezessete', 'd??cimo s??timo'],//    [17, 'dezassete'],
      [18, 'dezoito', 'd??cimo oitavo'],
      [19, 'dezenove', 'd??cimo nono'],//    [19, 'dezanove'],
    ],
    tens: [
      [20, 'vinte', 'vig??simo'],
      [30, 'trinta', 'trig??simo'],
      [40, 'quarenta', 'quadrag??simo'],
      [50, 'cinquenta', 'quinquag??simo'],
      [50, 'cinquenta', 'q??ingent??simo'],
      [60, 'sessenta', 'sexag??simo'],
      [70, 'setenta', 'septuag??simo'],
      [80, 'oitenta', 'octog??simo'],
      [90, 'noventa', 'nonag??simo'],
    ],
    hundreds: [
      [100, 'cem', 'cent??simo'],
      [200, 'duzentos', 'ducent??simo'],
      [300, 'trezentos', 'tricent??simo'],
      [300, 'trezentos', 'trecent??simo'],
      [400, 'quatrocentos', 'quadringent??simo'],
      [400, 'quatrocentos', 'quatrocentos'],
      [500, 'quinhentos', 'quincent??simo'],
      [500, 'quinhentos', ''],
      [600, 'seiscentos', 'sexcent??simo'],
      [600, 'seiscentos', ''],
      [700, 'setecentos', 'setingent??simo'],
      [700, 'setecentos', ''],
      [800, 'oitocentos', 'octingent??simo'],
      [800, 'oitocentos', ''],
      [900, 'novecentos', 'nongent??simo'],
    ],
    multiples: [
      [1000, 'mil', 'mil??simo'],
      [1000000, 'milh??o', 'milion??simo'],
      [1000000000, 'bilh??o', 'bilion??simo'],
    ]
  };

  let toNumber = {};
  let toCardinal = {};
  let multiples$1 = {
    'cem': 100,
    'cento': 100,
    'cent??simo': 100,
    'mil': 1000,
    'mil??simo': 1000,
    'milh??o': 1000000,
    'milh??es': 1000000,
    'milion??simo': 1000000,
    'bilh??o': 1000000000,
    'bilh??es': 1000000000,
    'bilion??simo': 1000000000,
  };

  data.ones.concat(data.tens, data.hundreds, data.multiples).forEach(a => {
    let [n, card, ord] = a;
    toNumber[card] = n; //cardinal
    if (/os$/.test(card)) {
      let f = card.replace(/os$/, 'as');
      toNumber[f] = n; //female
    }
    if (ord) {
      toNumber[ord] = n;//ord
    }
  });

  // extras
  Object.assign(toNumber, {
    zero: 0,
    uma: 1,
    duas: 2,
    dezasseis: 16,
    dezassete: 17,
    dezanove: 19,
    cinq??enta: 50,
    q??inquag??simo: 50,
    meia: 6,
  });

  const normalize = str => {
    // fem to masc
    str = str.replace(/as?$/, 'o');
    // plural to sing
    str = str.replace(/os$/, 'o');
    return str
  };

  const fromText = function (terms) {
    let sum = 0;
    let carry = 0;
    let minus = false;

    let tokens = terms.map(o => o.normal || o.text).filter(str => str);
    for (let i = 0; i < tokens.length; i += 1) {
      let w = tokens[i] || '';
      // minus eight
      if (w === 'menos') {
        minus = true;
        continue
      }
      if (w === 'e') {
        continue
      }
      // 'huitieme'
      if (toCardinal.hasOwnProperty(w)) {
        w = toCardinal[w];
      }
      // 'cent'
      if (multiples$1.hasOwnProperty(w)) {
        let mult = multiples$1[w] || 1;
        if (carry === 0) {
          carry = 1;
        }
        // console.log('carry', carry, 'mult', mult, 'sum', sum)
        sum += mult * carry;
        carry = 0;
        continue
      }
      // 'tres'
      if (toNumber.hasOwnProperty(w)) {
        carry += toNumber[w];
      } else {
        let str = normalize(w);
        if (toNumber.hasOwnProperty(str)) {
          carry += toNumber[str];
        } else {
          console.log('missing', w);
        }
        // console.log(terms.map(t => t.text))
      }
    }
    // include any remaining
    if (carry !== 0) {
      sum += carry;
    }
    if (minus === true) {
      sum *= -1;
    }
    return sum
  };
  var fromText$1 = fromText;

  const fromNumber = function (m) {
    let str = m.text('normal').toLowerCase();
    str = str.replace(/(e|er)$/, '');
    let hasComma = false;
    if (/,/.test(str)) {
      hasComma = true;
      str = str.replace(/,/g, '');
    }
    // get prefix/suffix
    let arr = str.split(/([0-9.,]*)/);
    let [prefix, num] = arr;
    let suffix = arr.slice(2).join('');
    if (num !== '' && m.length < 2) {
      num = Number(num || str);
      //ensure that num is an actual number
      if (typeof num !== 'number') {
        num = null;
      }
      // strip an ordinal off the suffix
      if (suffix === 'e' || suffix === 'er') {
        suffix = '';
      }
      if (prefix === '-') {
        prefix = '';
        num *= -1;
      }
    }
    return {
      hasComma,
      prefix,
      num,
      suffix,
    }
  };

  const parseNumber = function (m) {
    let terms = m.docs[0];
    let num = null;
    let prefix = '';
    let suffix = '';
    let hasComma = false;
    let isText = m.has('#TextValue');
    if (isText) {
      num = fromText$1(terms);
    } else {
      let res = fromNumber(m);
      prefix = res.prefix;
      suffix = res.suffix;
      num = res.num;
      hasComma = res.hasComma;
    }
    return {
      hasComma,
      prefix,
      num,
      suffix,
      isText,
      isOrdinal: m.has('#Ordinal'),
      isFraction: m.has('#Fraction'),
      isMoney: m.has('#Money'),
    }
  };
  var parse = parseNumber;

  let ones = data.ones.reverse();
  let tens = data.tens.reverse();
  let hundreds = data.hundreds.reverse();

  let multiples = [
    [1000000000, 'bilh??o', 'bilh??es'],
    [1000000, 'milh??o', 'milh??es'],
    [1000, 'mil', 'mil'],
    // [100, 'cento'],
    [1, 'um', 'um'],
  ];

  //turn number into an array of magnitudes, like [[5, million], [2, hundred]]
  const getMagnitudes = function (num) {
    let working = num;
    let have = [];
    multiples.forEach(a => {
      if (num >= a[0]) {
        let howmany = Math.floor(working / a[0]);
        working -= howmany * a[0];
        if (howmany) {
          let str = a[1];
          if (howmany > 1) {
            str = a[2];//use plural version
          }
          have.push({
            unit: str,
            num: howmany,
          });
        }
      }
    });
    return have
  };

  // when to put 'and' - these seem very complicated
  const andRules = function (words) {
    // do 'mil e duzentos' but 'mil duzentos e quinze'
    let index = words.findIndex((w, i) => w === 'mil' && words[i + 1] === 'e');
    if (index !== -1) {
      // we have another 'e' after..
      let hasAfter = words.slice(index + 2).find(w => w === 'e');
      if (hasAfter) {
        // remove the 'e'
        words.splice(index + 1, 1);
      }
    }
    return words
  };

  const threeDigit = function (num) {
    let words = [];
    // 100-900
    for (let i = 0; i < hundreds.length; i += 1) {
      if (hundreds[i][0] <= num) {
        words.push(hundreds[i][1]);
        num -= hundreds[i][0];
        break
      }
    }
    // 30-90
    for (let i = 0; i < tens.length; i += 1) {
      if (tens[i][0] <= num) {
        // 'e vinte'
        if (words.length > 0) {
          words.push('e');
        }
        words.push(tens[i][1]);
        num -= tens[i][0];
        break
      }
    }
    if (num === 0) {
      return words
    }
    // 0-29
    for (let i = 0; i < ones.length; i += 1) {
      if (ones[i][0] <= num) {
        // 'e sete'
        if (words.length > 0) {
          words.push('e');
        }
        words.push(ones[i][1]);
        num -= ones[i][0];
        break
      }
    }
    return words
  };

  const toText = function (num) {
    if (num === 0) {
      return ['zero']
    }
    let words = [];
    if (num < 0) {
      words.push('menos');
      num = Math.abs(num);
    }
    // handle multiples
    let found = getMagnitudes(num);
    found.forEach((obj, i) => {
      let res = threeDigit(obj.num);
      if (res[0] === 'cem' && res.length > 1) {
        res[0] = 'cento';
      }
      words = words.concat(res);
      if (obj.unit !== 'um') {
        words.push(obj.unit);
        if (found[i + 1]) {
          // mil e duzentos
          words.push('e');
        }
      }
    });
    // 'uno mil' -> 'mil'
    if (words.length > 1 && words[0] === 'um' && words[1] === 'mil') {
      words = words.slice(1);
    }
    // complex 'mil e ..' rules:
    words = andRules(words);
    return words
  };
  var toText$1 = toText;

  let toOrdinal = {};

  data.ones.concat(data.tens, data.hundreds, data.multiples).forEach(a => {
    toOrdinal[a[1]] = a[2];
  });

  const toTextOrdinal = function (words) {
    words = words.map(w => {
      if (toOrdinal.hasOwnProperty(w)) {
        return toOrdinal[w]
      }
      return w
    });
    if (words.length === 3 && words[1] === 'e') {
      words = [words[0], words[2]];
    }
    return words.join(' ')
  };

  var toTextOrdinal$1 = toTextOrdinal;

  const formatNumber = function (parsed, fmt) {
    if (fmt === 'TextOrdinal') {
      let words = toText$1(parsed.num);
      return toTextOrdinal$1(words)
    }
    if (fmt === 'TextCardinal') {
      return toText$1(parsed.num).join(' ')
    }
    // numeric format - 107 -> '107??'
    if (fmt === 'Ordinal') {
      return String(parsed.num) + '??'
    }
    if (fmt === 'Cardinal') {
      return String(parsed.num)
    }
    return String(parsed.num || '')
  };
  var format = formatNumber;

  // return the nth elem of a doc
  const getNth$2 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$4 = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth$2(this, n).map(parse)
      }
      get(n) {
        return getNth$2(this, n).map(parse).map(o => o.num)
      }
      json(n) {
        let doc = getNth$2(this, n);
        return doc.map(p => {
          let json = p.toView().json(n)[0];
          let parsed = parse(p);
          json.number = {
            prefix: parsed.prefix,
            num: parsed.num,
            suffix: parsed.suffix,
            hasComma: parsed.hasComma,
          };
          return json
        }, [])
      }
      /** any known measurement unit, for the number */
      units() {
        return this.growRight('#Unit').match('#Unit$')
      }
      /** return only ordinal numbers */
      isOrdinal() {
        return this.if('#Ordinal')
      }
      /** return only cardinal numbers*/
      isCardinal() {
        return this.if('#Cardinal')
      }

      /** convert to numeric form like '8' or '8th' */
      toNumber() {
        let m = this.if('#TextValue');
        let res = m.map(val => {
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('NumericValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert to numeric form like 'eight' or 'eighth' */
      toText() {
        let m = this;
        let res = m.map(val => {
          if (val.has('#TextValue')) {
            return val
          }
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('TextValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert ordinal to cardinal form, like 'eight', or '8' */
      toCardinal() {
        let m = this;
        let res = m.map(val => {
          if (!val.has('#Ordinal')) {
            return val
          }
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('Cardinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert cardinal to ordinal form, like 'eighth', or '8th' */
      toOrdinal() {
        let m = this;
        let res = m.map(val => {
          if (val.has('#Ordinal')) {
            return val
          }
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('Ordinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }

      /** return only numbers that are == n */
      isEqual(n) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num === n
        })
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num > n
        })
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num < n
        })
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter((val) => {
          let num = parse(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parse(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parse(val);
          obj.num = n;
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (val.has('#TextValue')) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = format(obj, fmt);
          // add commas to number
          if (obj.hasComma && fmt === 'Cardinal') {
            str = Number(str).toLocaleString();
          }
          if (str) {
            val = val.not('#Currency');
            val.replaceWith(str, { tags: true });
            // handle plural/singular unit
            // agreeUnits(agree, val, obj)
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      add(n) {
        if (!n) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parse(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parse(val);
          if (obj.num === null) {
            return val
          }
          obj.num += n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = format(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            // handle plural/singular unit
            // agreeUnits(agree, val, obj)
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** decrease each number by n*/
      subtract(n, agree) {
        return this.add(n * -1, agree)
      }
      /** increase each number by 1 */
      increment(agree) {
        return this.add(1, agree)
      }
      /** decrease each number by 1 */
      decrement(agree) {
        return this.add(-1, agree)
      }
      // overloaded - keep Numbers class
      update(pointer) {
        let m = new Numbers(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }
    // aliases
    Numbers.prototype.isBetween = Numbers.prototype.between;
    Numbers.prototype.minus = Numbers.prototype.subtract;
    Numbers.prototype.plus = Numbers.prototype.add;
    Numbers.prototype.equals = Numbers.prototype.isEqual;

    View.prototype.numbers = function (n) {
      let m = find(this);
      m = getNth$2(m, n);
      return new Numbers(this.document, m.pointer)
    };
    // alias
    View.prototype.values = View.prototype.numbers;
  };
  var api$5 = api$4;

  var numbers = {
    api: api$5
  };

  const getNth$1 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$1 = function (m, methods) {
    let str = m.text('normal');
    let isPlural = m.has('#PluralAdjective');
    let isFemale = m.has('#FemaleAdjective');
    if (isPlural && isFemale) {
      return methods.fromFemalePlural(str)
    } else if (isFemale) {
      return methods.fromFemale(str)
    } else if (isPlural) {
      return methods.toSingular(str)
    }
    return str
  };

  const api$2 = function (View) {
    class Adjectives extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Adjectives';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.adjective;
        return getNth$1(this, n).map(m => {
          let str = getRoot$1(m, methods);
          return {
            male: str,
            female: methods.toFemale(str),
            plural: methods.toPlural(str),
            femalePlural: methods.toFemalePlural(str),
          }
        }, [])
      }
    }

    View.prototype.adjectives = function (n) {
      let m = this.match('#Adjective');
      m = getNth$1(m, n);
      return new Adjectives(this.document, m.pointer)
    };
  };
  var api$3 = api$2;

  var adjectives = {
    api: api$3,
  };

  const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of verb
  const getRoot = function (m) {
    m.compute('root');
    m = m.not('(#Auxiliary|#Adverb|#Negative|#Reflexive)');
    let str = m.text('root');
    return str
  };

  const api = function (View) {
    class Verbs extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Verbs';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.verb;
        const { toConditional,
          toFutureTense,
          toImperativeNeg,
          toImperative,
          toImperfect,
          toPastTense,
          toPluperfect,
          toPresentTense,
          toGerund,
          toPastParticiple,
          toInfinitivo } = methods;
        return getNth(this, n).map(m => {
          let str = getRoot(m);
          return {
            Conditional: toConditional(str),
            FutureTense: toFutureTense(str),
            ImperativeNeg: toImperativeNeg(str),
            Imperative: toImperative(str),
            Imperfect: toImperfect(str),
            PastTense: toPastTense(str),
            Pluperfect: toPluperfect(str),
            PresentTense: toPresentTense(str),
            Infinitivo: toInfinitivo(str),
            Gerund: toGerund(str),
            PastParticiple: toPastParticiple(str),
          }
        }, [])
      }
    }

    View.prototype.verbs = function (n) {
      let m = this.match('#Verb+');
      m = getNth(m, n);
      return new Verbs(this.document, m.pointer)
    };
  };
  var api$1 = api;

  var verbs = {
    api: api$1,
  };

  var version = '0.0.2';

  nlp$1.plugin(tokenizer);
  nlp$1.plugin(tagset);
  nlp$1.plugin(lexicon);
  nlp$1.plugin(preTagger);
  nlp$1.plugin(postTagger);
  // nlp.plugin(nouns)
  nlp$1.plugin(adjectives);
  nlp$1.plugin(verbs);
  nlp$1.plugin(numbers);


  const es = function (txt, lex) {
    return nlp$1(txt, lex)
  };

  // copy constructor methods over
  Object.keys(nlp$1).forEach(k => {
    if (nlp$1.hasOwnProperty(k)) {
      es[k] = nlp$1[k];
    }
  });

  // this one is hidden
  Object.defineProperty(es, '_world', {
    value: nlp$1._world,
    writable: true,
  });

  /** log the decision-making to console */
  es.verbose = function (set) {
    let env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  es.version = version;

  return es;

}));
