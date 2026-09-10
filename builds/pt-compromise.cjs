(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ptCompromise = factory());
})(this, (function () { 'use strict';

  const methods$n = {
    one: {},
    two: {},
    three: {},
    four: {},
  };

  const model$6 = {
    one: {},
    two: {},
    three: {},
  };
  const compute$7 = {};
  const hooks = [];

  var tmpWrld = { methods: methods$n, model: model$6, compute: compute$7, hooks };

  const isArray$a = input => Object.prototype.toString.call(input) === '[object Array]';

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
      else if (isArray$a(input)) {
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

  // wrappers for loops in javascript arrays

  const forEach = function (cb) {
    const ptrs = this.fullPointer;
    ptrs.forEach((ptr, i) => {
      const view = this.update([ptr]);
      cb(view, i);
    });
    return this
  };

  const map = function (cb, empty) {
    const ptrs = this.fullPointer;
    const res = ptrs.map((ptr, i) => {
      const view = this.update([ptr]);
      const out = cb(view, i);
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
      const view = this.update([ptr]);
      return cb(view, i)
    });
    const res = this.update(ptrs);
    return res
  };

  const find = function (cb) {
    const ptrs = this.fullPointer;
    const found = ptrs.find((ptr, i) => {
      const view = this.update([ptr]);
      return cb(view, i)
    });
    return this.update([found])
  };

  const some = function (cb) {
    const ptrs = this.fullPointer;
    return ptrs.some((ptr, i) => {
      const view = this.update([ptr]);
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
  var loops = { forEach, map, filter, find, some, random };

  const utils = {
    /** */
    termList: function () {
      return this.methods.one.termList(this.docs)
    },
    /** return individual terms*/
    terms: function (n) {
      const m = this.match('.');
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
      const res = {};
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
      const n = this.fullPointer.length - 1;
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
      const ptrs = this.fullPointer.map(a => [a[0]]); //lazy!
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
      const aPtr = this.fullPointer;
      const bPtr = b.fullPointer;
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
      const ptrs = this.pointer;
      if (!ptrs) {
        return true
      }
      // must start at beginning
      if (ptrs.length === 0 || ptrs[0][0] !== 0) {
        return false
      }
      let wantTerms = 0;
      let haveTerms = 0;
      this.document.forEach(terms => wantTerms += terms.length);
      this.docs.forEach(terms => haveTerms += terms.length);
      return wantTerms === haveTerms
      // for (let i = 0; i < ptrs.length; i += 1) {
      //   let [n, start, end] = ptrs[i]
      //   // it's not the start
      //   if (n !== i || start !== 0) {
      //     return false
      //   }
      //   // it's too short
      //   if (document[n].length > end) {
      //     return false
      //   }
      // }
      // return true
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

  const methods$m = Object.assign({}, utils, fns$4, loops);

  // aliases
  methods$m.get = methods$m.eq;

  class View {
    constructor(document, pointer, groups = {}) {
      // invisible props
      const props = [
        ['document', document],
        ['world', tmpWrld],
        ['_groups', groups],
        ['_cache', null],
        ['viewType', 'View'],
      ];
      props.forEach(a => {
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
      const { docs, ptrs, document } = this;
      // compute a proper pointer, from docs
      const pointers = ptrs || docs.map((_d, n) => [n]);
      // do we need to repair it, first?
      return pointers.map(a => {
        // eslint-disable-next-line prefer-const
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
      const m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer && pointer.length > 0) {
        // only keep cache if it's a full-sentence
        const cache = [];
        pointer.forEach((ptr, i) => {
          const [n, start, end] = ptr;
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
      const document = methods.one.tokenize.fromString(input, this.world);
      const doc = new View(document);
      doc.world = this.world;
      doc.compute(['normal', 'freeze', 'lexicon']);
      if (this.world.compute.preTagger) {
        doc.compute('preTagger');
      }
      doc.compute('unfreeze');
      return doc
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0); //node 17: structuredClone(document);
      document = document.map(terms => {
        return terms.map(term => {
          term = Object.assign({}, term);
          term.tags = new Set(term.tags);
          return term
        })
      });
      // clone only sub-document ?
      const m = this.update(this.pointer);
      m.document = document;
      m._cache = this._cache; //clone this too?
      return m
    }
  }
  Object.assign(View.prototype, methods$m);

  var version$1 = '14.17.0';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  const isArray$9 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const isUnsafeKey = key => key === '__proto__' || key === 'constructor' || key === 'prototype';

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$6(plugin)) {
      for (const key in plugin) {
        // prevent prototype pollution
        if (isUnsafeKey(key)) {
          continue
        }
        if (isObject$6(plugin[key])) {
          if (!model[key]) Object.assign(model, { [key]: {} });
          mergeDeep(model[key], plugin[key]); //recursion
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
      if (isUnsafeKey(key)) continue
      model[key] = model[key] || {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  const addIrregulars = function (model, conj) {
    const m = model.two.models || {};
    Object.keys(conj).forEach(k => {
      // verb forms
      if (conj[k].pastTense) {
        if (m.toPast) {
          m.toPast.ex[k] = conj[k].pastTense;
        }
        if (m.fromPast) {
          m.fromPast.ex[conj[k].pastTense] = k;
        }
      }
      if (conj[k].presentTense) {
        if (m.toPresent) {
          m.toPresent.ex[k] = conj[k].presentTense;
        }
        if (m.fromPresent) {
          m.fromPresent.ex[conj[k].presentTense] = k;
        }
      }
      if (conj[k].gerund) {
        if (m.toGerund) {
          m.toGerund.ex[k] = conj[k].gerund;
        }
        if (m.fromGerund) {
          m.fromGerund.ex[conj[k].gerund] = k;
        }
      }
      // adjective forms
      if (conj[k].comparative) {
        if (m.toComparative) {
          m.toComparative.ex[k] = conj[k].comparative;
        }
        if (m.fromComparative) {
          m.fromComparative.ex[conj[k].comparative] = k;
        }
      }
      if (conj[k].superlative) {
        if (m.toSuperlative) {
          m.toSuperlative.ex[k] = conj[k].superlative;
        }
        if (m.fromSuperlative) {
          m.fromSuperlative.ex[conj[k].superlative] = k;
        }
      }
    });
  };

  const extend = function (plugin, world, View, nlp) {
    // support array of plugins
    if (isArray$9(plugin)) {
      plugin.forEach(p => extend(p, world, View, nlp));
      return
    }
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
      Object.keys(plugin.lib).forEach(k => (nlp[k] = plugin.lib[k]));
    }
    if (plugin.tags) {
      nlp.addTags(plugin.tags);
    }
    if (plugin.words) {
      nlp.addWords(plugin.words);
    }
    if (plugin.frozen) {
      nlp.addWords(plugin.frozen, true);
    }
    if (plugin.mutate) {
      plugin.mutate(world, nlp);
    }
  };

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
    const doc = new View([]);
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
      const document = methods.one.tokenize.fromString(input, world);
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
        const document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      const document = fromJson(input);
      return new View(document)
    }
    return doc
  };

  const world = Object.assign({}, tmpWrld);

  const nlp = function (input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    const doc = inputs(input, View, world);
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
    const doc = inputs(input, View, world);
    // give contractions a shot, at least
    if (compute.contractions) {
      doc.compute(['alias', 'normal', 'machine', 'contractions']); //run it if we've got it
    }
    return doc
  };

  /** extend compromise functionality */
  nlp.plugin = function (plugin) {
    extend(plugin, this._world, View, this);
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

  const createCache = function (document) {
    const cache = document.map(terms => {
      const items = new Set();
      terms.forEach(term => {
        // add words
        if (term.normal !== '') {
          items.add(term.normal);
        }
        // cache switch-status - '%Noun|Verb%'
        if (term.switch) {
          items.add(`%${term.switch}%`);
        }
        // cache implicit words, too
        if (term.implicit) {
          items.add(term.implicit);
        }
        if (term.machine) {
          items.add(term.machine);
        }
        if (term.root) {
          items.add(term.root);
        }
        // cache slashes words, etc
        if (term.alias) {
          term.alias.forEach(str => items.add(str));
        }
        const tags = Array.from(term.tags);
        for (let t = 0; t < tags.length; t += 1) {
          items.add('#' + tags[t]);
        }
      });
      return items
    });
    return cache
  };

  var methods$l = {
    one: {
      cacheDoc: createCache,
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

  var compute$6 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$1 = {
    api: addAPI$3,
    compute: compute$6,
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
  const isTitleCase$2 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase$1 = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase$1 = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      const args = [index, 0].concat(child);
      Array.prototype.splice.apply(parent, args);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    const lastTerm = terms[terms.length - 1];
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // sentence-ending punctuation should move in append
  const movePunct = (source, end, needle) => {
    const juicy = /[-.?!,;:)–—'"]/g;
    const wasLast = source[end - 1];
    if (!wasLast) {
      return
    }
    const post = wasLast.post;
    if (juicy.test(post)) {
      const punct = post.match(juicy).join(''); //not perfect
      const last = needle[needle.length - 1];
      last.post = punct + last.post;
      // remove it, from source
      wasLast.post = wasLast.post.replace(juicy, '');
    }
  };


  const moveTitleCase = function (home, start, needle) {
    const from = home[start];
    // should we bother?
    if (start !== 0 || !isTitleCase$2(from.text)) {
      return
    }
    // titlecase new first term
    needle[0].text = toTitleCase$1(needle[0].text);
    // should we un-titlecase the old word?
    const old = home[start];
    if (old.tags.has('ProperNoun') || old.tags.has('Acronym')) {
      return
    }
    if (isTitleCase$2(old.text) && old.text.length > 1) {
      old.text = toLowerCase$1(old.text);
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document) {
    const [n, start, end] = ptr;
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
    const [n, , end] = ptr;
    const total = (document[n] || []).length;
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
  let index$1 = 0;

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    index$1 += 1;

    //don't overflow index
    index$1 = index$1 > 46655 ? 0 : index$1;
    //don't overflow sentences
    n = n > 46655 ? 0 : n;
    // //don't overflow terms
    i = i > 1294 ? 0 : i;

    // 3 digits for time
    let id = pad3(index$1.toString(36));
    // 3 digit  for sentence index (46k)
    id += pad3(n.toString(36));

    // 1 digit for term index (36)
    let tx = i.toString(36);
    tx = tx.length < 2 ? '0' + tx : tx; //pad2
    id += tx;

    // 1 digit random number
    const r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we inserting inside a contraction?
  // expand it first
  const expand$1 = function (m) {
    if (m.has('@hasContraction') && typeof m.contractions === 'function') {
      //&& m.after('^.').has('@hasContraction')
      const more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  const isArray$7 = arr => Object.prototype.toString.call(arr) === '[object Array]';

  // set new ids for each terms
  const addIds$2 = function (terms) {
    terms = terms.map(term => {
      term.id = toId(term);
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
    const ptrs = view.fullPointer;
    const selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      const ptr = m.fullPointer[0];
      const [n] = ptr;
      // add-in the words
      const home = document[n];
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
    const doc = view.toView(ptrs);
    // shift our self pointer, if necessary
    view.ptrs = selfPtrs;
    // try to tag them, too
    doc.compute(['id', 'index', 'freeze', 'lexicon']);
    if (doc.world.compute.preTagger) {
      doc.compute('preTagger');
    }
    doc.compute('unfreeze');
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

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  // case logic
  const isTitleCase$1 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn, keep) {
    main.forEach(m => {
      const out = fn(m);
      m.replaceWith(out, keep);
    });
    return main
  };

  // support 'foo $0' replacements
  const subDollarSign = function (input, main) {
    if (typeof input !== 'string') {
      return input
    }
    const groups = main.groups();
    input = input.replace(dollarStub, a => {
      const num = a.replace(/\$/, '');
      if (groups.hasOwnProperty(num)) {
        return groups[num].text()
      }
      return a
    });
    return input
  };

  fns$2.replaceWith = function (input, keep = {}) {
    let ptrs = this.fullPointer;
    // support keep-all option
    if (keep === true) {
      keep = {
        tags: true,
        case: true,
        possessives: true,
      };
    }
    const main = this;
    this.uncache();
    if (typeof input === 'function') {
      return replaceByFn(main, input, keep)
    }
    const terms = main.docs[0];
    if (!terms) return main
    const isOriginalPossessive = keep.possessives && terms[terms.length - 1].tags.has('Possessive');
    const isOriginalTitleCase = keep.case && isTitleCase$1(terms[0].text);
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    const original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    const originalPre = original.docs[0][0].pre;
    const originalPost = original.docs[0][original.docs[0].length - 1].post;
    // slide this in
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
    main.insertAfter(input);
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      const more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    main.delete(original); //science.

    // keep "John's"
    if (isOriginalPossessive) {
      const tmp = main.docs[0];
      const term = tmp[tmp.length - 1];
      if (!term.tags.has('Possessive')) {
        term.text += "'s";
        term.normal += "'s";
        term.tags.add('Possessive');
      }
    }

    // try to keep some pre-punctuation
    if (originalPre && main.docs[0]) {
      main.docs[0][0].pre = originalPre;
    }
    // try to keep any post-punctuation
    if (originalPost && main.docs[0]) {
      const lastOne = main.docs[0][main.docs[0].length - 1];
      if (!lastOne.post.trim()) {
        lastOne.post = originalPost;
      }
    }
    // what should we return?
    const m = main.toView(ptrs).compute(['index', 'freeze', 'lexicon']);
    if (m.world.compute.preTagger) {
      m.compute('preTagger');
    }
    m.compute('unfreeze');
    // replace any old tags
    if (keep.tags) {
      // truncate old tags to only touch new terms
      oldTags = oldTags.slice(0, input.wordCount());
      m.terms().forEach((term, i) => {
        term.tagSafe(oldTags[i]);
      });
    }

    if (!m.docs[0] || !m.docs[0][0]) return m

    // try to co-erce case, too
    if (keep.case) {
      const transformCase = isOriginalTitleCase ? toTitleCase : toLowerCase;
      m.docs[0][0].text = transformCase(m.docs[0][0].text);
    }
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && !input) {
      return this.replaceWith(match, keep)
    }
    const m = this.match(match);
    if (!m.found) {
      return this
    }
    this.soften();
    return m.replaceWith(input, keep)
  };

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    const last = terms.length - 1;
    const from = terms[last];
    const to = terms[last - len];
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
      const [n, start, end] = ptr;
      const len = end - start;
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
          const terms = document[i - 1];
          const lastTerm = terms[terms.length - 1];
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

  const fixPointers$1 = function (ptrs, gonePtrs) {
    ptrs = ptrs.map(ptr => {
      const [n] = ptr;
      if (!gonePtrs[n]) {
        return ptr
      }
      gonePtrs[n].forEach(no => {
        const len = no[2] - no[1];
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
      const isFull = !self.ptrs;
      // is it part of a contraction?
      if (not.has('@hasContraction') && not.contractions) {
        const more = not.grow('@hasContraction');
        more.contractions().expand();
      }

      let ptrs = self.fullPointer;
      const nots = not.fullPointer.reverse();
      // remove them from the actual document)
      const document = pluckOut(this.document, nots);
      // repair our pointers
      const gonePtrs = indexN(nots);
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
      const res = self.toView(ptrs); //return new document
      return res
    },
  };

  // aliases
  methods$j.delete = methods$j.remove;

  const methods$i = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      this.docs.forEach(terms => {
        const term = terms[0];
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
        const last = this.docs[this.docs.length - 1];
        return last[last.length - 1].post
      }
      this.docs.forEach(terms => {
        const term = terms[terms.length - 1];
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
      const docs = this.docs;
      const start = docs[0][0];
      start.pre = start.pre.trimStart();
      const last = docs[docs.length - 1];
      const end = last[last.length - 1];
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
      const hasHyphen = /[-–—]/;
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
        const last = terms[terms.length - 1];
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
        const last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },
  };

  // aliases
  methods$i.deHyphenate = methods$i.dehyphenate;
  methods$i.toQuotation = methods$i.toQuotations;

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
    const left = a.normal.trim().length;
    const right = b.normal.trim().length;
    if (left < right) {
      return 1
    }
    if (left > right) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const wordCount$1 = (a, b) => {
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
    const counts = {};
    arr.forEach(o => {
      counts[o.normal] = counts[o.normal] || 0;
      counts[o.normal] += 1;
    });
    // sort by freq
    arr.sort((a, b) => {
      const left = counts[a.normal];
      const right = counts[b.normal];
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

  var methods$h = { alpha, length, wordCount: wordCount$1, sequential, byFreq };

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
    const { docs, pointer } = this;
    this.uncache();
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input = input || 'alpha';
    const ptrs = pointer || docs.map((_d, n) => [n]);
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
  const reverse$1 = function () {
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
    const already = new Set();
    const res = this.filter(m => {
      const txt = m.text('machine');
      if (already.has(txt)) {
        return false
      }
      already.add(txt);
      return true
    });
    // this.ptrs = res.ptrs //mutate original?
    return res//.compute('index')
  };

  var sort$1 = { unique, reverse: reverse$1, sort };

  const isArray$6 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      const end = homeDocs[homeDocs.length - 1];
      const last = end[end.length - 1];
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
      const ptrs = home.fullPointer.concat(input.fullPointer);
      return home.toView(ptrs).compute('index')
    }
    // update n of new pointer, to end of our pointer
    const ptrs = input.fullPointer;
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
        const more = this.fromText(input);
        // easy concat
        if (!this.found || !this.ptrs) {
          this.document = this.document.concat(more.document);
        } else {
          // if we are in the middle, this is actually a splice operation
          const ptrs = this.fullPointer;
          const at = ptrs[ptrs.length - 1][0];
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
        const docs = combineDocs(this.document, input);
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

  const methods$g = Object.assign({}, caseFns, fns$3, fns$2, methods$j, methods$i, sort$1, concat, harden$1);

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$g);
  };

  const compute$5 = {
    id: function (view) {
      const docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          const term = docs[n][i];
          term.id = term.id || toId(term);
        }
      }
    }
  };

  var change = {
    api: addAPI$2,
    compute: compute$5,
  };

  var contractions$2 = [
    // simple mappings
    { word: '@', out: ['at'] },
    { word: 'arent', out: ['are', 'not'] },
    { word: 'alot', out: ['a', 'lot'] },
    { word: 'brb', out: ['be', 'right', 'back'] },
    { word: 'cannot', out: ['can', 'not'] },
    { word: 'dun', out: ['do', 'not'] },
    { word: "can't", out: ['can', 'not'] },
    { word: "shan't", out: ['should', 'not'] },
    { word: "won't", out: ['will', 'not'] },
    { word: "that's", out: ['that', 'is'] },
    { word: "what's", out: ['what', 'is'] },
    { word: "let's", out: ['let', 'us'] },
    // { word: "there's", out: ['there', 'is'] },
    { word: 'dunno', out: ['do', 'not', 'know'] },
    { word: 'gonna', out: ['going', 'to'] },
    { word: 'gotta', out: ['have', 'got', 'to'] }, //hmm
    { word: 'gimme', out: ['give', 'me'] },
    { word: 'outta', out: ['out', 'of'] },
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
    // shoulda, coulda
    { word: 'shoulda', out: ['should', 'have'] },
    { word: 'coulda', out: ['coulda', 'have'] },
    { word: 'woulda', out: ['woulda', 'have'] },
    { word: 'musta', out: ['must', 'have'] },

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

    // missing apostrophes
    { word: 'shouldnt', out: ['should', 'not'] },
    { word: 'couldnt', out: ['could', 'not'] },
    { word: 'wouldnt', out: ['would', 'not'] },
    { word: 'hasnt', out: ['has', 'not'] },
    { word: 'wasnt', out: ['was', 'not'] },
    { word: 'isnt', out: ['is', 'not'] },
    { word: 'cant', out: ['can', 'not'] },
    { word: 'dont', out: ['do', 'not'] },
    { word: 'wont', out: ['will', 'not'] },
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },
  ];

  // number suffixes that are not units
  const t$1 = true;
  var numberSuffixes = {
    'st': t$1,
    'nd': t$1,
    'rd': t$1,
    'th': t$1,
    'am': t$1,
    'pm': t$1,
    'max': t$1,
    '°': t$1,
    's': t$1, // 1990s
    'e': t$1, // 18e - french/spanish ordinal
    'er': t$1, //french 1er
    'ère': t$1, //''
    'ème': t$1, //french 2ème
  };

  var model$5 = {
    one: {
      contractions: contractions$2,
      numberSuffixes
    }
  };

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    const [n, w] = point;
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
    const before = terms[i].normal.split(hasContraction$1)[0];

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

  //ain't -> are/is not
  const apostropheT = function (terms, i) {
    if (terms[i].normal === "ain't" || terms[i].normal === 'aint') {
      return null //do this in ./two/
    }
    const before = terms[i].normal.replace(/n't/, '');
    return [before, 'not']
  };

  const hasContraction = /'/;
  const isFeminine = /(e|é|aison|sion|tion)$/;
  const isMasculine = /(age|isme|acle|ege|oire)$/;
  // l'amour
  const preL = (terms, i) => {
    // le/la
    const after = terms[i].normal.split(hasContraction)[1];
    // quick french gender disambig (rough)
    if (after && after.endsWith('e')) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    const after = terms[i].normal.split(hasContraction)[1];
    // quick guess for noun-agreement (rough)
    if (after && isFeminine.test(after) && !isMasculine.test(after)) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => {
    const after = terms[i].normal.split(hasContraction)[1];
    return ['je', after]
  };

  var french = {
    preJ,
    preL,
    preD,
  };

  const isRange = /^([0-9.]{1,4}[a-z]{0,2}) ?[-–—] ?([0-9]{1,4}[a-z]{0,2})$/i;
  const timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;
  const phoneNum = /^[0-9]{3}-[0-9]{4}$/;

  const numberRange = function (terms, i) {
    const term = terms[i];
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

  const numUnit = /^([+-]?[0-9][.,0-9]*)([a-z°²³µ/]+)$/; //(must be lowercase)

  const numberUnit = function (terms, i, world) {
    const notUnit = world.model.one.numberSuffixes || {};
    const term = terms[i];
    const parts = term.text.match(numUnit);
    if (parts !== null) {
      // is it a recognized unit, like 'km'?
      const unit = parts[2].toLowerCase().trim();
      // don't split '3rd'
      if (notUnit.hasOwnProperty(unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // run tagger on our new implicit terms
  const reTag = function (terms, view, start, len) {
    const tmp = view.update();
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
    t: (terms, i) => apostropheT(terms, i),
    // how'd
    d: (terms, i) => _apostropheD(terms, i),
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
      const o = list[i];
      // look for word-word match (cannot-> [can, not])
      if (o.word === term.normal) {
        return o.out
      }
      // look for after-match ('re -> [_, are])
      else if (after !== null && after === o.after) {
        return [before].concat(o.out)
      }
      // look for before-match (l' -> [le, _])
      else if (before !== null && before === o.before && after && after.length > 2) {
        return o.out.concat(after)
        // return [o.out, after] //typeof o.out === 'string' ? [o.out, after] : o.out(terms, i)
      }
    }
    return null
  };

  const toDocs = function (words, view) {
    const doc = view.fromText(words.join(' '));
    doc.compute(['id', 'alias']);
    return doc.docs[0]
  };

  // there's is usually [there, is]
  // but can be 'there has' for 'there has (..) been'
  const thereHas = function (terms, i) {
    for (let k = i + 1; k < 5; k += 1) {
      if (!terms[k]) {
        break
      }
      if (terms[k].normal === 'been') {
        return ['there', 'has']
      }
    }
    return ['there', 'is']
  };

  //really easy ones
  const contractions$1 = view => {
    const { world, document } = view;
    const { model, methods } = world;
    const list = model.one.contractions || [];
    // let units = new Set(model.one.units || [])
    // each sentence
    document.forEach((terms, n) => {
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal) === true) {
          const res = terms[i].normal.split(byApostrophe);
          before = res[0];
          after = res[1];
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
        // 'there is' vs 'there has'
        if (before === 'there' && after === 's') {
          words = thereHas(terms, i);
        }
        // actually insert the new terms
        if (words) {
          words = toDocs(words, view);
          insertContraction(document, [n, i], words);
          reTag(document[n], view, i, words.length);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange(terms, i);
          if (words) {
            words = toDocs(words, view);
            insertContraction(document, [n, i], words);
            methods.one.setTag(words, 'NumberRange', world); //add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
            reTag(document[n], view, i, words.length);
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit(terms, i, world);
        if (words) {
          words = toDocs(words, view);
          insertContraction(document, [n, i], words);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
    });
  };

  var compute$4 = { contractions: contractions$1 };

  const plugin = {
    model: model$5,
    compute: compute$4,
    hooks: ['contractions'],
  };

  const freeze$1 = function (view) {
    const world = view.world;
    const { model, methods } = view.world;
    const setTag = methods.one.setTag;
    const { frozenLex } = model.one;
    const multi = model.one._multiCache || {};

    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        // basic lexicon lookup
        const t = terms[i];
        const word = t.machine || t.normal;

        // test a multi-word
        if (multi[word] !== undefined && terms[i + 1]) {
          const end = i + multi[word] - 1;
          for (let k = end; k > i; k -= 1) {
            const words = terms.slice(i, k + 1);
            const str = words.map(term => term.machine || term.normal).join(' ');
            // lookup frozen lexicon
            if (frozenLex.hasOwnProperty(str) === true) {
              setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
              words.forEach(term => (term.frozen = true));
              continue
            }
          }
        }
        // test single word
        if (frozenLex[word] !== undefined && frozenLex.hasOwnProperty(word)) {
          setTag([t], frozenLex[word], world, false, '1-freeze-lexicon');
          t.frozen = true;
          continue
        }
      }
    });
  };

  const unfreeze = function (view) {
    view.docs.forEach(ts => {
      ts.forEach(term => {
        delete term.frozen;
      });
    });
    return view
  };
  var compute$3 = { frozen: freeze$1, freeze: freeze$1, unfreeze };

  /* eslint-disable no-console */
  const blue = str => '\x1b[34m' + str + '\x1b[0m';
  const dim = str => '\x1b[3m\x1b[2m' + str + '\x1b[0m';

  const debug$2 = function (view) {
    view.docs.forEach(terms => {
      console.log(blue('\n  ┌─────────'));
      terms.forEach(t => {
        let str = `  ${dim('│')}  `;
        const txt = t.implicit || t.text || '-';
        if (t.frozen === true) {
          str += `${blue(txt)} ❄️`;
        } else {
          str += dim(txt);
        }
        console.log(str);
      });
    });
  };

  var freeze = {
    // add .compute('freeze')
    compute: compute$3,

    mutate: world => {
      const methods = world.methods.one;
      // add @isFrozen method
      methods.termMethods.isFrozen = term => term.frozen === true;
      // adds `.debug('frozen')`
      methods.debug.freeze = debug$2;
      methods.debug.frozen = debug$2;
    },

    api: function (View) {
      // set all terms to reject any desctructive tags
      View.prototype.freeze = function () {
        this.docs.forEach(ts => {
          ts.forEach(term => {
            term.frozen = true;
          });
        });
        return this
      };
      // reset all terms to allow  any desctructive tags
      View.prototype.unfreeze = function () {
        this.compute('unfreeze');
      };
      // return all frozen terms
      View.prototype.isFrozen = function () {
        return this.match('@isFrozen+')
      };
    },
    // run it in init
    hooks: ['freeze'],
  };

  // scan-ahead to match multiple-word terms - 'jack rabbit'
  const multiWord = function (terms, start_i, world) {
    const { model, methods } = world;
    const setTag = methods.one.setTag;
    const multi = model.one._multiCache || {};
    const { lexicon } = model.one || {};
    const t = terms[start_i];
    const word = t.machine || t.normal;

    // found a word to scan-ahead on
    if (multi[word] !== undefined && terms[start_i + 1]) {
      const end = start_i + multi[word] - 1;
      for (let i = end; i > start_i; i -= 1) {
        const words = terms.slice(start_i, i + 1);
        if (words.length <= 1) {
          return false
        }
        const str = words.map(term => term.machine || term.normal).join(' ');
        // lookup regular lexicon
        if (lexicon.hasOwnProperty(str) === true) {
          const tag = lexicon[str];
          setTag(words, tag, world, false, '1-multi-lexicon');
          // special case for phrasal-verbs - 2nd word is a #Particle
          if (tag && tag.length === 2 && (tag[0] === 'PhrasalVerb' || tag[1] === 'PhrasalVerb')) {
            setTag([words[1]], 'Particle', world, false, '1-phrasal-particle');
          }
          return true
        }
      }
      return false
    }
    return null
  };

  const prefix$1 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
  // anti|non|extra|inter|intra|over
  const allowPrefix = new Set(['Verb', 'Infinitive', 'PastTense', 'Gerund', 'PresentTense', 'Adjective', 'Participle']);

  // tag any words in our lexicon
  const checkLexicon = function (terms, i, world) {
    const { model, methods } = world;
    // const fastTag = methods.one.fastTag
    const setTag = methods.one.setTag;
    const { lexicon } = model.one;

    // basic lexicon lookup
    const t = terms[i];
    const word = t.machine || t.normal;
    // normal lexicon lookup
    if (lexicon[word] !== undefined && lexicon.hasOwnProperty(word)) {
      setTag([t], lexicon[word], world, false, '1-lexicon');
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      const found = t.alias.find(str => lexicon.hasOwnProperty(str));
      if (found) {
        setTag([t], lexicon[found], world, false, '1-lexicon-alias');
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$1.test(word) === true) {
      const stem = word.replace(prefix$1, '');
      if (lexicon.hasOwnProperty(stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, false, '1-lexicon-prefix');
          return true
        }
      }
    }
    return null
  };

  // tag any words in our lexicon - even if it hasn't been filled-up yet
  // rest of pre-tagger is in ./two/preTagger
  const lexicon$4 = function (view) {
    const world = view.world;
    // loop through our terms
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        if (terms[i].tags.size === 0) {
          let found = null;
          found = found || multiWord(terms, i, world);
          // lookup known words
          found = found || checkLexicon(terms, i, world);
        }
      }
    });
  };

  var compute$2 = {
    lexicon: lexicon$4,
  };

  // derive clever things from our lexicon key-value pairs
  const expand = function (words) {
    // const { methods, model } = world
    const lex = {};
    // console.log('start:', Object.keys(lex).length)
    const _multi = {};
    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      const tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      word = word.replace(/'s\b/, '');
      // cache multi-word terms
      const split = word.split(/ /);
      if (split.length > 1) {
        // prefer longer ones
        if (_multi[split[0]] === undefined || split.length > _multi[split[0]]) {
          _multi[split[0]] = split.length;
        }
      }
      lex[word] = lex[word] || tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };

  var methods$f = {
    one: {
      expandLexicon: expand,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords = function (words, isFrozen = false) {
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
    // these words go into a seperate lexicon
    if (isFrozen === true) {
      const { lex, _multi } = methods.one.expandLexicon(words, world);
      Object.assign(model.one._multiCache, _multi);
      Object.assign(model.one.frozenLex, lex);
      return
    }
    // add some words to our lexicon
    if (methods.two.expandLexicon) {
      // do fancy ./two version
      const { lex, _multi } = methods.two.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    }
    // do basic ./one version
    const { lex, _multi } = methods.one.expandLexicon(words, world);
    Object.assign(model.one.lexicon, lex);
    Object.assign(model.one._multiCache, _multi);
  };

  var lib$5 = { addWords };

  const model$4 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
      frozenLex: {}, //2nd lexicon
    },
  };

  var lexicon$3 = {
    model: model$4,
    methods: methods$f,
    compute: compute$2,
    lib: lib$5,
    hooks: ['lexicon'],
  };

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize$1 = function (phrase, world) {
    const { methods, model } = world;
    const terms = methods.one.tokenize.splitTerms(phrase, model).map(t => methods.one.tokenize.splitWhitespace(t, model));
    return terms.map(term => term.text.toLowerCase())
  };

  // turn an array or object into a compressed aho-corasick structure
  const buildTrie = function (phrases, world) {

    // const tokenize=methods.one.
    const goNext = [{}];
    const endAs = [null];
    const failTo = [0];

    const xs = [];
    let n = 0;
    phrases.forEach(function (phrase) {
      let curr = 0;
      // let wordsB = phrase.split(/ /g).filter(w => w)
      const words = tokenize$1(phrase, world);
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
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
    for (const word in goNext[0]) {
      n = goNext[0][word];
      failTo[n] = 0;
      xs.push(n);
    }

    while (xs.length) {
      const r = xs.shift();
      // for each symbol a such that g(r, a) = s
      const keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        const word = keys[i];
        const s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !goNext[n].hasOwnProperty(word)) {
          n = failTo[n];
        }
        if (goNext.hasOwnProperty(n)) {
          const fs = goNext[n][word];
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

  // console.log(buildTrie(['smart and cool', 'smart and nice']))

  // follow our trie structure
  const scanWords = function (terms, trie, opts) {
    let n = 0;
    const results = [];
    for (let i = 0; i < terms.length; i++) {
      const word = terms[i][opts.form] || terms[i].normal;
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
        const arr = trie.endAs[n];
        for (let o = 0; o < arr.length; o++) {
          const len = arr[o];
          const term = terms[i - len + 1];
          const [no, start] = term.index;
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
    const docs = view.docs;
    if (!trie.goNext || !trie.goNext[0]) {
      console.error('Compromise invalid lookup trie');//eslint-disable-line
      return view.none()
    }
    const firstWords = Object.keys(trie.goNext[0]);
    // do each phrase
    for (let i = 0; i < docs.length; i++) {
      // can we skip the phrase, all together?
      if (view._cache && view._cache[i] && cacheMiss(firstWords, view._cache[i]) === true) {
        continue
      }
      const terms = docs[i];
      const found = scanWords(terms, trie, opts);
      if (found.length > 0) {
        results = results.concat(found);
      }
    }
    return view.update(results)
  };

  const isObject$4 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  function api$6 (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      const trie = isObject$4(input) ? input : buildTrie(input, this.world);
      let res = scan(this, trie, opts);
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

  /** pre-compile a list of matches to lookup */
  const lib$4 = {
    /** turn an array or object into a compressed trie*/
    buildTrie: function (input) {
      const trie = buildTrie(input, this.world());
      return compress(trie)
    }
  };
  // add alias
  lib$4.compile = lib$4.buildTrie;

  var lookup = {
    api: api$6,
    lib: lib$4
  };

  const relPointer = function (ptrs, parent) {
    if (!parent) {
      return ptrs
    }
    ptrs.forEach(ptr => {
      const n = ptr[0];
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
    let { ptrs } = res;
    const { byGroup } = res;
    ptrs = relPointer(ptrs, parent);
    Object.keys(byGroup).forEach(k => {
      byGroup[k] = relPointer(byGroup[k], parent);
    });
    return { ptrs, byGroup }
  };

  // turn any matchable input intp a list of matches
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

  const isObject$3 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // did they pass-in a compromise object?
  const isView = val => val && isObject$3(val) && val.isView === true;

  const isNet = val => val && isObject$3(val) && val.isNet === true;

  const match$1 = function (regs, group, opts) {
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
    const todo = { regs, group };
    const res = one.match(this.docs, todo, this._cache);
    const { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    const view = this.toView(ptrs);
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
    const todo = { regs, group, justOne: true };
    const res = one.match(this.docs, todo, this._cache);
    const { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    const view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const has = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      const ptrs = this.intersection(regs).fullPointer;
      return ptrs.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.found
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    const ptrs = one.match(this.docs, todo, this._cache).ptrs;
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
      const m = this.sweep(regs, { tagger: false }).view.settle();
      return this.if(m) //recurse with result
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    let ptrs = this.fullPointer;
    const cache = this._cache || [];
    ptrs = ptrs.filter((ptr, i) => {
      const m = this.update([ptr]);
      const res = one.match(m.docs, todo, cache[i]).ptrs;
      return res.length > 0
    });
    const view = this.update(ptrs);
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
      const m = this.sweep(regs, { tagger: false }).view.settle();
      return this.ifNo(m)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    const cache = this._cache || [];
    const view = this.filter((m, i) => {
      const todo = { regs, group, justOne: true };
      const ptrs = one.match(m.docs, todo, cache[i]).ptrs;
      return ptrs.length === 0
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$2 = { matchOne, match: match$1, has, if: ifFn, ifNo };

  const before = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    const pre = [];
    const byN = indexN(this.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest match in the sentence
      const first = byN[k].sort((a, b) => (a[1] > b[1] ? 1 : -1))[0];
      if (first[1] > 0) {
        pre.push([first[0], 0, first[1]]);
      }
    });
    const preWords = this.toView(pre);
    if (!regs) {
      return preWords
    }
    return preWords.match(regs, group, opts)
  };

  const after = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    const post = [];
    const byN = indexN(this.fullPointer);
    const document = this.document;
    Object.keys(byN).forEach(k => {
      // check only the latest match in the sentence
      const last = byN[k].sort((a, b) => (a[1] > b[1] ? -1 : 1))[0];
      const [n, , end] = last;
      if (end < document[n].length) {
        post.push([n, end, document[n].length]);
      }
    });
    const postWords = this.toView(post);
    if (!regs) {
      return postWords
    }
    return postWords.match(regs, group, opts)
  };

  const growLeft = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[regs.length - 1].end = true; // ensure matches are beside us ←
    const ptrs = this.fullPointer;
    this.forEach((m, n) => {
      const more = m.before(regs, group);
      if (more.found) {
        const terms = more.terms();
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
    regs[0].start = true; // ensure matches are beside us →
    const ptrs = this.fullPointer;
    this.forEach((m, n) => {
      const more = m.after(regs, group);
      if (more.found) {
        const terms = more.terms();
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

  const getDoc$2 = (reg, view, group) => {
    if (typeof reg === 'string' || isArray$5(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
  };

  const addIds$1 = function (ptr, view) {
    const [n, start, end] = ptr;
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
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
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
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
    // repair matches to favor [match, after]
    // - instead of [before, match]
    for (let i = 0; i < all.length; i += 1) {
      // move a before to a preceding after
      if (!all[i].after && all[i + 1] && all[i + 1].before) {
        // ensure it's from the same original sentence
        if (all[i].match && all[i].match[0] === all[i + 1].before[0]) {
          all[i].after = all[i + 1].before;
          delete all[i + 1].before;
        }
      }
    }

    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      // a, [x, b]
      if (o.match && o.after) {
        res.push(combine(o.match, o.after));
      } else {
        // a, [x], b
        res.push(o.match);
      }
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before match], [after]
  methods$e.splitAfter = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
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

  // check if two pointers are perfectly consecutive
  const isNeighbour = function (ptrL, ptrR) {
    // validate
    if (!ptrL || !ptrR) {
      return false
    }
    // same sentence
    if (ptrL[0] !== ptrR[0]) {
      return false
    }
    // ensure R starts where L ends
    return ptrL[2] === ptrR[1]
  };

  // join two neighbouring words, if they both match
  const mergeIf = function (doc, lMatch, rMatch) {
    const world = doc.world;
    const parseMatch = world.methods.one.parseMatch;
    lMatch = lMatch || '.$'; //defaults
    rMatch = rMatch || '^.';
    const leftMatch = parseMatch(lMatch, {}, world);
    const rightMatch = parseMatch(rMatch, {}, world);
    // ensure end-requirement to left-match, start-requiremnts to right match
    leftMatch[leftMatch.length - 1].end = true;
    rightMatch[0].start = true;
    // let's get going.
    const ptrs = doc.fullPointer;
    const res = [ptrs[0]];
    for (let i = 1; i < ptrs.length; i += 1) {
      const ptrL = res[res.length - 1];
      const ptrR = ptrs[i];
      const left = doc.update([ptrL]);
      const right = doc.update([ptrR]);
      // should we marge left+right?
      if (isNeighbour(ptrL, ptrR) && left.has(leftMatch) && right.has(rightMatch)) {
        // merge right ptr into existing result
        res[res.length - 1] = [ptrL[0], ptrL[1], ptrR[2], ptrL[3], ptrR[4]];
      } else {
        res.push(ptrR);
      }
    }
    // return new pointers
    return doc.update(res)
  };

  const methods$d = {
    //  merge only if conditions are met
    joinIf: function (lMatch, rMatch) {
      return mergeIf(this, lMatch, rMatch)
    },
    // merge all neighbouring matches
    join: function () {
      return mergeIf(this)
    },
  };

  const methods$c = Object.assign({}, match$2, lookaround, methods$e, methods$d);
  // aliases
  methods$c.lookBehind = methods$c.before;
  methods$c.lookBefore = methods$c.before;

  methods$c.lookAhead = methods$c.after;
  methods$c.lookAfter = methods$c.after;

  methods$c.notIf = methods$c.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$c);
  };

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
    const arr = txt.split(bySlashes);
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

  const hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
  const andSign = /&&/;
  // const hasDash = /\p{Letter}[-–—]\p{Letter}/u
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
  const titleCase = str => str.charAt(0).toUpperCase() + str.substring(1);
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
    const obj = {};
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
      if (end(w) === '?') {
        obj.optional = true;
        w = stripEnd(w);
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

      //regex
      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
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
        const last = obj.choices.length - 1;
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

      //root/sense overloaded
      if (start(w) === '{' && end(w) === '}') {
        w = stripBoth(w);
        // obj.sense = w
        obj.root = w;
        if (/\//.test(w)) {
          const split = obj.root.split(/\//);
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
        obj.chunk = titleCase(w);
        obj.greedy = true;
        return obj
      }
      if (start(w) === '%' && end(w) === '%') {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
    }
    //do the actual token content
    if (start(w) === '#') {
      obj.tag = stripStart(w);
      obj.tag = titleCase(obj.tag);
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

  const hasDash$2 = /[a-z0-9][-–—][a-z]/i;

  // match 're-do' -> ['re','do']
  const splitHyphens$1 = function (regs, world) {
    const prefixes = world.model.one.prefixes;
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      const reg = regs[i];
      if (reg.word && hasDash$2.test(reg.word)) {
        let words = reg.word.split(/[-–—]/g);
        // don't split 're-cycle', etc
        if (prefixes.hasOwnProperty(words[0])) {
          continue
        }
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          const obj = Object.assign({}, reg);
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };

  // add all conjugations of this verb
  const addVerbs = function (token, world) {
    const { all } = world.methods.two.transform.verb || {};
    const str = token.root;
    if (!all) {
      return []
    }
    return all(str, world.model)
  };

  // add all inflections of this noun
  const addNoun = function (token, world) {
    const { all } = world.methods.two.transform.noun || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // add all inflections of this adjective
  const addAdjective = function (token, world) {
    const { all } = world.methods.two.transform.adjective || {};
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
        const shouldPack = token.choices.every(block => {
          if (block.length !== 1) {
            return false
          }
          const reg = block[0];
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
    let tokens = parseBlocks(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken(str, opts));
    // '~re-do~'
    tokens = splitHyphens$1(tokens, world);
    // '{walk}'
    tokens = inflectRoot(tokens, world);
    //clean up anything weird
    tokens = postProcess(tokens);
    // console.log(tokens)
    return tokens
  };

  const anyIntersection = function (setA, setB) {
    for (const elem of setB) {
      if (setA.has(elem)) {
        return true
      }
    }
    return false
  };
  // check words/tags against our cache
  const failFast = function (regs, cache) {
    for (let i = 0; i < regs.length; i += 1) {
      const reg = regs[i];
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
      // are all of the fast-or words missing?
      if (reg.fastOr !== undefined && anyIntersection(reg.fastOr, cache) === false) {
        return true
      }
    }
    return false
  };

  // fuzzy-match (damerau-levenshtein)
  // Based on  tad-lispy /node-damerau-levenshtein
  // https://github.com/tad-lispy/node-damerau-levenshtein/blob/master/index.js
  // count steps (insertions, deletions, substitutions, or transpositions)
  const editDistance = function (strA, strB) {
    const aLength = strA.length,
      bLength = strB.length;
    // fail-fast
    if (aLength === 0) {
      return bLength
    }
    if (bLength === 0) {
      return aLength
    }
    // If the limit is not defined it will be calculate from this and that args.
    const limit = (bLength > aLength ? bLength : aLength) + 1;
    if (Math.abs(aLength - bLength) > (limit || 100)) {
      return limit || 100
    }
    // init the array
    const matrix = [];
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
        const shouldUpdate =
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
    const length = Math.max(strA.length, strB.length);
    const relative = length === 0 ? 0 : steps / length;
    const similarity = 1 - relative;
    return similarity
  };

  // these methods are called with '@hasComma' in the match syntax
  // various unicode quotation-mark formats
  const startQuote =
    /([\u0022\uFF02\u0027\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F])/;

  const endQuote = /([\u0022\uFF02\u0027\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4])/;

  const hasHyphen$1 = /^[-–—]$/;
  const hasDash$1 = / [-–—]{1,3} /;

  /** search the term's 'post' punctuation  */
  const hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
  /** search the term's 'pre' punctuation  */
  // const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1

  const methods$b = {
    /** does it have a quotation symbol?  */
    hasQuote: term => startQuote.test(term.pre) || endQuote.test(term.post),
    /** does it have a comma?  */
    hasComma: term => hasPost(term, ','),
    /** does it end in a period? */
    hasPeriod: term => hasPost(term, '.') === true && hasPost(term, '...') === false,
    /** does it end in an exclamation */
    hasExclamation: term => hasPost(term, '!'),
    /** does it end with a question mark? */
    hasQuestionMark: term => hasPost(term, '?') || hasPost(term, '¿'),
    /** is there a ... at the end? */
    hasEllipses: term => hasPost(term, '..') || hasPost(term, '…'),
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
  methods$b.hasQuotation = methods$b.hasQuote;

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
      // support ~ fuzzy match
      if (reg.fuzzy === true) {
        if (reg.word === term.root) {
          return true
        }
        const score = fuzzyMatch(reg.word, term.normal);
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
      if (typeof methods$b[reg.method] === 'function' && methods$b[reg.method](term) === true) {
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
      const str = term.root || term.implicit || term.machine || term.normal;
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
    const result = doesMatch$1(t, reg, index, length);
    if (reg.negative === true) {
      return !result
    }
    return result
  };

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    const reg = Object.assign({}, state.regs[state.r], { start: false, end: false });
    const start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      // the number of terms we've matched, if we stop here
      const count = state.t - start + 1;
      //stop for next-reg match - unless we're still under our min
      if (endReg && wrapMatch(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
        if (reg.min === undefined || count >= reg.min) {
          return state.t
        }
      }
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (wrapMatch(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length) === false) {
        // is it too short?
        if (reg.min !== undefined && count < reg.min) {
          return null
        }
        return state.t
      }
    }
    // we ran out of terms - did we reach our min?
    if (reg.min !== undefined && state.t - start + 1 < reg.min) {
      return null
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
      if (wrapMatch(state.terms[t], nextReg, state.start_i + t, state.phrase_length) === true) {
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
        const tmpReg = Object.assign({}, reg, { end: false });
        if (wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  const getGroup$1 = function (state, term_index) {
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
    const { regs } = state;
    const reg = regs[state.r];

    const skipto = greedyTo(state, regs[state.r + 1]);
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
      const g = getGroup$1(state, state.t);
      // accumulate onto any tokens already captured before the wildcard,
      // so '[one .* after]' keeps its leading (and trailing) tokens
      g.length += skipto - state.t;
    }
    state.t = skipto;
    // log(`✓ |greedy|`)
    return true
  };

  const isArray$4 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // try to match a list of tokens, starting at state.t + skipN
  // returns the number of terms it consumed, or 0 for no-match
  const tryChoice = function (state, regs, skipN) {
    let len = 0;
    for (let w = 0; w < regs.length; w += 1) {
      const cr = regs[w];
      const t = state.t + skipN + len;
      if (state.terms[t] === undefined) {
        return 0
      }
      if (wrapMatch(state.terms[t], cr, state.start_i + t, state.phrase_length) !== true) {
        return 0
      }
      len += 1;
      // this can be greedy - '(foo+ bar)'
      if (cr.greedy === true) {
        // like getGreedy, anchors should not apply to the repeated terms
        const gr = Object.assign({}, cr, { start: false, end: false });
        for (let i = t + 1; i < state.terms.length; i += 1) {
          if (wrapMatch(state.terms[i], gr, state.start_i + i, state.phrase_length) !== true) {
            break
          }
          len += 1;
        }
      }
    }
    return len
  };

  // match the first choice that works - '(a b|c)'
  const tryChoices = function (state, skipN) {
    const block = state.regs[state.r];
    for (let c = 0; c < block.choices.length; c += 1) {
      const regs = block.choices[c];
      if (!isArray$4(regs)) {
        return 0
      }
      const len = tryChoice(state, regs, skipN);
      if (len > 0) {
        return len
      }
    }
    return 0
  };

  const doOrBlock = function (state) {
    const block = state.regs[state.r];
    let skipN = tryChoices(state, 0);
    if (skipN === 0) {
      return 0
    }
    // greedy or-block - keep matching choices - '(a b|c)+'
    if (block.greedy === true) {
      let more = tryChoices(state, skipN);
      while (more > 0) {
        skipN += more;
        more = tryChoices(state, skipN);
      }
    }
    return skipN
  };

  const doAndBlock = function (state) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    const reg = state.regs[state.r];
    const allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      const allWords = block.every((cr, w_index) => {
        const tryTerm = state.t + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return wrapMatch(state.terms[tryTerm], cr, state.start_i + tryTerm, state.phrase_length)
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
    const reg = regs[state.r];
    const skipNum = doOrBlock(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      // tuck in as named-group
      if (state.hasGroup === true) {
        const g = getGroup$1(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        const end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-or|`)
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      // a '!(a b)?' can pass-through without consuming anything
      if (!reg.optional) {
        state.t += 1;
      }
      return true
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  // '(foo && #Noun)' - require all matches on the term
  const andBlock = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    const skipNum = doAndBlock(state);
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      if (state.hasGroup === true) {
        const g = getGroup$1(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        const end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-and|`)
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      // a '!(a && b)?' can pass-through without consuming anything
      if (!reg.optional) {
        state.t += 1;
      }
      return true
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = wrapMatch(state.terms[t], reg, state.start_i + t, state.phrase_length);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = wrapMatch(state.terms[t], nextReg, state.start_i + t, state.phrase_length);
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

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    // match *anything* but this term
    const tmpReg = Object.assign({}, reg);
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    const found = wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
    if (found) {
      return false//bye
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      const nextReg = regs[state.r + 1];
      if (nextReg) {
        const fNext = wrapMatch(state.terms[state.t], nextReg, state.start_i + state.t, state.phrase_length);
        if (fNext) {
          state.r += 1;
        } else if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          const fNext2 = wrapMatch(state.terms[state.t], regs[state.r + 2], state.start_i + state.t, state.phrase_length);
          if (fNext2) {
            state.r += 2;
          }
        }
      }
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      return negGreedy(state, tmpReg, regs[state.r + 1])
    }
    state.t += 1;
    return true
  };

  // 'foo? foo' matches are tricky.
  const foundOptional = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const term = state.terms[state.t];
    // does the next reg match it too?
    const nextRegMatched = wrapMatch(term, regs[state.r + 1], state.start_i + state.t, state.phrase_length);
    if (reg.negative || nextRegMatched) {
      // but does the next reg match the next term??
      // only skip if it doesn't
      const nextTerm = state.terms[state.t + 1];
      if (!nextTerm || !wrapMatch(nextTerm, regs[state.r + 1], state.start_i + state.t + 1, state.phrase_length)) {
        state.r += 1;
      }
    }
  };

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    const reg = regs[state.r];
    // foo{2,4} min-lengths are enforced inside getGreedy
    state.t = getGreedy(state, regs[state.r + 1]);
    if (state.t === null) {
      return null //greedy was too short
    }
    // 'foo+$' - if also an end-anchor, ensure we really reached the end
    if (reg.end === true && state.start_i + state.t !== phrase_length) {
      return null //greedy didn't reach the end
    }
    return true
  };

  // for: ['we', 'have']
  // a match for "we have" should work as normal
  // but matching "we've" should skip over implict terms
  const contractionSkip = function (state) {
    const term = state.terms[state.t];
    const reg = state.regs[state.r];
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      const nextTerm = state.terms[state.t + 1];
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

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    const reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$1(state, startAt);
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
    const reg = regs[state.r];
    const term = state.terms[state.t];
    const startAt = state.t;
    // if it's a negative optional match... :0
    if (reg.optional && regs[state.r + 1] && reg.negative) {
      return true
    }
    // okay, it was a match, but if it's optional too,
    // we should check the next reg too, to skip it?
    if (reg.optional && regs[state.r + 1]) {
      foundOptional(state);
    }
    // Contraction skip:
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      contractionSkip(state);
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
      const alive = greedyMatch(state);
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
    const state = {
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
      const reg = regs[state.r];
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
        const alive = doAstrix(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-OR - multi-word OR (a|b|foo bar)
      if (reg.choices !== undefined && reg.operator === 'or') {
        const alive = orBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-AND - multi-word AND (#Noun && foo) blocks
      if (reg.choices !== undefined && reg.operator === 'and') {
        const alive = andBlock(state);
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
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support 'foo*$' until the end
      if (isEndGreedy(reg, state) === true) {
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, it doesn't match - but maybe it wasn't *supposed* to?
      if (reg.negative) {
        // we want *anything* but this term
        const alive = doNegative(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, finally test the term-reg
      const hasMatch = wrapMatch(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
      if (hasMatch === true) {
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      //ok who cares, keep going
      if (reg.optional === true) {
        continue
      }

      // finally, we die
      return null
    }
    //return our results, as pointers
    const pntr = [null, start_i, state.t + start_i];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    const groups = {};
    Object.keys(state.groups).forEach(k => {
      const o = state.groups[k];
      const start = start_i + o.start;
      groups[k] = [null, start, start + o.length];
    });
    return { pointer: pntr, groups: groups }
  };

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
  const getGroup = function (res, group) {
    const ptrs = [];
    const byGroup = {};
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

  const notIf = function (results, not, docs) {
    results = results.filter(res => {
      const [n, start, end] = res.pointer;
      const terms = docs[n].slice(start, end);
      for (let i = 0; i < terms.length; i += 1) {
        const slice = terms.slice(i);
        const found = tryHere(slice, not, i, terms.length);
        if (found !== null) {
          return false
        }
      }
      return true
    });
    return results
  };

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n) {
    let res = tryHere(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$1 = function (docs, todo, cache) {
    cache = cache || [];
    const { regs, group, justOne } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }

    const minLength = regs.filter(r => r.optional !== true && r.negative !== true).length;
    docs: for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        const foundStart = handleStart(terms, regs, n);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        const slice = terms.slice(i);
        // ensure it's long-enough
        if (slice.length < minLength) {
          break
        }
        let res = tryHere(slice, regs, i, terms.length);
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
          const end = res.pointer[2];
          if (Math.abs(end - 1) > i) {
            i = Math.abs(end - 1);
          }
        }
      }
    }
    // ensure any end-results ($) match until the last term
    if (regs[regs.length - 1].end === true) {
      results = results.filter(res => {
        const n = res.pointer[0];
        return docs[n].length === res.pointer[2]
      });
    }
    if (todo.notIf) {
      results = notIf(results, todo.notIf, docs);
    }
    // grab the requested group
    results = getGroup(results, group);
    // add ids to pointers
    results.ptrs.forEach(ptr => {
      const [n, start, end] = ptr;
      ptr[3] = docs[n][start].id;//start-id
      ptr[4] = docs[n][end - 1].id;//end-id
    });
    return results
  };

  const methods$a = {
    one: {
      termMethods: methods$b,
      parseMatch: syntax,
      match: runMatch$1,
    },
  };

  var lib$3 = {
    /** pre-parse any match statements */
    parseMatch: function (str, opts) {
      const world = this.world();
      const killUnicode = world.methods.one.killUnicode;
      if (killUnicode) {
        str = killUnicode(str, world);
      }
      return world.methods.one.parseMatch(str, opts, world)
    }
  };

  var match = {
    api: matchAPI,
    methods: methods$a,
    lib: lib$3,
  };

  const isClass = /^\../;
  const isId = /^#./;

  const escapeXml = str => {
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
    const starts = {};
    const ends = {};
    Object.keys(obj).forEach(k => {
      let res = obj[k];
      const tag = toTag(k);
      if (typeof res === 'string') {
        res = doc.match(res);
      }
      res.docs.forEach(terms => {
        // don't highlight implicit terms
        if (terms.every(t => t.implicit)) {
          return
        }
        const a = terms[0].id;
        starts[a] = starts[a] || [];
        starts[a].push(tag.start);
        const b = terms[terms.length - 1].id;
        ends[b] = ends[b] || [];
        ends[b].push(tag.end);
      });
    });
    return { starts, ends }
  };

  const html = function (obj) {
    // index ids to highlight
    const { starts, ends } = getIndex(this, obj);
    // create the text output
    let out = '';
    this.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          out += starts[t.id].join('');
        }
        out += t.pre || '';
        out += t.text || '';
        if (ends.hasOwnProperty(t.id)) {
          out += ends[t.id].join('');
        }
        out += t.post || '';
      }
    });
    return out
  };
  var html$1 = { html };

  const trimEnd = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]+$/;
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\u201D\]]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach(t => {
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
    if (opts.keepEndPunct === false) {
      // don't remove ':)' etc
      if (!docs[0][0].tags.has('Emoticon')) {
        text = text.replace(trimStart, '');
      }
      // remove ending periods
      const last = docs[docs.length - 1];
      if (!last[last.length - 1].tags.has('Emoticon')) {
        text = text.replace(trimEnd, '');
      }
      // kill end quotations
      if (text.endsWith(`'`) && !text.endsWith(`s'`)) {
        text = text.replace(/'/, '');
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

  /* eslint-disable no-bitwise */
  /* eslint-disable no-mixed-operators */
  /* eslint-disable no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  const k = [];
  let i$1 = 0;
  for (; i$1 < 64; ) {
    k[i$1] = 0 | (Math.sin(++i$1 % Math.PI) * 4294967296);
  }

  const md5 = function (s) {
    let b,
      c,
      d,
      j = decodeURI(encodeURI(s)) + '\x80',
      a = j.length;

    const h = [(b = 0x67452301), (c = 0xefcdab89), ~b, ~c],
      words = [];

    s = (--a / 4 + 2) | 15;

    words[--s] = a * 8;

    for (; ~a; ) {
      words[a >> 2] |= j.charCodeAt(a) << (8 * a--);
    }

    for (i$1 = j = 0; i$1 < s; i$1 += 16) {
      a = h;

      for (
        ;
        j < 64;
        a = [
          (d = a[3]),
          b +
            (((d =
              a[0] +
              [(b & c) | (~b & d), (d & b) | (~d & c), b ^ c ^ d, c ^ (b | ~d)][(a = j >> 4)] +
              k[j] +
              ~~words[i$1 | ([j, 5 * j + 1, 3 * j + 5, 7 * j][a] & 15)]) <<
              (a = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * a + (j++ % 4)])) |
              (d >>> -a)),
          b,
          c,
        ]
      ) {
        b = a[1] | 0;
        c = a[2];
      }
      for (j = 4; j; ) h[--j] += a[j];
    }

    for (s = ''; j < 32; ) {
      s += ((h[j >> 3] >> ((1 ^ j++) * 4)) & 15).toString(16);
    }

    return s
  };
  // console.log(md5('food-safety'))

  const defaults$1 = {
    text: true,
    terms: true,
  };

  const opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return Object.assign({}, a, b)
  };

  const fns$1 = {
    text: terms => textFromTerms(terms, { keepPunct: true }, false),
    normal: terms => textFromTerms(terms, merge(fmts.normal, { keepPunct: true }), false),
    implicit: terms => textFromTerms(terms, merge(fmts.implicit, { keepPunct: true }), false),

    machine: terms => textFromTerms(terms, opts, false),
    root: terms => textFromTerms(terms, merge(opts, { form: 'root' }), false),

    hash: terms => md5(textFromTerms(terms, { keepPunct: true }, false)),

    offset: terms => {
      const len = fns$1.text(terms).length;
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start,
        length: len,
      }
    },
    terms: terms => {
      return terms.map(t => {
        const term = Object.assign({}, t);
        term.tags = Array.from(t.tags);
        return term
      })
    },
    confidence: (_terms, view, i) => view.eq(i).confidence(),
    syllables: (_terms, view, i) => view.eq(i).syllables(),
    sentence: (_terms, view, i) => view.eq(i).fullSentence().text(),
    dirty: terms => terms.some(t => t.dirty === true),
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
      const res = {};
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
      const res = toJSON(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };
  methods$9.data = methods$9.json;

  const isClientSide = () => typeof window !== 'undefined' && window.document;

  //output some helpful stuff to the console
  const debug$1 = function (fmt) {
    const debugMethods = this.methods.one.debug || {};
    // see if method name exists
    if (fmt && debugMethods.hasOwnProperty(fmt)) {
      debugMethods[fmt](this);
      return this
    }
    // log default client-side view
    if (isClientSide()) {
      debugMethods.clientSide(this);
      return this
    }
    // else, show regular server-side tags view
    debugMethods.tags(this);
    return this
  };

  const toText$1 = function (term) {
    const pre = term.pre || '';
    const post = term.post || '';
    return pre + term.text + post
  };

  const findStarts = function (doc, obj) {
    const starts = {};
    Object.keys(obj).forEach(reg => {
      const m = doc.match(reg);
      m.fullPointer.forEach(a => {
        starts[a[3]] = { fn: obj[reg], end: a[2] };
      });
    });
    return starts
  };

  const wrap = function (doc, obj) {
    // index ids to highlight
    const starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (starts.hasOwnProperty(t.id)) {
          const { fn, end } = starts[t.id];
          const m = doc.update([[n, i, end]]);
          text += terms[i].pre || '';
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText$1(t);
        }
      }
    });
    return text
  };

  // the 'spec' output format - a clean sentence + an ordered list of top-level tags
  // designed to round-trip between compromise and LLMs (see docs/spec-format.md)

  // roots that describe a token's shape, not its part-of-speech - never picked over a real POS
  const attributeTags = new Set(['Hyphenated', 'Prefix', 'SlashedTerm']);

  // walk a tag up to its top-level (root) ancestor
  const rootOf = function (tag, tagSet) {
    const entry = tagSet[tag];
    if (!entry || !entry.parents || entry.parents.length === 0) {
      return tag
    }
    for (let i = 0; i < entry.parents.length; i += 1) {
      const p = entry.parents[i];
      if (tagSet[p] && (!tagSet[p].parents || tagSet[p].parents.length === 0)) {
        return p
      }
    }
    return entry.parents[entry.parents.length - 1]
  };

  // reduce a term's tag-set to a single top-level tag (or '-' when untagged)
  const slotForTerm = function (term, tagSet) {
    const tags = Array.from(term.tags || []);
    if (tags.length === 0) {
      return '-'
    }
    const primary = tags.find(t => !attributeTags.has(rootOf(t, tagSet))) || tags[0];
    return rootOf(primary, tagSet)
  };

  const makeAliases = function (tagSet) {
    const aliases = {};
    for (const tag in tagSet) {
      const entry = tagSet[tag];
      if (entry.alias) {
        aliases[tag] = entry.alias;
      }
    }
    return aliases
  };

  // one line per sentence: '<text> {Tag,Tag,…}'
  const toSpec = function (doc, world) {
    const tagSet = world.model.one.tagSet;
    const aliases = makeAliases(tagSet);
    return doc.docs.map(terms => {
      const text = terms.reduce((str, t) => str + t.pre + t.text + t.post, '').trim();
      const tags = terms.map(t => {
        let tag = slotForTerm(t, tagSet);
        return aliases[tag] || tag
      }).join(',');
      return `${text} {${tags}}`
    }).join('\n')
  };

  const isObject$2 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // sort by frequency
  const topk = function (arr) {
    const obj = {};
    arr.forEach(a => {
      obj[a] = obj[a] || 0;
      obj[a] += 1;
    });
    const res = Object.keys(obj).map(k => {
      return { normal: k, count: obj[k] }
    });
    return res.sort((a, b) => (a.count > b.count ? -1 : 0))
  };

  /** some named output formats */
  const out = function (method) {
    // support custom outputs
    if (isObject$2(method)) {
      return wrap(this, method)
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
    // tagged-sentence format for LLMs (see docs/spec-format.md)
    if (method === 'spec') {
      return toSpec(this, this.world)
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
      const arr = this.docs.map(terms => {
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
      this.docs.forEach(terms => {
        let words = terms.map(t => t.text);
        words = words.filter(t => t);
        list = list.concat(words);
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
      return wrap(this, obj)
    },
  };

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && fmts.hasOwnProperty(fmt)) {
        opts = Object.assign({}, fmts[fmt]);
      } else if (fmt && isObject$1(fmt)) {
        opts = Object.assign({}, fmt); //todo: fixme
      }
      // is it a full document?
      if (opts.keepSpace === undefined && !this.isFull()) {
        //
        opts.keepSpace = false;
      }
      if (opts.keepEndPunct === undefined && this.pointer) {
        const ptr = this.pointer[0];
        if (ptr && ptr[1]) {
          opts.keepEndPunct = false;
        } else {
          opts.keepEndPunct = true;
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

  const methods$7 = Object.assign({}, methods$8, text, methods$9, html$1);

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$7);
  };

  /* eslint-disable no-console */
  const logClientSide = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      const terms = m.docs[0];
      const out = terms.map(t => {
        let text = t.text || '-';
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        const tags = '[' + Array.from(t.tags).join(', ') + ']';
        return { text, tags }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };

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

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!model.one.tagSet.hasOwnProperty(tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
    const { docs, model } = view;
    if (docs.length === 0) {
      console.log(cli.blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(cli.blue('\n  ┌─────────'));
      terms.forEach(t => {
        const tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = cli.yellow(text);
        let word = "'" + text + "'";
        if (t.reference) {
          const str = view.update([t.reference]).text('normal');
          word += ` - ${cli.dim(cli.i('[' + str + ']'))}`;
        }
        word = word.padEnd(18);
        const str = cli.blue('  │ ') + cli.i(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const showChunks = function (view) {
    const { docs } = view;
    console.log('');
    docs.forEach(terms => {
      const out = [];
      terms.forEach(term => {
        if (term.chunk === 'Noun') {
          out.push(cli.blue(term.implicit || term.normal));
        } else if (term.chunk === 'Verb') {
          out.push(cli.green(term.implicit || term.normal));
        } else if (term.chunk === 'Adjective') {
          out.push(cli.yellow(term.implicit || term.normal));
        } else if (term.chunk === 'Pivot') {
          out.push(cli.red(term.implicit || term.normal));
        } else {
          out.push(term.implicit || term.normal);
        }
      });
      console.log(out.join(' '), '\n');
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const split = (txt, offset, index) => {
    const buff = index * 9; //there are 9 new chars addded to each highlight
    const start = offset.start + buff;
    const end = start + offset.length;
    const pre = txt.substring(0, start);
    const mid = txt.substring(start, end);
    const post = txt.substring(end, txt.length);
    return [pre, mid, post]
  };

  const spliceIn = function (txt, offset, index) {
    const parts = split(txt, offset, index);
    return `${parts[0]}${cli.blue(parts[1])}${parts[2]}`
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    const bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] = bySentence[ptr[0]] || [];
      bySentence[ptr[0]].push(ptr);
    });
    Object.keys(bySentence).forEach(k => {
      const full = doc.update([[Number(k)]]);
      let txt = full.text();
      const matches = doc.update(bySentence[k]);
      const json = matches.json({ offset: true });
      json.forEach((obj, i) => {
        txt = spliceIn(txt, obj.offset, i);
      });
      console.log(txt);
    });
    console.log('\n');
  };

  const debug = {
    tags: showTags,
    clientSide: logClientSide,
    chunks: showChunks,
    highlight: showHighlight,
  };

  const lastBrace = /\{(?=[^{]*$)/; // split on the last { only
  const comment = /\}[ \t]*#.*$/; // an optional '# comment' after the last {tags} block

  // parse the spec output
  const parseLine = function (line = '') {
    let [text, tags] = line.split(lastBrace);
    if (tags === undefined) {
      return { text, tags: [] } // no {tags} block on this line
    }
    tags = tags.replace(comment, '}'); // drop the comment - only ever one, always last
    tags = tags.split(',').map(tag => tag.trim());
    let lastTag = tags[tags.length - 1];
    tags[tags.length - 1] = lastTag.replace(/\}$/, '');
    tags = tags.map(tag => tag.split('|').map(t => t.trim()));
    tags = tags.filter(arr => arr.some(t => t !== '')); // drop empty '{}'
    return { text, tags }
  };

  // make a match syntax looping through the arrays of tags
  const toMatchString = function (tags, aliases) {
    return tags.map(arr => {
      arr = arr.map(str => {
        return '#' + (aliases[str] || str)
      });
      if (arr.length > 1) {
        return `(${arr.join(' && ')})`
      }
      return arr[0]
    }).join(' ')
  };

  // parse the adhoc output of out('spec')
  // note: this(text), not this.tokenize().compute(hooks) - tokenize already
  // splits contractions, so re-running hooks would split them twice
  const fromSpec = function (spec) {
    let cleanText = spec.split('\n').filter(line => line.trim()).map(line => {
      return parseLine(line).text
    }).join('\n');
    return this(cleanText)
  };

  // rebuild spec-formatted tag list
  const toTagList = function (tags) {
    return tags.map(arr => arr.join('|')).join(',')
  };

  // compare the tagged text output of out('spec')
  const testSpec = function (spec, verbose = true, throwError = false) {
    let world = this.world();
    let aliases = {};
    // expand tag aliases
    let tagSet = world.model.one.tagSet;
    Object.keys(tagSet).forEach(k => {
      if (tagSet[k].alias) {
        aliases[tagSet[k].alias] = k;
      }
    });
    let failingLines = spec.split('\n').filter(line => line.trim()).map(line => {
      let { text, tags } = parseLine(line);
      // parse it
      let doc = this(text);
      // make compromise-compatible match string
      let matchStr = toMatchString(tags, aliases);
      let didMatch = doc.has(matchStr);
      if (verbose !== false) {
        let char = didMatch ? '✅' : '❌';
        console.log(`${char} ${text} {${toTagList(tags)}}`); //eslint-disable-line no-console
      }
      if (didMatch === false && throwError === true) {
        throw new Error(`❌ ${text} {${toTagList(tags)}}`)
      }
      return didMatch ? null : text
    }).filter(Boolean).join('\n');
    // return a doc of only the failing lines - empty means everything passed
    return this(failingLines)
  };

  var output = {
    lib: {
      fromSpec,
      testSpec,
    },
    api: addAPI$1,
    methods: {
      one: {
        hash: md5,
        debug,
      },
    },
  };

  // do the pointers intersect?
  const doesOverlap = function (a, b) {
    if (a[0] !== b[0]) {
      return false
    }
    const [, startA, endA] = a;
    const [, startB, endB] = b;
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
    const byN = {};
    ptrs.forEach(ref => {
      byN[ref[0]] = byN[ref[0]] || [];
      byN[ref[0]].push(ref);
    });
    return byN
  };

  // remove exact duplicates
  const uniquePtrs = function (arr) {
    const obj = {};
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
    const [n, start] = full;
    const mStart = m[1];
    const mEnd = m[2];
    const res = {};
    // is there space before the match?
    if (start < mStart) {
      const end = mStart < full[2] ? mStart : full[2]; // find closest end-point
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
    const byN = indexN(m);
    const res = [];
    full.forEach(ptr => {
      const [n] = ptr;
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
        const found = pivotBy(carry, p);
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

  const max$1 = 20;

  // sweep-around looking for our start term uuid
  const blindSweep = function (id, doc, n) {
    for (let i = 0; i < max$1; i += 1) {
      // look up a sentence
      if (doc[n - i]) {
        const index = doc[n - i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n - i, index]
        }
      }
      // look down a sentence
      if (doc[n + i]) {
        const index = doc[n + i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n + i, index]
        }
      }
    }
    return null
  };

  const repairEnding = function (ptr, document) {
    const [n, start, , , endId] = ptr;
    const terms = document[n];
    // look for end-id
    const newEnd = terms.findIndex(t => t.id === endId);
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
      // eslint-disable-next-line prefer-const
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
        const wild = blindSweep(id, document, n);
        if (wild !== null) {
          const len = end - start;
          terms = document[wild[0]].slice(wild[1], wild[1] + len);
          // actually change the pointer
          const startId = terms[0] ? terms[0].id : null;
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

  // flat list of terms from nested document
  const termList = function (docs) {
    const arr = [];
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
      getDoc: getDoc$1,
      pointer: {
        indexN,
        splitAll,
      }
    },
  };

  // a union is a + b, minus duplicates
  const getUnion = function (a, b) {
    const both = a.concat(b);
    const byN = indexN(both);
    let res = [];
    both.forEach(ptr => {
      const [n] = ptr;
      if (byN[n].length === 1) {
        // we're alone on this sentence, so we're good
        res.push(ptr);
        return
      }
      // there may be overlaps
      const hmm = byN[n].filter(m => doesOverlap(ptr, m));
      hmm.push(ptr);
      const range = getExtent(hmm);
      res.push(range);
    });
    res = uniquePtrs(res);
    return res
  };

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
    const res = [];
    const found = splitAll(refs, not);
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

  // console.log(subtract([[0, 0, 2]], [[0, 0, 1]]))
  // console.log(subtract([[0, 0, 2]], [[0, 1, 2]]))

  // [a,a,a,a,-,-,]
  // [-,-,b,b,b,-,]
  // [-,-,x,x,-,-,]
  const intersection = function (a, b) {
    // find the latest-start
    const start = a[1] < b[1] ? b[1] : a[1];
    // find the earliest-end
    const end = a[2] > b[2] ? b[2] : a[2];
    // does it form a valid pointer?
    if (start < end) {
      return [a[0], start, end]
    }
    return null
  };

  const getIntersection = function (a, b) {
    const byN = indexN(b);
    const res = [];
    a.forEach(ptr => {
      let hmm = byN[ptr[0]] || [];
      hmm = hmm.filter(p => doesOverlap(ptr, p));
      // no sentence-pairs, so no intersection
      if (hmm.length === 0) {
        return
      }
      hmm.forEach(h => {
        const overlap = intersection(ptr, h);
        if (overlap) {
          res.push(overlap);
        }
      });
    });
    return res
  };

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
      const [n, start] = ptr;
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
    let ptrs = getUnion(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$5.and = methods$5.union;

  // only parts they both have
  methods$5.intersection = function (m) {
    m = getDoc(m, this);
    let ptrs = getIntersection(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // only parts of a that b does not have
  methods$5.not = function (m) {
    m = getDoc(m, this);
    let ptrs = subtract(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$5.difference = methods$5.not;

  // get opposite of a match
  methods$5.complement = function () {
    const doc = this.all();
    let ptrs = subtract(doc.fullPointer, this.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // remove overlaps
  methods$5.settle = function () {
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };

  const addAPI = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$5);
  };

  var pointers = {
    methods: methods$6,
    api: addAPI,
  };

  var lib$2 = {
    // compile a list of matches into a match-net
    buildNet: function (matches) {
      const methods = this.methods();
      const net = methods.one.buildNet(matches, this.world());
      net.isNet = true;
      return net
    }
  };

  const api$5 = function (View) {

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
        const ptr = o.pointer;
        const term = docs[ptr[0]][ptr[1]];
        const len = ptr[2] - ptr[1];
        if (term.index) {
          o.pointer = [
            term.index[0],
            term.index[1],
            ptr[1] + len
          ];
        }
        return o
      });
      const ptrs = found.map(o => o.pointer);
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
    const needs = [];
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
    const wants = [];
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
              const n = getTokenNeeds(r);
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

  const parse$1 = function (matches, world) {
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
      const { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
    });
    return matches
  };

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$1(matches, world);

    // collect by wants and needs
    const hooks = {};
    matches.forEach(obj => {
      // add needs
      obj.needs.forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
      // add wants
      obj.wants.forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
    });
    // remove duplicates
    Object.keys(hooks).forEach(k => {
      const already = {};
      hooks[k] = hooks[k].filter(obj => {
        if (typeof already[obj.match] === 'boolean') {
          return false
        }
        already[obj.match] = true;
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    const always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      always
    }
  };

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
      const already = {};
      maybe = maybe.filter(m => {
        if (typeof already[m.match] === 'boolean') {
          return false
        }
        already[m.match] = true;
        return true
      });
      return maybe
    })
  };

  // filter-down list of maybe-matches
  const localTrim = function (maybeList, docCache) {
    return maybeList.map((list, n) => {
      const haves = docCache[n];
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
        const found = obj.wants.filter(str => haves.has(str)).length;
        return found >= obj.minWant
      });
      return list
    })
  };

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, docCache, methods, opts) {
    const results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      for (let i = 0; i < maybeList[n].length; i += 1) {
        const m = maybeList[n][i];
        // ok, actually do the work.
        const res = methods.one.match([document[n]], m);
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
            const todo = Object.assign({}, m, { pointer: ptr });
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

  const tooSmall = function (maybeList, document) {
    return maybeList.map((arr, i) => {
      const termCount = document[i].length;
      arr = arr.filter(o => {
        return termCount >= o.minWords
      });
      return arr
    })
  };

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    const docCache = methods.one.cacheDoc(document);
    // collect possible matches for this document
    let maybeList = getHooks(docCache, net.hooks);
    // ensure all defined needs are met for each match
    maybeList = localTrim(maybeList, docCache);
    // add unchacheable matches to each sentence's todo-list
    if (net.always.length > 0) {
      maybeList = maybeList.map(arr => arr.concat(net.always));
    }
    // if we don't have enough words
    maybeList = tooSmall(maybeList, document);

    // now actually run the matches
    const results = runMatch(maybeList, document, docCache, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };

  // is this tag consistent with the tags they already have?
  const canBe$1 = function (terms, tag, model) {
    const tagSet = model.one.tagSet;
    if (!tagSet.hasOwnProperty(tag)) {
      return true
    }
    const not = tagSet[tag].not || [];
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      for (let k = 0; k < not.length; k += 1) {
        if (term.tags.has(not[k]) === true) {
          return false //found a tag conflict - bail!
        }
      }
    }
    return true
  };

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
      console.log(`\n\n  \x1b[32m→ ${list.length} post-tagger:\x1b[0m`); //eslint-disable-line
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      const reason = todo.reason || todo.match;
      const terms = getDoc([todo.pointer], document)[0];
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
        // quick and dirty plural tagger 😕
        if (todo.tag === 'Noun' && looksPlural) {
          const term = terms[terms.length - 1];
          if (looksPlural(term.text)) {
            setTag([term], 'Plural', world, todo.safe, 'quick-plural');
          } else {
            setTag([term], 'Singular', world, todo.safe, 'quick-singular');
          }
        }
        // allow freezing this match, too
        if (todo.freeze === true) {
          terms.forEach(term => (term.frozen = true));
        }
      }
      if (todo.unTag !== undefined) {
        unTag(terms, todo.unTag, world, todo.safe, reason);
      }
      // allow setting chunks, too
      if (todo.chunk) {
        terms.forEach(t => (t.chunk = todo.chunk));
      }
    })
  };

  var methods$4 = {
    buildNet,
    bulkMatch: sweep$1,
    bulkTagger: tagger$1
  };

  var sweep = {
    lib: lib$2,
    api: api$5,
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
    // don't overwrite any tags, if term is frozen
    if (term.frozen === true) {
      isSafe = true;
    }
    // for known tags, do logical dependencies first
    const known = tagSet[tag];
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
    const tags = tagString.split(isMulti);
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
    const word = terms
      .map(t => {
        return t.text || '[' + t.implicit + ']'
      })
      .join(' ');
    if (typeof tag !== 'string' && tag.length > 2) {
      tag = tag.slice(0, 2).join(', #') + ' +'; //truncate the list of tags
    }
    tag = typeof tag !== 'string' ? tag.join(', #') : tag;
    console.log(` ${yellow(word).padEnd(24)} \x1b[32m→\x1b[0m #${tag.padEnd(22)}  ${i(reason)}`); // eslint-disable-line
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
      console.warn(`compromise: Invalid tag '${tag}'`); // eslint-disable-line
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

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet) {
    tag = tag.trim().replace(/^#/, '');
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      // don't untag anything if term is frozen
      if (term.frozen === true) {
        continue
      }
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        continue
      }
      // for known tags, do logical dependencies first
      const known = tagSet[tag];
      // removing #Verb should also remove #PastTense
      if (known && known.children.length > 0) {
        for (let o = 0; o < known.children.length; o += 1) {
          term.tags.delete(known.children[o]);
        }
      }
      term.tags.delete(tag);
    }
  };

  // quick check if this tag will require any untagging
  const canBe = function (term, tag, tagSet) {
    if (!tagSet.hasOwnProperty(tag)) {
      return true // everything can be an unknown tag
    }
    const not = tagSet[tag].not || [];
    for (let i = 0; i < not.length; i += 1) {
      if (term.tags.has(not[i])) {
        return false
      }
    }
    return true
  };

  const e=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e({id:t}))),n}return [e({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e({});return t.forEach((t=>{if((t=e(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r(s=c).forEach(e),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,true)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f$1=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;let g$1 = class g{constructor(e={}){Object.defineProperty(this,"json",{enumerable:false,value:e,writable:true});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=true),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e({});return new g(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e({id:t,props:n});return this.json.children.push(r),new g(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r(this.json)}fillDown(){var e;return e=this.json,r(e,((e,t)=>{t.props=f$1(t.props,e.props);})),this}depth(){u(this.json);let e=r(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}};const _=function(e){let t=s(e);return new g$1(t)};_.prototype.plugin=function(e){e(this);};

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

  const getColor = function (node) {
    if (colors.hasOwnProperty(node.id)) {
      return colors[node.id]
    }
    if (colors.hasOwnProperty(node.is)) {
      return colors[node.is]
    }
    const found = node._cache.parents.find(c => colors[c]);
    return colors[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    nodes.forEach(node => {
      const { not, also, is, novel } = node.props;
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
        color: getColor(node),
        alias: node.alias,
      };
    });
    // lastly, add all children of all nots
    Object.keys(res).forEach(k => {
      const nots = new Set(res[k].not);
      res[k].not.forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
    });
    return res
  };

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
      const nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not) {
          tags[no].not.push(k);
        }
      });
    });
    return tags
  };

  // 'fill-down' parent logic inference
  const compute$1 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      const o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is, novel: o.novel };
      return { id: k, parent: o.is, props, children: [], alias: o.alias }
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
    tags = validate(tags, already);

    const allTags = Object.assign({}, already, tags);
    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$1(allTags);
    // convert it to our final format
    const res = fmt(nodes);
    return res
  };

  var methods$3 = {
    one: {
      setTag,
      unTag,
      addTags: addTags$1,
      canBe,
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
      const terms = this.termList();
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
      const terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, model } = this;
      // logger
      if (verbose === true) {
        console.log(' -  ', input, reason || '');
      }
      const tagSet = model.one.tagSet;
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
      const tagSet = this.model.one.tagSet;
      const canBe = this.methods.one.canBe;
      const nope = [];
      this.document.forEach((terms, n) => {
        terms.forEach((term, i) => {
          if (!canBe(term, tag, tagSet)) {
            nope.push([n, i, i + 1]);
          }
        });
      });
      const noDoc = this.update(nope);
      return this.difference(noDoc)
    },
  };

  const tagAPI = function (View) {
    Object.assign(View.prototype, fns);
  };

  // wire-up more pos-tags to our model
  const addTags = function (tags) {
    const { model, methods } = this.world();
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    const res = fn(tags, tagSet);
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
      const aKids = kids.length;
      kids = tagSet[b].children || [];
      const bKids = kids.length;
      return aKids - bKids
    });
    return tags
  };

  const tagRank = function (view) {
    const { document, world } = view;
    const tagSet = world.model.one.tagSet;
    document.forEach(terms => {
      terms.forEach(term => {
        const tags = Array.from(term.tags);
        term.tagRank = sortByKids(tags, tagSet);
      });
    });
  };

  var tag = {
    model: {
      one: { tagSet: {} }
    },
    compute: {
      tagRank
    },
    methods: methods$3,
    api: tagAPI,
    lib: lib$1
  };

  // split by periods, question marks, unicode ⁇, etc
  // also ।॥ (devanagari), ؟ (arabic), ۔ (urdu), ։ (armenian), ።፧ (ethiopic), ။ (burmese), ។ (khmer)
  const initSplit = /([.!?\u203D\u2E18\u203C\u2047-\u2049\u0964\u0965\u061F\u06D4\u0589\u1362\u1367\u104B\u17D4\u3002]+\s)/g;
  // merge these back into prev sentence
  const splitsOnly = /^[.!?\u203D\u2E18\u203C\u2047-\u2049\u0964\u0965\u061F\u06D4\u0589\u1362\u1367\u104B\u17D4\u3002]+\s$/;
  const newLine = /((?:\r?\n|\r)+)/; // Match different new-line formats

  // CJK full-stops 。！？｡ are never used in numbers or abbreviations,
  // so they can end a sentence without any whitespace after them.
  // A full-stop followed by a closing bracket 」』）” only ends the sentence when the
  // bracket is followed by whitespace, another opening bracket, or the end of the text
  //  - '「行きません。」と言った' stays together,  '「はい。」「いいえ。」' splits
  const hasCjkStop = /[\u3002\uFF01\uFF1F\uFF61]/;
  const cjkStops = '\\u3002\\uFF01\\uFF1F\\uFF61'; // 。！？｡
  const allStops = '.!?\\u203D\\u2E18\\u203C\\u2047-\\u2049' + '\u0964\u0965\u061F\u06D4\u0589\u1362\u1367\u104B\u17D4' + cjkStops;
  const openers = '\\u300C\\u300E\\uFF08\\u3010\\u3014\\u300A\\u3008\\u201C'; // 「『（【〔《〈“
  const closers = '\\u300D\\u300F\\uFF09\\u3011\\u3015\\u300B\\u3009\\u201D'; // 」』）】〕》〉”
  const initSplitCjk = new RegExp(
    `([${allStops}]+\\s|[${cjkStops}]+(?![${closers}${cjkStops}])|[${cjkStops}]+[${closers}]+(?=[\\s${openers}]|$))`,
    'g'
  );
  const splitsOnlyCjk = new RegExp(`^(?:[${allStops}]+\\s|[${cjkStops}]+[${closers}]*)$`);

  // Start with a regex:
  const basicSplit = function (text) {
    const all = [];
    // japanese/chinese text has no whitespace after its full-stops
    const isCjk = hasCjkStop.test(text);
    const splitReg = isCjk ? initSplitCjk : initSplit;
    const onlyReg = isCjk ? splitsOnlyCjk : splitsOnly;
    //first, split by newline
    const lines = text.split(newLine);
    for (let i = 0; i < lines.length; i++) {
      //split by period, question-mark, and exclamation-mark
      const arr = lines[i].split(splitReg);
      for (let o = 0; o < arr.length; o++) {
        // merge 'foo' + '.'
        if (arr[o + 1] && onlyReg.test(arr[o + 1]) === true) {
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

  // a letter, number, or symbol/emoji in any script - otherwise it's only punctuation
  const hasLetter$1 = /[\p{L}\p{N}\p{So}]/u;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    const chunks = [];
    for (let i = 0; i < splits.length; i++) {
      const s = splits[i];
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

  const hasNewline = function (c) {
    return Boolean(c.match(/\n$/))
  };

  //loop through these chunks, and join the non-sentence chunks back together..
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    const sentences = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && !isSentence(c, abbrevs) && !hasNewline(c)) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
    return sentences
  };

  /* eslint-disable regexp/no-dupe-characters-character-class */

  // merge embedded quotes into 1 sentence
  // like - 'he said "no!" and left.'
  const MAX_QUOTE = 280;// ¯\_(ツ)_/¯

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
    '\u300C': '\u300D', // 'CornerBrackets' 「」
    '\u300E': '\u300F', // 'WhiteCornerBrackets' 『』
  };
  const openQuote = RegExp('[' + Object.keys(pairs).join('') + ']', 'g');
  const closeQuote = RegExp('[' + Object.values(pairs).join('') + ']', 'g');

  const closesQuote = function (str) {
    if (!str) {
      return false
    }
    const m = str.match(closeQuote);
    if (m !== null && m.length === 1) {
      return true
    }
    return false
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      // do we have an open-quote and not a closed one?
      const m = split.match(openQuote);
      if (m !== null && m.length === 1) {
        // is the quote already closed in this chunk? - '“Yes!” said Tom. “No!” said Ann.'
        const closed = split.match(closeQuote);
        if (closed !== null && closed[0] !== m[0]) {
          arr.push(split);
          continue
        }

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
          const toAdd = splits[i + 1] + splits[i + 2];// merge them all
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

  const MAX_LEN = 250;// ¯\_(ツ)_/¯

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen = /[(\uFF08]/g;
  const hasClosed = /[)\uFF09]/g;
  const mergeParens = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      const m = split.match(hasOpen);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          const m2 = splits[i + 1].match(hasClosed);
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
    // First do a greedy-split..
    const splits = basicSplit(text);
    // Filter-out the crap ones
    let sentences = notEmpty(splits);
    //detection of non-sentence chunks:
    sentences = smartMerge(sentences, world);
    // allow 'he said "no sir." and left.'
    sentences = quoteMerge(sentences);
    // allow 'i thought (no way!) and left.'
    sentences = mergeParens(sentences);
    //if we never got a sentence, return the given text
    if (sentences.length === 0) {
      return [text]
    }
    //move whitespace to the ends of sentences, when possible
    //['hello',' world'] -> ['hello ','world']
    for (let i = 1; i < sentences.length; i += 1) {
      const ws = sentences[i].match(startWhitespace);
      if (ws !== null) {
        sentences[i - 1] += ws[0];
        sentences[i] = sentences[i].replace(startWhitespace, '');
      }
    }
    return sentences
  };

  const hasHyphen = function (str, model) {
    const parts = str.split(/[-–—]/);
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
    const reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str) === true) {
      return true
    }
    //number-letter '20-aug'
    const reg2 = /^[('"]?([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+[)'"]?$)/i;
    if (reg2.test(str) === true) {
      return true
    }
    return false
  };

  const splitHyphens = function (word) {
    const arr = [];
    //support multiple-hyphenated-terms
    const hyphens = word.split(/[-–—]/);
    let whichDash = '-';
    const found = word.match(/[-–—]/);
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
    const startRange = /^[0-9]{1,4}(:[0-9][0-9])?([a-z]{1,2})? ?[-–—] ?$/;
    const endRange = /^[0-9]{1,4}([a-z]{1,2})? ?$/;
    for (let i = 0; i < arr.length - 1; i += 1) {
      if (arr[i + 1] && startRange.test(arr[i]) && endRange.test(arr[i + 1])) {
        arr[i] = arr[i] + arr[i + 1];
        arr[i + 1] = null;
      }
    }
    return arr
  };

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

  const wordlike = /\S/;
  const isBoundary = /^[!?.]+$/;
  const naiiveSplit = /(\S+)/;

  let notWord = [
    '.',
    '?',
    '!',
    ':',
    ';',
    '-',
    '–',
    '—',
    '--',
    '...',
    '(',
    ')',
    '[',
    ']',
    '"',
    "'",
    '`',
    '«',
    '»',
    '*',
    '•',
  ];
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
      const word = arr[i];
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
    result = combineSlashes(result);
    result = combineRanges(result);
    // remove empty results
    result = result.filter(s => s);
    return result
  };

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation

  //we have slightly different rules for start/end - like #hashtags.
  const isLetter = /\p{Letter}/u;
  const isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['’]$/;
  const isFullNumber = /^[(+\-]?\d+(th|st|nd|rd)?[)+\-]?$/;

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    const { prePunctuation, postPunctuation, emoticons } = model.one;
    let original = str;
    let pre = '';
    let post = '';
    const chars = Array.from(str);

    // punctuation-only words, like '<3'
    if (emoticons.hasOwnProperty(str.trim())) {
      return { str: str.trim(), pre, post: ' ' } //not great
    }

    // pop any punctuation off of the start
    let len = chars.length;
    for (let i = 0; i < len; i += 1) {
      const c = chars[0];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        continue//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-' || c === '(') && isFullNumber.test(str.trim())) {
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
      const c = chars[chars.length - 1];
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
      // keep '+' or ')' only for a number like (800) or 500+
      if ((c === '+' || c === ')') && isFullNumber.test(str.trim())) {
        break//done
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

  const parseTerm = (txt, model) => {
    // cleanup any punctuation as whitespace
    const { str, pre, post } = normalizePunctuation(txt, model);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };

  // 'Björk' to 'Bjork'.
  const killUnicode = function (str, world) {
    const unicode = world.model.one.unicode || {};
    str = str || '';
    const chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str = str || '';
    str = str.toLowerCase();
    str = str.trim();
    const original = str;
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

  const normalize$1 = function (term, world) {
    const killUnicode = world.methods.one.killUnicode;
    // console.log(world.methods.one)
    let str = term.text || '';
    str = clean(str);
    //(very) rough ASCII transliteration -  bjŏrk -> bjork
    str = killUnicode(str, world);
    str = doAcronym(str);
    term.normal = str;
  };

  // turn a string input into a 'document' json format
  const parse = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input = input || '';
    // split into sentences
    const sentences = splitSentences(input, world);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(t => splitWhitespace(t, model));
      // add normalized term format, always
      terms.forEach((t) => {
        normalize$1(t, world);
      });
      return terms
    });
    return input
  };

  const isAcronym$1 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse = /(?:\u2026|\.{2,}) *$/; // '...'
  const hasLetter = /\p{L}/u;
  const hasPeriod = /\. *$/;
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
    const txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    const words = txt.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.' (and not mr?)
    if (abbrevs.hasOwnProperty(lastWord) === true && hasPeriod.test(str) === true) {
      return false
    }
    // //check for jeopardy!
    // if (blacklist.hasOwnProperty(lastWord)) {
    //   return false
    // }
    return true
  };

  var methods$2 = {
    one: {
      killUnicode,
      tokenize: {
        splitSentences,
        isSentence,
        splitTerms: splitWords,
        splitWhitespace: parseTerm,
        fromString: parse,
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

  var misc$1 = [
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

  var nouns$2 = [
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
    'µg', //microgram
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
  const list = [
    [misc$1],
    [units, 'Unit'],
    [nouns$2, 'Noun'],
    [honorifics, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  const abbreviations$1 = {};
  // add them to a future lexicon
  const lexicon$2 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations$1[w] = true;
      // future-lexicon
      lexicon$2[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$2[w] = [lexicon$2[w], a[1]];
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
  const compact$1 = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗễ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'ÌÍÎÏ',
    i: 'ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇіїi̇',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÒÓÔÕÖØðòóôõöøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'ÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  const unicode$1 = {};
  Object.keys(compact$1).forEach(function (k) {
    compact$1[k].split('').forEach(function (s) {
      unicode$1[s] = k;
    });
  });
  // fullwidth ascii - 'Ｈｅｌｌｏ ２０２４' to 'Hello 2024'
  for (let i = 0x21; i <= 0x7E; i += 1) {
    unicode$1[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
  }

  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7Bpunctuation%7D

  // punctuation to keep at start of word
  const prePunctuation = {
    '#': true, //#hastag
    '@': true, //@atmention
    '_': true,//underscore
    '°': true,
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
    '°': true,//degrees, italian ordinal
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
      aliases,
      abbreviations: abbreviations$1,
      prefixes,
      suffixes,
      prePunctuation,
      postPunctuation,
      lexicon: lexicon$2, //give this one forward
      unicode: unicode$1,
      emoticons
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    const str = term.normal || term.text || term.machine;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (aliases.hasOwnProperty(str)) {
      term.alias = term.alias || [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      const arr = str.split(hasSlash);
      // don't split urls and things
      if (arr.length <= 3) {
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

  const hasDash = /^\p{Letter}+-\p{Letter}+$/u;
  // 'machine' is a normalized form that looses human-readability
  const doMachine = function (term) {
    let str = term.implicit || term.normal || term.text;
    // remove apostrophes
    str = str.replace(/['’]s$/, '');
    str = str.replace(/s['’]$/, 's');
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

  // sort words by frequency
  const freq = function (view) {
    const docs = view.docs;
    const counts = {};
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        counts[word] = counts[word] || 0;
        counts[word] += 1;
      }
    }
    // add counts on each term
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        term.freq = counts[word];
      }
    }
  };

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    const docs = view.document; //start from the actual-top
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
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

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    // console.log('reindex')
    const document = view.document;
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

  const wordCount = function (view) {
    let n = 0;
    const docs = view.docs;
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

  // cheat-method for a quick loop
  const termLoop = function (view, fn) {
    const docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        fn(docs[i][t], view.world);
      }
    }
  };

  const methods$1 = {
    alias: (view) => termLoop(view, addAliases),
    machine: (view) => termLoop(view, doMachine),
    normal: (view) => termLoop(view, normalize$1),
    freq,
    offset,
    index,
    wordCount,
  };

  var tokenize = {
    compute: methods$1,
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
    const lastPhrase = docs[docs.length - 1] || [];
    const lastTerm = lastPhrase[lastPhrase.length - 1];
    // if we've already put whitespace, end.
    if (lastTerm.post) {
      return
    }
    // if we found something
    if (prefixes.hasOwnProperty(lastTerm.normal)) {
      const found = prefixes[lastTerm.normal];
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
    const lastPhrase = docs[docs.length - 1] || [];
    const term = lastPhrase[lastPhrase.length - 1];
    if (term.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api$4 = function (View) {
    View.prototype.autoFill = autoFill;
  };

  // generate all the possible prefixes up-front
  const getPrefixes = function (arr, opts, world) {
    let index = {};
    const collisions = [];
    const existing = world.prefixes || {};
    arr.forEach((str) => {
      str = str.toLowerCase().trim();
      let max = str.length;
      if (opts.max && max > opts.max) {
        max = opts.max;
      }
      for (let size = opts.min; size < max; size += 1) {
        const prefix = str.substring(0, size);
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

  const isObject = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const defaults = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    const model = this.model();
    opts = Object.assign({}, defaults, opts);
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    const prefixes = getPrefixes(words, opts, this.world());
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
    api: api$4,
    lib,
    compute,
    hooks: ['typeahead']
  };

  // order here matters
  nlp.extend(change); //0kb
  nlp.extend(output); //0kb
  nlp.extend(match); //10kb
  nlp.extend(pointers); //2kb
  nlp.extend(tag); //2kb
  nlp.plugin(plugin); //~6kb
  nlp.extend(tokenize); //7kb
  nlp.extend(freeze); //
  nlp.plugin(cache$1); //~1kb
  nlp.extend(lookup); //7kb
  nlp.extend(typeahead); //1kb
  nlp.extend(lexicon$3); //1kb
  nlp.extend(sweep); //1kb

  // generated in ./lib/lexicon
  var lexData = {
    "Adjective": "true¦0:B9;1:AQ;2:BK;3:A7;4:9P;5:AA;6:BF;7:BC;8:BB;9:9Z;A:BJ;B:AP;C:AN;D:AB;E:A9;F:B8;G:AT;H:AL;I:A2;aADb9Uc8Pd7Ve6Nf64g5Vh5Ii4Qj4Kk4Fl43m3Jn3Ao31p21qu1Wr1Es0St0Cu0AvVwSxQyPzMág85ínLóKúJ;ltim2AniAt84;bv6ti4A;gre7Jteg9;an8GeJoa0;lJn;adBTo1;eats5Noungu5Nuppie;aJenófobo,odó;bouquA7r8J;eKiJorkaholic;ld5Jndsurf47;b44sleya7S;aVePiKoJulner8íAB;g4r2H;br5gMngaErLsKtJvo;al,orB;co1ionIto;il,t6M;ar3Zil5oC;lNnMrJtori4;dJgon94mel90sát7KídiA;ad9UeJ;!-esmeralda;cBAer8;ho,oz;i82lJs2z6;enDio1oC;ltraJnific9Irba7Csa0;paA2ssô84;aXeTira7AoRrKéc83íJóxiA;mi0piA;aLiJ;ang69bu2Qlíng8HstJunf4;e,on8N;diciona6BiLnJpac9Ht5;quiACsJ;ig3par3;dAXço9E;c5lerJpo,t4;anDáv7;dBi8CmLnKrJ;no,r8D;de9Jt93;enDporI;gare2Jlen4R;a01eTiQoLuJáb6ér6óli0;ave,bli6Bfo9Ljo,l,perJrpree6At6U;!fi43iANpovoa0st9U;berba,ciMfLlJnh8Xrr0Csse77vi55z2I;iJí2Q;dItI;isti9Gri0;a95áv7;le98mpKnJ;ce9g5N;les,áH;dOgNlvagem,melh5nKreJ;lepe,no;sJtiment4;aJív7;ci19to;re0uinD;entJutA8;o,ár6;d6g12l6Rpe83rc8BtisfJud8;aJei2;tA1z;aZeMiLoKuJá52ígi0;de,im,s4B;b37mânHxo;co,goCson7M;aSbel6ZcQfi8Xg30incPjeiFlNno5KsJvolF;er69iLpJ;eitJo2Q;a0áv7;li3st3;aJev5igBuz3;p1xa0;id3;eJhonchu0ic5V;nDpE;is,lJ;!iJ;s94za0;bug85ci0Ldi5ivo3VncoCro,so,zo8;aLeJis3M;nDrJ;en4Si0;dGlJ;ifi8Equer;a0Ee07harmaceuHi05le3ZoZrKuJóstu1Túb9H;besc3ro;azeCeRiNoKud3áHóJ;pr6spe9xi1Q;ble71dKfun0tet9CvJ;isór1Záv7;igBuE;mKncipa7WvJ;a0ileg5R;eirJoC;a8Uo8U;cMgui4Eoc0DpLsKtJveni0;ensio3Do;ente8Ridiar6taEun4C;aGot3;iJonce45;piFso;b8JdNlMnLp46rtugu27sJt3uc51;iEsJ;es8Mív7;deGtu4;uí0é4DíH;eCre;c5e5MoJ;n79r;ga5Tno1que4WrLsJ;a0sJ;im18oa7C;feLitone4sJturb6Z;ever5ist3picJ;az;ccion14i2;cLrale7XssKtrJ;on4;i88áv7;a2i3;bPcOdBesDficia3Rportun0ZrLtKuJ;sa0t9;im0Xár6;dKgJigin4;ani5Pul62;ei9inI;upa0;ce76e4JsJ;erv6Jti76;aQeMoKuJ;lo,meros48;b7Pj6OrJstál6Ct8vo;m4te;cessLgJrvo1uróH;ativ0LligenJro;ci8te;iFár6;c10rcis0Itur4;aXeSiPoLuKáJédi3Yíni0B;giAxi0A;do,it3Yltimíd0Kndi4;deKl4KneJrt4ti46;tár0I;rJs2;a0no;ma0nJst4Oxuru5O;ucBúscuJ;la;dCiXlMnLsJ;mo,quJ;in58;or,sa68tiC;ancó7Lhor5C;du9gMi7Jjes1KlLnKrJu;avil58c5;d70ho1;and9do1icBva0;ní4Aoa0ro;aSePiOoLuKíJú3W;ci2;t5Nx2H;ca2Mi9nKuJ;co,v8;go;ber4mpo,n0terIv6S;al,do,gJn2tGve;al,ítiJ;mo;pôn6rJ;anja,go;aKeplJ;er0W;ntiKrdecJ;is6G;a33s6F;ei0YoMuJ;bi1JdKstJ;ic5Co;ia;co1vJ;em,i4;de4g09l08m05nLrrJ;espoJiF;ns8;c00dYfXgVjUoTquie2sQtKvJ;e3Pic64;eJrome1E;i9lig3n1rJ;di2ess5nJ;aJo;!cJ;iona54;eKuJ;port8stent8;gu9nsa2;c3v4O;us2;lJra2ênuo;ês;ant2Fel0Ti7;eJivi1Aígenas;ci1pe2U;oJr3Q;er3mpet3;bat3Oort4pJóv7;arJerfei2oss3Nrevis3Nul5S;ci4;imiFu1I;nor5u4;aTeroiAiPoLumJ;anJil2Y;a,itIo;nLrrKsJ;pital4Ct21;oCív7;es2or8ra0;drodinâ1AlLpKstJ;é0Nó1K;nóHócri57;ari5ár6;bili2HrmonBvaJ;ia1S;aQenOig5lorBoMrJu09;aKossJ;ei9o;cBn2Jto,ve;r0sJ;to1;erJi4t1Muí1L;aEo1;it3Vlante3Pna45;aYeUiRoOrJundamenta40ác1Jí39út1J;aJio,ustG;cLncJ;eJo,ês;sa;a44o;fo,rJ;mJte;id8o1;el,nJr0Ráv7;anceirJgi0;a4Qo;de0Wio,lLminiKnomen4rJ;i0oz,tiliz5voC;na;iz;buKc3El1nJscin5;t31áH;lo1;du3Rfici3go4Al0Mmp0Kn0Dpidér0Cqu0ArGsRuPxJ;cNig3pMtJ;ern0SrJ;aordinIoverJ;ti0;eri3lo4E;el3iF;fóJropeu;riA;bel2c00foZlavón6pOtJ;aMouGrKudBáv7úJ;pi0;anJe3E;geir0Jho;dua33;aReLirJlê01ontâneo;itJ;uo1;cMrKtacJ;ular;anJto;ço1;iaJí13;is,l;nJço1;hol,to1;m23rS;lare0Lu9;eJi0H;st3L;miA;cantadoOgraNorMtJ;eKusiasJ;ma0;ndi0;me;ça0;!r;en0HolgaJ;do,nD;eKétJ;ri1M;g5itoJ;ra2A;eTiLoKuJ;ro,vi0E;ce,enDuG;fícPgOre30sMverKáriJ;a,o;sJti0;os;cipli2Dpon0ZsimuJtW;la0;no;il;boc00c3di28li28nZpXsJtermi29;aUconQeOlMmotiLoJporE;beJnes2;di3;va0;eJumbr5;al,ixa0;ja0nvol2quiJspeG;libG;fLheKtJ;raí0;ci0;ia0;fi19grad8peJ;ga0;eJres2L;nd3;go1igraE;ha0;a0De0Bh06i03la9oRrMuJíQómo0;idaKl2rJ;io1to;do1;iKonoestratigráJu7íH;fiA;aEogéKtJ;erB;niA;er3mNnMrKvarJ;de;aJdi4re2;jo1;fi5temporânea,veni3;ov3pMuJ;m,nJ;iJs;caEtI;etKle2orFrJul1Z;een1Yi0;enDiE;nz0Qum0QvilJ;!iJ;za0;aLeiKiqJ;ue;o,ro1;rJto;mo1;r2ssJ;ív7;lRnsaQpaOrKstanJtiv5;ho;enDiJo;do1nKoRsJ;máH;ho1;ciFzJ;!es;do,ti1F;mo,oC;aXeWiToPrLáJ;siJ;ca;aLiKonzJu2;ea0;lh5ncalh11;nAsilYvo;mKnJ;do1i2;!bJ;ásH;camar4olóJrrVsbilhotT;giA;al;lo,s0Q;iLrKtalhJ;ad17;a2ulhP;on0Rxo;ber2c10d0XfasFg0Pl0Im09n03pZrrog5sserEtQutOvKzJ;e0ul;arLenturJ;ei9;ro;en2;oritIênH;ár6;eNrKuaJ;is;a3eJ;vi0;enD;ncB;ti0G;anD;te;aixoLliKreJ;ssa0;ca0;na0;imMsBtJ;eri0IiJ;gJpáH;a,o04;a0ísH;tiA;aNbKig8oC;ro1;icB;io1;so;do,rJ;eKguG;ra0;lo;eMoc8tJ;iTo,ruJ;ísJ;ta;gKmJ;ão;re;rKuiarJ;ense;ad8esKícolaJ;!s;siJ;vo;ta0;do;mir8or8;áv7;el;etíNolhLusatJ;ór6;io;edJ;or;liA;co;to",
    "Noun": "true¦0:CU;1:D4;2:CQ;3:CT;4:D8;5:D6;6:DC;7:CK;8:CX;9:AA;A:D0;B:CM;C:BX;D:D3;E:C4;F:AX;G:CY;H:CJ;I:8X;J:D7;aBZbBLc8Zd85e70f6Dg61h5Vi5Bj54l4Rm3Xn3Oo3Cp21qu1Yr18s0Kt03uZvNzoAUáLâm5WépoBMíndiKórg0;ce,o;g4Rlco6FrK;ea,vo4C;aTeQiMoKítiAF;lKntaGt6Ez;ta,u95;aMdLla,nEolêBsKt5TzinE;iCão;a,ro;!gI;loAZnLrKstiAz,í8S;daGe9Qs0ão;daA0to;lKnt4Lri3;e,or;niLsKtilizaC4;o,uCR;dKversCXão;aGo;aZeRiQoOrKur40íAN;aLibunC5oK;ca,pa;balh5Jd9KnsKta0C;fo4Ypor5;m,rK;no,re;a,me,o,po,ro;at9cQlePmNnMor4rKs5xto9L;mo,rK;a,eC0it0S;dêBtaC2;a,pK;e40o;fone,v7D;iAnolog4;be82manErefa,xa;a05eUiSoNuMéLíKóc2;mboA6t2;cuA5r6H;bs9Ec8Pj6Xperfíc6Grpre9S;cie8lNmMnLrK;riJte;ho,o;!b6;!daAo,uç0;lênc2nKste10tu3;al,dica1;cSde,guPlecç0ma9InLq8FrviCHss0xK;o,tQ;adoC0horMs3tK;enHiK;do,mD;!a;ndLrK;anHo;a-f52;retKç0;ar4ár2;l6CnKu8í7úG;gAMto;a06eNiLoKua,ád2;cA4da,mance,s1u5M;o,sKt2U;co,o;a00cZdYfXgViUlRn7pPsMtra1u1QvK;isKol7V;ta,ão;erB2i5Col7TpKto,ul6Y;ei1oK;nsa0RsC;ort30resentaKúbli9N;n5ç0;aKigi0;tKç0;ór2;!no;iKra;me,ão;e7Por8C;e,uç0;eiCurJ;cç0liK;daGz3;iLmo,paKto,z0ça;ri5Vz;n9Go,z;aLeKiló8D;da,st0;d9li8nti8;a0Le0Dint0Clan0Bo04rKublA4ági8Cão,é;a01eYiXoLá8MéKínci3O;d2m2;ble7YcTduRfQgraPjeOpMteLvK;a,íB;cç0s1;osCrieKósi1;daGtAJ;c1to;ma7M;essFi4C;toKç0;!r,s;eKu6;dAPsJ;meiro-minist9n15s0vatiz3;feit8Ejuízo,ocup3sKço;enHidKo,s0;en5êB;ia,zKça;er,o;ePlíOntNpul3rt9PsKtenci9Nvo;iç0sK;e,iK;bili8;a,e,o76;c4ti8E;ma,s4ta;eCo73ta;or,u6;dQiPle,nOrLsKtró0Eça;coAGo,qui7Jsoa;da,gunCi5Mna,sKtencAAíoA;onaKpec9I;gIli8;a,s6P;to,xe;aAAiAra;dr71g6MiRlQpPrMssLtrKu,z,ís;imón2ão;agIe2o;!eGl6Jq8NtKágrafo;e,iKícu5E;cip3d93;a,el;av6ác2;!x0;bRcasi0lEmb9n7pOrLsJuKvo;ro,tub9;dIganiLiKç6B;e8PgI;s0Oz3;er3iLoKç0;rtuni8s68;ni0;jeLrKserv3;a6Big3;ctKti37;i36o;aRePoMuvIív81úK;cKme9;leo;i5me7NrLtKvi8;a,íc4;des5ma;cessi8gKto;oci3óc2;da,sc98tur7Fv2ç0;a08eXiToPuMáqui6GãLéKês,úsi78;di7BtoA;e,o;d5Elh6KnKseu;do,iK;cíp2;dMe7mDntLr5tKv91ça;i2Por;an78e;a,e6Lo;lMnKss0;a,istKu1;ro,ér2;h3Fit3F;canSdQmPnOrcaAsMtK;aKro;de,l;a,tK;re;in7Vs02;b9ór4;iKo;ci5Uda;isK;mo;dNi5UnMrLs5TtK;eri7Mér4;!c2LgIiAquês;da1ei6hã,ifest3;ei6ruga7;aVeSiOo0LuNáMíK;d5SngK;ua;b2gri58;a,c9g2Uta,z;ber8der4Iga77mi5nLsCteKv9;ra8G;guKha;agI;iKs5t6;!tK;e,or,u6;do,nç4M;aPei1oLuK;iz,lg4KnCro,stiHven6M;gLrnalK;!isC;adorKo;!es;ne3Brdim;d02gre01l62mXnLrmãK;!o;dUfRglés,iQstOteMveKíc2;r6ZstiK;g3mD;nç0rK;es6RiFpret3ve6B;aKitu46r6I;l3n5;cia6Wmi2Z;lLoK;rm3;aç0uêB;ependêBivíduo,ústr4;agIpK;ac1oLreKér2;n4Oss0;r49s1;ja;aGe4;abitan5iNoLáK;bi1;mIn6rKspit6Ct5S;a,izon5ár2;póte69stK;ór4;aUeQoNrLuKás,éne9;ar7er6;aKe2Gi1upo;u,ça;lLs1vernK;adFo;pe;nMrLstK;o,ão;aç0en5;er5Yte;bine5do,rant4to;a04e01iYlorXoUrRuLábri4SéKórmu28;!r4;nMtK;ebKu9;ol;cionLdKç0;aç0o;amDár2;a5NeLontKut5Q;ei6;gues4n5q2N;go,l4Pme,n5rKtograf4;maKça;!ç0;!esC;gu6lLm,naKo;l,nci2W;h5Hme,osof4;der3iLnóme5Ir9stK;a,iv5D;ra,to;cKi42lCmíl4se,vFzen7;e,tFul8;conom4d0Lf0Kle0Jm0Gn0Dquip0Br9sWtaVvUxK;a1Tcepç0eRiQpLteKérci1;ns0riF;a11eNlMoLreK;ss0;rt3s2L;ic3or3;cta59r24;stêB;cutiKmp3Irc0E;vo;en1ol1X;pa;cUfor5ZpPquer7tK;aNi3DrKud2F;aLeKuc5Y;i1la;da,ng0Mtég4;bel5Ldo,ç0;a5TeLécKíri1;ie;cLlEraK;!nH;ial2Gtá0Z;aMolLritK;a,or;a,ha;da,la;aKe;!mD;cont9erg4genh09si4JtK;i8rK;a7ev27;oç0preK;go,sK;a,ár2;iç0mDvaA;ei1;iKuc3;fKç0;íc2;a0Ce02iOoNroMéca7íLólKúL;ar;vi7;ga;c3RenHmín2n42r,utF;aWfVmeUnhTrQsLvKálo09;is0;cMpos1EtK;riKâB;bu1Cto;o,uK;rJss0;eKig4Q;cKi1;tFç0;ei9;ns0;erenHicul8;!bo;ba5cSdo,fRmocrac4nQpOrroCsKus;af2eLign3pe1QtK;aq33i3N;jo,mpenEnKr1;ho,volv4C;art0WuK;taA;ominaAte;e1Jin0U;is0lar3;do,nHta;a1Fe19h16i11l0YoTrQuOálNâma6ão,éLírNódiK;go;luKu;la;cu1O;idaAlKrJs1;pa,tu6;esc3YiKuz,édi1í1I;aKme,se,tér2;nHç0;isa0Nl0Lm09nRpa,rMstKzin24;a,uK;me;!aMda,on2DpLrKte;edFi7;o,us;gIç0;em;cZd09fWgrVh3Mjun1sOtKver0Y;aMeLin3Po,rK;ac1ole,ár2;x1úA;!c1;cPeNtLumK;idFo;itu02rK;uç0;lEqK;uêB;iêB;esJ;eLiKli1;anH;rêB;eKlus0urJ;i1lEpç0;andUba5iTpLuniKérc2;c3daG;anhQetPlexo,oMrLutK;adF;a,imDomisJ;n33rtLsK;iç0to;amD;iç0;ei9ia;da,ss0;an5o;eKu02ég2;cç0ga;!s;assLiKube;en5ma;e,if1P;c0AdadNentMgar9ma,neLrcunsKêB;tâB;ma;isC;e,ão;aLeKu1Vão;fe,ga7i9;ma7péu,ve;nKrt0M;a,tKár2;eMro,íK;met9;ro;na;b07dei06fé,i05lFm01nZpUrOsMtegLuKvaW;sa;or4;aKo,teT;!l,mD;aNg1Bne,rMtLvalEáctK;er;a,ão;ei6o;!cterísK;ti00;aNitMíK;tuK;lo;al,ão;ci8;al,didatKto,ç0;o,u6;aLinEpK;anZeona1o;!da;or;xa;a,ra;eKo;lo,ça;aRePicEloOoLra1RusK;ca;caLlK;a,o,sa;!do;co;ijo,lK;eza;nNrMseLtalK;ha;!aA;co,ro;co,dKho;a,ei6;b1Cc0Ud0Qg0Oju7l0Dm0Bn08p02rXsVtRuMvK;ali3eKi0ô;!ni7;la,mDsêBtK;arqu4oK;móvLrK;!es,i8;el;aqMeLiK;tuG;nç0;ue;a,pec1sK;emble4ociaRun1;!gNma,quitec10tK;e,iK;go,sC;ta;umD;arelElNo2rKto;eseLovaK;do,ç0;nt3;ic3;ho;imLo,áliK;se;al;bi0GeaHigKor;a,o;de4egr4iQmPtLuK;no;erKu6;aç0naK;tiK;va;a,o0D;aKmD;do,nH;ça;da;en5ricul09êB;nc4;ministr3vK;ersKogaA;ár2;io;adem4esJidXoRtKç0;ivNoMu3;aç0;ão;!r;i8o;daG;de;ntLrA;do;ecK;imD;en1;to;en5;te;so;ia;erLraK;ço;tu6;ra",
    "Adverb": "true¦0:0Z;a0Tb0Rc0Jd07e01f00grand0Ohoje,iWjVlSmOnMoLpEquDrCs5t2u1;ltim0nA;a1o6u6ão;lvez,m1n0Dr19;bém,pouF;alvo,e5im4o1ó;brem1m0U;anei13o1;do;!plesm0Rultane0;gur0lvat1mpre,não;ic0;ar0eaY;ase,içá;er02o4r1;ese08i2o1;fund0posit7vaJ;mDncipaT;r2ssiHu1;co;quê,ventu0Q;n0Hutro0P;aturaOenh0Kome1;ad0;a3e2ui1;!to;io,nos;is,l;evWi1onge,á;g1vrV;eir0;amais,á;mediat0n1;c1tens0;l6ontesta1;veB;elizm00inaAo0A;fet5n4x1;c1trem0;ess3l1;us2;fim,tremeD;iv0;aBe5i2o1;n04rav05;a2fici1;lmQ;n03ri0;ba5cer4fron02ma2ntro,pressa,trTv1;agar,erK;is,siad1;amLo;to;iZlV;ntQ;alm0e7lar0o1á;m5n1rajos0;comita2se1;gui1que1;nt1;emC;plet0umB;do,rt0;astMem,reve1;!m8;baiNcMdIfGgoHinda,lBmAnt5onJpen4qu3ss2tr1vKí;avés,ás;az,im;i,ém;as;e3ig0;am1;enE;on1s;tem;anhã,iú9;erta,g3h2i1;ás;ur2;o,ur1;es;inal,o1;ra;i2re1;de;an1;te;aso,ima,olá;xo",
    "Infinitive": "true¦0:0MC;1:0LV;2:0M0;3:0JR;4:0JD;5:0L8;6:0LI;7:0LT;8:0LO;9:0K3;A:0LG;B:0KI;C:0LJ;D:0LL;E:0FV;F:0HW;G:0B2;H:0FJ;I:0JI;a0C5b0ALc04DdWVeOTfN0gM3hLNiIUjILlHLmFQnFAoEDp9Yqu9Sr5As2Kt0Vu0LvSxOzJ;aLeDGiguezag0BPoKuJ;mb1n1r03P;ar,mb0;nJrp0;g0z0;avLSerKingJ;ar,u0GE;et0ocJ;ar,oI3;a04eWiMoKulJ;gar7Lnera04B;ar,cif7ej0g0lJm8t0ze0;it0tD5v2;aRbr0cQdr0gPlipen0BKnOol0KHr0BZsMtLvJziCç0;eJif4;nG1r;al3im0o0HMup7;ar,iJlum00Eto0HLu05N;on0t0;c0BHdi07Yg0;er,i04Jor0;ej0i0;b07Uj0;d0g0HGic0JIlN1nNrJst1t0x0;!bLdKe0gaYCif4mJsN0t2;eBin0;a0KBej0;al3er0;c2d0EQer0iaKtJ;ar,il0;g0l3;ciOdi0gMi0lLmp0KYnglo0H7p0CIrJscuBticAz0;ar,ej0iJr2;ar,eg0;ar,er,id0or0HL;aJir,ue0;bundFr;l0n0;f0CDiv0lPmed6nMrLsJt07E;ar,uJ;fY9rp0;bY4d1g1in0r0;g1h0iJt0;fJr,vers04X;ic0orm3;c7tJul0;im0raJ;j0pa0GC;a12e0Ti0No0FrNuJ;f0mLn0rKtJ;el0or0;b0v0;ef09Zul05M;aSeOiMoKuJ;c01Tf0nc0;ar,c0mb0n0pJt0uç0v0F7ç0;eç0ic0;bBFc0KZl0F0n0HLpJtDunf0;l4u0AB;beBin0l2mKn0p0ECsJ;a0DPpa0FZva0GE;eJul0;lHJr;baBcHdHIfZg0ir,j0lh0m071nOpaB2quMsLtFuKvJz2ç0;ar,e0FV;m0ELte0;bo0IJl0CPpa0FT;e0CViJ;n0t0BJ;caSqu06JsJç0;aCGbo0IFcQfOgrXViNlMmLpJto03Zud0vas0;aJir0la5or05D;r6ss0;it1uY6;ad0it7uz1;g1t0;er1igDo01GuJ;g1nd1s0;e0DBoHDr06H;fi0r;eg0ic0;ar,caPi08RlOmNnMp0rKsJt03Vuc0;ar,cAHq03Ws1t0;c2nFpe08RrJtD;ar,ef093;if4te0;ar,b0;d0er0h2;i0r;c0li5nNpGrKsn0tuJ;be0l0;aKit0oJ;cAne0te0;n3r;g1ir;cQim0lePmNnMor3rLsJ;ar,oDtJ;ar,emuCif4;!give046mAç0;ci9d2tF;er,pJ;er0or3;f9v0E0;er,l0;cMgar0IBl0DPmpLnKpFrJtJJx0;a0JQd0j0tamu085;ar,geUF;ar,on0;ar,h0te0;a1Te1Ei16nO2o0GuJ;a0Eb00cZfYgWic009jVlc0mUng0pPrNsJtD;c8pKsuSOtJ;ar,e0HD;eJir0;it0nd2;d1f0g1pree0CArJt1;ar,iF3uF3;erLlKor043riJ;m1r;a5e0B5icZJ;aJest0BWin03l0J8p0D4visN8;bu0C0r;a0EOir;ar,e8;ar,eJ;r1s02X;oc0rSI;ed2umb1;-r0J8div04GeUir,jDYlSmQorPp0CWsKt2FveJ;n0GYrt2;crMiLtJum1;aJi029;b7ZnE;di0st1;ev2it0;dAn0;eJin0FZ;rg1t2;ev0iJoc0;m0nh0;nJst0BC;te0BK;r,v3;ar,b00cZerYfVjDJlPmOnNpMrKss0I2tJv0çoWW;eRRop0CG;r1tJv2;e0ir;es0it0r0;ar,d0eg0h0;ar,b09S;aNd0eMfHiKt0uJv2;ci9ç0;c8dJ;ar3Mif4;n3tr0v0;p0r;isKreJ;ar,n0r;m0t4;!gu2;ar,i01OoF3;ej0p0BZrJ;ar,eJ;carr0HIlev0n0A0pNsKvJ;iWFo0;cr042sJt0;aJer;ir,lt0;or,uj0;ar,b0BVgnGlPmNnKste0A3tJ;i0u0;al0DSgKtJ;et3on3;r0ulJS;bBCpJul0;at3lG;ab0enEv0;cWdUgRlPmeOnMpLq9MrKvJ;ar,iE;!en0i0pe91r0v1;ar0u07R;ho08Ws02HtJ;ar,enEir;ar,lh0nt0;ar,eJ;c01Kt0;ar,me5reKuJ;ir,nd0r0;d0g0;ar,iJuz1;ar,me5;ar,ci9i9r0CSu0A2;bVcSf0gr0ir,lOmb0nNpMq06DraLtJud0z9;iJur0;r3sf061;co05Lr;a05Ke0DQ;ar,ci9e0gr0tG;d0g0iLp4tKud0vaJ;gua0EUr;ar,e0it0;e5v0;aKh0i0olHrJud1;a08Tif4;ne0r;atAer,oJ;re0t0;a3QeWiUoMuJ;ar,bKfZBgi09UiQGmJt0AS;ar,in0orH;or3r4;bPc0dOer,g0j0l0mMn04XsKtJub0xe0ç0;ar,e0ul0;et0n0tJ;e0i0GP;anJp2;ce0t3;ar,e0oCA;or0ust6;bo04Ecoche04Xdic63f0m0nJp0r,sc0tm0v001ç0;ch0gJH;a35b30c2Ed2Be27f1Wg1Ni1Lj1Jl1Cm15n12o10p0Oqu0Lr,s03tRun1vKzJ;ar,i035;alX4eMiLoJ;ar,g0lJ;t0u0EAv2;d0g0AHr062s0F0v2;l0nKrJst1z0;!b7d6enEt2;d2ir;aSeRiQoOrJu043;aRTiQWoJuc0;aLced2grKtJ;ra1;ad0ed1;g1r;c0m0rJ;c2n0qu1;f4n1r0;r,s0;lJrd0;h0i0;cZeYfWgViUmu02LoTJpRsNtKuJv0EI;lt0m1;aKiZ4rJ;i0CPutD;b4Tr,ur0;aLeKoVJuJ;m0rg1sc8;c0nt1qu1;bi0ir,lZ4rc1;aT2e8iKlJUonJ;d2sab01G;g0ng0r0;d1gn0st1;at0ua0DA;olJri0;eg0g0;nh0rv0;e08AiQQ;eKiJ;nt0r1s8;br0r2st0;aTeSiRl4oPrKt0uJ;bl4di0gn0ls0t0x0;eLiKoJ;ch0dBVv0;m1s0;e081sJ;ar,e6J;l1nt0rZUsJus0;i0D0t0;c0nt0s0;l1ns0rcVUt1;r065ss0;cROrJuv1;gRLie5;aKd07Teg0g040h1oJunE;me0v0;sc2v0EA;aMeLiKoJun7;d0DEer,nt0rNAst0v2ç0;r,t1;dUZm08Wnd0ss0t2x2;nJr,t0;ch0eJ;j0sc2;aLeKin01YuJ;t0z1;g0mSUr,v0;ci9mpKnJr,t0x0;ce0D7ç0;aJe06M;dHg03Kr;e8uJ;b08Dvene0BG;f4mpr6FnJt7vind4;ar,cZRiEteYBve5;aQePiOoNrMuJ;laJrg8;me5rJ;!iz0;ar,e2B;ug0zij0;me5st09P;n7r;l0nh0r,te0ç0;az2eRin0lOoMrLuJ;gJlg1t0;ar,iT2;at0e069ig7;g0rJ;m03Cç0;eKorJu1;e0AXir;ct1t1xi9;rJst0CF;e06Kir;diNWlQ2mbols0nKrgu2sJxpQZ;crZStrutD;cJtr0vi0;amiConI;arOEiKoRXuJ;nd0z1;g1m1re0BJz2;a02e00hZiYlXoNrKuJ;ar,p7s0;eERiKuJ;de0AJt0;ar,mA;br04QlRmOnKp07ErJst0;d0r2t0;ci03GdLfo0BIh6qWXsJt0v1;id7tJ;iWMru1;i0B8uz1;eKpJ;ens0or;nd0ç0;h2oc0;am0in0us0;cl0prM3t0;aç0e0;ar,b2it0nJpVI;d2se0;ir,lcJmbi0pit0AKv0;ar,iI;aMeLoKuJ;sc0ç0;ar,c0l047;l0nt0;ix0t2;bOce05PdNfiTSg1lMn05GpLssum1t5FvJ;er,iJ;ar,r,v0;ar6rese5;iz0oc0ç0;m17q09M;il8r1;bi0B2cQdiPf0iJUj0lOmNng2p0BBreMsJtEOzo0ço0;ar,cKg0p0tJur0;e04Pre0;ar,uC;ar,f01C;aBif4;ar,e0h0;ar,ca0A1;h0ioJ;cAn0;aMeKiJ;c0et0t0z06A;bra0A6d0iJr057sW3;m0x0;drJlGntGr0;ar,u5I;a35e27i1Zl1Wo1JrNuJôr;bl4gn0ir,lLnKrJtref00Zx0;g0if4;ci9g1ir;ar,s0ul0vZC;a1Ce0Ei0CoLuKé-J;coziClQY;ir,r1;blem05Rc06d05f03g00ib1jeZlYmXnWpPrr0C5sNtLvJ;ar,er,iJoc0;dVXr;eJocGGra1;g2l0st0;ar,crXVe0p7seMKtJ;eV4iV3r0;aNeMiLorKuJ;gn0lsFP;!ci9;ci0n0;l1nd2;gaJl0;n002r;tGunE;et2ov2uM3;at0if7oY8;ct0t0;noMWrJ;am0eJ;d1ss0;an0eJl084u045;r1ssE1t3;iga08Xuz1;eKl063rJur0;astAi0;d2ss0;m0nci6Xor3vJ;ar,ileNJ;ar,c0Bd08e06f04g02jud4l01mZnYoXpVsPteMvJz0;aKeJ;n1r;l6r4;j0nd2rJxt0;ir,mJnat42;it1;ar,cNeLid1sKtJum1;ar,iNA;aN9eCLi9up04R;nJrv0;ci0tCW;iM5rWV;ar0oJ;nd7r;cNGrd041;d03Ms0unE;eJi0un1;d8r;e08Kib0uZY;ar,o0uJ;iç0nt0;aEer1iJ;gDx0;nch2stabJ;el6;eKiJomA;c0sp049z2;stAtermA;aMeLiKonJ;c03Liz0;p8s0;d2iUQ;t0v2;gJnYMt4zenYM;ar,uH;d032eUit0lSnRpQrPsKtencV9uJvo0;p0s0;ar,iMp03YsKtJ;ar,e05Qul0;ar,ibiliJu1;t0z0;ci9t079;ej0fi0men00Qt0;ulBX;d7t9Q;ar3emiJi34u1viB;c0z0;r,t05R;aJeiY7urTB;gi0in0nJsm0;ar,e01Vh1if4tF;ar,c03Pf0g01KlPnNor0pMrKsJt0;ar,c0oY3;aJu055;mb0r,te0;il0oc0;ar,cJg0ic0taWD;el0h0;ar,h0ot0;ar,c0Fd0Eg0iN3jC6l0Dn08rQsMtJ;iKrJ;eWRif4;ci9sc0;ar,cKg0p08Tqu03MsoSWtJ;anH;ar,oJ;ce0;aQScZdYeXfVgu5iUmTnSor0pPq067sKtJu0veS5;enc2u00C;crMeLiKonJuLP;al3if4;gn0st1;gu1v7;ut0;a044eJ;nd00JtJ;r0u0;e0o8;an6e0it1ut0;cl8g0;az2eiJil02Wu073;ci9ço0;c2grAr86;er,o0ur0;ar,eb2o5Qut1;a06DdLeKh02XitSSs0teJ;ar,lh0;ir0tr0;er,uJ;l0r0;ar,e00R;al0ir;ar,hinVWuAJ;c09d08g07ir0je0l04n060p01qu7rSsNtKuK4vJ;i00Done0;eKin0rJ;ocAuB;ar,nWUt0;c2m0sKtJ;ar,orF;aJe0;ge0j0mZ5rJtempe0;!iC;aPeVGir,lameOoNtJç0;ej0iJ;cJlh0r;iJulA6;on0p0;di0l0;ntF;ben3fJl02Bme5r,s8;ra04Jus0;aJe0oc0;gJrWW;ai0ue0;avZ9eKi0mJpU4r0;ar,e0iB;ar,sI;ar,oWB;ec2rV1;if4tu0;b05c03di0f00jV1lZmXnVpSrOsMt22uLvaKxiJ;d0g011;ci9r;rFMs0to03Cv1;cJte5;il0ul0;ar,den01LgLiKl0naPIqJtP7vaBç0;uesI;e5gA;an3uB;er0in0orKrJt0;im1;!tun3;dJer0;e0ul0;bYOiJ;n0t1;e0faVPh0vO0;eJiciQSu05P;g0nd2rJ;e19t0;aZVo44uJ;lt0p0;c6GdDeRjetQlit7nub013r98sLtJvi0;eJur0;mp7r;cur6eMtJ;aKin0rJ;i03Wu1;cul3r;cr0d0qQIrv0;ar,iv0;d6r0;aUeQiPoKuJ;bl0lGm7tr1;iv0mVCrLtJ;aORiJ;ci0f4;maJte0;l3t3;n0v059;cKgJutrQ5vYS;aUJligQMoErH;ess8roJ;p00Ns0;c4Ld0mor9Xn0rr0sLtKuJv05Y;frFWse0;urPZ;al3c2;a0Oe0Ci05oQuJ;d0g1ltNmGnLrKss8tJ;il0u0;ar,ch0mD;g1iJ;ci0r;ar,iJ;pl4;bilWch0dTer,f0lSnQqVArMsLtKurHvJ;er,iY0;ej0iv0;c0tr0;a03OdKn0rJs05ItG;aç0er;er,iJ;c0sc0;d0g2it04opJt0;ol3;d00Me030h0;eJif4oF1ul0;l0rJ;ar,n3;ar,h0i01Y;ar,ct0gr0j0mOnLr01BsJt02Ix0;cigZ1er0tJ;if4ur0;ar,gu0iKor0uJ;ci0t0;m3sI;ar,o023;ar,dSlRmQnNrLsKtJxUG;amorfo021er,rG;cl0quiCtURur0;c0eJguB;c2nd0;ci9d026e0osKsJtAZ;tru0ur0;cab0prez0;or01A;ar,hZHinCG;iJr0;ar,caN6r,t0;c06d04g02is-qU1jZElYmXnSpe0quiRrPsLtKxJçKK;im3;ar,eriOPiz0rWOu03Q;cB5sKtJ;ig0uW8;aJif4;cr0ge0;aviBcZ1eX6ge0id0oSXr0tJ;el0ir3;ar,lYZn0;ar,cYYdMeX3g0iLj0oJ8quKt2uJ;fatDse0;ej0it02L;et0fe01Zp02F;ar,ria04X;ar,parW5;anBXbar032dKeJh0iEoORqTLtr032uc0;ar,fiE;ar,iJ;z2ço0;ic0nJo0;et3if4;e03UrJur00Q;ug0;aqTOer0hRCul0;a02eXiPoLuJ;brGcr0dibZZf0sJt0x0z1;itH5tr0;ar,br017cLgr0mb0nKr04FtFuvaJ;miCr;dVQgiX5;a01Zomov2uplZV;ar,bOcODdNg0mMnLquKsJtigKLvr0x0;onje0tZV;efT4idQW;d0guUA;ar,it0p0;ar,er0;ar,erJr0;a01Rt0;ci9gLmIEn1rKs83tGvJ;a01Zed0it0;!de0;a01NiJ;sl0tWN;bXcVdUgrim52mSnQpKPqT3rOsMtKuVBvJx0ç0;ar,or0r0;eJir;j0r;c0s0tJ;im0rF;aJg0;pi0;cJh0ç0;e0h0in0;bJe5in0uZ6;ar,eIQi024uz0;e0r0;ar,er0rJt0;ar,im4O;or0ut0;aQeju0oOuJ;bXHdi0gSXlg0nMraLFstJ;aKiJ;f4ç0;pXAr;c0g1t0;e02Lg0rJ;naRTr0;ct0nt0z2;d29g28l25m1KnMrKsJt7ç0;c0e5ol0;!ar,iNHmU2on3rJ;aSJiAUomp2;a1Fc13d0YebYNf0Pg0Oi0Nj0Lo0Jqu0Hs08tQuPvJç0;aNeKiJoc0;abOZt0;ct00Dj0ntarKrJsti8E;n0t2;!i0;d1lJQ;m0nd0tOU;eOiNox4rKuJ;ir,meZZ;ig0oJuj0;dJmNK;uz1;c0mW7t00D;gPGir0nTrJ;aRcOdiLQeXTfSYlZImeNn0pMroLvJ;al0erJir;!t2;g0mp2;el0oTUrY5;di0t2;al0eKoJ;rr2;d2pt0;g1tu0;ci9d2sP3t0;cQerE3iPpOtKuJ;fl0lt0rg1;aLiKruJ;ir,menDN;g0l0tu1;l0r,ur0;e008ir0;nu0st1;rOAulp1;er1iJ;et0n0r1;cJv0;e5ul0;et0uJ;ng1ri0;b1cN5;er1les0reX2;aQeMiLlJoIYriYWuDB;aJe23ig1uM1;m0r;lIrm0;cLl3LrJst0t0;iJnXS;or3r;ci9i9t0;m0rt0;ag0eMiKuJ;lt0stX6z1;cHXgJspVJvidZ9;it0n0;fRTn3;aTenRh0iQlPoMrLuJ;b0lJmb1t1;c0p0;eTDimA;mod0nstitucKrJ;pVMr2;ionKY;in0u1;d1n7t0;dJs0tYM;er,i0;ndeYCpac8;bRdimYLl0ugD;a02b01er00iZoYpKuJ;n3t0;aUeSiY3lRoNrKuJ;gn0ls54t0;eKim1oJ;b0vVC;c0gn0ns0sTR;rKssibJ;il8;!tJ;ar,un0;a5eSSic0o3J;d1l1nd2rJtr0;ar,fe00ImeaIV;cJr;ie5t0;bMNl0rtKB;scu1tS2;ec2g1;r4u1;gAnt0;h0iKuJ;d1mAsI;b0d1;nUQuZ7;eJolaI;aY4ntG;aVeUiRoKumJ;anWEiB;mNnMrLsJ;pJtM9;ed0itJW;rR4t0;eXFr0;enMOizi0oJ;gene3l00G;beJKerarUGpJstoVP;not3otJ;ec0;bVNrd0s8;biJrmNCsOJur1v2;l8tJ;ar,u0;a08e01i00loZoWrNuJ;arLerRCiJst0;ar,nJs0;ch0d0;d0n6;aLiKuJ;d0nh1p0;f0t0;cHdNf0mMnLsKtJvM0;if4ul0;n0s0;ar,je0;ar,pe0;e0u0;lKrJst0tHveIZz0;ar,golHje0;e0f0pe0;riTWs0;ng0r0z0;ar,l0mOnMrLsJ;s0tiJ;cX0on0;ar,enEir,mA;erIXufleJ;ct1;er,in0;b0f0guHlMm0nGCrKst0tiCzeJ;ar,te0;aJf0gaBoXYr1;nt1tD5;aJg0opF;nNLrJ;!do0;a0We0Pi0Kl0Ao01rSuJ;gQElPmNnLrXSsKtJx4zT2ç0;r4ur0;i9tVS;ci9dJg0;aGWe0ir;aJeg0;rOOç0;gJmA;ir,ur0;aMeLiKuJ;ir,sItG;cWQg1s0t0;ar,m1qRUt0;cMgQLnKqueQVtJud0;e1Yur0;j0quJz1;e0i0;aTOi9;cQf7KgNPiNZlPme5rJss0tG7;cNj0mLnKr0tJç0;al6if4;ec2iDO;aJig0ul0;l3r,t0;ar,ej0;g0hFi0;aVZiC;aOeMorKuJ;ir,tu0;eJir;ar,sc2;cJrt0xi9;h0t1;gLmKnJutF;ar,qN9;ar,b0ej0;el0r0;ar,cS2gDlMnKrm0sJt0x0;cHKg0sD;aJc0d0g1t0;l3nE;ar,h0i0m0osof0tr0;cOderNOit0lNmeMnLrJstH;ir,me5rQ2tJRvJ;eVRiB;d2ec2;nt1;ic8;h0uQJ;bWcVdUiQ0lRmiPnOrLscAtKuBvJz2;ar,or6;iKTur0;aKej0faBiJofi0re0t0;nRMsc0;ndVAr;ar,taRO;liJ;ar3;ar,ec2hKir,sJt0;ar,e0if4;ar,oc0;ar,ig0;e0il8uNJ;r4ul0;bul1c7Hd7Ef7Cgu0iv0j7Bl75m62n3Dqu38r35s0Lt0Jv0DxJ;a0Bc07e04foNDi03o01pRsE8tKuJ;b7lt0m0;aRCeNiMorqu1rJ;aJem0;ir,pUVvJ;as0i0;n7Vrp0;nu0rJ;iNUmAn0;aReOiSLlMorHSrKuJ;gn0ls0rg0;eS1im1oJ;b0pSF;an0icJ4oJ;d1r0;ctKd1l1nd2riJ;enEme5;ar,or0;nd1tS9;n7rJ;ar,b8c3t0;b1g1l0m1st1;cKmplJArcJ;er,it0;r0ut0;arc7eKit0lGYoJrS3;g8muJA;d2lJtu0;er,ir;ceNLg7lV6mAr0sp7ur1;aNeFCiMoJ;c0lJ;ar,uJv2;ci9ir;dGDsc7t0;cu0d1ngel3pQH;eJi4U;rn3;b1Wc1Bf15g0Zm0Vn3Pp0Cqu09tLvJ;aJoTO;ec2ir,n6zi0;aYeWiUoTrMuJ;ar,d0f0g0m0pKrrJ;ar,ic0;or0r0;aNeMiLoKuJ;m0tD;mp0ndFpi0;ar,b0p0;ar,buJ9g0it0l0m6p0ss0;g0l0nJtGçaB;gTFh0;nK9rAZur0;ar,c0gmPMlJmL8ol0pTDr0v0;ar,hT9;ar,nd2rJ;c0il3;bPcOf0gNi0lN0mMnLpe0qKTrKtJ;el0u1;!r6;cBVdard3;br0in0p0;i0n0;ar,i9;el6il3;aKeSIiJ;ar,n0v0;dIZrtH;aVeRiNlMoLrJuTH;ai0eJ;guKLit0m2;c0li0rFs0;and6eO6;ar,cLnKon0rJ;ar,iEBr0;afr0h0;aç0h0;cKdSMlh0rJss0t0v8ziC;aV9dKDne0t0;ar,iJt0ul0;al3f4;ir6lNnLrKtJv0Uç0;if0;g1rPStHz1;ar,c0hJt0;olQV;h0m0;aLer0iKoJu41;er,l0r6;gaBuç0;ec2g0lt0r;aMoLrKuJ;eTYiI2;avSZim1;el0t0;n0rJ;avSWç0;aNoMrLuJ;maJzi0;r,ç0;eg0i0;lAQme0rç0;cT2lf0qJKrT2;aVlar6oNrLuJ;d0lJreRFs0t0;aHPhaI9p1t0;av3evCJiJut0;tDv0;ar,iPlOnMrJv0;ar,ch0i0rJ;aç0eJ;g0r;d2juJ;nt0r0;h2t0;ce0m0;ch0lPmNnLpKrJsQKv0;afunHDnQ5r0;ar,ul1;cOXdJe0gaB;al3ir;ar,oJ;s0te0;ar,d0on0pSH;aMoKravHuJ;gaBlh0rKP;feI7rJç0;o0raH3;fJgR7nj0rr0t2;or1;ar,gu2iKm0od1raJuDTv0;d4r;g1ç0;aMiJ;li7UpKvJ;al2oc0;arJ9;ci9l3;a26c1Md1Ie1Hf15g0Rj0Ql0No0Mqua0Lr0Gs0BtTuSvMxJ;aKer12oJug0;t0vaB;d0gu0;aNeKiJo70;ar,d0es0l6;lh6nMLrJ;ed0gJn3;ar,oC;id6s0;m7nE;aZeVoSrKuJ;lh0p1rm0siasm0;aOeLiKoJ;nc0s0ux0;ncheS9st6;abr1g0lQHme94pMVteKvJ;ar,er,iQ3;c2r;j0nJr,v0;h0ç0;ar,c0j0nKrJ;n0p6t0;ar,t6;di0nLrKsJ;ar,oD;n6r0;d2e6Z;lMOpO6rd6;aLeKin0oJurd6;berb6p0;b0j0;bo0c0iJMnJ;d6gLM;aiMed0iLoKuJ;bePJg0st1;diBl0sc0;c0jOJqu6;v6z0;dr0;br6do0it6j0vQY;aKeJou1T;ar,v0;me0ç0;aPSe8o0;aRePlOoMrKuJ;iç0lh0;aJen0oN7;nd6v8Ux0ç0;d0lJm0rdMT;f0ir;ob0;lh0nJss0;dr0h0;bQKiPNj0lISnMr9LsLtJ;ar,iJ;lh0nh0;g0t0;ar,ch0;aSeOiNoMrKuJ;n0r6;a19eJ;ar,nt0;c0rDL;ar,leQW;ar,iKrJst0z0;m0r5J;tJx0;ar,iç0;d0ix0rJsLLt3;ar,iCt0;gr6rv0;eLiKoJur6;idNJss0;re8v84;nt0reç0us0;aVeThSiRlausDoNrLuJ;b0rJ;rPXt0v0;av0eJu0;nc0sp0;br1lLmKnIrJst0v0;aj0p0;eJXi0pr7V;er3h2;lh0m0;aGOer;nJrMLt0;ar,d2;bOde0fu0ixLOlh0mNnMp0rKsJ;quMG;aJc7d1ec2n0rQD;cOLr;ar,de0t0;iCp0;eç0ul0;lt6mKY;a0Jb02e01i00oZpKuJ;d6l0;aSePiNoMrKuJ;nh0rr0x0;az0eJ;eJIg0nh0sPB;ar,br6d7ePTlg0rOYss0ç0;lh0n0pJ;oc0;c2dKnKIrJstFz0ç0;r0tN8;e1Jr0;cL4lMnKp0reJt0;d0lh0;ar,tuJ;rr0;h0id6;ci9ldDst0;gr0t1;nd0rg1;aVeSirLRoQrKuJ;ch0rr0t1;aMeLiKom0uJ;lh0t6;ag0;ar,nh0;nJv6;qu6;lJrc0sc0t0;ar,or0s0;beKleJv6;c2z0;d0r;ci0iI8lLr41sKtJç0;er,uBP;ar,bGO;ar,sKK;gr6nJraCscNA;ar,cAP;aNeMiLoKucJ;id0u3X;gi0ng0;ci0d1g1mA;g2nc0tr3v0;bJPr;acN2et0;eJlu1;c9XrveMIt7F;iKuJ;c0z1;f4t0;lKoJ;ar,nom3;ips0od1;a6Te0QiQoLrKuJ;el0pl4r0v5Y;amJ0en0ibl0og0;ar,bKQcMe1LmKrmiI7s0t0uJ;r0trA;ar,e0KiJ;ciF6n0;il3uGX;a0Gf0Cg0Al07minu1nam3plom0r05sOt0vKzJ;er,im0;ag0erLiKorEuJ;lg0;d1n3s0;g1sGt1;cVfaK8pSsOtJ;aMeHQinLorc2rJuFY;a0GiJ;bu1;gu1;nEr;eLiKoJu17;ci0lv2n0;di0mM7p0;c0mAnt1rt0;araHMeKoJut0;n9Hr;ns0rs0;ar,eLiplAor8UrKuJ;rs0t1;ep0imA;rn1;eMCiJ;g1m1;aKig8DuJ;c51ir;c7p50t0;er1iJlaDLnAV;taLU;am0erKicuEDuJ;nd1;enJir;ci0ç0;gnoJlOA;st4;a5Kb5Fc58d55f4Xg4Ti4SjJJl4Mm4Jn4Fp47r41sRtNvJ;aKer,ir,oJ;lv2r0t0;ne0sJ;s0t0;aBeKon0raJurp0;ir,t0;ct0rJst0;!g1iHZmA;a2Sb2Pc23d21e1Df16g12i0Wl0Tm0Nn0Lo0Ep00quZrespe8seYtQuPvJ;aMeKiJ;ar,ncLAr87;l0nJst1;ciBd0;ir0lJn6ri0;er,or3;m09n1;aPeOiNoMrJ;a70inKoJu1;nK3ç0;ch0ç0;ar,rc2;l0nE1tu1;c2rr0;c0mp0p0;c0de5rv1;alGit0;aVeQiPoOrJ;az2eLoJ;tJv2;eg2;g0nd2stiJz0;gi0;j0nt0r,s0vo0;r,st0;dMg0it0j0l0nLrJ;cGBdCAsuJt0;ad1;c0d2h0te0;aç0ir;ch0rafGH;bNcMl0nLpGVrJv0;dG6gJie5;an3;er0r0;up0;ed6rJIstJ;ru1;atu9DorB4uJ;d0tr1;aMeListGoJ;biCPnt0rJ;al3on0;d1m0Unt1r6;i0m0nJrc0scHHt0;ch0d0tL4;eKiJoc0um0R;g0nd0z0;ix0m0P;gNlud1mpMnJst1;ch0feKib1teJ;gr0reHE;cK9t0;ed1;n0uKW;aLoKrJuarn6;aç0ud0;st0ve5I;rr0st0;aNeMiLrJ;aJut0;ld0;ar,gDl0;ar,ch0r1;lJvor6z2;c0ec2;j0mZnKquili07rJsperaM2;d0t0;cTfRgaQh0le0rNtKvoJ;lv2;eKoJYraCuJ;lh0p1;nd2rr0;aKed0oJ;l0sc0;iz0sc0;n0t0;asFOerrJo2Lre0;uj0;aKh2oJr0I;nIrBKst0;de0ix0lh0miCnt0rJv0;d1n0;aObKpJ;aJZenFFoGHrKV;aKoJruB;c0ls0;iCl0rJç0;aFVc0g0;l0raC;ar,eCiz2oJ;br0;a00eYhancJTlassGoMrKuJ;id0lp0mpr1r0;av0eJimA;r,v2;br1lTmpSnLrKsJ;er,tD;ar,tA;cNe55fi0ge4Sh6ju5sMtKvJ;e5Air;ar,e5i3ZrJ;a1ol0;eJ1id7;eJoIN;nIrt0;l4or;ar,orC3;nJr0E;d2tr49;beCLir,lç0m0nLrJsHA;ar,rJt0;eg0ilEN;j4s0;aKloq9Pot0rJ;av0;nc0rITst0;b0Ec0Cf0Ag07l06m03n02pVrRssPtMuLvJ;ez0iJ;ar,r;tB7xiAI;aKen3IiJrJ0;n0v0;c0r;e0i5SoJ;ci0ssJQ;mLrJtBR;aJoBum0;ig0nj0;ar,on3;aNeLo5rJ;eD0oJ;pFKv0xCQ;g0rJ;cDBt0;ix9rJ;afDJeDH;c0d0im0uJ3;aJpEV;rJss0;!r0;e5iCoj0;rJu0;aJeg0;d0v0;az2iJog0;ar,n0;at0el7oJred8;nseBrd0st9H;aLoKrJ;ig0o6X;n0to0;f0r;iv0rJ;aMeLib0oKuJ;b0ir;c0g0t0;ar,t2;m0p0;aPenNil0lDIoMrJuHW;av0eJim1;cJd0eC6;ar,i0;r3Zs8;ar,dJic0;er,ur0;rABup7;eKoJt0unE;mAt0;gJrv0;ar,r1;aKit1oJud0;crCSl1nsIr0sIv2;nd0rc0;aMeLiJo5N;b7ci0m8nJr8N;e0qu1;g0it0t0;pJt0;id0;t0x0;eLlKol0rJuFU;ad0ed0ingGE;ut1;l0n7;as0eOinNlMoLrJum0;aJo5;ud0;rm0;a2Hu1;h0ir;c0nJr1;d2esI;ar,et3iKuJ;r0z1;c0lh0;aOepNiMlLoJreAS;dGl0mpC5rJt0;ar,r2;aGFin0;d1fr0m0;ar,ci9;ir,lc0nt0p8;aMel0iLlat7o5GruKuJ;lh0t0;ar,ç0;c0l8t0;nd0t2;mbFJ;dF8nNrMtJ;ar,ilJ;ogJ;raf0;!dH;ar,iJç0;f4nh0;a4Ge4Bh3Wi3Ll3HoXrSuJ;id0lOmMnh0rLsJt4I;p1tJ;ar,e0o70;ar,s0t1v0;priJul0;me5r;mApaKtJ;iv0u0;b3Dr;av0eLiKoc8uJ;ciBSe5z0;ar,mAsm0t4v0;d8m0p8r,sJ;c2t0;a2Yb2Xc2UdGexi2Tfi0g2Si2Ql2Km1UnXoVpTrNsLtKxe0zJç0;er,iC;ar,ej0iz0;er,tJ;e0uFF;ar,nFo0porGrKtJ;ar,ej0in0;eKig1oJ;bBAer,mp2;f7Ag2laJr,spo9Z;ci9t0;iJul0;ar,l0;pJrdAA;er0t0;c17d13e12f0Rg0Mh6j0Jl0Iot0q0Hs04tPvJ;aleDYeLiKoJul9L;c0l0;d0r,v2ziC;ncKrJ;g1s0t2;er,i9;aWeSiRorQrKuJ;nd1rb0;aMiLoJ;l0veJ;rt2;bu1st0;balaC7ca5diJf5Eir,pAFri0st0t0v1;t0z2;c2n0;nu0;mpLnKr,st0xJ;tuY;d2t0;l0or3;b27ct0gi0mAr,t0;a0Acient3eRiQoPpOtKuJ;bst2Blt0m7L;a9AeLiKrJ;a05iD5u1;tu1;rn0;ir0u5R;ci0l9IrE;d7gn0st1;gu1nKrJ;t0v0;suJt1;al3;uiD2;ui0;eKuJ;g0mAnt0r0;ctDtD;eLrJ;aJeg0;tDBç0;l0sJ;ti9;abD8eQiOlMorDRrKuJ;nd1t0;aJo5;ng2;aJit0u1;gr0;ar,dJgDn0rm0sc0;enE;cKit0rJss0;enEir;ci9i9;ct0;eKiJo2uz1;ci9me5r,z2;c9GnJsce86;ar,s0;at8JeNhEOiMlLorKret3uJ;rs0;d0r2;am0u1;li0t0;b2d2iKnIrJ;n1t0;tu0;a7Sb06e02i01ov2pLuJ;nJt0;g0ic0;aTeRil0lPorOrKuJ;ls0ng1t0;aLee7Rim1oJ;mJv0;et2;r,z2;!t0;eJic0;me5t0;l1nJt1;di0eIs0;d6rKss0tJ;ib0G;ar,ec2tiJ;cJlh0r;ip0;ch0n0s76;d1m8MnLrJt2ç0;!cJ;iaC0;sDt0;aJin0oi0ur1;l1t2;aNeLg0h2iKoJ;c0n3r5K;d1g5Jm0;ar,cJt0;i9t0;b8Bps0r;b1ncJs0;id1;it0nomA;st1;ar,hJ;ar,iJ;ch0l0;iç0r58;b8dLgKlh0rJx0;!ct0;ir,ul0;juv0un0;aKiJ;c0m7K;m0rJssGud4;e0if4;cSentGfr0me5nRrLsKt0vJ;il3;c0m0;a6DcuJ;it0l0nJ;d0sJ;crKtJ;anE;ev2;d1g1t7Ez0;atr3i0;aPeOiNoLuJ;ch0f0mb0pJt0viBS;ar,it0;caDCraJv2;miZr;ar,co1Nfr0lrFng0sp0;c0fi0g0ir0;cOfuAYg0lNmLnJp0te0;cBRtJ;age0;ar,eJuBJ;g0j0;eC9r0;in0oJ;aBte0;ar,d2g0if0lebr8WnLrJss0v0;cFr0tJz1;ar,if4;sDtJ;raAG;b0Qc0Nd0Mg0i0Kl0Im0Fn0Bp04rWsUtPuNvKxiJç4Z;ng0;aKoJ;uc0;lg0r;ci9sJtY;ar,t4;aMeLiKuJ;c0rr0;ng0v0;ar,g3Bqu3;lCPr;ar,c0s0tJ;ig0r0;aObNcom2d0eMg0iLmAne0p3QrJtF;ar,eJ;ar,g0;ar,ci0mb0;ar,c2;on3;ctJtJ;er3;aOeNiKot0riJt6X;ch0;n0tJ;aJul0;l3ne0;ar,ng0;c8r;al3cAMdidAAon3s0tJ;arKe0oJ;riC;!ej0ol0;bJiCpFufl0;aJi0o0;le0r;ar,cJej0h0m0uni0ç0;ar,in0ul0;ar,nh0rJ;!el0;asIenEuc0;arHet0hJ;ar,e0iJon04;mb0;eJul0;ce0r;a0Ie08i05l04oUrLuJ;f0l1mb0nd0rJsc0zA;il0l0;aPeOiMoKuJ;n1xu0M;c5EnJq0It0x0;q0Hze0;g0lh0nJs0t0;c0d0;c0tanh3;cHd0m2KnJvaO;d2Jq0C;bRcHiQlPmbNnGquHrJt0;bKd0rJ;ar,if0;oleJuB;te0;arJe0;de0;ar,e0in0s0;ar,cAY;e0in0;asf6Cef0i3Poq01;c0fKrr0sJt8L;ar,bilhAU;ar,u0G;atGbPiOli99m-LnKrr0sJt0;t0u5;diz2efiEz2;fKqJ;uer2;az2;j0r0;erJ;!ic0;if4;b01d96f00gu66iZjYlRmbPnOqNrLsKtJ;aBer,iz0uc0;ar,e0t0;aJbe0gaCr0;lh0te0;ue0;al3c0de0h0ir,z0;e0oJ;le0;aNbuLdFe0iKoJ;iç0;r,z0;ci0rJ;di0;nJr;ce0ç0;ar,ul0;l0nh0x0;ej0or0;a31uj0;b8Uc7Hd6Rf6Bg5Vi0j5Sl4Tm49n3Op2Iqu2Er1Gs0Xt07u01vRzMçJ;ambaKoNuJ;c4Vl0;rc0;aLeKuJ;crAl0;d0it0;f4LrJ;!ar;aPeMiLoJuW;c0lJ;um0;ar,lt0nh0r,s8Cv0ziC;l0nKrJss0;b0i37meB;t4Aç0;caBli5PnJri0ss86;tJç0;aj0;fNgDme5sLtKxiJ;li0;ent4or3u0;cuJe5piE;lt0;er1;a03eXiVoTrLuJ;a6Vc03lh0rJ;ar,d1;aNeMiKoJ;ar,fi0p7S;buJt0;ir,l0;l0v2;c0iKpaBs0vJ;a4Re43;r,ço0;ch0l0rJ;ar,do0me5;c0l0nJr0v0ç0;ar,g1;ar,mNnMrJst0;!m0rJ;ar,iJor3;ss0z0;d2t0u0;or3;baMc0lh0rKvi0zJ;an0;!a5ef0rJ;ac0;f0l4M;ar,ce1Gfixi0il0pZsJ;aWeRiOoKuJ;ar,m1nt0st0;a8JbKci0l0mJpr0vi0;ar,br0;eJi0;rb0;b2Cm2CnaKsJ;ar,t1;l0r;ar,di0gDmeBnKsJv7;s2Ft0;hoKtJ;ar,ir;re0;c0lJnh0r,ssA;a3Lt0;ar,eJir0;ar,rg1;a0Fb0Ec0d2e0Df0gu0Ci0Bma0Ao08p07qu04rKtJv27x0;ic5K;a00eMiLoKuJ;ar,in0m0;ch0g0j0l0mb0st0t0x0;ar,b0m0sc0;ar,bUcTdSf6gPlOmMnLpJst0;eJi0;l0nd2;d0eg0;at0eJ;d0ss0t2;i0v0;aKiJl0;me5;l0ç0;ar,o0D;ad0;aJe5it0;nh0t0;ig0m0nJs66zo0;c1Gh0j0;eKiJ;t2Wv0;ar,j0;ar,o0;maJ;r,t3;r,z0K;ar,sc0;ir,me5;ar,j0ng0;iIor3;nh0r;eLiJ;eJl5Cn33;sc2t0;bra5c2nt0;a0Fe07i06l04oXrKuJ;nh5Lp0r0;azUeRiQoJum0;fuOnt0pMvKxJ;im0;ar,e8iJ;si9;iJri0;nqu0;nd0;m0Vsi9;ci0eKgo0nd2sJç0;ar,e5s0t0;nd2;ar,er;dOi0nt0qNrMsJuc0;e5tJ;aJil0;r,t0;!riCt0;ue5;ar,er0r6;aJic0;c0in0n0ud1;ed0me5nh0t0;ar,drHg0lOnMquLrJt6ziC;cJfe5Wre0t0;eb2;en0;ar,dJs0;er,o0;ar,id0;ej0;drQg0ix9lPnNrJsce5v08ziO;aKeJtF;c2lh0nt0;fJr;us0;h0iJ;gu0;avr0p0;iCo0;a00cZdYeWgUiRoQsi0tLuJ;ir,l0nEvi0;ci0;eKipJ;at3;cKpJv2;or;ed2ip0;it6t0;ma36nKquJsM;il0;ar,h0;a0YusJ;ti0;l0steJx0;si0;ar,ej0o0;or0;lKrJ;qu3;is0;aVbTeRiQoLpJu0S;ar0liJut0;ar,f4;fAlMnto0rKsJtA;s0t0O;ar,d2Ken0n0ro0tJ;ec2iz0;ar,d0ec2g0;m0ud0;aJdro5ig0n3sIziC;lh0ç0;iJul0;ci9e5;ci0dur0Zin0lNme5nMrJss0;!ar,el0YfaCgKiCrJ;ar,ot0;ar,ur0;d0h0Vs0;d4DgJ;am0;a0Dbe0Cc09e07f04g03h02iXmVoUteSuOvJç0;eMiKorJ;ar,ec2oç0;ssJtr0;ar0;it0j0;cAd1g0ir,mLnJ;ar,iJ;ss0;br0i0;ar,rJ;ar,c0n0;c0j0ng0uc0;ej0oJ;rç0ç0;ar,cLen0ge3Hj0me5nJs2Yvi0;d0haJ;r,v0;eJi0;rç0;an0e0;em0;abet00inKorJ;ri0;et0;gJij0nt0rt0va5;ar,r0;aKoJuC;ol3v8;nç0;rg0;g0rKsIvaJ;nc0;!dFg0m0;ar,e0;e8oeKuJ;d0iz0nt0st0;ir0lh0;aWenViUlToRrMuJ;aKdJe5lh0ç0;ar,iz0;nt0r3G;aLeKilJup0;ho0;d1g0;ci0dJv0;ar,ec2;niJur0;ar,z0;om7utA;ga5l3ot0r,t0;ci0d0;ch0rr0sJ;aBt0;aVeSiQlPoMroLuJ;ge5nJ;d0il0;nt0ux0;b0f0g0it0rJ;ar,moJr0;se0;ar,ig1or0u1;a33gDli0nJrm0v1Kx0;ar,c0;ar,ct0iKrJt0;ir,r0ve5;t0ço0;dKg0m0n0st0zeJ;nd0r;ig0;apt0e03i01jXmToPqOstriNuLvJ;erJir,og0;s0t1;b0lJz1;ar,t7;ng1;uir1;c4ec2id0leLpt0rJt0ç0;ar,meJn0;c2nt0;sc2;iKoeJ;st0;nJr0t1;isI;etLuJ;d4nt0;ic0;iv0;a03ci9mJr,t0viC;pl1;j0lgMnLqu0rKsI;tr0;eç0ir,n0;s0tr0;aç0;a0Le0Hh0Bi08l06oRrOtLuJ;ar,d1mJr0s0;ul0;uaJ;l3r;iz0;eKisJ;ol0;d8sceO;beWcViUlTmRnOpl0rMsKtov0DvaJ;rd0;s0tJ;ar,um0;d0reJ;nt0r;ch11diJseBt6;ci9;on0;et2od0paJ;nh0ss0;h2it0;m0t0;h0or0;rt0;aJimM;m0r0;cKdJon0rr0;ar,e5;at0;aMeg0inKoJ;ch0ut0ç0;caB;lh0;c0r,t0vaJ;sc0;d2iLl7nKrJss0t0;c0t0;ar,d2tu0;r0t0;bRlQmPnOrLsKt0utJçap0;el0;al0;ar,e0iKreJt0;ar,t0;ci0nh0;h0to0;ar,p0;c0e5m0or0;ar,ruC;-r0Ua0Fd0De08i05jDlu1n03oXrPsKuJ;nd0s0;oMtJ;erKrJ;a1u1;!g2;lv2rv2;aMeLiJ;g0lha5r;nt0;vi0;c0nLsJç0;ar,ileJ;ir0;d0g2;caCi0lLmAn0rJto0;d0r6t0;in0;ar,ir,or6;ec2;nh0;eg0;ur0;c0sJ;co8m0;it0;b7cLir0nJ;dJço0;iço0;ar,ed0;er0;ic0uz1;ir;bWf0ix0lUnQrOsKtJul0;at0er;m0tJ;arKec2;er;!d0;c0rJ;ot0;aLc0dJ;aJon0;lh0r;n0r;aJiz0ro0;nç0r;ad0el0;og0;ar",
    "Ordinal": "true¦cIdHmilJnonFoCq5s2t0vigJ;erceirKr0;ecGigH;e0étH;gundHpt5tiAx0;agEcDtG;u1üin0;gBq2;a2in0;g9q0tC;uag9;dr0rtA;ag7i2;ct0itav8;i0og5;ng3;a0g2o6;!g2s;uc0éc2;ent0;és0;im0;a0o0;!s",
    "LastName": "true¦0:2Z;1:36;2:34;3:2A;4:2T;5:2V;a36b2Wc2Jd2Ae27f22g1Wh1Mi1Hj1Bk14l0Wm0Mn0Io0Fp04rXsMtHvFwCxBy8zh6;a6ou,u;ng,o;a6eun2Poshi1Hun;ma6ng;da,guc1Wmo23sh1YzaQ;iao,u;a7il6o4right,u;li36s2;gn0lk0ng,tanabe;a6ivaldi;ssilj32zqu1;a9h8i2Bo7r6sui,urn0;an,ynisI;lst0Mrr1Rth;atch0omps2;kah0Snaka,ylor;aDchCemjon3himizu,iBmiAo9t7u6zabo;ar1lliv25zuD;a6ein0;l1Yrm0;sa,u4;rn3th;lva,mmo1Zngh;midt,neid0ulz;ito,n7sa6to;ki;ch1dLtos,z;amBeag1Vi9o7u6;bio,iz,sD;b6dri1JgIj0Rme20osevelt,ssi,ux;erts,ins2;c6ve0D;ci,hards2;ir1os;aEeAh8ic6ow1W;as6hl0;so;a6illips;m,n1P;ders5et8r7t6;e0Lr3;ez,ry;ers;h1Xrk0t6vl3;el,te0H;baBg09liveiZr6;t6w1K;ega,iz;a6eils2guy5ix2owak,ym1A;gy,ka6;ji6muU;ma;aDeBiAo8u6;ll0n6rr09ssolini,ñ6;oz;lina,oIr6zart;al0Keau,r0R;hhail3ll0;rci0ssi6y0;!er;eVmmad3r6tsu06;in,tin1;aCe8i6op1uo;!n6u;coln,dholm;fe7n0Or6w0I;oy;bv6v6;re;mmy,rs5u;aBennedy,imuAle0Jo8u7wo6;k,n;mar,znets3;bay6vacs;asY;ra;hn,rl9to,ur,zl3;aAen9ha4imen1o6u4;h6nYu4;an6ns2;ss2;ki0Cs5;cks2nsse0B;glesi9ke8noue,shik7to,vano6;u,v;awa;da;as;aBe8itchcock,o7u6;!a4b0ghNynh;a4ffmann,rvat;mingw7nde6rM;rs2;ay;ns5rrPs7y6;asDes;an3hi6;moI;a9il,o8r7u6;o,tierr1;ayli4ub0;m1nzal1;nd6o,rcia;hi;er9lor8o7uj6;ita;st0urni0;es;nand1;d7insteGsposi6vaK;to;is2wards;aBevi,i9omin8u6;bo6rand;is;gu1;az,mitr3;ov;nkula,rw7vi6;es,s;in;aFhBlarkAo6;h5l6op0rbyn,x;em7li6;ns;an;!e;an8e7iu,o6ristens5u4we;i,ng,u4w,y;!n,on6u4;!g;mpb7rt0st6;ro;ell;aBe8ha4oyko,r6yrne;ooks,yant;ng;ck7ethov5nnett;en;er,ham;ch,h8iley,rn6;es,i0;er;k,ng;dDl9nd6;ers6rA;en,on,s2;on;eks7iy8var1;ez;ej6;ev;ams",
    "MaleName": "true¦0:C8;1:BF;2:BW;3:BN;4:AZ;5:BT;6:AN;7:9P;8:B7;9:AR;A:AI;B:BY;aAZbA3c92d83e7Df6Wg6Eh5Ui5Gj4Jk49l3Qm2Pn2Eo28p22qu20r1As0Rt07u06v01wOxavi3yHzC;aCor0;cCh8Dne;hDkC;!aAW;ar4ZeAV;ass2i,oDuC;sEu25;nFsEusC;oCsD;uf;ef;at0g;aKeIiDoCyaAK;lfgang,odrow;lCn1O;bEey,frBElC;aA0iC;am,e,s;e84ur;i,nde7sC;!l6t1;de,lDrr5yC;l1ne;lCt3;a8Yy;aFern1iC;cDha0nceCrg96va0;!nt;ente,t58;lentin47n8Tughn;lyss4Ksm0;aUePhLiJoFrDyC;!l3ro8s1;av9LeCist0oy,um0;nt9Dv52y;bEd7SmCny;as,mCoharu;aATie,y;i7Yy;mCt9;!my,othy;adEeoDia78omC;!as;!do7H;!de9;dFrC;en8CrC;an8BeCy;ll,n8A;!dy;dgh,ic9Onn3req,ts43;aRcotPeOhKiIoGpenc3tCur1Nylve8Czym1;anEeCua76;f0phAAvCwa75;e55ie;!islaw,l6;lom1n9YuC;leyma8ta;dCl7Em1;!n6;aEeC;lCrm0;d1t1;h6Nne,qu0Uun,wn,y8;am9basti0k1Wl3Zrg3Yth,ymo9D;!tC;!ie,y;lDmCnti21q4Hul;!mAu4;ik,vato6R;aXeThe8YiPoGuDyC;an,ou;b6HdDf9pe6MssC;!elAE;ol2Ty;an,bJcIdHel,geGh0la7DmFnEry,sDyC;!ce;coe,s;a91nA;an,eo;l3Ir;e4Pg3n6olfo,ri64;co,ky;bAe9Q;cCl6;ar5Lc5KhDkC;!ey,ie,y;a81ie;gDid,ub5x,yCza;ansh,nT;g8SiC;na8Os;ch5Ufa4lEmDndCpha4sh6Qul,ymo6W;al9Uol2Ay;i9Eon;f,ph;ent2inC;cy,t1;aGeEhilDier5Yol,reC;st1;!ip,lip;d97rcy,tC;ar,e2U;b3Rdra6Bt43ul;ctav2Uliv3m92rGsDtCum8Qw5;is,to;aDc8OvC;al4Z;ma;i,vK;athKeIiEoC;aCel,l0ma0r2W;h,m;cDg4i3HkC;h6Qola;hol5TkCol5T;!ol5S;al,d,il,ls1vC;il4X;anCy;!a4i4;aWeTiKoGuDyC;l20r1;hamDr5VstaC;fa,p4D;ed,mF;dibo,e,hamDis1Wnty,sCussa;es,he;ad,ed,mC;ad,ed;cHgu4kFlEnDtchC;!e7;a75ik;house,o04t1;e,olC;aj;ah,hCk6;a4eC;al,l;hDlv2rC;le,ri7v2;di,met;ck,hOlMmPnu4rIs1tEuricDxC;!imilianBwe7;e,io;eo,hDi4ZtC;!eo,hew,ia;eCis;us,w;cEio,kBlDqu6Dsha7tCv2;i2Hy;in,on;!el,oLus;achCcolm,ik;ai,y;amCdi,moud;adC;ou;aReOiNlo2RoJuDyC;le,nd1;cFiEkCth3;aCe;!s;gi,s;as,iaC;no;g0nn6OrenEuCwe7;!iC;e,s;!zo;am,on4;a78evi,la4PnDonCst3vi;!a5Yel;!ny;mDnCr65ur4Rwr4R;ce,d1;ar,o4L;aJeEhaled,iCrist4Tu46y3A;er0p,rC;by,k,ollos;en0iFnCrmit,v2;!dDnCt5A;e0Zy;a7ri4L;r,th;na66rCthem;im,l;aZeRiPoEuC;an,liCst2;an,us;aqu2eKhnJnHrFsC;eDhCi79ue;!ua;!ph;dCge;an,i,on;!aCny;h,s,th4V;!ath4Uie,nA;!l,sCy;ph;an,e,mC;!mA;d,ffHrEsC;sCus;!e;a5HemDmai8oCry;me,ni0P;i6Sy;!e56rC;ey,y;cId5kHmGrEsDvi3yC;!d5s1;on,p3;ed,od,rCv4K;e4Xod;al,es,is1;e,ob,ub;k,ob,quC;es;aObrahNchika,gLkeKlija,nuJrHsEtCv0;ai,sC;uki;aCha0i6Dma4sac;ac,iaC;h,s;a,vinCw2;!g;k,nngu50;!r;nacCor;io;im;in,n;aKeGina4ToEuCyd54;be23gCmber4AsE;h,o;m3ra31sCwa3V;se2;aEctDitDn4CrC;be1Ym0;or;th;bLlKmza,nJo,rEsDyC;a41d5;an,s0;lFo4DrEuCv6;hi3Yki,tC;a,o;is1y;an,ey;k,s;!im;ib;aReNiMlenLoJrFuC;illerDsC;!tavo;mo;aEegCov3;!g,orC;io,y;dy,h55nt;nzaCrd1;lo;!n;lbe4Ono,ovan4P;ne,oErC;aCry;ld,rdB;ffr6rge;bri4l5rCv2;la1Xr3Cth,y;aReOiMlKorr0HrC;anEedCitz;!dAeCri22;ri21;cEkC;!ie,lC;in,yn;esJisC;!co,zek;etch3oC;yd;d4lConn;ip;deriDliCng,rnan01;pe,x;co;bi0di;arZdUfrTit0lNmHnGo2rDsteb0th0uge8vCym5zra;an,ere2U;gi,iDnCrol,v2w2;estBie;c06k;och,rique,zo;aGerFiDmC;aFe2O;lCrh0;!io;s1y;nu4;be09d1iFliEmDt1viCwood;n,s;er,o;ot1Ts;!as,j43sC;ha;a2en;!dAg32mFuDwC;a25in;arC;do;o0Su0S;l,nC;est;aYeOiLoFrEuDwCyl0;ay8ight;a8dl6nc0st2;ag0ew;minicGnEri0ugDyC;le;!l03;!a29nCov0;e7ie,y;!k;armuDeCll1on,rk;go;id;anJj0lbeImetri9nGon,rFsEvDwCxt3;ay8ey;en,in;hawn,mo09;ek,ri0G;is,nCv3;is,y;rt;!dC;re;lLmJnIrEvC;e,iC;!d;en,iEne7rCyl;eCin,yl;l2Wn;n,o,us;e,i4ny;iCon;an,en,on;e,lC;as;a07e05hXiar0lMoHrFuDyrC;il,us;rtC;!is;aCistobal;ig;dy,lFnDrC;ey,neli9y;or,rC;ad;by,e,in,l2t1;aHeEiCyJ;fCnt;fo0Dt1;meDt9velaC;nd;nt;rEuDyC;!t1;de;enC;ce;aGeFrisDuC;ck;!tC;i0oph3;st3;d,rlCs;eCie;s,y;cCdric;il;lFmer1rC;ey,lDro7y;ll;!os,t1;eb,v2;ar03eVilUlaToQrDuCyr1;ddy,rtJ;aKeFiEuDyC;an,ce,on;ce,no;an,ce;nDtC;!t;dDtC;!on;an,on;dDndC;en,on;!foCl6y;rd;bDrCyd;is;!by;i8ke;al,lA;nGrCshoi;at,nDtC;!r11;aCie;rdB;!edict,iDjam2nA;ie,y;to;n6rCt;eCy;tt;ey;ar0Yb0Od0Kgust2hm0Hid5ja0Fl00mYnQputsiPrGsaFuDveCya0ziz;ry;gust9st2;us;hi;aJchIi4jun,maGnEon,tCy0;hCurB;ur;av,oC;ld;an,nd;el;ie;ta;aq;dHgelBtC;hoFoC;i8nC;!iBy;ne;ny;reCy;!as,s,w;ir,mCos;ar;an,bePd5eJfGi,lFonEphonIt1vC;aNin;on;so,zo;an,en;onDrC;edB;so;c,jaFksandEssaFxC;!and3;er;ar,er;ndC;ro;rtB;ni;en;ad,eC;d,t;in;aDolfBri0vik;!o;mCn;!a;dGeFraDuC;!bakr,lfazl;hCm;am;!l;allFel,oulaye,ulC;!lDrahm0;an;ah,o;ah;av,on",
    "Preposition": "true¦aAc9de6e4junto c9p2s0vind8às;em,ob0;!re;ara0or;! c5;m0ntre;! cim6b1;!b0ntr1pois,s6;aix0;o 4;om; partir 2cerc1lém,t0;ravés 1é;a 0;de",
    "Person": "true¦ashton kutchRbQcLdJeHgastMhFinez,jDkClebron james,mBnettIoAp8r4s3t2v0;a0irgin maF;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssIlobodan milosevic,uA;ay romano,eese witherspoHo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipI;lmHris hiltC;prah winfrEra;essiaen,itt romnDubarek;anye west,iefer sutherland,obe bryant;aime,effers8k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt2ick wolf;lt1nte;ar1lint0;on;dinal wols1son0;! palm2;ey;arack obama,rock;er",
    "Conjunction": "true¦como,e3logo,mas,nem,ou,po0q2;is,r0;q0ém;ue;!mbora,ntão",
    "Pronoun": "true¦aPcJeHisGlFmDnBo9qu8s7t6v0;o0ós;cêQs0;!sa 0;majes1s0;anti0enhoria;ta4;e,i,u;e,i;al,em; senhor,cê,n0s senhores;de;os,ó0;is,s;e0im;!ritíssimo;aCheCoC;so,to;l9s0u;s8t8;o1uj0ê;a7o7;m2n0;no0o0s1t1;sco;igo; 3qu0s senhoras;el0ilo;a0e0;!s;gente,senhora",
    "Determiner": "true¦a2el,o2u0;m0ns;!a0;!s",
    "City": "true¦0:45;a3Ub39c2Gd27e1Zf1Tg1Oh1Hi1Fj1Bk17l11m0Ln0Ho0Ep08q05rZsJtDuCv8w7x5y3za1;greb,po1;p2Drizh0;a1okohama;ng20roslavl;ang2Vi1un0F;'an,an;roclaw,uh28;a3i2o1;lgog3Bronezh;e3Flni2E;lênc0rs29;fa,lyanov2P;bilisi,e4i3o2rujil9u1óquP;cum25r33;gliatti,ron39;anj1Ujua39ra39;erã1gucigal3Hresi38;!o;a8e7he5kopje,tuttga1Cu4ão 1óf0;bernardo do campo,francis28gonça2luís,p1;au1eters1L;lo;c10rra2W;ffield,n1;ya27zh1M;ul,vi08;l7n2ra1;goça,tB; 4t1;a cruz de la sier35iago1o domin23;! de 1;cZlos caballer0U;anton5die20jose,pedro su2Q;vador,ônica;angum,ecife,i5o1yaz1G;ma,s1tterd2F;t2ár1;io;ov;a30ga,o de janei24;ingdao,u1;eréta22i1;nxa9to;a5e4hoenix,o2rEu1;eb2Ene;rto 1znań;alegUpríncipe;n0Mqu25rm;ler0Qr03;de2r0Es1ttawa;a0Flo;ssa;a2ezahualcóyotl,izhny novgorod,ova i1ápol1U;guaçu,orq29;berezhnye chelny,go0n1t8ucalp0W;qu1X;aBe9i8o3u2ykolaOál1;aga;mb1Dniq24;nt2sco1;u,vo;e2re1;al;rrey,vidéu;ami,l29n18;dellín,ndo04xic1;ali;ceió,drid,khachka1Rn4r1;aca2se1;lha;ibo,y;a0OchestMi1Nágua;a3eipzig,i2o1uan01v8y03é03;dz,ndr19s angel19;ma,pet0YsbA; p2gMho1;re;az,la1Q;a3hark2iev,r1uala lumpur;asnodar,yvyi rih;iv;rachi,z05;ac3in04o1;anesUão pess1;oa;ar1Iksonville;erev00ndianápol1stambul,zhev0M;is;a3elsinq1Ao1yder1P; 0Bng1ustM; ko0Duecong18;ider1JmMn1rbQva15;c2ov1;er;heu;anja,lasgow,o3ua1ênova;dalaja1Arulh1yaquil;os;iân0t1;emE;iladélf0o3rankfu2ukuo1;ka;rt;rt1shJ; worth,ale1;za;cate6dmont5l al0Ps1;sBt1;ocol2ugar1;da;mo;on;pec,rim1;burR;a7etroit,nip01o5resd4u2él1üsseldorf;hi,i;bl1isburg,que de caxi0O;in;en;n1rtmund;etOggu2;ca,li1r es sala01;an;aMhEi9o5rac4u1órdo2úcu0G;liac2riti1;ba;án;óv0;l2ncepción,penhag1;a,ue;umb1ón0ôn0;us;dade d2udad 1;guayaZjuárez;a guatemaWe ho 2o méxi1;co;chi minh;e4i1ongqi2;ca2ttago1șinău;ng;go;lyabin3n1;ai,gdu,n1;ai;sk;i6l5mp4nt00r1;ac2t1;ageLum;as,hi;inRo granY;cu7gary;ro;aCe7irmingh6ogo5r4u1;car2dap2enos air1;es;es7;asíl0uxelK;tá;am;l2rl1;im;g2o horizon1ém;te;rado;gd8ku,ng5r1;celo3quisime2ranquil1;la;to;na;alor2kok,uecoq1;ue;!e;aBá;hmedClexandr0m6nca5requi4stracã,t1;en2lan1;ta;as;pa;ra;e1sterdã;d2sterd1;ão;aba1;de;ia;abad",
    "Region": "true¦0:23;1:1U;a21b1Tc1Jd1Ees1Df1Ag14h11i0Yj0Wk0Ul0Rm0GnZoXpTqQrNsEtButAv7w4y2zacatec23;o05u2;cat19kZ;a2est vi5isconsin,yomi15;rwick1shington2;! dc;er3i2;rgin1T;acruz,mont;ah,tar pradesh;a3e2laxca1EuscaB;nnessee,x1S;bas0Lmaulip1RsmK;a7i5o3taf0Pu2ylh14;ffVrr01s0Z;me11uth 2;cSdR;ber1Jc2naloa;hu0Tily;n3skatchew0Sxo2;ny; luis potosi,ta catari0;a2hode8;j2ngp03;asth0Nshahi;inghai,u2;e2intana roo;bec,ensXreta0F;ara0e3rince edward2; isV;i,nnsylv2rnambu03;an15;axa0Pdisha,h2klaho1Dntar2reg5x06;io;ayarit,eCo4u2;evo le2nav0N;on;r2tt0Tva scot0Z;f7mandy,th2; 2ampton1;c4d3yo2;rk1;ako10;aroli0;olk;bras0Zva03w2; 3foundland2;! and labrador;brunswick,hamp1jers3mexiLyork2;! state;ey;a7i3o2;nta0relos;ch4dlanCn3ss2;issippi,ouri;as geraHneso0N;igRoacR;dhya,harasht05ine,ni4r2ssachusetts;anhao,y2;land;p2toba;ur;anca1e2incoln1ouis9;e2iI;ds;a2entucky,hul0;ns09rnata0Eshmir;alis2iangxi;co;daho,llino3nd2owa;ia0;is;a3ert2idalFunB;ford1;mp1waii;ansu,eorgXlou6u2;an3erre2izhou,jarat;ro;ajuato,gdo2;ng;cester1;lori3uji2;an;da;sex;e5o3uran2;go;rs2;et;lawaFrby1;a9ea8hi7o2umbrI;ahui5l4nnectic3rsi2ventry;ca;ut;iNorado;la;apFhuahua;ra;l9m2;bridge1peche;a6r5uck2;ingham1;shi2;re;emen,itish columb4;h3ja cal2sque,var3;iforn2;ia;guascalientes,l5r2;izo0kans2;as;na;a3ber2;ta;ba3s2;ka;ma",
    "Country": "true¦0:2M;a29b1Vc1Hd1Fe18f12g0Uh0Ti0Mj0Kk0Jl0Bm03nXomã,pTquSrKsAt5u4v3z2á1í16;frica Eustr0;imbabwe,â1L;anuatu,enezue2EietA;cr2Hg0LruSzbe1N;a4imor-les1Ho3rinidad e toba09u1;nís0rqu1valu;emen2Gia;go,nR;i0Wji1Inz2C;a7e6ingapu28om20ri lanka,u2ão 1érv0ír0;cristóvão e nevis,tomé e príncipe,vicente e granad0W;azi0Tdão2ri1éc0í0R;name;! 1;do s16;neg0Jrra le3ychell1D;m2n1; mariVta lúc0;oa;e1om1Su05ú1H;ino unido,pública 1;c4d1;a macedVemocrática do 2o1; 1min3;conP;entro-afr1he16;ica1N;irgu1Vén0;a2e9o1;lOrtug05;l03namá,pua-nova guiné,qu1Sra1íses baix1A;guai;a4ep02i3o1íger;rue1va ze07;ga;carágua,gG;míb0u1;ru;a4icrOo2yanm7éxi1óna1;co;ldáv0n1çambiL;gól0tenegro;dagásc3l2rroc0Yur1;it1Díc0;awi,div0Zi,ta,ás0;ar;a0Ue6i4uxembur3íb1;a1ia;no;go;b1echtenst0Stu16;ér0;soXt1;ón0;iribaXuwait;a1ord11;mai0Bp13;lhas 6nd5r2s1t0Oémen;lâJrael;a2l1ã;an0R;que;onés0;marshall,salom0W;aiNondur0Fungr0;a7eórg0r6u1âT;atema0Mi1;a0Iné1;! equatori2-biss1;au;al;ana0Géc0;b0Nna;i2ran1;ça;ji,lip3n1;lâ1;nd0;in01;gi6l salv5mirados árabe4qu5ritre0s1tióp0;lov2p0Bt1;ado2ón0;áqu0én0;s unidT;ador;to;inamarHjibou1ominiH;ti;a9h7o1roác0uba;lô5morBreia do 2sta 1;do marfKriD;nor2s1;ul;te;mb0;a6i1;le,na,pre;bo ver4m2nadá,za1;quW;arõ1boja;es;de;a9e7ielorrú6o5r4u2élgi1ósnia e herzegoviJ;ca;lgár0r1tR;kina faso,undi;asil,unei;lív0tswaE;ss0;lize,n1;im;h2ngladesh,rbad1;os;am2r1;ein;as;feganElAn6r2ustr1zerbaijF;ál0;g2m1ábia saudita;én0;enti1él0;na;dor3go2tígua e barbu1;da;la;ra;b2em1;anha;ân0;ia;ist1;ão",
    "FemaleName": "true¦0:FV;1:FZ;2:FO;3:FA;4:F9;5:FP;6:EO;7:GC;8:EW;9:EM;A:G8;B:E2;C:G5;D:FL;E:FI;F:ED;aDZbD1cB8dAIe9Gf91g8Hh83i7Sj6Uk60l4Om38n2To2Qp2Fqu2Er1Os0Qt04ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7EeHol1TvG;et9onB8;le0sen3;an8endBMhiB3iG;lInG;if3AniGo0;e,f39;a,helmi0lGma;a,ow;aMeJiG;cHviG;an9XenFY;kCWtor3;da,l8Vnus,rG;a,nGoniCZ;a,iD9;leGnesE9;nDIrG;i1y;aSePhNiMoJrGu6y4;acG0iGu0E;c3na,sG;h9Mta;nHrG;a,i;i9Jya;a97ffaCDna,s5;al3eGomasi0;a,l8Go6Xres1;g7Uo6WrHssG;!a,ie;eFi,ri7;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmC7ra;!ka;a,t5;at5it5;a05carlet2Ye04hUiSkye,oQtMuHyG;bFGlvi1;e,sHzG;an2Tet9ie,y;anGi7;!a,e,nG;aEe;aIeG;fGl3DphG;an2;cF5r6;f3nGphi1;d4ia,ja,ya;er4lv3mon1nGobh75;dy;aKeGirlBIo0y6;ba,e0i6lIrG;iGrBMyl;!d70;ia,lBS;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;l5Yre0;bMdLi8lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBKome;e,ie;in1ri0;a02eXhViToHuG;by,thBH;bQcPlOnNsHwe0xG;an93ie,y;aHeGie,lC;ann7ll1marBCtB;!lGnn1;iGyn;e,nG;a,d7W;da,i,na;an8;hel53io;bin,erByn;a,cGkki,na,ta;helBWki;ea,iannDUoG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;cAOkaE;chGe,i0mo0n5EquCAvDy0;aC9elGi8;!e,le;een2ia0;aMeLhJoIrG;iGudenAT;scil1Uyamva8;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvaB8tHulG;a,et9in1;ricGsy,tA5;a,e,ia;ctav3deHfATlGphAT;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeD;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hoAZk8AolG;a,eBE;!mh;l7Sna,risF;dIi5PnHo23taG;li1s5;cy,et9;eAiCL;a01ckenz2eViLoIrignayani,uriBDyG;a,rG;a,na,tAP;i4ll9UnG;a,iG;ca,ka,qB1;a,chOkaNlJmi,nIrGtzi;aGiam;!n8;dy,erva,h,n2;a,dIi9GlG;iGy;cent,e;red;!e6;ae6el3G;ag4KgKi,lHrG;edi61isFyl;an2iGliF;nGsAJ;a,da;!an,han;b08c9Bd06e,g04i03l01nZrKtJuHv6Sx85yGz2;a,bell,ra;de,rG;a,eD;h74il8t2;a,cSgOiJjor2l6In2s5tIyG;!aGbe5QjaAlou;m,n9P;a,ha,i0;!aIbAIeHja,lCna,sGt53;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri9;!t;!ry;et3IiB;elGi61y;a,l1;dGon,ue6;akranBy;iGlo36;a,ka,n8;a,re,s2;daGg2;!l2W;alCd2elGge,isBDon0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9PnGsAN;!a,e9O;a,sAL;aAYcJelIiFlHna,pG;e,iB;a,u;a,la;iGy;a2Ae,l25n8;is,l1GrHtt2uG;el6is1;aIeHi7na,rG;a6Xi7;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,be4Ket9z2;a,et9;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8De;!n4F;b7Qerty;!n5Q;aNda,e0iLla,nKoIslAOtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Pi6kes5rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5A;a,en,iGy;!e,n48;ri,urtn97;aMerLl96mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6MiJlInHrG;a,i,ri;d4na;ey,i,l9Ns2y;ra,s5;c8Ti5UlOma6nyakumari,rMss5JtJviByG;!e,lG;a,eG;e,i75;a5CeHhGi3PlCri0y;ar5Aer5Aie,leDr9Cy;!lyn70;a,en,iGl4Tyn;!ma,n31sF;ei6Zi,l2;a04eVilToMuG;anKdJliGst54;aHeGsF;!nAt0W;!n8U;i2Ry;a,iB;!anLcelCd5Sel6Yhan6FlJni,sHva0yG;a,ce;eGie;fi0lCph4V;eGie;en,n1;!a,e,n36;!i10lG;!i0Z;anLle0nIrHsG;i5Nsi5N;i,ri;!a,el6Mif1RnG;a,et9iGy;!e,f1P;a,e6ZiHnG;a,e6YiG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min7;a7eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGob6R;do4;!belGdo4;!a,e,l2G;en1i0ma;a,di4es,gr5O;el8ogG;en1;a,eAia0o0se;aNeKilHoGyacin1N;ll2rten1H;aHdGlaH;a,egard;ry;ath0WiHlGnrietBrmiAst0W;en24ga;di;il72lKnJrGtt2yl72z6A;iGmo4Cri4D;etG;!te;aEnaE;ey,l2;aYeTiOlMold12rIwG;enGyne18;!dolC;acHetGisel8;a,chD;e,ieG;!la;adys,enGor3yn1Y;a,da,na;aJgi,lHna,ov6YselG;a,e,le;da,liG;an;!n0;mYnIorgHrG;ald33i,m2Rtru70;et9i0;a,eGna;s1Nvieve;briel3Cil,le,rnet,yle;aReOio0loMrG;anHe8iG;da,e8;!cG;esHiGoi0G;n1s3S;!ca;!rG;a,en40;lHrnG;!an8;ec3ic3;rHtiGy7;ma;ah,rah;d0FileDkBl00mUn47rRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2F;geni1la,ni3O;h4Zta;meral8peranJtG;eHhGrel6;er;l2Mr;za;iGma,nest27yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoG;lor4Yminiq3Vn0rGtt2;a,eDis,la,othGthy;ea,y;an08naEonAx2;anPbOde,eNiLja,lImetr3nGsir4R;a,iG;ce,se;a,iHla,orGphiA;es,is;a,l5G;dGrdG;re;!d4Jna;!b29oraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1TyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et9iG;!ca,el17ka;arGia;is;a0Oe0Lh03i01lToIrHynG;di,th3;is2Ay03;lOnLrHurG;tn1B;aId26iGn26riA;!nG;a,e,n1;!l1Q;n2sG;tanGuelo;ce,za;eGleD;en,t9;aIeoHotG;il49;!pat4;ir7rIudG;et9iG;a,ne;e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;isJlHmG;aiA;a,eGot9;n1t9;!sa;d4el1NtG;al,el1M;cGli3E;el3ilG;e,ia,y;iXlWmilVndUrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2FsG;a2Eie;iLlJmelIolHrG;ie,ol;!e,in1yn;!a,la;a,eGie,y;ne,y;na,sF;a0Di0D;a,e,l1;isBl2;tlG;in,yn;arb0CeYianXlVoTrG;andRePiIoHyG;an0nn;nwCok7;an2NdgKg0ItG;n27tG;!aHnG;ey,i,y;ny;etG;!t7;an0e,nG;da,na;i7y;bbi7nG;iBn2;ancGossom,ytG;he;ca;aRcky,lin8niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy7;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et9iA;!triG;ce,z;a4ie,ra;aliy29b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,r25;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGt1P;eHi7yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t9;an19elG;le;aYdWeUgQiOja,nHtoGya;inet9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;la;bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n8;da;aTba,eNiKlIyG;a,c3sG;a,on,sa;iGys0J;e,s0I;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i7y;!e;il;ah",
    "Place": "true¦aLbJcHdGeEfDgAh9i8jfk,kul,l7m5new eng4ord,p2s1the 0upIyyz;bronx,hamptons;fo,oho,under2yd;acifLek,h0;l,x;land;a0co,idCuc;libu,nhattJ;ax,gw,hr;ax,cn,ndianGst;arlem,kg,nd;ay village,re0;at 0enwich;britain,lak2;co,ra;urope,verglad0;es;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m5ntar1r1sia,tl0;!ant1;ct0;ic0; oce0;an;ericas,s",
    "Month": "true¦a6dez5fever4j1ma0nov5set5;io,rço;an2u0;l0n0;ho;eiro ;embro;bril,gosto",
    "WeekDay": "true¦domingo,qu0sábado,terç1;art0int0;a-feira",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "Cardinal": "true¦bilhão,cLdDmAnove9o6qu3se2tr0vinte,zero;eze0inOês;!ntE;is5ssLte6;a1in0;hAze;rItro2;it0nL;enHo0;!c6;!c5nF;eia,il0;!h0;ão,ões;ez4o3u0;as,z0;ent0;as,os;is,ze;!a0e0oi8;nove,sse0;is,te;ator6e4in0;co,q0;u0ü0;en0;ta;m,n0;to;ze"
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
  const unpack$1 = function (str) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0
    };
    //process symbols, if they have them
    if (str.match(':')) {
      symbols(trie);
    }
    return toArray(trie)
  };

  const unpack = function (str) {
    if (!str) {
      return {}
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('¦');
      h[arr[0]] = arr[1];
      return h
    }, {});
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      const arr = unpack$1(obj[cat]);
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

  const prefix = /^([0-9]+)/;

  const toObject = function (txt) {
    let obj = {};
    txt.split('¦').forEach(str => {
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

  // generated in ./lib/models
  var model$1 = {
    "nouns": {
      "plurals": {
        "fwd": "2:is,os¦3:les¦eses:és¦omens:ômen¦tivos:ctivo¦ípios:ipalidade¦ções:cionamento¦es:uíche¦1s:i,u,ocicleta¦1ões:hão¦1ças:nca¦1os:nalha,vente¦1ntes:atividade¦2es:ar¦2s:se,re,cagem,ãe¦2mentos:tida¦3s:rta,stagem,rvo,pio¦3ões:lação¦4s:ínio",
        "both": "1:x¦3:ele,rne,bus¦4:atia,rata,reia,uisa,huva,sica,mida,alda,nave,írus,ires¦5:lguém,o mar,bília,açada¦5s:arede,oalha,lento,iária,anche,mente,tente,róbio,ntivo,ldade,rdade,vento,haria,itivo,iente,nente,rente,edade,dente,istão¦5ões:efeição,ficação,oibição,nização¦4s:leia,ffle,inte,tade,onte,tata,onto,oria,ábio,ueta,deia,adril,pite,eria,uivo,oite,ieta,ilha,tica,olha,mite,elha,cego,êmio,neta,ante,imen,have,ótão,rmão,uene¦4tários:tilidade¦4ados:prego¦4es:oder,ossil,abor,lemão,lher¦4ões:lgação,nsação¦4duras:eima¦3s:ino,lio,lvo,tua,cie,gia,vio,ita,tio,one,ono,ote,eto,cha,eca,ago,ute,oia,ano,úde,dio,uxo,ste,lta,uta,mia,oca,uia,lhe,rte,uto,nia,pia,ole,aca,sto,gio,ate,ude,fio,avo,ete,ato,cio,lde,rca,ota,aia,igo,cia,dia,lto,ito,sta,rio,nta,mao,rno,nha,ogo,rto,dão,fão,rril¦3ões:dição,uação,vação,iação,estão,rição,uição,ortão,oação,nação,ração,pação,tação¦3tados:jeição¦3es:nor,eus,dor,sul,sor,atão,itão,uer,tor,fen,lor¦3ues:ues¦3eis:értil,íssil,tátil,óssil¦2nhões:mião¦2ões:erão,rção,lmão,orão,cção,agão,drão,ução,nção,eção,otão,imão,azão¦2s:ge,ll,fil,eo,za,jo,fa,ma,ue,oo,xe,po,be,me,oa,mo,na,pa,vil,ce,ra,bo,xa,fe,pe,ja,la,va,do,ea,ça,da,ço,ho,aí,so,co,nil,ga,cil,lo,ro,sa¦2as:ílo¦2is:calização,ool,iel,vel,aul¦2dos:zagem¦2eis:xtil¦2es:ís¦1ões:cão,xão,jão,lão,são,ião,eão¦1nks:igação¦1ízes:uiz¦1s:t,á,ê,é,ã¦1nerais:eral¦1posições:xibição¦1ícias:leite¦1i:pus¦1oes:cao¦1éis:tel,uel,nel¦1is:al¦1es:z¦urbios:úrbio¦cusas:fugo¦ômenos:omeno¦centagens: cento¦ústrias:ustria¦ós:ô¦enhos:ign¦clamações:ivindicação¦uniores:únior¦ateres:áter¦eses:ês¦óis:ol¦ns:m",
        "rev": "1:a,l,o,e,z¦2:ãos,tes,aus,éus,tos,des,has,carias,uas,ules,eus,bis¦3:pis,cares,mores,axis,ises,tares,veres,lias,tres,gares,eias,iares¦4:tlas,ônus,letas,ortas,cles,wares,vores,órias¦5:tadoras¦el:éis¦ênior:eniores¦:hares¦1il:teis¦1l:uis¦1és:veses¦1o:aes¦1ômen:domens¦1ctivo:etivos¦2l:zis,ties¦2ão:lhões¦2a:ndimentos¦2ção:camentos¦2ipalidade:icípios¦2uíche:ndes¦3ão:eições,bições,artas,zações¦3da:atimentos¦3gem:ncas¦3cionamento:elações¦4ão:slações¦4tividade:entantes¦5ão:pulações,iolações",
        "ex": "3:paz¦4:sede,água,cais¦5:atlas,bônus,caril,lição,sorte,dados¦7:galinha,pressão¦8:educação,história¦9:concessão,segurança¦10:literatura,laticínios¦12:eletricidade¦3s:mão,ovo,tia,ato,dia,lua,rio,pia,rua,fio,ano,pai,boi,rei,lei,mãe¦2es:cão,pão,pao,cao,ar¦4eis:réptil¦3es:gas,cor,dor,sul,mar,bar,par¦3éis:papel¦5s:dente,órgão,pente,ativo,falha,leite,mente,livre,listagem,nervo,torre¦3is:azul¦5ões:eleição,ambição¦4s:fuzil,grão,ilha,rede,foto,meia,veia,base,motocicleta¦4es:amor¦5es:reptil,dever¦9s:atividade,bicicleta,orçamento,densidade,casamento,movimento,obesidade,pagamento,qualidade,realidade,princípio¦10s:quantidade,autoridade,nascimento,comunidade,capacidade,sentimento,isolamento,identidade,lançamento,mobilidade,habilidade,velocidade,pensamento,toxicidade,condomínio¦11s:apartamento,celebridade,diversidade,experimento,crescimento,integridade,comprimento,mortalidade,necessidade,privacidade,mensalidade¦15s:disponibilidade¦7s:batalha,migalha,família,aumento,assento,unidade,vitória¦13s:comportamento,consentimento,flexibilidade,financiamento,probabilidade,possibilidade,processamento,produtividade,sensibilidade,armazenamento¦1eniores:sênior¦4as:cartão¦13as:transportador¦6s:cidade¦2ões:ação¦12s:departamento,envolvimento,arrendamento,procedimento,recrutamento,estabilidade¦5rias:pesca¦8s:presente¦4imentos:renda¦6mentos:medicação¦14s:confiabilidade¦16s:responsabilidade,sustentabilidade¦3hares:mil¦9ões:atualização¦3ças:danca¦4os:fornalha,servente"
      }
    },
    "adjectives": {
      "f": {
        "fwd": "1:os,a",
        "both": "1:ão,ó,z,e¦2:em,el,il¦3:aso,zul¦4a:nhol¦éia:eu¦esa:ês¦á:au¦a:o",
        "rev": "4:anja¦1m:oa¦2s:co¦3s:ito",
        "ex": "2a:bom"
      },
      "mp": {
        "fwd": "s:¦eis:il",
        "both": "1:ó¦3:nja¦2es:mão¦2is:vel¦2a:itos¦1óis:hol¦1es:z¦1is:ul¦1a:cos¦eses:ês¦ns:m",
        "rev": "1:os,us¦2:ves,des,tes¦3:bres,oces¦4:remes¦1il:ceis¦1o:sa",
        "ex": "3a:raso"
      },
      "fp": {
        "fwd": "2:os¦eis:il¦1is:el",
        "both": "3:nja¦4ias:ropeu¦3s:aso¦2as:ol¦2es:iz¦1s:ão,e¦1ns:em¦1as:om¦1is:ul¦esas:ês¦ás:au¦as:o",
        "rev": "1:ó¦3:cos¦4:itos¦1il:ceis¦2l:veis",
        "ex": "2:só"
      }
    },
    "conditional": {
      "first": {
        "fwd": "ia:¦oria:ôr¦coitaria:çoitar¦1ria:izer¦2ria:fazer¦2caria:inçar",
        "both": "4ria:sprazer¦3caria:troçar,braçar",
        "rev": "2:eria,iria,oria¦3:maria,daria,laria,taria,garia,çaria,oaria,haria,varia,saria,jaria,paria,baria,zaria,naria,iaria,earia,uaria,xaria¦4:ncaria,traria,araria,oraria,uraria,iraria,icaria,ucaria,nraria,graria,braria,eraria,rraria,draria,rcaria,ecaria,scaria,fraria,lcaria,ufaria,craria,lraria,vraria,ofaria,ifaria,afaria,lfaria¦5:mpraria,locaria,vocaria,opraria,tacaria,hocaria,focaria,lacaria,upraria,pocaria,bocaria,pacaria,hacaria,arfaria,tocaria¦2çar:mocaria¦3zer:sfaria,sdiria,ldiria,-faria¦4zer:radiria,endiria,mefaria,safaria,erdiria¦4çar:trincaria¦5zer:trafaria,rrefaria",
        "ex": "2ria:fazer,dizer¦3ria:trazer,afazer¦2caria:coçar,roçar,laçar¦3caria:calçar,forçar,atiçar¦4caria:remoçar¦2ia:ir¦3ia:dar¦1oria:pôr¦5ia:tocar,focar,tacar,sacar,locar,socar,arfar¦4ria:refazer,redizer¦6ia:trocar,brocar,blefar,surfar¦4ia:orar,irar,arar,erar¦5ria:condizer,perfazer,predizer¦10ia:reciprocar,embasbacar¦8ia:triunfar,derrocar,atarefar¦7ia:atracar,xerocar,ensacar,assacar¦1coitaria:açoitar¦7ria:putrefazer,liquefazer¦6ria:rarefazer¦9ia:atarracar,esburacar"
      },
      "second": {
        "fwd": "ias:¦orias:ôr¦coitarias:çoitar¦1rias:izer¦2rias:fazer¦2carias:inçar",
        "both": "4rias:sprazer¦3carias:troçar,braçar",
        "rev": "2:erias,irias,orias¦3:marias,darias,larias,tarias,garias,çarias,oarias,harias,varias,sarias,jarias,parias,barias,zarias,narias,iarias,earias,uarias,xarias¦4:ncarias,trarias,ararias,orarias,urarias,irarias,icarias,ucarias,nrarias,grarias,brarias,erarias,rrarias,drarias,rcarias,ecarias,scarias,frarias,lcarias,ufarias,crarias,lrarias,vrarias,ofarias,ifarias,afarias,lfarias¦5:mprarias,locarias,vocarias,oprarias,tacarias,hocarias,focarias,lacarias,uprarias,pocarias,bocarias,pacarias,hacarias,arfarias,tocarias¦2çar:mocarias¦3zer:sfarias,sdirias,ldirias,-farias¦4zer:radirias,endirias,mefarias,safarias,erdirias¦4çar:trincarias¦5zer:trafarias,rrefarias",
        "ex": "2rias:fazer,dizer¦3rias:trazer,afazer¦2carias:coçar,roçar,laçar¦3carias:calçar,forçar,atiçar¦4carias:remoçar¦2ias:ir¦3ias:dar¦1orias:pôr¦5ias:tocar,focar,tacar,sacar,locar,socar,arfar¦4rias:refazer,redizer¦6ias:trocar,brocar,blefar,surfar¦4ias:orar,irar,arar,erar¦5rias:condizer,perfazer,predizer¦10ias:reciprocar,embasbacar¦8ias:triunfar,derrocar,atarefar¦7ias:atracar,xerocar,ensacar,assacar¦1coitarias:açoitar¦7rias:putrefazer,liquefazer¦6rias:rarefazer¦9ias:atarracar,esburacar"
      },
      "third": {
        "fwd": "ia:¦oria:ôr¦coitaria:çoitar¦1ria:izer¦2ria:fazer¦2caria:inçar",
        "both": "4ria:sprazer¦3caria:troçar,braçar",
        "rev": "2:eria,iria,oria¦3:maria,daria,laria,taria,garia,çaria,oaria,haria,varia,saria,jaria,paria,baria,zaria,naria,iaria,earia,uaria,xaria¦4:ncaria,traria,araria,oraria,uraria,iraria,icaria,ucaria,nraria,graria,braria,eraria,rraria,draria,rcaria,ecaria,scaria,fraria,lcaria,ufaria,craria,lraria,vraria,ofaria,ifaria,afaria,lfaria¦5:mpraria,locaria,vocaria,opraria,tacaria,hocaria,focaria,lacaria,upraria,pocaria,bocaria,pacaria,hacaria,arfaria,tocaria¦2çar:mocaria¦3zer:sfaria,sdiria,ldiria,-faria¦4zer:radiria,endiria,mefaria,safaria,erdiria¦4çar:trincaria¦5zer:trafaria,rrefaria",
        "ex": "2ria:fazer,dizer¦3ria:trazer,afazer¦2caria:coçar,roçar,laçar¦3caria:calçar,forçar,atiçar¦4caria:remoçar¦2ia:ir¦3ia:dar¦1oria:pôr¦5ia:tocar,focar,tacar,sacar,locar,socar,arfar¦4ria:refazer,redizer¦6ia:trocar,brocar,blefar,surfar¦4ia:orar,irar,arar,erar¦5ria:condizer,perfazer,predizer¦10ia:reciprocar,embasbacar¦8ia:triunfar,derrocar,atarefar¦7ia:atracar,xerocar,ensacar,assacar¦1coitaria:açoitar¦7ria:putrefazer,liquefazer¦6ria:rarefazer¦9ia:atarracar,esburacar"
      },
      "firstPlural": {
        "fwd": "íamos:¦oríamos:ôr¦coitaríamos:çoitar¦1ríamos:izer¦2ríamos:fazer¦2caríamos:inçar",
        "both": "4ríamos:sprazer¦3caríamos:troçar,braçar",
        "rev": "2:eríamos,iríamos,oríamos¦3:maríamos,daríamos,laríamos,taríamos,garíamos,çaríamos,oaríamos,haríamos,varíamos,saríamos,jaríamos,paríamos,baríamos,zaríamos,naríamos,iaríamos,earíamos,uaríamos,xaríamos¦4:ncaríamos,traríamos,araríamos,oraríamos,uraríamos,iraríamos,icaríamos,ucaríamos,nraríamos,graríamos,braríamos,eraríamos,rraríamos,draríamos,rcaríamos,ecaríamos,scaríamos,fraríamos,lcaríamos,ufaríamos,craríamos,lraríamos,vraríamos,ofaríamos,ifaríamos,afaríamos,lfaríamos¦5:mpraríamos,locaríamos,vocaríamos,opraríamos,tacaríamos,hocaríamos,focaríamos,lacaríamos,upraríamos,pocaríamos,bocaríamos,pacaríamos,hacaríamos,arfaríamos,tocaríamos¦2çar:mocaríamos¦3zer:sfaríamos,sdiríamos,ldiríamos,-faríamos¦4zer:radiríamos,endiríamos,mefaríamos,safaríamos,erdiríamos¦4çar:trincaríamos¦5zer:trafaríamos,rrefaríamos",
        "ex": "2ríamos:fazer,dizer¦3ríamos:trazer,afazer¦2caríamos:coçar,roçar,laçar¦3caríamos:calçar,forçar,atiçar¦4caríamos:remoçar¦2íamos:ir¦3íamos:dar¦1oríamos:pôr¦5íamos:tocar,focar,tacar,sacar,locar,socar,arfar¦4ríamos:refazer,redizer¦6íamos:trocar,brocar,blefar,surfar¦4íamos:orar,irar,arar,erar¦5ríamos:condizer,perfazer,predizer¦10íamos:reciprocar,embasbacar¦8íamos:triunfar,derrocar,atarefar¦7íamos:atracar,xerocar,ensacar,assacar¦1coitaríamos:açoitar¦7ríamos:putrefazer,liquefazer¦6ríamos:rarefazer¦9íamos:atarracar,esburacar"
      },
      "secondPlural": {
        "fwd": "íeis:¦oríeis:ôr¦coitaríeis:çoitar¦1ríeis:izer¦2ríeis:fazer¦2caríeis:inçar",
        "both": "4ríeis:sprazer¦3caríeis:troçar,braçar",
        "rev": "2:eríeis,iríeis,oríeis¦3:maríeis,daríeis,laríeis,taríeis,garíeis,çaríeis,oaríeis,haríeis,varíeis,saríeis,jaríeis,paríeis,baríeis,zaríeis,naríeis,iaríeis,earíeis,uaríeis,xaríeis¦4:ncaríeis,traríeis,araríeis,oraríeis,uraríeis,iraríeis,icaríeis,ucaríeis,nraríeis,graríeis,braríeis,eraríeis,rraríeis,draríeis,rcaríeis,ecaríeis,scaríeis,fraríeis,lcaríeis,ufaríeis,craríeis,lraríeis,vraríeis,ofaríeis,ifaríeis,afaríeis,lfaríeis¦5:mpraríeis,locaríeis,vocaríeis,opraríeis,tacaríeis,hocaríeis,focaríeis,lacaríeis,upraríeis,pocaríeis,bocaríeis,pacaríeis,hacaríeis,arfaríeis,tocaríeis¦2çar:mocaríeis¦3zer:sfaríeis,sdiríeis,ldiríeis,-faríeis¦4zer:radiríeis,endiríeis,mefaríeis,safaríeis,erdiríeis¦4çar:trincaríeis¦5zer:trafaríeis,rrefaríeis",
        "ex": "2ríeis:fazer,dizer¦3ríeis:trazer,afazer¦2caríeis:coçar,roçar,laçar¦3caríeis:calçar,forçar,atiçar¦4caríeis:remoçar¦2íeis:ir¦3íeis:dar¦1oríeis:pôr¦5íeis:tocar,focar,tacar,sacar,locar,socar,arfar¦4ríeis:refazer,redizer¦6íeis:trocar,brocar,blefar,surfar¦4íeis:orar,irar,arar,erar¦5ríeis:condizer,perfazer,predizer¦10íeis:reciprocar,embasbacar¦8íeis:triunfar,derrocar,atarefar¦7íeis:atracar,xerocar,ensacar,assacar¦1coitaríeis:açoitar¦7ríeis:putrefazer,liquefazer¦6ríeis:rarefazer¦9íeis:atarracar,esburacar"
      },
      "thirdPlural": {
        "fwd": "iam:¦oriam:ôr¦coitariam:çoitar¦1riam:izer¦2riam:fazer¦2cariam:inçar",
        "both": "4riam:sprazer¦3cariam:troçar,braçar",
        "rev": "2:eriam,iriam,oriam¦3:mariam,dariam,lariam,tariam,gariam,çariam,oariam,hariam,variam,sariam,jariam,pariam,bariam,zariam,nariam,iariam,eariam,uariam,xariam¦4:ncariam,trariam,arariam,orariam,urariam,irariam,icariam,ucariam,nrariam,grariam,brariam,erariam,rrariam,drariam,rcariam,ecariam,scariam,frariam,lcariam,ufariam,crariam,lrariam,vrariam,ofariam,ifariam,afariam,lfariam¦5:mprariam,locariam,vocariam,oprariam,tacariam,hocariam,focariam,lacariam,uprariam,pocariam,bocariam,pacariam,hacariam,arfariam,tocariam¦2çar:mocariam¦3zer:sfariam,sdiriam,ldiriam,-fariam¦4zer:radiriam,endiriam,mefariam,safariam,erdiriam¦4çar:trincariam¦5zer:trafariam,rrefariam",
        "ex": "2riam:fazer,dizer¦3riam:trazer,afazer¦2cariam:coçar,roçar,laçar¦3cariam:calçar,forçar,atiçar¦4cariam:remoçar¦2iam:ir¦3iam:dar¦1oriam:pôr¦5iam:tocar,focar,tacar,sacar,locar,socar,arfar¦4riam:refazer,redizer¦6iam:trocar,brocar,blefar,surfar¦4iam:orar,irar,arar,erar¦5riam:condizer,perfazer,predizer¦10iam:reciprocar,embasbacar¦8iam:triunfar,derrocar,atarefar¦7iam:atracar,xerocar,ensacar,assacar¦1coitariam:açoitar¦7riam:putrefazer,liquefazer¦6riam:rarefazer¦9iam:atarracar,esburacar"
      }
    },
    "futureTense": {
      "first": {
        "fwd": "ei:¦orei:ôr¦1rei:izer¦2rei:fazer¦2carei:tiçar",
        "both": "3carei:braçar¦coitarei:çoitar",
        "rev": "2:erei,irei,orei¦3:marei,darei,larei,garei,çarei,rarei,oarei,harei,sarei,jarei,parei,barei,zarei,narei,iarei,uarei,varei,earei,xarei¦4:starei,ntarei,ncarei,ltarei,scarei,rcarei,atarei,ocarei,ucarei,icarei,ptarei,etarei,otarei,rtarei,ctarei,utarei,ecarei,afarei,nfarei,ufarei,xtarei,ofarei¦5:eitarei,ditarei,vitarei,sitarei,tacarei,litarei,ritarei,mitarei,citarei,pitarei,lacarei,gitarei¦2çar:alcarei¦3zer:sfarei,efarei,sdirei,ldirei¦4zer:radirei,erfarei,endirei",
        "ex": "2rei:fazer,dizer¦3rei:trazer,afazer¦2carei:coçar,roçar,laçar¦3carei:calçar,forçar,atiçar¦2ei:ir¦3ei:dar¦1orei:pôr¦5rei:condizer,predizer¦5ei:citar,tacar,fitar,sacar,ditar,arfar¦7ei:habitar,atracar¦4ei:atar¦6ei:quitar,grifar¦8ei:inculcar"
      },
      "second": {
        "fwd": "ás:¦orás:ôr¦1rás:izer¦2rás:fazer¦2carás:tiçar",
        "both": "3carás:braçar¦coitarás:çoitar",
        "rev": "2:erás,irás,orás¦3:marás,darás,larás,garás,çarás,rarás,oarás,harás,sarás,jarás,parás,barás,zarás,narás,iarás,uarás,varás,earás,xarás¦4:starás,ntarás,ncarás,ltarás,scarás,rcarás,atarás,ocarás,ucarás,icarás,ptarás,etarás,otarás,rtarás,ctarás,utarás,ecarás,afarás,nfarás,ufarás,xtarás,ofarás¦5:eitarás,ditarás,vitarás,sitarás,tacarás,litarás,ritarás,mitarás,citarás,pitarás,lacarás,gitarás¦2çar:alcarás¦3zer:sfarás,efarás,sdirás,ldirás¦4zer:radirás,erfarás,endirás",
        "ex": "2rás:fazer,dizer¦3rás:trazer,afazer¦2carás:coçar,roçar,laçar¦3carás:calçar,forçar,atiçar¦2ás:ir¦3ás:dar¦1orás:pôr¦5rás:condizer,predizer¦5ás:citar,tacar,fitar,sacar,ditar,arfar¦7ás:habitar,atracar¦4ás:atar¦6ás:quitar,grifar¦8ás:inculcar"
      },
      "third": {
        "fwd": "á:¦orá:ôr¦1rá:izer¦2rá:fazer¦2cará:tiçar",
        "both": "3cará:braçar¦coitará:çoitar",
        "rev": "2:erá,irá,orá¦3:mará,dará,lará,gará,çará,rará,oará,hará,sará,jará,pará,bará,zará,nará,iará,uará,vará,eará,xará¦4:stará,ntará,ncará,ltará,scará,rcará,atará,ocará,ucará,icará,ptará,etará,otará,rtará,ctará,utará,ecará,afará,nfará,ufará,xtará,ofará¦5:eitará,ditará,vitará,sitará,tacará,litará,ritará,mitará,citará,pitará,lacará,gitará¦2çar:alcará¦3zer:sfará,efará,sdirá,ldirá¦4zer:radirá,erfará,endirá",
        "ex": "2rá:fazer,dizer¦3rá:trazer,afazer¦2cará:coçar,roçar,laçar¦3cará:calçar,forçar,atiçar¦2á:ir¦3á:dar¦1orá:pôr¦5rá:condizer,predizer¦5á:citar,tacar,fitar,sacar,ditar,arfar¦7á:habitar,atracar¦4á:atar¦6á:quitar,grifar¦8á:inculcar"
      },
      "firstPlural": {
        "fwd": "emos:¦oremos:ôr¦1remos:izer¦2remos:fazer¦2caremos:tiçar",
        "both": "3caremos:braçar¦coitaremos:çoitar",
        "rev": "2:eremos,iremos,oremos¦3:maremos,daremos,laremos,garemos,çaremos,raremos,oaremos,haremos,saremos,jaremos,paremos,baremos,zaremos,naremos,iaremos,uaremos,varemos,earemos,xaremos¦4:staremos,ntaremos,ncaremos,ltaremos,scaremos,rcaremos,ataremos,ocaremos,ucaremos,icaremos,ptaremos,etaremos,otaremos,rtaremos,ctaremos,utaremos,ecaremos,afaremos,nfaremos,ufaremos,xtaremos,ofaremos¦5:eitaremos,ditaremos,vitaremos,sitaremos,tacaremos,litaremos,ritaremos,mitaremos,citaremos,pitaremos,lacaremos,gitaremos¦2çar:alcaremos¦3zer:sfaremos,efaremos,sdiremos,ldiremos¦4zer:radiremos,erfaremos,endiremos",
        "ex": "2remos:fazer,dizer¦3remos:trazer,afazer¦2caremos:coçar,roçar,laçar¦3caremos:calçar,forçar,atiçar¦2emos:ir¦3emos:dar¦1oremos:pôr¦5remos:condizer,predizer¦5emos:citar,tacar,fitar,sacar,ditar,arfar¦7emos:habitar,atracar¦4emos:atar¦6emos:quitar,grifar¦8emos:inculcar"
      },
      "secondPlural": {
        "fwd": "eis:¦oreis:ôr¦1reis:izer¦2reis:fazer¦2careis:tiçar",
        "both": "3careis:braçar¦coitareis:çoitar",
        "rev": "2:ereis,ireis,oreis¦3:mareis,dareis,lareis,gareis,çareis,rareis,oareis,hareis,sareis,jareis,pareis,bareis,zareis,nareis,iareis,uareis,vareis,eareis,xareis¦4:stareis,ntareis,ncareis,ltareis,scareis,rcareis,atareis,ocareis,ucareis,icareis,ptareis,etareis,otareis,rtareis,ctareis,utareis,ecareis,afareis,nfareis,ufareis,xtareis,ofareis¦5:eitareis,ditareis,vitareis,sitareis,tacareis,litareis,ritareis,mitareis,citareis,pitareis,lacareis,gitareis¦2çar:alcareis¦3zer:sfareis,efareis,sdireis,ldireis¦4zer:radireis,erfareis,endireis",
        "ex": "2reis:fazer,dizer¦3reis:trazer,afazer¦2careis:coçar,roçar,laçar¦3careis:calçar,forçar,atiçar¦2eis:ir¦3eis:dar¦1oreis:pôr¦5reis:condizer,predizer¦5eis:citar,tacar,fitar,sacar,ditar,arfar¦7eis:habitar,atracar¦4eis:atar¦6eis:quitar,grifar¦8eis:inculcar"
      },
      "thirdPlural": {
        "fwd": "ão:¦orão:ôr¦1rão:izer¦2rão:fazer¦2carão:tiçar",
        "both": "3carão:braçar¦coitarão:çoitar",
        "rev": "2:erão,irão,orão¦3:marão,darão,larão,garão,çarão,rarão,oarão,harão,sarão,jarão,parão,barão,zarão,narão,iarão,uarão,varão,earão,xarão¦4:starão,ntarão,ncarão,ltarão,scarão,rcarão,atarão,ocarão,ucarão,icarão,ptarão,etarão,otarão,rtarão,ctarão,utarão,ecarão,afarão,nfarão,ufarão,xtarão,ofarão¦5:eitarão,ditarão,vitarão,sitarão,tacarão,litarão,ritarão,mitarão,citarão,pitarão,lacarão,gitarão¦2çar:alcarão¦3zer:sfarão,efarão,sdirão,ldirão¦4zer:radirão,erfarão,endirão",
        "ex": "2rão:fazer,dizer¦3rão:trazer,afazer¦2carão:coçar,roçar,laçar¦3carão:calçar,forçar,atiçar¦2ão:ir¦3ão:dar¦1orão:pôr¦5rão:condizer,predizer¦5ão:citar,tacar,fitar,sacar,ditar,arfar¦7ão:habitar,atracar¦4ão:atar¦6ão:quitar,grifar¦8ão:inculcar"
      }
    },
    "imperativeNeg": {
      "second": {
        "fwd": "onhas:ôr¦jas:gir,ger¦igas:eguir¦iras:erir¦itas:etir¦as:uer¦ças:cir¦urtas:ortir¦coites:çoitar¦1jas:aver¦1as:mer,rer,ber,her,per,ser,hir¦1gas:izer¦1es:iar¦2as:ndir,rter,mbir,ulir,idir,irir,rdir¦2eies:nsiar¦2ças:pedir,medir¦2ques:inçar¦3es:iguar,nquar¦3as:arrir¦4es:inguar,coitar",
        "both": "5as:ementir,flectir,mprazer¦5jas:terver¦5ejas:brestar¦5nhas:treter¦4ues:umegar,amegar,elegar¦4es:foitar,noitar¦4as:inibir,opelir,xceler,rreter,epolir,rantir,orrir¦4intas:ressentir¦4jas:tever¦4eies:cendiar¦4iras:equerer¦4enhas:tervir¦3as:bolir,arzir,abrir,orver,anzir,enzer,xibir,rguir,order,meter,rever,artir¦3ues:iegar,pegar,negar,fegar,segar,vegar,regar,hegar¦3es:bitar,titar,vitar,ejuar,pitar,uitar,gitar,litar,citar,sitar,mitar,ditar,ritar,eitar¦3ques:emoçar,troçar,braçar¦3idas:egredir,sgredir¦3ias:crer¦3eies:mediar¦3nhas:ster,bter,nter¦3enhas:rovir¦2as:lpir,orir,cuir,urir,alir,odir,plir,adir,ater,upir,imir,ozer,trir,over,udir,buir,nguir,tuir,lver,nuir,uzir,eder,utir,luir,itir,ruir,stir,suir,umir,prir,ubir,iver,nder,air¦2es:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,tuar,etar,rtar,utar,atar,nuar,ltar,star,ntar¦2úles:baular¦2ízes:juizar¦2intas:smentir,nsentir¦2ues:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar¦2ilas:mpelir,xpelir¦2ínes:ruinar¦2enhas:avir,evir,nvir¦2has:aler¦2cas:erder¦1údes:iudar¦1irvas:servir¦1ças:uvir,azer¦1ízes:aizar,eizar¦1úces:iuçar¦1ísques:aiscar¦1águas:saguar¦1es:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar¦1irjas:vergir¦1águes:xaguar¦1iras:arir¦1íbas:oibir¦1as:oer,nir,xer¦1ulas:golir¦1únas:eunir¦1ies:ear¦1nhas:or¦1ibas:aber¦1ssas:oder¦ólegues:olegar¦irzas:erzir¦ínquas:inquir¦igras:egrir¦ispas:espir¦ubras:obrir¦éques:equar¦irtas:ertir¦ussas:ossir¦ças:cer¦ces:çar¦ques:car¦urmas:ormir",
        "rev": "ar:ês¦entir:intas¦ervir:irvas¦udar:údes¦iliar:ílies¦ectir:ictas¦1rer:eiras¦1zer:agas¦1r:eias¦1gir:ijas,ujas,ljas¦1eguir:sigas¦1erir:firas,diras,giras,siras,tiras¦1etir:pitas,litas¦1edir:ridas¦1enir:vinas¦1estir:vistas¦1ar:tes¦1ir:venhas¦2ar:stejas,vies,pies,oies,fies,cies,ries,gies,dies,aies,ties,bies,sies,zies,nies,uies,mies,xies¦2er:omas,rras,ebas,chas,fras,etas,emas,osas,mpas¦2gir:injas,urjas,eajas,erjas,oajas,unjas,arjas¦2r:vejas,tenhas¦2ger:lejas,anjas,rejas,onjas¦2zer:digas¦2cir:arças¦2uer:rgas¦3ir:vidas,cidas,undas,uspas,andas,indas,sidas,lidas,uiras,unhas,bulas,redas,urzas,feras,ardas¦3ger:otejas¦3er:olhas,ambas,ervas,ertas,ueras,relas,essas¦3ar:ilies,plies,alies,olies¦3dir:xpeças¦4dir:espeças,impeças,esmeças¦4gir:terajas¦4ar:zigues,relies¦4ir:cumbas,apulas,sentas,lanhas¦4çar:trinques¦4ger:sterjas¦5ar:pinques,ginques,anigues",
        "ex": "vás:ir¦águes:aguar¦2jas:ser,ver,haver,reger,viger¦1enhas:vir¦3ejas:estar¦2nhas:ter¦1ês:dar¦3iras:querer¦3gas:trazer¦2as:rir¦2ias:ler¦1intas:sentir,mentir¦2ças:pedir,medir¦3as:abrir,dever,meter,jazer,arder,bulir,urdir¦3ias:crer¦3ues:pegar,negar,regar,cegar,legar,segar¦5jas:prover,prever¦1istas:vestir¦1irvas:servir¦4jas:rever¦2eies:odiar¦4nhas:deter,reter¦1ulas:polir¦4as:curtir,cuspir,ferver,inibir,treler,zurzir,zumbir,condir,surdir,garrir¦2es:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar¦3idas:agredir¦3eies:mediar,ansiar¦4inas:prevenir¦3enhas:advir¦3istas:investir,revestir¦2údes:saudar¦2ques:coçar,roçar,laçar¦3nhas:ater¦5idas:progredir¦3ques:calçar,forçar,atiçar¦3es:citar,fitar,ditar,pitar,eguar,aliar,chiar¦4ues:alegar¦3ílies:mobiliar¦3intas:assentir¦7jas:entrever¦2enhas:avir¦4ias:reler¦4intas:ressentir¦7as:dissentir¦1as:rer¦9as:retrogredir¦8as:correferir¦2ictas:flectir¦4es:poitar¦1onhas:pôr¦2gas:dizer¦1jas:agir¦1igas:seguir¦1iras:ferir,gerir¦4ças:impedir¦7es:averiguar¦1urtas:sortir¦5es:minguar¦1coites:açoitar"
      },
      "third": {
        "fwd": "onha:ôr¦ja:gir,ger¦iga:eguir¦ira:erir¦ita:etir¦a:uer¦urta:ortir¦coite:çoitar¦1ja:aver¦1a:mer,rer,ber,her,per,ser,hir¦1ga:izer¦1e:iar¦2a:ndir,rter,mbir,ulir,idir,irir,rdir¦2eie:nsiar¦2ça:pedir,medir¦2que:inçar¦3e:iguar,nquar¦3a:arrir¦4e:inguar,coitar",
        "both": "5a:ementir,flectir,mprazer¦5ja:terver¦5eja:brestar¦5nha:treter¦4ue:umegar,amegar,elegar¦4e:foitar,noitar¦4a:inibir,opelir,xceler,rreter,epolir,rantir,orrir¦4inta:ressentir¦4ja:tever¦4eie:cendiar¦4ira:equerer¦4enha:tervir¦3a:bolir,arzir,abrir,orver,anzir,enzer,xibir,rguir,order,meter,rever,artir¦3ue:iegar,pegar,negar,fegar,segar,vegar,regar,hegar¦3e:bitar,titar,vitar,ejuar,pitar,uitar,gitar,litar,citar,sitar,mitar,ditar,ritar,eitar¦3que:emoçar,troçar,braçar¦3ida:egredir,sgredir¦3ia:crer¦3eie:mediar¦3nha:ster,bter,nter¦3enha:rovir¦2a:lpir,orir,cuir,urir,alir,odir,plir,adir,ater,upir,imir,ozer,trir,over,udir,buir,nguir,tuir,lver,nuir,uzir,eder,utir,luir,itir,ruir,stir,suir,umir,prir,ubir,iver,nder,air¦2e:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,tuar,etar,rtar,utar,atar,nuar,ltar,star,ntar¦2úle:baular¦2íze:juizar¦2inta:smentir,nsentir¦2ue:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar¦2ila:mpelir,xpelir¦2íne:ruinar¦2enha:avir,evir,nvir¦2ha:aler¦2ca:erder¦1úde:iudar¦1irva:servir¦1ça:uvir,azer¦1íze:aizar,eizar¦1úce:iuçar¦1ísque:aiscar¦1água:saguar¦1e:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar¦1irja:vergir¦1águe:xaguar¦1ira:arir¦1íba:oibir¦1a:oer,nir,xer¦1ula:golir¦1úna:eunir¦1ie:ear¦1nha:or¦1iba:aber¦1ssa:oder¦ólegue:olegar¦irza:erzir¦ínqua:inquir¦igra:egrir¦ças:cir¦ispa:espir¦ubra:obrir¦éque:equar¦irta:ertir¦ussa:ossir¦ça:cer¦ce:çar¦que:car¦urma:ormir",
        "rev": "ar:ê¦entir:inta¦ervir:irva¦udar:úde¦iliar:ílie¦ectir:icta¦1rer:eira¦1zer:aga¦1r:eia¦1gir:ija,uja,lja¦1eguir:siga¦1erir:fira,dira,gira,sira,tira¦1etir:pita,lita¦1edir:rida¦1enir:vina¦1estir:vista¦1ar:te¦1ir:venha¦2ar:steja,vie,pie,oie,fie,cie,rie,gie,die,aie,tie,bie,sie,zie,nie,uie,mie,xie¦2er:oma,rra,eba,cha,fra,eta,ema,osa,mpa¦2gir:inja,urja,eaja,erja,oaja,unja,arja¦2r:veja,tenha¦2ger:leja,anja,reja,onja¦2zer:diga¦2uer:rga¦3ir:vida,cida,unda,uspa,anda,inda,sida,lida,uira,unha,bula,reda,urza,fera,arda¦3ger:oteja¦3er:olha,amba,erva,erta,uera,rela,essa¦3ar:ilie,plie,alie,olie¦3dir:xpeça¦4dir:espeça,impeça,esmeça¦4gir:teraja¦4ar:zigue,relie¦4ir:cumba,apula,senta,lanha¦4çar:trinque¦4ger:sterja¦5ar:pinque,ginque,anigue",
        "ex": "vá:ir¦águe:aguar¦2ja:ser,ver,haver,reger,viger¦1enha:vir¦3eja:estar¦2nha:ter¦1ê:dar¦3ira:querer¦3ga:trazer¦2a:rir¦2ia:ler¦1inta:sentir,mentir¦2ça:pedir,medir¦3a:abrir,dever,meter,jazer,arder,bulir,urdir¦3ia:crer¦3ue:pegar,negar,regar,cegar,legar,segar¦5ja:prover,prever¦1ista:vestir¦1irva:servir¦4ja:rever¦2eie:odiar¦4nha:deter,reter¦1ula:polir¦4a:curtir,cuspir,ferver,inibir,treler,zurzir,zumbir,condir,surdir,garrir¦2e:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar¦3ida:agredir¦3eie:mediar,ansiar¦4ina:prevenir¦3enha:advir¦3ista:investir,revestir¦2úde:saudar¦2que:coçar,roçar,laçar¦3nha:ater¦5ida:progredir¦3que:calçar,forçar,atiçar¦3e:citar,fitar,ditar,pitar,eguar,aliar,chiar¦4ue:alegar¦3ílie:mobiliar¦3inta:assentir¦7ja:entrever¦2enha:avir¦4ia:reler¦4inta:ressentir¦7a:dissentir¦1a:rer¦9a:retrogredir¦8a:correferir¦2icta:flectir¦4e:poitar¦1onha:pôr¦2ga:dizer¦1ja:agir¦1iga:seguir¦1ira:ferir,gerir¦4ça:impedir¦7e:averiguar¦1urta:sortir¦5e:minguar¦1coite:açoitar"
      },
      "firstPlural": {
        "fwd": "onhamos:ôr¦jamos:gir,ger¦igamos:eguir¦iramos:erir¦itamos:etir¦amos:uer¦çamos:cir¦urtamos:ortir¦coitemos:çoitar¦1amos:mer,rer,ber,bir,her,per,ser,hir¦1gamos:izer¦2amos:idir,ndir,rter,nzer,ulir,irir,rdir¦2çamos:pedir,medir¦2quemos:inçar¦3amos:urtir,arrir",
        "both": "5amos:ementir,flectir,mprazer¦5ejamos:brestar¦5mos:saguar¦5nhamos:treter¦4amos:morder,opelir,xceler,inquir,rreter,orrir¦4nhamos:uster,bster¦4jamos:tever¦4iramos:equerer¦4enhamos:tervir¦3amos:scuir,bolir,arzir,urzir,abrir,anzir,polir,rguir,meter,uspir,antir,ssuir,artir¦3quemos:emoçar,troçar¦3intamos:essentir¦3idamos:egredir,sgredir¦3iamos:crer¦3inamos:revenir¦3enhamos:rovir¦3nhamos:nter¦2amos:lpir,orir,urir,alir,odir,ater,plir,upir,imir,eder,trir,udir,buir,nguir,tuir,adir,nuir,uzir,ruir,utir,luir,itir,umir,prir,stir,nder,air¦2intamos:smentir,nsentir¦2istamos:evestir¦2ilamos:mpelir,xpelir¦2enhamos:avir,evir,nvir¦2hamos:aler¦2camos:erder¦1irvamos:servir¦1irjamos:vergir¦1iramos:arir¦1amos:oer,nir,xer,ver¦1ulamos:golir¦1nhamos:or¦1uemos:gar¦1çamos:uvir,azer¦1ssamos:oder¦irzamos:erzir¦igramos:egrir¦ispamos:espir¦ubramos:obrir¦irtamos:ertir¦ussamos:ossir¦çamos:cer¦cemos:çar¦quemos:car¦urmamos:ormir¦emos:ar",
        "rev": "entir:intamos¦ervir:irvamos¦ectir:ictamos¦1rer:eiramos¦1zer:agamos¦1r:eiamos¦1ber:aibamos¦1gir:ijamos,ujamos,ljamos¦1eguir:sigamos¦1erir:firamos,diramos,giramos,siramos,tiramos¦1etir:pitamos,litamos¦1edir:ridamos¦1ir:venhamos¦1estir:vistamos¦2ar:stejamos¦2er:omamos,rramos,ebamos,framos,emamos,chamos,azamos,mpamos,osamos¦2gir:injamos,urjamos,eajamos,erjamos,oajamos,unjamos,arjamos¦2r:vejamos,tenhamos¦2ger:lejamos,anjamos,rejamos¦2zer:digamos¦2cir:arçamos¦2uer:rgamos¦3ir:vidamos,cidamos,undamos,oibamos,andamos,umbamos,indamos,pulamos,sidamos,entamos,uiramos,redamos,nibamos,urdamos,anhamos¦3ger:otejamos¦3er:olhamos,ordamos,ambamos,ertamos,enzamos,ueramos,relamos¦3çar:braquemos¦3dir:xpeçamos,smeçamos¦4dir:espeçamos,impeçamos¦4gir:terajamos¦4iar:obilemos¦4ir:olidamos,runhamos,cardamos,eferamos¦4çar:trinquemos¦5er:bressamos",
        "ex": "vamos:ir¦2jamos:ser,ver,haver,reger,viger¦1enhamos:vir¦3ejamos:estar¦2nhamos:ter¦3iramos:querer¦3gamos:trazer¦2amos:rir¦2iamos:ler¦2ibamos:saber,caber¦1intamos:sentir,mentir¦2çamos:pedir,medir¦3amos:abrir,meter,jazer,cozer,arder,subir,bulir,urdir¦3iamos:crer¦5jamos:prover,prever¦1istamos:vestir¦1irvamos:servir¦4jamos:rever¦4nhamos:deter,reter,obter¦1ulamos:polir¦4quemos:abraçar¦4amos:morder,treler,curtir,exibir,ebulir,elidir,ilidir,condir,garrir¦3idamos:agredir¦3enhamos:advir¦3istamos:investir¦2quemos:coçar,roçar,laçar¦3nhamos:ater¦5idamos:progredir¦3quemos:calçar,forçar,atiçar¦5emos:mobiliar¦3intamos:assentir¦7jamos:entrever,interver¦2enhamos:avir¦4iamos:reler¦7amos:dissentir¦1amos:rer¦9amos:retrogredir¦8amos:correferir¦2ictamos:flectir¦1onhamos:pôr¦2gamos:dizer¦1jamos:agir¦1igamos:seguir¦1iramos:ferir,gerir¦4çamos:impedir¦1urtamos:sortir¦1coitemos:açoitar¦3jamos:monger¦6jamos:absterger"
      },
      "secondPlural": {
        "fwd": "onhais:ôr¦jais:gir,ger¦igais:eguir¦irais:erir¦itais:etir¦ais:uer¦çais:cir¦urtais:ortir¦coiteis:çoitar¦1ais:mer,rer,ber,bir,her,per,ser,hir¦1gais:izer¦2ais:idir,ndir,rter,nzer,ulir,irir,rdir¦2çais:pedir,medir¦2queis:inçar¦3ais:urtir,arrir",
        "both": "5ais:ementir,flectir,mprazer¦5ejais:brestar¦5is:saguar¦5nhais:treter¦4ais:morder,opelir,xceler,inquir,rreter,orrir¦4nhais:uster,bster¦4jais:tever¦4irais:equerer¦4enhais:tervir¦3ais:scuir,bolir,arzir,urzir,abrir,anzir,polir,rguir,meter,uspir,antir,ssuir,artir¦3queis:emoçar,troçar¦3intais:essentir¦3idais:egredir,sgredir¦3iais:crer¦3inais:revenir¦3enhais:rovir¦3nhais:nter¦2ais:lpir,orir,urir,alir,odir,ater,plir,upir,imir,eder,trir,udir,buir,nguir,tuir,adir,nuir,uzir,ruir,utir,luir,itir,umir,prir,stir,nder,air¦2intais:smentir,nsentir¦2istais:evestir¦2ilais:mpelir,xpelir¦2enhais:avir,evir,nvir¦2hais:aler¦2cais:erder¦1irvais:servir¦1irjais:vergir¦1irais:arir¦1ais:oer,nir,xer,ver¦1ulais:golir¦1nhais:or¦1ueis:gar¦1çais:uvir,azer¦1ssais:oder¦irzais:erzir¦igrais:egrir¦ispais:espir¦ubrais:obrir¦irtais:ertir¦ussais:ossir¦çais:cer¦ceis:çar¦queis:car¦urmais:ormir¦eis:ar",
        "rev": "entir:intais¦ervir:irvais¦ectir:ictais¦1rer:eirais¦1zer:agais¦1r:eiais¦1ber:aibais¦1gir:ijais,ujais,ljais¦1eguir:sigais¦1erir:firais,dirais,girais,sirais,tirais¦1etir:pitais,litais¦1edir:ridais¦1ir:venhais¦1estir:vistais¦2ar:stejais¦2er:omais,rrais,ebais,frais,emais,chais,azais,mpais,osais¦2gir:injais,urjais,eajais,erjais,oajais,unjais,arjais¦2r:vejais,tenhais¦2ger:lejais,anjais,rejais¦2zer:digais¦2cir:arçais¦2uer:rgais¦3ir:vidais,cidais,undais,oibais,andais,umbais,indais,pulais,sidais,entais,uirais,redais,nibais,urdais,anhais¦3ger:otejais¦3er:olhais,ordais,ambais,ertais,enzais,uerais,relais¦3çar:braqueis¦3dir:xpeçais,smeçais¦4dir:espeçais,impeçais¦4gir:terajais¦4ir:olidais,runhais,cardais,eferais¦4çar:trinqueis¦5er:bressais",
        "ex": "vades:ir¦2jais:ser,ver,haver,reger,viger¦1enhais:vir¦3ejais:estar¦2nhais:ter¦3irais:querer¦3gais:trazer¦2ais:rir¦2iais:ler¦2ibais:saber,caber¦1intais:sentir,mentir¦2çais:pedir,medir¦3ais:abrir,meter,jazer,cozer,arder,subir,bulir,urdir¦3iais:crer¦5jais:prover,prever¦1istais:vestir¦1irvais:servir¦4jais:rever¦4nhais:deter,reter,obter¦1ulais:polir¦4queis:abraçar¦4ais:morder,treler,curtir,exibir,ebulir,elidir,ilidir,condir,garrir¦3idais:agredir¦3enhais:advir¦3istais:investir¦2queis:coçar,roçar,laçar¦3nhais:ater¦5idais:progredir¦3queis:calçar,forçar,atiçar¦3intais:assentir¦7jais:entrever,interver¦2enhais:avir¦4iais:reler¦7ais:dissentir¦1ais:rer¦9ais:retrogredir¦8ais:correferir¦2ictais:flectir¦1onhais:pôr¦2gais:dizer¦1jais:agir¦1igais:seguir¦1irais:ferir,gerir¦4çais:impedir¦1urtais:sortir¦1coiteis:açoitar¦3jais:monger¦6jais:absterger"
      },
      "thirdPlural": {
        "fwd": "onham:ôr¦jam:gir,ger¦igam:eguir¦iram:erir¦itam:etir¦am:uer¦çam:cir¦urtam:ortir¦coitem:çoitar¦1jam:aver¦1am:mer,rer,ber,her,per,ser,hir¦1gam:izer¦1em:iar¦2am:ndir,rter,mbir,ulir,idir,irir,rdir¦2eiem:nsiar¦2çam:pedir,medir¦2quem:inçar¦3em:iguar,nquar¦3am:arrir¦4em:inguar,coitar",
        "both": "5am:ementir,flectir,mprazer¦5jam:terver¦5ejam:brestar¦5nham:treter¦4uem:umegar,amegar,elegar¦4em:foitar,noitar¦4am:inibir,opelir,xceler,rreter,epolir,rantir,orrir¦4intam:ressentir¦4jam:tever¦4eiem:cendiar¦4iram:equerer¦4enham:tervir¦3am:bolir,arzir,abrir,orver,anzir,enzer,xibir,rguir,order,meter,rever,artir¦3uem:iegar,pegar,negar,fegar,segar,vegar,regar,hegar¦3em:bitar,titar,vitar,ejuar,pitar,uitar,gitar,litar,citar,sitar,mitar,ditar,ritar,eitar¦3quem:emoçar,troçar,braçar¦3idam:egredir,sgredir¦3iam:crer¦3eiem:mediar¦3nham:ster,bter,nter¦3enham:rovir¦2am:lpir,orir,cuir,urir,alir,odir,plir,adir,ater,upir,imir,ozer,trir,over,udir,buir,nguir,tuir,lver,nuir,uzir,eder,utir,luir,itir,ruir,stir,suir,umir,prir,ubir,iver,nder,air¦2em:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,tuar,etar,rtar,utar,atar,nuar,ltar,star,ntar¦2úlem:baular¦2ízem:juizar¦2intam:smentir,nsentir¦2uem:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar¦2ilam:mpelir,xpelir¦2ínem:ruinar¦2enham:avir,evir,nvir¦2ham:aler¦2cam:erder¦1údem:iudar¦1irvam:servir¦1çam:uvir,azer¦1ízem:aizar,eizar¦1úcem:iuçar¦1ísquem:aiscar¦1águam:saguar¦1em:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar¦1irjam:vergir¦1águem:xaguar¦1iram:arir¦1íbam:oibir¦1am:oer,nir,xer¦1ulam:golir¦1únam:eunir¦1iem:ear¦1nham:or¦1ibam:aber¦1ssam:oder¦óleguem:olegar¦irzam:erzir¦ínquam:inquir¦igram:egrir¦ispam:espir¦ubram:obrir¦équem:equar¦irtam:ertir¦ussam:ossir¦çam:cer¦cem:çar¦quem:car¦urmam:ormir",
        "rev": "ar:eem¦entir:intam¦ervir:irvam¦udar:údem¦iliar:íliem¦ectir:ictam¦1rer:eiram¦1zer:agam¦1r:eiam¦1gir:ijam,ujam,ljam¦1eguir:sigam¦1erir:firam,diram,giram,siram,tiram¦1etir:pitam,litam¦1edir:ridam¦1enir:vinam¦1estir:vistam¦1ar:tem¦1ir:venham¦2ar:stejam,viem,piem,oiem,fiem,ciem,riem,giem,diem,aiem,tiem,biem,siem,ziem,niem,uiem,miem,xiem¦2er:omam,rram,ebam,cham,fram,etam,emam,osam,mpam¦2gir:injam,urjam,eajam,erjam,oajam,unjam,arjam¦2r:vejam,tenham¦2ger:lejam,anjam,rejam,onjam¦2zer:digam¦2cir:arçam¦2uer:rgam¦3ir:vidam,cidam,undam,uspam,andam,indam,sidam,lidam,uiram,unham,bulam,redam,urzam,feram,ardam¦3ger:otejam¦3er:olham,ambam,ervam,ertam,ueram,relam,essam¦3ar:iliem,pliem,aliem,oliem¦3dir:xpeçam¦4dir:espeçam,impeçam,esmeçam¦4gir:terajam¦4ar:ziguem,reliem¦4ir:cumbam,apulam,sentam,lanham¦4çar:trinquem¦4ger:sterjam¦5ar:pinquem,ginquem,aniguem",
        "ex": "vão:ir¦águem:aguar¦2jam:ser,ver,haver,reger,viger¦1enham:vir¦3ejam:estar¦2nham:ter¦1eem:dar¦3iram:querer¦3gam:trazer¦2am:rir¦2iam:ler¦1intam:sentir,mentir¦2çam:pedir,medir¦3am:abrir,dever,meter,jazer,arder,bulir,urdir¦3iam:crer¦3uem:pegar,negar,regar,cegar,legar,segar¦5jam:prover,prever¦1istam:vestir¦1irvam:servir¦4jam:rever¦2eiem:odiar¦4nham:deter,reter¦1ulam:polir¦4am:curtir,cuspir,ferver,inibir,treler,zurzir,zumbir,condir,surdir,garrir¦2em:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar¦3idam:agredir¦3eiem:mediar,ansiar¦4inam:prevenir¦3enham:advir¦3istam:investir,revestir¦2údem:saudar¦2quem:coçar,roçar,laçar¦3nham:ater¦5idam:progredir¦3quem:calçar,forçar,atiçar¦3em:citar,fitar,ditar,pitar,eguar,aliar,chiar¦4uem:alegar¦3íliem:mobiliar¦3intam:assentir¦7jam:entrever¦2enham:avir¦4iam:reler¦4intam:ressentir¦7am:dissentir¦1am:rer¦9am:retrogredir¦8am:correferir¦2ictam:flectir¦4em:poitar¦1onham:pôr¦2gam:dizer¦1jam:agir¦1igam:seguir¦1iram:ferir,gerir¦4çam:impedir¦7em:averiguar¦1urtam:sortir¦5em:minguar¦1coitem:açoitar"
      }
    },
    "imperative": {
      "second": {
        "fwd": "á:aver¦õe:ôr¦urte:ortir¦coita:çoitar¦1e:mir,gir,dir,sir,cir,hir¦1ói:roer¦1ole:pulir¦2eia:nsiar¦2e:etir,elir,mbir,nzir,alir¦2ca:inçar¦3e:ertir,urtir",
        "both": "2:izer¦3:fazer¦5:sprazer¦5e:sparzir¦5á:brestar¦5ê:ntrever¦5ói:onstruir¦4e:servir,eouvir,epolir¦4ca:stroçar¦4ê:terver¦4eia:cendiar¦4ói:estruir¦4ém:treter,tervir¦3e:ulpir,bolir,urzir,bulir,nibir,xibir,nguir,golir,eguir,artir¦3ca:emoçar¦3ome:ubsumir¦3ide:sgredir¦3ê:tever¦3eia:mediar¦3ém:rovir¦2e:orir,urir,ctir,irir,plir,trir,uzir,utir,itir,erir,prir,stir,brir,ntir¦2úla:baular¦2íza:juizar¦2ê:crer¦2ína:ruinar¦2ém:avir,evir,dvir,ster,bter,nvir,nter¦2ome:nsumir¦1úda:iudar¦1íza:aizar,eizar¦1úça:iuçar¦1ísca:aiscar¦1ói:moer¦1ode:cudir¦1íbe:oibir¦1úne:eunir¦1e:nir¦1ia:ear¦ólega:olegar¦irze:erzir¦ínque:inquir¦igre:egrir¦ope:upir¦água:aguar¦ospe:uspir¦équa:equar¦obe:ubir¦õe:or¦:r",
        "rev": "er:ê¦ugir:oge¦udar:úda¦iliar:ília¦1er:z,r,tém¦1ar:tá¦1edir:ride¦1enir:vine¦1ir:vém¦2ir:rme,uve,ime,ade,ume,age,ude,uge,nhe,lge¦2oer:rrói¦2ulir:apole¦3ir:rige,inge,cide,pete,urge,unde,xige,pede,ande,arce,dige,lige,pele,inde,umbe,side,lode,sige,arge,vide,unge,arde,mede,urde¦3çar:braca¦4ir:flete,merge,verge,ranze,perge,grede¦4çar:trinca¦5ir:iverte,dverte,eterge",
        "ex": "3:fazer¦4:querer,trazer¦vai:ir¦água:aguar¦1ê:ser,ver,ler¦1em:vir¦3á:estar¦2m:ter¦1á:dar,haver¦3e:ouvir,parir,pedir,medir,balir,urdir¦2ê:crer¦1oge:fugir¦1ome:sumir¦4ê:prover,prever¦4e:servir,despir,garrir,tossir,curtir,erodir,elidir,ilidir,condir¦3ê:rever,reler¦2eia:odiar¦3ém:deter,reter¦1ule:polir¦4ca:abraçar¦1ói:roer,moer¦3ide:agredir¦3eia:mediar,ansiar¦4ine:prevenir¦2úda:saudar¦2ca:coçar,roçar,laçar¦2ém:ater,avir¦2ege:frigir¦5ide:progredir¦3ca:calçar,forçar,atiçar¦1ole:bulir¦3ília:mobiliar¦4ide:regredir¦1usca:moscar¦3oge:refugir¦1õe:pôr¦2e:agir¦1urte:sortir¦5e:colidir,estalir¦1coita:açoitar"
      },
      "third": {
        "fwd": "onha:ôr¦ja:gir,ger¦iga:eguir¦ira:erir¦ita:etir¦a:uer¦ça:cir¦urta:ortir¦coite:çoitar¦1ja:aver¦1a:mer,rer,ber,her,per,ser,hir¦1ga:izer¦1e:iar¦2a:itir,ndir,rter,mbir,ulir,idir,irir,rdir¦2eie:nsiar¦2ça:pedir,medir¦2que:inçar¦3e:iguar,nquar¦3a:arrir¦4e:inguar,coitar",
        "both": "5a:ementir,flectir,mprazer¦5ja:terver¦5eja:brestar¦5ida:ansgredir¦5nha:treter¦4ue:umegar,amegar,elegar¦4e:foitar,noitar¦4a:inibir,opelir,xceler,sorver,rreter,epolir,rantir,orrir¦4inta:ressentir¦4ja:tever¦4eie:cendiar¦4ira:equerer¦4enha:tervir¦3a:bolir,arzir,abrir,anzir,enzer,xibir,rguir,order,meter,rever,artir¦3ue:iegar,pegar,negar,fegar,segar,vegar,regar,hegar¦3e:bitar,titar,gitar,vitar,ejuar,pitar,uitar,sitar,litar,citar,mitar,ditar,ritar,eitar¦3que:emoçar,troçar,braçar¦3ida:egredir¦3ia:crer¦3eie:mediar¦3nha:ster,bter,nter¦3enha:rovir¦2a:lpir,orir,cuir,urir,alir,odir,plir,adir,ater,upir,imir,ozer,trir,over,udir,buir,nguir,tuir,lver,nuir,uzir,eder,utir,luir,ruir,stir,suir,umir,prir,ubir,iver,nder,air¦2e:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,tuar,etar,rtar,utar,atar,nuar,ltar,star,ntar¦2úle:baular¦2íze:juizar¦2inta:smentir,nsentir¦2ue:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar¦2ila:mpelir,xpelir¦2íne:ruinar¦2enha:avir,evir,dvir,nvir¦2ha:aler¦2ca:erder¦1úde:iudar¦1irva:servir¦1ça:uvir,azer¦1íze:aizar,eizar¦1úce:iuçar¦1ísque:aiscar¦1e:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar¦1irja:vergir¦1ira:arir¦1íba:oibir¦1a:oer,nir,xer¦1ula:golir¦1úna:eunir¦1ie:ear¦1nha:or¦1iba:aber¦1ssa:oder¦ólegue:olegar¦irza:erzir¦ínqua:inquir¦igra:egrir¦águe:aguar¦ispa:espir¦ubra:obrir¦éque:equar¦irta:ertir¦ussa:ossir¦ça:cer¦ce:çar¦que:car¦urma:ormir",
        "rev": "ar:ê¦entir:inta¦ervir:irva¦udar:úde¦iliar:ílie¦ectir:icta¦1rer:eira¦1zer:aga¦1r:eia¦1gir:ija,uja,lja¦1eguir:siga¦1erir:fira,dira,gira,sira,tira¦1etir:pita,lita¦1edir:rida¦1enir:vina¦1estir:vista¦1ar:te¦1ir:venha¦2ar:steja,vie,pie,oie,fie,cie,rie,gie,die,aie,tie,bie,sie,zie,nie,uie,mie,xie¦2er:oma,rra,eba,cha,fra,eta,ema,mpa,osa¦2gir:inja,urja,eaja,erja,oaja,unja,arja¦2r:veja,tenha¦2ger:leja,anja,reja,onja¦2zer:diga¦2cir:arça¦2uer:rga¦3ir:vida,cida,uira,unda,uspa,mita,anda,inda,sida,lida,unha,umba,bula,reda,urza,fera,arda¦3ger:oteja¦3er:olha,amba,erva,erta,uera,orva,rela,essa¦3ar:ilie,plie,alie,olie¦3dir:xpeça¦4dir:espeça,impeça,esmeça¦4gir:teraja¦4ar:zigue,relie¦4ir:apula,senta,lanha¦4çar:trinque¦4ger:sterja¦5ar:pinque,ginque,anigue",
        "ex": "vá:ir¦águe:aguar¦2ja:ser,ver,haver,reger,viger¦1enha:vir¦3eja:estar¦2nha:ter¦1ê:dar¦3ira:querer¦3ga:trazer¦2a:rir¦2ia:ler¦1inta:sentir,mentir¦2ça:pedir,medir¦3a:abrir,dever,meter,jazer,arder,bulir,urdir¦3ia:crer¦3ue:pegar,negar,regar,cegar,legar,segar¦5ja:prover,prever¦1ista:vestir¦1irva:servir¦4ja:rever¦2eie:odiar¦4nha:deter,reter¦1ula:polir¦4a:curtir,cuspir,ferver,inibir,sorver,treler,zurzir,condir,surdir,garrir¦2e:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar¦3ida:agredir¦3eie:mediar,ansiar¦4ina:prevenir¦3ista:investir,revestir¦2úde:saudar¦2que:coçar,roçar,laçar¦3nha:ater¦5ida:progredir¦3que:calçar,forçar,atiçar¦3e:citar,fitar,ditar,pitar,eguar,aliar,chiar¦4ue:alegar¦3ílie:mobiliar¦3inta:assentir¦7ja:entrever¦2enha:avir¦4ia:reler¦1usque:moscar¦4inta:ressentir¦7a:dissentir¦1a:rer¦9a:retrogredir¦8a:correferir¦2icta:flectir¦4e:poitar¦1onha:pôr¦2ga:dizer¦1ja:agir¦1iga:seguir¦1ira:ferir,gerir¦4ça:impedir¦7e:averiguar¦1urta:sortir¦5e:minguar¦1coite:açoitar"
      },
      "firstPlural": {
        "fwd": "onhamos:ôr¦jamos:gir,ger¦igamos:eguir¦iramos:erir¦itamos:etir¦amos:uer¦çamos:cir¦urtamos:ortir¦coitemos:çoitar¦1amos:mer,rer,ber,bir,her,per,ser,hir¦1gamos:izer¦2amos:idir,itir,ndir,nzer,ulir,rter,irir,rdir¦2çamos:pedir,medir¦2quemos:inçar¦3amos:urtir,arrir",
        "both": "5amos:ementir,flectir,mprazer¦5ejamos:brestar¦5nhamos:treter¦4amos:morder,opelir,xceler,inquir,rreter,orrir¦4nhamos:uster,bster¦4jamos:tever¦4iramos:equerer¦4enhamos:tervir¦3amos:scuir,bolir,arzir,urzir,abrir,anzir,polir,rguir,meter,uspir,antir,ssuir,artir¦3quemos:emoçar,troçar¦3intamos:essentir,onsentir¦3idamos:egredir,sgredir¦3iamos:crer¦3inamos:revenir¦3enhamos:rovir¦3nhamos:nter¦2amos:lpir,orir,urir,alir,odir,plir,upir,imir,eder,udir,trir,ater,buir,nguir,tuir,adir,nuir,uzir,ruir,utir,luir,umir,prir,stir,nder,air¦2intamos:smentir¦2istamos:evestir¦2ilamos:mpelir,xpelir¦2enhamos:avir,evir,dvir,nvir¦2hamos:aler¦2camos:erder¦1irvamos:servir¦1irjamos:vergir¦1iramos:arir¦1amos:oer,nir,xer,ver¦1ulamos:golir¦1nhamos:or¦1uemos:gar¦1çamos:uvir,azer¦1ssamos:oder¦irzamos:erzir¦igramos:egrir¦ispamos:espir¦ubramos:obrir¦irtamos:ertir¦ussamos:ossir¦çamos:cer¦cemos:çar¦quemos:car¦urmamos:ormir¦emos:ar",
        "rev": "entir:intamos¦ervir:irvamos¦ectir:ictamos¦1rer:eiramos¦1zer:agamos¦1r:eiamos¦1ber:aibamos¦1gir:ijamos,ujamos,ljamos¦1eguir:sigamos¦1erir:firamos,diramos,giramos,siramos,tiramos¦1etir:pitamos,litamos¦1edir:ridamos¦1estir:vistamos¦1ir:venhamos¦2ar:stejamos¦2er:omamos,rramos,ebamos,framos,emamos,chamos,azamos,mpamos,osamos¦2gir:injamos,urjamos,eajamos,erjamos,oajamos,unjamos,arjamos¦2r:vejamos,tenhamos¦2ger:lejamos,anjamos,rejamos¦2zer:digamos¦2cir:arçamos¦2uer:rgamos¦3ir:vidamos,cidamos,uiramos,undamos,oibamos,andamos,mitamos,umbamos,indamos,pulamos,sidamos,unhamos,entamos,bulamos,lidamos,redamos,nibamos,urdamos,anhamos¦3ger:otejamos¦3er:olhamos,ordamos,ambamos,ertamos,enzamos¦3çar:braquemos¦3dir:xpeçamos,smeçamos¦4dir:espeçamos,impeçamos¦4gir:terajamos¦4iar:obilemos¦4er:queramos¦4ir:cardamos,eferamos¦4çar:trinquemos¦5er:bressamos",
        "ex": "vamos:ir¦2jamos:ser,ver,haver,reger,viger¦1enhamos:vir¦3ejamos:estar¦2nhamos:ter¦3iramos:querer¦3gamos:trazer¦2amos:rir¦2iamos:ler¦2ibamos:saber,caber¦1intamos:sentir,mentir¦2çamos:pedir,medir¦3amos:abrir,meter,jazer,cozer,arder,subir,bulir,urdir¦3iamos:crer¦5jamos:prover,prever¦1istamos:vestir¦1irvamos:servir¦4jamos:rever¦4nhamos:deter,reter,obter¦1ulamos:polir¦4quemos:abraçar¦4amos:morder,treler,curtir,exibir,condir,garrir¦3idamos:agredir¦3istamos:investir¦2quemos:coçar,roçar,laçar¦3nhamos:ater¦5idamos:progredir¦3quemos:calçar,forçar,atiçar¦5emos:mobiliar¦3intamos:assentir¦7jamos:entrever,interver¦2enhamos:avir¦4iamos:reler¦7amos:dissentir¦1amos:rer¦9amos:retrogredir¦8amos:correferir¦2ictamos:flectir¦1onhamos:pôr¦2gamos:dizer¦1jamos:agir¦1igamos:seguir¦1iramos:ferir,gerir¦4çamos:impedir¦1urtamos:sortir¦1coitemos:açoitar¦3jamos:monger¦6jamos:absterger"
      },
      "secondPlural": {
        "fwd": "onde:ôr¦coitai:çoitar¦3cai:rinçar",
        "both": "2:hir,cir,zir,pir,nir,lir,rir,bir,dir,gir,mir,tir¦3:ssir¦4:nquir,nguir,eguir¦5:servir¦5de:terver¦5nde:treter,tervir¦4de:tever,orrir¦4nde:rovir¦3cai:troçar¦3de:crer¦3nde:avir,evir,ster,bter,nvir,nter¦2çais:ouvir¦1í:uir,air¦1nde:or¦i:r",
        "rev": "r:nde¦1r:ede,ide¦2r:vi¦2çar:mocai¦3çar:bracai¦4çar:trincai",
        "ex": "4:ouvir¦5:servir¦1de:ir¦2de:ser,ver,rir,ler¦2nde:vir,ter¦3de:crer¦5de:prover,prever¦4de:rever,reler¦4nde:deter,reter,advir¦4cai:abraçar,remoçar¦2cai:coçar,roçar,laçar¦3nde:ater,avir¦3cai:calçar,forçar,atiçar¦7de:entrever¦1onde:pôr¦1coitai:açoitar"
      },
      "thirdPlural": {
        "fwd": "onham:ôr¦jam:gir,ger¦igam:eguir¦iram:erir¦itam:etir¦am:uer¦çam:cir¦urtam:ortir¦coitem:çoitar¦1jam:aver¦1am:mer,rer,ber,her,per,ser,hir¦1gam:izer¦1em:iar¦2am:itir,ndir,rter,mbir,ulir,idir,irir,rdir¦2eiem:nsiar¦2çam:pedir,medir¦2quem:inçar¦3em:iguar,nquar¦3am:arrir¦4em:inguar,coitar",
        "both": "5am:ementir,flectir,mprazer¦5jam:terver¦5ejam:brestar¦5idam:ansgredir¦5nham:treter¦4uem:umegar,amegar,elegar¦4em:foitar,noitar¦4am:inibir,opelir,xceler,sorver,rreter,epolir,rantir,orrir¦4intam:ressentir¦4jam:tever¦4eiem:cendiar¦4iram:equerer¦4enham:tervir¦3am:bolir,arzir,abrir,anzir,enzer,xibir,rguir,order,meter,rever,artir¦3uem:iegar,pegar,negar,fegar,segar,vegar,regar,hegar¦3em:bitar,titar,gitar,vitar,ejuar,pitar,uitar,sitar,litar,citar,mitar,ditar,ritar,eitar¦3quem:emoçar,troçar,braçar¦3idam:egredir¦3iam:crer¦3eiem:mediar¦3nham:ster,bter,nter¦3enham:rovir¦2am:lpir,orir,cuir,urir,alir,odir,plir,adir,ater,upir,imir,ozer,trir,over,udir,buir,nguir,tuir,lver,nuir,uzir,eder,utir,luir,ruir,stir,suir,umir,prir,ubir,iver,nder,air¦2em:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,tuar,etar,rtar,utar,atar,nuar,ltar,star,ntar¦2úlem:baular¦2ízem:juizar¦2intam:smentir,nsentir¦2uem:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar¦2ilam:mpelir,xpelir¦2ínem:ruinar¦2enham:avir,evir,dvir,nvir¦2ham:aler¦2cam:erder¦1údem:iudar¦1irvam:servir¦1çam:uvir,azer¦1ízem:aizar,eizar¦1úcem:iuçar¦1ísquem:aiscar¦1em:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar¦1irjam:vergir¦1iram:arir¦1íbam:oibir¦1am:oer,nir,xer¦1ulam:golir¦1únam:eunir¦1iem:ear¦1nham:or¦1ibam:aber¦1ssam:oder¦óleguem:olegar¦irzam:erzir¦ínquam:inquir¦igram:egrir¦águem:aguar¦ispam:espir¦ubram:obrir¦équem:equar¦irtam:ertir¦ussam:ossir¦çam:cer¦cem:çar¦quem:car¦urmam:ormir",
        "rev": "ar:eem¦entir:intam¦ervir:irvam¦udar:údem¦iliar:íliem¦ectir:ictam¦1rer:eiram¦1zer:agam¦1r:eiam¦1gir:ijam,ujam,ljam¦1eguir:sigam¦1erir:firam,diram,giram,siram,tiram¦1etir:pitam,litam¦1edir:ridam¦1enir:vinam¦1estir:vistam¦1ar:tem¦1ir:venham¦2ar:stejam,viem,piem,oiem,fiem,ciem,riem,giem,diem,aiem,tiem,biem,siem,ziem,niem,uiem,miem,xiem¦2er:omam,rram,ebam,cham,fram,etam,emam,mpam,osam¦2gir:injam,urjam,eajam,erjam,oajam,unjam,arjam¦2r:vejam,tenham¦2ger:lejam,anjam,rejam,onjam¦2zer:digam¦2cir:arçam¦2uer:rgam¦3ir:vidam,cidam,uiram,undam,uspam,mitam,andam,indam,sidam,lidam,unham,umbam,bulam,redam,urzam,feram,ardam¦3ger:otejam¦3er:olham,ambam,ervam,ertam,ueram,orvam,relam,essam¦3ar:iliem,pliem,aliem,oliem¦3dir:xpeçam¦4dir:espeçam,impeçam,esmeçam¦4gir:terajam¦4ar:ziguem,reliem¦4ir:apulam,sentam,lanham¦4çar:trinquem¦4ger:sterjam¦5ar:pinquem,ginquem,aniguem",
        "ex": "vão:ir¦águem:aguar¦2jam:ser,ver,haver,reger,viger¦1enham:vir¦3ejam:estar¦2nham:ter¦1eem:dar¦3iram:querer¦3gam:trazer¦2am:rir¦2iam:ler¦1intam:sentir,mentir¦2çam:pedir,medir¦3am:abrir,dever,meter,jazer,arder,bulir,urdir¦3iam:crer¦3uem:pegar,negar,regar,cegar,legar,segar¦5jam:prover,prever¦1istam:vestir¦1irvam:servir¦4jam:rever¦2eiem:odiar¦4nham:deter,reter¦1ulam:polir¦4am:curtir,cuspir,ferver,inibir,sorver,treler,zurzir,condir,surdir,garrir¦2em:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar¦3idam:agredir¦3eiem:mediar,ansiar¦4inam:prevenir¦3istam:investir,revestir¦2údem:saudar¦2quem:coçar,roçar,laçar¦3nham:ater¦5idam:progredir¦3quem:calçar,forçar,atiçar¦3em:citar,fitar,ditar,pitar,eguar,aliar,chiar¦4uem:alegar¦3íliem:mobiliar¦3intam:assentir¦7jam:entrever¦2enham:avir¦4iam:reler¦1usquem:moscar¦4intam:ressentir¦7am:dissentir¦1am:rer¦9am:retrogredir¦8am:correferir¦2ictam:flectir¦4em:poitar¦1onham:pôr¦2gam:dizer¦1jam:agir¦1igam:seguir¦1iram:ferir,gerir¦4çam:impedir¦7em:averiguar¦1urtam:sortir¦5em:minguar¦1coitem:açoitar"
      }
    },
    "imperfect": {
      "first": {
        "fwd": "ia:er¦unha:ôr¦1a:ir¦2cava:tiçar",
        "both": "5nha:tervir¦4va:pitar,citar,gitar,litar,bitar,ritar,mitar,sitar,vitar,ditar,eitar¦4nha:rovir¦4ía:ossuir¦3va:xtar,ctar,otar,etar,ptar,utar,atar,rtar,ltar,ntar,star¦3nha:avir,evir,dvir,nvir¦2ía:moer,roer,tuir,buir,nuir,luir,ruir¦2va:far,xar,ear,bar,par,uar,iar,nar,jar,zar,rar,sar,var,har,oar,çar,gar,car,lar,dar,mar¦2inha:ster,bter,nter¦1ía:air¦coitava:çoitar¦unha:or",
        "rev": "1er:via,cia,xia,tinha,hia,oía,oia¦1ir:uía¦2er:azia,omia,izia,ndia,abia,ebia,atia,rria,fria,egia,mpia,ozia,osia,cria¦2r:uia,lia,nia,vinha¦2çar:alcava¦3er:ueria,erdia,metia,ordia,ambia,remia,cedia,angia,valia,enzia¦3r:rmia,ntia,uvia,igia,ubia,ugia,pria,ssia,umia,stia,oria,idia,utia,rgia,bria,uzia,spia,itia,agia,udia,ibia,upia,uria,lpia,rpia,imia,adia,rzia,iria,nhia¦4r:artia,ingia,feria,petia,geria,letia,undia,redia,lodia,seria,andia,india,arcia,egria,teria,ortia,pedia,umbia,anzia,ramia,urdia,ungia¦4er:rretia¦5er:nvertia,evertia,bvertia,rvertia",
        "ex": "era:ser¦1a:ir¦2nha:vir¦1inha:ter¦2va:dar¦6inha:entreter¦3inha:deter,reter¦4cava:abraçar¦2ía:roer,moer,soer,ruir,puir¦2cava:coçar,roçar,laçar¦2inha:ater¦4ía:arguir¦3cava:calçar,forçar,atiçar¦4va:citar,fitar,ditar¦3va:atar¦5va:quitar¦3nha:avir¦1ia:ver,ler¦3ia:poder,valer,ceder,feder,gemer,temer,meter,viger,arder,reler¦1unha:pôr¦2a:rir¦5a:sorrir,servir,aderir,curtir,nutrir,surtir¦3a:agir,adir¦4a:pedir,medir,ferir,parir,latir,gerir,remir,ungir¦2ia:crer¦7a:divertir,advertir¦4ia:erguer,verter"
      },
      "second": {
        "fwd": "ias:er¦unhas:ôr¦1as:ir¦2cavas:tiçar",
        "both": "5nhas:tervir¦4vas:pitar,citar,gitar,litar,bitar,ritar,mitar,sitar,vitar,ditar,eitar¦4nhas:rovir¦4ías:ossuir¦3vas:xtar,ctar,otar,etar,ptar,utar,atar,rtar,ltar,ntar,star¦3nhas:avir,evir,dvir,nvir¦2ías:moer,roer,tuir,buir,nuir,luir,ruir¦2vas:far,xar,ear,bar,par,uar,iar,nar,jar,zar,rar,sar,var,har,oar,çar,gar,car,lar,dar,mar¦2inhas:ster,bter,nter¦1ías:air¦coitavas:çoitar¦unhas:or",
        "rev": "1er:vias,cias,xias,tinhas,hias,oías,oias¦1ir:uías¦2er:azias,omias,izias,ndias,abias,ebias,atias,rrias,frias,egias,mpias,ozias,osias,crias¦2r:uias,lias,nias,vinhas¦2çar:alcavas¦3er:uerias,erdias,metias,ordias,ambias,remias,cedias,angias,valias,enzias¦3r:rmias,ntias,uvias,igias,ubias,ugias,prias,ssias,umias,stias,orias,idias,utias,rgias,brias,uzias,spias,itias,agias,udias,ibias,upias,urias,lpias,rpias,imias,adias,rzias,irias,nhias¦4r:artias,ingias,ferias,petias,gerias,letias,undias,redias,lodias,serias,andias,indias,arcias,egrias,terias,ortias,pedias,umbias,anzias,ramias,urdias,ungias¦4er:rretias¦5er:nvertias,evertias,bvertias,rvertias",
        "ex": "eras:ser¦1as:ir¦2nhas:vir¦1inhas:ter¦2vas:dar¦6inhas:entreter¦3inhas:deter,reter¦4cavas:abraçar¦2ías:roer,moer,soer,ruir,puir¦2cavas:coçar,roçar,laçar¦2inhas:ater¦4ías:arguir¦3cavas:calçar,forçar,atiçar¦4vas:citar,fitar,ditar¦3vas:atar¦5vas:quitar¦3nhas:avir¦1ias:ver,ler¦3ias:poder,valer,ceder,feder,gemer,temer,meter,viger,arder,reler¦1unhas:pôr¦2as:rir¦5as:sorrir,servir,aderir,curtir,nutrir,surtir¦3as:agir,adir¦4as:pedir,medir,ferir,parir,latir,gerir,remir,ungir¦2ias:crer¦7as:divertir,advertir¦4ias:erguer,verter"
      },
      "third": {
        "fwd": "ia:er¦unha:ôr¦1a:ir¦2cava:tiçar",
        "both": "5nha:tervir¦4va:pitar,citar,gitar,litar,bitar,ritar,mitar,sitar,vitar,ditar,eitar¦4nha:rovir¦4ía:ossuir¦3va:xtar,ctar,otar,etar,ptar,utar,atar,rtar,ltar,ntar,star¦3nha:avir,evir,dvir,nvir¦2ía:moer,roer,tuir,buir,nuir,luir,ruir¦2va:far,xar,ear,bar,par,uar,iar,nar,jar,zar,rar,sar,var,har,oar,çar,gar,car,lar,dar,mar¦2inha:ster,bter,nter¦1ía:air¦coitava:çoitar¦unha:or",
        "rev": "1er:via,cia,xia,tinha,hia,oía,oia¦1ir:uía¦2er:azia,omia,izia,ndia,abia,ebia,atia,rria,fria,egia,mpia,ozia,osia,cria¦2r:uia,lia,nia,vinha¦2çar:alcava¦3er:ueria,erdia,metia,ordia,ambia,remia,cedia,angia,valia,enzia¦3r:rmia,ntia,uvia,igia,ubia,ugia,pria,ssia,umia,stia,oria,idia,utia,rgia,bria,uzia,spia,itia,agia,udia,ibia,upia,uria,lpia,rpia,imia,adia,rzia,iria,nhia¦4r:artia,ingia,feria,petia,geria,letia,undia,redia,lodia,seria,andia,india,arcia,egria,teria,ortia,pedia,umbia,anzia,ramia,urdia,ungia¦4er:rretia¦5er:nvertia,evertia,bvertia,rvertia",
        "ex": "era:ser¦1a:ir¦2nha:vir¦1inha:ter¦2va:dar¦6inha:entreter¦3inha:deter,reter¦4cava:abraçar¦2ía:roer,moer,soer,ruir,puir¦2cava:coçar,roçar,laçar¦2inha:ater¦4ía:arguir¦3cava:calçar,forçar,atiçar¦4va:citar,fitar,ditar¦3va:atar¦5va:quitar¦3nha:avir¦1ia:ver,ler¦3ia:poder,valer,ceder,feder,gemer,temer,meter,viger,arder,reler¦1unha:pôr¦2a:rir¦5a:sorrir,servir,aderir,curtir,nutrir,surtir¦3a:agir,adir¦4a:pedir,medir,ferir,parir,latir,gerir,remir,ungir¦2ia:crer¦7a:divertir,advertir¦4ia:erguer,verter"
      },
      "firstPlural": {
        "fwd": "íamos:er,ir¦únhamos:ôr",
        "both": "5ínhamos:ntreter¦4ínhamos:tervir¦3ínhamos:rovir¦2ínhamos:avir,evir,ster,bter,nvir,nter¦coitávamos:çoitar¦únhamos:or¦ávamos:ar",
        "rev": "1er:víamos,cíamos,xíamos,híamos,tínhamos,oíamos¦1ir:aíamos,uíamos,líamos,níamos,vínhamos¦2er:azíamos,omíamos,izíamos,ndíamos,abíamos,ebíamos,egíamos,atíamos,rríamos,fríamos,mpíamos,ozíamos,críamos¦2ir:rmíamos,ntíamos,uvíamos,igíamos,idíamos,stíamos,príamos,ssíamos,bríamos,itíamos,rgíamos,eríamos,uzíamos,spíamos,adíamos,umíamos,agíamos,udíamos,oríamos,imíamos,ibíamos,ugíamos,uríamos,lpíamos,gríamos,rpíamos,rzíamos,utíamos,upíamos,amíamos,nhíamos¦3ir:artíamos,ingíamos,uiríamos,petíamos,letíamos,undíamos,pedíamos,lodíamos,andíamos,utríamos,arcíamos,urtíamos,umbíamos,indíamos,urdíamos,ungíamos¦3er:ueríamos,erdíamos,metíamos,ambíamos,cedíamos,angíamos,valíamos,enzíamos,remíamos¦3çar:bracávamos¦4ir:gredíamos,ranzíamos¦4er:rretíamos¦5ir:ivertíamos¦5er:nvertíamos,evertíamos,bvertíamos,rvertíamos",
        "ex": "íamos:ir¦éramos:ser¦1ínhamos:vir,ter¦3ínhamos:deter,reter,advir¦4cávamos:abraçar¦2cávamos:coçar,roçar,laçar¦2ínhamos:ater,avir¦3cávamos:calçar,forçar,atiçar¦1íamos:ver,rir,ler¦3íamos:poder,pedir,subir,medir,valer,ceder,feder,gemer,temer,parir,meter,latir,viger,arder,coser,remir,ungir,reler¦1únhamos:pôr¦4íamos:sorrir,servir,morder,erguer,sortir,verter¦2íamos:agir,crer,adir¦6íamos:advertir"
      },
      "secondPlural": {
        "fwd": "íeis:er,ir¦únheis:ôr",
        "both": "5ínheis:ntreter¦4ínheis:tervir¦3ínheis:rovir¦2ínheis:avir,evir,ster,bter,nvir,nter¦coitáveis:çoitar¦únheis:or¦áveis:ar",
        "rev": "1er:víeis,cíeis,xíeis,híeis,tínheis,oíeis¦1ir:aíeis,uíeis,líeis,níeis,vínheis¦2er:azíeis,omíeis,izíeis,ndíeis,abíeis,ebíeis,egíeis,atíeis,rríeis,fríeis,mpíeis,ozíeis,críeis¦2ir:rmíeis,ntíeis,uvíeis,igíeis,idíeis,stíeis,príeis,ssíeis,bríeis,itíeis,rgíeis,eríeis,uzíeis,spíeis,adíeis,umíeis,agíeis,udíeis,oríeis,imíeis,ibíeis,ugíeis,uríeis,lpíeis,gríeis,rpíeis,rzíeis,utíeis,upíeis,amíeis,nhíeis¦3ir:artíeis,ingíeis,uiríeis,petíeis,letíeis,undíeis,pedíeis,lodíeis,andíeis,utríeis,arcíeis,urtíeis,umbíeis,indíeis,urdíeis,ungíeis¦3er:ueríeis,erdíeis,metíeis,ambíeis,cedíeis,angíeis,valíeis,enzíeis,remíeis¦3çar:bracáveis¦4ir:gredíeis,ranzíeis¦4er:rretíeis¦5ir:ivertíeis¦5er:nvertíeis,evertíeis,bvertíeis,rvertíeis",
        "ex": "íeis:ir¦éreis:ser¦1ínheis:vir,ter¦3ínheis:deter,reter,advir¦4cáveis:abraçar¦2cáveis:coçar,roçar,laçar¦2ínheis:ater,avir¦3cáveis:calçar,forçar,atiçar¦1íeis:ver,rir,ler¦3íeis:poder,pedir,subir,medir,valer,ceder,feder,gemer,temer,parir,meter,latir,viger,arder,coser,remir,ungir,reler¦1únheis:pôr¦4íeis:sorrir,servir,morder,erguer,sortir,verter¦2íeis:agir,crer,adir¦6íeis:advertir"
      },
      "thirdPlural": {
        "fwd": "iam:er¦unham:ôr¦1am:ir¦2cavam:tiçar",
        "both": "5nham:tervir¦4vam:pitar,citar,gitar,litar,bitar,ritar,mitar,sitar,vitar,ditar,eitar¦4nham:rovir¦4íam:ossuir¦3vam:xtar,ctar,otar,etar,ptar,utar,atar,rtar,ltar,ntar,star¦3nham:avir,evir,dvir,nvir¦2íam:moer,roer,tuir,buir,nuir,luir,ruir¦2vam:far,xar,ear,bar,par,uar,iar,nar,jar,zar,rar,sar,var,har,oar,çar,gar,car,lar,dar,mar¦2inham:ster,bter,nter¦1íam:air¦coitavam:çoitar¦unham:or",
        "rev": "1er:viam,ciam,xiam,tinham,hiam,oíam,oiam¦1ir:uíam¦2er:aziam,omiam,iziam,ndiam,abiam,ebiam,atiam,rriam,friam,egiam,mpiam,oziam,osiam,criam¦2r:uiam,liam,niam,vinham¦2çar:alcavam¦3er:ueriam,erdiam,metiam,ordiam,ambiam,remiam,cediam,angiam,valiam,enziam¦3r:rmiam,ntiam,uviam,igiam,ubiam,ugiam,priam,ssiam,umiam,stiam,oriam,idiam,utiam,rgiam,briam,uziam,spiam,itiam,agiam,udiam,ibiam,upiam,uriam,lpiam,rpiam,imiam,adiam,rziam,iriam,nhiam¦4r:artiam,ingiam,feriam,petiam,geriam,letiam,undiam,rediam,lodiam,seriam,andiam,indiam,arciam,egriam,teriam,ortiam,pediam,umbiam,anziam,ramiam,urdiam,ungiam¦4er:rretiam¦5er:nvertiam,evertiam,bvertiam,rvertiam",
        "ex": "eram:ser¦1am:ir¦2nham:vir¦1inham:ter¦2vam:dar¦6inham:entreter¦3inham:deter,reter¦4cavam:abraçar¦2íam:roer,moer,soer,ruir,puir¦2cavam:coçar,roçar,laçar¦2inham:ater¦4íam:arguir¦3cavam:calçar,forçar,atiçar¦4vam:citar,fitar,ditar¦3vam:atar¦5vam:quitar¦3nham:avir¦1iam:ver,ler¦3iam:poder,valer,ceder,feder,gemer,temer,meter,viger,arder,reler¦1unham:pôr¦2am:rir¦5am:sorrir,servir,aderir,curtir,nutrir,surtir¦3am:agir,adir¦4am:pedir,medir,ferir,parir,latir,gerir,remir,ungir¦2iam:crer¦7am:divertir,advertir¦4iam:erguer,verter"
      }
    },
    "pastTense": {
      "first": {
        "fwd": "1:ir¦us:ôr¦coitei:çoitar¦1i:rer,ler,her,ger,mer,uer,per,ser¦2i:nder,rder,eder,nzer,rter¦2ive:ster¦2quei:inçar",
        "both": "5ive:brestar¦5m:tervir¦4i:rreter¦4ouve:omprazer¦4m:rovir¦4ive:treter¦3quei:troçar,braçar¦3m:avir,evir,nvir¦3í:rguir,ssuir¦3i:amber,meter¦2í:cuir,tuir,buir,nuir,ruir,luir¦2ive:bter,nter¦2i:ater,eber¦1i:xer,cer,ver¦1í:oer,air¦1ouve:eaver¦1uei:gar¦1sse:izer¦us:or¦cei:çar¦quei:car¦oube:aber¦ei:ar¦ude:oder¦iz:azer",
        "rev": "r:m¦erer:is¦1azer:rouxe¦1ir:uí¦1er:oi¦2er:omi,rri,egi,lhi,chi,fri,etive,azi,ozi,mpi,osi,cri¦2r:ni,zi¦2çar:moquei¦3er:endi,erdi,ordi,bstive,rgui,cedi,angi,erti,vali,enzi,reli,celi,essi¦3r:nti,uvi,igi,ubi,ugi,pri,umi,sti,bri,idi,uti,oli,eri,spi,iti,agi,udi,ori,tri,imi,qui,uri,lpi,rgi,adi,ibi,uli,upi,nhi,odi,lgi,iri,pli,cti¦4r:arti,ormi,egui,ingi,leti,undi,redi,pedi,ngui,indi,arci,peli,arpi,urti,andi,rami,urdi,ungi,bali,medi,ardi,tali¦4er:pondi,condi,premi¦4çar:trinquei¦5er:equeri,-queri,lqueri¦5r:epeti,mpeti,negri,cumbi,servi",
        "ex": "2:rir¦3:agir,adir¦4:pedir,medir,falir,parir,latir,remir,ungir,delir,balir,urdir¦5:sorrir,tossir,servir,sortir,zumbir,fremir,condir,garrir¦7:divertir,advertir¦fui:ir¦2m:vir¦1i:ver,ler¦3ive:estar,deter,reter¦1ive:ter¦1ouve:haver¦2is:querer¦2ouxe:trazer¦4m:advir¦3i:meter,jazer,cozer,valer,ceder,feder,gemer,temer,viger,arder,reler¦2quei:coçar,roçar,laçar¦2ive:ater¦3quei:calçar,forçar,atiçar¦2í:ruir,puir¦2i:poer,crer¦3m:avir¦4quei:remoçar¦1us:pôr¦4i:tremer,premer,monger¦4ive:suster¦1coitei:açoitar¦7i:absterger"
      },
      "second": {
        "fwd": "useste:ôr¦coitaste:çoitar¦2ste:xer,ser¦2iveste:ster¦2caste:inçar¦3ste:iver¦5ste:coitar",
        "both": "5ste:quitar,ltitar,noitar,rreter¦5iveste:brestar¦5iste:ntrever¦5este:tervir¦4ste:pitar,gitar,orver,vitar,litar,sitar,enzer,bitar,ritar,citar,mitar,meter,ditar,eitar,caver,rever¦4iste:terver,ntever¦4este:rovir¦4iveste:treter¦3regulamentasseiaste:baciar¦3caste:emoçar,troçar¦3ste:xtar,rder,eder,ctar,ater,otar,rter,mber,etar,ptar,rtar,lver,utar,atar,eber,over,ltar,star,nder,ntar¦3este:evir,avir,dvir,nvir¦3íste:ssuir¦2íste:cuir,tuir,buir,nuir,luir,ruir¦2ste:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,sar,var,har,oar,cer,jar,çar,gar,dar,rer,lar,mer,mar¦2iveste:bter,nter¦1ouveste:eaver¦1íste:air¦1sseste:izer¦1ste:ir¦useste:or¦oubeste:aber¦udeste:oder¦izeste:azer",
        "rev": "erer:iseste¦ir:íste¦1r:ieste¦1azer:rouxeste,rouveste¦2er:eviste,etiveste¦2r:teste,taste¦3r:eveste,azeste,ozeste,oseste,exeste¦3çar:bracaste¦4r:viveste,erveste¦4çar:trincaste¦5r:resseste",
        "ex": "foste:ir¦2este:vir¦1iste:ver¦3iveste:estar,deter,reter¦1iveste:ter¦1este:dar¦1ouveste:haver¦2iseste:querer¦2ouxeste:trazer¦2ste:ler,rer¦4ste:dever,meter,jazer,cozer,citar,fitar,ditar,pitar,viver¦4iste:prever¦3iste:rever¦4caste:abraçar¦2caste:coçar,roçar,laçar¦2iveste:ater¦4íste:arguir¦5ste:ferver,quitar,poitar¦5ouveste:comprazer¦3caste:calçar,forçar,atiçar¦2íste:ruir,puir¦3ste:atar¦3este:avir¦6ste:afoitar¦8ste:circuitar¦1useste:pôr¦4iveste:abster,suster¦1coitaste:açoitar"
      },
      "third": {
        "fwd": "coitou:çoitar¦1s:ôr¦2cou:inçar¦3ve:ster",
        "both": "5eve:brestar¦5u:rreter¦5ve:treter¦4iu:terver,ntever¦4u:orver,meter,caver,rever¦4ouve:omprazer¦4ve:onter¦4eio:tervir¦3cou:emoçar,troçar,braçar¦3u:nzer,iver,rter,ozer,mber,lver,eder,over,ater,rder,eber,nder¦3eio:rovir¦2u:ser,uer,ler,per,oer,her,xer,ger,cer,rer,mer¦2eio:avir,evir,dvir,nvir¦1ouve:eaver¦1sse:izer¦1u:ir¦ôs:or¦oube:aber¦ou:ar¦ôde:oder¦ez:azer",
        "rev": "ir:eio¦erer:is¦1azer:rouxe¦1r:eu¦2er:eviu¦3r:nteve,eteve¦4r:bsteve,usteve¦4çar:trincou",
        "ex": "foi:ir¦1eio:vir¦1iu:ver¦3eve:estar¦2ve:ter¦1eu:dar¦1ouve:haver¦2is:querer¦2ouxe:trazer¦2u:ler,rer¦5ve:manter¦4u:dever,meter,jazer¦4iu:prever¦3iu:rever¦4ve:deter,reter,obter¦2cou:coçar,roçar,laçar¦3ve:ater¦5u:ferver¦3cou:calçar,forçar,atiçar¦6iu:entrever¦2eio:avir¦2s:pôr¦1coitou:açoitar"
      },
      "firstPlural": {
        "fwd": "usemos:ôr¦coitamos:çoitar¦2mos:xer,ser¦2ivemos:ster¦2camos:inçar¦3mos:iver¦5mos:coitar",
        "both": "5mos:quitar,ltitar,noitar,rreter¦5ivemos:brestar¦5imos:ntrever¦5emos:tervir¦4mos:pitar,gitar,orver,vitar,litar,sitar,enzer,bitar,ritar,citar,mitar,meter,ditar,eitar,caver,rever¦4imos:terver,ntever¦4emos:rovir¦4ivemos:treter¦3camos:emoçar,troçar¦3mos:xtar,rder,eder,ctar,ater,otar,rter,mber,etar,ptar,rtar,lver,utar,atar,eber,over,ltar,star,nder,ntar¦3emos:evir,avir,dvir,nvir¦3ímos:ssuir¦2ímos:cuir,tuir,buir,nuir,luir,ruir¦2mos:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,sar,var,har,oar,cer,jar,çar,gar,dar,rer,lar,mer,mar¦2ivemos:bter,nter¦1ouvemos:eaver¦1ímos:air¦1ssemos:izer¦1mos:ir¦usemos:or¦oubemos:aber¦udemos:oder¦izemos:azer",
        "rev": "erer:isemos¦ir:ímos¦1r:iemos¦1azer:rouxemos,rouvemos¦2er:evimos,etivemos¦2r:temos,tamos¦3r:evemos,azemos,ozemos,osemos,exemos¦3çar:bracamos¦4r:vivemos,ervemos¦4çar:trincamos¦5r:ressemos",
        "ex": "fomos:ir¦2emos:vir¦1imos:ver¦3ivemos:estar,deter,reter¦1ivemos:ter¦1emos:dar¦1ouvemos:haver¦2isemos:querer¦2ouxemos:trazer¦2mos:ler,rer¦4mos:dever,meter,jazer,cozer,citar,fitar,ditar,pitar,viver¦4imos:prever¦3imos:rever¦4camos:abraçar¦2camos:coçar,roçar,laçar¦2ivemos:ater¦4ímos:arguir¦5mos:ferver,quitar,poitar¦5ouvemos:comprazer¦3camos:calçar,forçar,atiçar¦2ímos:ruir,puir¦3mos:atar¦3emos:avir¦6mos:afoitar¦8mos:circuitar¦1usemos:pôr¦4ivemos:abster,suster¦1coitamos:açoitar"
      },
      "secondPlural": {
        "fwd": "usestes:ôr¦coitastes:çoitar¦2stes:xer,ser¦2ivestes:ster¦2castes:inçar¦3stes:iver¦5stes:coitar",
        "both": "5stes:quitar,ltitar,noitar,rreter¦5ivestes:brestar¦5istes:ntrever¦5estes:tervir¦4stes:pitar,gitar,orver,vitar,litar,sitar,enzer,bitar,ritar,citar,mitar,meter,ditar,eitar,caver,rever¦4istes:terver,ntever¦4estes:rovir¦4ivestes:treter¦3castes:emoçar,troçar¦3stes:xtar,rder,eder,ctar,ater,otar,rter,mber,etar,ptar,rtar,lver,utar,atar,eber,over,ltar,star,nder,ntar¦3estes:evir,avir,dvir,nvir¦3ístes:ssuir¦2ístes:cuir,tuir,buir,nuir,luir,ruir¦2stes:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,sar,var,har,oar,cer,jar,çar,gar,dar,rer,lar,mer,mar¦2ivestes:bter,nter¦1ouvestes:eaver¦1ístes:air¦1ssestes:izer¦1stes:ir¦usestes:or¦oubestes:aber¦udestes:oder¦izestes:azer",
        "rev": "erer:isestes¦ir:ístes¦1r:iestes¦1azer:rouxestes,rouvestes¦2er:evistes,etivestes¦2r:testes,tastes¦3r:evestes,azestes,ozestes,osestes,exestes¦3çar:bracastes¦4r:vivestes,ervestes¦4çar:trincastes¦5r:ressestes",
        "ex": "fostes:ir¦2estes:vir¦1istes:ver¦3ivestes:estar,deter,reter¦1ivestes:ter¦1estes:dar¦1ouvestes:haver¦2isestes:querer¦2ouxestes:trazer¦2stes:ler,rer¦4stes:dever,meter,jazer,cozer,citar,fitar,ditar,pitar,viver¦4istes:prever¦3istes:rever¦4castes:abraçar¦2castes:coçar,roçar,laçar¦2ivestes:ater¦4ístes:arguir¦5stes:ferver,quitar,poitar¦5ouvestes:comprazer¦3castes:calçar,forçar,atiçar¦2ístes:ruir,puir¦3stes:atar¦3estes:avir¦6stes:afoitar¦8stes:circuitar¦1usestes:pôr¦4ivestes:abster,suster¦1coitastes:açoitar"
      },
      "thirdPlural": {
        "fwd": "useram:ôr¦coitaram:çoitar¦2iveram:ster¦2caram:inçar¦3am:xer,ser¦4am:iver",
        "both": "5am:poçar,naçar,haçar,maçar,ençar,paçar,bitar,gaçar,laçar,baçar,gitar,oaçar,doçar,pitar,uitar,unçar,orver,citar,ritar,litar,meter,nguir,mitar,vitar,ançar,sitar,ditar,eitar,caver,eguir,rever¦5iveram:brestar,ntreter¦5iram:ntrever¦4am:xtar,eçar,nzer,uçar,içar,quir,ctar,rçar,lver,rter,mber,otar,etar,ptar,rtar,star,utar,atar,eder,over,ater,ltar,rder,eber,uvir,nder,ntar¦4iram:terver¦4ou:saguar¦4eram:rovir¦3caram:emoçar,troçar,braçar¦3am:hir,far,ler,cir,per,zir,uer,mer,ger,oer,zar,pir,nir,her,lir,iar,nar,cer,rir,bar,uar,par,var,sir,har,xar,bir,ear,oar,jar,rar,sar,gar,car,dir,gir,mir,rer,lar,dar,tir,mar¦3eram:avir,evir,dvir,nvir¦3ouveram:mprazer¦3iram:tever¦2iveram:bter,nter¦1íram:uir,air¦1ouveram:eaver¦1sseram:izer¦useram:or¦ouberam:aber¦uderam:oder¦izeram:azer",
        "rev": "3:çaram,teram,taram,uiram¦4:everam,azeram,ozeram,oseram,exeram¦5:viveram,erveram,esseram¦erer:iseram¦1r:ieram¦1azer:rouxeram¦2er:eviram,etiveram¦3er:bstiveram,ustiveram¦4çar:trincaram",
        "ex": "foram:ir¦2eram:vir¦1iram:ver¦3iveram:estar,deter,reter¦1iveram:ter¦1eram:dar¦1ouveram:haver¦2iseram:querer¦2ouxeram:trazer¦3am:rir,ler,rer¦7eram:intervir¦5am:dever,caçar,meter,jazer,cozer,citar,fitar,alçar,ditar,maçar,pitar,inçar,viver¦7am:almoçar,ameaçar,realçar,esboçar,achoçar,afoitar¦4iram:prever¦6am:servir,traçar,ferver,poitar¦3iram:rever¦2caram:coçar,roçar,laçar¦2iveram:ater¦3caram:calçar,forçar,atiçar¦8am:derreter,saltitar,engraçar,morraçar¦4am:atar,içar¦10am:despedaçar,escorraçar,abiscoitar¦3eram:avir¦9am:descalçar,redarguir,espicaçar,pernoitar,embaraçar,amordaçar,desgraçar,alvoroçar,espedaçar,congraçar,desservir¦12am:desembaraçar¦1useram:pôr¦1coitaram:açoitar"
      }
    },
    "pluperfect": {
      "first": {
        "fwd": "usera:ôr¦coitara:çoitar¦2ivera:ster¦2cara:inçar¦3a:xer,ser¦4a:iver",
        "both": "5a:poçar,naçar,haçar,maçar,ençar,paçar,bitar,gaçar,laçar,baçar,gitar,oaçar,doçar,pitar,uitar,unçar,orver,citar,ritar,litar,meter,nguir,mitar,vitar,ançar,sitar,ditar,eitar,caver,eguir,rever¦5ivera:brestar,ntreter¦5ira:ntrever¦4a:xtar,eçar,nzer,uçar,içar,quir,ctar,rçar,lver,rter,mber,otar,etar,ptar,rtar,star,utar,atar,eder,over,ater,ltar,rder,eber,uvir,nder,ntar¦4ira:terver¦4era:rovir¦3cara:emoçar,troçar,braçar¦3a:hir,far,ler,cir,per,zir,uer,mer,ger,oer,zar,pir,nir,her,lir,iar,nar,cer,rir,bar,uar,par,var,sir,har,xar,bir,ear,oar,jar,rar,sar,gar,car,dir,gir,mir,rer,lar,dar,tir,mar¦3era:avir,evir,dvir,nvir¦3ouvera:mprazer¦3ira:tever¦2ivera:bter,nter¦1íra:uir,air¦1ouvera:eaver¦1ssera:izer¦usera:or¦oubera:aber¦udera:oder¦izera:azer",
        "rev": "3:çara,tera,tara,uira¦4:evera,azera,ozera,osera,exera¦5:vivera,ervera,essera¦erer:isera¦1r:iera¦1azer:rouxera¦2er:evira,etivera¦3er:bstivera,ustivera¦4çar:trincara",
        "ex": "fora:ir¦2era:vir¦1ira:ver¦3ivera:estar,deter,reter¦1ivera:ter¦1era:dar¦1ouvera:haver¦2isera:querer¦2ouxera:trazer¦3a:rir,ler,rer¦7era:intervir¦5a:dever,caçar,meter,jazer,cozer,citar,fitar,alçar,ditar,maçar,pitar,inçar,viver¦7a:almoçar,ameaçar,realçar,esboçar,achoçar,afoitar¦4ira:prever¦6a:servir,traçar,ferver,poitar¦3ira:rever¦2cara:coçar,roçar,laçar¦2ivera:ater¦3cara:calçar,forçar,atiçar¦8a:derreter,saltitar,engraçar,morraçar¦4a:atar,içar¦10a:despedaçar,escorraçar,abiscoitar¦3era:avir¦9a:descalçar,redarguir,espicaçar,pernoitar,embaraçar,amordaçar,desgraçar,alvoroçar,espedaçar,congraçar,desservir¦12a:desembaraçar¦1usera:pôr¦1coitara:açoitar"
      },
      "second": {
        "fwd": "useras:ôr¦coitaras:çoitar¦2iveras:ster¦2caras:inçar¦3as:xer,ser¦4as:iver",
        "both": "5as:poçar,naçar,haçar,maçar,ençar,paçar,bitar,gaçar,laçar,baçar,gitar,oaçar,doçar,pitar,uitar,unçar,orver,citar,ritar,litar,meter,nguir,mitar,vitar,ançar,sitar,ditar,eitar,caver,eguir,rever¦5iveras:brestar,ntreter¦5iras:ntrever¦4as:xtar,eçar,nzer,uçar,içar,quir,ctar,rçar,lver,rter,mber,otar,etar,ptar,rtar,star,utar,atar,eder,over,ater,ltar,rder,eber,uvir,nder,ntar¦4iras:terver¦4eras:rovir¦3caras:emoçar,troçar,braçar¦3as:hir,far,ler,cir,per,zir,uer,mer,ger,oer,zar,pir,nir,her,lir,iar,nar,cer,rir,bar,uar,par,var,sir,har,xar,bir,ear,oar,jar,rar,sar,gar,car,dir,gir,mir,rer,lar,dar,tir,mar¦3eras:avir,evir,dvir,nvir¦3ouveras:mprazer¦3iras:tever¦2iveras:bter,nter¦1íras:uir,air¦1ouveras:eaver¦1sseras:izer¦useras:or¦ouberas:aber¦uderas:oder¦izeras:azer",
        "rev": "3:çaras,teras,taras,uiras¦4:everas,azeras,ozeras,oseras,exeras¦5:viveras,erveras,esseras¦erer:iseras¦1r:ieras¦1azer:rouxeras¦2er:eviras,etiveras¦3er:bstiveras,ustiveras¦4çar:trincaras",
        "ex": "foras:ir¦2eras:vir¦1iras:ver¦3iveras:estar,deter,reter¦1iveras:ter¦1eras:dar¦1ouveras:haver¦2iseras:querer¦2ouxeras:trazer¦3as:rir,ler,rer¦7eras:intervir¦5as:dever,caçar,meter,jazer,cozer,citar,fitar,alçar,ditar,maçar,pitar,inçar,viver¦7as:almoçar,ameaçar,realçar,esboçar,achoçar,afoitar¦4iras:prever¦6as:servir,traçar,ferver,poitar¦3iras:rever¦2caras:coçar,roçar,laçar¦2iveras:ater¦3caras:calçar,forçar,atiçar¦8as:derreter,saltitar,engraçar,morraçar¦4as:atar,içar¦10as:despedaçar,escorraçar,abiscoitar¦3eras:avir¦9as:descalçar,redarguir,espicaçar,pernoitar,embaraçar,amordaçar,desgraçar,alvoroçar,espedaçar,congraçar,desservir¦12as:desembaraçar¦1useras:pôr¦1coitaras:açoitar"
      },
      "third": {
        "fwd": "usera:ôr¦coitara:çoitar¦2ivera:ster¦2cara:inçar¦3a:xer,ser¦4a:iver",
        "both": "5a:poçar,naçar,haçar,maçar,ençar,paçar,bitar,gaçar,laçar,baçar,gitar,oaçar,doçar,pitar,uitar,unçar,orver,citar,ritar,litar,meter,nguir,mitar,vitar,ançar,sitar,ditar,eitar,caver,eguir,rever¦5ivera:brestar,ntreter¦5ira:ntrever¦4a:xtar,eçar,nzer,uçar,içar,quir,ctar,rçar,lver,rter,mber,otar,etar,ptar,rtar,star,utar,atar,eder,over,ater,ltar,rder,eber,uvir,nder,ntar¦4ira:terver¦4era:rovir¦3cara:emoçar,troçar,braçar¦3a:hir,far,ler,cir,per,zir,uer,mer,ger,oer,zar,pir,nir,her,lir,iar,nar,cer,rir,bar,uar,par,var,sir,har,xar,bir,ear,oar,jar,rar,sar,gar,car,dir,gir,mir,rer,lar,dar,tir,mar¦3era:avir,evir,dvir,nvir¦3ouvera:mprazer¦3ira:tever¦2ivera:bter,nter¦1íra:uir,air¦1ouvera:eaver¦1ssera:izer¦usera:or¦oubera:aber¦udera:oder¦izera:azer",
        "rev": "3:çara,tera,tara,uira¦4:evera,azera,ozera,osera,exera¦5:vivera,ervera,essera¦erer:isera¦1r:iera¦1azer:rouxera¦2er:evira,etivera¦3er:bstivera,ustivera¦4çar:trincara",
        "ex": "fora:ir¦2era:vir¦1ira:ver¦3ivera:estar,deter,reter¦1ivera:ter¦1era:dar¦1ouvera:haver¦2isera:querer¦2ouxera:trazer¦3a:rir,ler,rer¦7era:intervir¦5a:dever,caçar,meter,jazer,cozer,citar,fitar,alçar,ditar,maçar,pitar,inçar,viver¦7a:almoçar,ameaçar,realçar,esboçar,achoçar,afoitar¦4ira:prever¦6a:servir,traçar,ferver,poitar¦3ira:rever¦2cara:coçar,roçar,laçar¦2ivera:ater¦3cara:calçar,forçar,atiçar¦8a:derreter,saltitar,engraçar,morraçar¦4a:atar,içar¦10a:despedaçar,escorraçar,abiscoitar¦3era:avir¦9a:descalçar,redarguir,espicaçar,pernoitar,embaraçar,amordaçar,desgraçar,alvoroçar,espedaçar,congraçar,desservir¦12a:desembaraçar¦1usera:pôr¦1coitara:açoitar"
      },
      "firstPlural": {
        "fwd": "uséramos:ôr¦coitáramos:çoitar¦2ivéramos:ster¦2cáramos:inçar",
        "both": "5ivéramos:brestar¦5íramos:ntrever¦5éramos:tervir¦4íramos:terver¦4êramos:rreter¦4ouvéramos:omprazer¦4éramos:rovir¦4ivéramos:treter¦3cáramos:troçar,braçar¦3éramos:avir,evir,nvir¦3íramos:tever¦3êramos:meter¦3ivéramos:onter,anter¦2êramos:nzer,rter,ozer,mber,rder,eder,ater,eber,nder¦2ivéramos:bter¦1êramos:xer,ser,per,uer,ger,oer,her,ler,cer,ver,rer,mer¦1ouvéramos:eaver¦1sséramos:izer¦uséramos:or¦oubéramos:aber¦áramos:ar¦íramos:ir¦udéramos:oder¦izéramos:azer",
        "rev": "erer:iséramos¦er:êramos¦1r:iéramos¦1azer:rouxéramos¦2er:evíramos,etivéramos¦2çar:mocáramos¦3er:bstivéramos,ustivéramos¦4çar:trincáramos",
        "ex": "fôramos:ir¦2éramos:vir¦1íramos:ver¦3ivéramos:estar,deter,reter¦1ivéramos:ter¦1éramos:dar¦1ouvéramos:haver¦2iséramos:querer¦2ouxéramos:trazer¦1êramos:ler,rer¦4íramos:prever¦3íramos:rever¦4éramos:advir¦3êramos:meter,jazer¦2cáramos:coçar,roçar,laçar¦2ivéramos:ater¦3cáramos:calçar,forçar,atiçar¦3éramos:avir¦4cáramos:remoçar¦1uséramos:pôr¦1coitáramos:açoitar"
      },
      "secondPlural": {
        "fwd": "uséreis:ôr¦coitáreis:çoitar¦2ivéreis:ster¦2cáreis:inçar",
        "both": "5ivéreis:brestar¦5íreis:ntrever¦5éreis:tervir¦4íreis:terver¦4êreis:rreter¦4ouvéreis:omprazer¦4éreis:rovir¦4ivéreis:treter¦3cáreis:troçar,braçar¦3éreis:avir,evir,nvir¦3íreis:tever¦3êreis:meter¦3ivéreis:onter,anter¦2êreis:nzer,rter,ozer,mber,rder,eder,ater,eber,nder¦2ivéreis:bter¦1êreis:xer,ser,per,uer,ger,oer,her,ler,cer,ver,rer,mer¦1ouvéreis:eaver¦1sséreis:izer¦uséreis:or¦oubéreis:aber¦áreis:ar¦íreis:ir¦udéreis:oder¦izéreis:azer",
        "rev": "erer:iséreis¦er:êreis¦1r:iéreis¦1azer:rouxéreis¦2er:evíreis,etivéreis¦2çar:mocáreis¦3er:bstivéreis,ustivéreis¦4çar:trincáreis",
        "ex": "fôreis:ir¦2éreis:vir¦1íreis:ver¦3ivéreis:estar,deter,reter¦1ivéreis:ter¦1éreis:dar¦1ouvéreis:haver¦2iséreis:querer¦2ouxéreis:trazer¦1êreis:ler,rer¦4íreis:prever¦3íreis:rever¦4éreis:advir¦3êreis:meter,jazer¦2cáreis:coçar,roçar,laçar¦2ivéreis:ater¦3cáreis:calçar,forçar,atiçar¦3éreis:avir¦4cáreis:remoçar¦1uséreis:pôr¦1coitáreis:açoitar"
      },
      "thirdPlural": {
        "fwd": "useram:ôr¦coitaram:çoitar¦2iveram:ster¦2caram:inçar¦3am:xer,ser¦4am:iver",
        "both": "5am:poçar,naçar,haçar,maçar,ençar,paçar,bitar,gaçar,laçar,baçar,gitar,oaçar,doçar,pitar,uitar,unçar,orver,citar,ritar,litar,meter,nguir,mitar,vitar,ançar,sitar,ditar,eitar,caver,eguir,rever¦5iveram:brestar,ntreter¦5iram:ntrever¦4am:xtar,eçar,nzer,uçar,içar,quir,ctar,rçar,lver,rter,mber,otar,etar,ptar,rtar,star,utar,atar,eder,over,ater,ltar,rder,eber,uvir,nder,ntar¦4iram:terver¦4eram:rovir¦3caram:emoçar,troçar,braçar¦3am:hir,far,ler,cir,per,zir,uer,mer,ger,oer,zar,pir,nir,her,lir,iar,nar,cer,rir,bar,uar,par,var,sir,har,xar,bir,ear,oar,jar,rar,sar,gar,car,dir,gir,mir,rer,lar,dar,tir,mar¦3eram:avir,evir,dvir,nvir¦3ouveram:mprazer¦3iram:tever¦2iveram:bter,nter¦1íram:uir,air¦1ouveram:eaver¦1sseram:izer¦useram:or¦ouberam:aber¦uderam:oder¦izeram:azer",
        "rev": "3:çaram,teram,taram,uiram¦4:everam,azeram,ozeram,oseram,exeram¦5:viveram,erveram,esseram¦erer:iseram¦1r:ieram¦1azer:rouxeram¦2er:eviram,etiveram¦3er:bstiveram,ustiveram¦4çar:trincaram",
        "ex": "foram:ir¦2eram:vir¦1iram:ver¦3iveram:estar,deter,reter¦1iveram:ter¦1eram:dar¦1ouveram:haver¦2iseram:querer¦2ouxeram:trazer¦3am:rir,ler,rer¦7eram:intervir¦5am:dever,caçar,meter,jazer,cozer,citar,fitar,alçar,ditar,maçar,pitar,inçar,viver¦7am:almoçar,ameaçar,realçar,esboçar,achoçar,afoitar¦4iram:prever¦6am:servir,traçar,ferver,poitar¦3iram:rever¦2caram:coçar,roçar,laçar¦2iveram:ater¦3caram:calçar,forçar,atiçar¦8am:derreter,saltitar,engraçar,morraçar¦4am:atar,içar¦10am:despedaçar,escorraçar,abiscoitar¦3eram:avir¦9am:descalçar,redarguir,espicaçar,pernoitar,embaraçar,amordaçar,desgraçar,alvoroçar,espedaçar,congraçar,desservir¦12am:desembaraçar¦1useram:pôr¦1coitaram:açoitar"
      }
    },
    "presentTense": {
      "first": {
        "fwd": "o:ar,uer¦ei:aver¦onho:ôr¦urmo:ormir¦jo:gir,ger¦igo:eguir¦ço:cer,cir¦isto:estir¦iro:erir¦ito:etir¦ino:enir¦ilo:elir¦igro:egrir¦urto:ortir¦usco:oscar¦1sso:oder¦1o:mer,rer,xer,her,oer,per,ser¦1go:izer¦1ço:uvir¦1ulo:golir¦2o:air,nder,iver,ubir,prir,umir,over,idir,itir,utir,eder,ndir,nuir,nguir,inir,odir,udir,ater,trir,imir,upir,nzer,tuir,adir,rter,nzir,ulir,plir,irir,nhir,mbir¦2co:erder¦2ho:aler¦3o:artir,rrir,istir,antir,urtir¦3io:eler¦4o:rreter",
        "both": "5ou:brestar¦5jo:trever¦5nho:treter¦4enho:esavir,tervir¦4o:prazer,crever¦4jo:tever¦4ço:espedir¦4iro:equerer¦3o:nibir,orver,xibir,rguir,meter,ssuir¦3io:crer¦3eio:endiar,mediar¦3nho:ster,nter¦3ço:mpedir¦3co:braçar¦3enho:rovir¦2enho:evir,dvir,nvir¦2o:ruir,lver,buir,uzir,luir,eber¦2eio:nsiar¦2ço:fazer¦1ízo:aizar,uizar,eizar¦1úço:iuçar¦1ísco:aiscar¦1íno:uinar¦1irjo:vergir¦1ílio:biliar¦1iro:arir¦1íbo:oibir¦1ido:redir¦1úno:eunir¦1io:ear¦1nho:or¦coito:çoitar¦ólego:olegar¦irzo:erzir¦ínquo:inquir¦águo:aguar¦irto:ertir¦ispo:espir¦ubro:obrir¦équo:equar¦usso:ossir¦into:entir",
        "rev": "ervir:irvo¦udar:údo¦1ar:tou,lo,oo,xo,fo¦1ber:aibo¦1eguir:sigo¦1cer:sço¦1erir:firo,diro,giro,siro¦1enir:vino¦1elir:pilo¦1egrir:nigro¦1ir:venho¦2ar:nco,ogo,nso,amo,tro,lto,iso,cho,aro,oco,rso,oro,ero,uro,oço,abo,ago,izo,lgo,aso,rno,vio,rco,rio,pio,rdo,uco,ico,nro,ano,oio,ono,rmo,uso,fio,uio,uvo,cio,oto,eco,vro,lpo,ezo,rgo,ugo,gio,dro,cto,ngo,mio,lso,dio,eso,eno,pto,avo,iço,apo,cuo,sgo,gno,opo,ldo,tio,bio,sio,epo,zio,ipo,lmo,lço,smo,ojo,nio,juo,cro,duo,lro,xto,hio¦2gir:rijo,eajo,dijo,injo,lijo,erjo,oajo,urjo,unjo¦2cer:ueço,teço,deço,reço,neço,heço,enço,leço,oeço,feço,aeço¦2etir:epito,flito,mpito¦2r:tenho¦2iar:edeio¦2zer:digo¦2estir:nvisto¦2çar:alco¦2er:oso,moo¦3ar:tudo,osto,anço,iajo,mbro,asso,sejo,onto,inho,judo,ento,eito,anto,rego,rito,unto,gino,cupo,impo,dito,ilho,anho,rumo,uido,oubo,esso,esto,rato,orto,nimo,asto,eimo,buzo,obro,vido,tumo,rado,erro,mino,leto,rigo,alho,urbo,esco,novo,piro,urro,miro,usto,oupo,alio,modo,egro,huto,arro,ligo,sego,rubo,pejo,plio,tato,tigo,hupo,ruto,tino,ulho,taco,iguo,puto,feto,vego,eaço,ruço,ruzo,lato,elho,ilio,gato,sito,maio,irro,mejo,uivo,cito,isco,aspo,cino,levo,tivo,uito,ngro,rivo,lino,pedo,nguo,ieto,timo,ibro,nejo,daço,ampo,iedo,ombo,asco,opro,redo,bsto,gajo,zijo,utuo,urvo,sato,pumo,guço,zino,agro,mato,cado,cato,oaço,uejo,ulco,rejo,pego,pido,vito,gito,cimo,eijo,rino,bedo,viro,baço,jeto,laço,pujo¦3er:endo,hovo,ofro,ambo,bato,movo,ompo,cedo,vivo,valho,enzo,rroo,remo,mexo¦3ger:otejo¦3ir:rimo,uiro,uspo,vado,sumo,cudo,tupo,dimo,uado,umbo,anzo,luto,sido,buto,lodo,ludo¦3r:evejo,raio,vaio,rvejo,caio¦3cer:xerço,rmeço,emeço,torço¦3cir:sarço¦3erir:retiro¦4r:orrio,ssaio¦4ar:ompro,omeço,tinuo,uisto,oximo,scovo,senho,heiro,omito,ssino,stejo,certo,farto,servo,perto,berto,farço,forço,ilito,lebro,mendo,lerto,ecuto,abito,gonho,preto,imito,penho,ferto,gunço,risso,chaço,onsto,teiro,carto,neiro,etomo,nvejo,mpato,mando,lpito,icido,petuo,ontuo,entuo,cifro,rtuno,migro,ipito,bituo,inquo,tenuo,rrujo,oluço,iteto,apino,morço,traco,efuto,banjo,izimo,placo,acejo,lgemo,elido,mpino,denho,elego,fusco,icaço,apito,rosso,serto,ltejo¦4ir:sisto,umpro,xisto,ecido,rmito,ranto,minuo,tituo,efino,laudo,pando,dmito,smito,cindo,epolo,emito,ncido,apulo,implo,rcuto,ncuto,runho¦4er:pondo,corro,condo,colho,verto¦4gir:terajo¦4ger:branjo,tranjo¦5ir:iscuto,eparto,ifundo¦5uir:stingo,xtingo¦5ar:rranjo,mprovo,eprovo,ropeço,corajo,dereço,emunho,arreto,svendo,ecreto,ofundo,erendo,lucido,rcundo,timido,ceituo,nsinuo,erdejo,nchego,stupro,artejo,essumo,icerço¦5er:eencho,erreto,sprovo",
        "ex": "vou:ir¦águo:aguar¦1ou:ser,dar¦2ço:fazer,pedir,medir,ouvir,tecer¦1enho:vir¦2jo:ver,fugir,reger,viger,rugir,mugir¦3ou:estar¦2nho:ter¦3go:trazer¦2o:rir,unir,amar,usar,suar,roer,moer,orar,atar,fiar,miar,irar,arar,poer,içar,piar,erar,liar,azar¦2io:ler¦1ei:saber,haver¦2ibo:caber¦3o:abrir,dever,punir,meter,jazer,cozer,arder,comer,sair,andar,viver,cair,subir,levar,olhar,mexer,bater,sumir,pegar,nadar,tomar,mudar,ligar,tirar,ceder,feder,matar,virar,lutar,errar,negar,lidar,caçar,mover,gemer,temer,fumar,erguer,assar,gozar,atuar,regar,sujar,girar,rodar,citar,nevar,somar,bulir,uivar,mirar,catar,podar,vaiar,remar,tacar,mimar,fuçar,fitar,cegar,pirar,orçar,sacar,vazar,aliar,anuir,urrar,ditar,mijar,legar,domar,rimar,vetar,untar,vedar,sedar,raiar,ninar,rumar,sovar¦3io:crer¦5jo:prover,prever,reeleger¦1irvo:servir¦4jo:rever¦2eio:odiar¦4nho:deter,reter,obter¦4o:cuspir,morder,lamber,ferver,partir,querer,correr,chegar,mandar,morrer,sonhar,buscar,encher,salvar,varrer,pintar,curtir,colher,emitir,provar,suprir,nutrir,traçar,molhar,imitar,atirar,eximir,omitir,peidar,alegar,tolher,reinar,fartar,quedar,tatuar,findar,opinar,furtar,fundir,apitar,trajar,forrar,verter,manjar,fossar,intuir,situar,lograr,rondar,listar,forjar,sondar,mondar,migrar,terçar,folhar,borrar,torrar,lindar¦3eio:mediar¦2údo:saudar¦2co:coçar,roçar,laçar¦3nho:ater¦5o:repolir,dividir,ensinar,escutar,quebrar,retirar,efetuar,treinar,avistar,aprovar,bocejar,ensaiar,agendar,brindar,validar,inundar,apartar,pelejar,afundar,colidir,latejar,cultuar,vegetar,velejar,achegar,fraudar,espetar¦3co:calçar,forçar,atiçar,perder¦4ço:expedir¦7jo:interver¦2enho:avir¦2sso:poder¦1onho:pôr¦2go:dizer¦1urmo:dormir¦1jo:agir¦1igo:seguir¦3ho:valer¦1isto:vestir¦1iro:ferir¦7o:confundir,compartir¦3ulo:engolir¦3jo:exigir,eleger,ranger,tanger¦3ço:torcer¦6o:combinar,trovejar,perfumar,mendigar,registar¦9o:entrevistar¦1urto:sortir¦3isto:revestir¦8o:consolidar¦4io:reler¦1usco:moscar"
      },
      "second": {
        "fwd": "ás:aver¦ões:ôr¦ines:enir¦oles:ulir¦urtes:ortir¦uscas:oscar¦1es:mir,gir,dir,sir,cir¦1óis:roer¦2es:etir,inir,mbir,nzir¦3es:ertir,urtir",
        "both": "5ás:brestar¦5óis:onstruir¦4ês:terver,trever¦4es:epolir,ngolir¦4óis:estruir¦4éns:treter¦3omes:ubsumir¦3es:nibir,xibir,nguir,espir,uirir,eguir,artir¦3ês:tever¦3eias:mediar¦3cas:braçar¦2es:nhir,plir,elir,trir,arir,uzir,utir,itir,erir,prir,stir,brir,ntir¦2ês:eler,crer¦2eias:ndiar,nsiar¦2éns:ster,bter,nter¦1ízas:aizar,uizar,eizar¦1úças:iuçar¦1íscas:aiscar¦1óis:moer¦1ínas:uinar¦1ílias:biliar¦1odes:cudir¦1íbes:oibir¦1ides:redir¦1únes:eunir¦1ias:ear¦1éns:vir¦coitas:çoitar¦ólegas:olegar¦irzes:erzir¦ínques:inquir¦igres:egrir¦opes:upir¦águas:aguar¦ospes:uspir¦équas:equar¦obes:ubir¦ões:or¦s:r",
        "rev": "er:ês¦ugir:oges¦olir:ules¦udar:údas¦1ar:tás¦1er:téns¦1umir:somes¦1enir:vines¦1igir:reges¦2ir:rmes,uves,imes,sses,rges,ades,umes,ages,unes,udes,uges¦2iar:edeias¦2çar:alcas¦2oer:rróis¦2ulir:apoles¦3ir:riges,inges,cides,petes,undes,xiges,pedes,lodes,indes,arces,diges,sides,umbes,anzes,liges¦4ir:ivides,fletes,efines,pandes,olides¦5ir:ivertes,dvertes",
        "ex": "vais:ir¦és:ser¦águas:aguar¦1ens:vir¦1ês:ver,ler¦3ás:estar¦2ns:ter¦1ás:dar,haver¦3es:ouvir,punir,pedir,medir¦2ês:crer¦1oges:fugir¦1omes:sumir¦4ês:prover,prever¦4es:servir,curtir,pungir¦3ês:rever¦2eias:odiar¦3éns:deter,reter¦1ules:polir¦2es:unir,agir¦1óis:roer,moer¦3eias:mediar¦4omes:consumir¦2údas:saudar¦2cas:coçar,roçar,laçar¦2éns:ater¦2eges:frigir¦3cas:calçar,forçar,atiçar¦1ões:pôr¦1oles:bulir¦1urtes:sortir¦1uscas:moscar"
      },
      "third": {
        "fwd": "á:aver¦õe:ôr¦ine:enir¦ole:ulir¦urte:ortir¦usca:oscar¦1e:mir,gir,dir,sir,cir¦1ói:roer¦2e:etir,mbir,nzir¦3e:ertir,urtir",
        "both": "2:izer,uzir,erer,azer¦5á:brestar¦5ói:onstruir¦4ê:terver,trever¦4e:epolir,ngolir¦4ói:estruir¦4ém:treter¦3ome:ubsumir¦3e:nibir,xibir,finir,nguir,espir,uirir,eguir,artir¦3ê:tever¦3eia:mediar¦3ca:braçar¦2e:nhir,plir,elir,trir,arir,utir,itir,erir,prir,stir,brir,ntir¦2ê:eler,crer¦2eia:ndiar,nsiar¦2ém:ster,bter,nter¦1íza:aizar,uizar,eizar¦1úça:iuçar¦1ísca:aiscar¦1ói:moer¦1ína:uinar¦1ília:biliar¦1ode:cudir¦1íbe:oibir¦1ide:redir¦1úne:eunir¦1ia:ear¦1ém:vir¦coita:çoitar¦ólega:olegar¦irze:erzir¦ínque:inquir¦igre:egrir¦ope:upir¦água:aguar¦ospe:uspir¦équa:equar¦obe:ubir¦õe:or¦:r",
        "rev": "er:ê¦ugir:oge¦olir:ule¦udar:úda¦1ar:tá¦1er:tém¦1umir:some¦1enir:vine¦1igir:rege¦2ir:rme,uve,ime,sse,rge,ade,ume,age,ude,uge¦2iar:edeia¦2çar:alca¦2oer:rrói¦2ulir:apole¦3ir:rige,inge,cide,pete,unde,xige,pede,lode,inde,arce,dige,side,umbe,anze,lige¦4ir:ivide,flete,pande,olide¦5ir:iverte,dverte",
        "ex": "vai:ir¦é:ser¦água:aguar¦1em:vir¦1ê:ver,ler¦3á:estar¦2m:ter¦1á:dar,haver¦3e:ouvir,punir,pedir,medir¦2ê:crer¦1oge:fugir¦1ome:sumir¦4ê:prover,prever¦4e:servir,curtir,pungir¦3ê:rever¦2eia:odiar¦3ém:deter,reter¦1ule:polir¦2e:unir,agir¦1ói:roer,moer¦3eia:mediar¦4ome:consumir¦2úda:saudar¦2ca:coçar,roçar,laçar¦2ém:ater¦2ege:frigir¦3ca:calçar,forçar,atiçar¦1õe:pôr¦1ole:bulir¦1urte:sortir¦1usca:moscar"
      },
      "firstPlural": {
        "fwd": "2camos:tiçar",
        "both": "3camos:braçar¦2ímos:buir,ruir,tuir,nuir,luir,suir¦1ímos:air¦coitamos:çoitar¦mos:r",
        "rev": "ir:ímos¦2çar:alcamos",
        "ex": "vamos:ir¦1omos:ser,pôr¦2camos:coçar,roçar,laçar¦4ímos:arguir¦3camos:calçar,forçar,atiçar"
      },
      "secondPlural": {
        "fwd": "ondes:ôr¦2cais:tiçar",
        "both": "5des:trever¦5ndes:treter¦4des:tever¦4s:nguir,eguir¦3des:eler,crer,rrir¦3s:quir,rcir,ssir¦3ndes:ster,bter,nter¦2s:hir,zir,bir,pir,nir,lir,rir,dir,gir,mir,tir¦2ndes:vir¦1ís:uir,air¦1ndes:or¦coitais:çoitar¦is:r",
        "rev": "er:ois¦r:ndes¦1r:edes,ides¦2r:vis¦2çar:alcais¦3çar:bracais",
        "ex": "1des:ir¦1ois:ser¦2ndes:vir,ter¦2des:ver,rir,ler¦4s:ouvir¦3des:crer¦5des:prover,prever¦5s:servir¦4des:rever¦4ndes:deter,reter¦4cais:abraçar¦2cais:coçar,roçar,laçar¦3ndes:ater¦3cais:calçar,forçar,atiçar¦7des:interver¦1ondes:pôr"
      },
      "thirdPlural": {
        "fwd": "ão:aver¦õem:ôr¦em:ir¦inem:enir¦olem:ulir¦urtem:ortir¦uscam:oscar",
        "both": "5ão:brestar¦5em:trever¦5oem:onstruir¦4em:tever¦4oem:estruir¦4êm:treter,tervir¦3em:eler,crer,rrir¦3eiam:mediar¦3êm:rovir¦2ízam:juizar¦2omem:bsumir,nsumir¦2êm:ster,avir,evir,dvir,bter,nvir,nter¦2eiam:ndiar,nsiar¦1ízam:aizar,eizar¦1úçam:iuçar¦1íscam:aiscar¦1ínam:uinar¦1íliam:biliar¦1odem:cudir¦1íbem:oibir¦1idem:redir¦1únem:eunir¦1iam:ear¦coitam:çoitar¦ólegam:olegar¦irzem:erzir¦ínquem:inquir¦igrem:egrir¦opem:upir¦águam:aguar¦ospem:uspir¦équam:equar¦obem:ubir¦õem:or¦m:r",
        "rev": "ugir:ogem¦olir:ulem¦udar:údam¦1r:eem¦1ir:aem,vêm¦1er:têm¦1enir:vinem¦1igir:regem¦2ar:stão¦2ir:rmem,uvem,brem,stem,prem,ssem,suem,item,luem,utem,rgem,ntem,uzem,nuem,buem,umem,tuem,agem,unem,udem,ruem,trem,imem,ugem,elem,adem,ibem,plem,irem,nhem¦2çar:alcam¦2ulir:apolem¦3ir:artem,rigem,videm,ingem,ferem,cidem,petem,gerem,undem,xigem,eguem,finem,serem,andem,arcem,digem,sidem,pedem,anzem,umbem,ungem¦3çar:bracam¦4ir:fletem,ngolem,inguem,cindem,epolem,fligem,olidem,plodem¦5ir:ivertem,dvertem,reterem,darguem",
        "ex": "vão:ir¦águam:aguar¦1ão:ser,dar,haver¦1êm:vir,ter¦2em:ver,rir,ler,agir,unir¦3ão:estar¦3em:crer,pedir,medir,ferir,parir,gerir¦1ogem:fugir¦1omem:sumir¦5em:prover,prever¦4em:rever,servir,aderir,curtir,despir,arguir¦2eiam:odiar¦3êm:deter,reter¦1ulem:polir¦4cam:abraçar¦3eiam:mediar¦2údam:saudar¦2cam:coçar,roçar,laçar¦2êm:ater,avir¦2egem:frigir¦3cam:calçar,forçar,atiçar¦7em:interver¦1õem:pôr¦1olem:bulir¦1urtem:sortir¦1uscam:moscar"
      }
    },
    "infinitivo": {
      "first": {
        "fwd": ":¦2car:tiçar",
        "both": "3car:braçar¦coitar:çoitar",
        "rev": "2:er,ir,ôr,or¦3:mar,dar,lar,gar,çar,rar,oar,har,sar,jar,par,bar,zar,nar,iar,uar,var,ear,xar,far¦4:star,ntar,icar,ocar,rcar,atar,utar,ltar,ptar,etar,otar,scar,rtar,ncar,ecar,ctar,ucar,xtar¦5:eitar,ditar,vitar,sitar,tacar,litar,ritar,mitar,citar,pitar,lacar,gitar¦2çar:alcar",
        "ex": "2:ir¦3:dar¦4:atar¦5:citar,tacar,fitar,sacar,ditar¦6:quitar¦7:habitar,atracar¦8:inculcar¦2car:coçar,roçar,laçar¦3car:calçar,forçar,atiçar"
      },
      "second": {
        "fwd": "es:¦2cares:tiçar",
        "both": "3cares:braçar¦2íres:buir,ruir,tuir,nuir,luir,suir¦1íres:air¦coitares:çoitar",
        "rev": "2:eres,ires,ores¦3:mares,dares,lares,gares,çares,rares,oares,hares,sares,jares,pares,bares,zares,nares,iares,uares,vares,eares,xares,fares¦4:stares,ntares,icares,ocares,rcares,atares,utares,ltares,ptares,etares,otares,scares,rtares,ncares,ecares,ctares,ucares,xtares¦5:eitares,ditares,vitares,sitares,tacares,litares,ritares,mitares,citares,pitares,lacares,gitares¦ir:íres¦2çar:alcares",
        "ex": "1ores:pôr¦2cares:coçar,roçar,laçar¦4íres:arguir¦3cares:calçar,forçar,atiçar¦2íres:ruir,puir¦2es:ir¦3es:dar¦5es:citar,tacar,fitar,sacar,ditar¦7es:habitar,atracar¦4es:atar¦6es:quitar¦8es:inculcar"
      },
      "third": {
        "fwd": ":¦2car:tiçar",
        "both": "3car:braçar¦coitar:çoitar",
        "rev": "2:er,ir,ôr,or¦3:mar,dar,lar,gar,çar,rar,oar,har,sar,jar,par,bar,zar,nar,iar,uar,var,ear,xar,far¦4:star,ntar,icar,ocar,rcar,atar,utar,ltar,ptar,etar,otar,scar,rtar,ncar,ecar,ctar,ucar,xtar¦5:eitar,ditar,vitar,sitar,tacar,litar,ritar,mitar,citar,pitar,lacar,gitar¦2çar:alcar",
        "ex": "2:ir¦3:dar¦4:atar¦5:citar,tacar,fitar,sacar,ditar¦6:quitar¦7:habitar,atracar¦8:inculcar¦2car:coçar,roçar,laçar¦3car:calçar,forçar,atiçar"
      },
      "firstPlural": {
        "fwd": "mos:¦2carmos:tiçar",
        "both": "3carmos:braçar¦coitarmos:çoitar",
        "rev": "2:ermos,irmos,ormos¦3:marmos,darmos,larmos,garmos,çarmos,rarmos,oarmos,harmos,sarmos,jarmos,parmos,barmos,zarmos,narmos,iarmos,uarmos,varmos,earmos,xarmos,farmos¦4:starmos,ntarmos,icarmos,ocarmos,rcarmos,atarmos,utarmos,ltarmos,ptarmos,etarmos,otarmos,scarmos,rtarmos,ncarmos,ecarmos,ctarmos,ucarmos,xtarmos¦5:eitarmos,ditarmos,vitarmos,sitarmos,tacarmos,litarmos,ritarmos,mitarmos,citarmos,pitarmos,lacarmos,gitarmos¦2çar:alcarmos",
        "ex": "1ormos:pôr¦2carmos:coçar,roçar,laçar¦3carmos:calçar,forçar,atiçar¦2mos:ir¦3mos:dar¦5mos:citar,tacar,fitar,sacar,ditar¦7mos:habitar,atracar¦4mos:atar¦6mos:quitar¦8mos:inculcar"
      },
      "secondPlural": {
        "fwd": "des:¦2cardes:tiçar",
        "both": "3cardes:braçar¦coitardes:çoitar",
        "rev": "2:erdes,irdes,ordes¦3:mardes,dardes,lardes,gardes,çardes,rardes,oardes,hardes,sardes,jardes,pardes,bardes,zardes,nardes,iardes,uardes,vardes,eardes,xardes,fardes¦4:stardes,ntardes,icardes,ocardes,rcardes,atardes,utardes,ltardes,ptardes,etardes,otardes,scardes,rtardes,ncardes,ecardes,ctardes,ucardes,xtardes¦5:eitardes,ditardes,vitardes,sitardes,tacardes,litardes,ritardes,mitardes,citardes,pitardes,lacardes,gitardes¦2çar:alcardes",
        "ex": "1ordes:pôr¦2cardes:coçar,roçar,laçar¦3cardes:calçar,forçar,atiçar¦2des:ir¦3des:dar¦5des:citar,tacar,fitar,sacar,ditar¦7des:habitar,atracar¦4des:atar¦6des:quitar¦8des:inculcar"
      },
      "thirdPlural": {
        "fwd": "em:¦2carem:tiçar",
        "both": "3carem:braçar¦2írem:buir,ruir,tuir,nuir,luir,suir¦1írem:air¦coitarem:çoitar",
        "rev": "2:erem,irem,orem¦3:marem,darem,larem,garem,çarem,rarem,oarem,harem,sarem,jarem,parem,barem,zarem,narem,iarem,uarem,varem,earem,xarem,farem¦4:starem,ntarem,icarem,ocarem,rcarem,atarem,utarem,ltarem,ptarem,etarem,otarem,scarem,rtarem,ncarem,ecarem,ctarem,ucarem,xtarem¦5:eitarem,ditarem,vitarem,sitarem,tacarem,litarem,ritarem,mitarem,citarem,pitarem,lacarem,gitarem¦ir:írem¦2çar:alcarem",
        "ex": "1orem:pôr¦2carem:coçar,roçar,laçar¦4írem:arguir¦3carem:calçar,forçar,atiçar¦2írem:ruir,puir¦2em:ir¦3em:dar¦5em:citar,tacar,fitar,sacar,ditar¦7em:habitar,atracar¦4em:atar¦6em:quitar¦8em:inculcar"
      }
    },
    "subjPresent": {
      "first": {
        "fwd": "onha:ôr¦ja:gir,ger¦iga:eguir¦ira:erir¦ita:etir¦a:uer¦ça:cir¦urta:ortir¦coite:çoitar¦1ja:aver¦1a:mer,rer,ber,her,per,ser,hir¦1ga:izer¦1e:iar¦2a:itir,ndir,rter,mbir,ulir,idir,irir,rdir¦2eie:nsiar¦2ça:pedir,medir¦2que:inçar¦3e:iguar,nquar¦3a:arrir¦4e:inguar,coitar",
        "both": "5a:ementir,flectir,mplodir,mprazer¦5ja:terver¦5eja:brestar¦5o:xplodir¦5nha:treter¦4a:ebolir,inibir,opelir,xceler,clodir,rreter,epolir,rantir,orrir¦4e:foitar,noitar¦4ue:elegar¦4inta:ressentir¦4ja:tever¦4eie:cendiar¦4ira:equerer¦4enha:tervir¦3ue:pegar,iegar,megar,negar,fegar,segar,vegar,regar,hegar¦3a:arzir,abrir,rodir,orver,anzir,enzer,xibir,rguir,order,meter,rever,artir¦3e:bitar,titar,vitar,ejuar,pitar,uitar,gitar,litar,citar,sitar,mitar,ditar,ritar,eitar¦3que:emoçar,troçar,braçar¦3ida:egredir,sgredir¦3ia:crer¦3eie:mediar¦3nha:ster,bter,nter¦3enha:rovir¦2a:lpir,orir,cuir,urir,alir,plir,adir,ater,upir,imir,ozer,trir,over,udir,buir,nguir,tuir,lver,nuir,uzir,eder,utir,luir,ruir,stir,suir,umir,prir,ubir,iver,nder,air¦2e:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,tuar,etar,rtar,utar,atar,nuar,ltar,star,ntar¦2úle:baular¦2íze:juizar¦2inta:smentir,nsentir¦2ue:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar¦2ila:mpelir,xpelir¦2íne:ruinar¦2enha:avir,evir,dvir,nvir¦2ha:aler¦2ca:erder¦1úde:iudar¦1irva:servir¦1ça:uvir,azer¦1íze:aizar,eizar¦1úce:iuçar¦1ísque:aiscar¦1e:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar¦1irja:vergir¦1ira:arir¦1íba:oibir¦1a:oer,nir,xer¦1ula:golir¦1úna:eunir¦1ie:ear¦1nha:or¦1iba:aber¦1ssa:oder¦ólegue:olegar¦irza:erzir¦ínqua:inquir¦igra:egrir¦águe:aguar¦ispa:espir¦ubra:obrir¦éque:equar¦irta:ertir¦ussa:ossir¦ça:cer¦ce:çar¦que:car¦urma:ormir",
        "rev": "ar:ê¦entir:inta¦ervir:irva¦udar:úde¦iliar:ílie¦ectir:icta¦1rer:eira¦1zer:aga¦1r:eia¦1gir:ija,uja,lja¦1eguir:siga¦1erir:fira,dira,gira,sira,tira¦1etir:pita,lita¦1edir:rida¦1enir:vina¦1estir:vista¦1ar:te¦1ir:venha¦2ar:steja,vie,pie,oie,fie,cie,rie,gie,die,aie,tie,bie,sie,zie,nie,uie,mie,xie¦2er:oma,rra,eba,cha,fra,eta,ema,mpa,osa¦2gir:inja,urja,eaja,erja,oaja,unja,arja¦2r:veja,tenha¦2ger:leja,anja,reja,onja¦2zer:diga¦2cir:arça¦2uer:rga¦3ir:vida,cida,uira,unda,uspa,mita,anda,inda,sida,lida,unha,umba,bula,reda,urza,fera,arda¦3ger:oteja¦3er:olha,amba,erva,erta,uera,rela,essa¦3ar:ilie,plie,alie,olie¦3dir:xpeça¦4dir:espeça,impeça,esmeça¦4gir:teraja¦4ar:zigue,relie¦4ir:apula,senta,lanha¦4çar:trinque¦4ger:sterja¦5ar:pinque,ginque,anigue",
        "ex": "vá:ir¦águe:aguar¦2ja:ser,ver,haver,reger,viger¦1enha:vir¦3eja:estar¦2nha:ter¦1ê:dar¦3ira:querer¦3ga:trazer¦2a:rir¦2ia:ler¦1inta:sentir,mentir¦2ça:pedir,medir¦3a:abrir,dever,meter,jazer,arder,bulir,urdir¦3ia:crer¦3ue:pegar,negar,regar,cegar,legar,segar¦5ja:prover,prever¦1ista:vestir¦1irva:servir¦4ja:rever¦2eie:odiar¦4nha:deter,reter¦1ula:polir¦4a:curtir,cuspir,ferver,inibir,treler,zurzir,condir,surdir,garrir¦2e:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar¦3ida:agredir¦3eie:mediar,ansiar¦4ina:prevenir¦3ista:investir,revestir¦2úde:saudar¦2que:coçar,roçar,laçar¦3nha:ater¦5ida:progredir¦3que:calçar,forçar,atiçar¦3e:citar,fitar,ditar,pitar,eguar,aliar,chiar¦4ue:alegar¦3ílie:mobiliar¦3inta:assentir¦7ja:entrever¦2enha:avir¦4ia:reler¦1usque:moscar¦4inta:ressentir¦7a:dissentir¦1a:rer¦9a:retrogredir¦8a:correferir¦2icta:flectir¦4e:poitar¦1onha:pôr¦2ga:dizer¦1ja:agir¦1iga:seguir¦1ira:ferir,gerir¦4ça:impedir¦7e:averiguar¦1urta:sortir¦5e:minguar¦1coite:açoitar"
      },
      "second": {
        "fwd": "onhas:ôr¦jas:gir,ger¦igas:eguir¦iras:erir¦itas:etir¦as:uer¦ças:cir¦urtas:ortir¦coites:çoitar¦1jas:aver¦1as:mer,rer,ber,her,per,ser,hir¦1gas:izer¦1es:iar¦2as:itir,ndir,rter,mbir,ulir,idir,irir,rdir¦2eies:nsiar¦2ças:pedir,medir¦2ques:inçar¦3es:iguar,nquar¦3as:arrir¦4es:inguar,coitar",
        "both": "5as:ementir,flectir,mplodir,mprazer¦5jas:terver¦5ejas:brestar¦5es:xplodir¦5nhas:treter¦4as:ebolir,inibir,opelir,xceler,clodir,rreter,epolir,rantir,orrir¦4es:foitar,noitar¦4ues:elegar¦4intas:ressentir¦4jas:tever¦4eies:cendiar¦4iras:equerer¦4enhas:tervir¦3ues:pegar,iegar,megar,negar,fegar,segar,vegar,regar,hegar¦3as:arzir,abrir,rodir,orver,anzir,enzer,xibir,rguir,order,meter,rever,artir¦3es:bitar,titar,vitar,ejuar,pitar,uitar,gitar,litar,citar,sitar,mitar,ditar,ritar,eitar¦3ques:emoçar,troçar,braçar¦3idas:egredir,sgredir¦3ias:crer¦3eies:mediar¦3nhas:ster,bter,nter¦3enhas:rovir¦2as:lpir,orir,cuir,urir,alir,plir,adir,ater,upir,imir,ozer,trir,over,udir,buir,nguir,tuir,lver,nuir,uzir,eder,utir,luir,ruir,stir,suir,umir,prir,ubir,iver,nder,air¦2es:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,tuar,etar,rtar,utar,atar,nuar,ltar,star,ntar¦2úles:baular¦2ízes:juizar¦2intas:smentir,nsentir¦2ues:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar¦2ilas:mpelir,xpelir¦2ínes:ruinar¦2enhas:avir,evir,dvir,nvir¦2has:aler¦2cas:erder¦1údes:iudar¦1irvas:servir¦1ças:uvir,azer¦1ízes:aizar,eizar¦1úces:iuçar¦1ísques:aiscar¦1es:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar¦1irjas:vergir¦1iras:arir¦1íbas:oibir¦1as:oer,nir,xer¦1ulas:golir¦1únas:eunir¦1ies:ear¦1nhas:or¦1ibas:aber¦1ssas:oder¦ólegues:olegar¦irzas:erzir¦ínquas:inquir¦igras:egrir¦águes:aguar¦ispas:espir¦ubras:obrir¦éques:equar¦irtas:ertir¦ussas:ossir¦ças:cer¦ces:çar¦ques:car¦urmas:ormir",
        "rev": "ar:ês¦entir:intas¦ervir:irvas¦udar:údes¦iliar:ílies¦ectir:ictas¦1rer:eiras¦1zer:agas¦1r:eias¦1gir:ijas,ujas,ljas¦1eguir:sigas¦1erir:firas,diras,giras,siras,tiras¦1etir:pitas,litas¦1edir:ridas¦1enir:vinas¦1estir:vistas¦1ar:tes¦1ir:venhas¦2ar:stejas,vies,pies,oies,fies,cies,ries,gies,dies,aies,ties,bies,sies,zies,nies,uies,mies,xies¦2er:omas,rras,ebas,chas,fras,etas,emas,mpas,osas¦2gir:injas,urjas,eajas,erjas,oajas,unjas,arjas¦2r:vejas,tenhas¦2ger:lejas,anjas,rejas,onjas¦2zer:digas¦2cir:arças¦2uer:rgas¦3ir:vidas,cidas,uiras,undas,uspas,mitas,andas,indas,sidas,lidas,unhas,umbas,bulas,redas,urzas,feras,ardas¦3ger:otejas¦3er:olhas,ambas,ervas,ertas,ueras,relas,essas¦3ar:ilies,plies,alies,olies¦3dir:xpeças¦4dir:espeças,impeças,esmeças¦4gir:terajas¦4ar:zigues,relies¦4ir:apulas,sentas,lanhas¦4çar:trinques¦4ger:sterjas¦5ar:pinques,ginques,anigues",
        "ex": "vás:ir¦águes:aguar¦2jas:ser,ver,haver,reger,viger¦1enhas:vir¦3ejas:estar¦2nhas:ter¦1ês:dar¦3iras:querer¦3gas:trazer¦2as:rir¦2ias:ler¦1intas:sentir,mentir¦2ças:pedir,medir¦3as:abrir,dever,meter,jazer,arder,bulir,urdir¦3ias:crer¦3ues:pegar,negar,regar,cegar,legar,segar¦5jas:prover,prever¦1istas:vestir¦1irvas:servir¦4jas:rever¦2eies:odiar¦4nhas:deter,reter¦1ulas:polir¦4as:curtir,cuspir,ferver,inibir,treler,zurzir,condir,surdir,garrir¦2es:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar¦3idas:agredir¦3eies:mediar,ansiar¦4inas:prevenir¦3istas:investir,revestir¦2údes:saudar¦2ques:coçar,roçar,laçar¦3nhas:ater¦5idas:progredir¦3ques:calçar,forçar,atiçar¦3es:citar,fitar,ditar,pitar,eguar,aliar,chiar¦4ues:alegar¦3ílies:mobiliar¦3intas:assentir¦7jas:entrever¦2enhas:avir¦4ias:reler¦1usques:moscar¦4intas:ressentir¦7as:dissentir¦1as:rer¦9as:retrogredir¦8as:correferir¦2ictas:flectir¦4es:poitar¦1onhas:pôr¦2gas:dizer¦1jas:agir¦1igas:seguir¦1iras:ferir,gerir¦4ças:impedir¦7es:averiguar¦1urtas:sortir¦5es:minguar¦1coites:açoitar"
      },
      "third": {
        "fwd": "onha:ôr¦ja:gir,ger¦iga:eguir¦ira:erir¦ita:etir¦a:uer¦ça:cir¦urta:ortir¦coite:çoitar¦1ja:aver¦1a:mer,rer,ber,her,per,ser,hir¦1ga:izer¦1e:iar¦2a:itir,ndir,rter,mbir,ulir,idir,irir,rdir¦2eie:nsiar¦2ça:pedir,medir¦2que:inçar¦3e:iguar,nquar¦3a:arrir¦4e:inguar,coitar",
        "both": "5a:ementir,flectir,mplodir,mprazer¦5ja:terver¦5eja:brestar¦5e:xplodir¦5nha:treter¦4a:ebolir,inibir,opelir,xceler,clodir,rreter,epolir,rantir,orrir¦4e:foitar,noitar¦4ue:elegar¦4inta:ressentir¦4ja:tever¦4eie:cendiar¦4ira:equerer¦4enha:tervir¦3ue:pegar,iegar,megar,negar,fegar,segar,vegar,regar,hegar¦3a:arzir,abrir,rodir,orver,anzir,enzer,xibir,rguir,order,meter,rever,artir¦3e:bitar,titar,vitar,ejuar,pitar,uitar,gitar,litar,citar,sitar,mitar,ditar,ritar,eitar¦3que:emoçar,troçar,braçar¦3ida:egredir,sgredir¦3ia:crer¦3eie:mediar¦3nha:ster,bter,nter¦3enha:rovir¦2a:lpir,orir,cuir,urir,alir,plir,adir,ater,upir,imir,ozer,trir,over,udir,buir,nguir,tuir,lver,nuir,uzir,eder,utir,luir,ruir,stir,suir,umir,prir,ubir,iver,nder,air¦2e:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,tuar,etar,rtar,utar,atar,nuar,ltar,star,ntar¦2úle:baular¦2íze:juizar¦2inta:smentir,nsentir¦2ue:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar¦2ila:mpelir,xpelir¦2íne:ruinar¦2enha:avir,evir,dvir,nvir¦2ha:aler¦2ca:erder¦1úde:iudar¦1irva:servir¦1ça:uvir,azer¦1íze:aizar,eizar¦1úce:iuçar¦1ísque:aiscar¦1e:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar¦1irja:vergir¦1ira:arir¦1íba:oibir¦1a:oer,nir,xer¦1ula:golir¦1úna:eunir¦1ie:ear¦1nha:or¦1iba:aber¦1ssa:oder¦ólegue:olegar¦irza:erzir¦ínqua:inquir¦igra:egrir¦águe:aguar¦ispa:espir¦ubra:obrir¦éque:equar¦irta:ertir¦ussa:ossir¦ça:cer¦ce:çar¦que:car¦urma:ormir",
        "rev": "ar:ê¦entir:inta¦ervir:irva¦udar:úde¦iliar:ílie¦ectir:icta¦1rer:eira¦1zer:aga¦1r:eia¦1gir:ija,uja,lja¦1eguir:siga¦1erir:fira,dira,gira,sira,tira¦1etir:pita,lita¦1edir:rida¦1enir:vina¦1estir:vista¦1ar:te¦1ir:venha¦2ar:steja,vie,pie,oie,fie,cie,rie,gie,die,aie,tie,bie,sie,zie,nie,uie,mie,xie¦2er:oma,rra,eba,cha,fra,eta,ema,mpa,osa¦2gir:inja,urja,eaja,erja,oaja,unja,arja¦2r:veja,tenha¦2ger:leja,anja,reja,onja¦2zer:diga¦2cir:arça¦2uer:rga¦3ir:vida,cida,uira,unda,uspa,mita,anda,inda,sida,lida,unha,umba,bula,reda,urza,fera,arda¦3ger:oteja¦3er:olha,amba,erva,erta,uera,rela,essa¦3ar:ilie,plie,alie,olie¦3dir:xpeça¦4dir:espeça,impeça,esmeça¦4gir:teraja¦4ar:zigue,relie¦4ir:apula,senta,lanha¦4çar:trinque¦4ger:sterja¦5ar:pinque,ginque,anigue",
        "ex": "vá:ir¦águe:aguar¦2ja:ser,ver,haver,reger,viger¦1enha:vir¦3eja:estar¦2nha:ter¦1ê:dar¦3ira:querer¦3ga:trazer¦2a:rir¦2ia:ler¦1inta:sentir,mentir¦2ça:pedir,medir¦3a:abrir,dever,meter,jazer,arder,bulir,urdir¦3ia:crer¦3ue:pegar,negar,regar,cegar,legar,segar¦5ja:prover,prever¦1ista:vestir¦1irva:servir¦4ja:rever¦2eie:odiar¦4nha:deter,reter¦1ula:polir¦4a:curtir,cuspir,ferver,inibir,treler,zurzir,condir,surdir,garrir¦2e:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar¦3ida:agredir¦3eie:mediar,ansiar¦4ina:prevenir¦3ista:investir,revestir¦2úde:saudar¦2que:coçar,roçar,laçar¦3nha:ater¦5ida:progredir¦3que:calçar,forçar,atiçar¦3e:citar,fitar,ditar,pitar,eguar,aliar,chiar¦4ue:alegar¦3ílie:mobiliar¦3inta:assentir¦7ja:entrever¦2enha:avir¦4ia:reler¦1usque:moscar¦4inta:ressentir¦7a:dissentir¦1a:rer¦9a:retrogredir¦8a:correferir¦2icta:flectir¦4e:poitar¦1onha:pôr¦2ga:dizer¦1ja:agir¦1iga:seguir¦1ira:ferir,gerir¦4ça:impedir¦7e:averiguar¦1urta:sortir¦5e:minguar¦1coite:açoitar"
      },
      "firstPlural": {
        "fwd": "onhamos:ôr¦jamos:gir,ger¦igamos:eguir¦iramos:erir¦itamos:etir¦amos:uer¦çamos:cir¦urtamos:ortir¦coitemos:çoitar¦1amos:mer,rer,ber,bir,her,per,ser,hir¦1gamos:izer¦2amos:idir,itir,ndir,nzer,ulir,rter,irir,rdir¦2çamos:pedir,medir¦2quemos:inçar¦3amos:urtir,arrir",
        "both": "5amos:flectir,mplodir,mprazer¦5ejamos:brestar¦5nhamos:treter¦4amos:morder,opelir,xceler,clodir,inquir,rreter,orrir¦4nhamos:uster,bster¦4jamos:tever¦4iramos:equerer¦4enhamos:tervir¦3amos:scuir,bolir,arzir,urzir,abrir,rodir,anzir,polir,rguir,meter,uspir,antir,ssuir,artir¦3quemos:emoçar,troçar¦3intamos:essentir,onsentir¦3idamos:egredir,sgredir¦3iamos:crer¦3inamos:revenir¦3enhamos:rovir¦3nhamos:nter¦2amos:lpir,orir,urir,alir,plir,upir,imir,eder,udir,trir,ater,buir,nguir,tuir,adir,nuir,uzir,ruir,utir,luir,umir,prir,stir,nder,air¦2intamos:smentir¦2istamos:evestir¦2ilamos:mpelir,xpelir¦2enhamos:avir,evir,dvir,nvir¦2hamos:aler¦2camos:erder¦1irvamos:servir¦1irjamos:vergir¦1iramos:arir¦1amos:oer,nir,xer,ver¦1ulamos:golir¦1nhamos:or¦1uemos:gar¦1çamos:uvir,azer¦1ssamos:oder¦irzamos:erzir¦igramos:egrir¦ispamos:espir¦ubramos:obrir¦irtamos:ertir¦ussamos:ossir¦çamos:cer¦cemos:çar¦quemos:car¦urmamos:ormir¦emos:ar",
        "rev": "entir:intamos¦ervir:irvamos¦ectir:ictamos¦1rer:eiramos¦1zer:agamos¦1r:eiamos,imos¦1ber:aibamos¦1gir:ijamos,ujamos,ljamos¦1eguir:sigamos¦1erir:firamos,diramos,giramos,siramos,tiramos¦1etir:pitamos,litamos¦1edir:ridamos¦1estir:vistamos¦1ir:venhamos¦2ar:stejamos¦2er:omamos,rramos,ebamos,framos,emamos,chamos,azamos,mpamos,osamos¦2gir:injamos,urjamos,eajamos,erjamos,oajamos,unjamos,arjamos¦2r:vejamos,tenhamos¦2ger:lejamos,anjamos,rejamos¦2zer:digamos¦2cir:arçamos¦2uer:rgamos¦3ir:vidamos,cidamos,uiramos,undamos,oibamos,andamos,mitamos,umbamos,indamos,pulamos,sidamos,unhamos,entamos,bulamos,lidamos,redamos,nibamos,urdamos,anhamos¦3ger:otejamos¦3er:olhamos,ordamos,ambamos,ertamos,enzamos¦3çar:braquemos¦3dir:xpeçamos,smeçamos¦4dir:espeçamos,impeçamos¦4gir:terajamos¦4er:queramos¦4ir:cardamos,eferamos¦4çar:trinquemos¦5er:bressamos",
        "ex": "vamos:ir¦2jamos:ser,ver,haver,reger,viger¦1enhamos:vir¦3ejamos:estar¦2nhamos:ter¦3iramos:querer¦3gamos:trazer¦2amos:rir¦2iamos:ler¦2ibamos:saber,caber¦1intamos:sentir,mentir¦2çamos:pedir,medir¦3amos:abrir,meter,jazer,cozer,arder,subir,bulir,urdir¦3iamos:crer¦5jamos:prover,prever¦1istamos:vestir¦1irvamos:servir¦4jamos:rever¦4nhamos:deter,reter,obter¦1ulamos:polir¦4quemos:abraçar¦4amos:morder,treler,curtir,exibir,condir,garrir¦3idamos:agredir¦7mos:explodir¦3istamos:investir¦2quemos:coçar,roçar,laçar¦3nhamos:ater¦5idamos:progredir¦3quemos:calçar,forçar,atiçar¦3intamos:assentir¦7jamos:entrever,interver¦2enhamos:avir¦4iamos:reler¦7amos:dissentir¦1amos:rer¦9amos:retrogredir¦8amos:correferir¦6amos:fementir¦2ictamos:flectir¦1onhamos:pôr¦2gamos:dizer¦1jamos:agir¦1igamos:seguir¦1iramos:ferir,gerir¦4çamos:impedir¦1urtamos:sortir¦1coitemos:açoitar¦3jamos:monger¦6jamos:absterger"
      },
      "secondPlural": {
        "fwd": "onhais:ôr¦jais:gir,ger¦igais:eguir¦irais:erir¦itais:etir¦ais:uer¦çais:cir¦urtais:ortir¦coiteis:çoitar¦1ais:mer,rer,ber,bir,her,per,ser,hir¦1gais:izer¦2ais:idir,itir,ndir,nzer,ulir,rter,irir,rdir¦2çais:pedir,medir¦2queis:inçar¦3ais:urtir,arrir",
        "both": "5ais:flectir,mplodir,mprazer¦5ejais:brestar¦5nhais:treter¦4ais:morder,opelir,xceler,clodir,inquir,rreter,orrir¦4nhais:uster,bster¦4jais:tever¦4irais:equerer¦4enhais:tervir¦3ais:scuir,bolir,arzir,urzir,abrir,rodir,anzir,polir,rguir,meter,uspir,antir,ssuir,artir¦3queis:emoçar,troçar¦3intais:essentir,onsentir¦3idais:egredir,sgredir¦3iais:crer¦3inais:revenir¦3enhais:rovir¦3nhais:nter¦2ais:lpir,orir,urir,alir,plir,upir,imir,eder,udir,trir,ater,buir,nguir,tuir,adir,nuir,uzir,ruir,utir,luir,umir,prir,stir,nder,air¦2intais:smentir¦2istais:evestir¦2ilais:mpelir,xpelir¦2enhais:avir,evir,dvir,nvir¦2hais:aler¦2cais:erder¦1irvais:servir¦1irjais:vergir¦1irais:arir¦1ais:oer,nir,xer,ver¦1ulais:golir¦1nhais:or¦1ueis:gar¦1çais:uvir,azer¦1ssais:oder¦irzais:erzir¦igrais:egrir¦ispais:espir¦ubrais:obrir¦irtais:ertir¦ussais:ossir¦çais:cer¦ceis:çar¦queis:car¦urmais:ormir¦eis:ar",
        "rev": "entir:intais¦ervir:irvais¦ectir:ictais¦1rer:eirais¦1zer:agais¦1r:eiais¦1ber:aibais¦1gir:ijais,ujais,ljais¦1eguir:sigais¦1erir:firais,dirais,girais,sirais,tirais¦1etir:pitais,litais¦1edir:ridais¦1estir:vistais¦1ir:venhais¦2ar:stejais¦2er:omais,rrais,ebais,frais,emais,etais,azais,mpais,osais,chais¦2gir:injais,urjais,eajais,rajais,erjais,oajais,unjais,arjais¦2r:vejais,tenhais¦2ger:lejais,anjais,rejais¦2zer:digais¦2cir:arçais¦2uer:rgais¦3ir:vidais,cidais,uirais,undais,oibais,andais,mitais,umbais,indais,pulais,sidais,unhais,entais,bulais,lidais,redais,nibais,urdais,anhais¦3ger:otejais¦3er:olhais,ordais,ambais,ertais,enzais¦3çar:braqueis¦3dir:xpeçais,smeçais¦4dir:espeçais,impeçais¦4r:lodis¦4er:querais¦4ir:cardais,eferais¦4çar:trinqueis¦5er:bressais",
        "ex": "vades:ir¦2jais:ser,ver,haver,reger,viger¦1enhais:vir¦3ejais:estar¦2nhais:ter¦3irais:querer¦3gais:trazer¦2ais:rir¦2iais:ler¦2ibais:saber,caber¦1intais:sentir,mentir¦2çais:pedir,medir¦3ais:abrir,meter,jazer,cozer,arder,subir,bulir,urdir¦3iais:crer¦5jais:prover,prever¦1istais:vestir¦1irvais:servir¦4jais:rever¦4nhais:deter,reter,obter¦1ulais:polir¦4queis:abraçar¦4ais:morder,treler,curtir,exibir,condir,garrir¦3idais:agredir¦7s:explodir¦3istais:investir¦2queis:coçar,roçar,laçar¦3nhais:ater¦5idais:progredir¦3queis:calçar,forçar,atiçar¦3intais:assentir¦7jais:entrever,interver¦2enhais:avir¦4iais:reler¦7ais:dissentir¦1ais:rer¦9ais:retrogredir¦8ais:correferir¦6ais:fementir¦2ictais:flectir¦1onhais:pôr¦2gais:dizer¦1jais:agir¦1igais:seguir¦1irais:ferir,gerir¦4çais:impedir¦1urtais:sortir¦1coiteis:açoitar¦3jais:monger¦6jais:absterger"
      },
      "thirdPlural": {
        "fwd": "onham:ôr¦jam:gir,ger¦igam:eguir¦iram:erir¦itam:etir¦am:uer¦çam:cir¦urtam:ortir¦coitem:çoitar¦1jam:aver¦1am:mer,rer,ber,her,per,ser,hir¦1gam:izer¦1em:iar¦2am:itir,ndir,rter,mbir,ulir,idir,irir,rdir¦2eiem:nsiar¦2çam:pedir,medir¦2quem:inçar¦3em:iguar,nquar¦3am:arrir¦4em:inguar,coitar",
        "both": "5am:ementir,flectir,mplodir,mprazer¦5jam:terver¦5ejam:brestar¦5em:xplodir¦5nham:treter¦4am:ebolir,inibir,opelir,xceler,clodir,rreter,epolir,rantir,orrir¦4em:foitar,noitar¦4uem:elegar¦4intam:ressentir¦4jam:tever¦4eiem:cendiar¦4iram:equerer¦4enham:tervir¦3uem:pegar,iegar,megar,negar,fegar,segar,vegar,regar,hegar¦3am:arzir,abrir,rodir,orver,anzir,enzer,xibir,rguir,order,meter,rever,artir¦3em:bitar,titar,vitar,ejuar,pitar,uitar,gitar,litar,citar,sitar,mitar,ditar,ritar,eitar¦3quem:emoçar,troçar,braçar¦3idam:egredir,sgredir¦3iam:crer¦3eiem:mediar¦3nham:ster,bter,nter¦3enham:rovir¦2am:lpir,orir,cuir,urir,alir,plir,adir,ater,upir,imir,ozer,trir,over,udir,buir,nguir,tuir,lver,nuir,uzir,eder,utir,luir,ruir,stir,suir,umir,prir,ubir,iver,nder,air¦2em:fuar,ruar,suar,duar,muar,xtar,cuar,ptar,ctar,otar,tuar,etar,rtar,utar,atar,nuar,ltar,star,ntar¦2úlem:baular¦2ízem:juizar¦2intam:smentir,nsentir¦2uem:lgar,ngar,sgar,rgar,agar,igar,ugar,ogar¦2ilam:mpelir,xpelir¦2ínem:ruinar¦2enham:avir,evir,dvir,nvir¦2ham:aler¦2cam:erder¦1údem:iudar¦1irvam:servir¦1çam:uvir,azer¦1ízem:aizar,eizar¦1úcem:iuçar¦1ísquem:aiscar¦1em:far,xar,nar,zar,bar,par,var,har,oar,jar,mar,rar,sar,dar,lar¦1irjam:vergir¦1iram:arir¦1íbam:oibir¦1am:oer,nir,xer¦1ulam:golir¦1únam:eunir¦1iem:ear¦1nham:or¦1ibam:aber¦1ssam:oder¦óleguem:olegar¦irzam:erzir¦ínquam:inquir¦igram:egrir¦águem:aguar¦ispam:espir¦ubram:obrir¦équem:equar¦irtam:ertir¦ussam:ossir¦çam:cer¦cem:çar¦quem:car¦urmam:ormir",
        "rev": "ar:eem¦entir:intam¦ervir:irvam¦udar:údem¦iliar:íliem¦ectir:ictam¦1rer:eiram¦1zer:agam¦1r:eiam¦1gir:ijam,ujam,ljam¦1eguir:sigam¦1erir:firam,diram,giram,siram,tiram¦1etir:pitam,litam¦1edir:ridam¦1enir:vinam¦1estir:vistam¦1ar:tem¦1ir:venham¦2ar:stejam,viem,piem,oiem,fiem,ciem,riem,giem,diem,aiem,tiem,biem,siem,ziem,niem,uiem,miem,xiem¦2er:omam,rram,ebam,cham,fram,etam,emam,mpam,osam¦2gir:injam,urjam,eajam,erjam,oajam,unjam,arjam¦2r:vejam,tenham¦2ger:lejam,anjam,rejam,onjam¦2zer:digam¦2cir:arçam¦2uer:rgam¦3ir:vidam,cidam,uiram,undam,uspam,mitam,andam,indam,sidam,lidam,unham,umbam,bulam,redam,urzam,feram,ardam¦3ger:otejam¦3er:olham,ambam,ervam,ertam,ueram,relam,essam¦3ar:iliem,pliem,aliem,oliem¦3dir:xpeçam¦4dir:espeçam,impeçam,esmeçam¦4gir:terajam¦4ar:ziguem,reliem¦4ir:apulam,sentam,lanham¦4çar:trinquem¦4ger:sterjam¦5ar:pinquem,ginquem,aniguem",
        "ex": "vão:ir¦águem:aguar¦2jam:ser,ver,haver,reger,viger¦1enham:vir¦3ejam:estar¦2nham:ter¦1eem:dar¦3iram:querer¦3gam:trazer¦2am:rir¦2iam:ler¦1intam:sentir,mentir¦2çam:pedir,medir¦3am:abrir,dever,meter,jazer,arder,bulir,urdir¦3iam:crer¦3uem:pegar,negar,regar,cegar,legar,segar¦5jam:prover,prever¦1istam:vestir¦1irvam:servir¦4jam:rever¦2eiem:odiar¦4nham:deter,reter¦1ulam:polir¦4am:curtir,cuspir,ferver,inibir,treler,zurzir,condir,surdir,garrir¦2em:suar,atar,ruar,fiar,miar,piar,liar,aiar,siar¦3idam:agredir¦3eiem:mediar,ansiar¦4inam:prevenir¦3istam:investir,revestir¦2údem:saudar¦2quem:coçar,roçar,laçar¦3nham:ater¦5idam:progredir¦3quem:calçar,forçar,atiçar¦3em:citar,fitar,ditar,pitar,eguar,aliar,chiar¦4uem:alegar¦3íliem:mobiliar¦3intam:assentir¦7jam:entrever¦2enham:avir¦4iam:reler¦1usquem:moscar¦4intam:ressentir¦7am:dissentir¦1am:rer¦9am:retrogredir¦8am:correferir¦2ictam:flectir¦4em:poitar¦1onham:pôr¦2gam:dizer¦1jam:agir¦1igam:seguir¦1iram:ferir,gerir¦4çam:impedir¦7em:averiguar¦1urtam:sortir¦5em:minguar¦1coitem:açoitar"
      }
    },
    "subjImperfect": {
      "first": {
        "fwd": "usesse:ôr¦coitasse:çoitar¦2sse:xer,ser¦2ivesse:ster¦2casse:inçar¦3sse:iver¦5sse:coitar",
        "both": "5sse:quitar,ltitar,noitar,rreter¦5ivesse:brestar¦5isse:ntrever¦5esse:tervir¦4sse:pitar,gitar,orver,vitar,litar,sitar,enzer,bitar,ritar,citar,mitar,meter,ditar,eitar,caver,rever¦4isse:terver,ntever¦4esse:rovir¦4ivesse:treter¦3casse:emoçar,troçar¦3sse:xtar,rder,eder,ctar,ater,otar,rter,mber,etar,ptar,rtar,lver,utar,atar,eber,over,ltar,star,nder,ntar¦3esse:evir,avir,dvir,nvir¦3ísse:ssuir¦2ísse:cuir,tuir,buir,nuir,luir,ruir¦2sse:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,sar,var,har,oar,cer,jar,çar,gar,dar,rer,lar,mer,mar¦2ivesse:bter,nter¦1ouvesse:eaver¦1ísse:air¦1ssesse:izer¦1sse:ir¦usesse:or¦oubesse:aber¦udesse:oder¦izesse:azer",
        "rev": "erer:isesse¦ir:ísse¦1r:iesse¦1azer:rouxesse,rouvesse¦2er:evisse,etivesse¦2r:tesse,tasse¦3r:evesse,azesse,ozesse,osesse,exesse¦3çar:bracasse¦4r:vivesse,ervesse¦4çar:trincasse¦5r:ressesse",
        "ex": "fosse:ir¦2esse:vir¦1isse:ver¦3ivesse:estar,deter,reter¦1ivesse:ter¦1esse:dar¦1ouvesse:haver¦2isesse:querer¦2ouxesse:trazer¦2sse:ler,rer¦4sse:dever,meter,jazer,cozer,citar,fitar,ditar,pitar,viver¦4isse:prever¦3isse:rever¦4casse:abraçar¦2casse:coçar,roçar,laçar¦2ivesse:ater¦4ísse:arguir¦5sse:ferver,quitar,poitar¦5ouvesse:comprazer¦3casse:calçar,forçar,atiçar¦2ísse:ruir,puir¦3sse:atar¦3esse:avir¦6sse:afoitar¦8sse:circuitar¦1usesse:pôr¦4ivesse:abster,suster¦1coitasse:açoitar"
      },
      "second": {
        "fwd": "usesses:ôr¦coitasses:çoitar¦2sses:xer,ser¦2ivesses:ster¦2casses:inçar¦3sses:iver¦5sses:coitar",
        "both": "5sses:quitar,ltitar,noitar,rreter¦5ivesses:brestar¦5isses:ntrever¦5esses:tervir¦4sses:pitar,gitar,orver,vitar,litar,sitar,enzer,bitar,ritar,citar,mitar,meter,ditar,eitar,caver,rever¦4isses:terver,ntever¦4esses:rovir¦4ivesses:treter¦3casses:emoçar,troçar¦3sses:xtar,rder,eder,ctar,ater,otar,rter,mber,etar,ptar,rtar,lver,utar,atar,eber,over,ltar,star,nder,ntar¦3esses:evir,avir,dvir,nvir¦3ísses:ssuir¦2ísses:cuir,tuir,buir,nuir,luir,ruir¦2sses:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,sar,var,har,oar,cer,jar,çar,gar,dar,rer,lar,mer,mar¦2ivesses:bter,nter¦1ouvesses:eaver¦1ísses:air¦1ssesses:izer¦1sses:ir¦usesses:or¦oubesses:aber¦udesses:oder¦izesses:azer",
        "rev": "erer:isesses¦ir:ísses¦1r:iesses¦1azer:rouxesses,rouvesses¦2er:evisses,etivesses¦2r:tesses,tasses¦3r:evesses,azesses,ozesses,osesses,exesses¦3çar:bracasses¦4r:vivesses,ervesses¦4çar:trincasses¦5r:ressesses",
        "ex": "fosses:ir¦2esses:vir¦1isses:ver¦3ivesses:estar,deter,reter¦1ivesses:ter¦1esses:dar¦1ouvesses:haver¦2isesses:querer¦2ouxesses:trazer¦2sses:ler,rer¦4sses:dever,meter,jazer,cozer,citar,fitar,ditar,pitar,viver¦4isses:prever¦3isses:rever¦4casses:abraçar¦2casses:coçar,roçar,laçar¦2ivesses:ater¦4ísses:arguir¦5sses:ferver,quitar,poitar¦5ouvesses:comprazer¦3casses:calçar,forçar,atiçar¦2ísses:ruir,puir¦3sses:atar¦3esses:avir¦6sses:afoitar¦8sses:circuitar¦1usesses:pôr¦4ivesses:abster,suster¦1coitasses:açoitar"
      },
      "third": {
        "fwd": "usesse:ôr¦coitasse:çoitar¦2sse:xer,ser¦2ivesse:ster¦2casse:inçar¦3sse:iver¦5sse:coitar",
        "both": "5sse:quitar,ltitar,noitar,rreter¦5ivesse:brestar¦5isse:ntrever¦5esse:tervir¦4sse:pitar,gitar,orver,vitar,litar,sitar,enzer,bitar,ritar,citar,mitar,meter,ditar,eitar,caver,rever¦4isse:terver,ntever¦4esse:rovir¦4ivesse:treter¦3casse:emoçar,troçar¦3sse:xtar,rder,eder,ctar,ater,otar,rter,mber,etar,ptar,rtar,lver,utar,atar,eber,over,ltar,star,nder,ntar¦3esse:evir,avir,dvir,nvir¦3ísse:ssuir¦2ísse:cuir,tuir,buir,nuir,luir,ruir¦2sse:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,sar,var,har,oar,cer,jar,çar,gar,dar,rer,lar,mer,mar¦2ivesse:bter,nter¦1ouvesse:eaver¦1ísse:air¦1ssesse:izer¦1sse:ir¦usesse:or¦oubesse:aber¦udesse:oder¦izesse:azer",
        "rev": "erer:isesse¦ir:ísse¦1r:iesse¦1azer:rouxesse,rouvesse¦2er:evisse,etivesse¦2r:tesse,tasse¦3r:evesse,azesse,ozesse,osesse,exesse¦3çar:bracasse¦4r:vivesse,ervesse¦4çar:trincasse¦5r:ressesse",
        "ex": "fosse:ir¦2esse:vir¦1isse:ver¦3ivesse:estar,deter,reter¦1ivesse:ter¦1esse:dar¦1ouvesse:haver¦2isesse:querer¦2ouxesse:trazer¦2sse:ler,rer¦4sse:dever,meter,jazer,cozer,citar,fitar,ditar,pitar,viver¦4isse:prever¦3isse:rever¦4casse:abraçar¦2casse:coçar,roçar,laçar¦2ivesse:ater¦4ísse:arguir¦5sse:ferver,quitar,poitar¦5ouvesse:comprazer¦3casse:calçar,forçar,atiçar¦2ísse:ruir,puir¦3sse:atar¦3esse:avir¦6sse:afoitar¦8sse:circuitar¦1usesse:pôr¦4ivesse:abster,suster¦1coitasse:açoitar"
      },
      "firstPlural": {
        "fwd": "uséssemos:ôr¦coitássemos:çoitar¦2ivéssemos:ster¦2cássemos:inçar",
        "both": "5ivéssemos:brestar¦5íssemos:ntrever¦5éssemos:tervir¦4íssemos:terver¦4êssemos:rreter¦4ouvéssemos:omprazer¦4éssemos:rovir¦4ivéssemos:treter¦3cássemos:troçar,braçar¦3éssemos:avir,evir,nvir¦3íssemos:tever¦3êssemos:meter¦3ivéssemos:onter,anter¦2êssemos:nzer,rter,ozer,mber,rder,eder,ater,eber,nder¦2ivéssemos:bter¦1êssemos:xer,ser,per,uer,ger,oer,her,ler,cer,ver,rer,mer¦1ouvéssemos:eaver¦1sséssemos:izer¦uséssemos:or¦oubéssemos:aber¦ássemos:ar¦íssemos:ir¦udéssemos:oder¦izéssemos:azer",
        "rev": "erer:iséssemos¦er:êssemos¦1r:iéssemos¦1azer:rouxéssemos¦2er:evíssemos,etivéssemos¦2çar:mocássemos¦3er:bstivéssemos,ustivéssemos¦4çar:trincássemos",
        "ex": "fôssemos:ir¦2éssemos:vir¦1íssemos:ver¦3ivéssemos:estar,deter,reter¦1ivéssemos:ter¦1éssemos:dar¦1ouvéssemos:haver¦2iséssemos:querer¦2ouxéssemos:trazer¦1êssemos:ler,rer¦4íssemos:prever¦3íssemos:rever¦4éssemos:advir¦3êssemos:meter,jazer¦2cássemos:coçar,roçar,laçar¦2ivéssemos:ater¦3cássemos:calçar,forçar,atiçar¦3éssemos:avir¦4cássemos:remoçar¦1uséssemos:pôr¦1coitássemos:açoitar"
      },
      "secondPlural": {
        "fwd": "usésseis:ôr¦coitásseis:çoitar¦2ivésseis:ster¦2cásseis:inçar",
        "both": "5ivésseis:brestar¦5ísseis:ntrever¦5ésseis:tervir¦4ísseis:terver¦4êsseis:rreter¦4ouvésseis:omprazer¦4ésseis:rovir¦4ivésseis:treter¦3cásseis:troçar,braçar¦3ésseis:avir,evir,nvir¦3ísseis:tever¦3êsseis:meter¦3ivésseis:onter,anter¦2êsseis:nzer,rter,ozer,mber,rder,eder,ater,eber,nder¦2ivésseis:bter¦1êsseis:xer,ser,per,uer,ger,oer,her,ler,cer,ver,rer,mer¦1ouvésseis:eaver¦1ssésseis:izer¦usésseis:or¦oubésseis:aber¦ásseis:ar¦ísseis:ir¦udésseis:oder¦izésseis:azer",
        "rev": "erer:isésseis¦er:êsseis¦1r:iésseis¦1azer:rouxésseis¦2er:evísseis,etivésseis¦2çar:mocásseis¦3er:bstivésseis,ustivésseis¦4çar:trincásseis",
        "ex": "fôsseis:ir¦2ésseis:vir¦1ísseis:ver¦3ivésseis:estar,deter,reter¦1ivésseis:ter¦1ésseis:dar¦1ouvésseis:haver¦2isésseis:querer¦2ouxésseis:trazer¦1êsseis:ler,rer¦4ísseis:prever¦3ísseis:rever¦4ésseis:advir¦3êsseis:meter,jazer¦2cásseis:coçar,roçar,laçar¦2ivésseis:ater¦3cásseis:calçar,forçar,atiçar¦3ésseis:avir¦4cásseis:remoçar¦1usésseis:pôr¦1coitásseis:açoitar"
      },
      "thirdPlural": {
        "fwd": "usessem:ôr¦coitassem:çoitar¦2ssem:xer,ser¦2ivessem:ster¦2cassem:inçar¦3ssem:iver¦5ssem:coitar",
        "both": "5ssem:quitar,ltitar,noitar,rreter¦5ivessem:brestar¦5issem:ntrever¦5essem:tervir¦4ssem:pitar,gitar,orver,vitar,litar,sitar,enzer,bitar,ritar,citar,mitar,meter,ditar,eitar,caver,rever¦4issem:terver,ntever¦4essem:rovir¦4ivessem:treter¦3cassem:emoçar,troçar¦3ssem:xtar,rder,eder,ctar,ater,otar,rter,mber,etar,ptar,rtar,lver,utar,atar,eber,over,ltar,star,nder,ntar¦3essem:evir,avir,dvir,nvir¦3íssem:ssuir¦2íssem:cuir,tuir,buir,nuir,luir,ruir¦2ssem:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,sar,var,har,oar,cer,jar,çar,gar,dar,rer,lar,mer,mar¦2ivessem:bter,nter¦1ouvessem:eaver¦1íssem:air¦1ssessem:izer¦1ssem:ir¦usessem:or¦oubessem:aber¦udessem:oder¦izessem:azer",
        "rev": "erer:isessem¦ir:íssem¦1r:iessem¦1azer:rouxessem,rouvessem¦2er:evissem,etivessem¦2r:tessem,tassem¦3r:evessem,azessem,ozessem,osessem,exessem¦3çar:bracassem¦4r:vivessem,ervessem¦4çar:trincassem¦5r:ressessem",
        "ex": "fossem:ir¦2essem:vir¦1issem:ver¦3ivessem:estar,deter,reter¦1ivessem:ter¦1essem:dar¦1ouvessem:haver¦2isessem:querer¦2ouxessem:trazer¦2ssem:ler,rer¦4ssem:dever,meter,jazer,cozer,citar,fitar,ditar,pitar,viver¦4issem:prever¦3issem:rever¦4cassem:abraçar¦2cassem:coçar,roçar,laçar¦2ivessem:ater¦4íssem:arguir¦5ssem:ferver,quitar,poitar¦5ouvessem:comprazer¦3cassem:calçar,forçar,atiçar¦2íssem:ruir,puir¦3ssem:atar¦3essem:avir¦6ssem:afoitar¦8ssem:circuitar¦1usessem:pôr¦4ivessem:abster,suster¦1coitassem:açoitar"
      }
    },
    "subjFuture": {
      "first": {
        "fwd": "3:xer,ser¦4:iver¦user:ôr¦coitar:çoitar¦2iver:ster¦2car:inçar",
        "both": "2:ir¦3:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,var,har,oar,cer,jar,sar,gar,dar,rer,lar,mer,mar¦4:xtar,uçar,içar,eçar,ater,ctar,ptar,eder,rçar,otar,rter,mber,etar,rtar,lver,utar,atar,eber,over,ltar,rder,star,nder,ntar¦5:poçar,daçar,maçar,ençar,paçar,titar,gaçar,laçar,baçar,gitar,oaçar,doçar,pitar,uitar,haçar,litar,enzer,bitar,ritar,mitar,meter,citar,vitar,ançar,sitar,ditar,eitar,caver,rever¦5iver:brestar,ntreter¦5er:tervir¦4ir:terver¦3car:emoçar,troçar,braçar¦3er:nvir,avir,evir,dvir,ovir¦3ouver:mprazer¦3ir:tever¦2iver:bter,nter¦1ouver:eaver¦1sser:izer¦user:or¦ouber:aber¦uder:oder¦izer:azer",
        "rev": "3:çar,ter,tar¦4:ever,azer,ozer,rver,exer,oser¦5:viver,esser¦erer:iser¦1r:ier¦1azer:rouxer¦2er:evir,etiver¦3er:ustiver¦4çar:trincar",
        "ex": "3:ler,rer¦4:atar,içar¦5:dever,caçar,meter,jazer,cozer,citar,fitar,alçar,ditar,maçar,pitar,inçar,viver¦6:traçar,ferver,sorver,poitar¦7:almoçar,ameaçar,realçar,esboçar,achoçar,panaçar,afoitar¦8:derreter,absorver,bagunçar,engraçar,morraçar¦9:descalçar,espicaçar,pernoitar,embaraçar,desgraçar,alvoroçar,congraçar¦10:escorraçar,abiscoitar¦12:desembaraçar¦for:ir¦2er:vir¦1ir:ver¦3iver:estar,deter,reter¦1iver:ter¦1er:dar¦1ouver:haver¦2iser:querer¦2ouxer:trazer¦4ir:prever¦3ir:rever¦2car:coçar,roçar,laçar¦2iver:ater¦3car:calçar,forçar,atiçar¦6ir:entrever¦3er:avir¦1user:pôr¦4iver:abster¦1coitar:açoitar"
      },
      "second": {
        "fwd": "useres:ôr¦coitares:çoitar¦2iveres:ster¦2cares:inçar¦3es:xer,ser¦4es:iver",
        "both": "5es:poçar,naçar,haçar,maçar,ençar,paçar,bitar,gaçar,laçar,baçar,gitar,oaçar,doçar,pitar,uitar,unçar,orver,citar,ritar,litar,meter,nguir,mitar,vitar,ançar,sitar,ditar,eitar,caver,eguir,rever¦5iveres:brestar,ntreter¦5ires:ntrever¦4es:xtar,eçar,nzer,uçar,içar,quir,ctar,rçar,lver,rter,mber,otar,etar,ptar,rtar,star,utar,atar,eder,over,ater,ltar,rder,eber,uvir,nder,ntar¦4ires:terver¦4eres:rovir¦3cares:emoçar,troçar,braçar¦3es:hir,far,ler,cir,per,zir,uer,mer,ger,oer,zar,pir,nir,her,lir,iar,nar,cer,rir,bar,uar,par,var,sir,har,xar,bir,ear,oar,jar,rar,sar,gar,car,dir,gir,mir,rer,lar,dar,tir,mar¦3eres:avir,evir,dvir,nvir¦3ouveres:mprazer¦3ires:tever¦2iveres:bter,nter¦1íres:uir,air¦1ouveres:eaver¦1sseres:izer¦useres:or¦ouberes:aber¦uderes:oder¦izeres:azer",
        "rev": "3:çares,teres,tares,uires¦4:everes,azeres,ozeres,oseres,exeres¦5:viveres,erveres,esseres¦erer:iseres¦1r:ieres¦1azer:rouxeres¦2er:evires,etiveres¦3er:bstiveres,ustiveres¦4çar:trincares",
        "ex": "fores:ir¦2eres:vir¦1ires:ver¦3iveres:estar,deter,reter¦1iveres:ter¦1eres:dar¦1ouveres:haver¦2iseres:querer¦2ouxeres:trazer¦3es:rir,ler,rer¦7eres:intervir¦5es:dever,caçar,meter,jazer,cozer,citar,fitar,alçar,ditar,maçar,pitar,inçar,viver¦7es:almoçar,ameaçar,realçar,esboçar,achoçar,afoitar¦4ires:prever¦6es:servir,traçar,ferver,poitar¦3ires:rever¦2cares:coçar,roçar,laçar¦2iveres:ater¦3cares:calçar,forçar,atiçar¦8es:derreter,saltitar,engraçar,morraçar¦4es:atar,içar¦10es:despedaçar,escorraçar,abiscoitar¦3eres:avir¦9es:descalçar,redarguir,espicaçar,pernoitar,embaraçar,amordaçar,desgraçar,alvoroçar,espedaçar,congraçar,desservir¦12es:desembaraçar¦1useres:pôr¦1coitares:açoitar"
      },
      "third": {
        "fwd": "3:xer,ser¦4:iver¦user:ôr¦coitar:çoitar¦2iver:ster¦2car:inçar",
        "both": "2:ir¦3:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,var,har,oar,cer,jar,sar,gar,dar,rer,lar,mer,mar¦4:xtar,uçar,içar,eçar,ater,ctar,ptar,eder,rçar,otar,rter,mber,etar,rtar,lver,utar,atar,eber,over,ltar,rder,star,nder,ntar¦5:poçar,daçar,maçar,ençar,paçar,titar,gaçar,laçar,baçar,gitar,oaçar,doçar,pitar,uitar,haçar,litar,enzer,bitar,ritar,mitar,meter,citar,vitar,ançar,sitar,ditar,eitar,caver,rever¦5iver:brestar,ntreter¦5er:tervir¦4ir:terver¦3car:emoçar,troçar,braçar¦3er:nvir,avir,evir,dvir,ovir¦3ouver:mprazer¦3ir:tever¦2iver:bter,nter¦1ouver:eaver¦1sser:izer¦user:or¦ouber:aber¦uder:oder¦izer:azer",
        "rev": "3:çar,ter,tar¦4:ever,azer,ozer,rver,exer,oser¦5:viver,esser¦erer:iser¦1r:ier¦1azer:rouxer¦2er:evir,etiver¦3er:ustiver¦4çar:trincar",
        "ex": "3:ler,rer¦4:atar,içar¦5:dever,caçar,meter,jazer,cozer,citar,fitar,alçar,ditar,maçar,pitar,inçar,viver¦6:traçar,ferver,sorver,poitar¦7:almoçar,ameaçar,realçar,esboçar,achoçar,panaçar,afoitar¦8:derreter,absorver,bagunçar,engraçar,morraçar¦9:descalçar,espicaçar,pernoitar,embaraçar,desgraçar,alvoroçar,congraçar¦10:escorraçar,abiscoitar¦12:desembaraçar¦for:ir¦2er:vir¦1ir:ver¦3iver:estar,deter,reter¦1iver:ter¦1er:dar¦1ouver:haver¦2iser:querer¦2ouxer:trazer¦4ir:prever¦3ir:rever¦2car:coçar,roçar,laçar¦2iver:ater¦3car:calçar,forçar,atiçar¦6ir:entrever¦3er:avir¦1user:pôr¦4iver:abster¦1coitar:açoitar"
      },
      "firstPlural": {
        "fwd": "usermos:ôr¦coitarmos:çoitar¦2ivermos:ster¦2carmos:inçar¦3mos:xer,ser¦4mos:iver",
        "both": "5mos:poçar,daçar,maçar,ençar,paçar,titar,gaçar,laçar,baçar,gitar,oaçar,doçar,pitar,uitar,haçar,litar,enzer,bitar,ritar,mitar,meter,citar,vitar,ançar,sitar,ditar,eitar,caver,rever¦5ivermos:brestar,ntreter¦5ermos:tervir¦4mos:xtar,uçar,içar,eçar,ater,ctar,ptar,eder,rçar,otar,rter,mber,etar,rtar,lver,utar,atar,eber,over,ltar,rder,star,nder,ntar¦4irmos:terver¦3carmos:emoçar,troçar,braçar¦3ermos:nvir,avir,evir,dvir,ovir¦3mos:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,var,har,oar,cer,jar,sar,gar,dar,rer,lar,mer,mar¦3ouvermos:mprazer¦3irmos:tever¦2ivermos:bter,nter¦2mos:ir¦1ouvermos:eaver¦1ssermos:izer¦usermos:or¦oubermos:aber¦udermos:oder¦izermos:azer",
        "rev": "3:çarmos,termos,tarmos¦4:evermos,azermos,ozermos,rvermos,exermos,osermos¦5:vivermos,essermos¦erer:isermos¦1r:iermos¦1azer:rouxermos¦2er:evirmos,etivermos¦3er:ustivermos¦4çar:trincarmos",
        "ex": "formos:ir¦2ermos:vir¦1irmos:ver¦3ivermos:estar,deter,reter¦1ivermos:ter¦1ermos:dar¦1ouvermos:haver¦2isermos:querer¦2ouxermos:trazer¦3mos:ler,rer¦5mos:dever,caçar,meter,jazer,cozer,citar,fitar,alçar,ditar,maçar,pitar,inçar,viver¦7mos:almoçar,ameaçar,realçar,esboçar,achoçar,panaçar,afoitar¦4irmos:prever¦3irmos:rever¦6mos:traçar,ferver,sorver,poitar¦2carmos:coçar,roçar,laçar¦2ivermos:ater¦3carmos:calçar,forçar,atiçar¦8mos:derreter,absorver,bagunçar,engraçar,morraçar¦4mos:atar,içar¦6irmos:entrever¦3ermos:avir¦9mos:descalçar,espicaçar,pernoitar,embaraçar,desgraçar,alvoroçar,congraçar¦10mos:escorraçar,abiscoitar¦12mos:desembaraçar¦1usermos:pôr¦4ivermos:abster¦1coitarmos:açoitar"
      },
      "secondPlural": {
        "fwd": "userdes:ôr¦coitardes:çoitar¦2iverdes:ster¦2cardes:inçar¦3des:xer,ser¦4des:iver",
        "both": "5des:poçar,daçar,maçar,ençar,paçar,titar,gaçar,laçar,baçar,gitar,oaçar,doçar,pitar,uitar,haçar,litar,enzer,bitar,ritar,mitar,meter,citar,vitar,ançar,sitar,ditar,eitar,caver,rever¦5iverdes:brestar,ntreter¦5erdes:tervir¦4des:xtar,uçar,içar,eçar,ater,ctar,ptar,eder,rçar,otar,rter,mber,etar,rtar,lver,utar,atar,eber,over,ltar,rder,star,nder,ntar¦4irdes:terver¦3cardes:emoçar,troçar,braçar¦3erdes:nvir,avir,evir,dvir,ovir¦3des:far,per,par,uer,oer,bar,ear,car,uar,iar,nar,zar,her,rar,ler,ger,xar,var,har,oar,cer,jar,sar,gar,dar,rer,lar,mer,mar¦3ouverdes:mprazer¦3irdes:tever¦2iverdes:bter,nter¦2des:ir¦1ouverdes:eaver¦1sserdes:izer¦userdes:or¦ouberdes:aber¦uderdes:oder¦izerdes:azer",
        "rev": "3:çardes,terdes,tardes¦4:everdes,azerdes,ozerdes,rverdes,exerdes,oserdes¦5:viverdes,esserdes¦erer:iserdes¦1r:ierdes¦1azer:rouxerdes¦2er:evirdes,etiverdes¦3er:ustiverdes¦4çar:trincardes",
        "ex": "fordes:ir¦2erdes:vir¦1irdes:ver¦3iverdes:estar,deter,reter¦1iverdes:ter¦1erdes:dar¦1ouverdes:haver¦2iserdes:querer¦2ouxerdes:trazer¦3des:ler,rer¦5des:dever,caçar,meter,jazer,cozer,citar,fitar,alçar,ditar,maçar,pitar,inçar,viver¦7des:almoçar,ameaçar,realçar,esboçar,achoçar,panaçar,afoitar¦4irdes:prever¦3irdes:rever¦6des:traçar,ferver,sorver,poitar¦2cardes:coçar,roçar,laçar¦2iverdes:ater¦3cardes:calçar,forçar,atiçar¦8des:derreter,absorver,bagunçar,engraçar,morraçar¦4des:atar,içar¦6irdes:entrever¦3erdes:avir¦9des:descalçar,espicaçar,pernoitar,embaraçar,desgraçar,alvoroçar,congraçar¦10des:escorraçar,abiscoitar¦12des:desembaraçar¦1userdes:pôr¦4iverdes:abster¦1coitardes:açoitar"
      },
      "thirdPlural": {
        "fwd": "userem:ôr¦coitarem:çoitar¦2iverem:ster¦2carem:inçar¦3em:xer,ser¦4em:iver",
        "both": "5em:poçar,naçar,haçar,maçar,ençar,paçar,bitar,gaçar,laçar,baçar,gitar,oaçar,doçar,pitar,uitar,unçar,orver,citar,ritar,litar,meter,nguir,mitar,vitar,ançar,sitar,ditar,eitar,caver,eguir,rever¦5iverem:brestar,ntreter¦5irem:ntrever¦4em:xtar,eçar,nzer,uçar,içar,quir,ctar,rçar,lver,rter,mber,otar,etar,ptar,rtar,star,utar,atar,eder,over,ater,ltar,rder,eber,uvir,nder,ntar¦4irem:terver¦4erem:rovir¦3carem:emoçar,troçar,braçar¦3em:hir,far,ler,cir,per,zir,uer,mer,ger,oer,zar,pir,nir,her,lir,iar,nar,cer,rir,bar,uar,par,var,sir,har,xar,bir,ear,oar,jar,rar,sar,gar,car,dir,gir,mir,rer,lar,dar,tir,mar¦3erem:avir,evir,dvir,nvir¦3ouverem:mprazer¦3irem:tever¦2iverem:bter,nter¦1írem:uir,air¦1ouverem:eaver¦1sserem:izer¦userem:or¦ouberem:aber¦uderem:oder¦izerem:azer",
        "rev": "3:çarem,terem,tarem,uirem¦4:everem,azerem,ozerem,oserem,exerem¦5:viverem,erverem,esserem¦erer:iserem¦1r:ierem¦1azer:rouxerem¦2er:evirem,etiverem¦3er:bstiverem,ustiverem¦4çar:trincarem",
        "ex": "forem:ir¦2erem:vir¦1irem:ver¦3iverem:estar,deter,reter¦1iverem:ter¦1erem:dar¦1ouverem:haver¦2iserem:querer¦2ouxerem:trazer¦3em:rir,ler,rer¦7erem:intervir¦5em:dever,caçar,meter,jazer,cozer,citar,fitar,alçar,ditar,maçar,pitar,inçar,viver¦7em:almoçar,ameaçar,realçar,esboçar,achoçar,afoitar¦4irem:prever¦6em:servir,traçar,ferver,poitar¦3irem:rever¦2carem:coçar,roçar,laçar¦2iverem:ater¦3carem:calçar,forçar,atiçar¦8em:derreter,saltitar,engraçar,morraçar¦4em:atar,içar¦10em:despedaçar,escorraçar,abiscoitar¦3erem:avir¦9em:descalçar,redarguir,espicaçar,pernoitar,embaraçar,amordaçar,desgraçar,alvoroçar,espedaçar,congraçar,desservir¦12em:desembaraçar¦1userem:pôr¦1coitarem:açoitar"
      }
    },
    "gerunds": {
      "gerunds": {
        "fwd": "",
        "both": "3cando:braçar¦ndo:r",
        "rev": "",
        "ex": "1ondo:pôr¦2cando:coçar"
      }
    },
    "pastParticiple": {
      "pastParticiple": {
        "fwd": "ido:er¦osto:ôr¦1to:izer¦2do:tir,mir,dir,bir,gir,zir¦3do:rrir,guir,erir",
        "both": "5ndo:tervir¦4do:lorir,ossir¦4ndo:rovir¦3do:trir,arir,irir,prir¦3cado:braçar¦3ndo:nvir¦2do:pir,nir,lir¦2ito:crever¦1eito:fazer¦1ído:air,oer,uir¦1sto:or¦1erto:brir¦1do:ar",
        "rev": "azer:eito¦er:isto¦r:ndo¦1er:vido,cido,xido,hido¦2er:omido,azido,ndido,abido,ebido,rdido,egido,frido,rrido,btido,emido,mbido¦2zer:dito¦3r:rtido,rmido,uvido,idido,stido,ugido,ngido,umido,itido,utido,rgido,uzido,agido,udido¦3er:uerido,ontido,retido,metido,bstido,batido¦4r:entido,rigido,eguido,ferido,ervido,petido,gerido,letido,pedido,xigido,nguido,lodido,andido¦5r:rantido,fundido,gredido¦5er:nvertido",
        "ex": "1do:ir¦1eito:fazer¦2ndo:vir¦1isto:ver¦2do:rir¦4do:ouvir,pedir,subir,medir,ferir,latir¦4isto:prever¦5do:servir,sorrir,aderir¦3isto:rever¦4ndo:advir¦2cado:coçar¦1ido:ser,ter,ler¦3ido:poder,valer,bater,deter,ceder,feder,reter,meter,viger¦1osto:pôr¦2to:dizer¦3do:agir¦4ido:manter,erguer¦2ido:crer,ater¦6do:invadir,proibir¦9do:prescindir"
      }
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress(model$1[k][form]);
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
    infinitivo: infinitivo$1,
    subjPresent: subjPresent$1,
    subjImperfect: subjImperfect$1,
    subjFuture: subjFuture$1,
  } = model$1;

  const allForms = function (str, m) {
    return forms$2.reduce((h, form) => {
      // imperatives are missing the first-person form
      if (m[form]) {
        h[form] = convert(str, m[form]);
      }
      return h
    }, {})
  };

  const toConditional$1 = (str) => allForms(str, conditional$1);
  const toFutureTense$1 = (str) => allForms(str, futureTense$1);
  const toImperativeNeg$1 = (str) => allForms(str, imperativeNeg$1);
  const toImperative$1 = (str) => allForms(str, imperative$1);
  const toImperfect$1 = (str) => allForms(str, imperfect$1);
  const toPastTense$1 = (str) => allForms(str, pastTense$1);
  const toPluperfect$1 = (str) => allForms(str, pluperfect$1);
  const toPresentTense$1 = (str) => allForms(str, presentTense$1);
  const toInfinitivo$1 = (str) => allForms(str, infinitivo$1);
  const toSubjPresent$1 = (str) => allForms(str, subjPresent$1);
  const toSubjImperfect$1 = (str) => allForms(str, subjImperfect$1);
  const toSubjFuture$1 = (str) => allForms(str, subjFuture$1);
  const toGerund$1 = (str) => convert(str, gerunds$1.gerunds);
  const toPastParticiple$1 = (str) => convert(str, pastParticiple$1.pastParticiple);

  // an array of every inflection, for '{inf}' syntax
  const all$2 = function (str) {
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
      Object.values(toSubjPresent$1(str)),
      Object.values(toSubjImperfect$1(str)),
      Object.values(toSubjFuture$1(str)),
      toGerund$1(str),
      toPastParticiple$1(str),
    ).filter(s => s);
    res = new Set(res);
    return Array.from(res)
  };

  let {
    conditional, futureTense, imperativeNeg, imperative, imperfect, pastTense,
    pluperfect, presentTense, gerunds, pastParticiple, infinitivo,
    subjPresent, subjImperfect, subjFuture,
  } = model$1;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse(m[k]);
      return h
    }, {})
  };

  let conditionalRev = revAll(conditional);
  let futureTenseRev = revAll(futureTense);
  let imperativeNegRev = revAll(imperativeNeg);
  let imperativeRev = revAll(imperative);
  let imperfectRev = revAll(imperfect);
  let pastTenseRev = revAll(pastTense);
  let pluperfectRev = revAll(pluperfect);
  let presentTenseRev = revAll(presentTense);
  let infinitivoRev = revAll(infinitivo);
  let subjPresentRev = revAll(subjPresent);
  let subjImperfectRev = revAll(subjImperfect);
  let subjFutureRev = revAll(subjFuture);
  let gerundsRev = reverse(gerunds.gerunds);
  let pastParticipleRev = reverse(pastParticiple.pastParticiple);

  const forms$1 = {
    'FirstPerson': 'first',
    'SecondPerson': 'second',
    'ThirdPerson': 'third',
    'FirstPersonPlural': 'firstPlural',
    'SecondPersonPlural': 'secondPlural',
    'ThirdPersonPlural': 'thirdPlural',
  };
  const fromAll = function (str, form, m) {
    if (forms$1.hasOwnProperty(form) && m[forms$1[form]]) {
      return convert(str, m[forms$1[form]])
    }
    // an ambiguous form, like 'falava' (1st or 3rd person) has no person-tag -
    // try each person's model until one converts it
    let keys = Object.keys(m);
    for (let i = 0; i < keys.length; i += 1) {
      let out = convert(str, m[keys[i]]);
      if (out !== str) {
        return out
      }
    }
    return str
  };


  const fromConditional = (str, form) => fromAll(str, form, conditionalRev);
  const fromFutureTense = (str, form) => fromAll(str, form, futureTenseRev);
  const fromImperativeNeg = (str, form) => fromAll(str, form, imperativeNegRev);
  const fromImperative = (str, form) => fromAll(str, form, imperativeRev);
  const fromImperfect = (str, form) => fromAll(str, form, imperfectRev);
  const fromPastTense = (str, form) => fromAll(str, form, pastTenseRev);
  const fromPluperfect = (str, form) => fromAll(str, form, pluperfectRev);
  const fromPresentTense = (str, form) => fromAll(str, form, presentTenseRev);
  const fromInfinitivo = (str, form) => fromAll(str, form, infinitivoRev);
  const fromSubjPresent = (str, form) => fromAll(str, form, subjPresentRev);
  const fromSubjImperfect = (str, form) => fromAll(str, form, subjImperfectRev);
  const fromSubjFuture = (str, form) => fromAll(str, form, subjFutureRev);
  const fromGerund = (str) => convert(str, gerundsRev);
  const fromPastParticiple = (str) => convert(str, pastParticipleRev);

  let { f, mp, fp } = model$1.adjectives;

  let fRev = reverse(f);
  let mpRev = reverse(mp);
  let fpRev = reverse(fp);

  const toFemale = (str) => convert(str, f);
  const toPlural$1 = (str) => convert(str, mp);
  const toFemalePlural = (str) => convert(str, fp);
  const fromFemale = (str) => convert(str, fRev);
  const toSingular$1 = (str) => convert(str, mpRev);
  const fromFemalePlural = (str) => convert(str, fpRev);

  const all$1 = function (str) {
    let arr = [str];
    arr.push(toFemale(str));
    arr.push(toPlural$1(str));
    arr.push(toFemalePlural(str));
    arr = arr.filter(s => s);
    arr = new Set(arr);
    return Array.from(arr)
  };
  // console.log(all('maravilhoso'))
  // console.log(toPlural("maravilhoso"))

  let { plurals } = model$1.nouns;

  let rev = reverse(plurals);

  const toPlural = (str) => convert(str, plurals);
  const toSingular = (str) => convert(str, rev);

  // masculine → feminine person-nouns
  const exceptions = {
    ator: 'atriz',
    imperador: 'imperatriz',
    embaixador: 'embaixatriz',
    rei: 'rainha',
    'réu': 'ré',
    'herói': 'heroína',
    poeta: 'poetisa',
    conde: 'condessa',
    'príncipe': 'princesa',
    'barão': 'baronesa',
    'leão': 'leoa',
    'patrão': 'patroa',
    'europeu': 'europeia',
    'judeu': 'judia',
  };
  const revExceptions = Object.keys(exceptions).reduce((h, k) => {
    h[exceptions[k]] = k;
    return h
  }, {});

  const toFeminine = function (str) {
    if (exceptions.hasOwnProperty(str)) {
      return exceptions[str]
    }
    // professor → professora
    if (/or$/.test(str)) {
      return str + 'a'
    }
    // freguês → freguesa
    if (/ês$/.test(str)) {
      return str.replace(/ês$/, 'esa')
    }
    // irmão → irmã, cidadão → cidadã
    if (/ão$/.test(str)) {
      return str.replace(/ão$/, 'ã')
    }
    // menino → menina
    if (/o$/.test(str)) {
      return str.replace(/o$/, 'a')
    }
    return str
  };

  const fromFeminine = function (str) {
    if (revExceptions.hasOwnProperty(str)) {
      return revExceptions[str]
    }
    // professora → professor
    if (/ora$/.test(str)) {
      return str.replace(/a$/, '')
    }
    // freguesa → freguês
    if (/esa$/.test(str)) {
      return str.replace(/esa$/, 'ês')
    }
    // irmã → irmão
    if (/ã$/.test(str)) {
      return str.replace(/ã$/, 'ão')
    }
    // menina → menino
    if (/a$/.test(str)) {
      return str.replace(/a$/, 'o')
    }
    return str
  };

  const all = function (str) {
    let arr = [str];
    arr.push(toPlural(str));
    arr = arr.filter(s => s);
    arr = new Set(arr);
    return Array.from(arr)
  };
  // console.log(all('maravilhoso'))
  // console.log(toPlural("maravilhoso"))

  var methods = {
    verb: {
      all: all$2, toConditional: toConditional$1, toFutureTense: toFutureTense$1, toImperativeNeg: toImperativeNeg$1, toImperative: toImperative$1, toImperfect: toImperfect$1,
      toPastTense: toPastTense$1, toPluperfect: toPluperfect$1, toPresentTense: toPresentTense$1, toGerund: toGerund$1, toPastParticiple: toPastParticiple$1, toInfinitivo: toInfinitivo$1,
      toSubjPresent: toSubjPresent$1, toSubjImperfect: toSubjImperfect$1, toSubjFuture: toSubjFuture$1,

      fromConditional, fromFutureTense, fromImperativeNeg, fromImperative, fromImperfect,
      fromPastTense, fromPluperfect, fromPresentTense,
      fromGerund, fromPastParticiple, fromInfinitivo,
      fromSubjPresent, fromSubjImperfect, fromSubjFuture,
    },
    noun: {
      all: all, toPlural: toPlural, toSingular: toSingular,
      toFeminine, fromFeminine,
    },
    adjective: {
      all: all$1, toFemale, toPlural: toPlural$1, toFemalePlural, fromFemale, toSingular: toSingular$1, fromFemalePlural,
    },
  };

  let lex = {
    'não': 'Negative',
    'nunca': 'Negative',
    // 'quê': 'QuestionWord',//what?
    'o que': 'QuestionWord',//what?
    'quem': 'QuestionWord',//who?
    'qual': 'QuestionWord',//which?
    'porquê': 'QuestionWord',//why?
    'quando': 'QuestionWord',//when?
    'onde': 'QuestionWord',//where?
    // 'como': 'QuestionWord',//how?
    'quanto': 'QuestionWord',
    'quão': 'QuestionWord',
    'termos': 'Verb'
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

  // feminine forms of common person-nouns, whose masculine ends in -o
  let femNouns = [
    'aluna',
    'amiga',
    'médica',
    'advogada',
    'engenheira',
    'enfermeira',
    'vizinha',
    'cozinheira',
    'garota',
    'companheira',
    'secretária',
    'menina',
    'filha',
    'irmã',
    'atriz',
  ];
  femNouns.forEach(str => {
    lex[str] = ['Noun', 'FemaleNoun', 'Singular'];
    let pl = str === 'atriz' ? 'atrizes' : str + 's';
    lex[pl] = ['Noun', 'FemaleNoun', 'Plural'];
  });

  const forms = ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'];
  const addCopulas = (arr, tags) => {
    if (typeof tags === 'string') {
      tags = [tags];
    }
    arr.forEach((str, i) => {
      if (lex[str]) {
        return
      }
      // forms shared between persons, like 'era' (1st + 3rd) get no person-tag
      if (arr.indexOf(str) !== arr.lastIndexOf(str)) {
        lex[str] = ['Copula'].concat(tags);
      } else {
        lex[str] = ['Copula', forms[i]].concat(tags);
      }
    });
  };
  // copula ser
  // note: indicative tenses are listed before their (less-common) subjunctive homographs
  lex['sido'] = ['PastParticiple', 'Copula'];
  lex['sendo'] = ['Gerund', 'Copula'];
  lex['sê'] = ['Imperative', 'Copula', 'SecondPerson'];
  lex['sede'] = ['Imperative', 'Copula', 'SecondPersonPlural'];
  addCopulas(['ser', 'seres', 'ser', 'sermos', 'serdes', 'serem'], 'Infinitive');
  addCopulas(['sou', 'és', 'é', 'somos', 'sois', 'são'], 'PresentTense');
  addCopulas(['fui', 'foste', 'foi', 'fomos', 'fostes', 'foram'], 'PastTense');
  addCopulas(['era', 'eras', 'era', 'éramos', 'éreis', 'eram'], 'Imperfect');
  addCopulas(['fora', 'foras', 'fora', 'fôramos', 'fôreis', 'foram'], 'Pluperfect');
  addCopulas(['serei', 'serás', 'será', 'seremos', 'sereis', 'serão'], 'FutureTense');
  addCopulas(['seria', 'serias', 'seria', 'seríamos', 'seríeis', 'seriam'], 'Conditional');
  addCopulas(['seja', 'sejas', 'seja', 'sejamos', 'sejais', 'sejam'], ['PresentTense', 'Subjunctive']);
  addCopulas(['fosse', 'fosses', 'fosse', 'fôssemos', 'fôsseis', 'fossem'], ['Imperfect', 'Subjunctive']);
  addCopulas(['for', 'fores', 'for', 'formos', 'fordes', 'forem'], ['FutureTense', 'Subjunctive']);

  // copula estar
  lex['estado'] = ['PastParticiple', 'Copula'];
  lex['estando'] = ['Gerund', 'Copula'];
  lex['estai'] = ['Imperative', 'Copula', 'SecondPersonPlural'];
  // 'está' is far more often present-tense than imperative
  addCopulas(['estar', 'estares', 'estar', 'estarmos', 'estardes', 'estarem'], 'Infinitive');
  addCopulas(['estou', 'estás', 'está', 'estamos', 'estais', 'estão'], 'PresentTense');
  addCopulas(['estive', 'estiveste', 'esteve', 'estivemos', 'estivestes', 'estiveram'], 'PastTense');
  addCopulas(['estava', 'estavas', 'estava', 'estávamos', 'estáveis', 'estavam'], 'Imperfect');
  addCopulas(['estivera', 'estiveras', 'estivera', 'estivéramos', 'estivéreis', 'estiveram'], 'Pluperfect');
  addCopulas(['estarei', 'estarás', 'estará', 'estaremos', 'estareis', 'estarão'], 'FutureTense');
  addCopulas(['estaria', 'estarias', 'estaria', 'estaríamos', 'estaríeis', 'estariam'], 'Conditional');
  addCopulas(['esteja', 'estejas', 'esteja', 'estejamos', 'estejais', 'estejam'], ['PresentTense', 'Subjunctive']);
  addCopulas(['estivesse', 'estivesses', 'estivesse', 'estivéssemos', 'estivésseis', 'estivessem'], ['Imperfect', 'Subjunctive']);
  addCopulas(['estiver', 'estiveres', 'estiver', 'estivermos', 'estiverdes', 'estiverem'], ['FutureTense', 'Subjunctive']);

  const { toPresentTense, toPastTense, toFutureTense, toConditional, toImperative,
    toImperativeNeg, toImperfect, toPluperfect, toGerund, toPastParticiple, toInfinitivo,
    toSubjPresent, toSubjImperfect, toSubjFuture } = methods.verb;
  let lexicon$1 = {};

  const tagMap = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };

  // abstract -or nouns with no feminine form
  const notAgentive = {
    amor: true, calor: true, valor: true, cor: true, dor: true, flor: true,
    motor: true, setor: true, fator: true, favor: true, sabor: true, humor: true,
    tumor: true, terror: true, temor: true, tremor: true, vapor: true, rigor: true,
    vigor: true, teor: true, licor: true, suor: true, ardor: true, pudor: true,
    clamor: true, fervor: true, furor: true, horror: true, louvor: true, odor: true,
    rancor: true, rumor: true, torpor: true, primor: true, esplendor: true,
    interior: true, exterior: true, superior: true, inferior: true,
    anterior: true, posterior: true, melhor: true, pior: true, maior: true, menor: true,
  };
  const addToLex = function (obj, tags, lex) {
    // find forms that repeat across persons, like 'falava' (1st + 3rd)
    let counts = {};
    Object.values(obj).forEach(w => {
      counts[w] = (counts[w] || 0) + 1;
    });
    Object.keys(obj).forEach(k => {
      let w = obj[k];
      if (!lex[w]) {
        // skip the person-tag for ambiguous forms
        if (counts[w] > 1) {
          lex[w] = tags;
        } else {
          lex[w] = tags.concat([tagMap[k]]);
        }
      }
    });
  };

  // which tense-models produce which tags
  const conjugations = [
    [toPresentTense, ['PresentTense']],
    [toPastTense, ['PastTense']],
    [toFutureTense, ['FutureTense']],
    [toConditional, ['Conditional']],
    [toImperative, ['Imperative']],
    [toImperativeNeg, ['Imperative']],
    [toImperfect, ['Imperfect']],
    [toPluperfect, ['Pluperfect']],
    [toInfinitivo, ['Infinitive']],
    // subjunctive forms that overlap the above (like 'fale') keep their first tag,
    // distinct ones ('falasse', 'fizer', 'quiser'..) are added here
    [toSubjPresent, ['Subjunctive', 'PresentTense']],
    [toSubjImperfect, ['Subjunctive', 'Imperfect']],
    [toSubjFuture, ['Subjunctive', 'FutureTense']],
  ];

  Object.keys(lexData).forEach(tag => {
    let wordsObj = unpack(lexData[tag]);
    Object.keys(wordsObj).forEach(w => {
      lexicon$1[w] = tag;

      // add conjugations for our verbs
      if (tag === 'Infinitive') {
        conjugations.forEach(a => {
          let obj = a[0](w);
          addToLex(obj, a[1], lexicon$1);
        });
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
      if (tag === 'Noun') {
        lexicon$1[w] = lexicon$1[w] || ['Noun'];
        let pl = methods.noun.toPlural(w);
        lexicon$1[pl] = lexicon$1[pl] || 'Plural';
        // professor → professora, but not abstract -or nouns like 'amor'
        if (/or$/.test(w) && notAgentive[w] !== true) {
          let fem = methods.noun.toFeminine(w);
          if (fem !== w) {
            if (!lexicon$1[fem] || lexicon$1[fem] === 'Noun') {
              lexicon$1[fem] = ['Noun', 'FemaleNoun', 'Singular'];
            }
            let femPl = fem + 's';
            if (!lexicon$1[femPl] || lexicon$1[femPl] === 'Plural') {
              lexicon$1[femPl] = ['Noun', 'FemaleNoun', 'Plural'];
            }
          }
        }
      }
      if (tag === 'Cardinal') {
        lexicon$1[w] = ['Cardinal', 'TextValue'];
      }
      if (tag === 'Ordinal') {
        lexicon$1[w] = ['Ordinal', 'TextValue'];
      }
    });
  });

  Object.assign(lexicon$1, lex);

  const verbForm = function (term) {
    let want = [
      'FirstPerson',
      'SecondPerson',
      'ThirdPerson',
      'FirstPersonPlural',
      'SecondPersonPlural',
      'ThirdPersonPlural',
    ];
    return want.find(tag => term.tags.has(tag))
  };

  const toRoot = function (term, methods) {
    const { verb, noun, adjective } = methods.two.transform;
    let tags = term.tags;
    let str = term.implicit || term.normal || term.text;
    // reduce an adjective to its root
    if (tags.has('Adjective')) {
      // female plural
      if (tags.has('FemaleAdjective') && tags.has('PluralAdjective')) {
        return adjective.fromFemalePlural(str)
      }
      //male plural
      if (tags.has('PluralAdjective')) {
        return adjective.fromPlural(str)
      }
      if (tags.has('FemaleAdjective')) {
        return adjective.fromFemale(str)
      }
      return null
    }
    // reduce a noun to root
    if (tags.has('Noun')) {
      let out = str;
      if (tags.has('Plural')) {
        out = noun.toSingular(out);
      }
      // professora → professor
      if (tags.has('FemaleNoun')) {
        out = noun.fromFeminine(out);
      }
      return out !== str ? out : null
    }
    // reduce a verb to root
    // check specific tags before the tags they inherit from -
    // Gerund/Infinitive are #PresentTense, PastParticiple/Imperfect are #PastTense
    if (tags.has('Verb')) {
      let form = verbForm(term);
      if (tags.has('Gerund')) {
        return verb.fromGerund(str, form)
      }
      if (tags.has('PastParticiple')) {
        return verb.fromPastParticiple(str, form)
      }
      if (tags.has('Infinitive')) {
        return verb.fromInfinitivo(str, form)
      }
      if (tags.has('Conditional')) {
        return verb.fromConditional(str, form)
      }
      if (tags.has('Subjunctive')) {
        if (tags.has('Imperfect') || tags.has('PastTense')) {
          return verb.fromSubjImperfect(str, form)
        }
        if (tags.has('FutureTense')) {
          return verb.fromSubjFuture(str, form)
        }
        return verb.fromSubjPresent(str, form)
      }
      if (tags.has('Imperative') && tags.has('Negative')) {
        return verb.fromImperativeNeg(str, form)
      }
      if (tags.has('Imperative')) {
        return verb.fromImperative(str, form)
      }
      if (tags.has('Imperfect')) {
        return verb.fromImperfect(str, form)
      }
      if (tags.has('Pluperfect')) {
        return verb.fromPluperfect(str, form)
      }
      if (tags.has('PastTense')) {
        return verb.fromPastTense(str, form)
      }
      if (tags.has('FutureTense')) {
        return verb.fromFutureTense(str, form)
      }
      if (tags.has('PresentTense')) {
        return verb.fromPresentTense(str, form)
      }
      return str
    }
    return null
  };

  const root = function (view) {
    view.docs.forEach(terms => {
      terms.forEach(term => {
        let str = toRoot(term, view.world.methods);
        if (str && str !== term.normal) {
          term.root = str;
        }
      });
    });

  };

  var lexicon = {
    words: lexicon$1,
    compute: { root: root },
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


  // á	Alt + 0225
  // é	Alt + 0233
  // í	Alt + 0237
  // ó	Alt + 024
  // ú	Alt + 0250
  // ü	Alt + 0252
  // ñ	Alt + 0241
  // ¿	Alt + 0191
  // ¡	Alt + 0161
  // ã Ã &#195;
  // õ Õ &#213;

  let compact = {
    '?': 'Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÅåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'þƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    i: 'ĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇії',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ØðøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'µŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰμυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  let unicode = {};
  Object.keys(compact).forEach(function (k) {
    compact[k].split('').forEach(function (s) {
      unicode[s] = k;
    });
  });

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
    { word: 'à', out: ['a', 'a'] },
    { word: 'aos', out: ['a', 'os'] },
    { word: 'às', out: ['a', 'as'] },

    { word: 'pro', out: ['para', 'o'] },
    { word: 'prò', out: ['para', 'o'] },
    { word: 'prà', out: ['para', 'a'] },
    { word: 'pros', out: ['para', 'os'] },
    { word: 'pròs', out: ['para', 'os'] },
    { word: 'pràs', out: ['para', 'as'] },

    { word: 'cò', out: ['com', 'o'] },
    { word: 'coa', out: ['com', 'a'] },
    { word: 'còs', out: ['com', 'os'] },
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

    { word: 'à', out: ['a', 'a'] },
    { word: 'às', out: ['a', 'as'] },
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
    { word: 'conosco', out: ['com', 'nós'] },
    { word: 'convosco', out: ['com', 'vós'] },
    { word: 'dele', out: ['de', 'ele'] },
    { word: 'dela', out: ['de', 'ela'] },
    { word: 'deles', out: ['de', 'eles'] },
    { word: 'delas', out: ['de', 'elas'] },
    { word: 'nele', out: ['em', 'ele'] },
    { word: 'nela', out: ['em', 'ela'] },
    { word: 'neles', out: ['em', 'eles'] },
    { word: 'nelas', out: ['em', 'elas'] },
    { word: 'àquele', out: ['a', 'aquele'] },
    { word: 'àquela', out: ['a', 'aquela'] },
    { word: 'àqueles', out: ['a', 'aqueles'] },
    { word: 'àquelas', out: ['a', 'aquelas'] },
    { word: 'àquilo', out: ['a', 'aquilo'] },
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
    { word: 'dalguém', out: ['de', 'alguém'] },
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
    { word: 'nalguém', out: ['em', 'alguém'] },
    { word: 'aonde', out: ['a', 'onde'] },
    { word: 'daqui', out: ['de', 'aqui'] },
    { word: 'daí', out: ['de', 'aí'] },
    { word: 'dali', out: ['de', 'ali'] },
    { word: 'daquém', out: ['de', 'aquém'] },
    { word: 'dalém', out: ['de', 'além'] },
    { word: 'dentre', out: ['de', 'entre'] },
    { word: 'dantes', out: ['de', 'antes'] },
    { word: 'dacolá', out: ['de', 'acolá'] },
    { word: 'donde', out: ['de', 'onde'] },
    { word: 'pronde', out: ['para', 'onde'] },
    { word: 'pelaí', out: ['por', 'aí'] },

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
      world.model.one.unicode = unicode;

      world.model.one.contractions = contractions;

      // pt abbreviations for sentence parser
      Object.assign(world.model.one.abbreviations, abbreviations);

      // 'que' -> 'quebec'
      delete world.model.one.lexicon.que;
    }
  };

  const hasApostrophe = /['‘’‛‵′`´]/;

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

  const isTitleCase = function (str) {
    return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
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

  const oneLetterAcronym = /^[A-ZÄÖÜ]('s|,)?$/;
  const isUpperCase = /^[A-Z-ÄÖÜ]+$/;
  const periodAcronym = /([A-ZÄÖÜ]\.)+[A-ZÄÖÜ]?,?$/;
  const noPeriodAcronym = /[A-ZÄÖÜ]{2,}('s|,)?$/;
  const lowerCaseAcronym = /([a-zäöü]\.)+[a-zäöü]\.?$/;



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

  // const isTitleCase = function (str) {
  //   return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
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

  const clitics = { lo: true, la: true, los: true, las: true };
  // clitics that can appear mid-word in mesoclisis - 'dar-te-ei'
  const midClitics = {
    me: true, te: true, se: true, lhe: true, lhes: true,
    nos: true, vos: true, lo: true, la: true, los: true, las: true, o: true, a: true,
  };
  const futureEnds = /^(ei|ás|á|emos|eis|ão)$/;
  const conditionalEnds = /^(ia|ias|íamos|íeis|iam)$/;
  // allomorphs of o/a/os/as after a nasal sound - 'dão-no'
  const nasalClitics = { no: true, na: true, nos: true, nas: true };

  const verbPhrase = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let t = terms[i];
    // handle dropped-s in  'lavamo-nos' (lavamos + nos)
    if (terms[i + 1] && terms[i + 1].normal === 'nos') {
      if (/mo$/.test(t.normal)) {
        setTag([t], 'FirstPersonPlural', world, false, '2-dropped-s');
      }
    }
    // handle dropped-r in 'fazê-lo', 'amá-la' (fazer + o, amar + a)
    if (terms[i + 1] && clitics[terms[i + 1].normal] === true) {
      if (/[áêô]$/.test(t.normal)) {
        setTag([t], 'Infinitive', world, false, '2-dropped-r');
      }
    }
    // handle mesoclisis - 'dar-te-ei', 'dir-se-ia'
    if (terms[i + 2] && t.post === '-' && /r$/.test(t.normal) &&
      terms[i + 1].post === '-' && midClitics[terms[i + 1].normal] === true) {
      let end = terms[i + 2].normal;
      let tense = null;
      if (futureEnds.test(end)) {
        tense = 'FutureTense';
      } else if (conditionalEnds.test(end)) {
        tense = 'Conditional';
      }
      if (tense !== null) {
        setTag([t, terms[i + 2]], tense, world, false, '2-mesoclisis');
        setTag([terms[i + 1]], 'Reflexive', world, false, '2-mesoclisis');
      }
    }
    // handle clitic allomorphs after a nasal verb - 'dão-no' is dão + o, not 'em o'
    if (terms[i + 1] && t.post === '-' && /(ão|õe|m)$/.test(t.normal) && t.tags.has('Verb')) {
      let nxt = terms[i + 1];
      let txt = (nxt.text || '').toLowerCase();
      if (nasalClitics[txt] === true && nxt.implicit === 'em') {
        // undo the em+o contraction-split
        nxt.implicit = undefined;
        nxt.normal = txt;
        setTag([nxt], 'Reflexive', world, false, '2-nasal-clitic');
        // its ghost-term, from the split
        if (terms[i + 2] && terms[i + 2].text === '' && terms[i + 2].implicit) {
          terms[i + 2].implicit = undefined;
          terms[i + 2].normal = '';
          setTag([terms[i + 2]], 'Reflexive', world, false, '2-nasal-clitic');
        }
      }
    }
  };

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
      let found = titleCaseNoun(terms, i, world);
      // try look-like rules
      found = found || checkRegex(terms, i, world);
      // turn '1993' into a year
      tagYear(terms, i, world);
    }
  };
  const secondPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      let found = isAcronym(terms, i, world);
      found = found || suffixCheck(terms, i, world);
      found = found || verbPhrase(terms, i, world);
      // found = found || neighbours(terms, i, world)
      found = found || fallback(terms, i, world);
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
    // μg/g
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
      '5.30£',
    ],
    //like
    [/^[-+]?[$£]?[0-9]([0-9,.])+(usd|eur|jpy|gbp|cad|aud|chf|cny|hkd|nzd|kr|rub)$/i, ['Money', 'Value'], '$400usd'],

    //numbers
    // 50 | -50 | 3.23  | 5,999.0  | 10+
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\+?$/, ['Cardinal', 'NumericValue'], '5,999'],
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th|°)$/, ['Ordinal', 'NumericValue'], '53rd'],
    // .73th
    [/^\.[0-9]+\+?$/, ['Cardinal', 'NumericValue'], '.73th'],
    //percent
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?%\+?$/, ['Percent', 'Cardinal', 'NumericValue'], '-4%'],
    [/^\.[0-9]+%$/, ['Percent', 'Cardinal', 'NumericValue'], '.3%'],
    //fraction
    [/^[0-9]{1,4}\/[0-9]{1,4}(st|nd|rd|th)?s?$/, ['Fraction', 'NumericValue'], '2/3rds'],
    //range
    [/^[0-9.]{1,3}[a-z]{0,2}[-–—][0-9]{1,3}[a-z]{0,2}$/, ['Value', 'NumberRange'], '3-4'],
    //time-range
    [/^[0-9]{1,2}(:[0-9][0-9])?(am|pm)? ?[-–—] ?[0-9]{1,2}(:[0-9][0-9])?(am|pm)$/, ['Time', 'NumberRange'], '3-4pm'],
    //with unit
    [/^[0-9.]+([a-z]{1,4})$/, 'Value', '9km'],
  ];

  var regexText = [
    // #coolguy
    [/^#[a-z0-9_\u00C0-\u00FF]{2,}$/i, 'HashTag'],

    // @spencermountain
    [/^@\w{2,}$/, 'AtMention'],

    // period-ones acronyms - f.b.i.
    [/^([A-ZÄÖÜ]\.){2}[A-ZÄÖÜ]?/i, ['Acronym', 'Noun'], 'F.B.I'], //ascii-only

    // ending-apostrophes
    [/.{3}[lkmnp]in['‘’‛‵′`´]$/, 'Gerund', "chillin'"],
    [/.{4}s['‘’‛‵′`´]$/, 'Possessive', "flanders'"],
  ];

  // portuguese suffix-patterns, for guessing the tag of unknown words
  // (only applied to words that received no tag from the lexicon)
  const rb = 'Adverb';
  const nn = 'Noun';
  const jj = 'Adjective';
  const g = 'Gerund';
  const inf = 'Infinitive';
  const past = 'PastTense';
  const imp = 'Imperfect';
  const fut = 'FutureTense';
  const cond = 'Conditional';
  const subj = 'Subjunctive';
  const pp = 'PastParticiple';

  var suffixPatterns = [
    null,
    {
      // one-letter suffixes
    },
    {
      // two-letter suffixes
      ou: past, // falou, chegou
      iu: past, // partiu, caiu
      ei: past, // falei, comprei
    },
    {
      // three-letter suffixes
      'ção': nn, // nação
      'são': nn, // decisão
      oso: jj, // famoso
      osa: jj,
      ivo: jj, // ativo
      iva: jj,
      vel: jj, // amável, possível
      ndo: g, // falando, comendo, pondo
      ava: imp, // falava
      ado: pp, // falado
      ido: pp, // comido
      'ará': fut, // falará
      'erá': fut,
      'irá': fut,
    },
    {
      // four-letter suffixes
      'ções': nn, // nações
      'sões': nn, // decisões
      dade: nn, // verdade, cidade
      agem: nn, // viagem, coragem
      ismo: nn, // otimismo
      ista: nn, // dentista
      'ável': jj, // notável
      'ível': jj, // incrível
      ante: jj, // interessante
      ente: jj, // diferente
      izar: inf, // modernizar
      ecer: inf, // envelhecer
      ejar: inf, // desejar
      avam: imp, // falavam
      aram: past, // falaram
      eram: past, // comeram
      iram: past, // partiram
      'ámos': past, // falámos (european spelling)
      asse: subj, // falasse
      isse: subj, // partisse
      'arão': fut, // falarão
      'erão': fut,
      'irão': fut,
      arei: fut, // falarei
      erei: fut,
      irei: fut,
      'arás': fut, // falarás
    },
    {
      // five-letter suffixes
      mente: rb, // rapidamente
      mento: nn, // movimento
      'ência': nn, // paciência
      'ância': nn, // importância
      assem: subj, // falassem
      issem: subj, // partissem
      ariam: cond, // falariam
      eriam: cond,
      iriam: cond,
      'íamos': imp, // comíamos
    },
    {
      // six-letter suffixes
      'ríamos': cond, // falaríamos
      aremos: fut, // falaremos
      eremos: fut,
      iremos: fut,
      'ávamos': imp, // falávamos
      'íssimo': jj, // lindíssimo
      'íssima': jj,
    },
    {
      // seven-letter suffixes
      'ássemos': subj, // falássemos
      'êssemos': subj,
      'íssemos': subj,
    },
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
      preTagger: tagger
    },
    model: {
      two: model
    },
    // methods,
    hooks: ['preTagger']
  };

  const postTagger$1 = function (doc) {
    // oitenta e três
    doc.match('#Value [e] #Cardinal', 0).tag('Cardinal', 'val-e-val');
    doc.match('#Value [e] #Value', 0).tag('Value', 'val-e-val');

    doc.match('#Value e #Value e #Value').tag('Value', 'val-e-val');
    // vinte e uma
    doc.match('#Value e? (uma|um)').tag('Cardinal', 'val-e-uma');
    // uma milhão
    doc.match('(uma|um) #Value').tag('Value', 'uma-milhão');
    // menos noventa
    doc.match('menos #Value').tag('Value', 'menos-noventa');
    // cantar é bom
    doc.match('[#Infinitive] #Copula', 0).tag('Noun', 'gerund-noun');
    // a o => to the
    doc.match('[a] #Determiner', 0).tag('Preposition', 'to-the');
    // o jantar
    doc.match('o [#Infinitive]', 0).tag('Noun', 'o-verb');
    // Que chato!
    doc.match('^que #Adjective').tag('Expression', 'how-nice');
    // according to
    doc.match('^[segundo] #Noun').tag('Preposition', 'segundo-salles');

    // ==determiner + conjugated-verb is usually a noun==
    // 'uma fala', 'esse bolo', 'a melhor aluna'
    doc.match('(um|uma|uns|umas|este|esta|estes|estas|esse|essa|esses|essas|aquele|aquela|meu|minha|teu|tua|seu|sua|nosso|nossa) #Adjective? [#Verb]', 0)
      .ifNo('(#Copula|#Auxiliary)')
      .tag('Noun', 'det-verb-noun');
    // 'a verdade era..' - but not 'eu o vi', where o|a is a clitic pronoun
    doc.match('^(o|a|os|as) #Adjective? [#Verb]', 0).ifNo('(#Copula|#Auxiliary|#Infinitive)').tag('Noun', 'start-det-verb');
    doc.match('#Preposition (o|a|os|as) #Adjective? [#Verb]', 0).ifNo('(#Copula|#Auxiliary|#Infinitive)').tag('Noun', 'prep-det-verb');
    doc.match('#Verb (o|a|os|as) #Adjective? [#Verb]', 0).ifNo('(#Copula|#Auxiliary|#Infinitive)').tag('Noun', 'verb-det-verb');

    // 'preciso que..', 'eu preciso de ajuda' - verb-use of 'preciso'
    // but not 'o trabalho preciso', where it stays an adjective
    doc.match('^[preciso] (que|de|#Infinitive)', 0).tag('Verb', 'preciso-verb');
    doc.match('(#Pronoun|#Negative|#Adverb) [preciso] (que|de|#Infinitive)', 0).tag('Verb', 'pron-preciso-verb');

    // ==subjunctive context==
    // 'espero que fale', 'talvez ele venha', 'que você não fale'
    doc.match('(que|talvez|embora) (#Pronoun|#Negative)? (#Pronoun|#Negative)? [#Imperative]', 0).tag('Subjunctive', 'que-subjunctive');

    // 'se eu fosse' - conditional-if, not the reflexive pronoun
    doc.match('[se] (eu|tu|ele|ela|nós|vós|você|vocês|eles|elas)', 0).tag('Conjunction', 'se-if');

    // 'começou a chover' - 'a' + infinitive is a preposition
    doc.match('[a] #Infinitive', 0).tag('Preposition', 'a-infinitive');

    // ==clitic pronouns==
    // 'eu o vi', 'não a conheço' - accusative clitic, not a determiner
    doc.match('(#Pronoun|#Negative) [(o|a|os|as)] #Verb', 0).tag('Pronoun', 'clitic-acc');

    // ==compound tenses==
    // 'tenho falado' - present perfect
    doc.match('[(tenho|tens|tem|temos|tendes|têm)] #Adverb? #PastParticiple', 0).tag('Auxiliary', 'ter-participle');
    doc.match('(tenho|tens|tem|temos|tendes|têm) #Adverb? [#PastParticiple]', 0).tag('PerfectTense', 'present-perfect');
    // 'tinha falado', 'havia falado' - pluperfect
    doc.match('[(tinha|tinhas|tínhamos|tínheis|tinham|havia|havias|havíamos|havíeis|haviam)] #Adverb? #PastParticiple', 0).tag('Auxiliary', 'tinha-participle');
    doc.match('(tinha|tinhas|tínhamos|tínheis|tinham|havia|havias|havíamos|havíeis|haviam) #Adverb? [#PastParticiple]', 0).tag('Pluperfect', 'pluperfect-compound');
    // 'terá falado', 'teria falado', 'tenha falado' - other perfect forms
    doc.match('[(terei|terás|terá|teremos|tereis|terão|teria|terias|teríamos|teríeis|teriam|tenha|tenhas|tenhamos|tenham|tivesse|tivesses|tivéssemos|tivessem|tiver|tiveres|tivermos|tiverem)] #Adverb? #PastParticiple', 0).tag('Auxiliary', 'ter-fut-participle');
    doc.match('(terei|terás|terá|teremos|tereis|terão|teria|terias|teríamos|teríeis|teriam|tenha|tenhas|tenhamos|tenham|tivesse|tivesses|tivéssemos|tivessem|tiver|tiveres|tivermos|tiverem) #Adverb? [#PastParticiple]', 0).tag('PerfectTense', 'other-perfect');

    // ===auxiliary verbs==
    // está a comer
    doc.match('[{estar} a?] #Verb', 0).tag('Auxiliary', 'está-a-verb');
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

  var postTagger = {
    compute: {
      postTagger: postTagger$1
    },
    hooks: ['postTagger']
  };

  const entity = ['Person', 'Place', 'Organization'];

  var nouns$1 = {
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
    // 'não', 'nunca' - not a verb itself
    Negative: {
      not: ['Value'],
    },
    // modals stay fully-conjugated in portuguese - 'pudesse', 'deveria'
    // so don't strip their tense tags
    Modal: {
      is: 'Auxiliary',
    },
    PerfectTense: {
      is: 'Verb',
      not: ['Gerund'],
    },
    Pluperfect: {
      is: 'Verb',
    },
    PastParticiple: {
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
      not: ['Conjunction'],
    },
    Conditional: {
      is: 'Verb',
      not: ['Infinitive', 'Imperative'],
    },
    // clitic pronouns - 'me', 'se', 'te', 'nos'
    Reflexive: {
      is: 'Pronoun',
    },
    // sometimes 'pretérito'
    Perfecto: {
      is: 'Verb',
    },
    // moods
    Imperative: {
      is: 'Verb',
      not: ['Subjunctive']
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

  let tags = Object.assign({}, nouns$1, verbs$1, values, dates, misc);

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

  var data = {
    ones: [
      [1, 'um', 'primeiro'],    // [1, 'uma'],
      [2, 'dois', 'segundo'],    // [2, 'duos'],
      [3, 'três', 'terceiro'],
      [4, 'quatro', 'quarto'],
      [5, 'cinco', 'quinto'],
      [6, 'seis', 'sexto'],
      [7, 'sete', 'sétimo'],
      [8, 'oito', 'oitavo'],
      [9, 'nove', 'nono'],
      [10, 'dez', 'décimo'],
      [11, 'onze', 'décimo primeiro'],
      [12, 'doze', 'décimo segundo'],
      [13, 'treze', 'décimo terceiro'],
      [14, 'catorze', 'décimo quarto'],
      [15, 'quinze', 'décimo quinto'],
      [16, 'dezesseis', 'décimo sexto'],//    [16, 'dezasseis'],
      [17, 'dezessete', 'décimo sétimo'],//    [17, 'dezassete'],
      [18, 'dezoito', 'décimo oitavo'],
      [19, 'dezenove', 'décimo nono'],//    [19, 'dezanove'],
    ],
    tens: [
      [20, 'vinte', 'vigésimo'],
      [30, 'trinta', 'trigésimo'],
      [40, 'quarenta', 'quadragésimo'],
      [50, 'cinquenta', 'quinquagésimo'],
      [50, 'cinquenta', 'qüingentésimo'],
      [60, 'sessenta', 'sexagésimo'],
      [70, 'setenta', 'septuagésimo'],
      [80, 'oitenta', 'octogésimo'],
      [90, 'noventa', 'nonagésimo'],
    ],
    hundreds: [
      [100, 'cem', 'centésimo'],
      [200, 'duzentos', 'ducentésimo'],
      [300, 'trezentos', 'tricentésimo'],
      [300, 'trezentos', 'trecentésimo'],
      [400, 'quatrocentos', 'quadringentésimo'],
      [400, 'quatrocentos', 'quatrocentos'],
      [500, 'quinhentos', 'quincentésimo'],
      [500, 'quinhentos', ''],
      [600, 'seiscentos', 'sexcentésimo'],
      [600, 'seiscentos', ''],
      [700, 'setecentos', 'setingentésimo'],
      [700, 'setecentos', ''],
      [800, 'oitocentos', 'octingentésimo'],
      [800, 'oitocentos', ''],
      [900, 'novecentos', 'nongentésimo'],
    ],
    multiples: [
      [1000, 'mil', 'milésimo'],
      [1000000, 'milhão', 'milionésimo'],
      [1000000000, 'bilhão', 'bilionésimo'],
    ]
  };

  let toNumber = {};
  let toCardinal = {};
  let multiples$1 = {
    'cem': 100,
    'cento': 100,
    'centésimo': 100,
    'mil': 1000,
    'milésimo': 1000,
    'milhão': 1000000,
    'milhões': 1000000,
    'milionésimo': 1000000,
    'bilhão': 1000000000,
    'bilhões': 1000000000,
    'bilionésimo': 1000000000,
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
    cinqüenta: 50,
    qüinquagésimo: 50,
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
      num = fromText(terms);
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

  let ones = data.ones.reverse();
  let tens = data.tens.reverse();
  let hundreds = data.hundreds.reverse();

  let multiples = [
    [1000000000, 'bilhão', 'bilhões'],
    [1000000, 'milhão', 'milhões'],
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

  const formatNumber = function (parsed, fmt) {
    if (fmt === 'TextOrdinal') {
      let words = toText(parsed.num);
      return toTextOrdinal(words)
    }
    if (fmt === 'TextCardinal') {
      return toText(parsed.num).join(' ')
    }
    // numeric format - 107 -> '107°'
    if (fmt === 'Ordinal') {
      return String(parsed.num) + '°'
    }
    if (fmt === 'Cardinal') {
      return String(parsed.num)
    }
    return String(parsed.num || '')
  };

  // return the nth elem of a doc
  const getNth$3 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$3 = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth$3(this, n).map(parseNumber)
      }
      get(n) {
        return getNth$3(this, n).map(parseNumber).map(o => o.num)
      }
      json(n) {
        let doc = getNth$3(this, n);
        return doc.map(p => {
          let json = p.toView().json(n)[0];
          let parsed = parseNumber(p);
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
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          let str = formatNumber(obj, fmt);
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
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          let str = formatNumber(obj, fmt);
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
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          let str = formatNumber(obj, fmt);
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
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          let str = formatNumber(obj, fmt);
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
          let num = parseNumber(val).num;
          return num === n
        })
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter((val) => {
          let num = parseNumber(val).num;
          return num > n
        })
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter((val) => {
          let num = parseNumber(val).num;
          return num < n
        })
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter((val) => {
          let num = parseNumber(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parseNumber(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parseNumber(val);
          obj.num = n;
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (val.has('#TextValue')) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = formatNumber(obj, fmt);
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
          n = parseNumber(n).num;
        }
        let m = this;
        let res = m.map((val) => {
          let obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          obj.num += n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = formatNumber(obj, fmt);
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
      let m = findNumbers(this);
      m = getNth$3(m, n);
      return new Numbers(this.document, m.pointer)
    };
    // alias
    View.prototype.values = View.prototype.numbers;
  };

  var numbers = {
    api: api$3
  };

  const getNth$2 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$2 = function (m, methods) {
    let str = m.text('normal');
    let isPlural = m.has('#Plural');
    if (isPlural) {
      return methods.toSingular(str)
    }
    return str
  };

  const api$2 = function (View) {
    class Nouns extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Nouns';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.noun;
        return getNth$2(this, n).map(m => {
          let str = getRoot$2(m, methods);
          return {
            singular: str,
            plural: methods.toPlural(str),
            feminine: methods.toFeminine(str),
          }
        }, [])
      }
      toFeminine(n) {
        const methods = this.methods.two.transform.noun;
        const detMap = { o: 'a', os: 'as', um: 'uma', uns: 'umas' };
        getNth$2(this, n).forEach(m => {
          let str = getRoot$2(m, methods);
          let fem = methods.toFeminine(str);
          if (fem && fem !== str) {
            // agree the determiner - 'o professor' → 'a professora'
            let det = m.lookBehind('(o|os|um|uns)$').last();
            if (det.found) {
              det.replaceWith(detMap[det.text('normal')]);
            }
            m.replaceWith(fem);
          }
        });
        return this
      }
      isPlural(n) {
        return getNth$2(this, n).if('#PluralNoun')
      }
      toPlural(n) {
        const methods = this.methods.two.transform.noun;
        getNth$2(this, n).forEach(m => {
          let str = getRoot$2(m, methods);
          let plural = methods.toPlural(str);
          return m.replaceWith(plural)
        });
        return this
      }
      toSingular(n) {
        const methods = this.methods.two.transform.noun;
        getNth$2(this, n).if('#Plural').forEach(m => {
          let str = getRoot$2(m, methods);
          let plural = methods.toSingular(str);
          return m.replaceWith(plural)
        });
        return this
      }
    }

    View.prototype.nouns = function (n) {
      let m = this.match('#Noun+');
      m = getNth$2(m, n);
      return new Nouns(this.document, m.pointer)
    };
  };

  var nouns = {
    api: api$2,
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

  const api$1 = function (View) {
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

  var adjectives = {
    api: api$1,
  };

  const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of verb
  const getRoot = function (m) {
    m.compute('root');
    m = m.not('(#Auxiliary|#Adverb|#Negative|#Reflexive)');
    let str = m.text('root');
    return str
  };

  // which person is this verb-phrase in?
  const personMap = {
    eu: 'first',
    tu: 'second',
    ele: 'third', ela: 'third', 'você': 'third',
    'nós': 'firstPlural',
    'vós': 'secondPlural',
    'vocês': 'thirdPlural', eles: 'thirdPlural', elas: 'thirdPlural',
  };
  const getPerson = function (m) {
    if (m.has('#FirstPersonPlural')) {
      return 'firstPlural'
    }
    if (m.has('#SecondPersonPlural')) {
      return 'secondPlural'
    }
    if (m.has('#ThirdPersonPlural')) {
      return 'thirdPlural'
    }
    if (m.has('#FirstPerson')) {
      return 'first'
    }
    if (m.has('#SecondPerson')) {
      return 'second'
    }
    if (m.has('#ThirdPerson')) {
      return 'third'
    }
    // look at the subject-pronoun, before the verb
    let subj = m.lookBehind('(eu|tu|ele|ela|você|nós|vós|vocês|eles|elas)$');
    if (subj.found) {
      return personMap[subj.last().text('normal')] || 'third'
    }
    return 'third'
  };

  // re-conjugate each verb-phrase, in-place
  const convertTo = function (view, method) {
    const methods = view.methods.two.transform.verb;
    view.forEach(m => {
      let str = getRoot(m);
      if (!str) {
        return
      }
      let person = getPerson(m);
      let obj = methods[method](str);
      let form = obj[person] || obj.third;
      if (form) {
        m.replaceWith(form);
      }
    });
    return view
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
          toInfinitivo,
          toSubjPresent,
          toSubjImperfect,
          toSubjFuture } = methods;
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
            SubjunctivePresent: toSubjPresent(str),
            SubjunctiveImperfect: toSubjImperfect(str),
            SubjunctiveFuture: toSubjFuture(str),
            Gerund: toGerund(str),
            PastParticiple: toPastParticiple(str),
          }
        }, [])
      }
      toPastTense(n) {
        return convertTo(getNth(this, n), 'toPastTense')
      }
      toPresentTense(n) {
        return convertTo(getNth(this, n), 'toPresentTense')
      }
      toFutureTense(n) {
        return convertTo(getNth(this, n), 'toFutureTense')
      }
      toImperfect(n) {
        return convertTo(getNth(this, n), 'toImperfect')
      }
      toConditional(n) {
        return convertTo(getNth(this, n), 'toConditional')
      }
      toGerund(n) {
        const methods = this.methods.two.transform.verb;
        getNth(this, n).forEach(m => {
          let str = getRoot(m);
          if (!str) {
            return
          }
          let gerund = methods.toGerund(str);
          if (gerund) {
            m.replaceWith(gerund);
          }
        });
        return this
      }
      toInfinitive(n) {
        getNth(this, n).forEach(m => {
          let str = getRoot(m);
          if (str) {
            m.replaceWith(str);
          }
        });
        return this
      }
    }

    View.prototype.verbs = function (n) {
      let m = this.match('#Verb+');
      m = getNth(m, n);
      return new Verbs(this.document, m.pointer)
    };
  };

  var verbs = {
    api,
  };

  var version = '0.0.5';

  nlp.plugin(tokenizer);
  nlp.plugin(tagset);
  nlp.plugin(lexicon);
  nlp.plugin(preTagger);
  nlp.plugin(postTagger);
  nlp.plugin(nouns);
  nlp.plugin(adjectives);
  nlp.plugin(verbs);
  nlp.plugin(numbers);


  const es = function (txt, lex) {
    return nlp(txt, lex)
  };

  // copy constructor methods over
  Object.keys(nlp).forEach(k => {
    if (nlp.hasOwnProperty(k)) {
      es[k] = nlp[k];
    }
  });

  // this one is hidden
  Object.defineProperty(es, '_world', {
    value: nlp._world,
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
