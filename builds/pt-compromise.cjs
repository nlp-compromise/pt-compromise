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

  const fns$4 = {
    /** add metadata to term objects */
    compute: function (input, options) {
      const { world } = this;
      const compute = world.compute;
      // do one method
      if (typeof input === 'string' && Object.hasOwn(compute, input)) {
        compute[input](this, options);
      }
      // allow a list of methods
      else if (Array.isArray(input)) {
        input.forEach(name => {
          if (Object.hasOwn(world.compute, name)) {
            compute[name](this, options);
          } else {
            console.warn('no compute:', input); // eslint-disable-line
          }
        });
      }
      // allow a custom compute function
      else if (typeof input === 'function') {
        input(this, options);
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

  const methods$m = { ...utils, ...fns$4, ...loops };

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
        start ||= 0;
        end ||= (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n]?.[start]) {
          id ||= document[n][start].id;
          if (document[n][end - 1]) {
            endId ||= document[n][end - 1].id;
          }
        }
        return [n, start, end, id, endId]
      })
    }
    // create a new View, from this one
    update(pointer) {
      const m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer?.length > 0) {
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
          term = { ...term };
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

  var version$1 = '14.19.0';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
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
      model[key] ||= {};
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
    if (Array.isArray(plugin)) {
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

  // Shared CLI colors and styles.
  const color = code => s => '\x1b[' + code + 'm' + s + '\x1b[0m';

  const green = color(32);
  const red = color(31);
  const blue = color(34);
  const magenta = color(35);
  const cyan = color(36);
  const yellow = color(33);
  const black = color(30);
  const white = color(37);
  const dim = color(2);
  const i$1 = color(3);
  const b = color(1);
  const ul = color(4);
  const grey = color(90);

  var cli$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    b: b,
    black: black,
    blue: blue,
    cyan: cyan,
    dim: dim,
    green: green,
    grey: grey,
    i: i$1,
    magenta: magenta,
    red: red,
    ul: ul,
    white: white,
    yellow: yellow
  });

  const env = globalThis.process?.env ?? globalThis.env ?? {};
  const debug$3 = { tags: Boolean(env.DEBUG_TAGS) };

  // Capture only the requested terms, and only while tracing.
  const before$1 = term => {
    if (debug$3.tags && (!debug$3.word || debug$3.word === (term.normal || term.text || term.implicit || '').toLowerCase())) {
      return [...term.tags]
    }
    return null
  };

  // Show actual changes, including conflict removals.
  const log = (term, previous, reason = '') => {
    if (!previous) {
      return
    }
    const added = [...term.tags].filter(tag => !previous.includes(tag));
    const removed = previous.filter(tag => !term.tags.has(tag));
    if (!added.length && !removed.length) {
      return
    }
    const text = term.text || term.implicit || '';
    const index = term.index?.join(':') || '?';
    const prefix = debug$3.prefix || '   ';
    if (debug$3.rule !== reason) {
      const headingPrefix = debug$3.prefix ? prefix.replace('│  ', '│ ') : '  ';
      console.log(`${headingPrefix}${dim(white((reason || 'tag change') + ':'))}`); // eslint-disable-line no-console
      debug$3.rule = reason;
    }
    const print = (tags, sign, color) => {
      if (!tags.length) {
        return
      }
      const word = color(`'${text}'`);
      const changes = tags.map(tag => color(`#${tag}`)).join(' ');
      console.log(`${prefix}${color(sign)} ${word} ${dim(index.padEnd(9))} ${changes}`); // eslint-disable-line no-console
    };
    print(removed, '−', red);
    print(added, '+', green);
  };

  debug$3.before = before$1;
  debug$3.log = log;

  // Install only while verbose matching is enabled; restore the original hot path.
  const matchDebug = (world, options) => {
    const one = world.methods.one;
    const match = one.match;
    const parse = one.parseMatch;
    const sources = new WeakMap();
    const word = options.word?.toLowerCase();
    const includesWord = terms =>
      !word || terms.some(term => (term.normal || term.text || term.implicit || '').toLowerCase() === word);

    const parseLogged = function (...args) {
      const regs = parse.apply(this, args);
      sources.set(regs, String(args[0]));
      return regs
    };
    const matchLogged = function (docs, todo, cache) {
      const result = match.call(this, docs, todo, cache);
      const pattern = todo.match || sources.get(todo.regs) || '[parsed pattern]';
      if (options.pattern !== undefined && pattern !== options.pattern) {
        return result
      }
      if (word && !docs.some(includesWord)) {
        return result
      }
      const matches = result.ptrs
        .map(([n, start, end]) => docs[n].slice(start, end))
        .filter(includesWord);
      if (word && result.ptrs.length && !matches.length) {
        return result
      }
      debug$3.rule = undefined;
      const status = result.ptrs.length ? green('✓') : red('✗');
      const spans = matches.map(terms => {
        const text = terms.map(term => term.text || term.implicit).join(' ');
        return `${green("'" + text + "'")} ${dim(terms[0]?.index?.join(':') || '?')}`
      }).join(', ');
      const rule = pattern.length > 80 ? pattern.slice(0, 79) + '…' : pattern;
      const words = spans ? spans + '  ' : ' ---         ';
      console.log(`${debug$3.prefix || '   '}${status} ${words}${dim(i$1(rule))}`); // eslint-disable-line no-console
      return result
    };
    one.parseMatch = parseLogged;
    one.match = matchLogged;
    return () => {
      // Do not overwrite a plugin's replacement installed during tracing.
      if (one.parseMatch === parseLogged) {
        one.parseMatch = parse;
      }
      if (one.match === matchLogged) {
        one.match = match;
      }
    }
  };

  const colorSpec = doc => {
    return doc.docs
      .map((terms, index) => {
        const plain = terms
          .map(t => t.pre + t.text + t.post)
          .join('')
          .trim();
        const text = dim("'" + plain + "'");
        const spec = doc.update([[index]]).out('spec');
        return text + grey(i$1(spec.slice(plain.length)))
      })
      .join('\n')
  };

  // Trace the actual pipeline once, including the initial tokenized document.
  const hooksDebug = headings => (doc, hooks) => {
    const width = Math.max('tokenize'.length, ...hooks.map(hook => hook.length));
    const snapshot = (hook, nested = false) => {
      const output = colorSpec(doc);
      output.split('\n').forEach((line, index, lines) => {
        if (nested) {
          const branch = index === lines.length - 1 ? ' ╰─' : '│ ';
          console.log(`  ${dim(branch)} ${line}`); // eslint-disable-line no-console
          return
        }
        const label = (index === 0 ? hook : '').padEnd(width);
        console.log(`  ${dim(label)}  ${line}`); // eslint-disable-line no-console
      });
    };
    snapshot('tokenize');
    hooks.forEach(hook => {
      const nested = headings;
      const prefix = debug$3.prefix;
      const rule = debug$3.rule;
      debug$3.rule = undefined;
      if (nested) {
        console.log(`  ${blue(b(ul(hook + ':')))}`); // eslint-disable-line no-console
        debug$3.prefix = dim('   │  ');
      }
      // Restore the log prefix even when a plugin hook throws.
      try {
        doc.compute(hook);
        snapshot(hook, nested);
      } finally {
        debug$3.prefix = prefix;
        debug$3.rule = rule;
      }
    });
  };

  let restoreMatch;

  /** log the decision-making to console */
  const verbose = function (set = true, options = {}) {
    restoreMatch?.();
    restoreMatch = undefined;
    if (set === 'match' || set === true) {
      restoreMatch = matchDebug(this._world, options);
    }
    const env = globalThis.process?.env ?? globalThis.env ?? {}; //use window, in browser
    debug$3.hooks = set === 'hooks' || set === true ? hooksDebug(set === true) : undefined;
    debug$3.word = options.word?.toLowerCase();
    debug$3.contractions = set === 'contractions' || set === true;
    debug$3.rule = undefined;
    debug$3.tags = set === 'tagger' || set === true;
    env.DEBUG_TAGS = debug$3.tags ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    return this
  };

  const isObject$5 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (Array.isArray(term.tags)) {
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
    if (Array.isArray(input)) {
      // pre-tokenized array-of-arrays 
      if (Array.isArray(input[0])) {
        const document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      const document = fromJson(input);
      return new View(document)
    }
    return doc
  };

  const world = { ...tmpWrld };

  const nlp = function nlp(input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    const doc = inputs(input, View, world);
    if (input) {
      if (debug$3.hooks) {
        debug$3.hooks(doc, world.hooks);
      } else {
        doc.compute(world.hooks);
      }
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
    if (debug$3.hooks) {
      debug$3.hooks(doc, compute.contractions ? ['alias', 'normal', 'machine', 'contractions'] : []);
    } else if (compute.contractions) {
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

  // log the decision-making to console
  nlp.verbose = verbose;
  // current library release version
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
        term.tags.forEach(tag => {
          items.add('#' + tag);
        });
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
      parent.splice(index, 0, ...child);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    const lastTerm = terms.at(-1);
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
      const last = needle.at(-1);
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
        needle.at(-1).post += ' ';
      }
    }
    spliceArr(home, ptr[2], needle);
    // set new endId
    ptr[4] = needle.at(-1).id;
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
    if (Array.isArray(input)) {
      return Array.isArray(input[0]) ? input[0] : input
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
      if (document[n]?.[ptr[1]]) {
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
      if (Object.hasOwn(groups, num)) {
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
    const isOriginalPossessive = keep.possessives && terms.at(-1).tags.has('Possessive');
    const isOriginalTitleCase = keep.case && isTitleCase$1(terms[0].text);
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    const original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    const originalPre = original.docs[0][0].pre;
    const originalPost = original.docs[0].at(-1).post;
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
      const term = tmp.at(-1);
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
      const lastOne = main.docs[0].at(-1);
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

  // Remove only the first qualifying run, matching String.replace without /g.
  const removeRunBefore = (str, run, following) => {
    let i = 0;
    while (i < str.length) {
      if (!run.includes(str[i])) {
        i++;
        continue
      }
      const start = i;
      while (i < str.length && run.includes(str[i])) i++;
      if (i < str.length && following.includes(str[i])) {
        return str.slice(0, start) + str.slice(i)
      }
    }
    return str
  };

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    const last = terms.length - 1;
    const from = terms[last];
    const to = terms[last - len];
    if (to && from) {
      to.post += from.post; //this isn't perfect.
      to.post = removeRunBefore(to.post, ' ', '.?!,;:');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = removeRunBefore(to.post, ',;:', '.?!');
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
          const lastTerm = terms.at(-1);
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
        const last = this.docs.at(-1);
        return last.at(-1).post
      }
      this.docs.forEach(terms => {
        const term = terms.at(-1);
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
      const last = docs.at(-1);
      const end = last.at(-1);
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
      start ||= `"`;
      end ||= `"`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        const last = terms.at(-1);
        last.post = end + last.post;
      });
      return this
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      start ||= `(`;
      end ||= `)`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        const last = terms.at(-1);
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
    const counts = Object.create(null);
    arr.forEach(o => {
      counts[o.normal] ??= 0;
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
    input ||= 'alpha';
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

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      const end = homeDocs.at(-1);
      const last = end.at(-1);
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
          const at = ptrs.at(-1)[0];
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
      if (Array.isArray(input)) {
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
    if (!ptr || ptr.length === 0) {
      return this
    }
    ptr = ptr.map(a => a.slice(0, 3));
    this.ptrs = ptr;
    return this
  };
  var harden$1 = { harden, soften };

  const methods$g = { ...caseFns, ...fns$3, ...fns$2, ...methods$j, ...methods$i, ...sort$1, ...concat, ...harden$1 };

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$g);
  };

  const compute$5 = {
    id: function (view) {
      const docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          const term = docs[n][i];
          term.id ||= toId(term);
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
  const t = true;
  var numberSuffixes = {
    'st': t,
    'nd': t,
    'rd': t,
    'th': t,
    'am': t,
    'pm': t,
    'max': t,
    '°': t,
    's': t, // 1990s
    'e': t, // 18e - french/spanish ordinal
    'er': t, //french 1er
    'ère': t, //''
    'ème': t, //french 2ème
  };

  var model$5 = {
    one: {
      contractions: contractions$2,
      numberSuffixes
    }
  };

  // Log decisions before splicing replaces the original term.
  const contractionDebug = (term, expansion) => {
    if (!debug$3.contractions || (debug$3.word && debug$3.word !== (term.normal || term.text).toLowerCase())) {
      return
    }
    debug$3.rule = undefined;
    const result = expansion ? '[' + expansion.map(word => yellow(`'${word}'`)).join(', ') + ']' : 'possessive (kept)';
    console.log(`${debug$3.prefix || '   '}${yellow(JSON.stringify(term.text))} →  ${result}`); // eslint-disable-line no-console
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
      if (Object.hasOwn(notUnit, unit)) {
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

  const toDocs = function (words, view, term) {
    contractionDebug(term, words);
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
        if (!words && Object.hasOwn(byEnd, after)) {
          words = byEnd[after](terms, i, world);
        }
        // ['j', 'aime']
        if (!words && Object.hasOwn(byStart, before)) {
          words = byStart[before](terms, i);
        }
        // 'there is' vs 'there has'
        if (before === 'there' && after === 's') {
          words = thereHas(terms, i);
        }
        // actually insert the new terms
        if (words) {
          words = toDocs(words, view, terms[i]);
          insertContraction(document, [n, i], words);
          reTag(document[n], view, i, words.length);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange(terms, i);
          if (words) {
            words = toDocs(words, view, terms[i]);
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
          words = toDocs(words, view, terms[i]);
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
            if (Object.hasOwn(frozenLex, str) === true) {
              setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
              words.forEach(term => (term.frozen = true));
              continue
            }
          }
        }
        // test single word
        if (frozenLex[word] !== undefined && Object.hasOwn(frozenLex, word)) {
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

  const debug$2 = function (view) {
    view.docs.forEach(terms => {
      console.log(blue('\n  ╭─────────'));
      terms.forEach(t => {
        let str = `  ${i$1(dim('│'))}  `;
        const txt = t.implicit || t.text || '-';
        if (t.frozen === true) {
          str += `${blue(txt)} ❄️`;
        } else {
          str += i$1(dim(txt));
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
        if (Object.hasOwn(lexicon, str) === true) {
          const tag = lexicon[str];
          // 'is off-white' is not the phrasal verb 'is off'.
          if (tag && tag.includes('PhrasalVerb') && words[words.length - 1].post === '-') {
            continue
          }
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
    if (lexicon[word] !== undefined && Object.hasOwn(lexicon, word)) {
      setTag([t], lexicon[word], world, false, '1-lexicon');
      return true
    }
    // '#gojetsgo' can be in the lexicon with its hash
    if (t.machine && Object.hasOwn(lexicon, t.normal)) {
      setTag([t], lexicon[t.normal], world, false, '1-lexicon-normal');
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      const found = t.alias.find(str => Object.hasOwn(lexicon, str));
      if (found) {
        setTag([t], lexicon[found], world, false, '1-lexicon-alias');
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$1.test(word) === true) {
      const stem = word.replace(prefix$1, '');
      if (Object.hasOwn(lexicon, stem) && stem.length > 3) {
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
          found ||= multiWord(terms, i, world);
          // lookup known words
          found ||= checkLexicon(terms, i, world);
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
      lex[word] ||= tag;
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
        if (goNext[curr] && Object.hasOwn(goNext[curr], word)) {
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

    while (xs.length > 0) {
      const r = xs.shift();
      // for each symbol a such that g(r, a) = s
      const keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        const word = keys[i];
        const s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !Object.hasOwn(goNext[n], word)) {
          n = failTo[n];
        }
        if (Object.hasOwn(goNext, n)) {
          const fs = goNext[n][word];
          failTo[s] = fs;
          if (endAs[fs]) {
            endAs[s] ||= [];
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
      while (n > 0 && (trie.goNext[n] === undefined || !Object.hasOwn(trie.goNext[n], word))) {
        n = trie.failTo[n] || 0; // (usually back to 0)
      }
      // did we fail?
      if (!Object.hasOwn(trie.goNext[n], word)) {
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
    opts.form ||= 'normal';
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

  const getDoc$2 = (reg, view, group) => {
    if (typeof reg === 'string' || Array.isArray(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
  };

  const addIds$1 = function (ptr, view) {
    const [n, start, end] = ptr;
    if (view.document[n]?.[start]) {
      ptr[3] ||= view.document[n][start].id;
      if (view.document[n][end - 1]) {
        ptr[4] ||= view.document[n][end - 1].id;
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
      if (!all[i].after && all[i + 1]?.before) {
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
    lMatch ||= '.$'; //defaults
    rMatch ||= '^.';
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

  const methods$c = { ...match$2, ...lookaround, ...methods$e, ...methods$d };
  // aliases
  methods$c.lookBehind = methods$c.before;
  methods$c.lookBefore = methods$c.before;

  methods$c.lookAhead = methods$c.after;
  methods$c.lookAfter = methods$c.after;

  methods$c.notIf = methods$c.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$c);
  };

  // Split parenthesized match blocks without retrying long rejected prefixes or
  // bodies. Preserve the original grammar, including its greedy capture header.
  const prefix = new Set('!~[^');
  const suffix = new Set('?]+*$~');
  const whitespace$1 = /\s/;

  const splitGroups = str => {
    if (!str.includes('(') || !str.includes(')')) return [str]
    const length = str.length;
    const afterSuffix = new Uint32Array(length + 1);
    const bodyEnd = new Uint32Array(length);
    const captureEnd = new Uint32Array(length);
    afterSuffix[length] = length;
    let close = -1;
    let capture = 0;
    for (let i = length - 1; i >= 0; i--) {
      afterSuffix[i] = suffix.has(str[i]) ? afterSuffix[i + 1] : i;
      if (str[i] === ')') close = i;
      if (str[i] === '(' && close >= i + 3 && str[close - 1] !== '\\') {
        const end = afterSuffix[close + 1];
        if (end === length || whitespace$1.test(str[end])) bodyEnd[i] = end;
      }
      // The optional <...> header cannot cross another '<', and prefers the
      // rightmost '>' which is followed by a valid parenthesized block.
      if (str[i] === '<') {
        captureEnd[i] = capture;
        capture = 0;
      } else if (str[i] === '>' && !capture && bodyEnd[i + 1]) {
        capture = bodyEnd[i + 1];
      }
    }
    const parts = [];
    let previous = 0;
    let i = 0;
    while (i < length) {
      const start = i;
      while (i < length && prefix.has(str[i])) i++;
      const end = str[i] === '<' ? captureEnd[i] : bodyEnd[i];
      if (end) {
        parts.push(str.slice(previous, start), str.slice(start, end));
        // The old delimiter consumes one following whitespace character.
        i = end < length ? end + 1 : end;
        previous = i;
      } else if (i === start) {
        i++;
      }
    }
    parts.push(str.slice(previous));
    return parts
  };

  // match  'foo /yes/' and not 'foo/no/bar'
  const bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
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
      res = res.concat(splitGroups(str));
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
  const captureName = /^<\s*([^\s>]+)\s*>/;
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
  const parseToken = function (w, opts, aliases) {
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
          if (!res) {
            throw new SyntaxError('Invalid named capture: expected [<name> ...]')
          }
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
        obj.min = opts.fuzzy ?? 0.85;
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
          return str.split(/ /g).map(s => parseToken(s, opts, aliases))
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
      const name = stripStart(w);
      obj.tag = aliases?.[name];
      if (!obj.tag) {
        obj.tag = titleCase(name);
        obj.tag = aliases?.[obj.tag] || obj.tag;
      }
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

  // Text recognition, rather than full email/URL validation. Share these rules with
  // the tagger so hyphens in recognized addresses survive tokenization.
  const email = /^[\w.!#$%&'*+/=?^`{|}~-]+@(?:[\w-]+\.)+[a-z]{2,}$/i;
  const explicitUrl = /^(?:https?:(?:\/\/)?|www\.)(?:[a-z0-9-]+\.)+[a-z]{2,}(?::[0-9]+)?(?:[/?#]\S*)?$/i;
  const bareUrl = /^(?:[a-z0-9-]+\.)+(?:com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)(?::[0-9]+)?(?:[/?#]\S*)?$/i;

  const isWebToken = function (str) {
    if (!str.includes('.')) {
      return false
    }
    let start = 0;
    let end = str.length;
    while (start < end && /[\s("'“‘<]/.test(str[start])) start++;
    while (end > start && /[\s).,!?:;"'”’>]/.test(str[end - 1])) end--;
    const text = str.slice(start, end);
    return email.test(text) || explicitUrl.test(text) || bareUrl.test(text)
  };

  const hasHyphen$1 = function (str, model) {
    const parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    if (isWebToken(str)) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    // l-theanine, x-ray
    if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
      return false
    }
    //dont split 're-do'
    if (Object.hasOwn(prefixes, parts[0])) {
      return false
    }
    //dont split 'flower-like'
    parts[1] = parts[1].trim().replace(/[.?!]$/, '');
    if (Object.hasOwn(suffixes, parts[1])) {
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

  const splitHyphens$1 = function (word) {
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

  // match 're-do' -> ['re','do']
  // split them the same way the tokenizer does - 'x-ray' stays one word
  const splitHyphens = function (regs, world) {
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      const reg = regs[i];
      if (reg.word && hasHyphen$1(reg.word, world.model)) {
        let words = reg.word.split(/[-–—]/g);
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          const obj = { ...reg };
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
    opts ||= {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken(str, opts, world.model.one.tagAliases));
    // '~re-do~'
    tokens = splitHyphens(tokens, world);
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

  const hasHyphen = /^[-–—]$/;
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
    hasHyphen: term => hasHyphen.test(term.post) || hasHyphen.test(term.pre),
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
      if (reg.regex.global || reg.regex.sticky) {
        const lastIndex = reg.regex.lastIndex;
        try {
          reg.regex.lastIndex = 0;
          return reg.regex.test(str)
        } finally {
          reg.regex.lastIndex = lastIndex;
        }
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
    const reg = { ...state.regs[state.r], start: false, end: false };
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
        const tmpReg = { ...reg, end: false };
        if (wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  const getGroup$1 = function (state, term_index) {
    // Most attempts fail without capturing anything.
    if (!state.groups) {
      state.groups = {};
    }
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
    if (skipto === null || skipto === state.offset) {
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
        const gr = { ...cr, start: false, end: false };
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
      if (!Array.isArray(regs)) {
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
    const tmpReg = { ...reg };
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
    if (state.t - state.offset > 1 && reg.greedy) {
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
  const tryHere = function (terms, regs, start_i, phrase_length, offset = 0) {
    // console.log(`\n\n:start: '${terms[0].text}':`)
    if (offset >= terms.length || regs.length === 0) {
      return null
    }
    // Use the original terms with a cursor instead of copying the remaining
    // sentence at every starting position. origin maps array indices to match
    // pointers; offset marks the beginning of this attempt within the array.
    const origin = start_i - offset;
    const state = {
      t: offset,
      offset: offset,
      terms: terms,
      r: 0,
      regs: regs,
      groups: null,
      start_i: origin,
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
    const pntr = [null, start_i, state.t + origin];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    const groups = {};
    if (state.groups) {
      Object.keys(state.groups).forEach(k => {
        const o = state.groups[k];
        const start = origin + o.start;
        groups[k] = [null, start, start + o.length];
      });
    }
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
          byGroup[k] ||= [];
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
        const found = tryHere(terms, not, i, terms.length, i);
        if (found !== null) {
          return false
        }
      }
      return true
    });
    return results
  };

  // Compiled sweeps cache this check; editable public patterns are rechecked.
  const isFixed = regs => regs.every(reg => !reg.optional && !reg.greedy &&
    !reg.negative && !reg.choices && !reg.anything &&
    (reg.word !== undefined || reg.tag !== undefined || reg.switch !== undefined || reg.fastOr !== undefined));

  const fromFixed = (terms, regs, start, length, offset = 0) => {
    if (offset + regs.length > terms.length) {
      return null
    }
    for (let r = 0; r < regs.length; r += 1) {
      const term = terms[offset + r];
      // A literal contraction can consume more than one term.
      if (term.implicit) {
        return tryHere(terms, regs, start, length, offset)
      }
      if (wrapMatch(term, regs[r], start + r, length) !== true) {
        return null
      }
    }
    // Failed attempts never need capture state.
    const groups = {};
    for (let r = 0; r < regs.length; r += 1) {
      const name = regs[r].group;
      if (name) {
        if (!groups[name]) {
          groups[name] = [null, start + r, start + r];
        }
        groups[name][2] += 1;
      }
    }
    return { pointer: [null, start, start + regs.length], groups }
  };

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n, attempt) {
    let res = attempt(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$1 = function (docs, todo, cache) {
    cache ||= [];
    const { regs, group, justOne, checkFirst } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }
    const attempt = (todo.fixed ?? isFixed(regs)) ? fromFixed : tryHere;

    // Compiled rules carry this value; public parsed patterns can still be edited
    // by callers, so calculate their minimum without caching on the token array.
    let minLength = todo.minLength;
    if (minLength === undefined) {
      minLength = 0;
      for (let i = 0; i < regs.length; i += 1) {
        const reg = regs[i];
        if (reg.optional !== true && reg.negative !== true) {
          minLength += 1;
        }
      }
    }
    docs: for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        const foundStart = handleStart(terms, regs, n, attempt);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        // ensure it's long-enough
        if (terms.length - i < minLength) {
          break
        }
        // Compiled sweep rules can reject a start before allocating match state.
        if (checkFirst && !wrapMatch(terms[i], regs[0], i, terms.length)) {
          continue
        }
        let res = attempt(terms, regs, i, terms.length, i);
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
    str = str.replaceAll('&', '&amp;');
    str = str.replaceAll('<', '&lt;');
    str = str.replaceAll('>', '&gt;');
    str = str.replaceAll('"', '&quot;');
    str = str.replaceAll("'", '&apos;');
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
        starts[a] ||= [];
        starts[a].push(tag.start);
        const b = terms.at(-1).id;
        ends[b] ||= [];
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
        if (Object.hasOwn(starts, t.id)) {
          out += starts[t.id].join('');
        }
        out += t.pre || '';
        out += t.text || '';
        if (Object.hasOwn(ends, t.id)) {
          out += ends[t.id].join('');
        }
        out += t.post || '';
      }
    });
    return out
  };
  var html$1 = { html };

  // Walk the trailing punctuation run once, rather than retrying at every offset.
  const endPunctuation = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]/;
  const trimEnd = str => {
    let end = str.length;
    while (end > 0 && endPunctuation.test(str[end - 1])) end--;
    return str.slice(0, end)
  };
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4\]]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach(t => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
        pre = pre.replace(/[,،]/g, '');
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
        post = post.replace(/[,،…]|\.{2,}/g, '');
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
          post = trimEnd(post);
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
      const last = docs.at(-1);
      if (!last.at(-1).tags.has('Emoticon')) {
        text = trimEnd(text);
        // removing a spaced dash leaves its space behind
        if (!opts.keepSpace) {
          text = text.trimEnd();
        }
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

  const fmts$1 = {
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
  fmts$1.clean = fmts$1.normal;
  fmts$1.reduced = fmts$1.root;

  /* eslint-disable no-bitwise, no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  const k = [];
  let i = 0;
  for (; i < 64; i++) {
    k[i] = 0 | (Math.sin((i + 1) % Math.PI) * 4294967296);
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

    for (i = j = 0; i < s; i += 16) {
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
              ~~words[i | ([j, 5 * j + 1, 3 * j + 5, 7 * j][a] & 15)]) <<
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
    return { ...a, ...b }
  };

  const fns$1 = {
    text: terms => textFromTerms(terms, { keepPunct: true }, false),
    normal: terms => textFromTerms(terms, merge(fmts$1.normal, { keepPunct: true }), false),
    implicit: terms => textFromTerms(terms, merge(fmts$1.implicit, { keepPunct: true }), false),

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
      return terms.map(t => ({ ...t, tags: [...t.tags] }))
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
    option ||= {};
    if (typeof option === 'string') {
      option = {};
    }
    option = { ...defaults$1, ...option };
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

  // Output the requested format, or the platform's default console view.
  const debug$1 = function (fmt) {
    const debugMethods = this.methods.one.debug || {};
    if (!fmt || !Object.hasOwn(debugMethods, fmt)) {
      fmt = isClientSide() ? 'clientSide' : 'tags';
    }
    debugMethods[fmt](this);
    return this
  };

  const toText$2 = function (term) {
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
        if (Object.hasOwn(starts, t.id)) {
          const { fn, end } = starts[t.id];
          const m = doc.update([[n, i, end]]);
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
    return entry.parents.at(-1)
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

  const makeAliases = function (tagSet, registered) {
    const aliases = Object.create(null);
    for (const tag in tagSet) {
      const entry = tagSet[tag];
      // A leading null explicitly keeps the canonical name.
      const preferred = entry.aliases === undefined ? entry.alias : entry.aliases[0];
      if (preferred && registered[preferred] === tag) {
        aliases[tag] = preferred;
      }
    }
    return aliases
  };

  // one line per sentence: '<text> {Tag,Tag,…}'
  const toSpec = function (doc, world) {
    const tagSet = world.model.one.tagSet;
    const aliases = makeAliases(tagSet, world.model.one.tagAliases);
    return doc.docs.map(terms => {
      const text = terms.reduce((str, t) => str + t.pre + t.text + t.post, '').trim();
      const tags = terms.map(t => {
        const tag = slotForTerm(t, tagSet);
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
    const counts = new Map();
    arr.forEach(word => {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });
    const res = Array.from(counts, ([normal, count]) => ({ normal, count }));
    return res.sort((a, b) => b.count - a.count)
  };

  /** some named output formats */
  const out$1 = function (method) {
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
      return this.docs.flatMap(terms => terms.map(t => t.text).filter(Boolean))
    }
    if (method === 'tags') {
      return this.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    }
    if (method === 'best-tag') {
      this.compute('tagRank');
      return this.docs
        .map(ts => {
          return ts.map(t => (t.tagRank?.[0] ? `#${t.tagRank[0]}` : '')).join(' ')
        })
        .join('\n')
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
    out: out$1,
    /** */
    wrap: function (obj) {
      return wrap(this, obj)
    },
  };

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };
  // a dash between two words, like '2025-05-11 - they'
  const spacedDash = /^\s+[-—]\s+$/;

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && Object.hasOwn(fmts$1, fmt)) {
        opts = { ...fmts$1[fmt] };
      } else if (fmt && isObject$1(fmt)) {
        opts = { ...fmt }; //todo: fixme
      }
      // is it a full document?
      if (opts.keepSpace === undefined && !this.isFull()) {
        //
        opts.keepSpace = false;
      }
      if (opts.keepEndPunct === undefined && this.pointer) {
        const ptr = this.pointer[0];
        const lastTerm = this.docs.at(-1)?.at(-1);
        if (ptr?.[1] || spacedDash.test(lastTerm?.post)) {
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

  const methods$7 = { ...methods$8, ...text, ...methods$9, ...html$1 };

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

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!Object.hasOwn(model.one.tagSet, tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli$1[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
    const { docs, model } = view;
    if (docs.length === 0) {
      console.log(blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(blue('\n  ╭─────────'));
      terms.forEach(t => {
        const tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = yellow(text);
        let word = "'" + text + "'";
        if (t.reference) {
          const str = view.update([t.reference]).text('normal');
          word += ` - ${dim(i$1('[' + str + ']'))}`;
        }
        word = word.padEnd(18);
        const str = blue('  │ ') + i$1(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const colors$1 = { Noun: blue, Verb: green, Adjective: yellow, Pivot: red };

  const showChunks = view => {
    console.log('');
    view.docs.forEach(terms => {
      const out = terms.map(term => {
        const text = term.implicit || term.normal;
        if (Object.hasOwn(colors$1, term.chunk)) {
          return colors$1[term.chunk](text)
        }
        return text
      });
      console.log(out.join(' '), '\n');
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const spliceIn = (txt, offset, index) => {
    const start = offset.start + index * 9; // Each highlight adds nine ANSI characters.
    const end = start + offset.length;
    return txt.substring(0, start) + blue(txt.substring(start, end)) + txt.substring(end)
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    const bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] ||= [];
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

  // Diagnostics describe the original parse, before the returned View is mutated.
  const specFailures = (doc, slots, patterns, aliases) => {
    const terms = doc.docs.flat();
    const failures = [];
    if (terms.length !== slots.length) {
      failures.push({
        code: 'length', expected: slots.length, actual: terms.length,
        message: `expected ${slots.length} terms, got ${terms.length}`,
      });
    }
    doc.compute('tagRank');
    slots.forEach((slot, i) => {
      const term = terms[i];
      const actual = term ? Array.from(term.tags) : [];
      const detail = { term: i + 1, word: term?.implicit || term?.text || '', expected: slot, actual };
      if (patterns[i] === null) {
        failures.push({ ...detail, code: 'syntax', message: `term ${i + 1}: invalid slot ${slot.join('|')}` });
        return
      }
      if (!term) {
        return // covered by the length error
      }
      const problems = [];
      slot.forEach(value => {
        if (value === '.') {
          return
        }
        const negative = value.startsWith('!');
        const tag = value.replace(/^!?#?/, '');
        const present = term.tags.has(aliases[tag] || tag);
        if (negative && present) {
          problems.push(`unexpected #${tag}`);
        } else if (!negative && !present) {
          problems.push(`missing #${tag}`);
        }
      });
      if (problems.length > 0) {
        const best = term.tagRank?.[0] || actual.at(-1) || 'Untagged';
        failures.push({
          ...detail, code: 'tags',
          message: `term ${i + 1} '${detail.word}': #${best}, ${problems.join(', ')}`,
        });
      }
    });
    if (failures.length === 0) {
      failures.push({ code: 'match', message: 'tags align, but the sentence pattern did not match' });
    }
    return failures
  };

  const logSpec = (doc, slots, failures, aliases) => {
    const terms = doc.docs.flat();
    const wrong = new Set(failures.filter(failure => failure.term).map(failure => failure.term - 1));
    const invalid = new Set(failures.filter(failure => failure.code === 'syntax').map(failure => failure.term - 1));
    const unmatched = failures.some(failure => failure.code === 'match');
    let visible = 0;
    terms.forEach((term, i) => {
      if (term.text) {
        visible = i;
      }
      // Implicit terms share their visible contraction or number-range token.
      if (wrong.has(i) || i >= slots.length || unmatched) {
        wrong.add(visible);
      }
    });
    const text = terms.map((term, i) => {
      const word = wrong.has(i) && term.text ? red(term.text) : term.text;
      return term.pre + word + term.post
    }).join('').trim();
    const tags = slots.map((slot, i) => {
      const term = terms[i];
      if (!term || invalid.has(i) || unmatched) {
        return red(slot.join('|'))
      }
      return slot.map(value => {
        if (value === '.') {
          return value
        }
        const negative = value.startsWith('!');
        const tag = value.replace(/^!?#?/, '');
        const present = term.tags.has(aliases[tag] || tag);
        return present === negative ? red(value) : value
      }).join('|')
    }).join(',');
    const block = slots.length === 0 ? red('{}') : `{${tags}}`;
    return `${text} ${block}`
  };

  const lastBrace = /\{(?=[^{]*$)/; // split on the last { only
  const comment = /\}[ \t]*#.*$/; // an optional '# comment' after the last {tags} block


  // parse the spec output
  const parseLine = function (line = '') {
    let [text, tags] = line.split(lastBrace); // eslint-disable-line prefer-const
    if (tags === undefined) {
      return { text: text.replace(/\s#.*$/, '').trimEnd(), tags: null } // no {tags} block on this line
    }
    tags = tags.replace(comment, '}'); // drop the comment - only ever one, always last
    tags = tags.split(',').map(tag => tag.trim());
    const lastTag = tags[tags.length - 1];
    tags[tags.length - 1] = lastTag.replace(/\}$/, '');
    tags = tags.map(tag => tag.split('|').map(t => t.trim()));
    if (tags.length === 1 && tags[0].length === 1 && tags[0][0] === '') {
      tags = []; // empty '{}'; retain empty slots in nonempty lists
    }
    return { text, tags }
  };

  // make a match syntax looping through the arrays of tags
  const toMatchString = function (tags, aliases) {
    // Slots accept tags and '.', never match-syntax quantifiers or groups.
    if (tags.some(slot => slot.some(tag => tag !== '.' && !/^!?#?[a-z][a-z0-9]*$/i.test(tag)))) {
      return null
    }
    return tags.map(arr => {
      arr = arr.map(str => {
        if (str === '.') {
          return '.'
        }
        const negative = str.startsWith('!');
        const tag = str.replace(/^!?#?/, '');
        const prefix = negative ? '!#' : '#';
        return prefix + (aliases[tag] || tag)
      });
      if (arr.length > 1) {
        return `(${arr.join(' && ')})`
      }
      return arr[0]
    }).join(' ')
  };

  // Apply only positive constraints; negatives remain assertions.
  const applyTags = (doc, slots, aliases) => {
    const terms = doc.terms();
    // Tokenization can supply structural tags; literal slots replace them.
    doc.docs.flat().forEach(term => term.tags.clear());
    slots?.forEach((slot, i) => {
      const tags = slot.filter(tag => tag !== '.' && !tag.startsWith('!')).map(tag => {
        tag = tag.replace(/^#/, '');
        return aliases[tag] || tag
      });
      terms.eq(i).tag(tags, 'fromSpec');
    });
  };

  const fromSpec = function (spec, { tags: tagMode = 'ignore', failures: failureMode = 'ignore', verbose = false } = {}) {
    if (!['ignore', 'use'].includes(tagMode) || !['ignore', 'throw', 'retain', 'log'].includes(failureMode)) {
      throw new Error('Invalid fromSpec options')
    }
    const aliases = this.world().model.one.tagAliases;
    const result = this('');
    result.failures = [];
    spec.split('\n').forEach((line, index) => {
      if (!line.trim() || /^\s*#/.test(line)) {
        return
      }
      const { text, tags } = parseLine(line);
      const doc = tagMode === 'use' ? this.tokenize(text) : this(text);
      let failures = [];
      if (tags !== null && (tagMode === 'use' || failureMode !== 'ignore')) {
        const count = doc.docs.reduce((sum, terms) => sum + terms.length, 0);
        const patterns = tags.map(slot => toMatchString([slot], aliases));
        const pattern = toMatchString(tags, aliases);
        // Assigning slots is unsafe when the shape or syntax is invalid.
        const canApply = count === tags.length && pattern !== null;
        if (tagMode === 'use' && !canApply && failureMode !== 'log') {
          const invalid = specFailures(doc, tags, patterns, aliases);
          throw new Error(`${text.trim()} - ${invalid.map(failure => failure.message).join('; ')}`)
        }
        if (tagMode === 'use') {
          applyTags(doc, canApply ? tags : null, aliases);
        }
        if (failureMode !== 'ignore' && (count !== tags.length || pattern === null || !doc.has(pattern))) {
          failures = specFailures(doc, tags, patterns, aliases)
            .map(failure => ({ line: index + 1, text: text.trim(), ...failure }));
          result.failures.push(...failures);
        }
      } else if (tagMode === 'use') {
        applyTags(doc, null, aliases);
      }
      const detail = failures.map(failure => failure.message).join('; ');
      if (failureMode === 'log' && failures.length > 0) {
        console.error(logSpec(doc, tags, failures, aliases)); //eslint-disable-line no-console
      } else if (verbose) {
        const block = tags === null ? '' : ` {${tags.map(slot => slot.join('|')).join(',')}}`;
        if (failures.length > 0) {
          console.log(`${red('✗')} ${text}${dim(block)} - ${red(detail)}`); //eslint-disable-line no-console
        } else {
          console.log(`${green('✓')} ${green(dim(text))}${dim(block)}`); //eslint-disable-line no-console
        }
      }
      if (failures.length > 0 && failureMode === 'throw') {
        throw new Error(`${text.trim()} - ${detail}`)
      }
      if (failureMode === 'retain' && tags !== null && failures.length === 0) {
        return
      }
      // Preserve the parsed terms and assigned tags, without running hooks twice.
      if (doc.found) {
        const previous = result.document.at(-1)?.at(-1);
        if (previous) {
          previous.post += '\n';
        }
        result.document.push(...doc.docs);
      }
    });
    return result
  };

  // Keep the legacy logging and throwing arguments on the compatibility wrapper.
  const testSpec = function (spec, verbose = true, throwError = false) {
    const result = this.fromSpec(spec, { tags: 'ignore', failures: 'retain', verbose });
    if (throwError && result.failures.length > 0) {
      const failure = result.failures[0];
      throw new Error(`${failure.text} - ${failure.message}`)
    }
    return result
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
      byN[ref[0]] ||= [];
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
      ptr[4] = terms.length > 0 ? terms[terms.length - 1].id : null;
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
      let [n, start, end, id, endId] = ptr;
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

  const getDoc = (m, view) => {
    if (typeof m === 'string' || Array.isArray(m)) {
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

  // Resolve actions and index hints once, alongside the match expression.
  const resolveAliases = (rule, aliases) => {
    const tag = value => {
      if (Array.isArray(value)) {
        return value.map(tag)
      }
      if (typeof value !== 'string') {
        return value
      }
      return value.trim().split(/ +/).map(name => {
        name = name.replace(/^#/, '');
        return aliases[name] || name
      }).join(' ')
    };
    const hook = value => {
      if (typeof value === 'string' && value.startsWith('#')) {
        return '#' + tag(value)
      }
      return value
    };
    if (rule.tag !== undefined) {
      rule.tag = tag(rule.tag);
    }
    if (rule.unTag !== undefined) {
      rule.unTag = tag(rule.unTag);
    }
    if (rule.hook !== undefined) {
      rule.hook = hook(rule.hook);
    }
    if (rule.ifNo !== undefined) {
      rule.ifNo = [rule.ifNo].flat().map(hook);
    }
  };

  // Only precheck required, single-term tokens without special matching steps.
  const canCheck = reg => Boolean(reg && !reg.optional && !reg.negative && !reg.greedy &&
    !reg.choices && !reg.anything && !reg.regex && !reg.method);

  const getBoundary = (reg, boundary) => {
    if (!canCheck(reg) || !reg[boundary]) {
      return null
    }
    return reg
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

  // Only allow hooks that every successful match must contain. In particular,
  // a word inside an optional or negative AND block is not a required hook.
  const hasRequiredHook = function (regs, hook) {
    return regs.some(reg => {
      if (reg.optional || reg.negative) {
        return false
      }
      if (getTokenNeeds(reg) === hook) {
        return true
      }
      return reg.operator === 'and' && reg.choices &&
        reg.choices.some(side => hasRequiredHook(side, hook))
    })
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
      resolveAliases(obj, world.model.one.tagAliases);
      obj.regs = parseMatch(obj.match, {}, world);
      obj.fixed = isFixed(obj.regs);
      obj.checkFirst = canCheck(obj.regs[0]);
      obj.startTerm = getBoundary(obj.regs[0], 'start');
      obj.endTerm = getBoundary(obj.regs[obj.regs.length - 1], 'end');
      if (obj.notIf) {
        obj.notIf = parseMatch(obj.notIf, {}, world);
      }
      // cache any requirements up-front 
      obj.needs = getNeeds(obj.regs);
      if (obj.hook !== undefined) {
        if (typeof obj.hook !== 'string' || !obj.needs.includes(obj.hook) || !hasRequiredHook(obj.regs, obj.hook)) {
          throw new Error(`Invalid hook "${obj.hook}" for match "${obj.match}": use a required word, #Tag, or %Switch%.`)
        }
      }
      const { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
      // The matcher excludes negative tokens from its own minimum. Cache that
      // separately rather than changing the sweep's existing length filter.
      obj.minLength = obj.regs.filter(o => o.optional !== true && o.negative !== true).length;
    });
    return matches
  };

  // Choose one necessary hook per rule. A missing required hook guarantees that
  // the rule cannot match, so broader hooks need not enqueue it as well.
  const buildIndex = function (matches, hooks, hookOrder) {
    const index = Object.create(null);
    const seen = new Set();
    const lastRank = Object.keys(hooks).length;
    matches.forEach((rule, order) => {
      if (seen.has(rule)) {
        return
      }
      seen.add(rule);
      let anchor = null;
      let rank = lastRank;
      for (let i = 0; i < rule.needs.length; i += 1) {
        const key = rule.needs[i];
        // Prefer the hook shared by the fewest rules in this network.
        if (anchor === null || hooks[key].length < hooks[anchor].length) {
          anchor = key;
        }
        rank = Math.min(rank, hookOrder[key]);
      }
      // Explicit hooks have already been checked against required match tokens.
      if (rule.hook !== undefined) {
        anchor = rule.hook;
      }
      // Historically, any earlier matching alternative could determine where
      // this rule ran. Retain that ordering even when using a required anchor.
      const earlier = [...new Set(rule.wants)]
        .filter(key => hookOrder[key] < rank)
        .sort((a, b) => hookOrder[a] - hookOrder[b]);
      const keys = anchor === null ? [...new Set(rule.wants)] : [anchor];
      // The bucket already proves its anchor; check each remaining need once.
      const needs = [...new Set(rule.needs)].filter(key => key !== anchor);
      const entry = { rule, order, rank, earlier, needs, single: keys.length === 1 };
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        index[key] ||= [];
        index[key].push(entry);
      }
    });
    return index
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
    // Record enumeration order, including numeric keys, so input-driven lookup
    // can preserve the order in which tag actions have always been applied.
    const hookOrder = Object.create(null);
    Object.keys(hooks).forEach((k, i) => {
      hookOrder[k] = i;
      // remove duplicates
      const already = new Set();
      hooks[k] = hooks[k].filter(obj => {
        if (already.has(obj)) {
          return false
        }
        already.add(obj);
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    const always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      hookOrder,
      index: buildIndex(matches, hooks, hookOrder),
      always
    }
  };

  // Reject impossible candidates before allocating and sorting their entries.
  const canMatch = (obj, haves, terms, needs = obj.needs) => {
    const termCount = terms.length;
    if (!(termCount >= obj.minWords)) {
      return false
    }
    for (let j = 0; j < needs.length; j += 1) {
      if (!haves.has(needs[j])) {
        return false
      }
    }
    if (obj.ifNo !== undefined) {
      for (let j = 0; j < obj.ifNo.length; j += 1) {
        if (haves.has(obj.ifNo[j])) {
          return false
        }
      }
    }
    if (obj.wants.length > 0) {
      let count = 0;
      for (let j = 0; j < obj.wants.length; j += 1) {
        if (haves.has(obj.wants[j])) {
          count += 1;
          if (count >= obj.minWant) {
            break
          }
        }
      }
      if (!(count >= obj.minWant)) {
        return false
      }
    }
    // Required anchors must match the sentence boundary, not just occur in it.
    if (termCount && obj.startTerm && !wrapMatch(terms[0], obj.startTerm, 0, termCount)) {
      return false
    }
    if (termCount && obj.endTerm && !wrapMatch(terms[termCount - 1], obj.endTerm, termCount - 1, termCount)) {
      return false
    }
    return true
  };

  // Required anchors narrow the candidate list. Sort surviving entries by their
  // original first matching hook, then their position within that hook's bucket.
  const getIndexed = function (set, index, hookOrder, terms) {
    const found = [];
    const seen = new Set();
    set.forEach(key => {
      const bucket = index[key];
      if (!Array.isArray(bucket)) {
        return
      }
      for (let i = 0; i < bucket.length; i += 1) {
        const entry = bucket[i];
        // Single-bucket entries cannot be encountered twice. Older nets fall back.
        if (entry.single !== true) {
          if (seen.has(entry)) {
            continue
          }
          seen.add(entry);
        }
        if (!canMatch(entry.rule, set, terms, entry.needs)) {
          continue
        }
        let rank = entry.rank;
        for (let j = 0; j < entry.earlier.length; j += 1) {
          const earlier = entry.earlier[j];
          if (set.has(earlier)) {
            rank = hookOrder[earlier];
            break
          }
        }
        if (rank === entry.rank) {
          found.push(entry);
        } else {
          found.push({ rule: entry.rule, rank, order: entry.order });
        }
      }
    });
    found.sort((a, b) => a.rank - b.rank || a.order - b.order);
    return found.map(entry => entry.rule)
  };

  // for each cached-sentence, find a list of possible matches
  const getHooks = function (docCaches, net, document) {
    const { hooks, index, always } = net;
    let { hookOrder } = net;
    // Older compiled nets may not include the precomputed hook order.
    if (!hookOrder) {
      hookOrder = Object.create(null);
      Object.keys(hooks).forEach((k, i) => { hookOrder[k] = i; });
    }
    const lists = docCaches.map((set, n) => {
      if (index) {
        return getIndexed(set, index, hookOrder, document[n])
      }
      const keys = [];
      set.forEach(k => {
        if (typeof hookOrder[k] === 'number') {
          keys.push(k);
        }
      });
      keys.sort((a, b) => hookOrder[a] - hookOrder[b]);
      // Append each rule once, without concatenating and then filtering buckets.
      const maybe = [];
      const already = new Set();
      for (let i = 0; i < keys.length; i += 1) {
        const bucket = hooks[keys[i]];
        for (let j = 0; j < bucket.length; j += 1) {
          const m = bucket[j];
          if (!already.has(m)) {
            already.add(m);
            if (canMatch(m, set, document[n])) {
              maybe.push(m);
            }
          }
        }
      }
      return maybe
    });
    // Apply the same exclusions to unindexed rules, preserving their final position.
    lists.forEach((list, n) => {
      for (let i = 0; i < always.length; i += 1) {
        if (canMatch(always[i], docCaches[n], document[n])) {
          list.push(always[i]);
        }
      }
    });
    return lists
  };

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, docCache, methods, opts) {
    const results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      const sentence = [document[n]];
      for (let i = 0; i < maybeList[n].length; i += 1) {
        const m = maybeList[n][i];
        // ok, actually do the work.
        const res = methods.one.match(sentence, m);
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
            const todo = { ...m, pointer: ptr };
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

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    const docCache = methods.one.cacheDoc(document);
    // filter candidates before sorting them into execution order
    const maybeList = getHooks(docCache, net, document);

    // now actually run the matches
    const results = runMatch(maybeList, document, docCache, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };

  const sets = new WeakMap();
  const empty = new Set();

  // Normalization replaces these arrays when plugins rebuild the tag graph.
  const getTagSet = (tags) => {
    if (!tags || tags.length === 0) {
      return empty
    }
    let set = sets.get(tags);
    if (!set) {
      set = new Set(tags);
      sets.set(tags, set);
    }
    return set
  };

  // is this tag consistent with the tags they already have?
  const canBe$1 = function (terms, tag, model) {
    const tagSet = model.one.tagSet;
    if (!Object.hasOwn(tagSet, tag)) {
      return true
    }
    const conflicts = getTagSet(tagSet[tag].not);
    if (conflicts.size === 0) {
      return true
    }
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      for (const existing of term.tags) {
        if (conflicts.has(existing)) {
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
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      const reason = todo.reason || todo.match;
      const terms = getDoc([todo.pointer], document)[0];
      let validated;
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
        // Only an exact single tag was checked by canBe; arrays and shorthand
        // still need their individual checks in setTag.
        if (typeof todo.tag === 'string' && Object.hasOwn(model.one.tagSet, todo.tag)) {
          validated = model.one.tagSet[todo.tag];
        }
      }
      if (todo.tag !== undefined) {
        setTag(terms, todo.tag, world, todo.safe, `[post] '${reason}'`, validated);
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
        unTag(terms, todo.unTag, model.one.tagSet, reason);
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

  // eslint-disable-next-line max-params
  const tagTerm = function (term, tag, tagSet, isSafe, validated, reason) {
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
    const previous = debug$3.tags ? debug$3.before(term) : null;
    // for known tags, do logical dependencies first
    const known = tagSet[tag];
    if (known) {
      // first, we remove any conflicting tags
      if (known !== validated && known.not && known.not.length > 0) {
        const conflicts = getTagSet(known.not);
        for (const existing of term.tags) {
          if (conflicts.has(existing)) {
            // Safe and frozen terms cannot lose conflicting tags.
            if (isSafe === true) {
              return null
            }
            term.tags.delete(existing);
          }
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
    if (previous) {
      debug$3.log(term, previous, reason);
    }
    return true
  };

  // support '#Noun . #Adjective' syntax
  // eslint-disable-next-line max-params
  const multiTag = function (terms, tagString, tagSet, aliases, isSafe, reason) {
    const tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      let tag = tags[i];
      if (tag) {
        tag = tag.replace(/^#/, '');
        tag = aliases?.[tag] || tag;
        tagTerm(term, tag, tagSet, isSafe, undefined, reason);
      }
    });
  };

  // add a tag to all these terms
  // Whole-match validation is separate from per-term safety.
  // eslint-disable-next-line max-params
  const setTag = function (terms, tag, world = {}, isSafe, reason, validated) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    if (Array.isArray(tag) === true) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe, reason));
      return
    }
    if (typeof tag !== 'string') {
      console.warn(`compromise: Invalid tag '${tag}'`); // eslint-disable-line
      return
    }
    tag = tag.trim();
    // support '#Noun . #Adjective' syntax
    if (isMulti.test(tag)) {
      multiTag(terms, tag, tagSet, world.model.one.tagAliases, isSafe, reason);
      return
    }
    tag = tag.replace(/^#/, '');
    tag = world.model.one.tagAliases?.[tag] || tag;
    // let set = false
    for (let i = 0; i < terms.length; i += 1) {
      tagTerm(terms[i], tag, tagSet, isSafe, validated, reason);
    }
  };

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet, reason = 'untag') {
    tag = tag.trim().replace(/^#/, '');
    const children = getTagSet(tagSet[tag]?.children);
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      // don't untag anything if term is frozen
      if (term.frozen === true) {
        continue
      }
      const previous = debug$3.tags ? debug$3.before(term) : null;
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        if (previous) {
          debug$3.log(term, previous, reason);
        }
        continue
      }
      // removing #Verb should also remove #PastTense
      if (children.size > 0) {
        for (const existing of term.tags) {
          if (children.has(existing)) {
            term.tags.delete(existing);
          }
        }
      }
      term.tags.delete(tag);
      if (previous) {
        debug$3.log(term, previous, reason);
      }
    }
  };

  // quick check if this tag will require any untagging
  const canBe = function (term, tag, tagSet) {
    if (!Object.hasOwn(tagSet, tag)) {
      return true // everything can be an unknown tag
    }
    const conflicts = getTagSet(tagSet[tag].not);
    if (conflicts.size === 0) {
      return true
    }
    for (const existing of term.tags) {
      if (conflicts.has(existing)) {
        return false
      }
    }
    return true
  };

  const validate$1 = function (node) {
    node.children = node.children || [];
    node._cache = node._cache || {};
    node.props = node.props || {};
    node._cache.parents = node._cache.parents || [];
    return node
  };

  // Iterative DFS keeps deep inputs safe and distinguishes shared nodes from cycles.
  const checkCycles = roots => {
    const states = new Map();
    const stack = roots.map(node => [node, false]);
    for (; stack.length > 0;) {
      const [node, done] = stack.pop();
      if (done) {
        states.set(node, 2);
      } else if (states.get(node) === 1) {
        throw new Error('[Grad] - cyclic input')
      } else if (!states.has(node)) {
        states.set(node, 1);
        stack.push([node, true]);
        for (const child of node.children || []) {
          stack.push([child, false]);
        }
      }
    }
    return states.keys()
  };

  // turn parent-index rows into nested json
  const fromArray = function (rows) {
    const index = new Map();
    // addTags allocates these rows for this graph, so initialize them in place.
    rows.forEach(node => {
      validate$1(node);
      index.set(node.id, node);
    });
    const root = validate$1({});
    rows.forEach(node => {
      if (node.parent) {
        if (index.has(node.parent)) {
          const parent = index.get(node.parent);
          delete node.parent; //no-longer needed
          parent.children.push(node);
        } else {
          console.warn(`[Grad] - missing node '${node.parent}'`); // eslint-disable-line no-console
        }
        return
      }
      // no parent, add it to root
      root.children.push(node);
    });
    checkCycles(rows);
    return root
  };

  // [a, a1, b, b1]
  // Visitor-only callers can skip collecting nodes.
  const byDepth = (root, fn, collect = true) => {
    const list = collect ? [] : null;
    const queue = [root];
    for (; queue.length > 0;) {
      // get first
      const node = queue.pop();
      if (collect) {
        list.push(node);
      }
      // add kids to queue
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i -= 1) {
          const child = node.children[i];
          if (fn) {
            fn(node, child);
          }
          queue.push(child);
        }
      }
    }
    return list
  };

  // Fresh graph nodes already have empty caches; fill ancestors in root-to-parent order.
  const cacheParents = root => {
    byDepth(root, (parent, child) => {
      if (parent.id) {
        child._cache.parents = parent._cache.parents.concat([parent.id]);
      }
    }, false);
  };

  // addTags supplies only exclusions, additional parents, and these scalar flags.
  const inherit = (props, parent) => {
    if (parent.not) {
      props.not = new Set([...props.not, ...parent.not]);
    }
    if (Array.isArray(parent.also) && (props.also === undefined || Array.isArray(props.also))) {
      props.also = parent.also.concat(props.also || []);
    } else if (props.also === undefined) {
      props.also = parent.also;
    }
    if (props.is === undefined) {
      props.is = parent.is;
    }
    if (props.novel === undefined) {
      props.novel = parent.novel;
    }
    return props
  };

  const fillDown = root => {
    byDepth(root, (parent, child) => {
      child.props = inherit(child.props, parent.props);
    }, false);
  };

  // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color

  const reset = '\x1b[0m';
  //cheaper than requiring chalk
  const cli = {
    // green: str => '\x1b[32m' + str + reset,
    red: str => '\x1b[31m' + str + reset,
    // blue: str => '\x1b[34m' + str + reset,
    // magenta: str => '\x1b[35m' + str + reset,
    // cyan: str => '\x1b[36m' + str + reset,
    // yellow: str => '\x1b[33m' + str + reset,
    // black: str => '\x1b[30m' + str + reset,
    dim: str => '\x1b[2m' + str + reset,
  };

  const indent = '    ';

  const toText$1 = function (json, color) {
    let arrow = '-> ';
    if (color) {
      arrow = cli.dim('→ ');
    }
    let txt = '';
    const rows = byDepth(json);
    rows.forEach((node, i) => {
      let label = node.id || '';
      if (color) {
        label = cli.red(label);
      }
      if (i === 0 && !node.id) {
        return //skip empty root
      }
      const depth = node._cache.parents.length;
      txt += indent.repeat(depth) + arrow + label + '\n';
    });
    return txt
  };

  const toArray$1 = function (json) {
    // The tag formatter only reads these graph-owned nodes.
    const nodes = byDepth(json);
    // should we show the root?
    const root = nodes[0];
    if (root && !root.id && Object.keys(root.props).length === 0) {
      nodes.shift();
    }
    return nodes
  };

  // Keep this dispatch intact: an array-only version regresses V8 benchmarks.
  const fmts = {
    text: toText$1,
    txt: toText$1,
    array: toArray$1,
    flat: toArray$1,
  };

  const out = function (root, label) {
    // return internal json
    if (label === 'nested' || label === 'json') {
      return root
    }
    if (label === 'debug') {
      console.log(toText$1(root, true)); // eslint-disable-line no-console
      return null
    }
    if (fmts.hasOwnProperty(label)) {
      return fmts[label](root)
    }
    return root
  };

  // The tag-inheritance subset of grad-school;
  // https://github.com/spencermountain/grad-school

  class Graph {
    constructor(json) {
      Object.defineProperty(this, 'json', {
        enumerable: false,
        value: json,
        writable: true,
      });
    }
    cache() {
      cacheParents(this.json);
      return this
    }
    fillDown() {
      fillDown(this.json);
      return this
    }
    out(fmt) {
      // fillDown changes properties, so the cached graph relationships still hold.
      return out(this.json, fmt)
    }
  }

  const graph = rows => new Graph(fromArray(rows));

  // i just made these up
  const colors = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Connector: 'cyan',
    Determiner: 'cyan',
    Hyphenated: 'cyan',
    Adverb: 'cyan',
  };

  const getColor = function (node) {
    if (Object.hasOwn(colors, node.id)) {
      return colors[node.id]
    }
    if (Object.hasOwn(colors, node.is)) {
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
        children: [],
        color: getColor(node),
        // Retain the preferred output name for legacy model consumers.
        alias: node.aliases === undefined ? node.alias : node.aliases[0],
        aliases: node.aliases,
      };
    });
    // `also` is another inheritance edge. Resolve its ancestors before building
    // reverse edges, so removing any parent also removes all dependent tags.
    const resolved = new Set();
    const resolving = new Set();
    const resolveParents = function (tag) {
      if (resolved.has(tag)) {
        return res[tag].parents
      }
      if (resolving.has(tag)) {
        throw new Error(`compromise: cyclic tag inheritance at '${tag}'`)
      }
      resolving.add(tag);
      const parents = new Set();
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          resolveParents(parent).forEach(ancestor => parents.add(ancestor));
        }
        parents.add(parent);
      });
      res[tag].parents = Array.from(parents);
      resolving.delete(tag);
      resolved.add(tag);
      return res[tag].parents
    };
    Object.keys(res).forEach(tag => resolveParents(tag));
    Object.keys(res).forEach(tag => {
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          res[parent].children.push(tag);
        }
      });
    });

    // Inherit exclusions through every parent, then exclude all descendants of
    // each conflicting tag. Read a snapshot to keep this independent of order.
    const exclusions = {};
    Object.keys(res).forEach(tag => { exclusions[tag] = res[tag].not; });
    Object.keys(res).forEach(k => {
      const nots = new Set(exclusions[k]);
      res[k].parents.forEach(parent => {
        for (const not of exclusions[parent] || []) {
          nots.add(not);
        }
      });
      Array.from(nots).forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
      getTagSet(res[k].not);
      getTagSet(res[k].children);
      // Keep accepting custom definitions, but flag impossible combinations once
      // per tag, after both inheritance and reciprocal exclusions are resolved.
      const conflicts = [k, ...res[k].parents].filter(tag => nots.has(tag));
      if (conflicts.length > 0) {
        const names = conflicts.map(tag => `#${tag}`).join(', ');
        console.warn(`compromise: contradictory tag '#${k}' requires and excludes: ${names}`); // eslint-disable-line no-console
      }
    });
    return res
  };

  // Compile once per registration. Real tag names always take precedence.
  const compileAliases = (tags, normalize) => {
    const aliases = Object.create(null);
    Object.keys(tags).forEach(tag => { aliases[tag] = tag; });
    Object.keys(tags).forEach(tag => {
      const entry = tags[tag];
      const names = entry.aliases === undefined ? [entry.alias] : [entry.aliases].flat();
      names.forEach(name => {
        if (name === null || name === undefined) {
          return
        }
        if (typeof name !== 'string' || !/^[\p{L}_][\p{L}\p{M}\p{N}_-]*$/u.test(name)) {
          throw new Error(`compromise: invalid alias for '#${tag}'`)
        }
        // Match strings undergo Unicode normalization before parsing.
        const spellings = normalize ? [name, normalize(name)] : [name];
        spellings.forEach(spelling => {
          if (Object.hasOwn(tags, spelling)) {
            if (spelling !== name && spelling !== tag) {
              throw new Error(`compromise: tag alias '${name}' normalizes to '#${spelling}'`)
            }
            return
          }
          if (aliases[spelling] && aliases[spelling] !== tag) {
            throw new Error(`compromise: duplicate tag alias '${spelling}'`)
          }
          aliases[spelling] = tag;
        });
      });
    });
    return aliases
  };

  const toArr = function (input) {
    if (!input) {
      return []
    }
    if (typeof input === 'string') {
      return [input]
    }
    return input.slice()
  };

  const addImplied = function (tags) {
    const aliases = compileAliases(tags);
    const resolve = tag => aliases[tag] || tag;
    Object.keys(tags).forEach(k => {
      // support deprecated fmts
      if (tags[k].isA) {
        tags[k].is = tags[k].isA;
      }
      if (tags[k].notA) {
        tags[k].not = tags[k].notA;
      }
      if (typeof tags[k].is === 'string') {
        tags[k].is = resolve(tags[k].is);
      }
      if (tags[k].also) {
        tags[k].also = toArr(tags[k].also).map(resolve);
      }
      if (tags[k].not) {
        tags[k].not = toArr(tags[k].not).map(resolve);
      }
      // add any implicit 'is' tags
      if (tags[k].is && typeof tags[k].is === 'string') {
        if (!Object.hasOwn(tags, tags[k].is)) {
          tags[tags[k].is] = {};
        }
      }
      // Additional parents need entries too, including parents introduced by plugins.
      toArr(tags[k].also).forEach(parent => {
        if (!Object.hasOwn(tags, parent)) {
          tags[parent] = {};
        }
      });
      // add any implicit 'not' tags
      toArr(tags[k].not).forEach(excluded => {
        if (!Object.hasOwn(tags, excluded)) {
          tags[excluded] = {};
        }
      });
    });
    return tags
  };


  const validate = function (tags, already) {
    // Reciprocal links must reach previously registered tags too. Copy entries
    // before normalization so the existing compiled model remains untouched.
    tags = Object.fromEntries(Object.keys({ ...already, ...tags }).map(tag => [tag, { ...already[tag], ...tags[tag] }]));
    tags = addImplied(tags);

    // property validation
    Object.keys(tags).forEach(k => {
      if (tags[k].aliases !== undefined) {
        tags[k].aliases = toArr(tags[k].aliases);
      }
      tags[k].children = toArr(tags[k].children);
      tags[k].not = toArr(tags[k].not);
      if (tags[k].also) {
        tags[k].also = toArr(tags[k].also);
      }
    });
    // not links are bi-directional
    // add any incoming not tags
    Object.keys(tags).forEach(k => {
      const nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not && !tags[no].not.includes(k)) {
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
      return { id: k, parent: o.is, props, children: [], alias: o.alias, aliases: o.aliases?.slice() }
    });
    const graph$1 = graph(flatList).cache().fillDown();
    return graph$1.out('array')
  };

  const fromUser = function (tags) {
    Object.keys(tags).forEach(k => {
      tags[k] = { ...tags[k] };
      tags[k].novel = true;
    });
    return tags
  };

  const addTags$1 = function (tags, already) {
    // Normalization owns its definitions, including when callers reuse a tagset.
    tags = Object.fromEntries(Object.entries(tags).map(([tag, definition]) => [tag, { ...definition }]));
    // are these tags internal ones, or user-generated?
    if (Object.keys(already).length > 0) {
      tags = fromUser(tags);
    }
    tags = validate(tags, already);

    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$1(tags);
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
      if (Array.isArray(input)) {
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
      const resolve = tag => {
        tag = tag.trim().replace(/^#/, '');
        return model.one.tagAliases[tag] || tag
      };
      if (Array.isArray(input)) {
        input.forEach(tag => methods.one.unTag(terms, resolve(tag), tagSet, reason));
      } else {
        methods.one.unTag(terms, resolve(input), tagSet, reason);
      }
      // uncache
      this.uncache();
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      tag = tag.replace(/^#/, '');
      tag = this.model.one.tagAliases[tag] || tag;
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
    const world = this.world();
    const { model, methods } = world;
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    const res = fn(tags, tagSet);
    const aliases = compileAliases(res, name => methods.one.killUnicode(name, world));
    model.one.tagSet = res;
    model.one.tagAliases = aliases;
    return this
  };

  var lib$1 = { addTags };

  const boringTags = new Set(['Auxiliary', 'Possessive']);

  const sortByKids = function (tags, tagSet) {
    tags = tags.sort((a, b) => {
      // (unknown tags are interesting)
      if (boringTags.has(a) || !Object.hasOwn(tagSet, b)) {
        return 1
      }
      if (boringTags.has(b) || !Object.hasOwn(tagSet, a)) {
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
      one: { tagSet: {}, tagAliases: Object.create(null) }
    },
    compute: {
      tagRank
    },
    methods: methods$3,
    api: tagAPI,
    lib: lib$1
  };

  // Scan punctuation runs once. Searching for an unanchored run followed by
  // whitespace repeatedly rescans long runs that have no following whitespace.
  const stops = new Set('.!?\u203D\u2E18\u203C\u2047\u2048\u2049\u0964\u0965\u061F\u06D4\u0589\u1362\u1367\u104B\u17D4\u3002');
  const cjkStops = new Set('。！？｡');
  const openers$1 = new Set('「『（【〔《〈“');
  const closers = new Set('」』）】〕》〉”');
  const whitespace = /\s/;
  const splitsOnly = /^[.!?‽⸘‼\u2047-\u2049।॥؟۔։።፧။។。]+\s$/;
  const splitsOnlyCjk = /^(?:[.!?‽⸘‼\u2047-\u2049।॥؟۔։።፧။។。！？｡]+\s|[。！？｡]+[」』）】〕》〉”]*)$/;
  const newLine = /((?:\r?\n|\r)+)/;

  const basicSplit = function (text) {
    const all = [];
    const isCjk = /[。！？｡]/.test(text);
    const activeStops = isCjk ? new Set([...stops, ...cjkStops]) : stops;
    for (const line of text.split(newLine)) {
      let start = 0;
      const arr = [];
      const emit = (from, end) => {
        arr.push(line.slice(start, from), line.slice(from, end));
        start = end;
      };
      let i = 0;
      while (i < line.length) {
        if (!activeStops.has(line[i])) {
          i++;
          continue
        }
        const runStart = i;
        while (i < line.length && activeStops.has(line[i])) i++;
        if (i < line.length && whitespace.test(line[i])) {
          emit(runStart, i + 1);
          i++;
          continue
        }
        if (!isCjk) continue
        // A CJK stop ends a sentence without whitespace. Following closing quotes
        // only end it when followed by whitespace, another opener, or end of text.
        let j = runStart;
        while (j < i) {
          if (!cjkStops.has(line[j])) {
            j++;
            continue
          }
          const from = j;
          while (j < i && cjkStops.has(line[j])) j++;
          let end = j;
          while (end < line.length && closers.has(line[end])) end++;
          if (end === j || end === line.length || whitespace.test(line[end]) || openers$1.has(line[end])) {
            emit(from, end);
            if (end > i) i = end;
          }
        }
      }
      arr.push(line.slice(start));
      // Preserve the existing merge behavior, including punctuation-only pieces.
      for (let k = 0; k < arr.length; k++) {
        const next = arr[k + 1];
        if (next && (isCjk ? splitsOnlyCjk : splitsOnly).test(next)) {
          arr[k] += next;
          arr[k + 1] = '';
        }
        if (arr[k]) all.push(arr[k]);
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
    return Boolean(/\n$/.test(c))
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
    text ||= '';
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

  //turn a string into an array of strings (naiive for now, lumped later)
  const splitWords = function (str, model) {
    let result = [];
    let arr = [];
    //start with a naiive split
    str ||= '';
    if (typeof str === 'number') {
      str = String(str);
    }
    if (Array.isArray(str)) {
      return str
    }
    const words = str.split(naiiveSplit);
    for (let i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen$1(words[i], model) === true) {
        arr = arr.concat(splitHyphens$1(words[i]));
        continue
      }
      arr.push(words[i]);
    }
    //greedy merge whitespace+arr to the right
    let carry = '';
    for (let i = 0; i < arr.length; i++) {
      const word = arr[i];
      //if it's more than a whitespace
      if (wordlike.test(word) === true && Object.hasOwn(notWord, word) === false && isBoundary.test(word) === false) {
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
  const openers = { ')': '(', ']': '[', '}': '{' };

  // does this closing bracket close one inside the word, like 'foo(bar)'
  const closesInside = function (chars, start, end) {
    const close = chars[end - 1];
    let depth = 0;
    for (let i = start; i < end - 1; i += 1) {
      if (chars[i] === openers[close]) {
        depth += 1;
      } else if (chars[i] === close) {
        depth -= 1;
      }
    }
    return depth > 0
  };

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    const { prePunctuation, postPunctuation, emoticons } = model.one;
    const original = str;
    let pre = '';
    let post = '';
    const chars = Array.from(str);
    let start = 0;
    let end = chars.length;

    // punctuation-only words, like '<3'
    if (Object.hasOwn(emoticons, str.trim())) {
      return { str: str.trim(), pre, post: ' ' } //not great
    }

    // Locate the first retained code point without shifting the array.
    while (start < end) {
      const c = chars[start];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        break//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-' || c === '(') && isFullNumber.test(str.trim())) {
        break//done
      }
      // '97 - year short-form
      if (c === "'" && c.length === 3 && isNumber.test(chars[start + 1])) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // punctuation
      start++;
    }

    // Locate the last retained code point.
    while (end > start) {
      const c = chars[end - 1];
      // keep any declared chars
      if (postPunctuation[c] === true) {
        break//keep it
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // F.B.I.
      if (c === '.' && hasAcronym.test(original) === true) {
        break//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original) === true) {
        break//keep it
      }
      // keep '+' or ')' only for a number like (800) or 500+
      if ((c === '+' || c === ')') && isFullNumber.test(str.trim())) {
        break//done
      }
      if (Object.hasOwn(openers, c) && closesInside(chars, start, end)) {
        break//keep it
      }
      // punctuation
      end--;
    }
    pre = chars.slice(0, start).join('');
    post = chars.slice(end).join('');
    str = chars.slice(start, end).join('');
    //we went too far..
    if (str === '') {
      // do a very mild parse, and hope for the best.
      let last = original.length;
      while (last > 0 && original[last - 1] === ' ') last--;
      post = original.slice(last);
      str = original.slice(0, last);
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
    str ||= '';
    const chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };

  // Inspect the trailing run once, including when punctuation occurs internally.
  const trimPunctuation = (str, punctuation) => {
    let end = str.length;
    while (end > 0 && punctuation.test(str[end - 1])) end--;
    return str.slice(0, end)
  };

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str ||= '';
    str = str.toLowerCase();
    str = str.trim();
    const original = str;
    //punctuation
    str = trimPunctuation(str, /[,;.!?]/);
    //coerce Unicode ellipses
    str = str.replaceAll('…', '...');
    //en-dash
    str = str.replaceAll('–', '-');
    //strip leading & trailing grammatical punctuation
    if (/^[:;]/.test(str) === false) {
      str = trimPunctuation(str, /[",.!:;?)]/);
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
  const periodAcronym$1 = /^([A-Z]\.)+[A-Z]?,?$/;
  const oneLetterAcronym$1 = /^[A-Z]\.,?$/;
  const noPeriodAcronym$1 = /^[A-Z]{2,}('s|,)?$/;
  const lowerCaseAcronym$1 = /^([a-z]\.)+[a-z]\.?$/;

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
    input ||= '';
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
  const hasEllipse = /(?:\u2026|\.{2}) *$/; // '...'
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
    if (Object.hasOwn(abbrevs, lastWord) === true && hasPeriod.test(str) === true) {
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
    if (Object.hasOwn(aliases, str)) {
      term.alias ||= [];
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
            term.alias ||= [];
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
    const counts = Object.create(null);
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        counts[word] ??= 0;
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
    const lastTerm = docs.at(-1)?.at(-1);
    // if we've already put whitespace, end.
    if (!lastTerm || lastTerm.post) {
      return
    }
    // if we found something
    if (Object.hasOwn(prefixes, lastTerm.normal)) {
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
    const term = docs.at(-1)?.at(-1);
    if (term?.typeahead === true && term.machine) {
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
        if (opts.safe && Object.hasOwn(world.model.one.lexicon, prefix)) {
          continue
        }
        // does it already exist?
        if (Object.hasOwn(existing, prefix) === true) {
          collisions.push(prefix);
          continue
        }
        if (Object.hasOwn(index, prefix) === true) {
          collisions.push(prefix);
          continue
        }
        index[prefix] = str;
      }
    });
    // merge with existing prefixes
    index = { ...existing, ...index };
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
    opts = { ...defaults, ...opts };
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    const prefixes = getPrefixes(words, opts, this.world());
    // manually combine these with any existing prefixes
    Object.keys(prefixes).forEach(str => {
      // explode any overlaps
      if (Object.hasOwn(model.one.typeahead, str)) {
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
    "Adjective": "true¦:!1:#$%&()*+./<=>?@[]^_`~:ne,re,na,ar,ro,tn,iv,et,em,no,mi,ni,ra,ev,id,la,er,el,uq,si,li;0:AZ;1:7W;2:A7;3:AB;4:B8;5:B2;6:9L;7:9J;8:94;9:BE;A:BM;B:9C;C:A6;aA7cilohak(w,e8Cl6Pm6N#z,o0BrWsHuGzDódox;aEilef91oD;l?,$f;cip99fs3Cgas,p9(v;am,eporue;aQePiaHn0GoEêD;cAMlg3ugutr7;cu7gBBmAWrieEsDtium;o$mun,$v@;g%rt1<0;col,],icJ/iGossCpic=0rFs#m,t#madnuf,uD;dDta;at1*@3;edef,oti^e;cDg2;anDi7H;!r8T;ep1ifo,os;lp<s,(hl.,t#35zap9;loAMmAK#gíd3rAB;aluPeOoD;dGhl.,iE#m,tD;+o0ud6;am,p,$D;pus,t%;aEeDia5;c#v,hloca;brutrCcifinu,+%[g,hGif4Tlez,tEvD;o3$sbo;nDul;ac#,+;[tab,nA;pus,_4U;cat5OgnDp7;ai5is;bofó#x,c4Ud30enâ)op1fof,g2Yh2Si2Cjus,l2Am26n1Xp1Wr1Ds09tSunêg3vFxEãD;dnBh[c=rb,me[;iab,or;&b,iDon;sJtDv;aFiE[,pec2rDudo0;essa,ops8;s7te3K;cinEgn*,irc,rDsn9t2G;e#g,gin8;um4;lupmG#]3Golpxe,sD;ap,eD;rDss7;ga,p8;i,oc;aRePiMlL#JrHsDurb;av,eE*,uD;bor,j7L;dom,/D;h,s8;eDuc;ba,c,p1;d6gub&,hlu>b,jon,l,muic,rDz=c;ava,rib;a,eb1ovn3Puc;cílEdr7KefD/b;$p5Cs1P;!os;i_3l2YrD;p,r4;cap,hc,rDs#s78;ab,g77;&,ice0F[f,n7DoDpal2sorg;c0Dd0Bgn8h08iYjWlUmSnCrLtIuFv$n,çD;ap1iuge0nD;&4Me$_,u1O;tDxul;iDr*;ec/2Rrip1;iej,nEsD;ejBi_,og;ap1e[t;d.,eIiHoD;c%r,giF[EmDr(h,v$f;a,i0;c,v;r,v;ehc,t#m;d7#g,za0;i+,rD;ahc,of;ez,ibuj,uD;baf,g;aD?3;gCr4;cIdHgiG[v,/m>h,rDs%;+EoDuc;lg,t*;irc,`m;do0l2;+,o,ut1;&g,iFnDu=m;anTeD;d#t,~s,ta;bma,lBtsr5F;lEnD;am,ir9og$v;*&Bug(;adiuc,ePiDlB/b,rL;av,~bah,r9vud;oj,s*;d3rp;aUd%lBeTgRiFtuo,uD;c1dDges3p;!am;eDol;cKdJlI<0/Hoçia5rut#Gssorg,tE_uobD;ax;iD=,oh~b`b;ag;va;ip;atipsoh,is&b;a8A(;aEitsDn7K;uj;f,pa5;am,eD;n,)í;c=s,psó0;c,lc,r;<l,ot;aGeFg@,$Díu#g;dom,tD;!=,xe;r6_C;bru,iDmuh,rit,y^sF;avFd~w,$Dstaey,t%k,ugnuoy;bDlpek;ew;ah;iDl9s.,utsóp;ním,tExD;ám,ó0;lú,íg^,ó;eDi_52un;b,l&ap,>ma;bás,dReQnPrEvbó,zD;av;a@iMf,pó0áFés,ótaD;fsDsuca;itas;dilA@,~h,nHrGs0OtD;iD#d6o;lAnD(21;amuh,um4;+il,opm+;@(Dois*;!aY;se0;óval1ôpal;f,hc;as,ém;leHnD;aFiEoD;`r,t`5;_s.,zA;rt1ts9;m$v,v;iD/l,>l;.,t%;aVeUiHnGomóc,(g,uFíD;&tDul7;n0Qs@;hc/hc2m;il,ufo0;cNdnLgKlós,mít,#ve0pJrHtEvD;e4Dív;.ort3$vD;@,oD;rtxe;eDfApm4;f,_;ár,út1;=f,ír;eDêlp1;]prus,t#;eDúl;hn0B>lc1;l,rg6za;c0He0Fg0Bh0Ai08j07l06m04n02o01puco3IrVsQtJvHxGziEçD;&g#,r0F;lD%g(;a2*ic;al2ie45;iDlB$s2;rp,tom3K;iElov2%c#,(Dsafa;pm4;cGeF<~,piErri,sD;secen;ce0;j2ps2;ap9xe;ep,n9sEuD;!o;aE]D;pa,t1;c&f,p0P;ape0bi~_e37da_,eG/h,$,tFuD;g>ma,oD;d,t1;^,surf;dDpsK;n7om;gBvopr2Cz;iDoxiapa;f2lpics@,m$t8tsV;a,iDon2saisut#;m,%;cic2u<ss@;es8;fnDg^*i0;ocs8;cob8lom,#3I;eElD%z;as,o3G;pDssA;as8;mDz/rb;of1;ecHiDofus,ude;d8fiElDt`fA;ed,pa;[D;_;bo;&f,iE%rDuol;b,f;dí$v,f00gZlWmVnTo$h,pSrQtDxót;nMsJuecam>hp,áFíEóD;npih,ruen;l7rc;mF%f,pDrp;it%,mD;is;^bo0s4Z;áDí<%;bmDc>s,t%f;ob;âmEêD;tua;or;!é4XófD;ue;ít;cét,égoirc,íc,ôssDú;&tlu;rédipe,â=dordih,él7;búp,íteEóc%lD;.;ca;látson,ám,óloib;árgit&tseo/rc,íD;cDngB;ep1;ez;eDiur,ob,um4;gavl6voj;a09eKiEoh%p1uD;s,za;cHgá,r*,tEvD;ic;nEsWus,ás$v,úD;!f;af3eg;áf,íf@;if1Hurc,vD;áJíDó<;/ps@,rGsDtab<;*]p<,n6sD;ec,opD;!<;c3rD;+,oh;co[,dQgiPiNoz&,rIsGtEvD;o0uol;ieps2#tsDon,(pDse;us3;/ps]DsX;!ri;eFimda,oD;da,nD;oh;lot,nD;?,luv;cDf;#gilgen,os;ma;&ga0PimrDuas;of;rc;col,e00fnui5gZiQmrPnIrGtEuD;gi,)7;*,#<)6ot,(mD;!i;amacDebil,utan;ib;.o#f,igiIoD;icErtD;ap;aEiD;da5;r,sn6;(;on;cGdFnE(t?,vD;oj;eg;num,r4;ep1ifE>pD;<;o,rD;epus;se;^,ov;di,lY/tirCr;ol;cod,d13ippuy,m0Yp^]6r0Rs#0PtHuFvD;aD^;rg,us;gní~5qiD;hc;nF(EsD;eo,i5;f,n;aZeDiug6;aXcVdSgiPiLlKmJod,rGse0tD_,vom4zul2;epmGopE`sD;],rC;!e0;aEeD;ocO;c,psK;+;av,ecE;cFdeboE~s2#vn4$pD;xe;!s8;ap,ife;lEsDxe;%5;+3gen;iE#pedDu0;!=;c=2rrA;eDo3sebup;d,r;rta;cSgQhlOiN~g*,=csMrFss]Eta5vDzi~t$f;^2it9;+3;bGeDongi;lEveD;srC;ot;*,muD;ls8;ed;af;d&,fn4>~h;.6iD;rb;^e,ig,loDor>;pme;ip,ot,rB;am;/iD>iuga;ab;boHd7geWtsEvD;il;e_e,uD;~;op;n,p;es;]gGilbFrD;if,oD;#;us;ní;lF%ErDur;av4?;rg;eb2imuh;b$bAc0Sd[$mse-e0Qenâ(pme)4g0Ni0Ej%>l,l09m08n03rZsTtD;c*3]Qircópih,sD;eb,iFíD;oge,urtD;[;cedrLfrusdnK[2<HnG>gF`crE)LvitagD;en;an;*;oiccefrCut(po;ssCto;ep;];iw;ak;@;=;ecGoEsD;ur;is#te0viD;&;%D;rf;ieD;cnD<0;anD;if;amG^p,iE$tD;=,xe;=mDvA;ef;uh;itlú;e>gFoDucsúnW;círD;ga;at;al;dJrD;áEós*o0;rp;@,tD;enEubi5;rt;om;uj,ém,í<tlD;um;itD;%;oc;drD;?;epMiGoEuruxD;im;ir9;ac;rEsD;áb,íf;téFóD;tsD;ih;le;as;os",
    "Noun": "true¦:!1:#$%&()*+./<=>?@[]^_`~:er,re,ro,ne,ar,na,op,ni,et,se,ts,rt,ev,uq,rc,es,la,rp,pm,ac,ir;0:E6;1:EM;2:EN;3:DX;4:DD;5:E4;6:EO;7:CB;8:BB;9:EG;A:D7;B:CI;C:91;D:D3;E:E7;F:CE;a9Ce7Ai78l6Wm6No0CrYsQuNzJãIéGôva;fGp;!`;hn9mri;apI>,iHov,uG;l,@;(,uj;!(;aH[um,éG;c,pahc;p,rg;aL#oKoIuHág,élgAêGí5;m,?r9;ed,pr0;)lp,tG;n*,udo1xB;dagoj,tua;d&v,mGrbo,si0;(BN.sis;aSeRoG;c,dNhn7i$tMlKma,s/fo1tGvaf;cIiH+p,om,uG;a,do1od;el,@3;aDC#C;aGf;c,v;+,xe;!aG#r0imu3R;#>,goj,h]b(t,nGtuF;[,$vog;díl,hlum,tcár2za1;!gul,hlim,lód,m,p,tilim;ba5Pc5Md52el50f(gár5g4Uh4Li3Xj3Wl3Pm3Ln3Ep3Cr2Vs2Nt1EudívidAv1Axe19z18ãKçG;aHe1ivr7oG%f3;cs8m];d8p3rbG;!a;c,dadic,gró,hc,i10m0Zp,r0Ys0Nt0Lxi5z(,çG;aWcTiPnMome,pKuG;dIloG=3F;sATveG;!r;#,o1;ecGo;n0xe;`,eGuf;tGv6R;a,+;dIele,+f4s*HteFuG;b~<Cti<n11;!m0o,sCxe;(t,e,n0;aAHeG;lGrCs,to1;[,oc;cZdnuf,giYiVlUm%fTnSpRrOsn7tKutJvIziG;lG)g%,tavi1;a6itu;o^a,$sbo;ca,is;#p6D&Hov,%pD/G;!fin9;i%,s#pG;a,#;alc4eHoG<i+mda;c,lpD;def,g,po,t];iciACucoe1;!gis4;!+,s5L;a0P#,fAup*;coH]va,rG;av,c;gen,ssa;l,rbo,<0P;iGude;fissalc,lGnum0;bup,pG;a,xe;ip2r2/G;g,?;iNnL$v,sGulcn0;eIiGucsC;fo1mG;!oc;^Gs;!mi,xe;apDeG;mCtD;c4^,vG;!eGid;lBr;d5>,t5;!ri;gHnGs`o,va;ipo,u9A;#,il6;a1íuje1;lFs;itGo4T;cGejHom,uceD;a,ejG;bo;a0Lc0He0Gi07nMov,pa,rLsHuGx.AF;do1+m,rf,tiR;eIoGuc;g,_Gr;i,oc;g,r,to1;[4*;aZeHo7IuG;jn0ssa;mHvG;!e;aPele,iIom,uG;a,cod,gra,rG;<A;cJdeco1],rFtHvG;lovn2Bom;n7sG;>A;eHsG;an,#c;hn0lebat3tnoca;gKic)+f,lr5no1Qpi?e,sJtHçG;)l,%;(t,rG;ap4oF;`,n8;ap,luj;c,s;bNcréDdé@,eHlfn0rGsó5L;g,<Cíp3;cn0fJjIpHrG;id,t3;!s6;!us;!eG;!^;mâ,áh;jo1n;aIeG;jGpsa;bo,o1;!_i,r4Ftn0;cid+s,dHg,noe_2rG;!t6;i73n9;`,eM~LrJsGu;ap,eGimorFo;cGrgn0;a,o1us;e4QucG;!#,n0sC;!%s;p,^;bUcTdSeRiNrLtHuGvil;g7j,o,tuf;aBemInHsi+mG;!-oriemi1;ec,oc&;!ít&c,óli?;aGe9H;b,c,gic;eGt;g)89hG;c,nG;aFeg&,id;mún,nég;a?,iv;ul;mGutuo;em,o;it,mGr0urg;`,.;aLeKiJoIrGu];>Got;+,og;d,s;#,nEs&,<4;mó&f,rrB;!lp;(,rBsiHt~,uG;sn0;)Grut;cEg%;av2cic,eLit3oJ_eDuG;cHtíG;p2t;lác,ríc,át55és,í>;bGs;!mís;b2dom,<2;[4ieb;(,bál,cZdY[s5fXgél0mé1nV*a,pícTrHtGvan;!ís;!áLéHótG;al6~rB;_i,tG;iHsinG;im;@;]s,nJrIsHteGusu;~3L@7;#_e,$vda;oh,tn0;ec,oG;icnuf;inG+1;um;ímGómi=5;od;!as4;ní,ár,é1;nêlis,rém0ál5íHóG;gen,s;c$DfiG+;de;cib,lLnG;aJeHiGos;m2v,ziv;_Gs4;[4;b,mat;aHeGif,o;cn0p3raZsn0;b(t,vr2;#JiHoGr2;f,j,láC;dóc,mGr8tra;a,iA;g,pG;me;cGó=8;ún;aMeLiJnHoG%ca,ut3úe1W;m,tém,ír8;am0uG;f,m;cBd8nu,r9tG;n7r5/v;d,m;cRdQePgNiMl,nLtKvHziliG;tu;eHorG;pa;le;(t,lus6/,up4;[,imon4;cossa,];!il,ovG;da;mon,sab;!iuc,los;ob,rE;idH)b,olb,rab,siG;d,r;ém;c,id;eIiHoG;s,t;draj,f;dKgGmoh,vun;aGiJr9;iv,mi,no2Lr0sHtGug+l;)v,%p6;nEs5;%;aKeIoG;b.Goclá,s;uf;nor0p5toh,vG;ín,óm1F;iLmi),nJ$&g,s2tHvi<G;ef;em,ipG;`,soh;`,iG%j,ubiU;f,s;c&t*,$t9;ap,eG;l,r;bulc,c1Fd0Ofehc,i0Ml0Km0Gn0Fp0Cr0Bs05tKuHvaGxi8ãm;!hc;g)s,qG;atGr5;a,s4;abZe+bag,iYnMrH/G;d%n,l,t;aJoG;c,m,psGs;)G;=;!p;aOeHoG;f,m,p,zi%h;c&tr8dKgJiInHrG;eg,f;i05oF;bma,lc;!a,~C;!iG;ca,/1;dHtG;ibah,&s#p6sA;)m0ut3;el,mil,on;ed,m0;aK.ópih,iIsG;alc,eG*;$tA;láG@;);b,f,rf;d5ovrá,%t,<E;iHlG;og;cní1?e;ofelBr2;aDiIlif,oHuG;lS<0;f,n;g6@,t;av,ep,orG;tn0;cGrés;ép3íf$pus;aJeHutGúas;ita,&vuj;rGs;!ap;dItG;em,nG;ov;eiXiIlucH$Guas;bil,v;af,ifC;!cSlPnuNrMsJtnHvG;itca,on;aGe;?;$H/cG;en;vinu;otua;!m0t%G;po;aHibG;asn*s6iss*;#,no08?;!ap2olG;>;cos,rG;po1;af,idní,)mor;lc;c4Xd4B#á,f#at,g46h3Wi2Hj2Gl29m1Yn1Soss8p1Mr0Ys0Tt07u04vZxXzeUçG;aQePi<OnGom,%f;aIeG;od,$fC/1tn7;id;dJiIrG;eGug7;dil,p3;fn0],@;!um;uj;b2p;eHrG;!g,p;ma;lHrutGt$c;an;eb;at,iaG;c,f;itGo1$s6uhc;aHcepG;sr8;iciAn$t],tG;c2WnB;gGl,r;nGá;íl;ad,eZiYlXnUoTrSsHuG;l,rf;ePiIoG;c,pG;o1s6;lItHv#G;!t&;&ic,ra;!aG;iHnrG;oj;cep3;f,%lf;`,*;n,rr4;aLoHuG;gr8j;c,p;af,ov;ec6@3siv;)G*;lp;aJeHiGlob,n#_i,$vn0s9u2;oc,?s8;f4m,ps4^G;me,rus;!c;a02b00d8ep3g6ieVnUohT_0$Stel,uGval5;co1gif,tG;aMcKieJlHnG$ba;ip;a,ucG;!~ga;fe1l;.i?Gu18;ra;diI$G;_BtG;il;dn2;t,ug;!n7;oh;dIfGn9rr2tnorf;!-aG;dnug7tx7;aG)b;c,m;mGo;os;c,mâc;aKiuJlIoHuG;or;c,=;uc;qe;p,te;am7eJiIoHr8ul0;ep;d,z;cidEgáp,m,nE?ám;c,p,tnG;ec;aOeLiJ],rG;a,oG;fGn;!#;c,lc,rgGtív;ál;lbo1+c,*,tG;!sG;is;c,rG;go1;aLeJiv,oIuG;a,cíGléc,mróf;tr5;b,c3;bat,nG=3;aj;c3s;#gi,ol;a1c05d,e02fZgVh)Flímaf,mSrK/ItG?ratua,v;!n(G;ag;*,ugeG;rf;at#c7geLoK<údAéJóG;mEtG;iv,sG;ih;f,t9;.,g.2i9;];[;edaGonoce;ca;_0;oloncB$HétaG;=3;&;.;(gotHosolG;if;of;dHlbm[G;sa;`,i,];(com4nIíG;l*,tG;on;âtVêGívo1;dRga,iNloM$fLsK<iJuG;lfAqeG;rf,sG;!n0;s6xe;ua;#,n0;iv;cIrG;epD;xe;!sn0;i/1&G;pedAt;+;%pJsG;bHid,nucrG;ic;us;mi;ed;cOlKnG;aHiG;(,l,z0;_2tnG;om;atIiHoG;c3f;!f;ab;or,r9;el0iGord,r2;ma,rapG;(;at;rá;aVeUiOnLoKrHuja,íG;as;aug,eGoc;p,?3;/;m,r;ab,eGo;r,v,zG;af;dEm0&Irr0tr5vG;!íd,úd;ap;va;oc;em;om,?;cKgImaHn,=G;&,/;c,hc;eGurd9;hc;/,éd;iIoHr9sub;am;b,pé,=;lbúp6rbáf,súm,tG;sí$tc(2á1íG;lG@;*;^;`;#",
    "Adverb": "true¦:!1:#$%&()*+-./:la,ed,tn,at,er,ne,sa,ni,uq,op,em;a10eUiuT#SmLoCragav$,s3z2á0ãhnama,ê-r.,ía,ós;c,j,l0çi-;!oca;as*,ev#t;a7e2iam1onDá0évarta;i#,rt9;!aj,$;ru2%0;a0/(tH;!d;g#,h0;#,)n;)pa,rev$;cu.7d5g#,i4r%$,*ca,t2v#s,xiab1ã0;)s,t;a,$;ium,n&,re0;c$,p;/;ai07ec,o0ut;m0Nt;!m&;e4i1é0;bm&,-a;f1s0;!*;);b,%o0;!eT;m,+fa;m,qa;d01gnol,joh,rpmes,*Z%0v(b;aW/0orf$;a9e4l0os,selpPumFzilef;a2ev0icifM;a0iss.;tse%ocDvoP;(,+f,pic+Orutan;dnarg,rvE%1ve0;l,rb;&imocn8e0iug1;seK-0;esn6;ciKdGen&luFgiEiraDmBr7s4t3vi0;s0tefe;secAulc0;+,xe;aid/i,elpm1rec;)t1ojar0;oc;+;a2ie0ugG;g0mi9;il;lc,r;(t0itlu,#c;xe;id;%a;mis;a0nufo1;/on,i1tis.o0;rp;*mB;nu,tavl3;idDt*b,va0;!rod;-;es;(da,#b5no2r1úi0;ma;&;a,d;d+a,mi7r2ss(p1tre0;#;$;ienam3o1u%evr0;.;f0ga,rtuo;!a;(bos;ca",
    "Infinitive": "true¦:!1:#$%&()*+./<=>?@[]^_`~:er,ne,oc,ra,se,la,ni,ed,na,ba,xe,ar,ro,re,hc,da,uq,id,op,ep,pa;0:0G8;1:0G6;2:0F3;3:0G2;4:0FI;5:0G5;6:0FQ;7:0EC;8:0DQ;9:0FH;A:0FA;B:0DO;C:0FV;D:0BT;E:0D7;F:0EF;G:0C4;H:0EV;I:0FK;J:0F8;K:0CU;L:0EB;M:08H;rN;a87e3YiY_Nôp;aWbVeTmSoR?QsOusN<;!(5;+,^N.F_;!e5*;pDt8;!rp,tL;i,%3Q;d,rNt.;!bLp,t1;os,us;!rY0tsuj;!a3Hb3Cc&004d2Pg27hn26l20m1Un1Mp1Kr14ssot,t0KuZvVzN;.rf,rTuN;dPlN;!eNs08M;meFr;aTN/,eOnZorN;p7t8;!d,r,s;ap3ec,uz;!aP[,eOnMVo5?Nuo7;s2t8;d,rOK;!#,rXNs0;b05csimi,g01lXnWp,qUrPss_,tN;at3itsN*;bDeHnPo5;!fQp,r0tsN;bO+,nN;i,%7;a,o2;!usu;eZJ*l0>tN;#,<;a,imB;a,/,cPfO^,oN;p,ve;!a,e3In0B5;n0B4<;esP*tO&N;!d6;sB<;!n4r9so5;irtNmi;a,#,n4sB;al,celf05e03im01nWrTsPuN;bAcNlg0;*,?p7sB;evPiNor,ur1;sN<LN;bDeHn0ASr9sa2;!#,*,s0;apOevNos,u6P;[,^;!eHm4;a&g,eN;mPsN;!n4sN;a,#Y4^;!ef,s0;[7e2Vi,o,?Ns07C;p,te5;lf6pN;#,m4;!#,*,u$g;!ap,bZeUgen0i]ToRpQrPtun2uN;aNbm4rp;h,<;ag,os;muc2us;fab3lNv03B;f7%2;[7#,*,r9;[,fOgNs8te5]8;!^,*,us;!a,eN^,n0A3o5r0C6sIEua;dRTrN;!p,r4;aO%N;!#,$,s0;!#BW;lucsTXrCsNut097;+,uc;aTeSiRrOuN;!#,mP5p,rb,s0z;eNof;cNd01Q;n4sB;f0t7;l,v0X;b,g;=b,#0DZiO>d,usN;!bD#X6n4sa7;d6rN<;g3^,pN;eHmNo,us,<;i7%;aRePoOpmi[R8uN;bKHp03I;bMJg1m0p7;cId,pN;#,m09Do5<;bYZf,t3;alp,#,urg;a02iZluf7nUrPuN;fNm,r;!#,s062;ap3ePuN;!sN;!*,s6;mNpsa,t0vWS;bDe,i;iOuN;!jQSm,pYO;c,f,pmi,rNt09N;!f8tsN;bo,[,#,n4;d6lOrNs05R<;e,f,^,r4;e,f063%;!#,oNr0AXv;c,rt6;a07e03iYnToRrPuN;al~,ca03SlN;a,i2;ac07ZuN;!s,ta;lN?;ce,p0CN;aQicP%,uN;fNtn4;!^,n08Js05D;!sQ;c3pIrb;cQlPsOv^N;!bD;#VY;e,i,%;+,*HW;mPpOrgN;a,#,or2Ls054;!mi2s0<7;!%,s0;!usNvS7;?p2sB;iPmuNus;cNz;*,us;*2oN<;c,rp;bAcQrtOsNv3;!s#KZ;!a,bDeHn04Yor29sN<;/,^;!eHs0;b3Rc28d1Ng1Ih1El1Bm17o16pmor14r0Ws0Vt0Jug?0IvY<m7zN;aP^N$b,%;!=TX#VDlEnNr09Ws0;eb,%;fPj,rN;pNt;a,m4s0;!-meb,aQeOr9sN;+,itas;mut,rN]il;!=,>t,tup;!rTOs0;!a05eZivYloUoQrN;eOosN;!/;f,t8;@,mNrp2;!eHoN;cNrp;!ol;sPvN;!eN$2;!d,r;!/,#,sB;!#K7n4;d,rNt.;!csNp,t05H;bDeOnNo5;aFi,uV0;!d,#,rN;bLp;ce5#,h;!#,os;!aWbo,eQnP?vOsN;/,us;!bDe04Sn06WorT0?02;am,%;d,mOrN;!r0t1;!bD#PoNr08V;cGrN;pWDt8;!&,t1;!bNl;!a,eHm04T(;!%2(05I;!c2e]SfLrN;av,oN;cNm;!a,eHn06Io01J?OsN;e,^,.F;p,t8;!-N#,lE;meb,siE;!rN;et8i,%;d04Pm2Gp,rL2s;eO%N;!rC;g,rNt;p01Jt;!avOeN;cIrZ1;!i]e,s0;c$PloN;cNt;!a,#,$,(;!e5s0;eQiv,nN?ts/;aNir,om;rNt;!/,fn4t05J;le7rKMtoSK;e03nO_,rN;a,`,om7;eOoN;c3psKH;cW#pVfUlpROpSrRtNv7;!a2e5nNs047;eOiN%;!r036;!bDs0;!pC6;!a,eAYmi,o5sN<;+,us;!+,o;a,eHm03NrD;a7#,n097sN;a,eN.F;d03Sr;cNf;!a,eOn4orNr07Fus,<;p,t6;rp,t.;eX$WrUsN;aSeN;bur1dQi]a,lPmut8nOrNv?fe;c05XoJ5;am6evuj6;avn4o[;!.c8urc6;n7p;eIotN;!#,n4sKF;tr9v03D;a0Tb?bos1d0Nf03Wh0Ljir1l0Fm0En0Ao[,p09rWtQ]OvN;aQebAi=1;aNir1.P(,uol1;!rf1;!eRionQ)1noP>MsOuN;rbA;a/,+,iF2ubor;ca,t1;a,e;~,rt1;aXboWd_a,eUgTiXRoRrQuN;csOdNf1;amG$;bo,e;at3o/;lo/,m3vN;af2);aAe1;fo,mNp;!i,s0;$,pA;c043lc3pN;!aV3m4s016;me,>t1;aPef,rN;aNet1of;c3ug2;mr9v18;eUO>[;aReNiv1oM;bN&M;atsNme;bDeN;!e5r;f2t>f,ve5;lSJnN;aM%UP;aReQiP.OrNuA;at1ev6us1;lpPTrg1s1;av1lCUod1;bo2mu;pTFrga;m3v3;aPeNmal;b03UcN;#,n%IZ?pA9;c,s;b07Bc02Nd00CeWZfWGgUIhRZiOZjNUlL9mK1nH4oGCpFQrBEsA3t50u4Cv3Mx3Bz0PçN;a0De0Ai04)03nWoTrOuN;b6f,ga,im3lLoFrb0;aQePoN;!fNm);!#,(;ci),t;fsBg3p;b3c,[,hJmOpArN;!ov),t2;#,);aPeOiNugab;!rts0;?fBva;c),d,ifa,lOrNva;`(2t02X;!abN#;!a8F;!c2#;!b4d?p04oRrQtOugNv;#pYE$;a,ief1sN;em,uj;!e,uo;f,)b;/c03CmPGpOrN;+018~;me,oF;bU0cWdUeMgThSlRmQnKov3p3rN;abTZ/,gO>Nt;c3m;n00Xs0;!ufY2;!eCZ$;c6l07;ab3#01Cl+a;`N>M;(061;!ip3;a27e22iQnOog,uN;bmal,rc;aNic;b,z;=01Pc>Id1Xe$gomoh,g,h.t#b,l0Um0Sn0Kr00tRuOvaN;rc3us;ja,qN;etC&N;.,?ih;aQePnOoN>M;c,npih;amor,eic01V;/f),d0fo5ngE_,rI7t*s;b,f1mOpNrcAR;it.,mis;!=d,eOgNilc,o&,>n,uaF;it3;lbo5tsis;a00belec,eXitWoO?ta,tN;acic,ele;bTet,getCirR)v2meQ$m>p,pPrrOtN;inom,ua2;eta,oh;av,met00A;m,ta;eNp;f8tI;&,ur;as,rE;jo,lZZtOvlN;up;=Cc=CuC;dilLgluv,ilRlN;_,uN;ciOgNp_;#,*s;dir,trK;imaf,uc9;aTeSivBoQ?OuN;mi,t>po;dom,f8tNv1;=f,e;brCce5ga,l4m&YFnCrNt*s,çE;dKi;bW1d8lLma;bru,g>S1muYCrit,tisul;anBel_,iNon%e,>f07;*m,to,xE;aVeg.ve,iOoNs0ucatsbo;bmis,coJZhnU9%),ponom;bOcod,ga,?t3tN]XZvic;?f,soh,uIV;aPiNom9M;n_sBsNtapm4;$s,s_;em?pmi,ivIRpluc,?nluv,sn_s6tN;n4on,(;b0Fc0DdnV0e0Cg0Bi08m06n02oss9rXsVtRuOvN;a,ir;di27qe,sOtN;a,ca,irBF<MZ;iv,$00H;iO$mNot,>mi;!ur4D;gBpNv;ac,soh;an,?vN;inu;eQg02Qom2tPuN;lp,tanN;!r20s0;$c2uen;bil,$g;aP`,iXYoN;icNsr9;an,utitsn9W;b,c;i.,>N;f,n;cN$v,?tE;`3iN$t_,os,?m4;fo,*;el,^o5;di,r;^=,oNsif;f,l;!a,?v;&d.t3uga;f1lYUpArOvN;as0#;!pN;!sN;+,o$m;!rpB5v;aWeViRorQ&,uN;l,orOpN;!#,me;fa,t1;b,&;aPeOfNl,m;!a,e5;d,f1ls0];bE7cYZf1;.,v;l7%,rg1t;a08e05iXlWoSrOuN;j[4ol;eOot3uN;cZ9t;!$02YsN;bo,#N1n4;!cRQnPrNs022;pNt;!a2#,m4;#,i;asR4#&,is;=,[d,e,)s,on,rTtPuNva7;!qN;&,(;aPcLBeNis_,luc,$c8om,(;fe,jN;bo,[;!c,#,s0;cUG+,p;c,lNn,rt1s;!bDeN$,os;!rC1;cPf,h*),lNNrN;bs0cNgFIp0t85;!$2s0;!#,nZ8(;c08d06fHQg03jej,ma,n01qZrYsTTtN;aWcUeTiRluPnOrivs0(,uN;a,lf,m;eJ_;c,mN;ut;/h,ecNs;e5n4;cIfe,pr9;aM7eN;fe;!r00Ot;!b0c1`,&,ts$m;+a,*N;gnol,por~;et5BiN;s8tnVG;aOe,iN*m;.~,?va,za~;!s0x1;=g,iN;v^8;aN#;!ve;a49c45e3Oi2Pl2Gn17o0Xp0Sr0GsZuOxN;ete5;aWbVcUfT@,l7mS*m,ohJpQrNtE;cNfs0;#,sN;e,r9;eHmNsWK;a,i,%;i,%,r9sUU;#,n4;eI(;al,+,iF;lf,p;a00bo,eUiRnXVoOuN;c,g00GjGsSR;cOg2mNpCBr&,t;a,eVO;a,#,$2;d,g6lGps0rJU]nK9vN;a,#N;!t1;!b,fRlom,noh,oQpArOssa,tN]6;!a,+,n4o5;!bLc,pN&;!a,me;d,m[;inEn019;bY4fa,gOp,rNv0;&,tn4;!a,$,?v,s0;aWeQoOuN;c1f;/,c7fnJVh,pNtWM<;!a,eHmXBsU5us,<;bRcQfo,lPpOsNx1;+,nYQsB;a2(00O;a,f;!a,nU6;il,oJ;cXRfN~;!n00U;aQeOoN;![,%;cNr;#,rZ2;c,[,r;bVcTdGg3hlibsib,iga,lSnRpCrOvZJxN;iFQ$;!ag,b,ol,rNt;aN+;!/,ma;!a,+,%;!ip,rUA;!apA+,iN;ob,rt;!as,me,s0;a0ReWiVoRuN;!gPjOsN;eb,sa;!a,[,n%8Z;e5r9;cN9mN9pPrN;deMfN~;a,+,n4;a2#,s0;f,lit,p7]6;bV1c0Fd0Egufa,i0Dl0BmWp?s,rVsTtRuOvN;!a,iv,*7?fG;gOqNrc;a,#f,_a,(;a,.s1;!a2nXPsN;o,us;!#pNi,_a,sa,ua;!a7#;aD5f1>Juc3;aYeWgViRoBFrPuN;a,cod,g&,rN;ts8;ef,oN;[,ta;c,dPgUM),~,rOvN;ap,om;`Ipmuc;es,n4;=f,es,ip;lpNrc8s;mVSus;c^em,dnuf,lOma,n>,rN;ap,cas,uj;!rKug6;aNoiv;!ca,s0;bMcapmi,)s,>MD;!ess0iJ$;o8sN;a~,#J;cPgiga,hlir/,i[,j,lpOmi,p3rNuga,velG;ata,be]G;!mi,sSAus;!=HJ+,$2;aSiva,oRuN;cOd8m,pes,sNva,<;#,nVC;af,ifBo,sN;e,ua;c3s,v7;f,m3sN<;!sN;a,#86;b0Ic0Gd0De05f,g04l00mYoWpUrTsQt)s,uPvN;=g,eN*,%);!l,p3;cric,q2;=Keh,iO.F_0sN;ecen,um;]6v;b,csbDf,g,it,ri,ta;!aN#c,ice5lKos,u@;!c0;cNfa,nr9p,ça;a,si/;aFiNov,>d;!lXE;cir9fn4iNo4G;bNcaf;aN+,iss_Q6;#,h,*;a,^CE%M6rug6ur;c7Qd,fTjSl0pPrOvNza;),or~;^1p3t3;!sN;eNus;d,r2;a,#,$,us;!a,nSL;!aOeNrWH;!#,m9OrcAW;!rGG;!a~cC2#,ilNnUBorc,?IsusM3<;efC1os,pI;aOeN>I;d,r&;h,%;b02cZfYgev,iWjVlT*f),_,pSrQsor,tPuNv;qNrip;ite,sCY;ap,i]&;cNex,f,prW5&J;eWG<;at1(;eWE%,pN;m4ucol;bo,eXD*,o5;nE]N;!a,*;a,*2;aOnN;al6e;!c;!af),eh;aPeNim,&4u?;fQWjo5l4nQOpNt0;(,<;j,l,pmi,tn4;!b01c00dZ#,gYhJlVmUpKRrQs0tOv=N;ag3g3;a/,n4sN;n4_a;!aOf6tN;!eHlEn4s8V;bNpsB;lEs0;!#S2ilJ>f,s0;eOiNo5;d,]a;d,r81;$2s6;!^nC;!a2e5iJ;ab,#&;a0Ue0Ri0Ll0In0Do0Bp09r05sTuN;!aR/,cQ+1fOlc6oN;!p7;a&pNsPW;!a2s0;a,#,(;c,p;aUePiOoN;ca,d1f,ma,pJ1rg1;nu),r?ta;cLNf6OgSLmRJp3rOvaN;!rtG;et*2gOpNt3;a,<;#,*,o5;!cPl,ma2pNrg,v0;!=tlu,#,mLBr9sN;aFeF.F;!=f;eOucN;!n4sB;psBvN;![,ig?t,nPJ;al4ilN;ce;d,lg,mMIp4VrNt;cen,p,t1;aQeN;c8dOpNrpNUt8;!a,#,mEVsB;a,n4;c2ma,rt;af,obOupN;!#,mS8o5<;!meIY;b,ce5)R%,p7rQssa,uPvN;!a,eN^,o82rPO;let,r;g,qs9;b,f,i,p6;!.,rK;iv1lOpNrpAVtS2;!os;!g8;!bS2c2f0rOvN;aAK$,sOQ;!/,&,ta;a3Pb3Gc3Dd39e2Ff2Cg26i1Tl1RnoOWo14p13r0Rt0AuPvN;alNil;!a~;ats06c05d03fHHg00jZmYoXpW8sVtN;aSbo,ceReRirQ$va,pC>t,sPuN;f,rt(Ns;!#,r;im,%2;c3t;jn4;!fNm,ns0rf,s;!unE;=,em,$Nsif,ualc1;c,m2B;!d,ga,(tR6t3;!a,rum;!/,n%MQ;esMAifNluf,&Mua94;!a,e5n4sN;+,.F;!amGbo,+,lom2B$pTWrN;`,og1;!a,o5s0;#,*;alodi,e01i00lif8XnXsN;aVeTiRnQoPuN;lNrf;!i;mU6rp;om0;g6l,*mN;!bD[;[,lKma,$f0]N;es,>;c,dClG;eN%$HM;!cN[,#;!nNT;b&,c)c6v);lL$pGEpN;mi,r9;aWeTiSoRuN;!bAm3pAsPtNz;ac,nN(;apA;!sD;b,dom,fGj,t;bQOca,m,p3;!b,cOfGpAs,tN;a,$2os,s0;!$,s0;bLRcLRgNm6Yn;a,s0;m4osLAut3;!b07c06[,faGCg05h04i03j02lYmUnTpRr9s(QtPvN<;aN+,),&;l,~;a,cDYinom,sKut;fo5ssa;ave,rN(,ut3;%8;gi,im;!aPeNir~;d,mNr;!#,%;!n12;aPfa,oOpN;+,mi,<;bAc2;ca,v;am,`;p,?t0;c,lem,n9;!iv7;!+O6.,oJ(T8;alNor4I;!e,%;aNi@;@,p;!aYbAeSg,l0mRpOtNv7;!a,#,(;!mav,sN<;a,eNGnNus;aFi,%;![;bGca,dEgi),@QlOn9oNt8ug3;jGpA;a@,iN;f1s=/;!*N;rt1;p,vs0;aQePim0BnOolN;!am;as,is;),r,t*FY;lfNsNK;!+,n4;anOiN;cRP@;ip3;!b0Fc0Bd06fi05g04l03m01nXpSsim,tO]J9vesNz;r9sa;alb0iOlN;a,u[;!#,lN;bo,sLQ;mQoPsOuN;ap0c6s,tiv;aIe2o5;!%;etNCi;ePic8lOoNum6;!s0<;uv;geHv;olga,(,unN;!e;eEEot;!aIirf6;cov,lo5;ef,iPn_3SoN;m,pN;a,me;l,snN;%F4;aPlu,$,&cOsiN;ve;$,<;lGYm;e/,ilQUo,?v7uI;aPeOiv,nN;alEeg1ilem;m,pA;l,]NU;aOeNul;sbo,<;l,ssE;eUiSmOoNucule;!c7dEQnEs,çL;at3ePossa,ulN;a,sN;+,iv;lEMms0;as1lNv;!i]e2;lec,$t1]7;!cSfNHlcS8mRpOsNt,],v,<,za;!siv);!a,eOi]e,mNsB;a2es0%;d,rB7s;a,uf;a,nOsNuça;am2+;ac3e;a05e03i01lZmUoTrQsPuN;coN@,_,~,rgG;!#B0s0;aLB#c1i@;aOitI%1uN;su,t0;!c,z;)g,s1t;aOiNoDS;!l;cOl6tN;!(QN;!a,$;apGucN;!*,s0;cNrKPssB]e;et.,itrCO.A;c0rN;csBtIC;cO@,lLpN4rNt2çaJ;!r0;!$,(;b0Dc0Cd09g08h05j1l,p04r01sZtXvTzSçN;aGPiN$/;=ta,dPefN;a,?pN;!a,mi;)mG$/;!=LF;!eOoN;p2rt;n,rN;!bL;!nNo/2s0;aJe,oM;!sN;a,#;ag,[~,)/,oOrNt0Z;ef,oM;b3c;me,&;lO*uN;qa;a/ta,irga;am,eJN;!nOo1rN;a)g,`,ota;a,`a;!e,(;as1#,mC;a2Ae23g1Xi0WoYrQsPuN;[4f1),tN;!>pmi;=g,it,or;acB5eQoN;!bDc,[,mGtN;!#,nK4sN;e,.F;bih,[,f8tOvN;*,og2;),*,sN<;n4o5;/2dC3felet,iQlFUpmat,rPsNt31xia2Tzas;!sN;#,^;o58t2;cWp3sQt(O<N;lf7;gN];!nILus;aco,el,iQluOsNuf;#pH0im4;pNvn4;mi,o5;r~,vN;!or~,rIY;a03c00eXiTnPoApeceH>HOuN;ac,loN;s,veJ8;as,eOuN;f,p;m,t30vN;bDn4;bMdOefr9s_7tN;`,rK;a,n%N;!a,#;fnL3lNps8r^7s;!eN%;rp,s;eNirf;fnNles,s;i2%;!lNrP9sHRt3]e,vo;#N;!r4;a0Mb0Lc0Hd>bD#DQf0Gg0El0CmYnGpXrVsTtQuNzub;qNr&;aN*,(;m,rt;aOoMrHQsNulga;=co5bo,+00;!/s,p,s0;$,saN;!ssa;af,cuza,g#9tNu;!uod;!ac,me,oLK;!aZeYiVluUoRrOuN;jn4li,r;ac,eN;g,tNv;!+P<;!/,c,dOnN;!+,g4;!e5;c,f;le,rcN;!#,*,sN;+,^;g,ssB;l,t6W<;cNob,picsB;eH*;ami,iN;>;a2#,n4oM;aPitav,lC.l,oNsaf,u);ic=,rN;it,tK;@,v;m4ob;lpGma;at3eQiOupN;!#,mi,o5<;d1IsN;eHn4r9;rpN;mi;cHZdRgiQi),n87pPrOtaN]`a,zam&;cn4;d,es,fLg1oMt;!a,+,me2;csim,xo;n4>N;!e5%,s0;/,cUd,fTg8Lh),irdnElRmQnPpOrg,s,tNzata;!i]aF;me,(;!a/;!aEIe,ri,uh;ag1f,pN;!a,<;!a,o5u;$,uta;a0Je0Hi07l05o03rXsUtir,uN;fSlova,*,p3rRsQtN<;abAsN;e,%N;!a2;n4s6;!~,&2t3;!+,r9(;aOe,iN;/,c,fLrc;/,isut1lp,p;aReQifPofNut1;!eHnNsFP;e2i,%;!a7nIT;!f1ta;!),s0;d,g1lpBrNsDNt7;a,bA;aNif;cGpDZ;cVd*v,eUlTmG.9D%7GrStOxorNzB;~2;iPlu,*,sN;al,eN;!bDrG1;gel,v;!cal,gal,p,&;!bD%;t,];+,$;fsalb,g),rNtsis;!c,tI;!cWfUgT@,lRm2rOsN;+,lLW;b,gOrNt;a6I+;!o5;cNfW;!a,eHn4o5<;!)M;aN^,*;!za;a,(LG;a1Wb1Uc1Te1Cf1AgGXi0Vo0Ep0Cr0Bsigel,uN;a08b05cZdXgWjab,lu5ImS.,pQtNza,ça;=gGBiNor,s_;p64tN;!*;!iN%;nEt3;ePiN>f7ucG;sNt3;!sB;!rt;a4#,.86uj;a,nNom;`,o;aR`3iOlC*v2o8ric,sN;aAo;d$pr9ev,rtEtN;&2sN;eg;je,m;aOirta,maN;!+,r9;cH3fFR;/,j1;el;o,ub;meNoJ;tn4<;b02cZd.&f,f3gYhnAAiXmWpUrSsQtOvN;e,n4;a,iN;b,]nE;!+,iNn4sa;!rJ;!aN$2&,tnE1;p,tnC;aNrJ2;rtI;a,i,(;ag1t3v;+,*rg0;!=O+,oNs0;to5;ac1;!a,#,me;ab,bZcYfXgiv,@4missa,nufa,pVrUsa,tQuO<,zN;i],uf;g*x,qN;am,i.;a,nPsOuN;m,r;eK0*,_a;ev,ic;rI2t,ub;!+,ip,m4oN;c7s0;!r9s0;av,so;isBAom,uN;j7nbo;a,*,uN;mCr,s8;!b01cYdom7gXm,.,og3pWrTs,tQud,vNz;!a,#,iOoNs0;$,toJ;fa,n;at3.Oo5rE(f6uN;aJt;ms0;!aOiCtN;a2(;f3gat,ma;!a,#&,lA1orta,rI2s0;!alf,+,nCY;af3nN;aNip;c,@2;aNeH;/,cs0g1;et,ic6(m;iNun;rd;!bWcVdUf,gThnu~,mG0*Spo5rRsQtOugi2vN<;!rHRs6;!$,sN;e,*;aJsava;!ruc1t3;!sAG;!#E7;ab,`;!rHJ(;!a,me2;a0OeViT.RoQrPuN;/b,peE9rNs,ta&g;?fEMt8;at,of;)2$,ps0rDZt1;b3m,rN;f,&2;eN),m,r1zog6;b,);bLc0Dd0Af09l06m03.02ov,p01rYsXtRuOvN;=b3),*,oF;gaOqN;=8OnEob,&;g,rp;al,e5lRoQrOsN;=,ef;aN%;pA9]3;c,g,m;ov;+,$,?v;aOd`a,gen,oNuom;mur,p;!cCf,m,tnCv;!m8Gs0;csot,lp,m7ts9;aOirN);cal,gal;@,lf;ac,eOoN;cas,g>g;p,v;ab,lL;aO.,rN;ad,ev;!pm85;=Niv,ob,>f;b,g,t;b,g1iv,rNssKt.va,ug*l;!%DLtN;!lu,$;a2Jb2Gc1Id16f11g0U@,l0Nm0Mn0Lo0Jp0FrXsVtTuQvOxifsa,zN;av3imoh,uf3;aNbo,#/,i),$7ossa,s0u.2;!#,rtIs0ta;g,ln4qN;am,esbo,.rf,sN;e,ot;af,is,sN;afDBe,i.,ug.;!atNet(.,.,porcen;.f,<;aZbYcXdnEes,fWi,oSporpRrQtOuN;j8mal;apIsN;e,ud8;a,of);a2<;c3lgPtN;iv,siN;h,v;!.v;(BK;!#,o5;e8^ul;!c,gQ)ssa,mDrPtnOvN;!a,(BI;ev8;tn4;.;!a&l,#&,iPoN(,urrD<;cNdor,rt3;!o?x;c*5rrD;bN~;!a,m4;oga,ulC;!e5%1u);!aS#&,iPoNpM;fNp3;!(,<;bom2cNfGxua2;imod,nN;%7;!p,t6va;aRelivi5iOoNuf6;le;tNv;il,(N;rp2;lp,s(5tN;n4(;!aQe@,nPoN>p,s0;c,rN;af,ta;e,%2;!c9Ks0;aWeUisT$RoPrub)b,uN;j,le5pN;#,iF;!rKtsN;uc;c8pN;iliv,m4;bDsB;mNs7Et1;!#,rEJ;!lgBrNv;!ri;a0J#pGUi0BnUoRrPuN;b)b,nNrc;im;em4oN;sn4vB;gen,sN;n4sN;a2^;a00eQunN;a,eNo5;!d,rN;!p;cil,dTgRirQlis,?O(5tNulf8viv;in9$s,_;fNg,v6;^,n4;`I;a,ilN.t;gen,^;ac,iN;fn4vN;e,o5;*f,tsN;busA4e,^,nuN;cric;c,d8feTlRnQpP&cGtOvN;!es;on;o5sua;i7um;aNeEZ_,pD;!m;lE$b;bAfe5ma,rga,s;aOmNossa;ac7;ss6;!cOf,gapKms0rNs1t3v;!p3;!ot;c1Ol0JnN;a0Be07iToRuN;!cOmetsNpAr/J;et;!),sN;=;grNs;ev1;aZcof,f0lYmaW.EHpVrStagAR](m,vRzN;ePivO%N;!-é5;!a,n4;ma,pR;a,#c3i[;aO[NotnC>~;~,]3;ca,fAJma,ssK;a,(;cNvuol;!$1H;a2bD;b0Sc;dPg1pOrN(H;bApA;me2s0;>,s0;bScRf&MgQl,ma,pPrNssa;a0M&,tN;$2(;a,moJ;!#,&b;a,o/;!#&;a09e05iUoTuN;af,bRcsav,gPrOtN;a,$2;b1FtK;a,$,rN;em,o;+,>b,(;!f,m,rr2D;!bom,c$WdVfUmTpA9rStP]EvN;=El_,rN;ef;ag1rNsor;apN;!m4;b,rBIt;lKuh;!r9;+,or1;!vs0;beFg1mPoja,p3&pOsnoNtn9;ca2;a2me;es4N?vG;/Fc01d00eMfZgYmXoVpUrRsaQtOvNça07;ox1>;!aNeH$;!b;ga;!aNt;bNt;!me2;=ta,me,(;cNssa;!a@;!=;im3n3F&g,ub3;!&f;./;!aOnNo@,>pA;e2ihJ;va;a01e00iZnUoRrQuN;bN@;eNme;rt3;am,%3um;b0cGhJm,rNta;bNp6&;!as0;aPiNuf=31;!@9l6p,rNs0ug;!ts0;g1l,mNr&;!#,s0;f,@4m4p46rpCug3;f2lf,rt9;!c44ga,lD5ps0rNs,t;!r37;a1Ee0Vi0Kl0Fn06oXrSsQuN;f7jO),og6rNs,t3x1;dE$;!bDn4os;aN`,if;g1r;aPeNotuo,up03;bNts_,v89x1;);bNc,lGma;me2;fUj,lSrOvN;![,#;!-bPd,rN;a,eNo5;d,t8;a,us;aNomoh;^,tC;a2#;aUeTiRolQuN;f,mNs;%Ns6;!<;a,eBIo5;g,@,m=o@,pTtCv,xNz6;!ac;pC&;m,z;aQoOuN;j,mo5v0L;c,fNma,pA;!s6;g,s,t*p,vC;=&2dWeMlVm>f,ps6rStN;af,iQrPsN;aNev8*,uf;c,m;`A;l,m;bN`,ri,t8;!a2oN;!l,s0;!fo5%,r9Ms0;afG$m,o5;c,f04@02i&v,l01m00nYpWrQsNvan7;!>m,sosN;!sN;as0;!f3gRpQrOtN;$,(;acN%3;!e66$,s0;!me2s0;a2es,n4;!a2(N;d,p;!/,eNos;d,r5T;a@,uf;!a,eHofs6;!a,nN;%G;aFo;c,d8fa,@,iR),m3pQrOvN;!^;fuNp,t28;an,s;!a,o5;$v,rbA;aYeXiUlTnuiFoRrPuN;b,@,l,rNt23;!t;aNus;!g;fa,m,solN;if;af3og6B;b,ec,ns,p,rOtN;ap3;!g,>b;lb,&ta;/Sg,rNs,t3;!gN&g1;!oN;litOtN;of,>;ad;!s0ta;b2Vc2Md29f28g26h23j1Zl1Tm1Pn1Ip1Cr10s0Tt00uOxo03zN;ag,norb,ov;gUqN;aRnOoN&;lb2m,rb;aNorb;lf,rN;b,f;b,cEf3l,rNs,t3;f,t;aNn6of;pNv,zeugiz;ap,mN;al6;a0Ccat,e0Ai08l07n00oVrSsOuaN;lf,rt;aPeOoNuc;c,r;!pA;h,r;aOoN;n2s;c,~;cPl,mOrNsip;!it;ac3;aNi@;@,&s;aReOoN;p,t0S;malrKpOs#p7tNza5;!ap;!?s,s0;c,lNrp;ag,p;a0Bov;eNot;lp;fN@%ir,lob>b,zag;ob3;!c,flo,g6@,pOrNt,v=b;!ab,ip,t;!as;aR)f,$c6oPsaOuN;an,nE;!c3p,s0;f>matem,mNrp;im,>fa;b,rfN;=K;aXbmVc6dnUev,fTli@,oRp,rOtsNual,valK;a6Re;aOeN;d,~,ug;!cGf,pmE;/s,h$sNlf,p3tsK;!sa;!#,$2os;ol;e,oN;!s;!cGlc,m,p,r;!aRlog,mOolNsa;ag;aOetaN;ssK;c,l6rg;!c,m,p,s,tQ;aRem,il0oQrN;ac,`OoN;c,t;!(;rit,vK;cNlp,m,s,tipCv0;as,(;!al1ePlKoO?pN;!mi;f3n7;rt1s;aQ`,$2oOuxuN;rb;!bNc,g;!mab;bNm,p,r;!mC;ap,nOrN;og;aNosil;rg;cOlN;a,of;ac,#;!aNrE;$moh,ssa5Vt.@;a,$,s0;aY`rXi,)b,nSoRrOumatrN;at;aNel;bmN);ob;gKr;aPoOuN;/gav,f;!@Crt3;b,c1gaN;po5;ot;c2Kl,n>j,rg;!aTeSioR.O%s9rN;ec;lOmN;or;!ab,#;c3f;bCr;f,gN~F;en;mOob,rNutit;ab;aNob;b,l;!a1Oe1Fi10l0Xn05o03rTs0uN;aRc3ga,iMja,)s,mOns0rg2sNt3;.F<;!+,sN;.F;ma;rf5Cs;aSeRoNufa@;bPcNg1;a2#,nNsB;%2;!a,s1I;h,s0;c,),tPugNvoJ;!aNs6;!v)s;!#,sa/;g1m%NpGr,ça;a,*;a0Ae02i00oYuN;bTcQd6fOgN*;es;!a,oN;rpG;eOrN;ic;f,s;!aN;!gOrN;`D;av;d0Zm,rNs;!t3;f,lNrb,ug;!a,b,s0;ga,mRrOv2zaN;fa;!eNp,&;fNm;#,o;eO%N;#,$;!r;!b66mPrO(N;d,rt;bGic;!a,+,%,s0;aOoN;mGs,t;b,c3m,ps6rfs0s;cY`,lVmit8odUpSrQuPvNxo;=g1#,^1lo,nNud;e,%;c2qil,r;am,pmN;%1;alNeF;!+,^;a,$;!avOeZosN;!n4;!#,*;a,iDuN;lNrt;e,^;bUce/,d,iTmRpsQrPsO],vNza;!el;!bo;apAev1ge3F$2p0&;oh;#N;!&;~;ebA;/UcSf0KlsRnPrNx1;b,gN;a2+,ort6;!eN;rbL;aF.F;#N;&;/;a3Ze3Qi1Dl19n0Xo0Jr06sSuN;dQ@ElEoPrt6tN;aNuc;b0Nc;),~,t,vC;ac,e;aXeWiQoOuN;b7fo,maQ;bAm,rN;$2;!af,bQc,dPfn4leb,p,rOt9vuN;@;!a4L&;!>m;=,mN;al;p,rf6;c2drOl,m,rNvahJ;!n0E;ev;aUeSoQuN;fOpN;sn4;ib;bAfN;!$;cGm,p,tN;),(;!bO@1mN;!+,s0;a,mN;aNe2;ça;bYc,fXhWlUpSrRs,tQvN;a,e,iuOnNo5;i,%;qe;!#,$;!b,ex,pic6r0t;ap,ipN(;!me;!a7bD%7s0;us;c,)f;!$,of,us;#,mN;es0;aUeTiQorOuN;j,rt;!tN;$,s0;fGrNv;b,t;!a;le,ps0rc1;bPm,p3rOs0t3vaN;),rta;&,t;!a,s0;aOuN;c8s;cNfs0;!a,eH;b1Yco[,d1Of0GgEjn0El07mel_,n04p03rWtO],xN;ot8uf;!aTirc,nRsN;eOifLongNuC;aBo5;!mN;od;etNi;ua;!rp;aRbQeO$,oman,rut3tN;uf;bN<m;eb;af,mi,ur;pKve5;ap;!#,)s,oF;`0ip,rNum4;of;_;bup7c,pN;a,#,iQmPuN<;d,r[Ns;];i,%2;rt,tlN;um;acs0;am;!aFiN;c0Qd0J#,l0Hm0Gn0Bpit,r05sZtOvN;iv;aVeUnRon,rPsOuN;rf;et,im2uj;ec,oN;f,m;aOeNo5;di,ic,(5;s,];l,r;eb,rN;!g,t3;lRnP?vBsaN;lc2m;^;et8;*;af;alc,bQcPev,oOteNup;m,p;lg,pr4;as;ul;it;aQgOoNu;b,sr9t;am,iN;d,s;d,lp;=,um;a]2pmNun;a,eIis;e7iPoN;cNm;!+;lL]N;il;os;!#;ap,`3uN;rc;rt;=U/,eT*RrQuN;aOjN;[,e5;lc;om;!vN;!i6;d,m,rp;!?;[;!a,+;/,cUf0@,pTrRsOt_Nvax;ih;!sN;eH^;d,r;b,#9pN;+,mi;!as,(;bo;bsVhJlTpArRsQtN;!a2(N;!d;!s0;!$,sa;/,&Nta,ub3;ta;!~;ca;abA;me;a0Ies1i0BmZoXrPuN;cnN[,or,rr0;e,i;eRutN;!n4r9sN;am,^;`;%;bosOcaIva;<;sa;d,fa,lg1n3rpN;mi,<;aUiSoPuN;b,@,t6;#;bOl,rNt,z;am,&,t;ir;@CrC;ac;c,hlPlOrNs;ip;!f;uc3;lQrN;rOt3;(;a,+;!e5i;rp;$;b,cPg,lOs0;+;is;a,sonN;em",
    "Ordinal": "true¦:a1o1s0;a0o0;dnugGmi1nFriecret,t0vatio;niDraDxF;céd,sé0tés;g5lim,tne0;c3gn0;i0on;r7t0uq,üq;co,es;!ert,ud,x8;a1i0otco;rt,v;n4r2u0x5;qni0tp4;uq,üq;da0;uq;on;es",
    "LastName": "true¦!1:#$%&()*+-./<=>?@[]:an,in,er,ns,li,ng,to,va,il,es,ar,en,hi,ch,ss,is,rn,as;0:2Z;1:36;2:34;3:2A;4:2T;5:2V;a36b2Wc2Jd2Ae27f22g1Wh1Mi1Hj1Bk14l0Wm0Mn0Io0Fp04rXsMtHvFwCxBy8zh6;a6ou,u;),o;a6eun2Pos=da,un;ma6);da,guc=,mo*,sh1YzaQ;iao,u;a7-6o4right,u;(36s2;gn0lk0),t#abe;a6i+ldi;?-jev,zqu1;a9h8i#,o7r6sui,u[0;#,yn@I;ls*y,rr.,th;at>0omps2;kah0Snaka,ylor;aD>Cemjon3=mizu,iBmiAo9t7u6zabo;/1l(v#,zuD;a6e$0;l$,rm0;sa,u4;[3th;l+,mmo&,)h;midt,neid0ulz;i*,n7sa6*;ki;>1dL*s,z;amBeag#,i9o7u6;bio,iz,sD;b6dri1JgIj],m%o,osevelt,?i,ux;%ts,$s2;c6v%a;ci,h/ds2;ir1os;aEeAh8ic6ow1W;]6hl0;so;a6-(ps;m,n1P;d%s5et8r7t6;e0Lr3;ez,ry;%s;h1Xrk0t6vl3;el,te0H;baBg09(veiZr6;t6w1K;ega,iz;a6e-s2guy5ix2owak,ym#;gy,ka6;ji6muU;ma;aDeBiAo8u6;ll0n6rray,?ol$i,ñ6;oz;l$a,oIr6z/t;al.,eau,r@;hha-3ll0;rci0?i6y0;!%;eVmmad3r6tsu06;$,t$1;aCe8i6op1uo;!n6u;coln,dholm;fe7n$,r6w@;oy;bv6v6;re;mmy,rs5u;aB<nedy,imuAle$,o8u7wo6;k,n;m/,znets3;bay6+cs;]Y;ra;hn,rl9*,ur,zl3;aA<9ha4im<1o6u4;h6nYu4;#6&2;?2;k$s,s5;cks2&se&;gl.i9ke8noue,s=k7*,v#o6;u,v;awa;da;];aBe8it>cock,o7u6;!a4b0ghNynh;a4ffm#n,r+t;m$gw7nde6rM;rs2;ay;&5rrPs7y6;]D.;#3=6;moI;a9-,o8r7u6;o,ti%r1;ay(4ub0;m1nzal1;nd6o,rcia;=;%9lor8o7uj6;ita;st0u[i0;.;n#d1;d7$steGsposi6+K;*;@2w/ds;aBevi,i9om$8u6;bo6r#d;@;gu1;az,mitr3;ov;nkula,rw7vi6;.,s;$;aFhBl/kAo6;h5l6op0rbyn,x;em7(6;&;#;!e;#8e7iu,o6r@te&5u4we;i,),u4w,y;!n,on6u4;!g;mpb7rt0st6;ro;ell;aBe8ha4oyko,r6y[e;ooks,y#t;);ck7ethov5nnett;<;%,ham;>,h8-ey,[6;.,i0;%;k,);dDl9nd6;%s6rA;<,on,s2;on;eks7iy8+r1;ez;ej6;ev;ams",
    "MaleName": "true¦!1:#$%&()*+-./<=>?@[]^_`~:an,on,ar,er,is,nd,as,en,st,ie,ri,in,ol,ce,ha,al,us,th,or,il,nt,le;0:C8;1:BF;2:BW;3:BN;4:AZ;5:BT;6:AN;7:9P;8:B7;9:AR;A:AI;B:BY;aAZbA3c92d83e7Df6Wg6Eh5Ui5Gj4Jk49l3Qm2Pn2Eo28p22qu20r1As0Rt07u06v01wOxavi3yHzC;aC^0;cChid,ne;hDkC;!%y;%4Z&y;*s2i,oDuC;sEuma;nFsE[C;oCsD;uf;ef;at0g;aKeIiDoCyatt;lfg#g,odrow;lCn1O;bEey,frBElC;%d,iC;am,e,s;&t,ur;i,)e7sC;!l6t1;de,lDrr5yC;l1ne;lCt3;a>,y;aF&n1iC;cD?0n>Crg_,va0;!`;+te,t^;l+t<47n>,ughn;lysses,sm0;aUePhLiJoFrDyC;!l3ro8s1;av(,eC(t0oy,um0;`9Dv^,y;bEd7SmCny;*,mCoh%u;*o,.,y;i*,y;mCt9;!my,o]y;adEeoDiago,omC;!*;!d^e;!de9;dFrC;+>,rC;#>,eCy;ll,n>;!dy;dgh,ichi,nn3req,ts43;aRcotPeOhKiIoGp+c3tCuraj,ylve8Czym1;#EeCu%t;f0phAAvCw%t;e55.;!(law,l6;lom1nny,uC;~yma8ta;dCl*,m1;!n6;aEeC;lCrm0;d1t1;hid,ne,qu0Uun,wn,y8;am9b*ti0kou,lim,rgio,],ymour;!tC;!.,y;lDmC`<o,qib,ul;!mAu4;ik,vat^e;aXeThett,iPoGuDyC;#,ou;b6HdDf9p&t,ssC;!elAE;=ph,y;#,bJcIdHel,geGh0l#d,mFnEry,sDyC;!>;coe,s;@d,nA;#,eo;lio,r;e4Pg3n6=fo,/go;co,ky;bAe9Q;cCl6;%do,c5KhDkC;!ey,.,y;%d,.;gDid,ub5x,yCza;#sh,nT;g.,iC;n@d,s;chid,fa4lEmD)Cp?4s?d,ul,ym$d;@9U=ph,y;iro,$;f,ph;+t2<C;cy,t1;aGeEh_Di&re,=,reC;-1;!ip,lip;dro,rcy,tC;%,e2U;blo,draig,t43ul;ctavio,liv3m92rGsDtCum%,w5;(,to;aDc%,vC;@do;ma;i,vK;a]KeIiEoC;aCel,l0ma0r2W;h,m;cDg4_o,kC;h_,=a;h=*,kC=*;!=*;@,d,_,ls1vC;_~;#Cy;!a4i4;aWeTiKoGuDyC;~s,r1;?mDrad,-aC;fa,p?;ed,mF;dibo,e,?mD(es,`y,sC[sa;es,he;ad,ed,mC;ad,ed;cHgu4kFlEnDtchC;!e7;ato,ik;ho[e,o04t1;e,=C;aj;ah,hCk6;a4eC;@,l;hDlv2rC;~,/7v2;di,met;ck,hOlMmPnu4rIs1tEu/cDxC;!im_i#Bwe7;e,io;eo,hDi*,tC;!eo,hew,ia;eC(;[,w;cEio,kBlDqu(,s?7tCv2;i2Hy;<,$;!el,oL[;achCc=m,ik;ai,y;amCdi,moud;adC;ou;aReOiNloyd,oJuDyC;~,)1;cFiEkC]3;aCe;!s;gi,s;*,iaC;no;g0nn.,r+EuCwe7;!iC;e,s;!zo;am,$4;a78evi,l#d,nD$C-3vi;!a5Yel;!ny;mDnCrry,ur4Rwr4R;>,d1;%,$t;aJeE?~d,iCr(t4Tu46y~;&0p,rC;by,k,=los;+0iFnCrmit,v2;!dDnCt5A;e],y;a7/ck;r,];nata,rC]em;im,l;aZeRiPoEuC;#,liC-2;#,[;aqu2eKhnJnHrFsC;eDhCiah,ue;!ua;!ph;dCge;#,i,$;!aCny;h,s,]4V;!a]4U.,nA;!l,sCy;ph;#,e,mC;!mA;d,ffHrEsC;sC[;!e;@d,emDmai8oCry;me,nimo;iah,y;!&y,rC;ey,y;cId5kHmGrEsDvi3yC;!d5s1;$,p3;ed,od,rCv(;ett,od;@,es,(1;e,ob,ub;k,ob,quC;es;aObrahNchika,gLkeKlija,nuJrHsEtCv0;ai,sC;uki;aC?0iah,ma4sac;ac,iaC;h,s;a,v<Cw2;!g;k,nnguaq;!r;nacC^;io;im;<,n;aKeG<ata,oEuCyd%;b&t,gCmb&to,sE;h,o;m3ra>,sCw%d;se2;aEctDitDnry,rC;b&t,m0;^;];bLlKmza,nJo,rEsDyC;ato,d5;#,s0;lF=d,rEuCv6;hito,ki,tC;a,o;(1y;#,ey;k,s;!im;ib;aReNiMl+LoJrFuC;_l&DsC;!tavo;mo;aEegCov3;!g,^C;io,y;dy,?m,`;nzaCrd1;lo;!n;lbe4Ono,ov#ni;ne,oErC;aCry;ld,rdB;ffr6rge;b/4l5rCv2;l#d,r3C],y;aReOiMlK^r0HrC;#EedCitz;!dAeC/ck;/ck;cEkC;!.,lC;<,yn;esJ(C;!co,zek;etch3oC;yd;d4lC$n;ip;d&iDliCng,rn#do;pe,x;co;bi0di;%ZdUfrTit0lNmHnGo2rD-eb0]0uge8vCym5zra;#,&ett;gi,iDnCr=,v2w2;e-B.;c06k;och,/que,zo;aG&FiDmC;aFett;lCrh0;!io;s1y;nu4;b&t,d1iFliEmDt1viCwood;n,s;&,o;ot1Ts;!*,jah,sC;?;a2+;!dAg%,mFuDwC;a25<;%C;do;$d,u);l,nC;e-;aYeOiLoFrEuDwCyl0;ay8ight;a8dl6nc0-2;ag0ew;m<icGnE/0ugDyC;~;!l*;!@d,nCov0;e7.,y;!k;%muDeCll1$,rk;go;id;#Jj0lbeImet/9nG$,rFsEvDwCxt3;ay8ey;+,<;?wn,m$d;ek,/ck;(,nCv3;(,y;rt;!dC;re;lLmJnIrEvC;e,iC;!d;+,iEne7rCyl;eC<,yl;l2Wn;n,o,[;e,i4ny;iC$;#,+,$;e,lC;*;a07e05hXi%0lMoHrFuDyrC;_,[;rtC;!(;aC(tob@;ig;dy,lFnDrC;ey,neli9y;^,rC;ad;by,e,<,l2t1;aHeEiCyJ;fC`;f^d,t1;meDt9velaC;);`;rEuDyC;!t1;de;+C;>;aGeFr(DuC;ck;!tC;i0oph3;-3;d,rlCs;eC.;s,y;cCd/c;_;lFm&1rC;ey,lDro7y;ll;!os,t1;eb,v2;%03eV_UlaToQrDuCyr1;ddy,rtJ;aKeFiEuDyC;#,>,$;>,no;#,>;nDtC;!t;dDtC;!$;#,$;dD)C;+,$;!foCl6y;rd;bDrCyd;(;!by;i8ke;@,lA;nGrCshoi;at,nDtC;!ram;aC.;rdB;!edict,iDjam2nA;.,y;to;n6rCt;eCy;tt;ey;%0Yb0Od0Kgu-2hm0Hid5j#i,l00mYnQputsiPrGsaFuDveCya0ziz;ry;gu-9-2;[;hi;aJchIi4jun,maGnE$,tCy0;hCurB;ur;av,oC;ld;#,);el;.;ta;aq;dHgelBtC;hoFoC;i8nC;!iBy;ne;ny;reCy;!*,s,w;ir,mCos;%;#,bePd5eJfGi,lF$Eph$It1vC;aN<;$;so,zo;#,+;$DrC;edB;so;c,jaFks#dEssaFxC;!#d3;&;%,&;)C;ro;rtB;ni;+;ad,eC;d,t;<;aD=fB/0vik;!o;mCn;!a;dGeFraDuC;!bakr,lfazl;hCm;am;!l;@lFel,oulaye,ulC;!lDrahm0;#;ah,o;ah;av,$",
    "Preposition": "true¦aAc9de6e4junto c9p2s0vind8às;em,ob0;!re;ara0or;! c5;m0ntre;! cim6b1;!b0ntr1pois,s6;aix0;o 4;om; partir 2cerc1lém,t0;ravés 1é;a 0;de",
    "Person": "true¦:!1:#$%&():na,re,ni,w ,or,ra;aNcivesolim #dobols,d#l$htus $feik,eLflo&kcid,gnKhgIiss( o%tnelJkHleikeze,nBo8$5s4t3y0ze%;am ase$ht,e1r0;am %griv,$b ellah;nm( ttim,rf%&harpo,slo&la%d4;#yrb ebok,)wets d6se&ey#k;doo&$git,emaj n(bel,k#b aryt;hctuk nothsa,ltih,mlap0pip;! nos0;)c;d0h%d0#m( yar;lan0;(;agoh kluh,eaissem,iassuh maddas,o0;ops$hti&eseer,s2t0;g%hsa&lezned,l0%lc,sag;ad,ih si)p;r0s#hoj ttel)cs;ac,effej;c(b,e)bum;og n0uabmil hsur;av;ilw( kj,us;i0miaj,ssagal li$me,t#d;ffe,tten;mabo kca)b,ro",
    "Conjunction": "true¦como,e3logo,mas,nem,ou,po0q2;is,r0;q0ém;ue;!mbora,ntão",
    "Pronoun": "true¦!1:#:enhor;aPcJeHisGlFmDnBo9qu8s7t6v0;o0ós;cêQs0;!sa 0;majes1s0;anti0#ia;ta4;e,i,u;e,i;al,em; s#,cê,n0s s#es;de;os,ó0;is,s;e0im;!ritíssimo;aCheCoC;so,to;l9s0u;s8t8;o1uj0ê;a7o7;m2n0;no0o0s1t1;sco;igo; 3qu0s s#as;el0ilo;a0e0;!s;gente,s#a",
    "Determiner": "true¦a2el,o2u0;m0ns;!a0;!s",
    "City": "true¦!1:#$%&()*+-./<=>?@[]^_`~:an,la,er,ng,on,ra,al,go,ro,in,o ,re,qu,es,ca,de,ar,ua,ão,da,ue,ri;0:45;a3Ub39c2Gd27e1Zf1Tg1Oh1Hi1Fj1Bk17l11m0Ln0Ho0Ep08q05rZsJtDuCv8w7x5y3za1;g<b,po1;p#,~zh0;a1okohama;&(,-s$vl;#gai,i1un0F;'#,#;-c$w,uh#;a3i2o1;l+g3Br(ezh;ena,lnius;lênc0rs29;fa,ly#ovsk;bilisi,e4i3o2rujil9u1ó=P;cumán,~m;gliatti,r(to;#j.,ju#a,r#a;%ã1gucig*pa,<s.a;!o;a8e7he5kopje,tuttg[t,u4ã/1óf0;b%n[d/d/?mpo,fr#cisco,g(ça2luís,p1;au1et%s1L;lo;c10r)te;ffield,n1;y#g,zhen;ul,vi08;l7n2)1;+ça,tB; 4t1;a cruz @ $ si%),ia+1/domi&o;! @ 1;cZlos ?b*l%os;#t(5die+,jose,ped- su$;vador,ôni?;#gum,ecife,i5o1yaz#;ma,s1tt%_m;t2ár1;io;ov;a@,ga,/@ j#ei-;i&_o,u1;%éta-,i1;nxa9to;a5e4hoenix,o2rEu1;eb$,ne;rt/1znań;*egUpríncipe;nza,=im,rm;l%mo,~s;@2r0Es1ttawa;aka,lo;ssa;a2ezahu*cóyotl,izhny nov+-d,ova i1ápol>;g]çu,or=e;b%ezhnye chelny,+0n1t8uc*p#;=im;aBe9i8o3u2yko$Oál1;aga;mbai,ni=e;nt2sco1;u,vo;e2<1;*;r<y,vidéu;ami,l^,nsk;@llín,ndoza,xic1;*i;ceió,d~d,khachka$,n4r1;a?2se1;lha;ibo,y;aus,ch>tMi$,ág];a3eipzig,i2o1u#_,v8y(,é(;dz,nd<s,s #gel>;ma,petsk,sbA; p2gMho1;<;az,$ta;a3h[k2iev,r1]$ lumpur;asnod[,yvyi ~h;iv;)chi,z#;ac3.#,o1;#>Uã/p>s1;oa;[ta,ks(ville;%ev#,ndi#ápol1stambul,zhevsk;is;a3els.=e,o1yd%1P; 0B&1ustM; ko&,`co&`;id%1JmMn1rbQv#a;c2ov1;%;heu;#ja,$s+w,o3]1ênova;_$ja),rulh1ya=il;os;iân0t1;emE;i$délf0o3r#kfu2ukuo1;ka;rt;rt1shJ; worth,*e1;za;?te6dm(t5l *to,s1;sBt1;ocol2ug[1;_;mo;(;pec,~m1;burR;a7et-it,nip-,o5<sd4u2él1üsseldorf;hi,i;bl1isburg,=e @ ?xias;.;en;n1rtmund;etOggu2;?,li1r > sa$am;#;aMhEi9o5)c4u1órdo2úcuta;liac2~ti1;ba;án;óv0;l2ncepción,penhag1;a,`;umb1ón0ôn0;us;_@ d2u_d 1;g]yaZjuá<z;a g]temaWe h/2/méxi1;co;chi m.h;e4i1o&qi2;?2tta+1ș.ău;&;+;lyab.3n1;ai,gdu,n1;ai;sk;i6l5mp4nt^,r1;ac2t1;ageLum;as,hi;.R/gr#Y;cu7g[y;-;aCe7irmi&h6o+5r4u1;?r2_p2enos air1;>;>7;asíl0uxelK;tá;am;l2rl1;im;g2/ho~z(1ém;te;)do;gd8ku,&5r1;celo3=isime2r#=il1;$;to;na;*or2kok,`coq1;`;!e;aBá;hmedClex#dr0m6n?5<=i4st)cã,t1;en2l#1;ta;as;pa;);e1st%dã;d2st%d1;^;aba1;@;ia;abad",
    "Region": "true¦:!1:#$%&()*+-./<=>?@[]^_:na,at,ra,ro,ac,ni,re,oc,sa,an,en,il,uh,im,hs,ah,ci,rb,ss,tne;0:1W;a0Vc0Rd#l0Ne06gn03h01iYkVnPoJrHsBt6u5xe^4y1zurca8;d#m&n,e2kcu_k,li[s,n1r_v+;(sut,oxas;rrUs*j05;e,us;ohziug,s#g;a%jZe3i%y.,nom2u1;[tc/n+,v.K;*v;hlys,sr1;emos,od;a3d2e_<(-uga,i1ole&m,ttes=ca^0;a*g -)m,o)lli;eZ#ld>;cet(az,p2s#k1xet;!%;a0G<uam$;>h-k,oda]al d# d#ld09up1;gnIin0;@#r0c4da&l+,g3hadi,i2or a#t)uq,r1taujaL;$e*uq,er*L;ho,r$no;ladih,#rud;ixemLs1ubm.*p;ab$,<aj;a3eme],isn+siw,o1;el ove1ge&,k3t03;un;cao2gi2ht-j8ijuf,n=,t(1=[s,wehctak-s;uy;hc>;[wsnu]Dlof1rC;f1&n;us;@g)q,ep,ha?j2iaw@,ppi^i1ruo1sotop siul #s,xg#ij;^>;ar;a1sedarp r$1;tu;>oyw,odg1;#1;ug;e^/nGhcepF)0r3t$s kr1uq-b;oy1; w/;awalBi?1;(#l,d&f9egdi]Bk6m@g)5n4pm@3*tsec1ybrA;i1uolg;el;! w/;l+)l,otpma4;kcub,tton;[wrE&y1;! 1;htrZ;f$s,t*h,xo;ed;m(;et;d3s1yr0;i 1nee4;d%wde ec)rp,edohr;nuofw/;d not2ebe1;uq;g)?1;aw;botin0cZdX?ido,iLkIlHmFn6ol.Or5t2=a=1woi,yhd0;ihc;o1*bE;kad6s/n1;>;aec,th-%h0;a6i1l=k,ozi%;lo%c2r$( $n1;as; ht1;rCu1;os;i2%p,tn1;om;d),siuol;aba1<Lohalko;la;(xalt,i=aJ;$.r2-1;la,]F;ak;bmul+ ?itiBg&eg,hAn4r2t+s av1;on;av8bmuc,eb1;is;a3igriv2&f<(1;! aj5;! tsew;ms2vlysnn1;ep;$;ab;];av1i&lf;/;axao,isr1;+;am",
    "Country": "true¦:!1:#$%&()*+./<=>?@[]^_`~:na,am, a,ni, e ,ab,la,od,ir,ar,ro,ru,se,mo,ma,uq,us,en,ts,me,ci;a0Ie09h>dalg#b,i03lWmiVnToGrDs6tiawuk,u3á2ã1é&ug0;!%von-aupap;?,ri;da#c,@#p;a1*vut,r0tau#v;ep,uan;*p,ssib-V;a4e3iv^(oãvó_.c07o0;al,corr$,d0xi) >síZ;)rZinu s0;eb/á s+/i`,+at>;llehcyes,<?c,õr$ac;@hW&0=dnoh,vidl$;da#rg(etne~v01pilif;a1egín,+a0;[e,v*s le;cságad$,m#ym;cBdinu o&er,g9n8rg^etnom,saf%&k=b,t7ã0;bag,d],ji)reza,?*sHpaj,t0;si0ub;n3u0;gri[,q0;a0ebzu,ijat;p,zac;agefa,e`[=t;ige,o>l;)íl,.$ #s;)ot(dadi&rt,noc +%~0ot,=b`xul;l1Ntárco`d1M;anóm,ixém;eméi,ie0;rhD_nethceil;fr$ +1FnE;a3e/si,isa8*hsr$2] + 0;a0oãd];c.fá,iE; sahli;g1.ota[e 0p^;é&R;^Kut<p;aug2dnu=b,^u1jif,l$,t0wal$;).ik,iah,uobijd;rb;/0u=;ap;);d6li7@n5picnírp(é?t4rpi7t2[1wb)miz,zil0;eb;/i,ib@çom;<n +%i0>l-<mit;e<c; oãs;.],teiv;a0rev obD;hc;buc,c0Qd0Mg0Kh#0HiCjobmBk#l .s,l9n5o3r2t1ugáracMç0;#rf,í];iduas%ibáYl$;r+#,upag&s;el%rr0@s;es;a1i0;hc,tnegTvogezreh e%insób;~0g,i2wst6;&m+0Mrfa-ortnec0M;$eta0euz^ev,og#;ug;ac;bZcUdnPert.e,gróeg,lLnBpóite,r7s3[2v0;rés,ádlLíl0;ob;r1ávD;súr2álTéno1ín0;ut;d&,r~m;!<leib;gnuh,_uá,ágl2é0ís;bBg0;in;ub;â6é3ó0;dec$%d05l1t0;el,>;op;m1[,v0;olO;or,ra;bNd<j,rcu,tiDut1zn0;at;il;á2ég1ógn0;om;ra;?s,r_ua,ti;âl0í;ez%vHi1n0si;if;at,za0;];áorc,é3í1úl%tn0;as;=0;$;rg,];m2í0;l,m0;an;â0ôlD;g,z;`1p0;>;*;eur0not;on;a#rg,#1ubr) e%ugít0;#;gu,l0ur;ri;ehc4i0r$a&d;$2gléb,&m+,r0;%_0;oc;aj;%~l0;búp0;er",
    "FemaleName": "true¦!1:#$%&()*+-./<=>?@[]^_`~:an,el,na,le,ie,en,is,et,ri,in,ra,da,on,er,ia,ey,la,yn,ce,ta,il,ma;0:FV;1:FZ;2:FO;3:FA;4:F9;5:FP;6:EO;7:GC;8:EW;9:EM;A:G8;B:E2;C:G5;D:FL;E:FI;F:ED;aDZbD1cB8dAIe9Gf91g8Hh83i7Sj6Uk60l4Om38n2To2Qp2Fqu2Er1Os0Qt04ursu6vUwOyLzG;aJeHoG;e,[,/;lG%;<,~;<,/;as7EeHol1TvG;+9=B8;&0s)3;#8)dBMhiB3iG;lInG;if3AniGo0;e,f39;a,h$mi0lG~;a,ow;aMeJiG;cHviG;#9X)FY;kCWtor3;<,l~,nus,rG;a,nG=ica;a,i^;&GnesE9;nDIrG;i1y;aSePhNiMoJrGu6y4;acG0iGudy;c3%,sG;h9M_;nHrG;a,i;i9Jya;a97ff#y,%,s5;al3eGo~si0;a,l~,o6Xres1;g#,o6WrHssG;!a,(;eFi,-7;bNliMmKnIrHs5tGwa0;?0um;a,];iGya;a,ka,s5;a4e4iGmC7/;!ka;a,t5;at5it5;a05car&t2Ye04hUiSkye,oQtMuHyG;b`,lvi1;e,sHzG;#2T+9(,y;#Gi7;!a,e,nG;aEe;aIeG;fGl3DphG;#2;cF5r6;f3nGphi1;d4?,ja,ya;>4lv3m=1nGobh#;dy;aKeGirlBIo0y6;ba,e0i6lIrG;iGrBMyl;!d#;?,lBS;ki4nIrHu0w0yG;[,%;i,&A=,r=;a,<,?,nG=;a,=;l5Yre0;bMdLi8lKmIndHrGs5v#%E;aEi0;/,y;aGi4;nt5/;lBKome;e,(;.1-0;a02eXhViToHuG;by,thBH;bQcPlOnNsHwe0xG;#93(,y;aHeG(,lC;#n7ll1~rBCtB;!lGnn1;iG];e,nG;a,d7W;<,i,%;#8;h$53io;b.,>B];a,cGkki,%,_;h$&,ki;ea,i#n=,oG;<,n12;#0bIgi0i0nG_,y0;aGee;!e,_;a,eG;cca,kaE;chGe,i0mo0ndi,qu$,vDy0;a$,$Gi8;!e,&;e)2?0;aMeLhJoIrG;iGud)^;sc`1Uyamva8;lly,rt3;`ome0oebe,ylG;*,l*;arl,ggy,n$ope,r6t4;ige,m0Fn4Oo6rvati,tHulG;a,+9.1;-cGsy,tA5;a,e,?;c_v3deHfATlGphAT;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeD;ll1mi;aKcIkG[,%,s5_;iGki;!_;ho&,k8AolG;a,eBE;!mh;l7S%,r*F;dIi~,nHomi,_G;li1s5;cy,+9;eAiCL;a01ck)z2eViLoI-g%y#i,u-$,yG;a,rG;a,%,t&;i4ll9UnG;a,iG;ca,ka,que;a,chOkaNlJmi,nIrGtzi;aG?m;!n8;dy,>va,h,n2;a,dIica,lG;iGy;c)t,e;red;!e6;ae6$3G;ag#,gKi,lHrG;edith,*Fyl;#2iGliF;nGsAJ;a,<;!#,h#;b08c9Bd06e,g04i03l01nZrKtJuHv*,x85yGz2;a,b$l,/;de,rG;a,eD;h74`8t2;a,cSgOiJjor2l6In2s5tIyG;!aGb+h,jaAlou;m,n9P;a,ha,i0;!aIb$,eHja,lC%,sGtza;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeH(,oGr3Kue-9;!t;!ry;+3IiB;$Gi61y;a,l1;dG=,ue6;akr#By;iGlory;a,ka,n8;a,re,s2;<Gg2;!l2W;alCd2$Gge,*=,=0;eiA.1];$,&;a0Ie08iWoQuKyG;d3[,nG;!a,dHe9PnGs@;!a,e9O;a,s@;#n,cJ$IiFlH%,pG;e,iB;a,u;a,[;iGy;a2Ae,l25n8;*,l1GrHtt2uG;$6*1;aIeHi7%,rG;a6Xi7;&i,n1tB;!.1;aQbPd3lLnIsHv3zG;!a,b+h,+9z2;a,+9;a,dG;a,sGy;ay,@,i,y;a,?IlG;iGy;a8De;!n4F;b7Q>ty;!n5Q;aN<,e0iL[,nKoIslAOtGx2;iGt2;c3t3;[,nG/;a,(,o4;a,or1;a,gh,[G;!ni;!h,nG;a,d4e,n4N;cNd=7Pi6kes5rMtKurIvHxGy6;mi;>n1.3;a,eG(,];l,n;as5*5oG;nya,ya;a,*F;@,(,y;aZeUhadija,iMoLrIyG;lG/;a,ee,(;*tGy5A;a,),iGy;!e,n48;-,urtn@;aM>L&y,mIrGzzy;a,stG;),.;!b>lG;eGi,y;e,y;a,stD;!%,/;$6MiJlInHrG;a,i,-;d4%;@,i,l9Ns2y;/,s5;c@,i5UlO~6nyaku~-,rMss5JtJviByG;!e,lG;a,eG;e,igh;a5CeHhGi3PlC-0y;ar5A>5A(,&Dr9Cy;!l]70;a,),iGl4T];!~,n31sF;eigh,i,l2;a04eV`ToMuG;#KdJliGst54;aHeGsF;!nAt0W;!n8U;ith,y;a,iB;!#Lc$Cd5S$&,h#6FlJni,sHva0yG;a,^;eG(;fi0lCph4V;eG(;),n1;!a,e,n36;!i#,lG;!i#;#L&0nIrHsG;ica,sica;i,-;!a,$&,if>,nG;a,+9iGy;!e,f>;a,e6ZiHnG;a,e6YiG;e,n1;cLd1mi,nHqu$iAsm.2Uv(4yAzG;m.7;a7eHiG;^,e,n1s;!lGsFt06;e,&;.Hk2lCqu$G;.1];<,_;<,lPmNnMo0rLsHvaG;!%;aHiGob$;do4;!b$Gdo4;!a,e,l2G;)1i0~;a,di4es,g-d;$8ogG;)1;a,eA?0o0se;aNeK`HoGyac.th;ll2rt)se;aHdG[H;a,egard;ry;ath>,iHlGnr(tBrmiAst>;)24ga;di;i&y,lKnJrGtt2y&y,z$;iGm=y,-4D;+G;!te;aE%E;@,l2;aYeTiOlMold12rIwG;)G]+h;!dolC;acH+G*$8;a,chD;e,(G;![;adys,)Gor3]*;a,<,%;aJgi,lH%,ov6Ys$G;a,e,&;<,liG;#;!n0;mYnIorgHrG;ald33i,m2Rtrude;+9i0;a,eG%;s*,v(ve;b-$3C`,&,rn+,y&;aReOio0loMrG;#He8iG;<,e8;!cG;esHiGo*e;n1sca;!ca;!rG;a,)^;lHrnG;!#8;ec3ic3;rHtiGy7;~;ah,/h;d0Fi&DkBl00mUnid,rRsMtLuKvG;aI$HiG;e,_;.0A];!ng$2F;g)i1[,ni^;h$,_;me/l8p>#JtG;eHhGr$6;>;l2Mr;za;iG~,nest27];cGka,n;a,ka;eJ`ImG;aG(,y;!liA;ee,i1y;lG/ld;<,y;aTeRiMlL~,no4oJsIvG;a,iG;%,/;a,(;iGuiG;se;),(,y;a0c3<,nJsGzaH;aGe;!beG;th;!a,or;#or,nG;!a;.1%;),iG%,wi0;e,th;aWeKiJoG;lores,m.ique,n0rGtt2;a,eD*,[,othGthy;ea,y;#08%E=Ax2;#PbOde,eNiLja,lIm+r3nGsiree;a,iG;^,se;a,iH[,orGphiA;es,*;a,[h;dGrdG;re;!dee,%;!b29o/E/;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1TyG;&,%;a,by,cH?,lG;a,)1;@,(;a,+9iG;!ca,$17ka;arG?;*;a0Oe0Lh03i01lToIrH]G;di,th3;*2Ay03;lOnLrHurG;tn1B;aId26iGn26-A;!nG;a,e,n1;!l1Q;n2sG;t#Gu$o;^,za;eG&D;),t9;aIeoHotG;`de;!pat4;ir7rIudG;+9iG;a,ne;e,iG;^,sX;a4>4ndG;i,y;aPeMloe,rG;*HyG;s_l;sy,tG;aH),iGy;!#1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;*JlHmG;aiA;a,eGot9;n1t9;!sa;d4$&,tG;al,$&;cGli3E;$3`G;e,?,y;iXlWm`VndUrNsLtGy6;aJeIhG-0;>G&DrCy;.1;-0;li0-0;a2FsG;a2E(;iLlJm$IolHrG;(,ol;!e,.1];!a,[;a,eG(,y;ne,y;%,sF;a^,i^;a,e,l1;*Bl2;tlG;.,];arb0CeYi#XlVoTrG;#dRePiIoHyG;#0nn;nwCok7;#2NdgKgid,tG;n@,tG;!aHnG;@,i,y;ny;+G;!t7;#0e,nG;<,%;i7y;bbi7nG;iBn2;#cGossom,ytG;he;ca;aRcky,l.8niBrNssMtIu[EvG;!>lG;@,y;hHsy,tG;e,i0Zy7;!#G;(,y;!(;nGt5yl;adHiG;^;+9iA;!t-G;^,z;a4(,/;aliyah,b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;#Ges5;a,%;a,-l;drIgusHrG;$3;ti0;a,@,i,y;hHtrG;id;aKlGt=;eHi7yG;!n;e,iGy;gh;!nG;ti;iI&HpiB;_;),n1t9;#19$G;&;aYdWeUgQiOja,nHtoGya;.+9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!b$HliFmT;sa;!&;ka,sG_;a,sa;$G(;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;[;bHmGs_s3;ar3;$;aIb>H$3iGy;e,%;!ly;l3n8;<;aTba,eNiKlIyG;a,c3sG;a,=,sa;iGys=;e,s=;a,cH%,sGza;a,ha,=,sa;e,?;c3*5jaI%,ssaIxG;aG?;!nd4;nd4;/;?;i0nHyG;ah,%;a,*,%E;c5<,&DmLnslKsG;haElG;.GyW;g,n;!h;@;ee;);at5g2nG;es;(;ha;aVdiS$LrG;eIiG;#L)G;a,e,ne;#0;%;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;=;];!lG;iA];ne;agaJbHiG;!gaI;@,i7y;!e;`;ah",
    "Place": "true¦aLbJcHdGeEfDgAh9i8jfk,kul,l7m5new eng4ord,p2s1the 0upIyyz;bronx,hamptons;fo,oho,under2yd;acifLek,h0;l,x;land;a0co,idCuc;libu,nhattJ;ax,gw,hr;ax,cn,ndianGst;arlem,kg,nd;ay village,re0;at 0enwich;britain,lak2;co,ra;urope,verglad0;es;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m5ntar1r1sia,tl0;!ant1;ct0;ic0; oce0;an;ericas,s",
    "Month": "true¦: orie5lirba,o0;h2i1rbme0tsoga,çr1;tes,von,zed;am;l0n0;uj;naj,revef",
    "WeekDay": "true¦domingo,qu0sábado,terç1;art0int0;a-feira",
    "FirstName": "true¦:aFeBholiHlem,n5ol7rialb,si4y0;aGbleGdissac,e0llen,rrF;rbua,s0;a0lD;c,k;rk,xela;a2niuq,o0wahsal;i0v2;ram;g1v0;ed;er,rom;duj,i1n0;er,neyehc;m0ssej;aj,maj;e1rdna,ttayn0;ek;hs",
    "Cardinal": "true¦bilhão,cLdDmAnove9o6qu3se2tr0vinte,zero;eze0inOês;!ntE;is5ssLte6;a1in0;hAze;rItro2;it0nL;enHo0;!c6;!c5nF;eia,il0;!h0;ão,ões;ez4o3u0;as,z0;ent0;as,os;is,ze;!a0e0oi8;nove,sse0;is,te;ator6e4in0;co,q0;u0ü0;en0;ta;m,n0;to;ze"
  };

  /* eslint-disable no-empty */
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
    for (; places > 0; places--) {
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
    const reSymbol = /^([0-9A-Z]+):([0-9A-Z]+)$/;
    for (let i = 0; i < t.nodes.length; i++) {
      if (!t.nodes[i].includes(':')) {
        break
      }
      const m = reSymbol.exec(t.nodes[i]);
      if (!m || m[0].length !== t.nodes[i].length || encoding.fromAlphaCode(m[1]) !== i) {
        throw new SyntaxError('Invalid efrt packed data: symbol definition')
      }
      t.syms.push(encoding.fromAlphaCode(m[2]));
    }
    t.symCount = t.syms.length;
    t.nodes = t.nodes.slice(t.symCount);
    if (t.nodes.length === 0 || t.syms.some((index) => !Number.isSafeInteger(index) || index >= t.nodes.length)) {
      throw new SyntaxError('Invalid efrt packed data: symbol target')
    }
  };

  const unescapeLabel = function (text) {
    return text.replace(/\\([\s\S]|$)/g, (match, char) => {
      if (char === '\\') {
        return '\\'
      }
      if (char >= 'a' && char <= 'j') {
        return String(char.charCodeAt(0) - 97)
      }
      throw new SyntaxError('Invalid efrt packed data: label escape')
    })
  };

  const dictionary = function (trie) {
    if (!trie.nodes[0].startsWith('!1:')) {
      return
    }
    const header = trie.nodes.shift().split(':');
    const tokens = Array.from(header[1]);
    const fragments = (header[2] || '').split(',');
    if (header.length !== 3 || tokens.length === 0 || tokens.length !== fragments.length ||
      new Set(tokens).size !== tokens.length || trie.nodes.length === 0 ||
      tokens.some((token) => token.length !== 1 || token.charCodeAt(0) < 33 ||
        token.charCodeAt(0) > 126 || /[A-Za-z0-9,;!:|]/.test(token) ||
        (trie.versioned && token === '\\')) ||
      fragments.some((text) => !text || /[A-Z0-9,;!:|¦]/.test(text))) {
      throw new SyntaxError('Invalid efrt packed data: fragment dictionary')
    }
    trie.dictionary = Object.create(null);
    for (let i = 0; i < tokens.length; i++) {
      trie.dictionary[tokens[i]] = trie.versioned ? unescapeLabel(fragments[i]) : fragments[i];
    }
  };

  // References are either absolute (symbol) or relative (1 - based)
  const indexFromRef = function (trie, ref, index) {
    const dnode = encoding.fromAlphaCode(ref);
    const target = dnode < trie.symCount ? trie.syms[dnode] : index + dnode + 1 - trie.symCount;
    // The encoder emits nodes in topological order. Every edge must point
    // forward, which also rules out cycles before expansion starts.
    if (!Number.isSafeInteger(target) || target <= index || target >= trie.nodes.length) {
      throw new SyntaxError('Invalid efrt packed data: node reference')
    }
    return target
  };

  const parseNodes = function (trie) {
    return trie.nodes.map((node, index) => {
      if (node === '' && trie.nodes.length !== 1) {
        throw new SyntaxError('Invalid efrt packed data: empty node')
      }
      const terminal = node[0] === '!';
      const body = terminal ? node.slice(1) : node;
      const edges = [];
      // Match only at the current offset. Searching later positions would
      // repeatedly rescan a long malformed fragment before rejecting it.
      const token = /([^A-Z0-9,;!:|¦]+)([A-Z0-9]+|,|$)/y;
      for (let offset = 0; offset < body.length; offset = token.lastIndex) {
        const match = token.exec(body);
        if (!match || match.index !== offset || (match[2] === ',' && token.lastIndex === body.length)) {
          throw new SyntaxError('Invalid efrt packed data: node syntax')
        }
        const ref = match[2];
        const label = trie.versioned ? unescapeLabel(match[1]) : match[1];
        const text = trie.dictionary ? Array.from(label,
          (char) => trie.dictionary[char] || char).join('') : label;
        edges.push({
          text,
          target: ref === '' || ref === ',' ? -1 : indexFromRef(trie, ref, index)
        });
      }
      return { terminal, edges }
    })
  };

  const toArray = function (trie) {
    const nodes = parseNodes(trie);
    const all = [];
    const stack = [{ index: 0, pref: '', edge: -1 }];
    for (; stack.length > 0;) {
      const frame = stack[stack.length - 1];
      const node = nodes[frame.index];
      if (frame.edge === -1) {
        if (node.terminal) {
          all.push(frame.pref);
        }
        frame.edge = 0;
      }
      if (frame.edge === node.edges.length) {
        stack.pop();
        continue
      }
      const edge = node.edges[frame.edge++];
      const word = frame.pref + edge.text;
      if (edge.target === -1) {
        all.push(word);
      } else {
        stack.push({ index: edge.target, pref: word, edge: -1 });
      }
    }
    return all
  };

  //PackedTrie - Trie traversal of the Trie packed-string representation.
  const unpack$1 = function (str, versioned = false) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0,
      versioned
    };
    dictionary(trie);
    //process symbols, if they have them
    if (str.match(':')) {
      symbols(trie);
    }
    return toArray(trie)
  };

  const unpack = function (str) {
    if (str === '' || str === null || str === undefined) {
      return {}
    }
    if (typeof str !== 'string') {
      throw new TypeError('efrt unpack expects a string')
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('¦');
      if (arr.length !== 2 || Object.prototype.hasOwnProperty.call(h, arr[0])) {
        throw new SyntaxError('Invalid efrt packed data: category separator or duplicate category')
      }
      h[arr[0]] = arr[1];
      return h
    }, Object.create(null));
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      let data = obj[cat];
      const versioned = data.startsWith('!2;');
      if (versioned) {
        data = data.slice(3);
        if (!data || data === ':') {
          throw new SyntaxError('Invalid efrt packed data: missing versioned trie')
        }
      }
      const reversed = data[0] === ':';
      const arr = unpack$1(reversed ? data.slice(1) : data, versioned);
      //special case, for botched-boolean
      if (cat === 'true') {
        cat = true;
      }
      for (let i = 0; i < arr.length; i++) {
        const k = reversed ? Array.from(arr[i]).reverse().join('') : arr[i];
        if (Object.prototype.hasOwnProperty.call(all, k)) {
          if (Array.isArray(all[k]) === false) {
            if (all[k] !== cat) {
              all[k] = [all[k], cat];
            }
          } else if (!all[k].includes(cat)) {
            all[k].push(cat);
          }
        } else {
          Object.defineProperty(all, k, {
            value: cat,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
    });
    return all
  };

  // the four parts of a model, in the order they are packed
  const sections = ['fwd', 'both', 'rev', 'ex'];

  // characters with a meaning in the packed format - words containing these cannot be learned
  const reserved = /[~|:,{}0-9]/;

  const decodeVal = function (key, str) {
    const m = str.match(/^[0-9]+/);
    const n = m ? Number(m[0]) : 0;
    const tail = m ? str.slice(m[0].length) : str;
    return key.slice(0, key.length - n) + tail
  };

  // apply a model to one word:
  //   1. whole-word exceptions
  //   2. the longest suffix with a rule (a rule may match the entire word)
  //   3. the '' rule, if any, as a fallback (a plain append)
  //   4. otherwise, the word is returned unchanged
  const convert = function (str = '', model = {}) {
    const { ex = {}, fwd = {}, both = {} } = model;
    if (Object.hasOwn(ex, str)) {
      return ex[str]
    }
    for (let len = str.length; len >= 0; len -= 1) {
      const suff = str.slice(str.length - len);
      const stem = str.slice(0, str.length - len);
      if (Object.hasOwn(fwd, suff)) {
        return stem + fwd[suff]
      }
      if (Object.hasOwn(both, suff)) {
        return stem + both[suff]
      }
    }
    return str
  };

  const flipObj = function (obj = {}) {
    return Object.fromEntries(Object.entries(obj).map(([key, val]) => [val, key]))
  };

  // swap the direction of a model
  const reverse = function (model = {}) {
    return {
      reversed: true,
      // these two work both ways
      both: flipObj(model.both),
      ex: flipObj(model.ex),
      // and the one-way rules trade places
      fwd: model.rev || {},
      rev: model.fwd || {},
    }
  };

  const invalid = function () {
    throw new Error('suffix-thumb: invalid packed model')
  };

  // suffix-trie → list of keys
  const unpackKeys = function (str, suff = '', out = []) {
    let i = 0;
    do {
      let chain = '';
      while (i < str.length && str[i] !== ',' && str[i] !== '{') {
        chain += str[i];
        i += 1;
      }
      if (reserved.test(chain)) {
        invalid();
      }
      if (str[i] === '{') {
        // find the matching brace
        let depth = 1;
        let j = i + 1;
        while (depth > 0 && j < str.length) {
          if (str[j] === '{') {
            depth += 1;
          } else if (str[j] === '}') {
            depth -= 1;
          }
          j += 1;
        }
        if (depth !== 0 || (j < str.length && str[j] !== ',')) {
          invalid();
        }
        unpackKeys(str.slice(i + 1, j - 1), chain + suff, out);
        i = j;
      } else {
        out.push(chain + suff);
      }
      i += 1; // step over the comma
    } while (i <= str.length)
    return out
  };

  const unpackSection = function (str = '') {
    const obj = Object.create(null);
    if (!str) {
      return { ...obj }
    }
    str.split('|').forEach(group => {
      const i = group.indexOf(':');
      const val = group.slice(0, i);
      const count = val.match(/^[0-9]+/);
      if (i < 0 || !count || reserved.test(val.slice(count[0].length))) {
        invalid();
      }
      unpackKeys(group.slice(i + 1)).forEach(k => {
        if (Number(count[0]) > k.length) {
          invalid();
        }
        obj[k] = decodeVal(k, val);
      });
    });
    return { ...obj }
  };

  // one string → model
  const uncompress = function (str = '') {
    if (typeof str !== 'string' || str[0] === '{') {
      throw new Error('suffix-thumb: uncompress expects a packed string. Models made before v6 must be learned again.')
    }
    const parts = str.split('~');
    // Preserve the empty/default input shorthand for an empty model.
    if (str !== '' && parts.length !== sections.length) {
      invalid();
    }
    const model = {};
    sections.forEach((s, i) => {
      model[s] = unpackSection(parts[i]);
    });
    return model
  };

  // generated in ./lib/models
  var model$1 = {
    "nouns": {
      "plurals": "0:a{uis,linh,i{at,stór,bíl,re},rat,mid,çad,ld,uranç,huv,ratur,sic,gu}, mar,e{rn,sort,nav,ricidad,sed,el},s,ão{ess{c,r},ucaç,liç},lguém,aril,x|4os:nalha,vente|7s:ocicleta|2daços:peça|2ças:nca|0es:r,n|5es:uíche|2eses:és|2ízes:aiz|0s:o{ã{rm,f,ót,ist,rg,d,gr},ma},ll|5tivos:ctivo|10ções:cionamento|3s:agem{st,c}|1is:l~0s:,men|4cusas:fugo|1as:ílo|4ícias:eleite|0rias:sca|6ústrias:ustria|2as:artão|0duras:eima|0as:rtador|1s:il|3nerais:eral|7is:calização|1is:ool,vel,iel|2éis:el|2óis:ol|2eis:til,sil|5uniores:únior|5eniores:ênior|4ateres:áter|0hares:mil|0es:ís,gas,eus,z,sul|2eses:ês|2ízes:uiz|1es:o{ã{p,it,at,em},a},eptil,ossil|2ões:ão|11clamações:ivindicação|6posições:xibição|2nhões:mião|8ntes:tatividade|0ues:ues|2oes:icao|3mentos:dicação|2mentos:tida|1imentos:renda|1ados:rego|3dos:zagem|3tados:jeição|3enhos:ign|5ômenos:omeno|4tários:tilidade|5urbios:úrbio|9ípios:ipalidade|1ns:m|4omens:ômen|6centagens: cento|1ós:ô|5nks:igação|2i:pus~0:,s{tla,pi,ire,cle,cínio,bu,ru,nu}|3ca:danças|1gem:ncas|2l:ais,uis|1:s{i{pa,o,e,x,b},vore,ware,itante,ntimento,ncípio}|2:es{or,er,ar,fen}|4és:veses|2o:cães|4cionamento:elações|2uíche:ndes|5ctivo:etivos|2ente:servos|1cicleta:motos|2alha:fornos|2m:homens~0s:mão|1es:cão|0:cais,dados,paz|3s:listagem"
    },
    "adjectives": {
      "f": "1:s~0:,aso|1a:o,om|0a:ol|2éia:eu|2esa:ês|2á:au|1:ão~0:nja|0s:o~",
      "mp": "0:a~0s:|0es:z|2eses:ês|1es:ão|1is:l|2eis:il|2óis:ol|1ns:m|2a:os|1a:aso|0:ó~2l:veis|0:ja~",
      "fp": "1as:m|1ias:u~0:|1as:o|0as:ol|2esas:ês|0s:e,aso|0es:z|1is:l|2eis:il|2ás:au|1ns:em|1s:ão~2m:oas|3u:peias|2l:veis~"
    },
    "conditional": {
      "first": "3ria:zer{a,i}|0ia:r{aze{mpr,j},ntrança,oroça}|3caria:çar{tran,rin,ro}|2oria:ôr~0ia:|6coitaria:çoitar|3caria:çar{ati,co,emo,bra}~3zer:ria{di{re,on,en,ra,s,l,er},a{f{s,e,tra,esa,er,-},spr}}|2:ria{gredi,a{taref,lef,scoit,ratic}}|5çar:caria{strin,stro}~3ria:zer{fa,afa,tra,di}|2oria:pôr|3caria:çar{cal,for,ro,la}",
      "second": "3rias:zer{a,i}|0ias:r{aze{mpr,j},ntrança,oroça}|3carias:çar{tran,rin,ro}|2orias:ôr~0ias:|6coitarias:çoitar|3carias:çar{ati,co,emo,bra}~4zer:rias{di{re,on,en,ra,s,l,er},a{f{s,e,tra,esa,er,-},spr}}|3:rias{gredi,a{taref,lef,scoit,ratic}}|6çar:carias{strin,stro}~3rias:zer{fa,afa,tra,di}|2orias:pôr|3carias:çar{cal,for,ro,la}",
      "third": "3ria:zer{a,i}|0ia:r{aze{mpr,j},ntrança,oroça}|3caria:çar{tran,rin,ro}|2oria:ôr~0ia:|6coitaria:çoitar|3caria:çar{ati,co,emo,bra}~3zer:ria{di{re,on,en,ra,s,l,er},a{f{s,e,tra,esa,er,-},spr}}|2:ria{gredi,a{taref,lef,scoit,ratic}}|5çar:caria{strin,stro}~3ria:zer{fa,afa,tra,di}|2oria:pôr|3caria:çar{cal,for,ro,la}",
      "firstPlural": "3ríamos:zer{a,i}|0íamos:r{aze{mpr,j},ntrança,oroça}|3caríamos:çar{tran,rin,ro}|2oríamos:ôr~0íamos:|6coitaríamos:çoitar|3caríamos:çar{ati,co,emo,bra}~6zer:ríamos{di{re,on,en,ra,s,l,er},a{f{s,e,tra,esa,er,-},spr}}|5:ríamos{gredi,a{taref,lef,scoit,ratic}}|8çar:caríamos{strin,stro}~3ríamos:zer{fa,afa,tra,di}|2oríamos:pôr|3caríamos:çar{cal,for,ro,la}",
      "secondPlural": "3ríeis:zer{a,i}|0íeis:r{aze{mpr,j},ntrança,oroça}|3caríeis:çar{tran,rin,ro}|2oríeis:ôr~0íeis:|6coitaríeis:çoitar|3caríeis:çar{ati,co,emo,bra}~5zer:ríeis{di{re,on,en,ra,s,l,er},a{f{s,e,tra,esa,er,-},spr}}|4:ríeis{gredi,a{taref,lef,scoit,ratic}}|7çar:caríeis{strin,stro}~3ríeis:zer{fa,afa,tra,di}|2oríeis:pôr|3caríeis:çar{cal,for,ro,la}",
      "thirdPlural": "3riam:zer{a,i}|0iam:r{aze{mpr,j},ntrança,oroça}|3cariam:çar{tran,rin,ro}|2oriam:ôr~0iam:|6coitariam:çoitar|3cariam:çar{ati,co,emo,bra}~4zer:riam{di{re,on,en,ra,s,l,er},a{f{s,e,tra,esa,er,-},spr}}|3:riam{gredi,a{taref,lef,scoit,ratic}}|6çar:cariam{strin,stro}~3riam:zer{fa,afa,tra,di}|2oriam:pôr|3cariam:çar{cal,for,ro,la}"
    },
    "futureTense": {
      "first": "3rei:zer{fa,tra,i}|3carei:çar{tran,ro,ti}|2orei:ôr~0ei:|6coitarei:çoitar|3carei:çar{co,bra}~3zer:rei{di{pre,on,en,ra,s,l},fa{s,e,er}}|5çar:alcarei~3rei:zer{fa,afa,tra,di}|2orei:pôr|3carei:çar{cal,for,ati,ro,la}",
      "second": "3rás:zer{fa,tra,i}|3carás:çar{tran,ro,ti}|2orás:ôr~0ás:|6coitarás:çoitar|3carás:çar{co,bra}~3zer:rás{di{pre,on,en,ra,s,l},fa{s,e,er}}|5çar:alcarás~3rás:zer{fa,afa,tra,di}|2orás:pôr|3carás:çar{cal,for,ati,ro,la}",
      "third": "3rá:zer{fa,tra,i}|3cará:çar{tran,ro,ti}|2orá:ôr~0á:|6coitará:çoitar|3cará:çar{co,bra}~2zer:rá{di{pre,on,en,ra,s,l},fa{s,e,er}}|4çar:alcará~3rá:zer{fa,afa,tra,di}|2orá:pôr|3cará:çar{cal,for,ati,ro,la}",
      "firstPlural": "3remos:zer{fa,tra,i}|3caremos:çar{tran,ro,ti}|2oremos:ôr~0emos:|6coitaremos:çoitar|3caremos:çar{co,bra}~5zer:remos{di{pre,on,en,ra,s,l},fa{s,e,er}}|7çar:alcaremos~3remos:zer{fa,afa,tra,di}|2oremos:pôr|3caremos:çar{cal,for,ati,ro,la}",
      "secondPlural": "3reis:zer{fa,tra,i}|3careis:çar{tran,ro,ti}|2oreis:ôr~0eis:|6coitareis:çoitar|3careis:çar{co,bra}~4zer:reis{di{pre,on,en,ra,s,l},fa{s,e,er}}|6çar:alcareis~3reis:zer{fa,afa,tra,di}|2oreis:pôr|3careis:çar{cal,for,ati,ro,la}",
      "thirdPlural": "3rão:zer{fa,tra,i}|3carão:çar{tran,ro,ti}|2orão:ôr~0ão:|6coitarão:çoitar|3carão:çar{co,bra}~3zer:rão{di{pre,on,en,ra,s,l},fa{s,e,er}}|5çar:alcarão~3rão:zer{fa,afa,tra,di}|2orão:pôr|3carão:çar{cal,for,ati,ro,la}"
    },
    "imperativeNeg": {
      "second": "1nhas:r|2as:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istas:estir|1as:air,orrir|3ças:edir,cir|3gas:izer|3jas:aver,ger|1jas:ver{e,ter}|3iras:equerer|1ias:crer|3as:uer|2ejas:brestar|3ques:çar{tran,rin,ro,ati}|3ces:çar{ntran,oro}|2onhas:ôr~2as:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jas:gir|5irjas:vergir|3ças:r{ce,faze,spraze,uvi}|2enhas:vir|1nhas:ter|2has:aler|3ssas:oder|5ussas:ossir|5irtas:ertir|5urtas:ortir|5intas:entir|4itas:etir|5urmas:ormir|4iras:erir|3iras:arir|5ubras:obrir|5igras:egrir|5igas:eguir|3gas:trazer|3as:nguir|4idas:redir|3ibas:aber|4íbas:oibir|5irvas:servir|3cas:erder|5águas:saguar|6ínquas:inquir|4ulas:golir|4ilas:elir|4únas:eunir|4inas:prevenir|5irzas:erzir|5ispas:espir|2es:ar|4údes:udar{sa,i}|6coites:çoitar|4úles:baular|3ques:ar{c,coç,emoç,braç}|5ísques:aiscar|5éques:equar|2ues:gar|6ólegues:olegar|5águes:aguar|3ces:çar|4úces:iuçar|2ies:ear|3eies:iar{ns,med,cend}|4ízes:izar{e,ju,a}|4ínes:ruinar~3ir:vás|3ger:jas{e,vi,an,on,ster}|3r:as{sej,vej,ei}|4ar:stejas|3ver:hajas|3dir:eças{p,sm}|3cer:peças{em,r}|3cir:arças|2er:as{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|2ir:as{nh,curt,mit,uir,garr}|4r:onhas|5estir:vistas|5ectir:ictas|4rer:eiras|2uer:gas|3zer:digas|2r:ias|2ar:s{e{scoit,u{inq{p,g},ig{ver,z,n}}},ê}|4çar:ques{strin,stro}|3ar:enseies|5iliar:ílies~2vás:ir|1jas:er{s,v,prov}|2ejas:estar|2ês:dar|2onhas:pôr|3iras:querer|1as:rir|1ias:ler{,re}|3ças:medir|3eies:odiar|4ulas:polir|3ques:çar{cal,for,ati,ro,la}|2as:arder,rer,condir|5ílies:mobiliar|2es:guar{min,e}|5ictas:flectir",
      "third": "1nha:r|2a:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5ista:estir|1a:air,orrir|3ça:edir|3ga:izer|3ja:aver,ger|1ja:ver{e,ter}|3ira:equerer|1ia:crer|3a:uer|2eja:brestar|3que:çar{tran,rin,ro,ati}|3ce:çar{ntran,oro}|2onha:ôr~2a:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3ja:gir|5irja:vergir|3ça:r{ce,faze,spraze,uvi}|2enha:vir|1nha:ter|2ha:aler|3ssa:oder|5ussa:ossir|5irta:ertir|5urta:ortir|5inta:entir|4ita:etir|5urma:ormir|4ira:erir|3ira:arir|5ubra:obrir|5igra:egrir|5iga:eguir|3ga:trazer|3a:nguir|4ida:redir|3iba:aber|4íba:oibir|5irva:servir|3ca:erder|5água:saguar|6ínqua:inquir|4ula:golir|4ila:elir|4úna:eunir|4ina:prevenir|5irza:erzir|5ispa:espir|2e:ar|4úde:udar{sa,i}|6coite:çoitar|4úle:baular|3que:ar{c,coç,emoç,braç}|5ísque:aiscar|5éque:equar|2ue:gar|6ólegue:olegar|5águe:aguar|3ce:çar|4úce:iuçar|2ie:ear|3eie:iar{ns,med,cend}|4íze:izar{e,ju,a}|4íne:ruinar|3ças:cir~2ir:vá|2ger:ja{e,vi,an,on,ster}|2r:seja,veja,eia|3ar:steja|2ver:haja|2dir:eça{p,sm}|2cer:peça{em,r}|1er:a{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|1ir:a{nh,curt,mit,uir,garr}|3r:onha|4estir:vista|4ectir:icta|3rer:eira|1uer:ga|2zer:diga|1r:ia|1ar:e{scoit,u{inq{p,g},ig{ver,z,n}}},ê|3çar:que{strin,stro}|2ar:enseie|4iliar:ílie~2vá:ir|1ja:er{s,v,prov}|2eja:estar|2ê:dar|2onha:pôr|3ira:querer|1a:rir|1ia:ler{,re}|3ça:medir|3eie:odiar|4ula:polir|3que:çar{cal,for,ati,ro,la}|2a:arder,rer,condir|5ílie:mobiliar|2e:guar{min,e}|5icta:flectir",
      "firstPlural": "1nhamos:r|2amos:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istamos:estir|1amos:air,orrir|3çamos:edir,cir|3gamos:izer|3jamos:aver,ger|1jamos:ver{e,ter}|3iramos:equerer|1iamos:crer|3amos:uer|2ejamos:brestar|3quemos:çar{tran,rin,ro,ati}|3cemos:çar{ntran,oro}|2onhamos:ôr~2amos:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|5irvamos:servir|3jamos:gir|5irjamos:vergir|3çamos:r{ce,faze,spraze,uvi}|2enhamos:vir|1nhamos:ter|2hamos:aler|3ssamos:oder|5ussamos:ossir|5irtamos:ertir|5urtamos:ortir|5intamos:entir|4itamos:etir|5urmamos:ormir|4iramos:erir|3iramos:arir|5ubramos:obrir|5igramos:egrir|5igamos:eguir|3gamos:trazer|3amos:nguir|4idamos:redir|3ibamos:aber|3camos:erder|1mos:saguar|4ulamos:golir|4ilamos:elir|4inamos:prevenir|5irzamos:erzir|5ispamos:espir|2emos:ar|6coitemos:çoitar|3quemos:ar{c,coç,emoç,braç}|2uemos:gar|3cemos:çar~4er:amos{v,h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,x,el,az,oz,enz,mp,o}|5ger:jamos{e,vi,an,on,ster}|5r:amos{sej,vej,ei}|6ar:stejamos|5ver:hajamos|5dir:eçamos{p,sm}|5cer:peçamos{em,r}|5cir:arçamos|4ir:amos{nh,curt,mit,uir,garr}|6r:onhamos|7estir:vistamos|7ectir:ictamos|6rer:eiramos|4uer:gamos|5zer:digamos|4r:iamos|4ar:emos{scoit,u{pinq,ginq,deq,g{xa,veri,zi,ni}}}|4iar:obilemos|6çar:quemos{strin,stro}~2vamos:ir|1jamos:er{s,v,prov}|2ejamos:estar|2onhamos:pôr|3iramos:querer|1amos:rir|1iamos:ler{,re}|3çamos:medir|4ulamos:polir|2emos:guar{a,min,e}|3quemos:çar{cal,for,ati,ro,la}|2amos:arder,rer,condir|3emos:mobiliar|5ictamos:flectir",
      "secondPlural": "1nhais:r|2ais:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istais:estir|1ais:air,orrir|3çais:edir,cir|3gais:izer|3jais:aver,ger|1jais:ver{e,ter}|3irais:equerer|1iais:crer|3ais:uer|2ejais:brestar|3queis:çar{tran,rin,ro,ati}|3ceis:çar{ntran,oro}|2onhais:ôr~2ais:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jais:gir|5irjais:vergir|3çais:r{ce,faze,spraze,uvi}|2enhais:vir|1nhais:ter|2hais:aler|3ssais:oder|5ussais:ossir|5irtais:ertir|5urtais:ortir|5intais:entir|4itais:etir|5urmais:ormir|4irais:erir|3irais:arir|5ubrais:obrir|5igrais:egrir|5igais:eguir|3gais:trazer|3ais:nguir|4idais:redir|3ibais:aber|5irvais:servir|3cais:erder|1is:saguar|4ulais:golir|4ilais:elir|4inais:prevenir|5irzais:erzir|5ispais:espir|2eis:ar|6coiteis:çoitar|3queis:ar{c,coç,emoç,braç}|2ueis:gar|3ceis:çar~5ir:vades|4ger:jais{e,vi,an,on,ster}|4r:ais{sej,vej,ei}|5ar:stejais|4ver:hajais|4dir:eçais{p,sm}|4cer:peçais{em,r}|4cir:arçais|3er:ais{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|3ir:ais{nh,curt,mit,uir,garr}|5r:onhais|6estir:vistais|6ectir:ictais|5rer:eirais|3uer:gais|4zer:digais|3r:iais|3ar:eis{scoit,u{pinq,ginq,deq,g{xa,veri,zi,ni}}}|5çar:queis{strin,stro}~2vades:ir|1jais:er{s,v,prov}|2ejais:estar|2onhais:pôr|3irais:querer|1ais:rir|1iais:ler{,re}|3çais:medir|4ulais:polir|2eis:guar{a,min,e}|3queis:çar{cal,for,ati,ro,la}|2ais:arder,rer,condir|5ictais:flectir",
      "thirdPlural": "1nham:r|2am:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istam:estir|1am:air,orrir|3çam:edir,cir|3gam:izer|3jam:aver,ger|1jam:ver{e,ter}|3iram:equerer|1iam:crer|3am:uer|2ejam:brestar|3quem:çar{tran,rin,ro,ati}|3cem:çar{ntran,oro}|2onham:ôr~2am:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jam:gir|5irjam:vergir|3çam:r{ce,faze,spraze,uvi}|2enham:vir|1nham:ter|2ham:aler|3ssam:oder|5ussam:ossir|5irtam:ertir|5urtam:ortir|5intam:entir|4itam:etir|5urmam:ormir|4iram:erir|3iram:arir|5ubram:obrir|5igram:egrir|5igam:eguir|3gam:trazer|3am:nguir|4idam:redir|3ibam:aber|4íbam:oibir|5irvam:servir|3cam:erder|5águam:saguar|6ínquam:inquir|4ulam:golir|4ilam:elir|4únam:eunir|4inam:prevenir|5irzam:erzir|5ispam:espir|2em:ar|4údem:udar{sa,i}|6coitem:çoitar|4úlem:baular|3quem:ar{c,coç,emoç,braç}|5ísquem:aiscar|5équem:equar|2uem:gar|6óleguem:olegar|5águem:aguar|3cem:çar|4úcem:iuçar|2iem:ear|3eiem:iar{ns,med,cend}|4ízem:izar{e,ju,a}|4ínem:ruinar~3ir:vão|3ger:jam{e,vi,an,on,ster}|3r:am{sej,vej,ei}|4ar:stejam|3ver:hajam|3dir:eçam{p,sm}|3cer:peçam{em,r}|3cir:arçam|2er:am{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|2ir:am{nh,curt,mit,uir,garr}|4r:onham|5estir:vistam|5ectir:ictam|4rer:eiram|2uer:gam|3zer:digam|2r:iam|3ar:eem,enseiem|2ar:em{scoit,u{inq{p,g},ig{ver,z,n}}}|4çar:quem{strin,stro}|5iliar:íliem~2vão:ir|1jam:er{s,v,prov}|2ejam:estar|2eem:dar|2onham:pôr|3iram:querer|1am:rir|1iam:ler{,re}|3çam:medir|3eiem:odiar|4ulam:polir|3quem:çar{cal,for,ati,ro,la}|2am:arder,rer,condir|5íliem:mobiliar|2em:guar{min,e}|5ictam:flectir"
    },
    "imperative": {
      "second": "1:r{i{a,orr,u,rgu},e{ev{cr,atr,d},rt},ntrança,oroça}|2e:ir{sum{s,e},sfug,trogred,gu}|4ole:ulir|2ê:er{ev,terv,cr}|2á:brestar|3ca:çar{tran,rin,ro}|2õe:ôr~1:r{,e{bat,met,rret,jaz,mpraz,po}}|3ói:r{oe,strui{on,e}}|2:zer{a,i}|4úda:udar{sa,i}|6coita:çoitar|4úla:baular|3ca:çar{ati,co,emo,bra}|5usca:moscar|5ísca:aiscar|6ólega:olegar|4úça:iuçar|2ia:ear|3eia:iar{ns,med,cend}|5équa:equar|5água:aguar|4íza:izar{e,ju,a}|4ína:ruinar|2ém:ter,vir|4á:aver|2e:ir{,uv,serv,ebul}|4ode:cudir|4ide:redir|5urte:ortir|4ome:umir|2õe:or|5igre:egrir|4obe:ubir|4íbe:oibir|4oge:fugir|4ege:frigir|6ínque:inquir|4úne:eunir|4ine:prevenir|5irze:erzir|5ospe:uspir|4ope:upir~1er:ê|0r:scoita,ratica,amusca,e{d{po,en,on,ce,fe,er,or},ert,com,em,r{or,var,ue,f},ab,eb,amb,v,g{vi,e,an,on,ster},rgu,c,ess,os,val,rel,cel,x,lh,ch,oz,enz,mp}|2çar:strinca,stroca|2ar:enseia|4iliar:ília|1r:m|2ir:vem|1ar:tá,dá|1ir:e{rt{ive,dve,cu},nquer,arc}|3olir:ule|3ulir:apole|0er:r~2vai:ir|2ê:er{s,v,prov,l,rel}|2em:vir|2á:estar,dar|1m:ter|2õe:pôr|2:querer|1:rir,arder,rer|3eia:odiar|4ule:polir|3ca:çar{cal,for,ro,la}|4ole:bulir|5ília:mobiliar|2e:condir",
      "third": "1nha:r|2a:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5ista:estir|1a:air,orrir|3ça:edir,cir|3ga:izer|3ja:aver,ger|1ja:ver{e,ter}|3ira:equerer|1ia:crer|3a:uer|2eja:brestar|3que:çar{tran,rin,ro,ati}|3ce:çar{ntran,oro}|2onha:ôr~2a:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3ja:gir|5irja:vergir|3ça:r{ce,faze,spraze,uvi}|2enha:vir|1nha:ter|2ha:aler|3ssa:oder|5ussa:ossir|5irta:ertir|5urta:ortir|5inta:entir|4ita:etir|5urma:ormir|4ira:erir|3ira:arir|5ubra:obrir|5igra:egrir|5iga:eguir|3ga:trazer|3a:nguir|4ida:redir|3iba:aber|4íba:oibir|5irva:servir|3ca:erder|6ínqua:inquir|4ula:golir|4ila:elir|4úna:eunir|4ina:prevenir|5irza:erzir|5ispa:espir|2e:ar|4úde:udar{sa,i}|6coite:çoitar|4úle:baular|3que:ar{c,coç,emoç,braç}|5usque:moscar|5ísque:aiscar|5éque:equar|2ue:gar|6ólegue:olegar|5águe:aguar|3ce:çar|4úce:iuçar|2ie:ear|3eie:iar{ns,med,cend}|4íze:izar{e,ju,a}|4íne:ruinar~2ir:vá|2ger:ja{e,vi,an,on,ster}|2r:seja,veja,eia|3ar:steja|2ver:haja|2dir:eça{p,sm}|2cer:peça{em,r}|2cir:arça|1er:a{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|1ir:a{nh,curt,mit,uir,garr}|3r:onha|4estir:vista|4ectir:icta|3rer:eira|1uer:ga|2zer:diga|1r:ia|1ar:e{scoit,u{inq{p,g},ig{ver,z,n}}},ê|3çar:que{strin,stro}|3car:amusque|2ar:enseie|4iliar:ílie~2vá:ir|1ja:er{s,v,prov}|2eja:estar|2ê:dar|2onha:pôr|3ira:querer|1a:rir|1ia:ler{,re}|3ça:medir|3eie:odiar|4ula:polir|3que:çar{cal,for,ati,ro,la}|2a:arder,rer,condir|5ílie:mobiliar|2e:guar{min,e}|5icta:flectir",
      "firstPlural": "1nhamos:r|2amos:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istamos:estir|1amos:air,orrir|3çamos:edir,cir|3gamos:izer|3jamos:aver,ger|1jamos:ver{e,ter}|3iramos:equerer|1iamos:crer|3amos:uer|2ejamos:brestar|3quemos:çar{tran,rin,ro,ati}|3cemos:çar{ntran,oro}|2onhamos:ôr~2amos:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|5irvamos:servir|3jamos:gir|5irjamos:vergir|3çamos:r{ce,faze,spraze,uvi}|2enhamos:vir|1nhamos:ter|2hamos:aler|3ssamos:oder|5ussamos:ossir|5irtamos:ertir|5urtamos:ortir|5intamos:entir|4itamos:etir|5urmamos:ormir|4iramos:erir|3iramos:arir|5ubramos:obrir|5igramos:egrir|5igamos:eguir|3gamos:trazer|3amos:nguir|4idamos:redir|3ibamos:aber|3camos:erder|4ulamos:golir|4ilamos:elir|4inamos:prevenir|5irzamos:erzir|5ispamos:espir|2emos:ar|6coitemos:çoitar|3quemos:ar{c,coç,emoç,braç}|2uemos:gar|3cemos:çar~4er:amos{v,h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,x,el,az,oz,enz,mp,o}|5ger:jamos{e,vi,an,on,ster}|5r:amos{sej,vej,ei}|6ar:stejamos|5ver:hajamos|5dir:eçamos{p,sm}|5cer:peçamos{em,r}|5cir:arçamos|4ir:amos{nh,curt,mit,uir,garr}|6r:onhamos|7estir:vistamos|7ectir:ictamos|6rer:eiramos|4uer:gamos|5zer:digamos|4r:iamos|4ar:emos{scoit,u{pinq,ginq,deq,g{xa,sa,veri,zi,ni}}}|4iar:obilemos|6çar:quemos{strin,stro}~2vamos:ir|1jamos:er{s,v,prov}|2ejamos:estar|2onhamos:pôr|3iramos:querer|1amos:rir|1iamos:ler{,re}|3çamos:medir|4ulamos:polir|2emos:guar{a,min,e}|3quemos:çar{cal,for,ati,ro,la}|2amos:arder,rer,condir|3emos:mobiliar|5ictamos:flectir",
      "secondPlural": "1i:r{,e{ev{cr,atr,d},t{ba,rre,me,r}},ntrança,oroça}|1:ir{serv,egu,ngu,qu}|1de:r{orri,eve,terve,cre}|3cai:çar{tran,rin,ro}|2onde:ôr~1nde:vir,ter,or|1:ir|6coitai:çoitar|3cai:çar{ati,co,emo,bra}|2í:air,uir|3çais:uvir~2r:de|1r:i{e,a,scoita,ratica}|3çar:cai{strin,stro}~1de:r{i,ri,e{s,v,prov,l,rel}}|2onde:pôr|1:ouvir|3cai:çar{cal,for,ro,la}",
      "thirdPlural": "1nham:r|2am:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istam:estir|1am:air,orrir|3çam:edir,cir|3gam:izer|3jam:aver,ger|1jam:ver{e,ter}|3iram:equerer|1iam:crer|3am:uer|2ejam:brestar|3quem:çar{tran,rin,ro,ati}|3cem:çar{ntran,oro}|2onham:ôr~2am:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jam:gir|5irjam:vergir|3çam:r{ce,faze,spraze,uvi}|2enham:vir|1nham:ter|2ham:aler|3ssam:oder|5ussam:ossir|5irtam:ertir|5urtam:ortir|5intam:entir|4itam:etir|5urmam:ormir|4iram:erir|3iram:arir|5ubram:obrir|5igram:egrir|5igam:eguir|3gam:trazer|3am:nguir|4idam:redir|3ibam:aber|4íbam:oibir|5irvam:servir|3cam:erder|6ínquam:inquir|4ulam:golir|4ilam:elir|4únam:eunir|4inam:prevenir|5irzam:erzir|5ispam:espir|2em:ar|4údem:udar{sa,i}|6coitem:çoitar|4úlem:baular|3quem:ar{c,coç,emoç,braç}|5usquem:moscar|5ísquem:aiscar|5équem:equar|2uem:gar|6óleguem:olegar|5águem:aguar|3cem:çar|4úcem:iuçar|2iem:ear|3eiem:iar{ns,med,cend}|4ízem:izar{e,ju,a}|4ínem:ruinar~3ir:vão|3ger:jam{e,vi,an,on,ster}|3r:am{sej,vej,ei}|4ar:stejam|3ver:hajam|3dir:eçam{p,sm}|3cer:peçam{em,r}|3cir:arçam|2er:am{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|2ir:am{nh,curt,mit,uir,garr}|4r:onham|5estir:vistam|5ectir:ictam|4rer:eiram|2uer:gam|3zer:digam|2r:iam|3ar:eem,enseiem|2ar:em{scoit,u{inq{p,g},ig{ver,z,n}}}|4çar:quem{strin,stro}|4car:amusquem|5iliar:íliem~2vão:ir|1jam:er{s,v,prov}|2ejam:estar|2eem:dar|2onham:pôr|3iram:querer|1am:rir|1iam:ler{,re}|3çam:medir|3eiem:odiar|4ulam:polir|3quem:çar{cal,for,ati,ro,la}|2am:arder,rer,condir|5íliem:mobiliar|2em:guar{min,e}|5ictam:flectir"
    },
    "imperfect": {
      "first": "1a:uir{g,q}|2ia:er,rter|3cava:çar{tran,ro,ti}|2unha:ôr~1a:r,uvir,servir|2ia:er{bat,met,rret,po}|1va:ar|6coitava:çoitar|3cava:çar{co,bra}|1nha:vir|2inha:ter|2unha:or|2ía:air,uir,oer~2er:ia{z,v,d{po,en,on,ce,fe,r},ert,om,em,r{ue,r,c,f},val,rel,ab,eb,amb,vig,eg,ang,ergu,c,os,x,h,mp}|1r:ia{uz,anz,rz,urd,vert{i,d},sorr,arc,nh}|3ser:era|4çar:alcava~3era:ser|2unha:pôr|2ia:ler|2ía:arguir|3cava:çar{cal,for,ati,ro,la}|1a:remir",
      "second": "1as:uir{g,q}|2ias:er,rter|3cavas:çar{tran,ro,ti}|2unhas:ôr~1as:r,uvir,servir|2ias:er{bat,met,rret,po}|1vas:ar|6coitavas:çoitar|3cavas:çar{co,bra}|1nhas:vir|2inhas:ter|2unhas:or|2ías:air,uir,oer~3er:ias{z,v,d{po,en,on,ce,fe,r},ert,om,em,r{ue,r,c,f},val,rel,ab,eb,amb,vig,eg,ang,ergu,c,os,x,h,mp}|2r:ias{uz,anz,rz,urd,vert{i,d},sorr,arc,nh}|4ser:eras|5çar:alcavas~3eras:ser|2unhas:pôr|2ias:ler|2ías:arguir|3cavas:çar{cal,for,ati,ro,la}|1as:remir",
      "third": "1a:uir{g,q}|2ia:er,rter|3cava:çar{tran,ro,ti}|2unha:ôr~1a:r,uvir,servir|2ia:er{bat,met,rret,po}|1va:ar|6coitava:çoitar|3cava:çar{co,bra}|1nha:vir|2inha:ter|2unha:or|2ía:air,uir,oer~2er:ia{z,v,d{po,en,on,ce,fe,r},ert,om,em,r{ue,r,c,f},val,rel,ab,eb,amb,vig,eg,ang,ergu,c,os,x,h,mp}|1r:ia{uz,anz,rz,urd,vert{i,d},sorr,arc,nh}|3ser:era|4çar:alcava~3era:ser|2unha:pôr|2ia:ler|2ía:arguir|3cava:çar{cal,for,ati,ro,la}|1a:remir",
      "firstPlural": "2íamos:er,rter|3cávamos:çar{tran,ro,ti}|2únhamos:ôr~2íamos:r{i,uvi,servi,te{ba,me,rre}}|2ávamos:ar|6coitávamos:çoitar|3cávamos:çar{co,bra}|2ínhamos:vir,ter|2únhamos:or~5er:íamos{z,v,d{po,en,on,ce,fe,r},ert,om,em,r{ue,r,c,f},val,rel,ab,eb,amb,vig,eg,ang,ergu,c,os,x,h,mp,o}|5ir:íamos{uz,anz,rz,urd,vert{i,d},sorr,arc,nh}|6ser:éramos|7çar:alcávamos~3éramos:ser|2únhamos:pôr|2íamos:ler,remir|3cávamos:çar{cal,for,ati,ro,la}",
      "secondPlural": "2íeis:er,rter|3cáveis:çar{tran,ro,ti}|2únheis:ôr~2íeis:r{i,uvi,servi,te{ba,me,rre}}|2áveis:ar|6coitáveis:çoitar|3cáveis:çar{co,bra}|2ínheis:vir,ter|2únheis:or~4er:íeis{z,v,d{po,en,on,ce,fe,r},ert,om,em,r{ue,r,c,f},val,rel,ab,eb,amb,vig,eg,ang,ergu,c,os,x,h,mp,o}|4ir:íeis{uz,anz,rz,urd,vert{i,d},sorr,arc,nh}|5ser:éreis|6çar:alcáveis~3éreis:ser|2únheis:pôr|2íeis:ler,remir|3cáveis:çar{cal,for,ati,ro,la}",
      "thirdPlural": "1am:uir{g,q}|2iam:er,rter|3cavam:çar{tran,ro,ti}|2unham:ôr~1am:r,uvir,servir|2iam:er{bat,met,rret,po}|1vam:ar|6coitavam:çoitar|3cavam:çar{co,bra}|1nham:vir|2inham:ter|2unham:or|2íam:air,uir,oer~3er:iam{z,v,d{po,en,on,ce,fe,r},ert,om,em,r{ue,r,c,f},val,rel,ab,eb,amb,vig,eg,ang,ergu,c,os,x,h,mp}|2r:iam{uz,anz,rz,urd,vert{i,d},sorr,arc,nh}|4ser:eram|5çar:alcavam~3eram:ser|2unham:pôr|2iam:ler|2íam:arguir|3cavam:çar{cal,for,ati,ro,la}|1am:remir"
    },
    "pastTense": {
      "first": "2i:er{,cav,rt}|3fui:ser|2ive:brestar|3quei:çar{tran,rin,ro,ati}|3cei:çar{ntran,oro}|2us:ôr~1:r{,i{egu,ngu,qu,uv,serv}}|2ei:ar|6coitei:çoitar|3quei:ar{c,coç,emoç,braç}|2uei:gar|3cei:çar|2i:er{bat,met,rret,ss,os,jaz,po}|4iz:azer|1m:vir|2ive:ter|4ouve:aver,mprazer|4ude:oder|3sse:izer|4ouxe:trazer|4oube:aber|2us:or|2í:air,uir,oer~1er:i{u,v,ert,om,em,r{r,c,ue,f},val,rel,cel,d{en,on,ce,fe,r},eb,amb,g{vi,e,an,on,ster},c,x,h,oz,enz,mp}|3ir:fui|2ar:ei{scoit,u{pinq,ginq,deq,g{xa,sa,veri,zi,ni}}}|4çar:quei{strin,stro}|0r:i{vert{i,d},frem,sorr,garr,nquer,card,urd,arc,oss,nh}|3ar:estive|2erer:is~2fui:ir|2ive:estar|2us:pôr|4is:querer|2i:ler|2ei:guar{a,min,e}|3quei:çar{cal,for,ati,ro,la}|1:remir,condir",
      "second": "1ste:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3foste:ser|2iste:ver{e,ter}|2iveste:brestar|3caste:çar{tran,rin,ro}|2useste:ôr~1ste:r,uvir,servir|4izeste:azer|1este:vir|2iveste:ter|4ouveste:aver,mprazer|4udeste:oder|2useste:or|3sseste:izer|4ouxeste:trazer|4oubeste:aber|6coitaste:çoitar|3caste:çar{ati,co,emo,bra}|3regulamentasseiaste:baciar|2íste:air,uir~5ir:foste|6ar:estiveste|6erer:iseste|3r:aste{scoit,ratic}|5çar:caste{strin,stro}|4er:viste~2foste:ir|2iste:ver|2iveste:estar|2este:dar|2useste:pôr|4iseste:querer|2íste:arguir|3caste:çar{cal,for,ro,la}",
      "third": "3foi:ser|1u:er{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}}|2iu:ver{e,ter}|2eve:brestar|3cou:çar{tran,rin,ro}|2ou:çar{ntran,oro}|1s:ôr~4ez:azer|1u:r,uvir,servir|2ou:ar|6coitou:çoitar|3cou:çar{ati,co,emo,bra}|2eio:vir|1ve:ter|4ouve:aver,mprazer|4ôde:oder|3sse:izer|4ouxe:trazer|4oube:aber|2ôs:or~3ir:foi|2ar:scoitou,raticou|3çar:cou{strin,stro}|2er:viu|3ar:esteve|2erer:is~2foi:ir|2iu:ver|2eve:estar|2eu:dar|1s:pôr|4is:querer|3cou:çar{cal,for,ro,la}",
      "firstPlural": "1mos:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fomos:ser|2imos:ver{e,ter}|2ivemos:brestar|3camos:çar{tran,rin,ro}|2usemos:ôr~1mos:r,uvir,servir|4izemos:azer|1emos:vir|2ivemos:ter|4ouvemos:aver,mprazer|4udemos:oder|2usemos:or|3ssemos:izer|4ouxemos:trazer|4oubemos:aber|6coitamos:çoitar|3camos:çar{ati,co,emo,bra}|2ímos:air,uir~5ir:fomos|6ar:estivemos|6erer:isemos|3r:amos{scoit,ratic}|5çar:camos{strin,stro}|4er:vimos~2fomos:ir|2imos:ver|2ivemos:estar|2emos:dar|2usemos:pôr|4isemos:querer|2ímos:arguir|3camos:çar{cal,for,ro,la}",
      "secondPlural": "1stes:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fostes:ser|2istes:ver{e,ter}|2ivestes:brestar|3castes:çar{tran,rin,ro}|2usestes:ôr~1stes:r,uvir,servir|4izestes:azer|1estes:vir|2ivestes:ter|4ouvestes:aver,mprazer|4udestes:oder|2usestes:or|3ssestes:izer|4ouxestes:trazer|4oubestes:aber|6coitastes:çoitar|3castes:çar{ati,co,emo,bra}|2ístes:air,uir~6ir:fostes|7ar:estivestes|7erer:isestes|4r:astes{scoit,ratic}|6çar:castes{strin,stro}|5er:vistes~2fostes:ir|2istes:ver|2ivestes:estar|2estes:dar|2usestes:pôr|4isestes:querer|2ístes:arguir|3castes:çar{cal,for,ro,la}",
      "thirdPlural": "0am:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3foram:ser|2iram:ver{e,ter}|2iveram:brestar|3caram:çar{tran,rin,ro}|2useram:ôr~0am:,vir{u,ser}|4izeram:azer|1eram:vir|2iveram:ter|4ouveram:aver,mprazer|4uderam:oder|2useram:or|3sseram:izer|4ouxeram:trazer|4ouberam:aber|6coitaram:çoitar|3caram:çar{ati,co,emo,bra}|2íram:air,uir|2ou:saguar~5ir:foram|6ar:estiveram|6erer:iseram|2:aram{scoit,ratic}|5çar:caram{strin,stro}|4er:viram~2foram:ir|2iram:ver|2iveram:estar|2eram:dar|2useram:pôr|4iseram:querer|2íram:arguir|3caram:çar{cal,for,ro,la}"
    },
    "pluperfect": {
      "first": "0a:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fora:ser|2ira:ver{e,ter}|2ivera:brestar|3cara:çar{tran,rin,ro}|2usera:ôr~0a:,vir{u,ser}|4izera:azer|1era:vir|2ivera:ter|4ouvera:aver,mprazer|4udera:oder|2usera:or|3ssera:izer|4ouxera:trazer|4oubera:aber|6coitara:çoitar|3cara:çar{ati,co,emo,bra}|2íra:air,uir~4ir:fora|5ar:estivera|5erer:isera|1:ara{scoit,ratic}|4çar:cara{strin,stro}|3er:vira~2fora:ir|2ira:ver|2ivera:estar|2era:dar|2usera:pôr|4isera:querer|2íra:arguir|3cara:çar{cal,for,ro,la}",
      "second": "0as:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3foras:ser|2iras:ver{e,ter}|2iveras:brestar|3caras:çar{tran,rin,ro}|2useras:ôr~0as:,vir{u,ser}|4izeras:azer|1eras:vir|2iveras:ter|4ouveras:aver,mprazer|4uderas:oder|2useras:or|3sseras:izer|4ouxeras:trazer|4ouberas:aber|6coitaras:çoitar|3caras:çar{ati,co,emo,bra}|2íras:air,uir~5ir:foras|6ar:estiveras|6erer:iseras|2:aras{scoit,ratic}|5çar:caras{strin,stro}|4er:viras~2foras:ir|2iras:ver|2iveras:estar|2eras:dar|2useras:pôr|4iseras:querer|2íras:arguir|3caras:çar{cal,for,ro,la}",
      "third": "0a:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fora:ser|2ira:ver{e,ter}|2ivera:brestar|3cara:çar{tran,rin,ro}|2usera:ôr~0a:,vir{u,ser}|4izera:azer|1era:vir|2ivera:ter|4ouvera:aver,mprazer|4udera:oder|2usera:or|3ssera:izer|4ouxera:trazer|4oubera:aber|6coitara:çoitar|3cara:çar{ati,co,emo,bra}|2íra:air,uir~4ir:fora|5ar:estivera|5erer:isera|1:ara{scoit,ratic}|4çar:cara{strin,stro}|3er:vira~2fora:ir|2ira:ver|2ivera:estar|2era:dar|2usera:pôr|4isera:querer|2íra:arguir|3cara:çar{cal,for,ro,la}",
      "firstPlural": "3fôramos:ser|2êramos:er{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}}|2íramos:ver{e,ter}|2ivéramos:brestar|3cáramos:çar{tran,rin,ro}|2áramos:çar{ntran,oro}|2uséramos:ôr~4izéramos:azer|1éramos:vir|2ivéramos:ter|4ouvéramos:aver,mprazer|4udéramos:oder|2uséramos:or|3sséramos:izer|4ouxéramos:trazer|4oubéramos:aber|2áramos:ar|6coitáramos:çoitar|3cáramos:çar{ati,co,emo,bra}|2íramos:ir{,uv,serv}|2êramos:er~7ir:fôramos|6ar:ramos{é,scoitá,raticá}|8ar:estivéramos|8erer:iséramos|7çar:cáramos{strin,stro}|6er:víramos~2fôramos:ir|2íramos:ver|2ivéramos:estar|2éramos:dar|2uséramos:pôr|4iséramos:querer|3cáramos:çar{cal,for,ro,la}",
      "secondPlural": "3fôreis:ser|2êreis:er{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}}|2íreis:ver{e,ter}|2ivéreis:brestar|3cáreis:çar{tran,rin,ro}|2áreis:çar{ntran,oro}|2uséreis:ôr~4izéreis:azer|1éreis:vir|2ivéreis:ter|4ouvéreis:aver,mprazer|4udéreis:oder|2uséreis:or|3sséreis:izer|4ouxéreis:trazer|4oubéreis:aber|2áreis:ar|6coitáreis:çoitar|3cáreis:çar{ati,co,emo,bra}|2íreis:ir{,uv,serv}|2êreis:er~6ir:fôreis|5ar:reis{é,scoitá,raticá}|7ar:estivéreis|7erer:iséreis|6çar:cáreis{strin,stro}|5er:víreis~2fôreis:ir|2íreis:ver|2ivéreis:estar|2éreis:dar|2uséreis:pôr|4iséreis:querer|3cáreis:çar{cal,for,ro,la}",
      "thirdPlural": "0am:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3foram:ser|2iram:ver{e,ter}|2iveram:brestar|3caram:çar{tran,rin,ro}|2useram:ôr~0am:,vir{u,ser}|4izeram:azer|1eram:vir|2iveram:ter|4ouveram:aver,mprazer|4uderam:oder|2useram:or|3sseram:izer|4ouxeram:trazer|4ouberam:aber|6coitaram:çoitar|3caram:çar{ati,co,emo,bra}|2íram:air,uir~5ir:foram|6ar:estiveram|6erer:iseram|2:aram{scoit,ratic}|5çar:caram{strin,stro}|4er:viram~2foram:ir|2iram:ver|2iveram:estar|2eram:dar|2useram:pôr|4iseram:querer|2íram:arguir|3caram:çar{cal,for,ro,la}"
    },
    "presentTense": {
      "first": "1nho:r|2o:r{i,e,rrete,rte}|3ço:r{uvi,edi,ci,ce}|5isto:estir|4ito:etir|1o:rrir|4iro:erir|5igo:eguir|3o:nguir,uer|4ulo:olir|4ilo:elir|4ino:enir|3go:izer|3sso:oder|1io:ler|2ho:aler|4ei:aber|3jo:ger|2ou:brestar|5usco:oscar|3co:çar{tran,ro,ti}|2onho:ôr~2o:r{a,e{bat,met,crev,dev},epoli}|3ço:fazer|4úço:iuçar|5urmo:ormir|2enho:vir|1nho:ter|3jo:gir|1jo:ver{e,ter}|5irjo:vergir|5usso:ossir|5irto:ertir|5urto:ortir|5into:entir|6coito:çoitar|4ido:redir|4údo:saudar|5ubro:obrir|3iro:equerer,arir|5igro:egrir|3go:trazer|6ólego:olegar|1o:air|2io:ear|1io:crer|3eio:iar{ns,med,nd}|5ílio:biliar|3ibo:caber|4íbo:oibir|5irvo:servir|3co:erder,coçar,braçar|5ísco:aiscar|5équo:equar|6ínquo:inquir|5águo:aguar|5ispo:espir|5irzo:erzir|4ízo:izar{e,u,a}|4úno:eunir|4íno:uinar|4ei:aver~2ar:ou|3ir:vou|2er:sou,valho|2vir:ouço|2cer:ço{e,en,s,xer,tor}|2dir:peço|1ar:o{eç{op,om,der},turm,essum,lgem,j{e,a{i,or,tr,g},ei,mi,zi,su,rru,pu,an{rr,m,b},or,o},t{apar,fur,pin,vis{a,tre},vomi,imi,escu,ecu},nd{e{sv,er,m,g},afu,ofu},migr,mendig,strag,nsai,mai,cerc,tun}|2cir:sarço|1er:o{com,em,colh,tolh,ench,os,vert,erret,d{en,pon,con,mor,ce,fe},r{cor,mor,var,of},eb,amb,v{vi,ho,mo,spro,fer,or,ol},rro,mo,po,mex,omp,z{ja,ra,co,n}}|1ir:o{m{ri,exi,di,su},runh,t{par,cur,ran,sis,xis,mi,cu,glu,bu},d{lau,lu,cu,pan,fun,cin,i{iv,ec,nc,col,s},va,ua,lo},apul,bul,impl,r{ab,ump,sup,ut,ui},ib,sub,umb,u{ss,min,an,r,l,b,rg,tit,int},tup,usp,duz,luz,anz,fin,un}|3r:ponho|2r:provejo,releio|2ger:jo{ote,eele,vi,an}|3der:posso|4estir:visto|3etir:ito{ep,mp,fl}|3olir:ngulo|3elir:pilo|3erir:iro{f,pret,d,g,s}|2zer:digo|3eguir:sigo|1uir:tingo|1r:orrio|4oscar:musco|2çar:alco|3enir:vino|2aber:sei~2vou:ir|2ou:ser,estar,dar|1jo:ver{,pro}|2onho:pôr|2o:r{quere,roe,arde,a{gir,vai,rai,rem,rim,pil}}|1o:rir|1io:ler|3ço:medir|3eio:odiar|3jo:eger{r,el}|3o:erguer|3co:çar{cal,for,ati,ro,la}",
      "second": "1s:r{i{a,rr,u,rgu},creve,deve,rte}|2es:ir{sum{s,e},gu}|2ês:er{ev,terv,cr,l}|2ás:brestar|5uscas:oscar|3cas:çar{tran,ro,ti}|2ões:ôr~1s:r{,e{bat,met,rret,al,po}}|3óis:r{oe,strui{on,e}}|2es:ir{,uv,serv}|5irzes:erzir|4odes:cudir|4ides:redir|5urtes:ortir|4omes:umir|2ões:or|5igres:egrir|4obes:ubir|4íbes:oibir|4oges:fugir|4eges:frigir|6ínques:inquir|4oles:ulir|4únes:eunir|4ines:enir|5ospes:uspir|4opes:upir|4údas:saudar|6coitas:çoitar|3cas:çar{co,bra}|5íscas:aiscar|6ólegas:olegar|4úças:iuçar|2ias:ear|3eias:iar{ns,med,nd}|5ílias:biliar|5équas:equar|5águas:aguar|4ízas:izar{e,u,a}|4ínas:uinar|2éns:ter,vir|4ás:aver~2ser:és|1r:es{z,d{po,en,on,ce,fe,r},ert,com,em,uer,rr,fr,ab,eb,amb,v,vig,eg,ang,rgu,c,os,x,lh,ch,mp}|2ir:es{uz,anz,rt{ive,dve,cu},arc,gol,epol,fin}|4olir:ules|5oscar:muscas|3çar:alcas|2r:ns|3ir:vens|2er:ês|2ar:tás,dás~2vais:ir|3és:ser|2ens:vir|2ês:ver{,pro}|2ás:estar,dar|1ns:ter|2ões:pôr|1s:rir|3eias:odiar|4ules:polir|3cas:çar{cal,for,ati,ro,la}",
      "third": "1:r{i{a,rr,u,rgu},creve,deve,rte}|2e:ir{sum{s,e},gu}|2ê:er{ev,terv,cr,l}|2á:brestar|5usca:oscar|3ca:çar{tran,ro,ti}|2õe:ôr~1:r{,e{bat,met,rret,al,po}}|3ói:r{oe,strui{on,e}}|2:r{aze,ize,ere,uzi}|4úda:saudar|6coita:çoitar|3ca:çar{co,bra}|5ísca:aiscar|6ólega:olegar|4úça:iuçar|2ia:ear|3eia:iar{ns,med,nd}|5ília:biliar|5équa:equar|5água:aguar|4íza:izar{e,u,a}|4ína:uinar|2ém:ter,vir|4á:aver|2e:ir{,uv,serv}|4ode:cudir|4ide:redir|5urte:ortir|4ome:umir|2õe:or|5igre:egrir|4obe:ubir|4íbe:oibir|4oge:fugir|4ege:frigir|6ínque:inquir|4ole:ulir|4úne:eunir|4ine:enir|5ospe:uspir|4ope:upir|5irze:erzir~1ser:é|4oscar:musca|2çar:alca|1r:m|2ir:vem|1er:ê|1ar:tá,dá|0r:e{d{po,en,on,ce,fe,r},ert,com,em,rr,fr,ab,eb,amb,v,vig,eg,ang,rgu,c,os,x,lh,ch,mp,oz,enz}|1ir:e{rt{ive,dve,cu},arc,gol,epol,fin}|3olir:ule~2vai:ir|3é:ser|2em:vir|2ê:ver{,pro}|2á:estar,dar|1m:ter|2õe:pôr|1:rir|3eia:odiar|4ule:polir|3ca:çar{cal,for,ati,ro,la}",
      "firstPlural": "1mos:uir{g,q}|3camos:çar{tran,ro,ti}|2omos:ôr~1mos:r|6coitamos:çoitar|3camos:çar{co,bra}|2ímos:air,uir~5çar:alcamos|4er:somos~2vamos:ir|2omos:ser,pôr|2ímos:arguir|3camos:çar{cal,for,ati,ro,la}",
      "secondPlural": "1is:r{,e{crev,dev,t{ba,rre,me,r},al}}|1s:ir{uv,serv,egu,ngu,qu}|1des:r{rri,e{ev,terv,cr,l}}|3cais:çar{tran,ro,ti}|2ondes:ôr~1ndes:vir,ter,or|1s:ir|6coitais:çoitar|3cais:çar{co,bra}|2ís:air,uir~3r:des|3er:ois|2r:eis,ais|4çar:alcais~1des:r{i,ri,ve,prove}|2ois:ser|2ondes:pôr|3cais:çar{cal,for,ati,ro,la}",
      "thirdPlural": "1em:r{rri,e{ev,terv,cr,l}}|2em:sumir{s,e}|1m:er{crev,dev,rt}|2ão:brestar|5uscam:oscar|3cam:çar{tran,ro,ti}|2õem:ôr~4ão:aver|1m:r{,e{bat,met,rret,al}}|2em:ir{,uv,serv}|5irzem:erzir|4odem:cudir|4idem:redir|5urtem:ortir|4omem:umir|2õem:or|5igrem:egrir|4obem:ubir|4íbem:oibir|4ogem:fugir|4egem:frigir|6ínquem:inquir|4olem:ulir|3oem:struir{on,e}|4únem:eunir|4inem:enir|5ospem:uspir|4opem:upir|4údam:saudar|6coitam:çoitar|3cam:çar{co,bra}|5íscam:aiscar|6ólegam:olegar|4úçam:iuçar|2iam:ear|3eiam:iar{ns,med,nd}|5íliam:biliar|5équam:equar|5águam:aguar|4ízam:izar{e,u,a}|4ínam:uinar|2êm:vir,ter~3ir:vão|2er:são|2ar:tão,dão|1r:em{z,d{po,en,on,ce,fe,r},ert,com,em,uer,rr,fr,ab,eb,amb,v,vig,eg,ang,ergu,c,os,x,lh,ch,o,mp}|2ir:em{uz,anz,rt{ive,dve,cu},arc,gol,epol,fin}|2r:eem,iem|4olir:ulem|5oscar:muscam|3çar:alcam~2vão:ir|2ão:ser,estar,dar|1em:ver,prover,rir|2õem:pôr|3eiam:odiar|4ulem:polir|3cam:çar{cal,for,ati,ro,la}"
    },
    "infinitivo": {
      "first": "3car:çar{tran,ro,ti}~0:|6coitar:çoitar|3car:çar{co,bra}~3çar:alcar~3car:çar{cal,for,ati,ro,la}",
      "second": "0es:uir{g,q}|3cares:çar{tran,ro,ti}|2ores:ôr~0es:|6coitares:çoitar|3cares:çar{co,bra}|2íres:air,uir~5çar:alcares~2ores:pôr|2íres:arguir|3cares:çar{cal,for,ati,ro,la}",
      "third": "3car:çar{tran,ro,ti}~0:|6coitar:çoitar|3car:çar{co,bra}~3çar:alcar~3car:çar{cal,for,ati,ro,la}",
      "firstPlural": "3carmos:çar{tran,ro,ti}|2ormos:ôr~0mos:|6coitarmos:çoitar|3carmos:çar{co,bra}~6çar:alcarmos~2ormos:pôr|3carmos:çar{cal,for,ati,ro,la}",
      "secondPlural": "3cardes:çar{tran,ro,ti}|2ordes:ôr~0des:|6coitardes:çoitar|3cardes:çar{co,bra}~6çar:alcardes~2ordes:pôr|3cardes:çar{cal,for,ati,ro,la}",
      "thirdPlural": "0em:uir{g,q}|3carem:çar{tran,ro,ti}|2orem:ôr~0em:|6coitarem:çoitar|3carem:çar{co,bra}|2írem:air,uir~5çar:alcarem~2orem:pôr|2írem:arguir|3carem:çar{cal,for,ati,ro,la}"
    },
    "subjPresent": {
      "first": "1nha:r|2a:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5ista:estir|1a:air,orrir|3ça:edir,cir|3ga:izer|3ja:aver,ger|1ja:ver{e,ter}|3ira:equerer|1ia:crer|3a:uer|2eja:brestar|3que:çar{tran,rin,ro,ati}|3ce:çar{ntran,oro}|2onha:ôr~2a:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3ja:gir|5irja:vergir|3ça:r{ce,faze,spraze,uvi}|2enha:vir|1nha:ter|2ha:aler|3ssa:oder|5ussa:ossir|5irta:ertir|5urta:ortir|5inta:entir|4ita:etir|5urma:ormir|4ira:erir|3ira:arir|5ubra:obrir|5igra:egrir|5iga:eguir|3ga:trazer|3a:nguir|4ida:redir|3iba:aber|4íba:oibir|5irva:servir|3ca:erder|6ínqua:inquir|4ula:golir|4ila:elir|4úna:eunir|4ina:prevenir|5irza:erzir|5ispa:espir|2e:ar|4úde:udar{sa,i}|6coite:çoitar|4úle:baular|3que:ar{c,coç,emoç,braç}|5usque:moscar|5ísque:aiscar|5éque:equar|2ue:gar|6ólegue:olegar|5águe:aguar|3ce:çar|4úce:iuçar|2ie:ear|3eie:iar{ns,med,cend}|4íze:izar{e,ju,a}|4íne:ruinar|2o:xplodir~2ir:vá|2ger:ja{e,vi,an,on,ster}|2r:seja,veja,eia|3ar:steja|2ver:haja|2dir:eça{p,sm}|2cer:peça{em,r}|2cir:arça|1er:a{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|1ir:a{nh,curt,mit,uir,garr}|3r:onha|4estir:vista|4ectir:icta|3rer:eira|1uer:ga|2zer:diga|1r:ia|1ar:e{scoit,u{inq{p,g},ig{ver,z,n}}},ê|3çar:que{strin,stro}|3car:amusque|2ar:enseie|4iliar:ílie~2vá:ir|1ja:er{s,v,prov}|2eja:estar|2ê:dar|2onha:pôr|3ira:querer|1a:rir|1ia:ler{,re}|3ça:medir|3eie:odiar|4ula:polir|3que:çar{cal,for,ati,ro,la}|2a:arder,rer,condir|5ílie:mobiliar|2e:guar{min,e}|5icta:flectir",
      "second": "1nhas:r|2as:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istas:estir|1as:air,orrir|3ças:edir,cir|3gas:izer|3jas:aver,ger|1jas:ver{e,ter}|3iras:equerer|1ias:crer|3as:uer|2ejas:brestar|3ques:çar{tran,rin,ro,ati}|3ces:çar{ntran,oro}|2onhas:ôr~2as:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jas:gir|5irjas:vergir|3ças:r{ce,faze,spraze,uvi}|2enhas:vir|1nhas:ter|2has:aler|3ssas:oder|5ussas:ossir|5irtas:ertir|5urtas:ortir|5intas:entir|4itas:etir|5urmas:ormir|4iras:erir|3iras:arir|5ubras:obrir|5igras:egrir|5igas:eguir|3gas:trazer|3as:nguir|4idas:redir|3ibas:aber|4íbas:oibir|5irvas:servir|3cas:erder|6ínquas:inquir|4ulas:golir|4ilas:elir|4únas:eunir|4inas:prevenir|5irzas:erzir|5ispas:espir|2es:ar,xplodir|4údes:udar{sa,i}|6coites:çoitar|4úles:baular|3ques:ar{c,coç,emoç,braç}|5usques:moscar|5ísques:aiscar|5éques:equar|2ues:gar|6ólegues:olegar|5águes:aguar|3ces:çar|4úces:iuçar|2ies:ear|3eies:iar{ns,med,cend}|4ízes:izar{e,ju,a}|4ínes:ruinar~3ir:vás|3ger:jas{e,vi,an,on,ster}|3r:as{sej,vej,ei}|4ar:stejas|3ver:hajas|3dir:eças{p,sm}|3cer:peças{em,r}|3cir:arças|2er:as{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|2ir:as{nh,curt,mit,uir,garr}|4r:onhas|5estir:vistas|5ectir:ictas|4rer:eiras|2uer:gas|3zer:digas|2r:ias|2ar:s{e{scoit,u{inq{p,g},ig{ver,z,n}}},ê}|4çar:ques{strin,stro}|4car:amusques|3ar:enseies|5iliar:ílies~2vás:ir|1jas:er{s,v,prov}|2ejas:estar|2ês:dar|2onhas:pôr|3iras:querer|1as:rir|1ias:ler{,re}|3ças:medir|3eies:odiar|4ulas:polir|3ques:çar{cal,for,ati,ro,la}|2as:arder,rer,condir|5ílies:mobiliar|2es:guar{min,e}|5ictas:flectir",
      "third": "1nha:r|2a:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5ista:estir|1a:air,orrir|3ça:edir,cir|3ga:izer|3ja:aver,ger|1ja:ver{e,ter}|3ira:equerer|1ia:crer|3a:uer|2eja:brestar|3que:çar{tran,rin,ro,ati}|3ce:çar{ntran,oro}|2onha:ôr~2a:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3ja:gir|5irja:vergir|3ça:r{ce,faze,spraze,uvi}|2enha:vir|1nha:ter|2ha:aler|3ssa:oder|5ussa:ossir|5irta:ertir|5urta:ortir|5inta:entir|4ita:etir|5urma:ormir|4ira:erir|3ira:arir|5ubra:obrir|5igra:egrir|5iga:eguir|3ga:trazer|3a:nguir|4ida:redir|3iba:aber|4íba:oibir|5irva:servir|3ca:erder|6ínqua:inquir|4ula:golir|4ila:elir|4úna:eunir|4ina:prevenir|5irza:erzir|5ispa:espir|2e:ar,xplodir|4úde:udar{sa,i}|6coite:çoitar|4úle:baular|3que:ar{c,coç,emoç,braç}|5usque:moscar|5ísque:aiscar|5éque:equar|2ue:gar|6ólegue:olegar|5águe:aguar|3ce:çar|4úce:iuçar|2ie:ear|3eie:iar{ns,med,cend}|4íze:izar{e,ju,a}|4íne:ruinar~2ir:vá|2ger:ja{e,vi,an,on,ster}|2r:seja,veja,eia|3ar:steja|2ver:haja|2dir:eça{p,sm}|2cer:peça{em,r}|2cir:arça|1er:a{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|1ir:a{nh,curt,mit,uir,garr}|3r:onha|4estir:vista|4ectir:icta|3rer:eira|1uer:ga|2zer:diga|1r:ia|1ar:e{scoit,u{inq{p,g},ig{ver,z,n}}},ê|3çar:que{strin,stro}|3car:amusque|2ar:enseie|4iliar:ílie~2vá:ir|1ja:er{s,v,prov}|2eja:estar|2ê:dar|2onha:pôr|3ira:querer|1a:rir|1ia:ler{,re}|3ça:medir|3eie:odiar|4ula:polir|3que:çar{cal,for,ati,ro,la}|2a:arder,rer,condir|5ílie:mobiliar|2e:guar{min,e}|5icta:flectir",
      "firstPlural": "1nhamos:r|2amos:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istamos:estir|1amos:air,orrir|3çamos:edir,cir|3gamos:izer|3jamos:aver,ger|1jamos:ver{e,ter}|3iramos:equerer|1iamos:crer|3amos:uer|2ejamos:brestar|3quemos:çar{tran,rin,ro,ati}|3cemos:çar{ntran,oro}|2onhamos:ôr~2amos:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|5irvamos:servir|3jamos:gir|5irjamos:vergir|3çamos:r{ce,faze,spraze,uvi}|2enhamos:vir|1nhamos:ter|2hamos:aler|3ssamos:oder|5ussamos:ossir|5irtamos:ertir|5urtamos:ortir|5intamos:entir|4itamos:etir|5urmamos:ormir|4iramos:erir|3iramos:arir|5ubramos:obrir|5igramos:egrir|5igamos:eguir|3gamos:trazer|3amos:nguir|4idamos:redir|3ibamos:aber|3camos:erder|4ulamos:golir|4ilamos:elir|4inamos:prevenir|5irzamos:erzir|5ispamos:espir|2emos:ar|6coitemos:çoitar|3quemos:ar{c,coç,emoç,braç}|2uemos:gar|3cemos:çar|1mos:xplodir~4er:amos{v,h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,x,el,az,oz,enz,mp,o}|5ger:jamos{e,vi,an,on,ster}|5r:amos{sej,vej,ei}|6ar:stejamos|5ver:hajamos|5dir:eçamos{p,sm}|5cer:peçamos{em,r}|5cir:arçamos|4ir:amos{nh,curt,mit,uir,garr}|6r:onhamos|7estir:vistamos|7ectir:ictamos|6rer:eiramos|4uer:gamos|5zer:digamos|4r:iamos|4ar:emos{scoit,u{pinq,ginq,deq,g{xa,sa,veri,zi,ni}}}|6çar:quemos{strin,stro}~2vamos:ir|1jamos:er{s,v,prov}|2ejamos:estar|2onhamos:pôr|3iramos:querer|1amos:rir|1iamos:ler{,re}|3çamos:medir|4ulamos:polir|2emos:guar{a,min,e}|3quemos:çar{cal,for,ati,ro,la}|2amos:arder,rer,condir|5ictamos:flectir",
      "secondPlural": "1nhais:r|2ais:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istais:estir|1ais:air,orrir|3çais:edir,cir|3gais:izer|3jais:aver,ger|1jais:ver{e,ter}|3irais:equerer|1iais:crer|3ais:uer|2ejais:brestar|3queis:çar{tran,rin,ro,ati}|3ceis:çar{ntran,oro}|2onhais:ôr~2ais:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jais:gir|5irjais:vergir|3çais:r{ce,faze,spraze,uvi}|2enhais:vir|1nhais:ter|2hais:aler|3ssais:oder|5ussais:ossir|5irtais:ertir|5urtais:ortir|5intais:entir|4itais:etir|5urmais:ormir|4irais:erir|3irais:arir|5ubrais:obrir|5igrais:egrir|5igais:eguir|3gais:trazer|3ais:nguir|4idais:redir|3ibais:aber|5irvais:servir|3cais:erder|4ulais:golir|4ilais:elir|4inais:prevenir|5irzais:erzir|5ispais:espir|2eis:ar|6coiteis:çoitar|3queis:ar{c,coç,emoç,braç}|2ueis:gar|3ceis:çar|1s:xplodir~5ir:vades|4ger:jais{e,vi,an,on,ster}|4r:ais{sej,vej,ei}|5ar:stejais|4ver:hajais|4dir:eçais{p,sm}|4cer:peçais{em,r}|4cir:arçais|3er:ais{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|3ir:ais{nh,curt,mit,uir,garr}|5r:onhais|6estir:vistais|6ectir:ictais|5rer:eirais|3uer:gais|4zer:digais|3r:iais|3ar:eis{scoit,u{pinq,ginq,deq,g{xa,sa,veri,zi,ni}}}|5çar:queis{strin,stro}~2vades:ir|1jais:er{s,v,prov}|2ejais:estar|2onhais:pôr|3irais:querer|1ais:rir|1iais:ler{,re}|3çais:medir|4ulais:polir|2eis:guar{a,min,e}|3queis:çar{cal,for,ati,ro,la}|2ais:arder,rer,condir|5ictais:flectir",
      "thirdPlural": "1nham:r|2am:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istam:estir|1am:air,orrir|3çam:edir,cir|3gam:izer|3jam:aver,ger|1jam:ver{e,ter}|3iram:equerer|1iam:crer|3am:uer|2ejam:brestar|3quem:çar{tran,rin,ro,ati}|3cem:çar{ntran,oro}|2onham:ôr~2am:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jam:gir|5irjam:vergir|3çam:r{ce,faze,spraze,uvi}|2enham:vir|1nham:ter|2ham:aler|3ssam:oder|5ussam:ossir|5irtam:ertir|5urtam:ortir|5intam:entir|4itam:etir|5urmam:ormir|4iram:erir|3iram:arir|5ubram:obrir|5igram:egrir|5igam:eguir|3gam:trazer|3am:nguir|4idam:redir|3ibam:aber|4íbam:oibir|5irvam:servir|3cam:erder|6ínquam:inquir|4ulam:golir|4ilam:elir|4únam:eunir|4inam:prevenir|5irzam:erzir|5ispam:espir|2em:ar,xplodir|4údem:udar{sa,i}|6coitem:çoitar|4úlem:baular|3quem:ar{c,coç,emoç,braç}|5usquem:moscar|5ísquem:aiscar|5équem:equar|2uem:gar|6óleguem:olegar|5águem:aguar|3cem:çar|4úcem:iuçar|2iem:ear|3eiem:iar{ns,med,cend}|4ízem:izar{e,ju,a}|4ínem:ruinar~3ir:vão|3ger:jam{e,vi,an,on,ster}|3r:am{sej,vej,ei}|4ar:stejam|3ver:hajam|3dir:eçam{p,sm}|3cer:peçam{em,r}|3cir:arçam|2er:am{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|2ir:am{nh,curt,mit,uir,garr}|4r:onham|5estir:vistam|5ectir:ictam|4rer:eiram|2uer:gam|3zer:digam|2r:iam|3ar:eem,enseiem|2ar:em{scoit,u{inq{p,g},ig{ver,z,n}}}|4çar:quem{strin,stro}|4car:amusquem|5iliar:íliem~2vão:ir|1jam:er{s,v,prov}|2ejam:estar|2eem:dar|2onham:pôr|3iram:querer|1am:rir|1iam:ler{,re}|3çam:medir|3eiem:odiar|4ulam:polir|3quem:çar{cal,for,ati,ro,la}|2am:arder,rer,condir|5íliem:mobiliar|2em:guar{min,e}|5ictam:flectir"
    },
    "subjImperfect": {
      "first": "1sse:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fosse:ser|2isse:ver{e,ter}|2ivesse:brestar|3casse:çar{tran,rin,ro}|2usesse:ôr~1sse:r,uvir,servir|4izesse:azer|1esse:vir|2ivesse:ter|4ouvesse:aver,mprazer|4udesse:oder|2usesse:or|3ssesse:izer|4ouxesse:trazer|4oubesse:aber|6coitasse:çoitar|3casse:çar{ati,co,emo,bra}|2ísse:air,uir~5ir:fosse|6ar:estivesse|6erer:isesse|3r:asse{scoit,ratic}|5çar:casse{strin,stro}|4er:visse~2fosse:ir|2isse:ver|2ivesse:estar|2esse:dar|2usesse:pôr|4isesse:querer|2ísse:arguir|3casse:çar{cal,for,ro,la}",
      "second": "1sses:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fosses:ser|2isses:ver{e,ter}|2ivesses:brestar|3casses:çar{tran,rin,ro}|2usesses:ôr~1sses:r,uvir,servir|4izesses:azer|1esses:vir|2ivesses:ter|4ouvesses:aver,mprazer|4udesses:oder|2usesses:or|3ssesses:izer|4ouxesses:trazer|4oubesses:aber|6coitasses:çoitar|3casses:çar{ati,co,emo,bra}|2ísses:air,uir~6ir:fosses|7ar:estivesses|7erer:isesses|4r:asses{scoit,ratic}|6çar:casses{strin,stro}|5er:visses~2fosses:ir|2isses:ver|2ivesses:estar|2esses:dar|2usesses:pôr|4isesses:querer|2ísses:arguir|3casses:çar{cal,for,ro,la}",
      "third": "1sse:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fosse:ser|2isse:ver{e,ter}|2ivesse:brestar|3casse:çar{tran,rin,ro}|2usesse:ôr~1sse:r,uvir,servir|4izesse:azer|1esse:vir|2ivesse:ter|4ouvesse:aver,mprazer|4udesse:oder|2usesse:or|3ssesse:izer|4ouxesse:trazer|4oubesse:aber|6coitasse:çoitar|3casse:çar{ati,co,emo,bra}|2ísse:air,uir~5ir:fosse|6ar:estivesse|6erer:isesse|3r:asse{scoit,ratic}|5çar:casse{strin,stro}|4er:visse~2fosse:ir|2isse:ver|2ivesse:estar|2esse:dar|2usesse:pôr|4isesse:querer|2ísse:arguir|3casse:çar{cal,for,ro,la}",
      "firstPlural": "3fôssemos:ser|2êssemos:er{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}}|2íssemos:ver{e,ter}|2ivéssemos:brestar|3cássemos:çar{tran,rin,ro}|2ássemos:çar{ntran,oro}|2uséssemos:ôr~4izéssemos:azer|1éssemos:vir|2ivéssemos:ter|4ouvéssemos:aver,mprazer|4udéssemos:oder|2uséssemos:or|3sséssemos:izer|4ouxéssemos:trazer|4oubéssemos:aber|2ássemos:ar|6coitássemos:çoitar|3cássemos:çar{ati,co,emo,bra}|2íssemos:ir{,uv,serv}|2êssemos:er~8ir:fôssemos|7ar:ssemos{é,scoitá,raticá}|9ar:estivéssemos|9erer:iséssemos|8çar:cássemos{strin,stro}|7er:víssemos~2fôssemos:ir|2íssemos:ver|2ivéssemos:estar|2éssemos:dar|2uséssemos:pôr|4iséssemos:querer|3cássemos:çar{cal,for,ro,la}",
      "secondPlural": "3fôsseis:ser|2êsseis:er{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}}|2ísseis:ver{e,ter}|2ivésseis:brestar|3cásseis:çar{tran,rin,ro}|2ásseis:çar{ntran,oro}|2usésseis:ôr~4izésseis:azer|1ésseis:vir|2ivésseis:ter|4ouvésseis:aver,mprazer|4udésseis:oder|2usésseis:or|3ssésseis:izer|4ouxésseis:trazer|4oubésseis:aber|2ásseis:ar|6coitásseis:çoitar|3cásseis:çar{ati,co,emo,bra}|2ísseis:ir{,uv,serv}|2êsseis:er~7ir:fôsseis|6ar:sseis{é,scoitá,raticá}|8ar:estivésseis|8erer:isésseis|7çar:cásseis{strin,stro}|6er:vísseis~2fôsseis:ir|2ísseis:ver|2ivésseis:estar|2ésseis:dar|2usésseis:pôr|4isésseis:querer|3cásseis:çar{cal,for,ro,la}",
      "thirdPlural": "1ssem:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fossem:ser|2issem:ver{e,ter}|2ivessem:brestar|3cassem:çar{tran,rin,ro}|2usessem:ôr~1ssem:r,uvir,servir|4izessem:azer|1essem:vir|2ivessem:ter|4ouvessem:aver,mprazer|4udessem:oder|2usessem:or|3ssessem:izer|4ouxessem:trazer|4oubessem:aber|6coitassem:çoitar|3cassem:çar{ati,co,emo,bra}|2íssem:air,uir~6ir:fossem|7ar:estivessem|7erer:isessem|4r:assem{scoit,ratic}|6çar:cassem{strin,stro}|5er:vissem~2fossem:ir|2issem:ver|2ivessem:estar|2essem:dar|2usessem:pôr|4isessem:querer|2íssem:arguir|3cassem:çar{cal,for,ro,la}"
    },
    "subjFuture": {
      "first": "3for:ser|0:r{e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|2ir:ver{e,ter}|2iver:brestar|3car:çar{tran,rin,ro}|2user:ôr~0:,vir{u,ser}|4izer:azer|1er:vir|2iver:ter|4ouver:aver,mprazer|4uder:oder|2user:or|3sser:izer|4ouxer:trazer|4ouber:aber|6coitar:çoitar|3car:çar{ati,co,emo,bra}~3ir:for|4ar:estiver|4erer:iser|0:scoitar,raticar|3çar:car{strin,stro}|2er:vir~2for:ir|2ir:ver|2iver:estar|2er:dar|2user:pôr|4iser:querer|3car:çar{cal,for,ro,la}",
      "second": "0es:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fores:ser|2ires:ver{e,ter}|2iveres:brestar|3cares:çar{tran,rin,ro}|2useres:ôr~0es:,vir{u,ser}|4izeres:azer|1eres:vir|2iveres:ter|4ouveres:aver,mprazer|4uderes:oder|2useres:or|3sseres:izer|4ouxeres:trazer|4ouberes:aber|6coitares:çoitar|3cares:çar{ati,co,emo,bra}|2íres:air,uir~5ir:fores|6ar:estiveres|6erer:iseres|2:ares{scoit,ratic}|5çar:cares{strin,stro}|4er:vires~2fores:ir|2ires:ver|2iveres:estar|2eres:dar|2useres:pôr|4iseres:querer|2íres:arguir|3cares:çar{cal,for,ro,la}",
      "third": "3for:ser|0:r{e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|2ir:ver{e,ter}|2iver:brestar|3car:çar{tran,rin,ro}|2user:ôr~0:,vir{u,ser}|4izer:azer|1er:vir|2iver:ter|4ouver:aver,mprazer|4uder:oder|2user:or|3sser:izer|4ouxer:trazer|4ouber:aber|6coitar:çoitar|3car:çar{ati,co,emo,bra}~3ir:for|4ar:estiver|4erer:iser|0:scoitar,raticar|3çar:car{strin,stro}|2er:vir~2for:ir|2ir:ver|2iver:estar|2er:dar|2user:pôr|4iser:querer|3car:çar{cal,for,ro,la}",
      "firstPlural": "3formos:ser|0mos:r{e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|2irmos:ver{e,ter}|2ivermos:brestar|3carmos:çar{tran,rin,ro}|2usermos:ôr~0mos:,vir{u,ser}|4izermos:azer|1ermos:vir|2ivermos:ter|4ouvermos:aver,mprazer|4udermos:oder|2usermos:or|3ssermos:izer|4ouxermos:trazer|4oubermos:aber|6coitarmos:çoitar|3carmos:çar{ati,co,emo,bra}~6ir:formos|7ar:estivermos|7erer:isermos|3:armos{scoit,ratic}|6çar:carmos{strin,stro}|5er:virmos~2formos:ir|2irmos:ver|2ivermos:estar|2ermos:dar|2usermos:pôr|4isermos:querer|3carmos:çar{cal,for,ro,la}",
      "secondPlural": "3fordes:ser|0des:r{e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|2irdes:ver{e,ter}|2iverdes:brestar|3cardes:çar{tran,rin,ro}|2userdes:ôr~0des:,vir{u,ser}|4izerdes:azer|1erdes:vir|2iverdes:ter|4ouverdes:aver,mprazer|4uderdes:oder|2userdes:or|3sserdes:izer|4ouxerdes:trazer|4ouberdes:aber|6coitardes:çoitar|3cardes:çar{ati,co,emo,bra}~6ir:fordes|7ar:estiverdes|7erer:iserdes|3:ardes{scoit,ratic}|6çar:cardes{strin,stro}|5er:virdes~2fordes:ir|2irdes:ver|2iverdes:estar|2erdes:dar|2userdes:pôr|4iserdes:querer|3cardes:çar{cal,for,ro,la}",
      "thirdPlural": "0em:r{gui,qui,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3forem:ser|2irem:ver{e,ter}|2iverem:brestar|3carem:çar{tran,rin,ro}|2userem:ôr~0em:,vir{u,ser}|4izerem:azer|1erem:vir|2iverem:ter|4ouverem:aver,mprazer|4uderem:oder|2userem:or|3sserem:izer|4ouxerem:trazer|4ouberem:aber|6coitarem:çoitar|3carem:çar{ati,co,emo,bra}|2írem:air,uir~5ir:forem|6ar:estiverem|6erer:iserem|2:arem{scoit,ratic}|5çar:carem{strin,stro}|4er:virem~2forem:ir|2irem:ver|2iverem:estar|2erem:dar|2userem:pôr|4iserem:querer|2írem:arguir|3carem:çar{cal,for,ro,la}"
    },
    "gerunds": {
      "gerunds": "2ondo:ôr~1ndo:r|3cando:çar{co,bra}~~2ondo:pôr"
    },
    "pastParticiple": {
      "pastParticiple": "2isto:rever|2osto:ôr~1do:r{,uvi,servi,gui}|2ido:er|3cado:çar{co,bra}|1ndo:vir|2ído:air,uir,oer|3to:izer|4eito:fazer|4ito:crever|1sto:or|3erto:brir~2r:ido{ss,t{r,en,ran,is,es,la,pe,le,i,u},d,rm,um,r,sorr,uz,fal,ol,ub,ib,g,n,p}|3er:ido{nvert,d{po,en,on,ce,fe,r},r{ue,r,c,f},vig,eg,rgu}|4er:isto~1do:ir|2isto:ver|2osto:pôr"
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress(model$1[k][form]);
    });
  });

  const forms$2 = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural'];

  const {
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

  const {
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

  const conditionalRev = revAll(conditional);
  const futureTenseRev = revAll(futureTense);
  const imperativeNegRev = revAll(imperativeNeg);
  const imperativeRev = revAll(imperative);
  const imperfectRev = revAll(imperfect);
  const pastTenseRev = revAll(pastTense);
  const pluperfectRev = revAll(pluperfect);
  const presentTenseRev = revAll(presentTense);
  const infinitivoRev = revAll(infinitivo);
  const subjPresentRev = revAll(subjPresent);
  const subjImperfectRev = revAll(subjImperfect);
  const subjFutureRev = revAll(subjFuture);
  const gerundsRev = reverse(gerunds.gerunds);
  const pastParticipleRev = reverse(pastParticiple.pastParticiple);

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
    const keys = Object.keys(m);
    for (let i = 0; i < keys.length; i += 1) {
      const out = convert(str, m[keys[i]]);
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

  const { f, mp, fp } = model$1.adjectives;

  const fRev = reverse(f);
  const mpRev = reverse(mp);
  const fpRev = reverse(fp);

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

  const { plurals } = model$1.nouns;

  const rev = reverse(plurals);

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

  const lex = {
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
  const poss = [
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
  const femNouns = [
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
    const pl = str === 'atriz' ? 'atrizes' : str + 's';
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
  const lexicon$1 = {};

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
    const counts = {};
    Object.values(obj).forEach(w => {
      counts[w] = (counts[w] || 0) + 1;
    });
    Object.keys(obj).forEach(k => {
      const w = obj[k];
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
    const wordsObj = unpack(lexData[tag]);
    Object.keys(wordsObj).forEach(w => {
      lexicon$1[w] = tag;

      // add conjugations for our verbs
      if (tag === 'Infinitive') {
        conjugations.forEach(a => {
          const obj = a[0](w);
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
        const s = methods.adjective.toPlural(w);
        lexicon$1[s] = lexicon$1[s] || ['Adjective', 'MaleAdjective', 'PluralAdjective'];
        const f = methods.adjective.toFemale(w);
        lexicon$1[f] = lexicon$1[f] || ['Adjective', 'FemaleAdjective', 'SingularAdjective'];
        const fs = methods.adjective.toFemalePlural(w);
        lexicon$1[fs] = lexicon$1[fs] || ['Adjective', 'FemaleAdjective', 'PluralAdjective'];
      }
      if (tag === 'Noun') {
        lexicon$1[w] = lexicon$1[w] || ['Noun'];
        const pl = methods.noun.toPlural(w);
        lexicon$1[pl] = lexicon$1[pl] || 'Plural';
        // professor → professora, but not abstract -or nouns like 'amor'
        if (/or$/.test(w) && notAgentive[w] !== true) {
          const fem = methods.noun.toFeminine(w);
          if (fem !== w) {
            if (!lexicon$1[fem] || lexicon$1[fem] === 'Noun') {
              lexicon$1[fem] = ['Noun', 'FemaleNoun', 'Singular'];
            }
            const femPl = fem + 's';
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
    const want = [
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
    const tags = term.tags;
    const str = term.implicit || term.normal || term.text;
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
      const form = verbForm(term);
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
        const str = toRoot(term, view.world.methods);
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

  const compact = {
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
  const unicode = {};
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    const { regexText, regexNormal, regexNumbers } = world.model.two;
    const normal = term.machine || term.normal;
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('NumericValue') && term.tags.has('Cardinal') && term.normal.length === 4) {
      const num = Number(term.normal);
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
    const str = term.text;
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
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
    const setTag = world.methods.one.setTag;
    const term = terms[i];
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
    const setTag = world.methods.one.setTag;
    const t = terms[i];
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
      const end = terms[i + 2].normal;
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
      const nxt = terms[i + 1];
      const txt = (nxt.text || '').toLowerCase();
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
      const suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        const tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  // decide tag from the ending of the word
  const suffixCheck = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const suffixes = world.model.two.suffixPatterns;
    const term = terms[i];
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
    const world = view.world;
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
      aliases: [null, 'Substantivo'],
      not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
    },
    Singular: {
      is: 'Noun',
      not: ['Plural'],
    },
    ProperNoun: {
      aliases: [null, 'NomePróprio'],
      is: 'Noun',
    },
    Person: {
      aliases: [null, 'Pessoa'],
      is: 'Singular',
      also: ['ProperNoun'],
      not: ['Place', 'Organization', 'Date'],
    },
    FirstName: {
      aliases: [null, 'PrimeiroNome'],
      is: 'Person',
    },
    MaleName: {
      aliases: [null, 'NomeMasculino'],
      is: 'FirstName',
      not: ['FemaleName', 'LastName'],
    },
    FemaleName: {
      aliases: [null, 'NomeFeminino'],
      is: 'FirstName',
      not: ['MaleName', 'LastName'],
    },
    LastName: {
      aliases: [null, 'Sobrenome'],
      is: 'Person',
      not: ['FirstName'],
    },
    Honorific: {
      aliases: [null, 'Título'],
      is: 'Noun',
      not: ['FirstName', 'LastName', 'Value'],
    },
    Place: {
      aliases: [null, 'Lugar'],
      is: 'Singular',
      not: ['Person', 'Organization'],
    },
    Country: {
      aliases: [null, 'País'],
      is: 'Place',
      also: ['ProperNoun'],
      not: ['City'],
    },
    City: {
      aliases: [null, 'Cidade'],
      is: 'Place',
      also: ['ProperNoun'],
      not: ['Country'],
    },
    Region: {
      aliases: [null, 'Região'],
      is: 'Place',
      also: ['ProperNoun'],
    },
    Address: {
      aliases: [null, 'Endereço'],
      // is: 'Place',
    },
    Organization: {
      aliases: [null, 'Organização'],
      is: 'ProperNoun',
      not: ['Person', 'Place'],
    },
    SportsTeam: {
      aliases: [null, 'Equipe'],
      is: 'Organization',
    },
    School: {
      aliases: [null, 'Escola'],
      is: 'Organization',
    },
    Company: {
      aliases: [null, 'Empresa'],
      is: 'Organization',
    },
    Plural: {
      is: 'Noun',
      not: ['Singular'],
    },
    Uncountable: {
      aliases: [null, 'Incontável'],
      is: 'Noun',
    },
    Pronoun: {
      aliases: [null, 'Pronome'],
      is: 'Noun',
      not: entity,
    },
    Actor: {
      is: 'Noun',
      not: entity,
    },
    Activity: {
      aliases: [null, 'Atividade'],
      is: 'Noun',
      not: ['Person', 'Place'],
    },
    Unit: {
      aliases: [null, 'Unidade'],
      is: 'Noun',
      not: entity,
    },
    Demonym: {
      aliases: [null, 'Gentílico'],
      is: 'Noun',
      also: ['ProperNoun'],
      not: entity,
    },
    Possessive: {
      aliases: [null, 'Possessivo'],
      is: 'Noun',
    },

    FemaleNoun: {
      aliases: [null, 'SubstantivoFeminino'],
      is: 'Noun',
      not: ['MaleNoun']
    },
    MaleNoun: {
      aliases: [null, 'SubstantivoMasculino'],
      is: 'Noun',
      not: ['FemaleNoun']
    },

  };

  var verbs$1 = {
    Verb: {
      aliases: [null, 'Verbo'],
      not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
    },
    PresentTense: {
      aliases: [null, 'Presente'],
      is: 'Verb',
      not: ['PastTense'],
    },
    Infinitive: {
      aliases: [null, 'Infinitivo'],
      is: 'PresentTense',
      not: ['Gerund'],
    },
    Gerund: {
      aliases: [null, 'Gerúndio'],
      is: 'PresentTense',
      not: ['Copula', 'FutureTense'],
    },
    PastTense: {
      aliases: [null, 'Passado'],
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'FutureTense'],
    },
    FutureTense: {
      aliases: [null, 'Futuro'],
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'PastTense'],
    },
    Copula: {
      aliases: [null, 'Cópula'],
      is: 'Verb',
    },
    // 'não', 'nunca' - not a verb itself
    Negative: {
      aliases: [null, 'Negação'],
      not: ['Value'],
    },
    // modals stay fully-conjugated in portuguese - 'pudesse', 'deveria'
    // so don't strip their tense tags
    Modal: {
      is: 'Auxiliary',
    },
    PerfectTense: {
      aliases: [null, 'PretéritoPerfeito'],
      is: 'Verb',
      not: ['Gerund'],
    },
    Pluperfect: {
      aliases: [null, 'MaisQuePerfeito'],
      is: 'Verb',
    },
    PastParticiple: {
      aliases: [null, 'Particípio'],
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
      aliases: [null, 'Auxiliar'],
      is: 'Verb',
      not: ['Conjunction'],
    },
    Conditional: {
      aliases: [null, 'Condicional'],
      is: 'Verb',
      not: ['Infinitive', 'Imperative'],
    },
    // clitic pronouns - 'me', 'se', 'te', 'nos'
    Reflexive: {
      aliases: [null, 'Reflexivo'],
      is: 'Pronoun',
    },
    // sometimes 'pretérito'
    Perfecto: {
      is: 'Verb',
    },
    // moods
    Imperative: {
      aliases: [null, 'Imperativo'],
      is: 'Verb',
      not: ['Subjunctive']
    },
    Subjunctive: {
      aliases: [null, 'Subjuntivo'],
      is: 'Verb',
      not: ['Imperative']
    },
    Imperfect: {
      aliases: [null, 'Imperfeito'],
      is: 'PastTense',
      not: ['Imperative']
    },


    // 
    FirstPerson: {
      aliases: [null, 'PrimeiraPessoa'],
      is: 'Verb',
      not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPerson: {
      aliases: [null, 'SegundaPessoa'],
      is: 'Verb',
      not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPerson: {
      aliases: [null, 'TerceiraPessoa'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    FirstPersonPlural: {
      aliases: [null, 'PrimeiraPessoaPlural'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPersonPlural: {
      aliases: [null, 'SegundaPessoaPlural'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPersonPlural: {
      aliases: [null, 'TerceiraPessoaPlural'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
    },
  };

  var values = {
    Value: {
      aliases: [null, 'Número'],
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
      aliases: [null, 'Fração'],
      is: 'Value',
      not: ['Noun'],
    },
    Multiple: {
      aliases: [null, 'Múltiplo'],
      is: 'Value',
    },
    RomanNumeral: {
      aliases: [null, 'NúmeroRomano'],
      is: 'Cardinal',
      not: ['TextValue'],
    },
    TextValue: {
      aliases: [null, 'Numeral'],
      is: 'Value',
      not: ['NumericValue'],
    },
    NumericValue: {
      aliases: [null, 'Numérico'],
      is: 'Value',
      not: ['TextValue'],
    },
    Money: {
      aliases: [null, 'Dinheiro'],
      is: 'Cardinal',
    },
    Percent: {
      aliases: [null, 'Porcentagem'],
      is: 'Value',
    },
  };

  var dates = {
    Date: {
      aliases: [null, 'Data'],
      not: ['Verb', 'Adverb', 'Adjective'],
    },
    Month: {
      aliases: [null, 'Mês'],
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      aliases: [null, 'DiaDaSemana'],
      is: 'Noun',
      also: ['Date'],
    },
    Year: {
      aliases: [null, 'Ano'],
      is: 'Date',
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      aliases: [null, 'Trimestre'],
      is: 'Date',
      not: 'Fraction',
    },
    // 'easter'
    Holiday: {
      aliases: [null, 'Feriado'],
      is: 'Date',
      also: ['Noun'],
    },
    // 'summer'
    Season: {
      aliases: [null, 'Estação'],
      is: 'Date',
    },
    Timezone: {
      aliases: [null, 'FusoHorário'],
      is: 'Noun',
      also: ['Date'],
      not: ['ProperNoun'],
    },
    Time: {
      aliases: [null, 'Hora'],
      is: 'Date',
      not: ['AtMention'],
    },
    // 'months'
    Duration: {
      aliases: [null, 'Duração'],
      is: 'Noun',
      also: ['Date'],
    },
  };

  const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'];

  var misc = {
    Adjective: {
      aliases: [null, 'Adjetivo'],
      not: ['Noun', 'Verb', 'Adverb', 'Value']
    },
    FemaleAdjective: {
      aliases: [null, 'AdjetivoFeminino'],
      is: 'Adjective',
      not: ['MaleAdjective']
    },
    MaleAdjective: {
      aliases: [null, 'AdjetivoMasculino'],
      is: 'Adjective',
      not: ['FemaleAdjective']
    },
    PluralAdjective: {
      aliases: [null, 'AdjetivoPlural'],
      is: 'Adjective',
      not: ['SingularAdjective']
    },
    SingularAdjective: {
      aliases: [null, 'AdjetivoSingular'],
      is: 'Adjective',
      not: ['PluralAdjective']
    },
    Comparable: {
      aliases: [null, 'Comparável'],
      is: 'Adjective'
    },
    Comparative: {
      aliases: [null, 'Comparativo'],
      is: 'Adjective'
    },
    Superlative: {
      aliases: [null, 'Superlativo'],
      is: 'Adjective',
      not: ['Comparative']
    },
    NumberRange: {
      aliases: [null, 'IntervaloNumérico'],
    },
    Adverb: {
      aliases: [null, 'Advérbio'],
      not: ['Noun', 'Verb', 'Adjective', 'Value']
    },

    Determiner: {
      aliases: [null, 'Determinante', 'Artigo'],
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction', 'Preposition'] //allow 'a' to be a Determiner/Value
    },
    Conjunction: {
      aliases: [null, 'Conjunção'],
      not: anything
    },
    Preposition: {
      aliases: [null, 'Preposição'],
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord']
    },
    QuestionWord: {
      aliases: [null, 'Interrogativo'],
      not: ['Determiner']
    },
    Currency: {
      aliases: [null, 'Moeda'],
      is: 'Noun'
    },
    Expression: {
      aliases: [null, 'Interjeição'],
      not: ['Noun', 'Adjective', 'Verb', 'Adverb', 'Conjunction']
    },
    Abbreviation: {
      aliases: [null, 'Abreviatura'],
    },
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email']
    },
    PhoneNumber: {
      aliases: [null, 'Telefone'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email']
    },
    HashTag: {},
    AtMention: {
      aliases: [null, 'Menção'],
      is: 'Noun',
      not: ['HashTag', 'Email']
    },
    Emoji: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention']
    },
    Emoticon: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention']
    },
    Email: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention']
    },
    Acronym: {
      aliases: [null, 'Acrônimo'],
      not: ['Plural', 'RomanNumeral']
    },
    Condition: {
      aliases: [null, 'Condição'],
      not: ['Verb', 'Adjective', 'Noun', 'Value']
    }
  };

  const tags = Object.assign({}, nouns$1, verbs$1, values, dates, misc);

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

  const toNumber = {};
  const toCardinal = {};
  const multiples$1 = {
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
    const [n, card, ord] = a;
    toNumber[card] = n; //cardinal
    if (/os$/.test(card)) {
      const f = card.replace(/os$/, 'as');
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

    const tokens = terms.map(o => o.normal || o.text).filter(str => str);
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
        const mult = multiples$1[w] || 1;
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
        const str = normalize(w);
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
    const arr = str.split(/([0-9.,]*)/);
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
    const terms = m.docs[0];
    let num = null;
    let prefix = '';
    let suffix = '';
    let hasComma = false;
    const isText = m.has('#TextValue');
    if (isText) {
      num = fromText(terms);
    } else {
      const res = fromNumber(m);
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

  const ones = data.ones.reverse();
  const tens = data.tens.reverse();
  const hundreds = data.hundreds.reverse();

  const multiples = [
    [1000000000, 'bilhão', 'bilhões'],
    [1000000, 'milhão', 'milhões'],
    [1000, 'mil', 'mil'],
    // [100, 'cento'],
    [1, 'um', 'um'],
  ];

  //turn number into an array of magnitudes, like [[5, million], [2, hundred]]
  const getMagnitudes = function (num) {
    let working = num;
    const have = [];
    multiples.forEach(a => {
      if (num >= a[0]) {
        const howmany = Math.floor(working / a[0]);
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
    const index = words.findIndex((w, i) => w === 'mil' && words[i + 1] === 'e');
    if (index !== -1) {
      // we have another 'e' after..
      const hasAfter = words.slice(index + 2).find(w => w === 'e');
      if (hasAfter) {
        // remove the 'e'
        words.splice(index + 1, 1);
      }
    }
    return words
  };

  const threeDigit = function (num) {
    const words = [];
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
    const found = getMagnitudes(num);
    found.forEach((obj, i) => {
      const res = threeDigit(obj.num);
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

  const toOrdinal = {};

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
      const words = toText(parsed.num);
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
        const doc = getNth$3(this, n);
        return doc.map(p => {
          const json = p.toView().json(n)[0];
          const parsed = parseNumber(p);
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
        const m = this.if('#TextValue');
        const res = m.map(val => {
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          const str = formatNumber(obj, fmt);
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
        const m = this;
        const res = m.map(val => {
          if (val.has('#TextValue')) {
            return val
          }
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          const str = formatNumber(obj, fmt);
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
        const m = this;
        const res = m.map(val => {
          if (!val.has('#Ordinal')) {
            return val
          }
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          const str = formatNumber(obj, fmt);
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
        const m = this;
        const res = m.map(val => {
          if (val.has('#Ordinal')) {
            return val
          }
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          const str = formatNumber(obj, fmt);
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
          const num = parseNumber(val).num;
          return num === n
        })
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num > n
        })
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num < n
        })
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
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
        const m = this;
        const res = m.map((val) => {
          const obj = parseNumber(val);
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
        const m = this;
        const res = m.map((val) => {
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          obj.num += n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          const str = formatNumber(obj, fmt);
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
        const m = new Numbers(this.document, pointer);
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
    const str = m.text('normal');
    const isPlural = m.has('#Plural');
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
          const str = getRoot$2(m, methods);
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
          const str = getRoot$2(m, methods);
          const fem = methods.toFeminine(str);
          if (fem && fem !== str) {
            // agree the determiner - 'o professor' → 'a professora'
            const det = m.lookBehind('(o|os|um|uns)$').last();
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
          const str = getRoot$2(m, methods);
          const plural = methods.toPlural(str);
          return m.replaceWith(plural)
        });
        return this
      }
      toSingular(n) {
        const methods = this.methods.two.transform.noun;
        getNth$2(this, n).if('#Plural').forEach(m => {
          const str = getRoot$2(m, methods);
          const plural = methods.toSingular(str);
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
    const str = m.text('normal');
    const isPlural = m.has('#PluralAdjective');
    const isFemale = m.has('#FemaleAdjective');
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
          const str = getRoot$1(m, methods);
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
    const str = m.text('root');
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
    const subj = m.lookBehind('(eu|tu|ele|ela|você|nós|vós|vocês|eles|elas)$');
    if (subj.found) {
      return personMap[subj.last().text('normal')] || 'third'
    }
    return 'third'
  };

  // re-conjugate each verb-phrase, in-place
  const convertTo = function (view, method) {
    const methods = view.methods.two.transform.verb;
    view.forEach(m => {
      const str = getRoot(m);
      if (!str) {
        return
      }
      const person = getPerson(m);
      const obj = methods[method](str);
      const form = obj[person] || obj.third;
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
          const str = getRoot(m);
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
          const str = getRoot(m);
          if (!str) {
            return
          }
          const gerund = methods.toGerund(str);
          if (gerund) {
            m.replaceWith(gerund);
          }
        });
        return this
      }
      toInfinitive(n) {
        getNth(this, n).forEach(m => {
          const str = getRoot(m);
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

  var version = '0.0.6';

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
    const env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  es.version = version;

  return es;

}));
