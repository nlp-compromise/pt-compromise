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

  // call the callback with a one-match view
  const wrap$2 = (view, cb) => (ptr, i) => cb(view.update([ptr]), i);

  const forEach = function (cb) {
    this.fullPointer.forEach(wrap$2(this, cb));
    return this
  };

  const map = function (cb, empty) {
    const run = wrap$2(this, cb);
    const res = this.fullPointer.map((ptr, i) => {
      const out = run(ptr, i);
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
    return this.update(this.fullPointer.filter(wrap$2(this, cb)))
  };

  const find$6 = function (cb) {
    const found = this.fullPointer.find(wrap$2(this, cb));
    if (found === undefined) {
      return this.update([])
    }
    return this.update([found])
  };

  const some$1 = function (cb) {
    return this.fullPointer.some(wrap$2(this, cb))
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
  var loops = { forEach, map, filter, find: find$6, some: some$1, random };

  // small helpers shared by the View class and its methods

  // the pointer, or one per sentence for a full document
  const rawPointer = view => view.pointer || view.docs.map((_d, n) => [n]);

  // tag new terms, if the tagger is loaded
  const retag = function (view, computes) {
    view.compute([...computes, 'freeze', 'lexicon']);
    if (view.world.compute.preTagger) {
      view.compute('preTagger');
    }
    view.compute('unfreeze');
    return view
  };

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
      const ptr = rawPointer(this);
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
      return this.update(rawPointer(this).slice(min, max))
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
      if (aPtr.length !== bPtr.length) {
        return false
      }
      // ensure [n, start, end] are all the same
      return aPtr.every((ptr, i) => bPtr[i] && ptr[0] === bPtr[i][0] && ptr[1] === bPtr[i][1] && ptr[2] === bPtr[i][2])
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
      return retag(doc, ['normal'])
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
  // subclasses set their own name on their prototype
  View.prototype.viewType = 'View';

  var version$1 = '14.20.0';

  const isObject$1 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  const isUnsafeKey = key => key === '__proto__' || key === 'constructor' || key === 'prototype';

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$1(plugin)) {
      for (const key in plugin) {
        // prevent prototype pollution
        if (isUnsafeKey(key)) {
          continue
        }
        if (isObject$1(plugin[key])) {
          if (!model[key]) {
            model[key] = {};
          }
          mergeDeep(model[key], plugin[key]); //recursion
        } else if (Array.isArray(plugin[key]) && Array.isArray(model[key])) {
          // a list, like model.one.contractions, is added to - not replaced
          model[key] = model[key].concat(plugin[key]);
        } else {
          model[key] = plugin[key];
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

  // verb forms, then adjective forms
  const irregularForms = [
    ['pastTense', 'Past'],
    ['presentTense', 'Present'],
    ['gerund', 'Gerund'],
    ['comparative', 'Comparative'],
    ['superlative', 'Superlative'],
  ];

  const addIrregulars = function (model, conj) {
    const m = model.two.models || {};
    Object.keys(conj).forEach(k => {
      irregularForms.forEach(([prop, name]) => {
        const form = conj[k][prop];
        if (!form) {
          return
        }
        if (m['to' + name]) {
          m['to' + name].ex[k] = form;
        }
        if (m['from' + name]) {
          m['from' + name].ex[form] = k;
        }
      });
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
    // Notify plugins when replacement creates new terms.
    if (plugin.onReplace) {
      methods.one.onReplace = (methods.one.onReplace || []).concat(plugin.onReplace);
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

  // Shared CLI colors and styles. Plain text when NO_COLOR is set, as the convention asks
  const off = typeof process !== 'undefined' && Object.hasOwn(process.env || {}, 'NO_COLOR');
  const color = code => s => (off ? s : '\x1b[' + code + 'm' + s + '\x1b[0m');

  const green = color(32);
  const red = color(31);
  const blue = color(34);
  const cyan = color(36);
  const yellow = color(33);
  // used by name, from the tagset colors
  const magenta = color(35);
  const dim = color(2);
  const i$1 = color(3);
  const b = color(1);
  const ul = color(4);
  const grey = color(90);

  var cli = /*#__PURE__*/Object.freeze({
    __proto__: null,
    b: b,
    blue: blue,
    cyan: cyan,
    dim: dim,
    green: green,
    grey: grey,
    i: i$1,
    magenta: magenta,
    red: red,
    ul: ul,
    yellow: yellow
  });

  const env = globalThis.process?.env ?? globalThis.env ?? {};
  const debug$2 = { tags: Boolean(env.DEBUG_TAGS) };

  // Capture only the requested terms, and only while tracing.
  const before = term => {
    if (debug$2.tags && (!debug$2.word || debug$2.word === (term.normal || term.text || term.implicit || '').toLowerCase())) {
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
    const prefix = debug$2.prefix || '   ';
    if (debug$2.rule !== reason) {
      const headingPrefix = debug$2.prefix ? prefix.replace('│  ', '│ ') : '  ';
      console.log(`${headingPrefix}${dim((reason || 'tag change') + ':')}`); // eslint-disable-line no-console
      debug$2.rule = reason;
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

  debug$2.before = before;
  debug$2.log = log;

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
      debug$2.rule = undefined;
      const status = result.ptrs.length ? green('✓') : red('✗');
      const spans = matches.map(terms => {
        const text = terms.map(term => term.text || term.implicit).join(' ');
        return `${green("'" + text + "'")} ${dim(terms[0]?.index?.join(':') || '?')}`
      }).join(', ');
      const rule = pattern.length > 80 ? pattern.slice(0, 79) + '…' : pattern;
      const words = spans ? spans + '  ' : ' ---         ';
      console.log(`${debug$2.prefix || '   '}${status} ${words}${dim(i$1(rule))}`); // eslint-disable-line no-console
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
        const plain = terms.map(t => t.pre + t.text + t.post).join('').trim();
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
      const prefix = debug$2.prefix;
      const rule = debug$2.rule;
      debug$2.rule = undefined;
      if (nested) {
        console.log(`  ${blue(b(ul(hook + ':')))}`); // eslint-disable-line no-console
        debug$2.prefix = dim('   │  ');
      }
      // Restore the log prefix even when a plugin hook throws.
      try {
        doc.compute(hook);
        snapshot(hook, nested);
      } finally {
        debug$2.prefix = prefix;
        debug$2.rule = rule;
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
    debug$2.hooks = set === 'hooks' || set === true ? hooksDebug(set === true) : undefined;
    debug$2.word = options.word?.toLowerCase();
    debug$2.contractions = set === 'contractions' || set === true;
    debug$2.rule = undefined;
    debug$2.tags = set === 'tagger' || set === true;
    debug$2.spec = set === 'spec' || set === true;
    return this
  };

  // a plain object - not an array, null, or class instance
  const isObject = val => Object.prototype.toString.call(val) === '[object Object]';

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
    if (isObject(input) && input.isView) {
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
  // the steps to run before (or without) the tagger
  const preTag = ['alias', 'normal', 'machine', 'contractions'];

  const nlp = function nlp(input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    const doc = inputs(input, View, world);
    if (input) {
      if (debug$2.hooks) {
        debug$2.hooks(doc, world.hooks);
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
    if (debug$2.hooks) {
      debug$2.hooks(doc, compute.contractions ? preTag : []);
    } else if (compute.contractions) {
      doc.compute(preTag); //run it if we've got it
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

  var cache$3 = {
    api: addAPI$3,
    compute: compute$6,
    methods: methods$l,
  };

  // visit every term of a nested document: fn(term, terms, t, n)
  const eachTerm = (docs, fn) => {
    for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      for (let t = 0; t < terms.length; t += 1) {
        fn(terms[t], terms, t, n);
      }
    }
  };

  // uppercase the first letter - todo: support unicode?
  const titleCase$1 = str => str.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase());

  // change the text of every term
  const mapText = function (view, fn) {
    view.termList().forEach(t => {
      t.text = fn(t.text);
    });
    return view
  };

  var caseFns = {
    /** */
    toLowerCase: function () {
      return mapText(this, str => str.toLowerCase())
    },
    /** */
    toUpperCase: function () {
      return mapText(this, str => str.toUpperCase())
    },
    /** */
    toTitleCase: function () {
      return mapText(this, titleCase$1)
    },
    /** */
    toCamelCase: function () {
      eachTerm(this.docs, (t, terms, i) => {
        if (i !== 0) {
          t.text = titleCase$1(t.text);
        }
        if (i !== terms.length - 1) {
          t.post = '';
        }
      });
      return this
    },
  };

  // case logic for the first character of a word
  const isTitleCase$1 = str => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase = str => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = str => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // give a new word the case of the one it replaced: 'Danes' -> 'Dane', 'DANES' -> 'DANE'
  const matchCase = (original, str) => {
    if (original.length > 1 && original === original.toUpperCase() && original !== original.toLowerCase()) {
      return str.toUpperCase()
    }
    return /^\p{Lu}/u.test(original) ? toTitleCase(str) : str
  };

  // Heal the edges of a sentence, when its first or last words change.
  // Shared by insert and remove, and by the noun and verb conversions.

  // a capital of its own, not the sentence's - 'Spencer', 'NASA', 'I', or 'Plan B'
  const ownsCapital = function (term) {
    if (term.tags.has('ProperNoun') || term.tags.has('Acronym')) {
      return true
    }
    return term.text.length === 1 || !isTitleCase$1(term.text)
  };

  // the first word of a sentence lends its capital to a new first word
  const passCapital = function (from, to, drop) {
    if (!/^\p{Lu}/u.test(from.text)) {
      return
    }
    to.text = toTitleCase(to.text);
    if (drop && !ownsCapital(from)) {
      from.text = toLowerCase(from.text);
    }
  };

  // quotes, brackets and newlines open a phrase, so they stay in front of it
  const passOpening = function (from, to) {
    to.pre = from.pre + to.pre;
    from.pre = '';
  };

  // a bare hyphen joins two words - 'well-fed'
  const isJoiner = post => /^[-–]$/.test(post);

  // "dogs' bowls" - with no opening quote before it, an apostrophe belongs to its word
  const isPossessive = function (terms, i) {
    if (!/^['’]/.test(terms[i].post)) {
      return false
    }
    return !terms.slice(0, i + 1).some(term => /['‘]/.test(term.pre))
  };

  // periods, commas, closing quotes and brackets end a phrase, so they stay behind it
  const passClosing = function (terms, i, to) {
    const from = terms[i];
    // nothing to move, or it is part of the word
    if (!from.post || isJoiner(from.post) || isPossessive(terms, i)) {
      return false
    }
    let post = from.post;
    // the new words may bring their own ending - 'loudly!'
    if (/[.?!…]/.test(to.post)) {
      post = post.replace(/^[.?!…]+/, '');
    }
    to.post = to.post.trimEnd() + post;
    from.post = ' ';
    return true
  };

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

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document, agree) {
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
    if (agree) {
      // '"dogs' -> '"the dogs'
      passOpening(home[start], needle[0]);
      // 'Dogs' -> 'The dogs'
      if (start === 0) {
        passCapital(home[start], needle[0], true);
      }
    }
    spliceArr(home, start, needle);
  };

  const cleanAppend = function (home, ptr, needle, document, agree) {
    const [n, , end] = ptr;
    const total = (document[n] || []).length;
    // 'bark.' -> 'bark loudly.'
    const moved = agree && home[end - 1] && passClosing(home, end - 1, needle.at(-1));
    if (!moved && end < total) {
      // in the middle - add trailing space on self
      endSpace(needle);
    } else if (!moved) {
      // at the end - add a space to predecessor
      endSpace(home);
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

  const pad3 = str => str.padStart(3, '0');

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
    id += i.toString(36).padStart(2, '0');

    // 1 digit random number
    const r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we changing part of a contraction? expand it first
  const expandContraction = function (m) {
    if (m.has('@hasContraction') && m.contractions) {
      m.grow('@hasContraction').contractions().expand();
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

  // {agree: false} skips moving any capitals or punctuation
  const insert = function (input, view, prepend, opts = {}) {
    const agree = opts.agree !== false;
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
        expandContraction(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document, agree);
      } else {
        expandContraction(view.update([ptr]).lastTerm());
        cleanAppend(home, ptr, terms, document, agree);
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
    return retag(doc, ['id', 'index'])
  };

  const fns$3 = {
    insertAfter: function (input, opts) {
      return insert(input, this, false, opts)
    },
    insertBefore: function (input, opts) {
      return insert(input, this, true, opts)
    },
  };
  fns$3.append = fns$3.insertAfter;
  fns$3.prepend = fns$3.insertBefore;
  fns$3.insert = fns$3.insertAfter;

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn, keep) {
    const ptrs = [];
    main.forEach((m, i) => {
      const out = m.replaceWith(fn(m, i), keep);
      ptrs.push(...out.fullPointer);
    });
    // a full document needs no new pointer
    if (main.ptrs) {
      main.ptrs = ptrs;
    }
    return main
  };

  // support 'foo $0' replacements, using this match's own groups
  const subDollarSign = function (input, main, [n, start, end]) {
    const groups = main._groups;
    return input.replace(dollarStub, a => {
      const name = a.replace(/\$/, '');
      const ptrs = Object.hasOwn(groups, name) ? groups[name] : [];
      const found = ptrs.find(ptr => ptr[0] === n && ptr[1] >= start && ptr[2] <= end);
      if (found) {
        // any end-punctuation will be moved over from the original
        return main.update([found]).text({ keepEndPunct: false })
      }
      return a
    })
  };

  // remember each match, before we change it
  const getOriginal = function (terms) {
    const last = terms.at(-1);
    return {
      pre: terms[0].pre,
      post: last.post,
      isTitleCase: isTitleCase$1(terms[0].text),
      text: terms[0].text,
      isPossessive: last.tags.has('Possessive'),
      tags: terms.map(term => Array.from(term.tags)),
    }
  };

  // keep any punctuation, and "John's"
  const restoreOriginal = function (terms, original, keep) {
    const last = terms.at(-1);
    if (keep.possessives && original.isPossessive && !last.tags.has('Possessive')) {
      last.text += "'s";
      last.normal += "'s";
      last.tags.add('Possessive');
    }
    // try to keep some pre-punctuation
    if (original.pre) {
      terms[0].pre = original.pre;
    }
    // try to keep any post-punctuation
    if (original.post) {
      // the punctuation may have moved here without its spaces - ' - '
      const post = last.post.trim();
      if (!post || post === original.post.trim()) {
        last.post = original.post;
      }
    }
  };

  fns$2.replaceWith = function (input, keep = {}) {
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
    if (!main.found) {
      return main
    }
    if (typeof input === 'function') {
      return replaceByFn(main, input, keep)
    }
    // each match has its own '$0' text
    if (typeof input === 'string' && input.includes('$') && Object.keys(main._groups).length > 0) {
      const strs = main.fullPointer.map(ptr => subDollarSign(input, main, ptr));
      return replaceByFn(main, (_m, i) => strs[i], keep)
    }
    const originals = main.docs.map(getOriginal);
    // Preserve old Term identities for plugins before insertion/deletion changes the view.
    const replacements =
      this.world.methods.one.onReplace &&
      this.fullPointer.map(([n, start, end]) => ({
        sentence: this.document[n],
        before: new Set(this.document[n]),
        oldTerms: this.document[n].slice(start, end),
      }));
    const original = this.update(this.fullPointer);
    // slide this in
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
    // {agree: false} swaps the words, and nothing else
    const agree = keep.agree !== false;
    main.insertAfter(input, { agree });
    // New terms follow each old match; stop at an existing term to separate nearby matches.
    if (replacements) {
      replacements.forEach(group => {
        const start = group.sentence.indexOf(group.oldTerms.at(-1)) + 1;
        group.newTerms = [];
        for (let i = start; i < group.sentence.length && !group.before.has(group.sentence[i]); i += 1) {
          group.newTerms.push(group.sentence[i]);
        }
      });
    }
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      const more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    // (we restore the start of the phrase ourselves, below)
    // the new words take the sentence's capital, unless {case: false}
    // (we restore the punctuation ourselves, below)
    main.delete(original, { agree, start: keep.case !== false, end: false }); //science.

    // main now points at only the new terms
    if (agree) {
      main.docs.forEach((terms, i) => restoreOriginal(terms, originals[i], keep));
    }

    // what should we return?
    const m = retag(main.toView(), ['index']);
    // replace any old tags
    if (keep.tags) {
      m.forEach((match, i) => {
        match.terms().forEach((term, k) => term.tagSafe(originals[i].tags[k]));
      });
    }
    // try to co-erce case, too
    if (keep.case) {
      m.docs.forEach((terms, i) => {
        const transformCase = originals[i].isTitleCase ? toTitleCase : toLowerCase;
        // 'DOGS' -> 'CATS'
        terms[0].text = matchCase(originals[i].text, transformCase(terms[0].text));
      });
    }
    // Transfer plugin metadata after replacement text, punctuation, and case are finalized.
    if (m.world.methods.one.onReplace) {
      replacements.forEach(({ oldTerms, newTerms }) => {
        m.world.methods.one.onReplace.forEach(fn => fn({ oldTerms, newTerms, document: m.document }));
      });
    }
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && input === undefined) {
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
      to.post = removeRunBefore(to.post, ' ', '.?!,;:"”)]');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = removeRunBefore(to.post, ',;:', '.?!');
    }
  };

  const pairs$4 = { '(': ')', '[': ']', '"': '"', '“': '”', '‘': '’' };

  // a quote or bracket that opens and closes on the removed words leaves with them - '(loudly)'
  const dropPairs = function (terms, start, end) {
    const first = terms[start];
    const last = terms[end - 1];
    Object.keys(pairs$4).forEach(open => {
      if (first.pre.includes(open) && last.post.includes(pairs$4[open])) {
        first.pre = first.pre.replace(open, '');
        last.post = last.post.replace(pairs$4[open], '');
      }
    });
  };

  // the word before us becomes the end of the phrase - 'bark loudly, and' -> 'bark, and'
  const repairEnd = function (terms, start, end) {
    const prev = terms[start - 1];
    const post = terms[end - 1].post;
    // is there anything to keep, and room to keep it?
    if (prev && /\S/.test(post) && !/\S/.test(prev.post)) {
      prev.post = post;
    }
  };

  // the words after us become the start of the phrase
  const repairStart = function (terms, start, end) {
    const next = terms[end];
    if (!next) {
      return
    }
    // '"the dogs' -> '"dogs'
    passOpening(terms[start], next);
    // 'The dogs' -> 'Dogs'
    if (start === 0) {
      passCapital(terms[start], next);
    }
  };

  // remove terms from document json
  const pluckOut = function (document, nots, opts = {}) {
    nots.forEach(ptr => {
      const [n, start, end] = ptr;
      const len = end - start;
      if (!document[n]) {
        return // weird!
      }
      if (opts.agree !== false) {
        dropPairs(document[n], start, end);
        if (end === document[n].length && end > 1) {
          repairPunct(document[n], len);
        } else if (opts.end !== false) {
          repairEnd(document[n], start, end);
        }
        if (opts.start !== false) {
          repairStart(document[n], start, end);
        }
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

  // which sentences will have no terms left?
  const getEmptied = function (gonePtrs, document) {
    return Object.keys(gonePtrs).map(Number).filter(n => {
      const count = gonePtrs[n].reduce((sum, no) => sum + no[2] - no[1], 0);
      return document[n] && count >= document[n].length
    })
  };

  // gonePtrs must run from last-to-first, in each sentence
  const fixPointers$1 = function (ptrs, gonePtrs, emptied) {
    ptrs = ptrs.map(ptr => {
      const [n] = ptr;
      const gone = gonePtrs[n] || [];
      gone.forEach(no => {
        const len = no[2] - no[1];
        // does it effect our pointer?
        if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
          ptr[2] -= len;
        } else if (ptr[1] >= no[2]) {
          // terms before our pointer are gone
          ptr[1] -= len;
          ptr[2] -= len;
        }
      });
      // sentences before our pointer are gone
      ptr[0] -= emptied.filter(k => k < n).length;
      // remove old hard-pointers
      ptr[3] = null;
      ptr[4] = null;
      return ptr
    });
    // remove any now-empty pointers
    return ptrs.filter(ptr => ptr[2] - ptr[1] > 0)
  };

  const methods$j = {
    // {agree: false} skips moving any capitals or punctuation
    remove: function (reg, opts) {
      const { indexN } = this.methods.one.pointer;
      // allow .remove({agree: false})
      if (reg && Object.hasOwn(reg, 'agree')) {
        opts = reg;
        reg = undefined;
      }
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
      expandContraction(not);

      let ptrs = self.fullPointer;
      const nots = not.fullPointer.reverse();
      const gonePtrs = indexN(nots);
      const emptied = getEmptied(gonePtrs, this.document);
      // remove them from the actual document)
      const document = pluckOut(this.document, nots, opts);
      // repair our pointers
      ptrs = fixPointers$1(ptrs, gonePtrs, emptied);
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

  // set or append the pre/post of the first/last term of each match
  const setSide = function (view, side, str, concat) {
    view.docs.forEach(terms => {
      const term = side === 'pre' ? terms[0] : terms.at(-1);
      if (concat === true) {
        term[side] += str;
      } else {
        term[side] = str;
      }
    });
    return view
  };

  // put these characters around each match
  const wrap$1 = function (view, start, end) {
    view.docs.forEach(terms => {
      terms[0].pre = start + terms[0].pre;
      const last = terms.at(-1);
      last.post = end + last.post;
    });
    return view
  };

  const methods$i = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      return setSide(this, 'pre', str, concat)
    },

    /** add this punctuation or whitespace after each match: */
    post: function (str, concat) {
      if (str === undefined) {
        const last = this.docs.at(-1);
        return last.at(-1).post
      }
      return setSide(this, 'post', str, concat)
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
      //remove whitespace
      eachTerm(this.docs, (t, terms, i) => {
        if (i !== 0) {
          t.pre = '';
        }
        if (terms[i + 1]) {
          t.post = '-';
        }
      });
      return this
    },

    /** remove hyphens between words, and set whitespace */
    dehyphenate: function () {
      const hasHyphen = /[-–—]/;
      //remove whitespace
      eachTerm(this.docs, t => {
        if (hasHyphen.test(t.post)) {
          t.post = ' ';
        }
      });
      return this
    },

    /** add quotations around these matches */
    toQuotations: function (start, end) {
      return wrap$1(this, start || '"', end || '"')
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      return wrap$1(this, start || '(', end || ')')
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

  /** count the # of characters of each match - longest first */
  const length = (a, b) => b.normal.trim().length - a.normal.trim().length;

  /** count the # of terms in each match - most first */
  const wordCount$1 = (a, b) => b.words - a.words;

  /** document order - sentence, then start, then end of each match */
  const sequential = (a, b) => a.pointer[0] - b.pointer[0] || a.pointer[1] - b.pointer[1] || a.pointer[2] - b.pointer[2];

  /** sort by # of duplicates in the document*/
  const byFreq = function (arr) {
    const counts = Object.create(null);
    arr.forEach(o => {
      counts[o.normal] ??= 0;
      counts[o.normal] += 1;
    });
    // sort by freq - most first
    arr.sort((a, b) => counts[b.normal] - counts[a.normal]);
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
    const { docs } = this;
    this.uncache();
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input ||= 'alpha';
    const ptrs = rawPointer(this);
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
    const ptrs = [].concat(rawPointer(this)).reverse();
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
      if (!/ /.test(last.post)) {
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
      eachTerm(view.docs, term => {
        term.id ||= toId(term);
      });
    }
  };

  var change = {
    api: addAPI$2,
    compute: compute$5,
  };

  // one 'word:out words' per line - decoded once into { [key]: word, out: [...] }
  const parse$4 = (str, key) =>
    str
      .trim()
      .split('\n')
      .map(s => {
        const [k, out] = s.trim().split(':');
        return { [key]: k, out: out.split(' ') }
      });

  var contractions$2 = [
    // that's and let's are decided here, before any tagging
    // (step 1 of the 's decision - the list is in 2-two/contraction-two/compute/index.js)
    // simple mappings
    ...parse$4(
      `
@:at
arent:are not
alot:a lot
brb:be right back
cannot:can not
dun:do not
can't:can not
shan't:should not
won't:will not
that's:that is
what's:what is
let's:let us
dunno:do not know
gonna:going to
gotta:have got to
gimme:give me
outta:out of
tryna:trying to
gtg:got to go
im:i am
imma:I will
imo:in my opinion
irl:in real life
ive:i have
rn:right now
tbh:to be honest
wanna:want to
c'mere:come here
c'mon:come on
shoulda:should have
coulda:could have
woulda:would have
musta:must have
tis:it is
twas:it was
y'know:you know
ne'er:never
o'er:over
  `,
      'word'
    ),
    // contraction-part mappings
    ...parse$4(
      `
ll:will
ve:have
re:are
m:am
  `,
      'after'
    ),
    // french contractions - t'aime
    ...parse$4(
      `
c:ce
m:me
n:ne
qu:que
s:se
t:tu
  `,
      'before'
    ),
    // missing apostrophes, apostrophe-d
    ...parse$4(
      `
shouldnt:should not
couldnt:could not
wouldnt:would not
hasnt:has not
wasnt:was not
isnt:is not
cant:can not
dont:do not
wont:will not
howd:how did
whatd:what did
whend:when did
whered:where did
  `,
      'word'
    ),
  ];

  // one entry per line, in a template string
  const toList = str => str.trim().split('\n').map(s => s.trim());

  // ['a', 'b'] → { a: true, b: true }
  const toHash = list => Object.fromEntries(list.map(s => [s, true]));

  // number suffixes that are not units
  // s=1990s, e=18e french/spanish ordinal, er=french 1er, ère/ème=french 2ème
  var numberSuffixes = toHash(toList(`
st
nd
rd
th
am
pm
max
°
s
e
er
ère
ème
`));

  var model$5 = {
    one: {
      contractions: contractions$2,
      numberSuffixes
    }
  };

  // Log decisions before splicing replaces the original term.
  const contractionDebug = (term, expansion) => {
    if (!debug$2.contractions || (debug$2.word && debug$2.word !== (term.normal || term.text).toLowerCase())) {
      return
    }
    debug$2.rule = undefined;
    const result = expansion ? '[' + expansion.map(word => yellow(`'${word}'`)).join(', ') + ']' : 'possessive (kept)';
    console.log(`${debug$2.prefix || '   '}${yellow(JSON.stringify(term.text))} →  ${result}`); // eslint-disable-line no-console
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

  const twoApostrophes = /^(.+)'(t|d|ll)'ve$/;

  // wouldn't've -> would not have,  i'd've -> i would have
  const doubled = function (terms, i) {
    const m = terms[i].normal.match(twoApostrophes);
    if (m === null) {
      return null
    }
    const head = m[1];
    if (m[2] === 'd') {
      return [head, 'would', 'have']
    }
    if (m[2] === 'll') {
      return [head, 'will', 'have']
    }
    // n't've - but can't've, won't've
    if (head === 'can') {
      return ['can', 'not', 'have']
    }
    if (head === 'won') {
      return ['will', 'not', 'have']
    }
    return [head.replace(/n$/, ''), 'not', 'have']
  };

  const hasContraction = /'/;
  const isFeminine = /(e|é|aison|sion|tion)$/;
  const isMasculine = /(age|isme|acle|ege|oire)$/;
  // l' words that end in e, but take le - accents are already stripped
  const masculineE = new Set(['homme', 'arbre', 'espace', 'exemple', 'ordre', 'ange', 'etre', 'ete', 'empire', 'oncle', 'angle', 'article', 'orchestre', 'insecte', 'episode']);
  // l' words that take la, without ending in e
  const feminineEnd = /(eau|tion|sion)$/;
  // the word after the apostrophe
  const getAfter = (terms, i) => terms[i].normal.split(hasContraction)[1];

  // l'amour, l'homme, l'eau
  const preL = (terms, i) => {
    // le/la
    const after = getAfter(terms, i);
    // quick french gender disambig (rough)
    if (after && ((after.endsWith('e') && !masculineE.has(after)) || feminineEnd.test(after))) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    const after = getAfter(terms, i);
    // quick guess for noun-agreement (rough)
    if (after && isFeminine.test(after) && !isMasculine.test(after)) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => ['je', getAfter(terms, i)];

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
      if (term.tags.has('PhoneNumber') || phoneNum.test(term.text)) {
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

  // poor-mans reindexing of this sentence only
  const reIndex = function (terms) {
    terms.forEach((t, i) => {
      if (t.index) {
        t.index[1] = i;
      }
    });
  };

  const byEnd = {
    // ain't
    t: apostropheT,
    // how'd
    d: _apostropheD,
  };

  const byStart = {
    // j'aime
    j: french.preJ,
    // l'amour
    l: french.preL,
    // d'amerique
    d: french.preD,
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

  // turn the words into terms, and put them where the contraction was
  const expand$1 = function (words, view, document, n, i) {
    contractionDebug(document[n][i], words);
    const doc = view.fromText(words.join(' '));
    doc.compute(['id', 'alias']);
    words = doc.docs[0];
    insertContraction(document, [n, i], words);
    return words
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
      const len = terms.length;
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        // already expanded - this runs on the whole document, and must be re-runnable
        if (terms[i].implicit) {
          continue
        }
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal)) {
          const res = terms[i].normal.split(byApostrophe);
          before = res[0];
          after = res[1];
        }
        // wouldn't've, then any known-ones, like 'dunno'
        let words = doubled(terms, i) || knownOnes(list, terms[i], before, after);
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
          expand$1(words, view, document, n, i);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange(terms, i);
          if (words) {
            words = expand$1(words, view, document, n, i);
            methods.one.setTag(words, 'NumberRange', world); //add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit(terms, i, world);
        if (words) {
          words = expand$1(words, view, document, n, i);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
      // new terms shift the indexes of any terms after them
      if (terms.length !== len) {
        reIndex(terms);
      }
    });
  };

  var compute$4 = { contractions: contractions$1 };

  const plugin$1 = {
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

    eachTerm(view.docs, (t, terms, i) => {
      // basic lexicon lookup
      const word = t.machine || t.normal;

      // test a multi-word
      if (multi[word] !== undefined && terms[i + 1]) {
        const end = i + multi[word] - 1;
        for (let k = end; k > i; k -= 1) {
          const words = terms.slice(i, k + 1);
          const str = words.map(term => term.machine || term.normal).join(' ');
          // lookup frozen lexicon
          if (Object.hasOwn(frozenLex, str)) {
            setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
            words.forEach(term => (term.frozen = true));
          }
        }
      }
      // test single word
      if (frozenLex[word] !== undefined && Object.hasOwn(frozenLex, word)) {
        setTag([t], frozenLex[word], world, false, '1-freeze-lexicon');
        t.frozen = true;
      }
    });
  };

  const unfreeze = function (view) {
    eachTerm(view.docs, term => {
      delete term.frozen;
    });
    return view
  };
  var compute$3 = { frozen: freeze$1, freeze: freeze$1, unfreeze };

  var freeze = {
    // add .compute('freeze')
    compute: compute$3,

    mutate: world => {
      const methods = world.methods.one;
      // add @isFrozen method
      methods.termMethods.isFrozen = term => term.frozen === true;
      // `.debug('frozen')` is the tags view, which marks frozen terms
      methods.debug.freeze = view => methods.debug.tags(view);
      methods.debug.frozen = methods.debug.freeze;
    },

    api: function (View) {
      // set all terms to reject any desctructive tags
      View.prototype.freeze = function () {
        eachTerm(this.docs, term => {
          term.frozen = true;
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
        if (Object.hasOwn(lexicon, str)) {
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

  const prefix$2 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
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
    if (prefix$2.test(word)) {
      const stem = word.replace(prefix$2, '');
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
    eachTerm(view.docs, (term, terms, i) => {
      if (term.tags.size === 0) {
        let found = null;
        found ||= multiWord(terms, i, world);
        // lookup known words
        found ||= checkLexicon(terms, i, world);
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
    Object.entries(words).forEach(([k, v]) => {
      if (typeof v === 'string' && v.startsWith('#')) {
        words[k] = v.replace(/^#/, '');
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
      if (cache.has(words[i])) {
        return false
      }
    }
    return true
  };

  const scan$1 = function (view, trie, opts) {
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

  function api$e (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      const trie = isObject(input) ? input : buildTrie(input, this.world);
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
    api: api$e,
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

  // did they pass-in a compromise object?
  const isView = val => val && isObject(val) && val.isView === true;

  const isNet = val => val && isObject(val) && val.isNet === true;

  // sweep options when only finding, not tagging
  const noTag = { tagger: false };

  // parse the match-syntax, then run it over the docs
  const doMatch = (view, regs, group, opts, justOne) => {
    regs = parseRegs(regs, opts, view.world);
    return view.methods.one.match(view.docs, { regs, group, justOne }, view._cache)
  };

  // turn match results into a view
  const asView = (view, res) => {
    const { ptrs, byGroup } = fixPointers(res, view.fullPointer);
    const out = view.toView(ptrs);
    out._groups = byGroup;
    return out
  };

  const match$1 = function (regs, group, opts) {
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, noTag).view.settle()
    }
    return asView(this, doMatch(this, regs, group, opts))
  };

  const matchOne = function (regs, group, opts) {
    // support at view as a param
    if (isView(regs)) {
      return this.intersection(regs).eq(0)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false, matchOne: true }).view
    }
    return asView(this, doMatch(this, regs, group, opts, true))
  };

  const has$2 = function (regs, group, opts) {
    // support view as input
    if (isView(regs)) {
      return this.intersection(regs).fullPointer.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, noTag).view.found
    }
    return doMatch(this, regs, group, opts, true).ptrs.length > 0
  };

  // keep only the matches that do (or don't) contain this match
  const ifBy = want => function (regs, group, opts) {
    // support view as input
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found === want)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      const m = this.sweep(regs, noTag).view.settle();
      return this.filter(v => v.intersection(m).found === want)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    const cache = this._cache || [];
    const view = this.filter((m, i) => {
      return (this.methods.one.match(m.docs, todo, cache[i]).ptrs.length > 0) === want
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$2 = { matchOne, match: match$1, has: has$2, if: ifBy(true), ifNo: ifBy(false) };

  // the words before (or after) each match, in its sentence
  const lookaround = function (view, isAfter, regs, group, opts) {
    const { indexN } = view.methods.one.pointer;
    const { document } = view;
    const dir = isAfter ? -1 : 1;
    const ptrs = [];
    const byN = indexN(view.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest (or latest) match in the sentence
      const [n, start, end] = byN[k].sort((a, b) => (a[1] > b[1] ? dir : -dir))[0];
      if (isAfter) {
        if (end < document[n].length) {
          ptrs.push([n, end, document[n].length]);
        }
      } else if (start > 0) {
        ptrs.push([n, 0, start]);
      }
    });
    const words = view.toView(ptrs);
    if (!regs) {
      return words
    }
    return words.match(regs, group, opts)
  };

  // extend each match left (or right), while the terms beside it match
  const growSide = function (view, isRight, regs, group, opts) {
    if (typeof regs === 'string') {
      regs = view.world.methods.one.parseMatch(regs, opts, view.world);
    }
    // ensure matches are beside us
    if (isRight) {
      regs[0].start = true;
    } else {
      regs[regs.length - 1].end = true;
    }
    const ptrs = view.fullPointer;
    view.forEach((m, n) => {
      const more = isRight ? m.after(regs, group) : m.before(regs, group);
      if (more.found) {
        const terms = more.terms();
        if (isRight) {
          ptrs[n][2] += terms.length;
          ptrs[n][4] = null; //remove end-id
        } else {
          ptrs[n][1] -= terms.length;
          ptrs[n][3] = terms.docs[0][0].id;
        }
      }
    });
    return view.update(ptrs)
  };

  // bind a direction to a method
  const side = (fn, flag) => function (regs, group, opts) {
    return fn(this, flag, regs, group, opts)
  };

  const grow = function (regs, group, opts) {
    return this.growRight(regs, group, opts).growLeft(regs, group, opts)
  };

  var lookaround$1 = {
    before: side(lookaround, false),
    after: side(lookaround, true),
    growLeft: side(growSide, false),
    growRight: side(growSide, true),
    grow,
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

  // turn a match-string, array, or view into a view
  const getDoc$1 = (reg, view, group) => {
    if (typeof reg === 'string' || Array.isArray(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    // support pre-parsed reg object
    return reg
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

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
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

  // split each match, then collect the pieces into pointers
  const split = function (view, m, group, collect) {
    const { splitAll } = view.methods.one.pointer;
    const splits = getDoc$1(m, view, group).fullPointer;
    const all = splitAll(view.fullPointer, splits);
    const res = collect(all).filter(p => p).map(p => addIds$1(p, view));
    return view.update(res)
  };

  const methods$e = {};
  // [before], [match], [after]
  methods$e.splitOn = function (m, group) {
    return split(this, m, group, all => all.flatMap(o => [o.passthrough, o.before, o.match, o.after]))
  };

  // [before], [match after]
  methods$e.splitBefore = function (m, group) {
    return split(this, m, group, all => {
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
      return all.flatMap(o => {
        // a, [x, b]
        if (o.match && o.after) {
          return [o.passthrough, o.before, combine(o.match, o.after)]
        }
        // a, [x], b
        return [o.passthrough, o.before, o.match]
      })
    })
  };

  // [before match], [after]
  methods$e.splitAfter = function (m, group) {
    return split(this, m, group, all => all.flatMap(o => {
      if (o.before && o.match) {
        return [o.passthrough, combine(o.before, o.match), o.after]
      }
      return [o.passthrough, o.before, o.match, o.after]
    }))
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

  const methods$c = { ...match$2, ...lookaround$1, ...methods$e, ...methods$d };
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
  const prefix$1 = new Set('!~[^');
  const suffix$1 = new Set('?]+*$~{},0123456789');
  const whitespace$2 = /\s/;

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
      afterSuffix[i] = suffix$1.has(str[i]) ? afterSuffix[i + 1] : i;
      if (str[i] === ')') close = i;
      if (str[i] === '(' && close >= i + 3 && str[close - 1] !== '\\') {
        const end = afterSuffix[close + 1];
        if (end === length || whitespace$2.test(str[end])) bodyEnd[i] = end;
      }
      // The optional <...> header cannot cross another '<', and prefers the
      // rightmost '>' which is followed by a valid parenthesized block.
      if (str[i] === '<') {
        captureEnd[i] = capture;
        capture = 0;
      } else if (str[i] === '>' && !capture) {
        // the block may be negative - [<name>!(a|b)]
        capture = bodyEnd[str[i + 1] === '!' ? i + 2 : i + 1] || 0;
      }
    }
    const parts = [];
    let previous = 0;
    let i = 0;
    while (i < length) {
      const start = i;
      while (i < length && prefix$1.has(str[i])) i++;
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

  // Split out /regex/ tokens - 'foo /yes/' and not 'foo/no/bar' - in linear time.
  // Has the grammar of this pattern, which rescans the line for each rejected opener:
  // (?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?=\s|$)
  const prefix = new Set('![^');
  const suffix = new Set('?]+*$~');
  const newline = new Set('\n\r  '); // what '.' can't cross
  const whitespace$1 = /\s/;

  const splitRegs = str => {
    if (!str.includes('/')) {
      return [str]
    }
    const length = str.length;
    const afterSuffix = new Uint32Array(length + 1);
    const ends = new Uint32Array(length); // a token's end, by its opening '/' or '<'
    afterSuffix[length] = length;
    let close = 0; // the nearest valid closing, for a body starting at i+1
    let capture = 0; // the rightmost valid '>' wins, and it can't cross another '<'
    for (let i = length - 1; i >= 0; i--) {
      if (str[i] === '/') {
        ends[i] = close;
      }
      afterSuffix[i] = suffix.has(str[i]) ? afterSuffix[i + 1] : i;
      if (newline.has(str[i])) {
        close = 0;
      }
      if (str[i + 1] === '/' && str[i] !== '/' && str[i] !== '\\') {
        const end = afterSuffix[i + 2];
        if (end === length || whitespace$1.test(str[end])) {
          close = end;
        }
      }
      if (str[i] === '<') {
        ends[i] = capture;
        capture = 0;
      } else if (str[i] === '>' && !capture && str[i + 1] === '/') {
        capture = ends[i + 1];
      }
    }
    const parts = [];
    let previous = 0;
    // -1 stands in for the '^' start
    for (let i = -1; i < length; i++) {
      if (i === -1 || whitespace$1.test(str[i])) {
        let start = i + 1;
        while (prefix.has(str[start])) {
          start++;
        }
        const end = ends[start];
        if (end) {
          parts.push(str.slice(previous, Math.max(i, 0)), str.slice(i + 1, end));
          // the whitespace after this token can also open the next one
          previous = end + 1;
          i = end - 1;
        }
      }
    }
    parts.push(str.slice(previous));
    return parts
  };

  // any whitespace separates terms, the same as the tokenizer
  const byWord = /\s+/;

  const isBlock = str => {
    return /^[![^]*(<[^<]*>)?!?\(/.test(str) && /\)[?\]+*$~{},0-9]*$/.test(str)
  };
  const isReg = str => {
    return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str)
  };
  const never = () => false;

  const cleanUp = function (arr) {
    arr = arr.map(str => str.trim());
    arr = arr.filter(str => str);
    return arr
  };

  const parseBlocks = function (txt, opts = {}) {
    // {noRegex} - slashes are plain characters
    const isRegex = opts.noRegex ? never : isReg;
    // parse by /regex/ first
    const arr = opts.noRegex ? [txt] : splitRegs(txt);
    let res = [];
    // parse by (blocks), next
    arr.forEach(str => {
      if (isRegex(str)) {
        res.push(str);
        return
      }
      res = res.concat(splitGroups(str));
    });
    res = cleanUp(res);
    // split by spaces, now - but not inside (blocks) or /regexes/
    const final = res.flatMap(str => {
      if (isBlock(str) || isRegex(str)) {
        return str
      }
      return str.split(byWord)
    });
    return cleanUp(final)
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
  // is the token wrapped in these chars, like (foo)
  const wrapped = (str, a, b = a) => start(str) === a && end(str) === b;
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
      if (end(w) === '+' && !w.endsWith('\\+')) {
        obj.greedy = true;
        w = stripEnd(w);
      }
      // 'foo*' is zero or more
      if (w !== '*' && end(w) === '*' && !w.endsWith('\\*')) {
        obj.greedy = true;
        obj.optional = true;
        w = stripEnd(w);
      }
      if (start(w) === '!') {
        obj.negative = true;
        // obj.optional = true
        w = stripStart(w);
      }
      //soft-match
      if (wrapped(w, '~') && w.length > 2) {
        w = stripBoth(w);
        obj.fuzzy = true;
        obj.min = opts.fuzzy ?? 0.85;
        if (!/\(/.test(w)) {
          obj.word = w;
          return obj
        }
      }

      //regex - {noRegex} leaves it as a plain word, to avoid redos from user-input
      if (wrapped(w, '/') && w.length > 2 && !opts.noRegex) {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      // support foo{1,9}
      if (hasMinMax.test(w)) {
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
      if (wrapped(w, '(', ')')) {
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
          return str.split(/\s+/).map(s => parseToken(s, opts, aliases))
        });
        w = '';
      }

      //root/sense overloaded
      if (wrapped(w, '{', '}')) {
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
      if (wrapped(w, '<', '>')) {
        w = stripBoth(w);
        obj.chunk = titleCase(w);
        obj.greedy = true;
        return obj
      }
      if (wrapped(w, '%')) {
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
      w = w.replace('\\+', '+');
      w = w.replace('\\/', '/');
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
    if (reg.test(str)) {
      return true
    }
    //number-letter '20-aug'
    const reg2 = /^[('"]?([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+[)'"]?$)/i;
    if (reg2.test(str)) {
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

  // add all inflections of this verb/noun/adjective
  const inflect = function (token, world, kind, fallback) {
    const { all } = world.methods.two.transform[kind] || {};
    if (!all) {
      return fallback
    }
    return all(token.root, world.model)
  };

  // explicitly-set POS - '{sweet/adjective}'
  const byPos = { Verb: 'verb', Noun: 'noun', Adjective: 'adjective' };

  // turn '{walk}' into 'walking', 'walked', etc
  const inflectRoot = function (regs, world) {
    // do we have compromise/two?
    regs = regs.map(token => {
      // a reg to convert '{foo}'
      if (token.root) {
        // check if compromise/two is loaded
        if (world.methods.two && world.methods.two.transform) {
          let choices = [];
          if (token.pos) {
            if (Object.hasOwn(byPos, token.pos)) {
              const kind = byPos[token.pos];
              choices = inflect(token, world, kind, kind === 'verb' ? [] : [token.root]);
            }
          } else {
            // do verb/noun/adj by default
            choices = [
              ...inflect(token, world, 'verb', []),
              ...inflect(token, world, 'noun', [token.root]),
              ...inflect(token, world, 'adjective', [token.root]),
            ];
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
    let tokens = parseBlocks(input, opts);
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
      if (reg.word !== undefined && !cache.has(reg.word)) {
        return true
      }
      // is the tag missing?
      if (reg.tag !== undefined && !cache.has('#' + reg.tag)) {
        return true
      }
      // are all of the fast-or words missing?
      if (reg.fastOr !== undefined && !anyIntersection(reg.fastOr, cache)) {
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
  const hasDash$2 = / [-–—]{1,3} /;

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
    hasDash: term => hasDash$2.test(term.post) || hasDash$2.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    /** does it have any tags */
    isKnown: term => term.tags.size > 0,
    /** uppercase first letter, then a lowercase - also 'Tis */
    isTitleCase: term => /^['\u2019]?\p{Lu}[a-z'\u00C0-\u00FF]/u.test(term.text),
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
      return term.tags.has(reg.tag)
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
    // each choice is a list of tokens - this term can only test the first one
    if (reg.choices !== undefined) {
      // try to support && operator
      if (reg.operator === 'and') {
        // must match them all
        return reg.choices.every(r => wrapMatch(term, r[0], index, length))
      }
      // or must match one
      return reg.choices.some(r => wrapMatch(term, r[0], index, length))
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

  // add any terms used since startAt, to the current capture
  const logGroup = function (state, startAt) {
    if (state.hasGroup === true && state.t > startAt) {
      getGroup$1(state, startAt).length += state.t - startAt;
    }
  };

  // test the reg against the term at array-index t
  const matchAt = (state, reg, t) => wrapMatch(state.terms[t], reg, state.start_i + t, state.phrase_length);

  // anchors should not apply to repeated terms
  const noAnchors = reg => ({ ...reg, start: false, end: false });

  // how many terms a match must have - optional and negative regs don't count
  const getMinLength = regs => regs.filter(reg => reg.optional !== true && reg.negative !== true).length;

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    const reg = noAnchors(state.regs[state.r]);
    const start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      // the number of terms we've matched, if we stop here
      const count = state.t - start + 1;
      //stop for next-reg match - unless we're still under our min
      if (endReg && matchAt(state, endReg, state.t)) {
        if (reg.min === undefined || count >= reg.min) {
          return state.t
        }
      }
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (matchAt(state, reg, state.t) === false) {
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
      if (matchAt(state, nextReg, t) === true) {
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
        if (matchAt(state, tmpReg, state.t) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
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
      if (matchAt(state, cr, t) !== true) {
        return 0
      }
      len += 1;
      // this can be greedy - '(foo+ bar)'
      if (cr.greedy === true) {
        // like getGreedy, anchors should not apply to the repeated terms
        const gr = noAnchors(cr);
        for (let i = t + 1; i < state.terms.length; i += 1) {
          if (matchAt(state, gr, i) !== true) {
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

  const tryAndBlock = function (state, skipN) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    const reg = state.regs[state.r];
    const allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      const allWords = block.every((cr, w_index) => {
        const tryTerm = state.t + skipN + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return matchAt(state, cr, tryTerm)
      });
      if (allWords === true && block.length > longest) {
        longest = block.length;
      }
      return allWords
    });
    if (allDidMatch === true) {
      return longest
    }
    return 0
  };

  // match a block, and keep going if it's greedy - '(a b|c)+', '(a && b){2,3}'
  const repeatBlock = function (state, tryBlock) {
    const reg = state.regs[state.r];
    let skipN = tryBlock(state, 0);
    if (skipN === 0 || reg.greedy !== true) {
      return skipN
    }
    const next = state.regs[state.r + 1];
    let count = 1;
    while (count !== reg.max) {
      const t = state.t + skipN;
      const term = state.terms[t];
      const hasMin = reg.min === undefined || count >= reg.min;
      // stop for the next token, like 'foo+ bar'
      if (!term || (next && hasMin && matchAt(state, next, t))) {
        break
      }
      const more = tryBlock(state, skipN);
      if (more === 0) {
        break
      }
      skipN += more;
      count += 1;
    }
    // 'foo{2,3}' was too short
    if (reg.min !== undefined && count < reg.min) {
      return 0
    }
    return skipN
  };

  const doOrBlock$1 = state => repeatBlock(state, tryChoices);
  const doAndBlock$1 = state => repeatBlock(state, tryAndBlock);

  // 'foo? foo' matches are tricky.
  // should this optional token leave its term for the next one?
  const leaveForNext = function (state) {
    const next = state.regs[state.r + 1];
    if (!next || !matchAt(state, next, state.t)) {
      return false
    }
    // but does the next reg match the next term??
    // only skip if it doesn't
    const nextTerm = state.terms[state.t + 1];
    return !nextTerm || !matchAt(state, next, state.t + 1)
  };

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = matchAt(state, reg, t);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = matchAt(state, nextReg, t);
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
    // '!foo* after' can match nothing, and leave this term for the next token
    if (skip === 0) {
      return reg.optional === true //dead, otherwise
    }
    // did we satisfy min for !foo{min,max}
    if (reg.min && reg.min > skip) {
      return false//dead
    }
    state.t += skip;
    // state.r += 1
    return true
  };

  // a negative block didn't find its terms - that's good news
  const negativeBlock = function (state) {
    const reg = state.regs[state.r];
    const startAt = state.t;
    let alive = true;
    if (reg.greedy === true) {
      // '!(a|b)+' keeps going - anchors should not apply to the repeated terms
      alive = negGreedy(state, noAnchors({ ...reg, negative: false }), state.regs[state.r + 1]);
    } else if (!reg.optional) {
      // but a '!(a b)?' can pass-through without consuming anything
      state.t += 1;
    }
    logGroup(state, startAt);
    return alive
  };

  // shared logic for '(a|b)' or-blocks and '(a && b)' and-blocks
  const makeBlock = tryBlock => function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const skipNum = tryBlock(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic - but '!(a|b)*' can match nothing
      if (reg.negative === true) {
        return reg.optional === true && reg.greedy === true
      }
      // '(a|b)? a' - go on to the next token, without using this term
      if (reg.optional === true && leaveForNext(state)) {
        return true
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
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      return negativeBlock(state)
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  // '(a|b)' - match any choice on the term
  var doOrBlock = makeBlock(doOrBlock$1);

  // '(foo && #Noun)' - require all matches on the term
  var doAndBlock = makeBlock(doAndBlock$1);

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const startAt = state.t;

    // match *anything* but this term
    const tmpReg = { ...reg };
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    const found = matchAt(state, tmpReg, state.t);
    if (found) {
      // but '!foo*' can match nothing - '!foo?' stays a lookahead
      return reg.optional === true && reg.greedy === true
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      // like getGreedy, anchors should not apply to the repeated terms
      const alive = negGreedy(state, noAnchors(tmpReg), regs[state.r + 1]);
      logGroup(state, startAt);
      return alive
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      const nextReg = regs[state.r + 1];
      if (nextReg) {
        const fNext = matchAt(state, nextReg, state.t);
        if (fNext) {
          return true // leave the term, and any capture, to the next reg
        }
        if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          const fNext2 = matchAt(state, regs[state.r + 2], state.t);
          if (fNext2) {
            return true
          }
        }
      }
    }
    state.t += 1;
    logGroup(state, startAt);
    return true
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
    if (!term.implicit || !state.terms[state.t + 1]?.implicit) {
      return
    }
    // we matched "we've", or @hasContraction - skip over all of its hidden words, [we, have]
    if (reg.word === term.normal || reg.method === 'hasContraction') {
      let next = state.terms[state.t + 1];
      // a hidden word has no text of its own - the next contraction starts at a word that does
      while (next && next.implicit && next.text === '') {
        state.t += 1;
        next = state.terms[state.t + 1];
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
    // go on to the next token, without using this term
    if (reg.optional && leaveForNext(state)) {
      return true
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

  // choose how to consume this reg: a step function, null to die, or undefined to skip it
  const pickStep = function (reg, state) {
    // support 'unspecific greedy' .* properly
    if (reg.anything === true && reg.greedy === true) {
      return doAstrix
    }
    // slow-OR - multi-word OR (a|b|foo bar)
    if (reg.choices !== undefined && reg.operator === 'or') {
      return doOrBlock
    }
    // slow-AND - multi-word AND (#Noun && foo) blocks
    if (reg.choices !== undefined && reg.operator === 'and') {
      return doAndBlock
    }
    // support '.' as any-single
    if (reg.anything === true) {
      // '!.' negative anything should insta-fail
      if (reg.negative) {
        return null
      }
      return simpleMatch
    }
    // support 'foo*$' until the end
    if (isEndGreedy(reg, state) === true) {
      return simpleMatch
    }
    // ok, it doesn't match - but maybe it wasn't *supposed* to?
    if (reg.negative) {
      // we want *anything* but this term
      return doNegative
    }
    // ok, finally test the term-reg
    if (matchAt(state, reg, state.t) === true) {
      return simpleMatch
    }
    //ok who cares, keep going
    if (reg.optional === true) {
      return undefined
    }
    // finally, we die
    return null
  };

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
      state.inGroup = state.hasGroup ? reg.group : null;
      //have we run-out of terms?
      if (!state.terms[state.t]) {
        //are all remaining regs optional or negative?
        const alive = regs.slice(state.r).some(remain => !remain.optional);
        if (alive === false) {
          break //done!
        }
        return null // die
      }
      const step = pickStep(reg, state);
      if (step === null) {
        return null
      }
      if (step && !step(state)) {
        return null
      }
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
        Object.entries(r.groups).forEach(([k, ptr]) => {
          byGroup[k] ||= [];
          byGroup[k].push(ptr);
        });
      });
    }
    return { ptrs, byGroup }
  };

  // drop any results that contain this match
  const notIf = function (results, not, docs) {
    return results.filter(res => {
      const [n, start, end] = res.pointer;
      const terms = docs[n].slice(start, end);
      return !terms.some((_t, i) => tryHere(terms, not, i, terms.length, i) !== null)
    })
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
      minLength = getMinLength(regs);
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

  const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
  const escapeXml = str => str.replace(/[&<>"']/g, c => escapes[c]);

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
    eachTerm(this.docs, t => {
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

  // the original text of these terms, with any outer whitespace removed
  const rawText = terms => terms.reduce((str, t) => str + t.pre + t.text + t.post, '').trim();

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach((t, i) => {
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
      // add an implicit space, for contractions - but not after the last word
      if ((opts.form === 'machine' || opts.form === 'implicit' || opts.form === 'root') && t.implicit && i < terms.length - 1) {
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

  const some = {
    whitespace: 'some',
    punctuation: 'some',
    unicode: 'some',
  };
  const fmts = {
    text: {
      form: 'text',
    },
    normal: {
      ...some,
      case: 'some',
      form: 'normal',
    },
    machine: {
      ...some,
      keepSpace: false,
      case: 'none',
      form: 'machine',
    },
    root: {
      ...some,
      keepSpace: false,
      case: 'some',
      form: 'root',
    },
    implicit: {
      form: 'implicit',
    }
  };
  fmts.clean = fmts.normal;
  fmts.reduced = fmts.root;

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

  const defaults$3 = {
    text: true,
    terms: true,
  };

  const opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  // text in this format, keeping punctuation
  const punct = (terms, fmt) => textFromTerms(terms, { ...fmt, keepPunct: true }, false);

  const fns$1 = {
    text: terms => punct(terms),
    normal: terms => punct(terms, fmts.normal),
    implicit: terms => punct(terms, fmts.implicit),

    machine: terms => textFromTerms(terms, opts, false),
    root: terms => textFromTerms(terms, { ...opts, form: 'root' }, false),

    hash: terms => md5(punct(terms)),

    offset: terms => {
      const len = fns$1.text(terms).length;
      // the text keeps leading punctuation but trims whitespace, so start where the text starts
      const raw = terms[0].pre + terms[0].text;
      const lead = terms[0].pre.length - (raw.length - raw.trimStart().length);
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start - lead,
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
    option = { ...defaults$3, ...option };
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

  // Output the requested format, or the default tags view
  const debug$1 = function (fmt) {
    const debugMethods = this.methods.one.debug || {};
    if (!fmt || !Object.hasOwn(debugMethods, fmt)) {
      fmt = 'tags';
    }
    debugMethods[fmt](this);
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
        if (Object.hasOwn(starts, t.id)) {
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
      const text = rawText(terms);
      const tags = terms.map(t => {
        const tag = slotForTerm(t, tagSet);
        return aliases[tag] || tag
      }).join(',');
      return `${text} {${tags}}`
    }).join('\n')
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

  // named output formats
  const outputs = {
    // text formats
    text: view => view.text(),
    normal: view => view.text('normal'),
    root: view => view.text('root'),
    machine: view => view.text('machine'),
    hash: view => md5(view.text()),
    // tagged-sentence format for LLMs (see docs/spec-format.md)
    spec: view => toSpec(view, view.world),
    // json data formats
    json: view => view.json(),
    offset: view => {
      view.compute('offset');
      return view.json({ offset: true })
    },
    array: view => view.docs.map(rawText).filter(str => str),
    // return terms sorted by frequency
    freq: view => topk(view.json({ normal: true }).map(o => o.normal)),
    // some handy ad-hoc outputs
    terms: view => view.docs.flatMap(terms => terms.map(t => t.text).filter(Boolean)),
    tags: view => {
      return view.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    },
    'best-tag': view => {
      view.compute('tagRank');
      return view.docs
        .map(ts => {
          return ts.map(t => (t.tagRank?.[0] ? `#${t.tagRank[0]}` : '')).join(' ')
        })
        .join('\n')
    },
    debug: view => view.debug(), //allow
  };
  // aliases
  outputs.reduced = outputs.machine;
  outputs.md5 = outputs.hash;
  outputs.offsets = outputs.offset;
  outputs.frequency = outputs.freq;
  outputs.topk = outputs.freq;

  /** some named output formats */
  const out = function (method) {
    // support custom outputs
    if (isObject(method)) {
      return wrap(this, method)
    }
    if (Object.hasOwn(outputs, method)) {
      return outputs[method](this)
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

  // a dash between two words, like '2025-05-11 - they'
  const spacedDash = /^\s+[-—]\s+$/;

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && Object.hasOwn(fmts, fmt)) {
        opts = { ...fmts[fmt] };
      } else if (fmt && isObject(fmt)) {
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

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!Object.hasOwn(model.one.tagSet, tag)) {
          return tag
        }
        // an unknown color should not break the output
        const paint = cli[model.one.tagSet[tag].color] || blue;
        return paint(tag)
      });
    }
    return tags.join(', ')
  };

  // browser consoles get a collapsible table per sentence
  const showClient = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      const out = m.docs[0].map(t => {
        const text = t.implicit ? '[' + t.implicit + ']' : t.text || '-';
        return { text, tags: '[' + Array.from(t.tags).join(', ') + ']' }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };

  const showTags = function (view) {
    if (typeof window !== 'undefined' && window.document) {
      showClient(view);
      return
    }
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
        if (t.frozen === true) {
          word += ' ❄️';
        }
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

  // each match on its own line: green, inside its grey sentence, aligned at the middle column
  const width = 55;
  const half = 27;
  const dots = '…';

  // drop words from the outer edge until the side fits, leaving room for an ellipsis
  const fit = (arr, max, fromStart) => {
    let cut = false;
    const size = () => (fromStart ? arr.join('').trimStart() : arr.join('').trimEnd()).length + (cut ? 2 : 0);
    while (arr.length > 0 && size() > max) {
      if (fromStart) {
        arr.shift();
      } else {
        arr.pop();
      }
      cut = true;
    }
    return cut
  };

  // the padded context before the match, the match, and the context after it
  const parts$1 = (terms, start, end) => {
    const arrs = [[], [], []]; // before, match, after
    terms.forEach((t, i) => {
      const str = (t.pre + t.text + t.post).replace(/\s+/g, ' ');
      const arr = arrs[(i >= start ? 1 : 0) + (i >= end ? 1 : 0)];
      // blank terms fold into the word before them
      if (str.trim() === '' && arr.length > 0) {
        arr[arr.length - 1] = (arr.at(-1) + str).replace(/\s+/g, ' ');
      } else {
        arr.push(str);
      }
    });
    const [before, match, after] = arrs;
    const left = (fit(before, half, true) ? dots + ' ' : '') + before.join('').trimStart();
    let mid = match.join('');
    const cutR = fit(after, width - half - mid.length, false);
    const right = after.join('').trimEnd() + (cutR ? ' ' + dots : '');
    if (right === '') {
      mid = mid.trimEnd();
    }
    return [' '.repeat(Math.max(0, half - left.length)) + left, mid, right]
  };

  const showHighlight = function (view) {
    const client = typeof window !== 'undefined' && window.document;
    view.fullPointer.forEach(([n, s, e]) => {
      const [left, mid, right] = parts$1(view.document[n], s, e);
      if (client) {
        console.log('%c' + left + '%c' + mid + '%c' + right, 'color:grey', 'color:green', 'color:grey');
      } else {
        console.log(grey(left) + green(mid) + (right ? grey(right) : ''));
      }
    });
  };

  const debug = {
    tags: showTags,
    chunks: showChunks,
    highlight: showHighlight,
  };

  const lastBrace = /\{(?=[^{]*$)/; // split on the last { only
  const comment = /\}[ \t]*#(.*)$/s; // an optional '# comment' after the last {tags} block


  // parse the spec output
  const parseLine = function (line = '') {
    let [text, tags] = line.split(lastBrace); // eslint-disable-line prefer-const
    if (tags === undefined) {
      const note = text.match(/\s#(.*)$/s)?.[1] || '';
      // no {tags} block on this line
      return { text: text.replace(/\s#.*$/s, '').trim(), tags: null, comment: note.trim() }
    }
    const note = (tags.match(comment)?.[1] || '').trim();
    tags = tags.replace(comment, '}'); // drop the comment - only ever one, always last
    tags = tags.split(',').map(tag => tag.trim());
    const lastTag = tags[tags.length - 1];
    tags[tags.length - 1] = lastTag.replace(/\}$/, '');
    tags = tags.map(tag => tag.split('|').map(t => t.trim()));
    if (tags.length === 1 && tags[0].length === 1 && tags[0][0] === '') {
      tags = []; // empty '{}'; retain empty slots in nonempty lists
    }
    return { text: text.trim(), tags, comment: note }
  };

  // parse a whole spec into [{ line, text, tags, comment }], skipping blank and comment lines
  const parseSpec = function (spec = '') {
    const list = [];
    spec.split('\n').forEach((str, i) => {
      if (str.trim() && !/^\s*#/.test(str)) {
        list.push({ line: i + 1, ...parseLine(str) });
      }
    });
    return list
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

  // Diagnostics describe the original parse, before the returned View is mutated.
  const specFailures = (doc, slots, aliases) => {
    const terms = doc.docs.flat();
    const patterns = slots.map(slot => toMatchString([slot], aliases));
    const pattern = toMatchString(slots, aliases);
    if (terms.length === slots.length && pattern !== null && doc.has(pattern)) {
      return [] // valid
    }
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

  // one ✓ or ✗ line per spec line, for verbose mode
  const logLine = (text, tags, detail) => {
    const block = tags === null ? '' : ` {${tags.map(slot => slot.join('|')).join(',')}}`;
    if (detail) {
      return `${red('✗')} ${text}${dim(block)} - ${red(detail)}`
    }
    return `${green('✓')} ${green(dim(text))}${dim(block)}`
  };

  const fromSpec = function (spec, { tags: tagMode = 'ignore', failures: failureMode = 'ignore', verbose = false } = {}) {
    if (!['ignore', 'use'].includes(tagMode) || !['ignore', 'throw', 'retain', 'log'].includes(failureMode)) {
      throw new Error('Invalid fromSpec options')
    }
    const aliases = this.world().model.one.tagAliases;
    const result = this('');
    result.failures = [];
    parseSpec(spec).forEach(({ line, text, tags }) => {
      const doc = tagMode === 'use' ? this.tokenize(text) : this(text);
      let failures = [];
      if (tags !== null && (tagMode === 'use' || failureMode !== 'ignore')) {
        const count = doc.docs.reduce((sum, terms) => sum + terms.length, 0);
        const pattern = toMatchString(tags, aliases);
        // Assigning slots is unsafe when the shape or syntax is invalid.
        const canApply = count === tags.length && pattern !== null;
        if (tagMode === 'use' && !canApply && failureMode !== 'log') {
          const invalid = specFailures(doc, tags, aliases);
          throw new Error(`${text} - ${invalid.map(failure => failure.message).join('; ')}`)
        }
        if (tagMode === 'use') {
          applyTags(doc, canApply ? tags : null, aliases);
        }
        if (failureMode !== 'ignore') {
          failures = specFailures(doc, tags, aliases)
            .map(failure => ({ line, text, ...failure }));
          result.failures.push(...failures);
        }
      } else if (tagMode === 'use') {
        applyTags(doc, null, aliases);
      }
      const detail = failures.map(failure => failure.message).join('; ');
      if (failureMode === 'log' && failures.length > 0) {
        console.error(logSpec(doc, tags, failures, aliases)); //eslint-disable-line no-console
      } else if (verbose || debug$2.spec) {
        console.log(logLine(text, tags, detail)); //eslint-disable-line no-console
      }
      if (failures.length > 0 && failureMode === 'throw') {
        throw new Error(`${text} - ${detail}`)
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
        parseSpec,
      },
    },
  };

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
      // look up a sentence, then down one
      for (const k of [n - i, n + i]) {
        if (doc[k]) {
          const index = doc[k].findIndex(term => term.id === id);
          if (index !== -1) {
            return [k, index]
          }
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
      ptr[2] = newEnd + 1; // repair ending pointer, which is exclusive
    }
    return document[n].slice(start, ptr[2])
  };

  /** return a subset of the document, from a pointer */
  const getDoc = function (ptrs, document) {
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
          // the ending may have moved too, if its term still exists
          endId = document[wild[0]].some(term => term.id === endId) ? endId : undefined;
          ptr = [wild[0], wild[1], wild[1] + len, startId, endId];
          ptrs[i] = ptr;
        } else {
          // our start-term was deleted (replaced?) - trust the index, and adopt the term now there
          terms = terms.slice(start, end);
          ptr[3] = terms[0] ? terms[0].id : null;
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
  const termList = docs => docs.flat();

  var methods$6 = {
    one: {
      termList,
      getDoc,
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

  // a new view from the pointers
  const toView = (view, ptrs) => view.toView(addIds(ptrs, view.document));

  // combine our pointers with another view's
  const setOp = fn => function (m) {
    m = getDoc$1(m, this);
    return toView(this, fn(this.fullPointer, m.fullPointer))
  };

  const methods$5 = {};

  // all parts, minus duplicates
  methods$5.union = setOp(getUnion);
  methods$5.and = methods$5.union;

  // only parts they both have
  methods$5.intersection = setOp(getIntersection);

  // only parts of a that b does not have
  methods$5.not = setOp(subtract);
  methods$5.difference = methods$5.not;

  // get opposite of a match
  methods$5.complement = function () {
    return toView(this, subtract(this.all().fullPointer, this.fullPointer))
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

  const api$d = function (View) {

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
            term.index[1] + len
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

  // strip the '#', then follow any alias
  const resolveTag = (tag, aliases) => {
    tag = tag.replace(/^#/, '');
    return aliases?.[tag] || tag
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
      return value.trim().split(/ +/).map(name => resolveTag(name, aliases)).join(' ')
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
      // support AND (foo && tag) - but an optional or negative block requires nothing
      if (reg.operator === 'and' && reg.choices && !reg.optional && !reg.negative) {
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

  const parse$3 = function (matches, world) {
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
      obj.minLength = getMinLength(obj.regs);
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
    matches = parse$3(matches, world);

    // collect by wants and needs
    const hooks = {};
    matches.forEach(obj => {
      // add needs, then wants
      obj.needs.concat(obj.wants).forEach(str => {
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
  const runMatch = function (maybeList, document, methods, opts) {
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
            results.push({ ...m, pointer: ptr });
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
    const results = runMatch(maybeList, document, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };

  // quick check if this tag will require any untagging
  const canBe$1 = function (term, tag, tagSet) {
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

  // is this tag consistent with the tags they already have?
  const canBe = (terms, tag, model) => terms.every(term => canBe$1(term, tag, model.one.tagSet));

  const tagger$2 = function (list, document, world) {
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
        if (canBe(terms, todo.tag, model) === false) {
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
    bulkTagger: tagger$2
  };

  var sweep = {
    lib: lib$2,
    api: api$d,
    methods: {
      one: methods$4,
    }
  };

  const isMulti = / /;

  const addChunk = function (term, tag) {
    if (tag === 'Noun' || tag === 'Verb') {
      term.chunk = tag;
    }
  };

  // eslint-disable-next-line max-params
  const tagTerm = function (term, tag, tagSet, isSafe, validated, reason) {
    // does it already have this tag?
    if (term.tags.has(tag)) {
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
    const previous = debug$2.tags ? debug$2.before(term) : null;
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
      debug$2.log(term, previous, reason);
    }
    return true
  };

  // support '#Noun . #Adjective' syntax
  // eslint-disable-next-line max-params
  const multiTag = function (terms, tagString, tagSet, aliases, isSafe, reason) {
    const tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      const tag = tags[i];
      if (tag) {
        tagTerm(term, resolveTag(tag, aliases), tagSet, isSafe, undefined, reason);
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
    if (Array.isArray(tag)) {
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
    tag = resolveTag(tag, world.model.one.tagAliases);
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
      const previous = debug$2.tags ? debug$2.before(term) : null;
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        if (previous) {
          debug$2.log(term, previous, reason);
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
        debug$2.log(term, previous, reason);
      }
    }
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
          console.warn(`[Graph] - missing node '${node.parent}'`); // eslint-disable-line no-console
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
    // the graph's nodes, parents first
    toArray() {
      // fillDown changes properties, so the cached graph relationships still hold.
      return toArray$1(this.json)
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
    const each = fn => Object.keys(res).forEach(fn);
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
    each(resolveParents);
    each(tag => {
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          res[parent].children.push(tag);
        }
      });
    });

    // Inherit exclusions through every parent, then exclude all descendants of
    // each conflicting tag. Read a snapshot to keep this independent of order.
    const exclusions = {};
    each(tag => { exclusions[tag] = res[tag].not; });
    each(k => {
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
    // add an implicit entry for any tag we reference
    const ensure = tag => {
      if (!Object.hasOwn(tags, tag)) {
        tags[tag] = {};
      }
    };
    Object.keys(tags).forEach(k => {
      const o = tags[k];
      // support deprecated fmts
      if (o.isA) {
        o.is = o.isA;
      }
      if (o.notA) {
        o.not = o.notA;
      }
      if (typeof o.is === 'string') {
        o.is = resolve(o.is);
      }
      if (o.also) {
        o.also = toArr(o.also).map(resolve);
      }
      if (o.not) {
        o.not = toArr(o.not).map(resolve);
      }
      // add any implicit 'is' tags
      if (o.is && typeof o.is === 'string') {
        ensure(o.is);
      }
      // Additional parents need entries too, including parents introduced by plugins.
      toArr(o.also).forEach(ensure);
      // add any implicit 'not' tags
      toArr(o.not).forEach(ensure);
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
      const o = tags[k];
      if (o.aliases !== undefined) {
        o.aliases = toArr(o.aliases);
      }
      o.children = toArr(o.children);
      o.not = toArr(o.not);
      if (o.also) {
        o.also = toArr(o.also);
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
    return graph$1.toArray()
  };

  const fromUser = function (tags) {
    Object.entries(tags).forEach(([k, v]) => {
      tags[k] = { ...v, novel: true };
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
      canBe: canBe$1,
    },
  };

  // shared guards - returns the terms to change, or null
  const prep = function (view, input) {
    if (!view.found || !input) {
      return null
    }
    const terms = view.termList();
    if (terms.length === 0) {
      return null
    }
    return terms
  };

  const fns = {
    /** add a given tag, to all these terms */
    tag: function (input, reason = '', isSafe) {
      const terms = prep(this, input);
      if (terms) {
        this.methods.one.setTag(terms, input, this.world, isSafe, reason);
        this.uncache();
      }
      return this
    },

    /** add a given tag, only if it is consistent */
    tagSafe: function (input, reason = '') {
      return this.tag(input, reason, true)
    },

    /** remove a given tag from all these terms */
    unTag: function (input, reason) {
      const terms = prep(this, input);
      if (terms) {
        const { methods, model } = this;
        const { tagSet, tagAliases } = model.one;
        const list = Array.isArray(input) ? input : [input];
        list.forEach(tag => methods.one.unTag(terms, resolveTag(tag.trim(), tagAliases), tagSet, reason));
        this.uncache();
      }
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      const { tagSet, tagAliases } = this.model.one;
      tag = resolveTag(tag, tagAliases);
      const canBe = this.methods.one.canBe;
      const nope = [];
      eachTerm(this.document, (term, terms, i, n) => {
        if (!canBe(term, tag, tagSet)) {
          nope.push([n, i, i + 1]);
        }
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
    eachTerm(document, term => {
      const tags = Array.from(term.tags);
      term.tagRank = sortByKids(tags, tagSet);
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
  const hasLetter$2 = /[\p{L}\p{N}\p{So}]/u;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    const chunks = [];
    let lead = ''; // whitespace+punctuation, before the first chunk
    for (let i = 0; i < splits.length; i++) {
      const s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (!hasSomething$1.test(s) || !hasLetter$2.test(s)) {
        //add it to the last one
        if (chunks[chunks.length - 1]) {
          chunks[chunks.length - 1] += s;
          continue
        } else if (splits[i + 1]) {
          //add it to the next one
          lead += s;
          continue
        }
      }
      //else, only whitespace, no terms, no sentence
      chunks.push(lead + s);
      lead = '';
    }
    return chunks
  };

  const hasLetter$1 = /\p{L}/u;

  const hasNewline = function (c) {
    return Boolean(/\n$/.test(c))
  };

  //loop through these chunks, and join the non-sentence chunks back together..
  // (only check the end of the joined text - re-reading it for every chunk is quadratic)
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    const sentences = [];
    let sentence = '';
    let tail = '';
    let foundLetter = false;
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      sentence += c;
      tail = (tail + c).slice(-64);
      foundLetter ||= hasLetter$1.test(c);
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && !isSentence(tail, abbrevs, foundLetter) && !hasNewline(c)) {
        continue
      }
      //this chunk is a proper sentence..
      if (sentence.length > 0) {
        sentences.push(sentence);
      }
      sentence = '';
      tail = '';
      foundLetter = false;
    }
    return sentences
  };

  // merge embedded quotes into 1 sentence
  // like - 'he said "no!" and left.'
  const MAX_QUOTE = 280; // ¯\_(ツ)_/¯
  const MAX_AHEAD = 5;

  // each opening quote, and the marks that may close it
  // (some marks open a quote in one language, and close it in another)
  // a third mark means 'not an opener, when that one is around'
  // don't support single-quotes for multi-sentences
  const pairs$3 = [
    ['\u0022', '\u0022'], // straight
    ['\uFF02', '\uFF02'], // wide
    ['\u201C', '\u201D', '\u201E'], // english (but it closes a german one)
    ['\u201F', '\u201D'], // reversed
    ['\u201E', '\u201D\u201C'], // polish, german
    ['\u2E42', '\u201D'], // low-reversed
    ['\u201A', '\u2019\u2018'], // low-single, german
    ['\u00AB', '\u00BB'], // french
    ['\u00BB', '\u00AB'], // german
    ['\u2039', '\u203A'], // single
    ['\u203A', '\u2039'], // single, reversed
    ['\u2035', '\u2032'], // prime
    ['\u2036', '\u2033'], // double-prime
    ['\u2037', '\u2034'], // triple-prime
    ['\u301D', '\u301E'], // prime
    ['\u301F', '\u301E'], // low-prime
    ['\u300C', '\u300D'], // corner
    ['\u300E', '\u300F'], // white-corner
  ];

  const count$1 = function (str, chars) {
    let n = 0;
    for (const c of str) {
      if (chars.includes(c)) {
        n += 1;
      }
    }
    return n
  };

  // is there a quotation here, that hasn't closed yet?
  const isOpen = function (str) {
    return pairs$3.some(([open, close, unless]) => {
      const n = count$1(str, open);
      if (n === 0 || (unless && str.includes(unless))) {
        return false
      }
      // the same mark opens and closes
      if (open === close) {
        return n % 2 === 1
      }
      return n > count$1(str, close)
    })
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      let str = splits[i];
      if (isOpen(str)) {
        // look ahead for the sentence that closes it
        let toAdd = '';
        for (let n = i + 1; n < splits.length && n - i <= MAX_AHEAD; n += 1) {
          toAdd += splits[n];
          //make sure it's not too-long
          if (toAdd.length >= MAX_QUOTE) {
            break
          }
          if (!isOpen(str + toAdd)) {
            // merge them all
            str += toAdd;
            i = n;
            break
          }
        }
      }
      arr.push(str);
    }
    return arr
  };

  const MAX_LEN = 250;// ¯\_(ツ)_/¯

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen$2 = /[(\uFF08]/g;
  const hasClosed$2 = /[)\uFF09]/g;
  const mergeParens = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      const m = split.match(hasOpen$2);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          const m2 = splits[i + 1].match(hasClosed$2);
          if (m2 !== null && m.length === 1 && !hasOpen$2.test(splits[i + 1])) {
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
    if (!text || typeof text !== 'string' || !hasSomething.test(text)) {
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

  const notWord = new Set(toList(`
.
?
!
:
;
-
–
—
--
...
(
)
[
]
"
'
\`
«
»
*
•
`));

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
      if (hasHyphen$1(words[i], model)) {
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
      if (wordlike.test(word) && !notWord.has(word) && !isBoundary.test(word)) {
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
  const isMark = /\p{Mark}/u;
  const isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['’]$/;
  // a leading apostrophe that stands for letters - 'tis, 'em, 'cause
  const elision = /^['’](tis|twas|em|cause|til|bout|round)\b/i;
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
    const trimmed = str.trim();
    let pre = '';
    let post = '';
    const chars = Array.from(str);
    let start = 0;
    let end = chars.length;

    // punctuation-only words, like '<3'
    if (Object.hasOwn(emoticons, trimmed)) {
      return { str: trimmed, pre, post: ' ' } //not great
    }

    // Locate the first retained code point without shifting the array.
    while (start < end) {
      const c = chars[start];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        break//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-' || c === '(') && isFullNumber.test(trimmed)) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // keep an elided apostrophe - 'tis
      if ((c === "'" || c === '’') && elision.test(chars.slice(start).join(''))) {
        break//keep it
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
      // Keep marks attached to letters, but not variation selectors after symbols.
      if (isMark.test(c)) {
        let base = end - 2;
        while (base >= start && isMark.test(chars[base])) {
          base--;
        }
        if (base >= start && isLetter.test(chars[base])) {
          break
        }
        end = base + 1;
        continue
      }
      // F.B.I.
      if (c === '.' && hasAcronym.test(original)) {
        break//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original)) {
        break//keep it
      }
      // keep '+' or ')' only for a number like (800) or 500+
      if ((c === '+' || c === ')') && isFullNumber.test(trimmed)) {
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
    if (!/^[:;]/.test(str)) {
      str = trimPunctuation(str, /[",.!:;?)]/);
      str = str.replace(/^['’"(]+/g, '');
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
  const acronyms = [
    /^([A-Z]\.)+[A-Z]?,?$/, //like N.D.A
    /^([a-z]\.)+[a-z]\.?$/, //like c.e.o
    /^[A-Z]\.,?$/, //like 'F.'
    /^[A-Z]{2,}('s|,)?$/, //like NDA
  ];

  const isAcronym$2 = str => acronyms.some(re => re.test(str));

  const doAcronym = function (str) {
    if (isAcronym$2(str)) {
      str = str.replace(/\./g, '');
    }
    return str
  };

  const normalize = function (term, world) {
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
  const parse$2 = function (input, world) {
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
        normalize(t, world);
      });
      return terms
    });
    return input
  };

  const isAcronym$1 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse = /(?:\u2026|\.{2}) *$/; // '...'
  const hasLetter = /\p{L}/u;
  const hasPeriod = /\. *$/;
  const leadInit = /^\p{Lu}\. $/u; // "W. Kensington"
  // an initial in any alphabet - 'А. С. Пушкин'
  const isInitial = /[ .]\p{Lu}\. *$/u;

  /** does this look like a sentence? - str can be the end of it, if foundLetter is given */
  const isSentence = function (str, abbrevs, foundLetter = hasLetter.test(str)) {
    // must have a letter
    if (foundLetter === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$1.test(str) || isInitial.test(str)) {
      return false
    }
    // check for leading initial - "W. Kensington"
    if (str.length === 3 && leadInit.test(str)) {
      return false
    }
    //check for '...'
    if (hasEllipse.test(str)) {
      return false
    }
    const txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    const words = txt.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.' (and not mr?)
    if (Object.hasOwn(abbrevs, lastWord) && hasPeriod.test(str)) {
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
        fromString: parse$2,
      },
    },
  };

  const aliases$1 = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
    'plz': 'please',
    'bein': 'being',
  };

  // prob=probably, pron=pronunciation, gal=gallon, fig=figure, lat/lng=latitude/longitude,
  // vol=volume, fm (not am), def=definition, plz=please, ea=each, sec=second, pref=preface,
  // pl=plural, pp=pages, qt=quarter, fr=french, nee=given name at birth, ss=ship or sections,
  // ver=version, fem/masc, eng=engineering/english, adj/vb/rb/inf=grammar, situ/vivo/vitro=in situ..
  // wr=world record
  var misc$3 = toList(`
approx
apt
bc
cyn
eg
esp
est
etc
ex
exp
prob
pron
gal
min
pseud
fig
jd
lat
lng
vol
fm
def
misc
plz
ea
ps
sec
pt
pref
pl
pp
qt
fr
sq
nee
ss
tel
temp
vet
ver
fem
masc
eng
adj
vb
rb
inf
situ
vivo
vitro
wr
`);

  // (not miss, misses)
  var honorifics$1 = toList(`
adj
adm
adv
asst
atty
bldg
brig
capt
cmdr
comdr
cpl
det
dr
esq
gen
gov
hon
jr
llb
lt
maj
messrs
mlle
mme
mr
mrs
ms
mstr
phd
prof
pvt
rep
reps
res
rev
sen
sens
sfc
sgt
sir
sr
supt
surg
`);

  var months = toList(`
jan
feb
mar
apr
jun
jul
aug
sep
sept
oct
nov
dec
`);

  var nouns$3 = toList(`
ad
al
arc
ba
bl
ca
cca
col
corp
ft
fy
ie
lit
ma
md
pd
tce
`);

  var organizations = toList(`
dept
univ
assn
bros
inc
ltd
co
`);

  // streets, then states/provinces (not ct)
  var places = toList(`
rd
st
dist
mt
ave
blvd
cl
cres
hwy
ariz
cal
calif
colo
conn
fla
fl
ga
ida
ia
kan
kans
minn
neb
nebr
okla
penna
penn
pa
dak
tenn
tex
ut
vt
va
wis
wisc
wy
wyo
usafa
alta
ont
que
sask
`);

  // units that are abbreviations too (not ft, gb, pa - ambiguous)
  // dm=decimeter, hr/hrs=hour, dg/cg/mg/µg=grams, lb=pound, oz=ounce, hz=hertz,
  // mps=meters per second, kmph=kilometers per hour, kb/mb/tb/yb=bytes, lx=lux, lm=lumen
  var units = toList(`
dl
ml
gal
qt
pt
tbl
tsp
tbsp
km
dm
cm
mm
mi
td
hr
hrs
kg
hg
dg
cg
mg
µg
lb
oz
sq ft
hz
mps
mph
kmph
kb
mb
tb
lx
lm
fl oz
yb
`);

  // add our abbreviation list to our lexicon
  const list$1 = [
    [misc$3],
    [units, 'Unit'],
    [nouns$3, 'Noun'],
    [honorifics$1, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  const abbreviations$1 = {};
  // add them to a future lexicon
  const lexicon$2 = {};

  list$1.forEach(a => {
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
  //  'mid-century', 'pre-history', 'out-lived', 'ex-wife'
  // (not counter, mid, non, over, post, semi, super, ultra, under, whole)
  var prefixes = toHash(toList(`
anti
bi
co
contra
de
extra
infra
inter
intra
macro
micro
mis
mono
multi
peri
pre
pro
proto
pseudo
re
sub
supra
trans
tri
un
out
ex
`));

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'  (not fold)
  var suffixes = toHash(toList(`
like
ish
less
able
elect
type
designate
`));

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

  // zero-width chars
  const zeroWidth = '\u200B\u200C\u200D\uFEFF';

  // punctuation to keep at start of word - #hastag, @atmention, underscore
  // (not +4, -4, .4)
  const prePunctuation = toHash(('#@_°' + zeroWidth).split(''));

  // punctuation to keep at end of word - 88%, underscore, degrees/italian ordinal
  const postPunctuation = toHash(('%_°' + zeroWidth).split(''));

  const emoticons = toHash('<3 </3 <\\3 :^P :^p :^O :^3'.split(' '));

  var model$3 = {
    one: {
      aliases: aliases$1,
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

  const hasSlash$1 = /\//;
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
    if (hasSlash$1.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      const arr = str.split(hasSlash$1);
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

  const hasDash$1 = /^\p{Letter}+-\p{Letter}+$/u;
  // 'machine' is a normalized form that looses human-readability
  const doMachine = function (term) {
    let str = term.implicit || term.normal || term.text;
    // remove apostrophes
    str = str.replace(/['’]s$/, '');
    str = str.replace(/s['’]$/, 's');
    //lookin'->looking (make it easier for conjugation)
    str = str.replace(/([aeiou][ktrp])in'$/, '$1ing');
    //turn re-enactment to reenactment
    if (hasDash$1.test(str)) {
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
    eachTerm(docs, term => {
      const word = term.machine || term.normal;
      counts[word] ??= 0;
      counts[word] += 1;
    });
    // add counts on each term
    eachTerm(docs, term => {
      term.freq = counts[term.machine || term.normal];
    });
  };

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    //start from the actual-top
    eachTerm(view.document, term => {
      term.offset = {
        index: index,
        start: elapsed + term.pre.length,
        length: term.text.length,
      };
      elapsed += term.pre.length + term.text.length + term.post.length;
      index += 1;
    });
  };

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    eachTerm(view.document, (term, terms, t, n) => {
      term.index = [n, t];
    });
  };

  const wordCount = function (view) {
    let n = 0;
    eachTerm(view.docs, term => {
      //skip implicit words
      if (term.normal !== '') {
        n += 1;
        term.wordCount = n;
      }
    });
  };

  // cheat-method for a quick loop
  const termLoop = (view, fn) => eachTerm(view.docs, term => fn(term, view.world));

  const methods$1 = {
    alias: (view) => termLoop(view, addAliases),
    machine: (view) => termLoop(view, doMachine),
    normal: (view) => termLoop(view, normalize),
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

  const api$c = function (View) {
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
        if (Object.hasOwn(existing, prefix)) {
          collisions.push(prefix);
          continue
        }
        if (Object.hasOwn(index, prefix)) {
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

  const defaults$2 = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    const model = this.model();
    opts = { ...defaults$2, ...opts };
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
    api: api$c,
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
  nlp.plugin(plugin$1); //~6kb
  nlp.extend(tokenize); //7kb
  nlp.extend(freeze); //
  nlp.plugin(cache$3); //~1kb
  nlp.extend(lookup); //7kb
  nlp.extend(typeahead); //1kb
  nlp.extend(lexicon$3); //1kb
  nlp.extend(sweep); //1kb

  const getWords = function (net) {
    return Object.keys(net.hooks).filter(w => !w.startsWith('#') && !w.startsWith('%'))
  };

  const maybeMatch = function (doc, net) {
    // must have *atleast* one of these words
    const words = getWords(net);
    if (words.length === 0) {
      return doc
    }
    if (!doc._cache) {
      doc.cache();
    }
    const cache = doc._cache;
    // return sentences that have one of our needed words
    return doc.filter((_m, i) => {
      return words.some(str => cache[i].has(str))
    })
  };

  // tokenize first, then only tag sentences required
  const lazy = function (input, reg) {
    let net = reg;
    if (typeof reg === 'string') {
      net = this.buildNet([{ match: reg }]);
    }
    const doc = this.tokenize(input);
    const m = maybeMatch(doc, net);
    if (m.found) {
      m.compute(['index', 'tagger']);
      return m.match(reg)
    }
    return doc.none()
  };

  var lazy$1 = {
    lib: {
      lazy,
    },
  };

  // Preferred alias identifiers holding canonical tag names.
  // NN is the umbrella noun tag; Sing is specifically singular.
  const NN = 'Noun';
  const Sing = 'Singular';
  const Plur = 'Plural';
  const Prop = 'ProperNoun';
  const Pron = 'Pronoun';

  const Adj = 'Adjective';
  const Comp = 'Comparative';
  const Adv = 'Adverb';
  const Det = 'Determiner';

  const Vb = 'Verb';
  const Inf = 'Infinitive';
  const Past = 'PastTense';
  const Ger = 'Gerund';
  const Pres = 'PresentTense';
  const Fut = 'FutureTense';

  const Cop = 'Copula';
  const Phrasal = 'PhrasalVerb';
  const Conj = 'Conjunction';
  const Prep = 'Preposition';
  const Expr = 'Expression';
  const QW = 'QuestionWord';

  const Pers = 'Person';
  const Place = 'Place';
  const Org = 'Organization';
  const First = 'FirstName';
  const Last = 'LastName';
  const MaleName = 'MaleName';
  const FemaleName = 'FemaleName';
  const Uncountable = 'Uncountable';
  const SportsTeam = 'SportsTeam';
  const Country = 'Country';
  const City = 'City';
  const Region = 'Region';

  const Val = 'Value';
  const Card = 'Cardinal';
  const Ord = 'Ordinal';
  const TxtNum = 'TextValue';
  const Numeric = 'NumericValue';
  const RomanNumeral = 'RomanNumeral';
  const Frac = 'Fraction';

  const Date = 'Date';
  const WeekDay = 'WeekDay';
  const Year = 'Year';
  const FinancialQuarter = 'FinancialQuarter';
  const Season = 'Season';
  const Time = 'Time';
  const Timezone = 'Timezone';

  const Connector = 'Connector';
  const Abbr = 'Abbreviation';
  const Acronym = 'Acronym';
  const HashTag = 'HashTag';
  const AtMention = 'AtMention';

  const Emoji = 'Emoji';
  const Emoticon = 'Emoticon';
  const SlashedTerm = 'SlashedTerm';
  const Email = 'Email';
  const PhoneNumber = 'PhoneNumber';
  const Url = 'Url';

  const entity = [Pers, Place, Org];

  var nouns$2 = {
    Noun: {
      aliases: [null, 'NN'],
      not: [Vb, Adj, Adv, Val, Det],
    },
    Singular: {
      aliases: [null, 'Sing', 'SG', 'NN1'],
      is: NN,
      not: [Plur, Uncountable],
    },
    // 'Canada'
    ProperNoun: {
      aliases: ['Prop', 'NNP', 'PROPN', 'NP0'],
      is: NN,
    },
    Person: {
      aliases: [null, 'Pers'],
      is: Sing,
      also: [Prop],
      not: [Place, Org, Date],
    },
    FirstName: {
      aliases: [null, 'First'],
      is: Pers,
    },
    MaleName: {
      is: First,
      not: [FemaleName, Last],
    },
    FemaleName: {
      is: First,
      not: [MaleName, Last],
    },
    LastName: {
      aliases: [null, 'Last'],
      is: Pers,
      not: [First],
    },
    // 'dr.'
    Honorific: {
      aliases: ['Hon'],
      is: Pers,
      not: [First, Last, Val],
    },
    Place: {
      is: Sing,
      not: [Pers, Org],
    },
    Country: {
      is: Place,
      also: [Prop],
      not: [City],
    },
    City: {
      is: Place,
      also: [Prop],
      not: [Country],
    },
    // 'california'
    Region: {
      is: Place,
      also: [Prop],
    },
    Address: {
      aliases: ['Addr'],
      // is: 'Place',
    },
    Organization: {
      aliases: ['Org'],
      is: Prop,
      not: [Pers, Place],
    },
    SportsTeam: {
      aliases: [null, 'Team'],
      is: Org,
    },
    School: {
      is: Org,
    },
    Company: {
      is: Org,
    },
    Plural: {
      aliases: [null, 'Plur', 'NNS', 'PL', 'NN2'],
      is: NN,
      not: [Sing, Uncountable],
    },
    // 'gravity'
    Uncountable: {
      is: NN,
    },
    // 'it'
    Pronoun: {
      aliases: [null, 'Pron', 'PRP', 'PRON'],
      is: NN,
      not: entity,
    },
    // 'swimmer'
    Actor: {
      is: NN,
      not: [Place, Org],
    },
    // walking
    Activity: {
      is: NN,
      not: [Pers, Place],
    },
    // kilometres
    Unit: {
      is: NN,
      not: entity,
    },
    // canadian
    Demonym: {
      aliases: [null, 'Dem'],
      is: NN,
      also: [Prop],
      not: entity,
    },
    // [spencer's] hat
    Possessive: {
      aliases: ['Poss'],
      is: NN,
    },
    // 'yourself'
    Reflexive: {
      aliases: [null, 'Refl'],
      is: Pron,
    },
  };

  var verbs$2 = {
    Verb: {
      aliases: ['Vb', 'V', 'VB'],
      not: [NN, Adj, Adv, Val, Expr],
    },
    // 'he [walks]'
    PresentTense: {
      aliases: ['Pres', 'PRS'],
      is: Vb,
      not: [Past, Fut],
    },
    // 'will [walk]'
    Infinitive: {
      aliases: ['Inf', 'VVI'],
      is: Pres,
      not: [Ger],
    },
    // '[walk] now!'
    Imperative: {
      aliases: ['Imp'],
      is: Vb,
      not: [Past, Ger, Cop],
    },
    // walking
    Gerund: {
      aliases: ['Ger', 'VBG'],
      is: Pres,
      not: [Cop],
    },
    // walked
    PastTense: {
      aliases: ['Past', 'VBD', 'PST'],
      is: Vb,
      not: [Pres, Ger, Fut],
    },
    // will walk
    FutureTense: {
      aliases: ['Fut'],
      is: Vb,
      not: [Pres, Past],
    },
    // is/was
    Copula: {
      aliases: [null, 'Cop'],
      is: Vb,
    },
    // '[could] walk'
    Modal: {
      aliases: [null, 'Mod', 'MD'],
      is: Vb,
      not: [Inf],
    },
    // 'awaken'
    Participle: {
      aliases: [null, 'VBN'],
      is: Past,
    },
    // '[will have had] walked'
    Auxiliary: {
      aliases: ['Aux'],
      is: Vb,
      not: [Past, Pres, Ger, Conj],
    },
    // 'walk out'
    PhrasalVerb: {
      aliases: ['Phrasal', 'PhrV'],
      is: Vb,
    },
    // 'walk [out]'
    Particle: {
      aliases: [null, 'RP'],
      is: Phrasal,
      not: [Past, Pres, Cop, Ger],
    },
    // 'walked by'
    Passive: {
      aliases: [null, 'Pass'],
      is: Vb,
    },
  };

  // Written format is independent of quantity types such as Fraction or Money.
  var values$1 = {
    Value: {
      aliases: ['Val', 'Num'],
      not: [Vb, Adj, Adv],
    },
    Ordinal: {
      aliases: [null, 'Ord'],
      is: Val,
      not: [Card],
    },
    Cardinal: {
      aliases: [null, 'Card', 'CD'],
      is: Val,
      not: [Ord],
    },
    Fraction: {
      aliases: [null, 'Frac'],
      is: Val,
      not: [NN],
    },
    Multiple: {
      aliases: [null, 'Mult'],
      is: TxtNum,
    },
    RomanNumeral: {
      aliases: [null, 'RomNum'],
      is: Card,
    },
    TextValue: {
      aliases: [null, 'TxtNum'],
      is: Val,
      not: [Numeric, RomanNumeral],
    },
    NumericValue: {
      aliases: ['Numeric'],
      is: Val,
      not: [RomanNumeral],
    },
    Money: {
      is: Card,
    },
    Percent: {
      aliases: [null, 'Perc', 'Pct'],
      is: Val,
    },
  };

  // Calendar/clock components are distinct. Holiday and Duration describe spans
  // that can overlap components or one another (for example, 'Christmas Day').
  // Each exclusion pair is declared once; the tag compiler supplies reciprocity.
  var dates$1 = {
    Date: {
      not: [Vb, Adv, Adj],
    },
    Month: {
      is: Date,
      also: [NN],
      not: [WeekDay, Year, FinancialQuarter, Season, Time, Timezone],
    },
    WeekDay: {
      is: Date,
      also: [NN],
      not: [Year, FinancialQuarter, Season, Time, Timezone],
    },
    Year: {
      is: Date,
      not: [RomanNumeral, FinancialQuarter, Season, Time, Timezone],
    },
    FinancialQuarter: {
      is: Date,
      aliases: [null, 'Quarter'],
      not: [Frac, Season, Time, Timezone],
    },
    // 'easter'
    Holiday: {
      is: Date,
      also: [NN],
    },
    // 'summer'
    Season: {
      is: Date,
      not: [Time, Timezone],
    },
    Timezone: {
      is: Date,
      aliases: [null, 'Tz'],
      also: [NN],
      not: [Prop],
    },
    Time: {
      is: Date,
      not: [AtMention, Timezone],
    },
    // 'months'
    Duration: {
      aliases: [null, 'Dur'],
      is: Date,
      also: [NN],
    },
  };

  const anything = [NN, Vb, Adj, Adv, Val, QW];

  var misc$2 = {
    Adjective: {
      aliases: ['Adj', 'JJ', 'ADJ', 'AJ0'],
      not: [NN, Vb, Adv, Val],
    },
    Comparable: {
      is: Adj,
    },
    Comparative: {
      aliases: [null, 'Comp', 'JJR', 'AJC'],
      is: Adj,
    },
    Superlative: {
      aliases: [null, 'Sup', 'JJS', 'AJS'],
      is: Adj,
      not: [Comp],
    },
    NumberRange: {
      aliases: [null, 'NumRange'],
    },
    Adverb: {
      aliases: ['Adv', 'RB', 'ADV'],
      not: [NN, Vb, Adj, Val],
    },

    Determiner: {
      aliases: ['Det', 'DT', 'DET'],
      not: [NN, Vb, Adj, Adv, QW, Conj], //allow 'a' to be a Determiner/Value
    },
    Connector: {
      not: [NN, Vb, Adj, Adv, QW, Det],
    },
    Conjunction: {
      aliases: ['Conj', 'CC'],
      is: Connector,
      not: anything.concat([Prep]),
    },
    Preposition: {
      aliases: ['Prep', 'IN', 'ADP'],
      is: Connector,
      not: [NN, Vb, Adj, Adv, QW, Det, Conj],
    },
    QuestionWord: {
      aliases: [null, 'QW'],
      not: [Det],
    },
    Currency: {
      is: NN,
    },
    Expression: {
      aliases: ['Expr'],
      not: [NN, Adj, Vb, Adv],
    },
    Abbreviation: {
      aliases: ['Abbr'],
    },
    Url: {
      aliases: [null, 'URL'],
      not: [HashTag, Vb, Adj, Val, SlashedTerm, Email, PhoneNumber, AtMention, Emoji, Emoticon],
    },
    PhoneNumber: {
      not: [HashTag, Vb, Adj, Val, AtMention, Emoji, Emoticon],
    },
    HashTag: {},
    AtMention: {
      is: NN,
      not: [HashTag, Emoji, Emoticon],
    },
    Emoji: {
      not: [HashTag, Vb, Adj, Val, Emoticon],
    },
    Emoticon: {
      not: [HashTag, Vb, Adj, Val, SlashedTerm],
    },
    SlashedTerm: {
      not: [Emoticon, Url, Val]
    },
    Email: {
      not: [HashTag, Vb, Adj, Val, PhoneNumber, AtMention, Emoji, Emoticon],
    },
    Acronym: {
      not: [RomanNumeral, Pron, Date],
    },
    Negative: {
      aliases: [null, 'Neg'],
      not: [NN, Adj, Val, Expr],
    },
    Condition: {
      is: Connector,
      aliases: [null, 'Cond'],
      not: [Vb, Adj, NN, Val],
    },
    // existential 'there'
    There: {
      aliases: [null, 'EX'],
      not: [Vb, Adj, NN, Val, Conj, Prep],
    },
    // 'co-wrote'
    Prefix: {
      not: [Abbr, Acronym, Prop],
    },
    // hard-nosed, bone-headed
    Hyphenated: {},
  };

  const allTags = { ...nouns$2, ...verbs$2, ...values$1, ...dates$1, ...misc$2 };

  // Some finders retain the caller's document; others use the selected view's.
  const select = (View, find, originalDocument = false) => function (n) {
    const matches = typeof find === 'string' ? this.match(find) : find(this);
    const selected = matches.getNth(n);
    return new View(originalDocument ? this.document : selected.document, selected.pointer)
  };

  // name the View subclass, and have .update() return it, sharing the match cache
  const keepClass = (Cls, name) => {
    Cls.prototype.viewType = name;
    Cls.prototype.update = function (pointer) {
      const m = new this.constructor(this.document, pointer);
      m._cache = this._cache;
      m.world = this.world;
      return m
    };
  };

  // the json of each match, plus a parsed form under one key
  const jsonWith = (view, n, key, fn) => {
    const opts = typeof n === 'object' ? n : {};
    return view.getNth(n).map(p => {
      const json = p.toView().json(opts)[0];
      json[key] = fn(p);
      return json
    }, [])
  };

  const find$5 = function (doc) {
    let m = doc.splitAfter('@hasComma');
    m = m.match('#Hon+? #Pers+');
    // Spencer's King - but keep 'John Smith's' together
    const poss = m.match('#Poss+').notIf('(his|her)'); //her majesty ...
    m = m.splitAfter(poss);
    return m
  };

  const parse$1 = function (m) {
    const res = {};
    res.firstName = m.match('#First+');
    res.lastName = m.match('#Last+');
    res.honorific = m.match('#Hon+');

    const last = res.lastName;
    const first = res.firstName;
    if (!first.found || !last.found) {
      // let p = m.clone()
      // assume 'Mr Springer', or 'Vice President Springer' is a last-name
      if (!first.found && !last.found && m.has('^#Hon #Hon? .$')) {
        res.lastName = m.match('.$');
        return res
      }
    }
    return res
  };

  // gendered pronouns
  const she = '(she|her|hers)';

  /*
    Important notice - 
    this method makes many assumptions about gender-identity, in-order to assign grammatical gender.
    it should not be used for any other purposes, other than resolving pronouns in english
  */
  const m = 'male';
  const f = 'female';

  // known gendered honorifics
  const honorifics = {
    mr: m,
    mrs: f,
    miss: f,
    madam: f,

    // british stuff
    king: m,
    queen: f,
    duke: m,
    duchess: f,
    baron: m,
    baroness: f,
    count: m,
    countess: f,
    prince: m,
    princess: f,
    sire: m,
    dame: f,
    lady: f,

    ayatullah: m, //i think?

    congressman: m,
    congresswoman: f,
    'first lady': f,

    // marked as non-binary
    mx: null,
  };

  const predictGender = function (parsed, person) {
    const { firstName, honorific } = parsed;
    // use first-name as signal-signal
    if (firstName.has('#FemaleName')) {
      return f
    }
    if (firstName.has('#MaleName')) {
      return m
    }
    // use honorics as gender-signal
    if (honorific.found) {
      let hon = honorific.text('normal');
      hon = hon.replace(/\./g, ''); //clean it up a bit
      if (Object.hasOwn(honorifics, hon)) {
        return honorifics[hon]
      }
      // her excelency
      if (/^her /.test(hon)) {
        return f
      }
      if (/^his /.test(hon)) {
        return m
      }
    }
    // offer used-pronouns as a signal
    const after = person.after();
    if (!after.has('#Pers') && after.has('#Pron')) {
      const pro = after.match('#Pron');
      // manual use of gender-neutral
      if (pro.has('(they|their)')) {
        return null
      }
      const hasMasc = pro.has('(he|his)');
      const hasFem = pro.has(she);
      if (hasMasc && !hasFem) {
        return m
      }
      if (hasFem && !hasMasc) {
        return f
      }
    }
    return null
  };

  const addMethod = function (View) {
    /**
     *
     */
    class People extends View {
      parse(n) {
        return this.getNth(n).map(parse$1, [])
      }
      json(n) {
        return jsonWith(this, n, 'person', p => {
          // read the names from a copy, without its possessive - "Biden's" → 'biden'
          const tmp = p.clone();
          tmp.possessives().strip();
          const parsed = parse$1(tmp);
          return {
            firstName: parsed.firstName.text('normal'),
            lastName: parsed.lastName.text('normal'),
            honorific: parsed.honorific.text('normal'),
            presumed_gender: predictGender(parsed, p),
          }
        })
      }
      // used for co-reference resolution only
      presumedMale() {
        return this.filter(m => {
          return m.has('(#MaleName|mr|mister|sr|jr|king|pope|prince|sir)')//todo configure these in .world
        })
      }
      presumedFemale() {
        return this.filter(m => {
          return m.has('(#FemaleName|mrs|miss|queen|princess|madam)')
        })
      }
    }
    keepClass(People, 'People');

    View.prototype.people = select(People, find$5, true);
  };

  const find$4 = function (doc) {
    let m = doc.match('(#Place|#Address)+');

    // split all commas except for 'paris, france'
    let splits = m.match('@hasComma');
    splits = splits.filter(c => {
      // split 'europe, china'
      if (c.has('(asia|africa|europe|america)$')) {
        return true
      }
      // don't split 'paris, france'
      if (c.has('(#City|#Region|#Prop)$') && c.after('^(#Country|#Region)').found) {
        return false
      }
      return true
    });
    m = m.splitAfter(splits);
    return m
  };

  //combine them with .topics() method
  const find$3 = function (n) {
    // builds without the chunker have no .clauses()
    const r = this.clauses ? this.clauses() : this;
    // Find entities and acronyms without duplicating acronyms inside entities.
    let m = r.people();
    m = m.concat(r.places());
    m = m.concat(r.organizations());
    m = m.concat(r.match('#Acronym').ifNo(m));
    m = m.not('(someone|man|woman|mother|brother|sister|father)');
    //return them to normal ordering
    m = m.sort('seq');
    // m = m.unique()
    m = m.getNth(n);
    return m
  };

  const api$b = function (View) {
    View.prototype.topics = find$3;
  };

  const api$a = function (View) {
    addMethod(View);

    View.prototype.places = function (n) {
      const m = find$4(this);
      return m.getNth(n)
    };
    View.prototype.organizations = function (n) {
      const m = this.match('#Org+');
      return m.getNth(n)
    };
    api$b(View);
  };
  var topics = { api: api$a };

  // key order is the order they are redacted in
  const defaults$1 = {
    people: true,
    places: true,
    organizations: true,
    emails: true,
    money: true,
    percentages: true,
    fractions: true,
    phoneNumbers: true,
    atMentions: true,
    acronyms: true,
    urls: true,
    // off by default
    properNouns: false,
    dates: false,
    numbers: false,
    pronouns: false,
  };

  // remove these specific tags when redacting, which may leak information
  const hideTags = {
    people: [MaleName, FemaleName, First, Last],
    places: [City, 'State', Country, Region],
    organizations: [SportsTeam, 'Company', 'School'],
  };
  hideTags.pronouns = [...hideTags.people, ...hideTags.places, ...hideTags.organizations];

  // replace text with blockStr but keep tags
  const redactMatch = function (m, blockStr, keep = true) {
    m = m.notIf('#Redacted');
    m.replaceWith(blockStr, keep);
    m.tag('Redacted');
    return m
  };

  const redact = function (opts = {}, blockStr = '██████████', keep = true) {
    opts = { ...defaults$1, ...opts };
    // each key is also the View method that finds them
    Object.keys(defaults$1).forEach(k => {
      // skip finders that this build or language does not have
      if (opts[k] !== false && this[k]) {
        const m = redactMatch(this[k](), blockStr, keep);
        if (hideTags[k]) {
          m.unTag(hideTags[k]);
        }
      }
    });
    return this
  };

  const plugin = {
    model: {
      one: {
        tagSet: {
          Redacted: true
        }
      }
    },
    api: function (View) {
      View.prototype.redact = redact;
    }
  };

  // remove a regex match from the text of each term
  const stripper = reg => view => {
    eachTerm(view.docs, term => {
      term.text = term.text.replace(reg, '');
      term.normal = term.normal.replace(reg, '');
    });
    return view
  };

  const strip$4 = stripper(/\./g);

  const api$9 = function (View) {

    class Acronyms extends View {
      strip() {
        return strip$4(this)
      }
      addPeriods() {
        strip$4(this);
        eachTerm(this.docs, term => {
          // Reuse the sentence period so strip() still preserves punctuation.
          const ending = term.post.startsWith('.') ? '' : '.';
          term.text = term.text.split('').join('.') + ending;
          term.normal = term.normal.split('').join('.') + ending;
        });
        return this
      }
    }
    Acronyms.prototype.viewType = 'Acronyms';

    View.prototype.acronyms = select(Acronyms, '#Acronym');
  };

  // select spans wrapped by paired punctuation held in term.pre / term.post
  const findPairs = (hasOpen, findEnd) => doc => {
    const ptrs = [];
    doc.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        const term = terms[i];
        if (term.pre && hasOpen.test(term.pre)) {
          const end = findEnd(terms, i);
          if (end !== null) {
            const [n, start] = terms[i].index;
            // i and end are relative to this view, but start is not
            ptrs.push([n, start, start + end - i + 1, terms[i].id]);
            i = end;
          }
        }
      }
    });
    return doc.update(ptrs)
  };

  // remove the opening and closing punctuation from each span
  const stripPairs = (hasOpen, hasClosed) => m => {
    m.docs.forEach(terms => {
      terms[0].pre = terms[0].pre.replace(hasOpen, '');
      const last = terms[terms.length - 1];
      last.post = last.post.replace(hasClosed, '');
    });
    return m
  };

  const hasOpen$1 = /\(/;
  const hasClosed$1 = /\)/;

  const findEnd$1 = function (terms, i) {
    for (; i < terms.length; i += 1) {
      if (terms[i].post && hasClosed$1.test(terms[i].post)) {
        return i
      }
    }
    return null
  };

  const find$2 = findPairs(hasOpen$1, findEnd$1);
  const strip$3 = stripPairs(hasOpen$1, hasClosed$1);

  const api$8 = function (View) {
    class Parentheses extends View {
      strip() {
        return strip$3(this)
      }
    }
    Parentheses.prototype.viewType = 'Parentheses';

    View.prototype.parentheses = select(Parentheses, find$2);
  };

  const stripS = stripper(/['’]s$/);
  const leadApostrophe = /^['’]/;

  // spencer's, spencer’s - and the flanders', whose apostrophe is in .post
  const strip$2 = function (view) {
    stripS(view);
    eachTerm(view.docs, t => {
      if (t.text.endsWith('s') && leadApostrophe.test(t.post)) {
        t.post = t.post.replace(leadApostrophe, '');
      }
    });
    return view
  };

  // #Possessive is decided upstream, in steps - the list is in 2-two/contraction-two/compute/index.js
  const find$1 = function (doc) {
    let m = doc.match('#Poss+');
    // expand it to include 'john smith's'
    if (m.has('#Pers')) {
      m = m.growLeft('#Pers+');
    }
    if (m.has('#Place')) {
      m = m.growLeft('#Place+');
    }
    if (m.has('#Org')) {
      m = m.growLeft('#Org+');
    }
    return m
  };


  const api$7 = function (View) {

    class Possessives extends View {
      strip() {
        return strip$2(this)
      }
    }
    Possessives.prototype.viewType = 'Possessives';

    View.prototype.possessives = select(Possessives, find$1);
  };

  /* eslint-disable regexp/no-dupe-characters-character-class */

  const pairs$2 = {
    '\u0022': '\u0022', // 'StraightDoubleQuotes'
    '\uFF02': '\uFF02', // 'StraightDoubleQuotesWide'
    '\u0027': '\u0027', // 'StraightSingleQuotes'
    '\u201C': '\u201D', // 'CommaDoubleQuotes'
    '\u2018': '\u2019', // 'CommaSingleQuotes'
    '\u201F': '\u201D', // 'CurlyDoubleQuotesReversed'
    '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
    '\u201E': '\u201D', // 'LowCurlyDoubleQuotes'
    '\u2E42': '\u201D', // 'LowCurlyDoubleQuotesReversed'
    '\u201A': '\u2019', // 'LowCurlySingleQuotes'
    '\u00AB': '\u00BB', // 'AngleDoubleQuotes' «, »
    '\u2039': '\u203A', // 'AngleSingleQuotes'
    // Prime 'non quotation'
    '\u2035': '\u2032', // 'PrimeSingleQuotes'
    '\u2036': '\u2033', // 'PrimeDoubleQuotes'
    '\u2037': '\u2034', // 'PrimeTripleQuotes'
    // Prime 'quotation' variation
    '\u301D': '\u301E', // 'PrimeDoubleQuotes'
    '\u0060': '\u00B4', // 'PrimeSingleQuotes'
    '\u301F': '\u301E', // 'LowPrimeDoubleQuotesReversed'
  };

  const hasOpen = RegExp('[' + Object.keys(pairs$2).join('') + ']');
  const hasClosed = RegExp('[' + Object.values(pairs$2).join('') + ']');

  const findEnd = function (terms, i) {
    const have = terms[i].pre.match(hasOpen)[0] || '';
    if (!have || !pairs$2[have]) {
      return null
    }
    const want = pairs$2[have];
    for (; i < terms.length; i += 1) {
      if (terms[i].post && terms[i].post.match(want)) {
        return i
      }
    }
    return null
  };

  const find = findPairs(hasOpen, findEnd);
  const strip$1 = stripPairs(hasOpen, hasClosed);

  const api$6 = function (View) {

    class Quotations extends View {
      text(fmt) {
        if (!fmt || fmt === 'text') {
          return super.text({ keepEndPunct: true })
        }
        if (typeof fmt === 'object') {
          return super.text({ keepEndPunct: true, ...fmt })
        }
        return super.text(fmt)
      }
      strip() {
        strip$1(this);
      }
    }
    Quotations.prototype.viewType = 'Quotations';

    View.prototype.quotations = select(Quotations, find);
  };

  /** return anything tagged as a phone number */
  const phoneNumbers = function (n) {
    let m = this.splitAfter('@hasComma');
    m = m.match('#PhoneNumber+');
    m = m.getNth(n);
    return m
  };

  /** return anything tagged as an address */
  const addresses = function (n) {
    let m = this.match('#Address+');
    m = m.getNth(n);
    return m
  };

  // setup easy helper methods
  const selections = [
    ['hyphenated', '@hasHyphen .'],
    ['hashTags', '#HashTag'],
    ['emails', '#Email'],
    ['emoji', '#Emoji'],
    ['emoticons', '#Emoticon'],
    ['atMentions', '#AtMention'],
    ['urls', '#Url'],
    // ['pronouns', '#Pronoun'],
    ['conjunctions', '#Conj'],
    ['prepositions', '#Prep'],
    ['abbreviations', '#Abbr'],
    ['honorifics', '#Hon'],
  ];

  // aliases
  const aliases = [
    ['emojis', 'emoji'],
    ['atmentions', 'atMentions'],
  ];

  const addMethods = function (View) {
    // add a list of new helper methods
    selections.forEach(a => {
      View.prototype[a[0]] = function (n) {
        const m = this.match(a[1]);
        return typeof n === 'number' ? m.get(n) : m
      };
    });
    View.prototype.phoneNumbers = phoneNumbers;
    View.prototype.addresses = addresses;
    // add aliases
    aliases.forEach(a => {
      View.prototype[a[0]] = View.prototype[a[1]];
    });
  };

  const hasSlash = /\//;

  const api$5 = function (View) {

    class Slashes extends View {
      split() {
        return this.map((m) => {
          const str = m.text();
          const arr = str.split(hasSlash);
          m = m.replaceWith(arr.join(' '));
          return m.growRight('(' + arr.join('|') + ')+')
        })
      }
    }
    Slashes.prototype.viewType = 'Slashes';

    View.prototype.slashes = select(Slashes, '#SlashedTerm');
  };

  var misc$1 = {
    api: function (View) {
      api$9(View);
      api$8(View);
      api$7(View);
      api$6(View);
      addMethods(View);
      api$5(View);
    }
  };

  // a comma, but not a clause break
  const notClause = [
    '@hasComma @hasComma', //fun, cool...
    '(#City && @hasComma) #Country', //'toronto, canada'
    '(#WeekDay && @hasComma) #Date', //'tuesday, march 2nd'
    '(#Date+ && @hasComma) #Val', //'july 6, 1992'
    '(#Adj && @hasComma) #Adj', //nice, pretty
  ];

  const byComma = function (doc, rules) {
    const skip = notClause.concat(rules.notClause || []);
    let commas = doc.match('@hasComma');
    // remove any non-clause uses
    commas = commas.filter(m => {
      // don't split the first word
      if (m.growLeft('.').wordCount() === 1) {
        return false
      }
      // don't split the last word
      if (m.growRight('. .').wordCount() === 1) {
        return false
      }
      const more = m.grow('.'); // grow by 1 word in either direction
      return !skip.some(str => more.has(str))
    });
    return doc.splitAfter(commas)
  };

  // should we split-out a clause (in brackets)?
  const splitParentheses = function (doc) {
    // from the misc plugin
    if (!doc.parentheses) {
      return doc
    }
    let matches = doc.parentheses();
    matches = matches.filter(m => {
      return m.wordCount() >= 3 && m.has('#Verb') && m.has('#NN')
    });
    return doc.splitOn(matches)
  };

  // split-out a long quotion, but not 'inline quotes'.
  const splitQuotes = function (doc) {
    // from the misc plugin
    if (!doc.quotations) {
      return doc
    }
    let matches = doc.quotations();
    matches = matches.filter(m => {
      return m.wordCount() >= 3 && m.has('#Verb') && m.has('#NN')
    });
    return doc.splitOn(matches)
  };

  const clauses$2 = function (n) {
    let found = this;
    // word-rules, like 'but' and 'until', are in the model
    const rules = this.model.three?.clauses || {};

    found = splitParentheses(found);
    found = splitQuotes(found);

    found = byComma(found, rules);

    found = found.splitAfter('(@hasEllipses|@hasSemicolon|@hasDash|@hasColon)');

    // each language's own rules
    const { splitAfter = [], splitBefore = [], splitBeforeGroup = [] } = rules;
    splitAfter.forEach(str => {
      found = found.splitAfter(str);
    });
    splitBefore.forEach(str => {
      found = found.splitBefore(str);
    });
    splitBeforeGroup.forEach(str => {
      const m = found.match(str, 0);
      if (m.found) {
        found = found.splitBefore(m);
      }
    });

    // // misc clause partitions
    // found = found.splitBefore('as well as .')
    // found = found.splitBefore('such as .')
    // found = found.splitBefore('in addition to .')

    // // semicolons, dashes
    // found = found.splitAfter('@hasSemicolon')
    // found = found.splitAfter('@hasDash')

    // //
    // found = found.splitBefore('which (were|are|will)')

    // // he said [...]
    // found = found.splitAfter('#Noun (said|say|says)')

    // passive voice verb - '.. which was robbed is empty'
    // let passive = found.match('#Noun (which|that) (was|is) #Adverb? #PastTense #Adverb?')
    // if (passive.found) {
    //   found = found.splitAfter(passive)
    // }
    // //which the boy robbed
    // passive = found.match('#Noun (which|that) the? #Noun+ #Adverb? #PastTense #Adverb?')
    // if (passive.found) {
    //   found = found.splitAfter(passive)
    // }
    // does there appear to have relative/subordinate clause still?
    // let tooLong = found.filter(d => d.wordCount() > 5 && d.match('#Verb+').length >= 2)
    // if (tooLong.found) {
    //   // and after the ..
    //   found = found.splitBefore('#Conjunction #Preposition')

    //   // let m = tooLong.splitAfter('#Noun .* #Verb .* #Noun+')
    //   // found = found.splitOn(m.eq(0))
    // }
    if (typeof n === 'number') {
      found = found.get(n);
    }
    return found
  };

  const api$4 = function (View) {
    View.prototype.clauses = clauses$2;
  };

  // .clauses() with only its punctuation rules - a language adds its own model.three.clauses
  var clauses$1 = { api: api$4 };

  // a leading '-', or the real minus-sign, or one after a symbol - '$-5'
  const minus = /^\s*[-−]|\P{L}[-−]$/u;
  const signs = /[-−]/g;
  // any currency symbol - '$', '€', '₽'
  const currency = /\p{Sc}/u;

  // a decimal-comma, unless the language's model says otherwise.
  // `ordinal` is regex-source for the ending of a numeric ordinal - '[ºª°]'
  // `loose` reads a lone decimal-mark before three digits as thousands - '7,938'
  // `percent` and `currencies` are the words that follow a number - 'per cento', 'euro'
  const defaults = { decimal: ',', group: '.', ordinal: '', loose: false, percent: [], currencies: [] };

  // the mark that groups thousands can't also be the decimal
  const groupMark = function (group, decimal) {
    if (group !== decimal) {
      return group
    }
    return decimal === '.' ? ',' : '.'
  };

  // '1234567' → '1.234.567'
  const addGroups = function (int, mark) {
    const out = [];
    for (let end = int.length; end > 0; end -= 3) {
      out.unshift(int.slice(Math.max(end - 3, 0), end));
    }
    return out.join(mark)
  };

  // floating-point noise - 0.1 + 0.2. a whole number is already exact,
  // and rounding it to 15 digits would corrupt a 16-digit one
  const tidy$1 = num => (Number.isInteger(num) ? num : Number(num.toPrecision(15)));

  // compile each ordinal-ending once
  const cache$2 = {};
  const isOrdinal = function (suffix, src) {
    if (!src || !suffix) {
      return false
    }
    cache$2[src] = cache$2[src] || new RegExp('^(?:' + src + ')$', 'iu');
    return cache$2[src].test(suffix)
  };

  // digits, and any mark that sits between two of them - '1.234,56', '1 000', "1'000"
  const body = /^[0-9](?:[0-9]|[.,'’\s](?=[0-9]))*/;
  const count = (str, char) => str.split(char).length - 1;

  // which mark is the decimal, and which one groups the thousands?
  // two different marks, or a repeated one, say so themselves - '1.234,56', '1.234.567'
  // a lone '.' or ',' is the only real guess, and the locale makes it
  const findMarks = function (str, locale) {
    const dots = count(str, '.');
    const commas = count(str, ',');
    // a space or an apostrophe is only ever a thousands-group
    const soft = str.match(/[ ']/);
    let decimal = null;
    let group = soft ? soft[0] : null;
    if (dots && commas) {
      // the last one is the decimal
      decimal = str.lastIndexOf(',') > str.lastIndexOf('.') ? ',' : '.';
      group = decimal === ',' ? '.' : ',';
      if (soft) {
        return null
      }
    } else if (dots + commas > 1) {
      group = dots ? '.' : ',';
      if (soft) {
        return null
      }
    } else if (dots + commas === 1) {
      const mark = dots ? '.' : ',';
      const isGroup = /^[1-9][0-9]{0,2}[.,][0-9]{3}$/.test(str);
      const isDecimal = mark === locale.decimal && !(locale.loose && isGroup);
      if (soft || isDecimal || !isGroup) {
        decimal = mark; // '3,5', and '3.5' anywhere
      } else {
        group = mark; // '1.000' where the decimal is a comma
      }
    }
    return { decimal, group }
  };

  // '1.234,56' → 1234.56, or null for something that isn't one number - '1.2.3'
  const toNumber = function (str, marks) {
    let int = str;
    let fraction = '';
    if (marks.decimal) {
      const parts = str.split(marks.decimal);
      if (parts.length !== 2) {
        return null
      }
      int = parts[0];
      fraction = parts[1];
    }
    // thousands come in threes
    if (marks.group) {
      const groups = int.split(marks.group);
      if (groups[0].length > 3 || groups.slice(1).some(s => s.length !== 3)) {
        return null
      }
      int = groups.join('');
    }
    if (!/^[0-9]+$/.test(int) || !/^[0-9]*$/.test(fraction)) {
      return null
    }
    return Number(fraction ? int + '.' + fraction : int)
  };

  /**
   * pull-apart a number written in digits - '-5', '1.234,56 €', '3,5%', '2ª'
   * `pre` is any punctuation that the tokenizer left in front of it - '(-'
   * `locale` is model.two.europeanNumbers
   */
  const read = function (str, pre = '', locale = defaults) {
    const res = {
      num: null,
      prefix: '',
      suffix: '',
      hasComma: false,
      decimal: null,
      group: null,
      ordinal: null,
      currency: null,
      isPercent: false,
      isFraction: false,
    };
    str = String(str).trim();
    const begin = str.search(/[0-9]/);
    if (begin === -1) {
      return res
    }
    let prefix = str.slice(0, begin);
    const raw = str.slice(begin).match(body)[0];
    let suffix = str.slice(begin + raw.length);
    // every kind of space, and both kinds of apostrophe
    let digits = raw.replace(/\s/g, ' ').replace(/’/g, "'");
    // a decimal with nothing in front of it - '.5', ',5'
    const lead = prefix.slice(-1);
    if ((lead === '.' || lead === ',') && /^[0-9]+$/.test(digits)) {
      digits = '0' + lead + digits;
      prefix = prefix.slice(0, -1);
    }
    const marks = findMarks(digits, locale);
    let num = marks ? toNumber(digits, marks) : null;
    if (num === null) {
      return res
    }
    // a fraction - '1/2'
    const frac = suffix.match(/^\/([0-9]+)$/);
    if (frac && Number(frac[1]) !== 0) {
      num /= Number(frac[1]);
      suffix = '';
      res.isFraction = true;
    }
    // the sign may be hiding in the punctuation - '(-5)'
    // .. on either side of the currency - '-$5', '$-5' - but not 'covid-19'
    if (minus.test(prefix) || /[-−]$/.test(pre)) {
      num *= -1;
    }
    // a numeric ordinal - '2ª', '5-го', '3e'
    if (isOrdinal(suffix, locale.ordinal)) {
      res.ordinal = suffix;
      suffix = '';
    }
    res.num = num;
    res.prefix = prefix.replace(signs, '');
    res.suffix = suffix;
    res.decimal = marks.decimal;
    res.group = marks.group;
    res.hasComma = marks.group !== null;
    // remember which space it was - a non-breaking one is put back as one
    if (marks.group === ' ') {
      res.group = raw.match(/\s/)[0];
    }
    const money = [res.prefix, suffix].find(s => currency.test(s));
    res.currency = money ? money.trim() : null;
    res.isPercent = /^\s*[%％]/.test(suffix);
    return res
  };

  /**
   * write a number in digits - 1234.5 → '1.234,5'
   * `how` is the result of read(), so a number goes back the way it was found.
   * thousands are only grouped when `how.hasComma` is set
   */
  const write$1 = function (num, how = {}, locale = defaults) {
    if (typeof num !== 'number' || !isFinite(num)) {
      return ''
    }
    num = tidy$1(num);
    let str = String(Math.abs(num));
    // leave '1e+21' alone
    if (/^[0-9]+(?:\.[0-9]+)?$/.test(str)) {
      let decimal = how.decimal || locale.decimal;
      // '7,938' was grouped with a comma, so its decimal is a period
      if (!how.decimal && how.group === decimal) {
        decimal = groupMark(decimal, decimal);
      }
      const parts = str.split('.');
      let int = parts[0];
      const fraction = parts[1];
      if (how.hasComma) {
        int = addGroups(int, groupMark(how.group || locale.group, decimal));
      }
      str = fraction ? int + decimal + fraction : int;
    }
    // the sign goes ahead of any currency - '-$5'
    const sign = num < 0 ? '-' : '';
    return sign + (how.prefix || '') + str + (how.suffix || '')
  };

  const sign = '[-+−]?';
  // '1.234.567,89', or '1234,5' - either mark, the reader sorts-out which is which
  const digits = "(?:[0-9]{1,3}(?:[.,'’][0-9]{3})+(?:[.,][0-9]+)?|[0-9]+(?:[.,][0-9]+)?)";
  // 'R$', 'US$', '€'
  const symbol$1 = '(?:[a-z]{1,2})?\\p{Sc}';

  const cardinal$1 = ['Cardinal', 'NumericValue'];
  const percent$1 = ['Percent', 'Cardinal', 'NumericValue'];
  const money = ['Money', 'Value'];

  // build them once per language
  const cache$1 = new WeakMap();

  /**
   * tagging rules for numbers written in digits, as [regex, tags, example].
   * test them on the term's text, not its 'normal' - which has lost its commas
   */
  const regexes = function (locale = defaults) {
    if (cache$1.has(locale)) {
      return cache$1.get(locale)
    }
    const reg = str => new RegExp('^' + str + '$', 'iu');
    const out = [
      [reg(sign + symbol$1 + ' ?' + sign + digits + '(?:[kmb]|bn)?\\+?'), money, '€5,30'],
      [reg(sign + digits + ' ?' + symbol$1 + '\\+?'), money, '5,30€'],
      [reg(sign + digits + '\\+?'), cardinal$1, '1.234,56'],
      [reg(sign + '[.,][0-9]+\\+?'), cardinal$1, ',5'],
      [reg(sign + digits + ' ?[%％]\\+?'), percent$1, '3,5%'],
      [reg(sign + '[.,][0-9]+[%％]'), percent$1, ',5%'],
    ];
    // '2ª', '5-го', '3e'
    if (locale.ordinal) {
      out.push([reg('[0-9]+(?:' + locale.ordinal + ')'), ['Ordinal', 'NumericValue'], 'ordinal']);
    }
    cache$1.set(locale, out);
    return out
  };

  const reason$1 = 'european-number';
  // '€', '₽', 'R$', 'US$'
  const symbol = /^[a-z]{0,2}\p{Sc}$/iu;
  // only in capitals - 'EUR 5', not 'eur'
  const codes = /^(?:EUR|USD|GBP|CHF|JPY|CAD|AUD|BRL|MXN|RUB|CNY)$/;
  const percent = /^[%％]$/;

  const isValue = term => term.tags.has('Value');
  // nothing but a space between this word and the next - not '5, euro'
  const touches = term => /^\s*$/.test(term.post);

  // do these words come next? - 'per cento'
  const hasPhrase = function (terms, i, words) {
    return words.every((w, o) => terms[i + o] && terms[i + o].normal === w && (o === words.length - 1 || touches(terms[i + o])))
  };

  /**
   * a number takes its meaning from the word beside it - '5,30 €', '50 per cento', 'mille euro'.
   * the number is tagged #Money or #Percent, and the word beside it #Currency or #Unit.
   * the words come from the model - { percent: ['per cento'], currencies: ['euro'] }
   */
  const tagNeighbours = function (terms, view) {
    const { world, model, methods } = view;
    const { setTag, unTag } = methods.one;
    const locale = model.two.europeanNumbers;
    const phrases = (locale.percent || []).map(str => str.split(' '));
    const words = new Set(locale.currencies || []);
    const isCurrency = term => term.tags.has('Currency') || symbol.test(term.text) || words.has(term.normal);
    const isCode = term => symbol.test(term.text) || codes.test(term.text);

    for (let i = 0; i < terms.length; i += 1) {
      if (!isValue(terms[i]) || terms[i].tags.has('Ordinal')) {
        continue
      }
      // the whole number - '1 000', 'trois cent'
      let end = i;
      while (terms[end + 1] && isValue(terms[end + 1]) && touches(terms[end])) {
        end += 1;
      }
      const run = terms.slice(i, end + 1);
      const next = touches(terms[end]) ? terms[end + 1] : null;
      const before = terms[i - 1];
      const phrase = next ? phrases.find(a => hasPhrase(terms, end + 1, a)) : null;
      if (phrase) {
        // 'cento' is not a second number
        const unit = terms.slice(end + 1, end + 1 + phrase.length);
        unTag(unit, 'Value', model.one.tagSet);
        setTag(unit, 'Unit', world, false, reason$1);
        setTag(run, 'Percent', world, false, reason$1);
        end += phrase.length;
      } else if (next && percent.test(next.text)) {
        setTag(run, 'Percent', world, false, reason$1);
        setTag([next], 'Unit', world, false, reason$1);
      } else if (next && (isCurrency(next) || codes.test(next.text))) {
        setTag(run, 'Money', world, false, reason$1);
        setTag([next], 'Currency', world, false, reason$1);
      } else if (before && isCode(before) && touches(before)) {
        // only a symbol goes in front - '€ 5,30', 'CHF 12'
        setTag(run, 'Money', world, false, reason$1);
        setTag([before], 'Currency', world, false, reason$1);
      }
      i = end;
    }
  };

  const reason = 'european-number';
  // leave these to the language's own tagger - '12.05.2020', '15.30', '555-1234'
  // .. and a german ordinal keeps its period outside of the term - '3.'
  const skip = ['Date', 'PhoneNumber', 'NumberRange', 'Ordinal'];

  // tag numbers written in digits, from their raw text - '1.234,56', '3,5%', '5,30€'
  const tagNumbers$1 = function (view) {
    const { world, model, methods } = view;
    const regs = regexes(model.two.europeanNumbers);
    const setTag = methods.one.setTag;
    view.docs.forEach(terms => {
      terms.forEach(term => {
        if (!/[0-9]/.test(term.text) || skip.some(tag => term.tags.has(tag))) {
          return
        }
        const found = regs.find(a => a[0].test(term.text));
        if (found) {
          setTag([term], found[1], world, false, reason);
        }
      });
      // '5,30 €', '50 per cento'
      tagNeighbours(terms, view);
    });
  };

  /**
   * numbers written in digits, with a decimal-comma - '1.234,56', '3,5%', '5,30 €'
   * shared across many languages
   * tags them, and adds a reader and writer:
   *   const { read, write } = doc.methods.two.europeanNumbers
   *   const locale = doc.model.two.europeanNumbers
   *   read('1.234,56', term.pre, locale).num // 1234.56
   *   write(1234.56, { hasComma: true }, locale) // '1.234,56'
   * a language sets its own marks in model.two.europeanNumbers - { group: ' ', ordinal: 'er?' }
   * and its own words - { percent: ['per cento'], currencies: ['euro'] } - for '50 per cento', 'mille euro'
   */
  var europeanNumbers = {
    model: { two: { europeanNumbers: { ...defaults, percent: [], currencies: [] } } },
    methods: { two: { europeanNumbers: { read, write: write$1, regexes } } },
    compute: { europeanNumbers: tagNumbers$1 },
    hooks: ['europeanNumbers'],
  };

  // Generated by scripts/pack/index.js; see data/README.md for source files.
  var properNouns = {
    "ProperNoun": "true¦aIbDc8dalhousHe7f5gosford,h4kirby,landsdowne,m2nis,r1s0wembF;herwood,paldiB;iel,othwe1;cgi0ercedes,issy;ll;intBudsB;airview,lorence,ra0;mpt9nco;lmo,uro;a1h0;arlt6es5risti;rl0talina;et4i0;ng;arb3e0;et1nt0rke0;ley;on;ie;bid,jax",
    "Organization": "true¦0:4Q;1:3Z;a3Vb3Dc2Md2Fe2Af25g1Yh1Ri1Nj1Lk1Jl1Gm13n0Ro0Op0Equ0Dr04sStIuDvAw4xiaomi,y2;amaha,mca,ou2wca;gov,tube;a5e3iki2orld trade organization;leaRpedia;lls fargo,st2;field,inghouse;l2rner bros;greens,l street journal,m1C;an halPerizon,isa,o2;dafone,l2;kswagNvo;b5kip,n3ps,s2;a today,ps;esco,i2;lever,ted nations;er,s; mobile,aco beTd bQe8gi fridays,he 4im hortons,mz,o2witter;shiba,y2;ota,s r us;b3carpen3Mdaily ma1holli0s2who;mashing pumpkins,uprem0;ea2lack eyed peas,yrds;ch boys,tl0;l3n3Us2xas instruments;co,la m1F;efonica,us;aCcBe8iemens,mirnoff,np,o6p5quare0Dt2ubaru;a2eer02;rbuc2to1;ks;eci2Cice gir5;ny,undgard2;en;a3x pisto2;ls;g1Wrs;hool1Sientology;feway,insburys,lesforce,msung;adiohead,b9e5o2yanair;man empire,yal 2;b2dutch she5;ank;a4d 2max,vlon;bu2c2Bhot chili peppers,lobster;ll;ders digest,l madrid;c,s;antas,iznos;a9bs,e6fizer,hilip5i4r2;emier 2udential;leagTo1;nk floyd,zza hut; morrCs;psi3tro2ugeot;bras,china,nas;!co;lantir,n2ypal; 3asonic,da2Q;ld navy,pec,range juli3xf2;am;us;aAb9e8fl,h7i6o2sa,vid5wa;k4minat3tre dame,vart2;is;ing1F;ia;ke,ntendo,ssan,vV;l,s;c,stle,tflix,wsweek;a,c;ndos,s3t2;o,west;a,car,daq;aDeAi7lb,o4tv,y2;spa2;ce;b1nsanto,ody blu0t2;ley cr2or0T;ue;c3t2;as,subisM;helin,rosoft;dica3rcedes benz,talli2;ca;id,re;cs milk,ttel,zda;a presse,e2g,ittle caesars; oreal,novo,x2;is,mark,us;atv,fc,kk,lm,m2odak;art;iffy lube,oy division,pmorgan2sa;! chase;bm,hop,k4n2tv;g,te2;l,rpol;ea;a7e6i4o2sbc,yundai;me dep2nda;ot;tac2zbollah;hi;althYwlett pack1V;lliburton,sbro;eneral 6hq,ithub,l5mb,o2reen day,ucci;ldman sachs,o2;dye2gle;ar;axo smith kline,encoZ;electric,m2;otors;a5bi,c barcelo4da,edex,i3leetwood mac,o2rito lay;rd,xcon;at,fa,restone;na;cebook,nnie mae;bay,sa,u5x2;ecutiveYxon2; m2m2;ob1;!rosceptics;aimler,e6isney,o5u2;nkin donu3pont,ran dur2;an;ts;j,w jon0;a,f lepp17ll,peche mode,r spiegel,stiny's chi2;ld;aObc,entrMhIiGloudflaFnn,o4r2;aigsli8eedence clearwater reviv2ossra1;al;cAinba9l7m3n2ors,stco;ferenceJgressionI;ca4merce3p2;aq; bo0Y;st;dplVg2;ate;se;a c2o chanT;ola;re;a,sco2tigroup;! systems;ev3i2;ck fil a,na daily;r2y;on;al2; committee;d3pital o2rls jr;ne;bury,ill2;ac;aFbc,eCfAl6mw,ni,o2p,rexiteeV;ei4mbardiJston 2;glo2pizza;be;ng;o3ue c2;roW;ckbuster video,omingda2;le; g2g2;oodriM;cht3e ge0rkshire hathaw2;ay;el;cardi,idu,nana republ4s2xt6y6;f,kin robbi2;ns;ic;bYcUdidTerosmith,iSlLmFnheuser busEol,ppleBr7s5u4v3y2;er;is,on;di,todesk;hland o1sociated F;il;b4g3m2;co;os;ys; compu2be0;te2;rs;ch;c,d,erican4t2;!r2;ak; ex2;pre2;ss; 6catel3ta2;ir;! lu2;ce2;nt;jazeera,qae2;da;g,rbnb;as;/dc,ademy of scienc0er,tivision2;! blizz2;ard;es;ba",
    "City": "true¦0:75;1:62;2:6H;3:6K;4:5T;5:5M;a6Ab55c4Kd4Ae46f3Yg3Jh3Bi33j2Yk2Gl24m1Nn1Do1Ap0Xq0Vr0Ps06tSuRvMwExiCyAz6;a8h6ibo,urich;a6e6ongsh0;ng3J;greb,nzibar;ang2e6okohama,unfu;katerin3Jrev0;a6n0R;m5n;arsCeBi7roclCu6;h0xi,zhou;c8n6;d6nipeg,terth4;hoek,sor;hita,klow;l65xford;aw;a9e7i6ladivostok,olgograd;en3lnius;nice,r6;o3sailles;lencia,ncouver,r3ughn;lan bator,rumqi,trecht;aGbilisi,eFheEiCoAr8u6;lsa,nis,r6;in,ku;i6ondh64;este,poli;kyo,msk,ronto,ulo6;n,uT;an6jua3l2Vmisoara,ra3;jin,shui; hague,ssaloniki;gucigalpa,hr0l aviv;briz,i7llinn,mpere,ng6rtu,shk2T;ier,sh0;an,chu1n0pei,yu0;aFeEh9kopje,oweto,t8u6;ra6zhou;baya,t;aten is57ockholm,rasbourg,uttgart;an9e7i6;jiazhua1llo1mla,y0;f52n6;ya1zh5;ghai,tou;attle,oul,v46;cramento,int DlCn6o paulo,pporo,rajevo; 8aa,t6;a 6o domingo;a3fe,m1O;antonio,diego,francisco,j6pedro,salvador;o6u0;se;em,t lake city,z27;louis,peters26;aAe9i7o6;me,stov,t5B;ga,o6yadh;! de janeiro;cife,ims,nnes,ykjavik;bat,ip4leigh,nchi,walpindi;ingdao,u6;ez2ito;aGeFhEiDoAr8u7yong6;ya1;ebla,ya1;a6etoria;gue,to;rt6zn0; 6land,o;au prince,elizabeth,said;ls5raeus,tts28;iladelphia,nom penh,oenix;ki1tah tikva;dua,lerZnaji,ris,t6;na,ras;ak46dessa,msk,r7s6ttawa;aka,lo;an,dos;a8ew6ingbo,ovosibirsk,yc; 6castle;delhi,orleans,taipei;g9irobi,n6ples,shv35tchez,v0;ch7ji1t6;es,o1;a1o1;a7o6p4;ya;no,saki;aFeDiAo7u6;mbai,nich,scat;gadishu,nt7s6;cow,ul;evideo,pellier,real;ami,l7nsk,s6;kolc,sissauga;an,waukee;cca,d6lbourne,mphis,ndoza,ssi3;an,ellin,i3;cau,drBkassar,lAn9r6shhad;aca7ib6rakesh,se2N;or;ibo,y;aus,chGdalay,ila;mo;id;aEeBi9o7u6vUy2;anNcknow,dhia3;n6s angeles;d2g beach;brev2Dege,ma6nz,sb2verpool;!ssol; mans,i6;c6pzig;ester; p7g6hore,n0Es vegas,usanne;os;az,lata;aJharHiDlaipeCoArakow,u8y6;iv,o6;to;ala lump4n6;mi1sh0;hima,lkata,pavog4si6wlo2;ce;da;ev,n7r6;kuk,ov;gst2sha6;sa;k6toum;iv;bIdu3llakurichi,mpala,n7ohsiu1ra6unas,waguchi;chi,j;d6o,p4;ahar,y;a8e7i6ohannesW;lin,n0;ddah,rusalem;ip4k6;arta;bad0mphal,nBrkutVs8taYz6;mir,tapala6;pa;fah0l7tanb6;ul;am30i2I;che2d6;ianap2Nore;aBe8o6yder2X; chi mi6ms,nolulu;nh;f7lsin6rakli2;ki;ei;ifa,lifax,mDn6rbin,va3;g9nover,oi;aGdanFenEhDiQlasgCoAraz,u6;a6jrat;dal7ng6yaquil;zhou;ajara,upe;ld coast,then6;burg;ow;ent;eva,oa;sk;lw8n6za;dhi6gtok;nagar;ay;aisal2Aes,o9r7ukuya6;ma;ankfu6esno;rt;rt6sh0; wor7ale6;za;th;d6indhov5l paso,ss5;in6mont2;bur6;gh;aCe9haka,isp4o8resd5u6;b6esseldorf,nkirk,rb0shanbe;ai,lin;ha,nggu0rtmund;hradTl7nv6troit;er;hi;donghJe7kar,l6mascus,r es salaam,ugavpiZ;i0lV;gu,je2;aKebu,hBleve0Wo6raiova,uritiba;lo8n7penhag5r6;doba,k;akLst0W;gVm6;bo;aCen9i7ongqi1ristchur6;ch;ang m8ca6ttago1;go;g7n6;ai;du,zho1;ng6ttogram;ch9sha,zhou;gliari,iAlga9mayenKn7pe town,r6tanP;acDdiff;berra,c6;un;ry;ro;aXeOhLirmingham,oKrAu6;chareUdapeUenos air8r6s0tu0;g6sa;as;es;aAis7usse6;ls;ba7t6;ol;ne;sil9tisla8zzav6;il6;le;va;ia;gota,st2;op7ubaneshw6;ar;al;iDlAng9r6;g5l6n;in;en;aluru,hazi;fa7grade,o horizon6;te;st;ji1rut;ghdad,kGnAot9r8s7yan n4;ur;el,rah;celo3i,ranquilla;ou;du1g7ja lu6;ka;alo7k6;ok;re;ng;ers6u;field;a06b03ccra,ddis ababa,gartala,hmedYizawl,lTmQnIqaba,rFsCt8uck6;la6;nd;he8l6;an6;ta;ns;h6unci2;dod,gab6;at;li6;ngt2;on;a9c6kaPtwerp;hora7o3;na;ge;h8p6;ol6;is;eim;aravati,m0s6;terd6;am; 8buquerq7eppo,giers,ma6;ty;ue;basrah al qadim6mawsil al jadid6;ah;ab6;ad;la;ba;ra;idj0u dha6;bi;an;lbo7rh6;us;rg",
    "Place": "true¦0:4Y;1:50;2:4A;3:4H;4:3O;5:30;6:4Q;a4Mb3Oc31d2Oe2Ef2Cg22h1Qi1Mjapa2Sk1Il19m0Xn0Po0Lp0Br07sVtPuNvLw9y7;a7ork,yz;kutsk,ngtze;aFeEhitDiBo7upatki,ycombe;king,o7;d7l1I;b3Xs7;i4tock;c0UllowbroEn7;c2Ygh2;by,church;ed0ntw3Os2A;ke8r40t7;erf1f1; is0If43;auxhall,irgin is0Lost7;ok;laanbaatar,pto7xb3M;n,wn;aBeotihuacan,h9ive4Go8ruro,sarskoe selo,u7;lum,zigoot;nto,rquay,tt2S;am3e 7orn3N;bronx,hamptons;hiti,j mahal,u1V;aHcotts bluff,eFfo,hEoCpringBt9u7yd2O;dbury,ez,n7;der05set3K;aff1ock2Vr7;atf1oud;hill,w5;ho,uth7; 1Qam27wold;erbroKopping1G;a7ine;f30t0;int lawrence riv6khalin;ayleigh,ed9i7oc26;chmond,o gran4ver7;bend,fr0Esi4; sea,cliffe,hill;aDeAhx,i7ompeii,utn2;c8ne7tcairn; 2Wc0M;kering,t0;k,lh2mbr8n7rth;n1Pzance;oke;cif3Gpahanaumokuakea,r7;k7then0;si4w5;ak9ld t2Jr8x7;f1ley;ange county,f1inoco;mZw5;eAile,o7;r7tt2V;th7wich; 10am1H;gev,uschwanstein,w7; eng8a7h2markKport;rk;land;aAco,e8i7uc;dt26ll17;adow7kong;lands;chu picchu,gadan,iBlAn9ple8r7;kh2; 1Kw5;hattan,sf2J;ibu,t0vern;dstone,n st7;!re7;et;aBeAgw,hr,i7owlSynd06;n7ttle italy;coln memori7dley;al;asi4w3;kefr9mbeth,n7;ca2Mg7sing;f1ley,t0;ont;azan kremlin,e9itchen6o8rasnoyar7ul;sk;re0Xsrae;ns0Ks1X;ax,lf1n8ps7;wiP;d7glew5verness;ian2Aochina;aFeDi8kg,nd,ov7unti2J;d,enweep;gh8llc7;reN;bury,l7;and7;!s;r7yw5;ef1tf1;libu26mp8r7stings;f1lem,row;stead,t0;aFodavari,r7uelph;avenCe7imsW;at Aen7; 8f1Iwi7;ch;acr3valley;britain,lak3;hur7;st;ng3y village;airhavKinancial7ra; district;aCgliBnf19ppiAu9ver8x7;et6f1;glad3t0;rope,st0;ng;nt0;rls1Ms7;t 7;e7si4;nd;aEeCfw,igBo9ryd8u7xb;mfri3nstable,rh2tt0;en;nca1ArcMv6w7;nt0C;by;nh2r7vonport;ry;nuAr7;l8t7;f1moor;ingt0;be;aNdg,eLgk,hElDo7royd0;l8m7rnwall;pt0;c9lingw5osse7;um;ood;he0U;earwat6t;aBel9i7uuk;chen itza,mney rock,n7ricahua;atT;m0Zt7;enh2;mor7rlottetQth2;ro;dar 7ntervilB;grove;ldBmAr7versh2;lis8rizo pla7;in;le;bNpbellf1;weT;a01eQingley,kk,lackOoNr7uckX;aIiCo7;ckt0ok7wns cany0;lyn,s7;i4to7;ne;de;dge8gh7;am,t0;n8t7;own;or7;th;ceb8m7;lPpt0;rid7;ge;ardwalk,lt0;bu7pool,waA;rn;aconsfFdf1lCrAverly9x7;hi7;ll; hills;wi7;ck; air,l7;ingh2;am;ie7;ld;ltimore,rnsl8tters7;ea;ey;bMct0driadic,frica,ginKlHmericas,nBrcAs9tl8ylePzor3;es;!antA;hcroft,ia; de triomphe,t8;adyr,caAdov6tarct7;ic7; oce7;an;st6;er;be8dersh7hambra,list0;ot;rt0;cou7;rt;bot9i7;ngd0;on;sf1;ord",
    "Region": "true¦0:2J;1:2G;2:2P;3:2A;a2Nb2Ac1Wd1Res1Qf1Og1Jh1Fi1Aj16k11l0Ym0Nn07o05pYqUrRsJtEuBverAw6y4zacatecas;akut0ork3u4;cat1kon;a5est 4isconsin,yoming;bengal,virgin0;rwick3shington4;! dc;acruz,mont;dmurt0t4;ah,tar4; 2Ka0X;a6e5laxcala,ripura,u4;scaDva;langa2nnessee,xas;basco,m4smOtar24;aulipas,il nadu;a8elangor,i6o5taf11u4ylhet;ffXrrey,s19;me1Bnora,uth V;ber0c4kkim,naloa;hu1ily;n5rawak,skatchew1xo4;ny; luis potosi,ta catari2;a4hode i9;j4ngpur;asth1shahi;inghai,u4;e4intana roo;bec,en4retaro;sl0E;a8e4unjab;i,n5r4;ak,nambuco;ang,nsylv4;an0;hang,ra4;!na;axaca,disha,h4klahoma,ntar4reg7ss0Ax0F;io;aIeBo6u4;evo le4navut;on;r4tt15va scot0;f6mandy,th4; 4ampton3;caroli2dakota;olk;braska,vada,w4; 6foundland4;! and labrad4;or;brunswick,hamp3jers5mexiTyork4;! state;ey;galPyarit;aAeghalaya,i6o4;nta2r4;dov0elos;ch6dlanDn5ss4zoram;issippi,ouri;as geraPnesota;ig1oac1;dhy12harashtra,ine,lacca,ni5r4ssachusetts;anhao,i el,ylG;p4toba;ur;anca3e4incoln3ouisI;e4iR;ds;a6e5h4omi;aka06ul2;dah,lant1ntucky,rala;bardino,lmyk0nsas,r4;achay,el0nataka;alis6har4iangxi;kh4;and;co;daho,llino7n4owa;d5gush4;et0;ia2;is;a6ert5i4un1;dalFm0D;ford3;mp3rya2waii;ansu,eorg0lou7oa,u4;an4izhou,jarat;ajuato,gdo4;ng;cester3;lori4uji1;da;sex;ageUe7o5uran4;go;rs4;et;lawaMrby3;aFeaEh9o4rimea,umbr0;ahui7l6nnectic5rsi4ventry;ca;ut;ima,orado;la;e5hattisgarh,i4uvash0;apRhuahua;chn5rke4;ss0;ya;ra;lGm4;bridge3peche;a9ihar,r8u4;ck4ryat0;ingham3;shi4;re;emen,itish columb0;h0ja cal8lk7s4v7;hkorto4que;st1;an;ar0;iforn0;ia;dygHguascalientes,lBndhr9r5ss4;am;izo2kans5un4;achal 7;as;na;a 4;pradesh;a6ber5t4;ai;ta;ba5s4;ka;ma;ea",
    "FemaleName": "true¦0:I4;1:I8;2:HG;3:HY;4:HH;5:HL;6:IL;7:IP;8:G8;9:IH;A:G1;B:GZ;C:HQ;D:IE;E:AF;F:HU;G:H1;aFSbEOcCVdC4eARfA9g9Kh92i8Sj7Pk6Rl5Cm3Sn39o36p2Uqu2Tr22s11t0Bu09vZwSxi30yOzH;aLeIineb,oHsof4;e3Df4la,ra;h2iKlIna,ynH;ab,ep;da,ma;da,h2iHra;nab;aJeIing,olACu0vH;et8onCT;le0sen4;el,gmur,n,s89;aMendD6hiCNiH;lJnH;if3TniHo0;e,f3S;helmi0lHma;a,ow;ka0nB;aNeKiHusa5;ck7JkIl8oleAviH;anEenI4;ky,toriAT;da,lma,rHs0;a,nHonica;a,ice;leHnesG9;nHLrH;i1y;g9rHs7;su5te;aXeThQiMoKrHu5y2;acI4iHudy;c4na,sH;hEta;nHr0F;iEya;aJffany,nHs7;a,gtiH;ng;!nEUra;aIeHomasi0;a,lma,o7Pres1;l4ndolwethu;gan,o7NrIssH;!a,ie;eHi,ri6;sa,za;bOlMmKnIrHs7tia0wa0;a7Gyn;iHya;a,ka,s7;arEe2iHm6Nra;!ka;a,iH;a,t7;at7it7;a0Bcarlett,e07hViSkye,neza0oQri,tNuIyH;bil,lvi1;ha,niAsIzH;an39et8ie,y;anHi6;!a,e,nH;aCe;aIeH;fan3l4Wphan5U;cH6r5;fi9KnHphi1;d2ia,ja,ya;er2lv4mon1nIobhan,tH;a,i;dy;aMeIirHo0y5;a,lCU;ba,e0i5lJrH;iHr60yl;!dan;ia,lD7;imaa,ki2nJrIu0w0yH;la,na;i,le9on,ron,yn;aIda,ia,nHon;a,on;!ya;lJrIvH;da,inj;e0ife;en1i0ma;anvi,bLd57har,iBkKlJmInd2rHs7vannaC;aCi0;ant7i2;lCYma,ome;ineh,u2;in1ri0;a03eYhWiToHuthCW;bRcQl7XnPsJwIxH;anAEie,y;an,e0;aIeHie,lD;ann6ll1marCQtA;!lHnn1;iHyn;e,nH;a,dE;da,i,na;hel5Rio;bin,erAyn;a,cIkHmas,nEta,ya;ki,o;h8Bki;ea,iannon,oH;da,n1F;an0bIemEgi0i0nHta,y0;a7Oee;a,eH;cHkaC;a,ca;chIe,i0mo0nHquel,y0;di,ia;ael,elHiB;!e,le;een3ia0;aOeNhKia,oIrH;iscil3Audence;lHrt4;i0ly;iloIoebe,ylH;is,lis;me0;ggy,nelope,r5t2;ige,m0Nn59o5rvati,tIulH;a,et8in1;ricHt4F;a,e,ia;ctav4deIfCCksa0lHphCCumou;a,ga,iv4;l4t8;aTeRiLoIurHy5;!ay,ul;a,eIor,rHur;aCeFma;ll1mi;aLcJharika,kIlaHna,s7ta;!y;a,iDBki;hoGk9HolH;a,e4G;!mh;hir,lHna,rissa;!a,lBD;dLima,nKomi6rges,tH;aHhal3;lHs7;i1ya;cy,et8;e9iECya;a08ckenz3e00iMoJuriel,yH;a,rH;a,iMna,tG;i2llB2nH;a,iH;ca,ka,que;a,cSdori,kaRlMmi,nKrHtzi;aIiH;am;!nB;dy,eHh,n3;nhGrva;aKdJe0ica,lH;iHy;cent,e;red;!gros;!e5;ae5hH;ae5el3T;agan,gNi,lKrH;edith,iIon,yH;em,l;em,ssa;an3iHlisa;nHsBY;a,da;!an,han;b07cADd05e,g03ha,i02ja,l00nZrLsoumeh,tKuIvis,xB0yHz3;bell,ra,soun;d6rH;a,eF;h82ild1t3;a,cTgPiKjor3l7Gn3s7tJwa,yH;!aHbeth,ja9lou;m,nB0;a,ha,in1;!aJbel,eIja,lDna,sHtza;!a,ol,sa;!l1A;!h,m,nH;!a,e,n1;arJeIie,oHr3Yueri8;!t;!ry;et3Wi36;el4Li6Zy;dy,on,ue5;ak,en,iHlory;a,ka,nB;a,re,s3te;daHg3;!len1;alDd3elHge,ison,on0;ei9in1yn;el,le;a0Me0BiWoQuLyH;d4la,nH;!a,dIe2KnHsey;!a,e2J;a,sey;ann,cJel0Ois1lIna,pHz;e,iA;a,u;iHy;a2Oe,ja,l2JnB;is,l1QrItt1HuH;el5is1;aJeIi6na,rH;a9Vi6;lei,n1tA;!in1;aTbb95dSepa,lNnKsJvIzH;!a,beth,et8z3;!ia;a,et8;!a,dH;a,sHy;ay,ey,i,y;a,iJja,lH;iHy;a9Qe;!aH;!nE;ia,ya;!nH;!a,ne;aPda,e0iNjYla,nMoKsJtHx8Ry5;iHt3;c4t4;edi,lC6;la,nHra;a,ie,o2;a,or1;a,gh,laH;!ni;!h,nH;a,d2e,n5K;cOdon0iNkes7mija,na,rMtJurIvHxmi,y5;ern1in4;a,e4Zie,yn;as7iIoH;nya,ya;fa,s7;a,is9R;a,la;ey,ie,y;a01eWhaViNlea,oMrJyH;lHra;a,ee,ie;istHy67;a,en,iHy1E;!e,n55;nul,ri,urtney;aNerMley,mJrHzzy;a,stH;en,in;!berlH;eHi,y;e,y;a,stF;!na,ra;dij1w5;el7LiKlJnIrH;a,i,ri;d2na,za;ey,i,lB6s3y;ra,s7;cey,diatou,ede,iSlQmPrNss6EtKviAyH;!e,lH;a,eH;e,igh;!a68eIhHi4LlDri0y;ar83er83ie,leFrAVy;!lyn89ri0;a,en,iHl5Poli0yn;!ma,nEssa;a5il1;eigh,i,lH;e,ie;a,tl6F;a0AeZiWoOuH;anMdLlHst7U;es,iH;a88eHssa;!n9tH;!a,te;ith,y;a,iA;!anNcelDdMelGhan7HleLni,sIva0yH;a,ce;eHie;fHlDph7K;a,in1;en,n1;i6y;!a,e,n3X;lHng;!ian,lH;!ian;anNle0nKrJsH;ica,sH;!e,ica;i,ri;!a,elGifer,nH;a,et8iHy;!e,fer;a,eJiInH;a,eIiH;e,n1;!t8;cMda,mi,nIque27sminEvie2y9zH;min6;a6eIiH;ce,e,n1s;!lHssa,t0A;e,le;inIk68lDquelH;in1yn;da,ta;da,lPmOnNo0rMsIvaHwo0;!na;aIiHla,obel;do2;belHdo2;!a,e,l34;ati,en1i0ma;di2es,grid;a9elBoge9;a,e9ia0o0se;aQeNiIoHyacinth;da,ll3rtense;lImaH;ri;aIdHlaI;a,egard;ry;ather,iIlHnrietArmi9ster;en2Rga,mi;di;biba,iley,lNnMrJsnItHwa,yley;ice,t3;aa;iHmony,ri4Z;etH;!te;aCnaC;a,ey,l3;a01eViQlOoNrKunJwH;enHyneth;!dolD;ay,el;acieIetHiselB;a,chF;!la;ld1Aogoosh;adys,enHor4ynis;a,da,na;aKgi,lIna,ov85selHta;a,e,le;da,liH;an;!n0;mLnJorgIrH;ald5Ki,m3Btrud6;et8i4U;a,eHna;sis,vieve;ma;bHle,rnet,yG;iIrielH;a,l1;!ja;aTeQiPlorOoz4rH;anJeIiH;da,eB;da,ja;!cH;esIiHoise;n1sca;!ca;a,enc4;en,o0;lIn0rnH;anB;ec4ic4;nArKtHy6;emIiHma,oumaA;ha,ma,n;eh;ah,iBrah,za0;crin,d0Qevi,ileFk0Ol07mXnid,rUsOtNuMvHwa;aKelIiH;!e,ta;inEyn;!a;!ngel4O;geni1nice;hel,ien9ta;mLperanKtH;eIhHrel5;er;l2Zr6;za;a,eralB;iHma,ne4Eyn;cHka,n;a,ka;aPeOiLmH;aIeHie,y;li9;!li9nuH;elG;lHn1;e6iHy;a,e,ja;ly,rald;!nue5;aWeUiNlMma,no2oKsJvH;a,iH;na,ra;a,ie;iHuiH;se;a,en,ie,y;a0c4da,e,f,nMsJzaH;!betHveA;e,h;aHe,ka;!beH;th;!a,or;anor,nH;!a,i;!in1na;ate1Pta;vi;eIiHna,wi0;e,th;l,n;aYeMiLjeneKoH;lores,minique,n39rHtt3;a,eFis,la,othHthy;ea,y;ba;an09naCon9ya;anQbPde,eOiMlJmetr4nHsiree;a,iH;ce,se;a,iIla,orHphi9;es,is;a,lah;dHrdH;re;!dee,na;!b2EoraCraC;a,d2nH;!a,e;hl4i0lal,mNnLphn1rIvi1VyH;le,na;a,by,cIia,lH;a,en1;ey,ie;a,et8iH;!ca,el19ka;arHia;is;a0Qe0Mh04i02lUoJristIynH;di,th4;al,i0;lPnMrIurH;tn1C;aJd2IiHn2Iri9;!nH;a,e,n1;!l3;cepcion,n3sH;tanHuelo;ce,za;eHleF;en,t8;aJeoIotH;ilde;!pat2;ir6rJudH;et8iH;a,ne;a,e,iH;ce,sY;a2er2ndH;i,y;aQeNloe,rH;isJyH;stH;al;sy,tH;a1Men,iHy;an1e,n1;lseIrH;!i6yl;a,y;nMrH;isKlImH;ai9;a,eHot8;n1t8;!sa;d2elGtH;al,elG;cIlH;es8i41;el4ilH;e,ia,y;itlYlXmilWndVrMsKtHy5;aIeIhHri0;er1DleFrDy;ri0;a32sH;a31ie;a,iOlLmeJolIrH;ie,ol;!e,in1yn;lHn;!a,la;a,eIie,otHy;a,ta;ne,y;na,ssa;ace,ice;a,e,l1;isAl3;in,yn;arb0Je02iZlXoUrH;andi6eRiJoIyH;an0nn;nwDoke;an3BdgMgiLtH;ney,tH;!aInH;ey,i,y;ny;d,t8;etH;!t6;an0e,nH;da,na;bbi6glarInH;iAn3;ka;ancHythe;a,he;anca,lja0nH;iAtH;ou;aVcUlinBniArPssOtJulaCvH;!erlH;ey,y;hJsy,tH;e,iHy6;e,na;!anH;ie,y;!ie;nItHyl;ha,ie;adIiH;ce;et8i9;ca,ky;!triH;ce,z;a2o2ra;a2Sb2Md23g1Zi1Qj5l16m0Xn09oi,r04sVtUuOvNwa,yHz2;aKes7gJlIn,seH;!l;in;un;!nH;a,na;a,i2J;drLguJrIsteH;ja;el4;stH;in1;a,ey,y;aahua,he0;hIiya,ja,miAtrH;id;aLlHton;eIi6yH;!n;e,iHy;gh;!nH;ti;iJleIo7piA;ta;en,n1t8;aHelG;!n1J;a01dje5eZgViTjRnKtoHya;inet8nH;el5ia;te;!aKeIiHmJ;e,ka;!mHtt6;ar3;!belIliHmU;sa;!l1;a,eliH;ca;ka,sHta;a,sa;elHie;a,iH;a,ca,n1qH;ue;!tH;a,te;!bImHstasiMya;ar4;el;aLberKeliJiHy;e,l4naH;!ta;a,ja;!ly;hGiIl4nB;da;a,ra;le;aWba,ePiMlKthJyH;a,c4sH;a,on,sa;ea;iHyson;e,son;a,cIn1sHza;a,e,ha,on,sa;e,ia,ja;c4is7jaKksaKna,sJxH;aHia;!nd2;ia,saH;nd2;ra;ia;i0nIyH;ah,na;a,is,naC;la;c7da,leFmNnLsH;haClH;inHyY;g,n;!h;a,o,slH;ey;ee;en;at7g3nIusH;ti0;es;ie;aWdiTelMrH;eJiH;anMenH;a,e,ne;an0;na;!aLeKiIyH;nn;a,n1;a,e;!ne;!iH;de;e,lDsH;on;yn;!lH;i9yn;ne;aKbIiHrL;!e,gaK;ey,i6y;!e;gaH;il;dKliyJradhIs7;ha;ya;ah;a,ya",
    "FirstName": "true¦aTblair,cQdOfrancoZgabMhinaLilya,jHkClBm6ni4quinn,re3s0;h0umit,yd;ay,e0iloh;a,lby;g9ne;co,ko0;!s;a1el0ina,org6;!okuhF;ds,naia,r1tt0xiB;i,y;ion,lo;ashawn,eif,uca;a3e1ir0rM;an;lsFn0rry;dall,yat5;i,sD;a0essIie,ude;i1m0;ie,mG;me;ta;rie0y;le;arcy,ev0;an,on;as1h0;arl8eyenne;ey,sidy;drien,kira,l4nd1ubr0vi;ey;i,r0;a,e0;a,y;ex2f1o0;is;ie;ei,is",
    "LastName": "true¦0:96;1:8Q;2:90;3:8Y;4:8R;5:8I;6:8G;7:8L;8:6N;9:6D;a8Sb7Oc6Nd62e5Wf5Jg4Xh4Fi4Cj45k3Ml37m2Cn23o1Vp1Hquispe,r0Ys0At02vWwMxLyDzA;hAimmerm4L;aAou,u;ng,o;aEeun71iBoAun;koyama,shida;!lA;diAmaz;rim,z;maAng;da,g3Omoto,sAza9;a9hita;iao,u;aFeDiBoAright,u;jcik,lff,ng;lAmm0nkl0sniews9;ki8Hliams25s3;bAiss,lt0;b,er,st0;age,gn0lBtA;anabe,s3;k0sh,tA;ers,on;aCesel6RiAogt;dal,llalAss0valdi;ba,obos;lBn dArgas;en b4Gijk,yk;enzuela,verde;aGeix18hDi1j7oCrBsui,urA;c1n0;an,emblay,ynis9;lstoy,m5rr2th;atch0ill,oA;mArlacius;ps3s3;kah7Anaka,te,var2;aSchNeMhKiImGoEtBuAvoboda,zabo;bot5lliv1zu9;aBeAoica;ele,in1Pphe8vens1H;l7rm0;sa,to,uA;ng,sa;itAyth;!h;lva,mmo8nArbu;at6clair,gh;aAehu,imizu;la,rma;gu6infeld,oh,pulveda,rrano;evi4iltz,miBneid0roed0uAwarz;bert,lz;dBtA;!t,z;!t;h7ito,ka3AlDnAr5sa9to,unders;dBtAz;ana,e,os;b3Kers;as,o;aPeMiJoDuByA;a4oo,u;bio,iz,sA;so,u;bEcha,drigu2gers,jas,mDosevelt,sCtBux,wA;e,li4;ari,h;enb3Bsi;ano,ero;erts0Ni6Z;beiro,cBes,vAzzo;as,e6;ci,hards0K;ag1es,iBut0yA;es,nolds;s,t0;dBmAv4K;os;ic,u;aLeIhGiDoCrAut7;asad,ifti,ochazA;ka;p23rti58well;cBero,nA;as,to;asso,hl0;aAillips;k,m,n4P;a6PeteWna,rAters04;eAic,ki8;i6ra,tz;h66k,rk0tA;el,te6L;bGconnor,g1RlDneill,rBsborne,we8zA;demir,turk;ellana,tAwell;ega,iz;iAs3;vAynyk;ei6;aIrien;aFeEiDoAun2ym1;rBvAwak;ak,otn4I;odahl,ris;cholsNemi,kol5x3;ils3mec;gy,kaAray1sh,varro;jiAmu6shiA;ma;aXcUePiOoFuByeA;rs;lCnBrAssolini;ati,pTray;oz,te3R;d0l0;h1lHnGore,rBsAzart;er,s;aDeCiBrisAt3;!on;!n0C;au,i6no,tti;!l2;roe,tgomery;ina,l0;crachi,ll0;hmeti,iDjia,lBnd2rci0ssiAyer1J;!er;nAo;yk;er,j0;cartBlA;aughl7e1;hy;drigal,eda,i0jerus,kela,mani,nFrCtByA;er,r;ei,ic,su11th5C;iAqu2roqu7ti8;ani,c,nA;!o;cini,n;aNeIiFoDuByA;!nch;k5nAo;d,gu;mbarAp2vr5we;di;!nAu,yanage;coln,dA;b11holm,strom;feChm0Fitn0kaBn7rAwis;oy;!j;bvAvA;re;ine,mmy,ng,u,voie,ws3;aNeMh1iKlIoFrDuBvar1woA;k,n;ce6marA;!a;aAem0ishna,yeziu;m0sniqi,us2F;bay3Rch,vaAwals9;cAl;!ic,s;e7uiveA;rt;eff0kAl5mu6;uchi;ll0nnedy;hn,llDmins9ne,pBstrati,to,ur,yA;a,s0;l1oA;or;oe;aEenDha4oBuA;ng,r5;hnsAn2u4;on,t3;ki8nings;cAnsse8;ks3obs;glesias,keda,l07noTonBshikAto,vanou;awa;escu;aJeIiHjaltal7oCuA;!aAb0gh2ynh;m1ng;a4dz5fCjgaard,k,lBpIrAwe,xha;ak,vat;m2t;er,fm2WmA;ann;ggi8tchcock;ikkila,mingway,nde3Rrre6ss;dz5gen,qGrFsDuCwByA;ashi,es;ki8;gen,ng;ani,hiA;moto;di4p0ris,t;ue;aNeorgMheorghe,iLjonKoFrDuAw3;errAo,zm1;a,eA;ro;ayli4eene,g5iffithAub0;!s;ldCm2nBodA;e,m1;calv2zal2;bAs02;erg;aj,i;bs3l,ordaH;ieva;gnGlDmaCndhi,o,rAshi,uthi0;cAdn0za;ia;ge;eaBlA;agh0i,o;no;e,on;aLerIiFjeldsted,lEoCrBuA;chs,ent2jita,ll0;eem1iedm1;ntaArt7urni0wl0;na;emi4or2;sBtzgeraA;ld;ch0h0;nand2rA;arAei6;a,i;b0rrell;dDinsCsAva8;cobar,pAtrada;inoza,osiJ;te7;er,is3warA;ds;aQeJiHjurhuGoEriscoll,uBvorA;ak;arte,boBmitru,nn,rAtta;and,ic;is;g1he0DtA;to;us;aAcki1Wssanayake,x3;s,z; CbnaBlAmir,rvishi,vi,w1;gado,ic;th;bo0groot,jo4lBsilAvri2;va;a cruz,e3uA;ca;hl,mcevs9nBtta,viA;ds3es,s;iels,kula;ki;a03eYhLiobKlarkJoCrAunningham;awford,ivAuz;elli;hen,lEntDoCrAsta,x;byn,reA;a,ia;ke,p0;i,reras;em1li8;ns;!e;anu;aGeEiu,oAu4we;i,ng,p6uBwAy;!dB;dAng;huD;!n,onAu4;!g;kDnCpm1ttBudhA;ry;erjee,o0O;!d,g;ma,raboA;rty;bDlZng5rA;eghetBnA;a,y;ti;an,otari;cer2lder3mpbeFrCstAvadiX;iAro;llo;doBr,t0uAvalho;so;so,zo;ll;a00eOhLiKlJoHrEuCyA;rFtyA;qi;chan1rA;ke;iem,oAyant;oks,wA;ne;nFruya,su,uchaAyko,z5;rd;anco,ondal;ancLdMshwas;aZoAuiy1;umAwmA;ik;ckJethovIgu,ktGnnOrA;gCisBnascoA;ni;ha;er,mA;anA;!n;asA;hi;en;er,hA;am;b5ch,hKiley,kk0ldw7nFrBshAt2u0;ir;bCnBtlAua;ett;es,i0;ieSosa;dAik;a6yoA;padhyA;ay;ra;k,ng;ic;bbYcosXdVgSkhtTlPnJrFsl1tDyA;aBd7;in;la;chis3kiA;ns3;aCmstro4sl1;an;ng;ujo,ya;dBsaA;ri;eBrA;ews;rs3;on;meiBv2;es;da;arwBuilA;ar;al;ams,l0;er;ta;as",
    "MaleName": "true¦0:GJ;1:FD;2:DD;3:G3;4:D0;5:G9;6:CJ;7:F5;8:EB;9:BL;A:FZ;B:FR;aEQbDMcC9dB5eACf9Lg8Lh7Wi7Kj6Ik63l5Dm40n3Mo3Dp2Zqu2Xr22s1Bt0Pu0Mv0AwRxavi2yHzC;aCor0;cChid,karia,nAC;!hDkC;!ary;!ar72ery;aIevgenBBoEuC;en,rFBsCval;if,uf;nCsef,ussef;aCg;s,tC;an,h0;nCrosDNss08;is,nC;!ick;aPeNiDoCyatt;jciech,lfgang,odrFutR;lFnC;f8IsC;lCt1;ow;bGey,frEhelm,lC;ard,iCy;am,e,s;ed5iC;d,ed;e9ur;i,ndell,rn2sC;!l8t1;lDyC;l1ne;lDtC;!er;ace,y;aKernCXiFladDoC;jtech,lodymyr;!iC;mir,sCY;cFha0ktor,nceDrgil,vC;a0ek;!nC;t,zo;!e4Mtor;lCnce,sily;!entC;in94;lCm6Qri,sm0;riCysses;ch,k;aVeQhMiKoFrDurki,yC;!l2rone,s1;avis,eCist0oy,um0;ntCFvor,y;bFdAImCny;!asDmC;aso,ie,y;!z;ias,y;mCt6;!my,othy;adEeoDiago,omC;!as;!dor8N;!de6;dFrC;ence,rC;ance,eCy;ll,nce;!dy;dgh,ha,iCnn2req,tsuki;chi,ka;aXcotVeShOiLlobod0oKpenc2tEurDvenA0yCzym1;ed,lvest2;aj,esh;anFeDuC;!a9;fan15phE6vCwa9;e6Xie;!islaCl8;v,w;lom1rBuleymane;dDgmund,lCm1yabonga;as,vio;!dhartha,n8;aEeClomo;lCrm0;d1t1;hid,ne,qu1Hun,wn,yne;aDbastiDUkou,lim,pp,rgCth,ymour;e1Bio;m6n;!tC;!ie,y;eed,lFmEnCqib,toshi,ul;dCjay,tino;eep,ro;!iAHkelo,mBQu4;!vatore;aZeUhett,iRoGuDyC;an,ou;b8WdDf6pe9ssC;!elDX;ol00y;an,bLcco,dJel,geIh0lHmGnEry,sDyC;!ce;ario,coe,s;!aCnBG;ld,n;an,eo;a72f;lio,r;e38g2n8olfo,riC;go;bB9eCZ;cCl8;ardo,c7Th4WkCo;!ey,ie,y;cFece,gDid,ubByCza;ansh,n05;gie,iC;nald,s;ep;chid,fa4hHin2jesh,lGmFndEoHpha4sDul,wiri,yC;an,mond;had,m6;alD9olph;iro,on;f,ph;ul;e90inC;cy,t1;aNeKhilIiErCyoF;akash,eC;m,st1;eDoC;tr;rre,tC;er,ro;!ipClip;!p6I;dro,rcy,tC;ar,e98rC;!o7;blo,draig,olo,scal,tri5RulCv86;!ie,o;ctavio,i2lHmGndrej,rFsDtCumAwB;is,to;ama,cAkAm0vCwald;aldo;i,vR;ar,er;aDeksandr,ivC;er,i2;f,v;atNeLguyBiFoC;aDel,l0rC;be9m0;h,m;cFels,g4ilo,kDlC;es,s;!hil,las,olaC;!i,y;hCkColas;olas;al,d,il,ls1vC;ille;e,hanC;!a4i4;aXeUiLoGuDyC;les,r1;hamDrad,staC;fa,pha;ed,mG;dibo,e,hamEises,ntDritz,sCussa;es,he;e,y;ad,ed,mC;ad,ed;cFgu4hai,kElDnato,tchC;!ell;house,o7t1;aere,eBPhail,olaj;ah,hDkC;!ey,y;aDeC;al,l;el,l;hDlv3rC;le,rill,v4M;di,met;ay0c00gn6hWjd,ksim,lTmadZnSrKsXtDuric7OxC;imilB6well;eHhEias,tCus,yas;!eo,hCia7;ew,ias;eDiC;as,eu,s;us,w;j,o;cHiGkFlEquis,shall,tCv3;iCy;!m,n;in,on;el,o7us;ano,o7us;!elCin,o7us;!l5o;fred,ish,ny,u4;acDcoCik;lm;hy;amDdi,esh,mC;oud;adCmad;ou;aulCiej;ay;aXePiNloyd,oJuDyC;le,nd1;cFdEiDkCth2uk;a7e;gi,s,z;ovic,vig,wig;!as,iC;ano,en;g0nnie,renEuCvro,well;!iC;e,s;!zo;am,n6oC;n4r;a9Kevi,land,nHoFst2thaEvC;eCi;nte;bo;nCpold;!a7Sel,id;!nC;a9y;mEnd1rDszlo,urenCwr6C;ce,t;ry,s;ar,be9ont;aMeHhalGiEla6onrad,rCu5Jyle;istCzysztof;i0oph2;er0ngsl8p,rC;il9Vk;ed,id;en0iFnCrmit,v4R;!dDnCt1;eth,y;rick;r,th;cp2mErDspAuC;ri;im,l;al,il;a03eXiVoFuC;an,lCst3;en,iC;an,en,o,us;aQeOhKnIrGsDzC;ef;eDhCiah,ue;!ua;!f,ph;dCge;i,on;!aCny;h,s,th6E;anDnC;!ath6Cie,n6U;!nC;!es;!l,sCy;ph;o,qu3;an,mC;!i,m6N;d,ffFns,rCs6;ald,emDmaine,oCry;me,nimo;iah,y;!ery,rC;ey,y;cKdBkImHrEsDvi2yC;dBs1;on,p2;ed,oDrCvis;ett,od;d,s5W;al,es5Ris1;a,e,oCub;b,v;ob,ques;aRbLgKke4Xlija,onut,rIsEtCv0;ai,suC;ki;aDha0iah,maCsac;el,il;ac,iaC;h,s;a,vinCw3;!g;nacio,or;ai,rahC;im;aReLoIuC;be9gGmFsC;eyDsC;a3e3;in,n;berto;h,o;m2raDsse3wC;ard,ie;c45tio;ath,ctor,iGnDrC;be9man07;drik,rC;iCy2I;!k,que;n0Ptor;bJlImza,nHo,rEsDyC;ato,dB;an,s0;lDold,r2DuCv8;hito,ki,to;an,ey;k,s;!im;ib;a07eZiUlenToQrMuCyorgy;iHnFsC;!taC;f,vC;!e,o;nAtC;er,h2;do,lC;herDlC;auCerP;me;aEegCov2;!g,orC;!io,y;dy,ham;dfr8nzalo,rDttfC;ried;an,d45;!n;acoFlDno,oCuseppe;rgi5vanni;be6Aes,lC;es;mo;oFrC;aDhard,rCt;it,y;ld,rd5;ffErgC;!e7iCy;!os;!r8;bElBrCv3;eCland,r4Dth,y;th;e,ri4;aXeSiQlOorrest,rCyodor;aHedFiC;edDtC;s,z;rich;!d40eri10riC;ck,k;nCs2;cEkC;ie,lC;in,yn;esLisC;!co,zek;etch2oC;ri0yd;d4lConn;ip;deriFliEng,rC;dinaCg6nando;nd5;pe,x;co;bCdi,hd;iEriC;ce,zC;io;an,en,o;benez2dYfrXit0lSmLnIo3rEsteb0th0ugenDvCzra;an,erett,geny;!e;iDnCrol,v3w3;est5ie,st;cCk;!h,k;och,riCzo;co,qC;ue;aHerGiDmC;aGett;lCrh0;!iC;ano,o,s;s1y;nu4;be9d1iEliDm2t1viCwood;n,s;ot2As;!as,jah,ot,sC;ha;a3en;!dGgAmFoDua2PwC;a2Oin;arC;do;oZuZ;ie;a04eTiOmitrNoFrag0uEwDylC;an,l0;ayne,ight;ane,dl8nc0st3;minFnDri0ugCvydGyle;!lF;!ald,nCov0;ell,ie,y;go,iDykC;as;cCk;!k;i,y;armuFetDll1mitri7neCon,rk;sh;er,mAriC;ch;id;andLepak,j0lbe9metri6nIon,rGsEvDwCxt2;ayne,ey;en,in;hawn,moC;nd;ek,riC;ck;is,nC;is,y;rt;re;an,le,mKnIrEvC;e,iC;!d;en,iEnell,rCyl;eCin,yl;l3Zn;n,o,us;!iCny;el,lo;iCon;an,en,on;a0He0Eh04iar0lSoKrFuDyrC;il,us;rtC;!is;aFistC;iaDobC;al;no;ig;dy,lInErC;ey,neliCy;s,us;nEor,rDstaC;nt3;ad;or;by,e,in,l3t1;aHeEiCyde;fCnt,ve;ford,t1;menDt6;us;s,t;rFuDyC;!t1;dCs;e,io;enC;ce;aHeGrisC;!toC;phCs;!eC;!r;st2t;d,rCs;b4leC;s,y;el;cDdrCsA;ic;il;lHmFrC;ey,lDroCy;ll;!o7t1;er1iC;lo;!eb,v3;a06eWilVjorn,laUoSrEuCyr1;ddy,rtKst2;er;aKeFiEuDyC;an,ce,on;ce,no;an,ce;nDtC;!t;dDtC;!on;an,on;dFnC;dDisC;lav;en,on;!foLl8y;bby,gd0rCyd;is;ine,ke;al,lK;nIrC;at,nEtC;!raC;m,nd;aDhaCie;rd;rd5;!iDjam3nCs1;ie,y;to;kaMlazs,nHrC;n8rDtC;!holomew;eCy;tt;ey;dCeD;ar,iC;le;ar1Hb18d11fonso,gust3hm0Xi0Ul07m05nRrGsaFugustEveDyCziz;a0kh0;ry;o,us;hi;ata,chiKiJjun,mHnEon,tCy0;em,hCie,ur5;ur;aDoC;!ld;ud,v;aCin;an,nd5;!el,ki;baCe;ld;aMdHgel5tCwA;hoFoC;iDnC;!i5y;ne;ny;er7rCy;eDzC;ej;!as,i,j,s,w;!s;s,tolC;iCy;!y;ar,iCmAos;ne,r,t;aVbSdBeJfHiGl00onFphonsEt1vC;aPin;on;e,o;so,zo;!sR;!onYrC;ed;c,jaHksFssaHxC;!andC;er,rC;e,os,u;andCei;ar,er,r;ndC;ro;en;eDrecC;ht;rt5;dd3in,n,sC;taC;ir;dDmA;ar;an,en;ad,eC;d,t;in;so;aGi,olErDvC;ik;ian5;f5ph;!o;mCn;!a;dGeFraDuC;!bakr;hCm;am;!l;allEel,oulaye,ulC;!lDrahm0;an;ah;av,on",
    "Person": "true¦0:1Q;a21b1Tc1Hd1Ae14f11g0Zh0Ni0Mj0Jk0Gl0Dm07n04o03pYrOsItCusain bolt,v9w4xzibit,y1;anni,oko on2uji,v1;an,es;en,o;a3ednesday adams,i2o1;lfram,ode;ll ferrell,z khalifa;lt disney,r1;hol,ren;a2i1oltaire;n diesel,rginia wo12;lentino rossi,n gogh;a4h3i2ripp,u1yra banks;lXpac shakur;mba03pper gore;eresa may,or;kashi,t1ylor;um,yana;a4carlett johanss0h3i2lobodan milosevic,noop dogg,ocrates,pider1uperman,wami; man,man;egfried,nbad;akespeare,erlock holmes,ia labeouf;ddam hussain,nt1;a claus,ig8;a9e5i4o2u1za;mi,paul;bin hood,d stew12nald1thko;inho,o;hanna,ngo starr,valdo;ese witherspo0i1mbrandt;ll2nh1;old;ey,y;chmaninoff,ffi,iIshid,y romano;a4e3i2lato,o1uff daddy;cahontas,e;lar,per;le,rX;lmer,ris hilt0;leg,prah winfrey,ra;a2e1iles crane,ostradamus; yo,l5ttie,wmL;pole0s;a5e4i2o1ubarek;by,liere,net,rrissey;randa ju1tt romney;ly;rlin,ssia9;cklemore,rkov,s0ta hari,ya angelou;ady gaga,e1iberace,u;bron james,ch wale1e;sa;anye west,e2iefer suther1obe bryant;land;ats,sha;a2effers0fk,k rowling,rr tolki1;en;ck the ripper,waharlal nehru,y z;liSnez;a7e6i4u1;lk hog2mphrey1saZ;! bog03;an;l1tler;de;dwig,nry 3;ile selassFlle ber4m3rrison1;! 1;ford;id,mond;ry;ast0iannis,o1;odwNtye;ergus0lorence nightingale,r1;an1ederic chopL;s,z;ff5m2nya,ustaTzeki1;el;eril lagasse,i1;le zatop1nem;ek;ie;a5e3i1rake;ck w1ego maradoB;olf;g1mi lovaLnzel washingt0;as;l1nGrth vadO;ai lKt0;a7h4lint0o1thulhu;n1olio;an,fuci1;us;aucIop2ristian baKy1;na;in;millo,ptain beefhe4r1;dinal wols2s0;on;ey;art;a6e3hatt,ing crosby,oFro1;ck,n1;te;ck,nazir bhut2rtil,yon1;ce;to;nksy,rack ob1;ama;l 6r3shton kutch2vril lavig9yn ra1;nd;er;chimed2istot1;le;es;capo3go2paci1;no;re;ne"
  };

  // generated in ./lib/lexicon
  var lexData = {
    "Adjective": "true¦:!1:#$%&()*+./<=>?@[]^_`~:ne,na,re,ar,ro,tn,et,iv,ni,no,li,ra,ev,id,mi,ap,la,il,si,el,op;0:BT;1:8M;2:AN;3:C2;4:B4;5:CA;6:BW;7:AD;8:9X;9:C8;A:A5;B:CH;C:AZ;D:7X;aB1c^ohak(w,e93l71m6Z#z,o0KrYsKuIzEódox;aF^ef9ToE;l>,%f;ciEfs3Pgas,p9(v;fe,pA2;am,d.h,eEn,rc;b`p,duj,porue,rbeh,ta;aQePiaJn0NoGêE;cBEd$loh,lg4nEtr3ugutr5;ihc,~aj;cu5git$,mBOrieFsEtium;o%mun,%v?;g2O@0;col,er,icI/iGo83p82rFsnDt#ma7VuE;d7Qta;edef,o7X;cEg2;an87i85;ep1ifo,os;lp@s,(hlDt#3Hz[9;loBGmBE#gíd4rB4;aVeUoE;dJhlDiFnDtE;*o0ud7;am,p,%E;f4pus,tE;nEs5xe;a,i;aFeEia6;c#v,hloca;brutrCcifinu,*$]g,hJif53lItGvE;o4%sE;bo,n3;nEul;ac#,*;af,ez;]EnB;ba6tab;pus,uq51;i<maf,luEti<m;cFgnEp5;ai6is;at5Sit=p;bofó#x,c4Zd35enâ)~1fof,g33h2Xi2Hjus,l2Fm2Bn22p21r1Hs0CtTunêg4vGxFãE;dnAg[,h]c.rb,<m3me],(hc,t_rc;iab,or;&b,iEon;sKtEv;aGejbo,iF],pec2rEudo0;essa,~s8;s5te3P;cinFgn+,irc,rEsn9t2L;e#g,gin8;um3;lupmH#er3Lolpxe,sE;[,eE;rEss5;ga,p8;i,oc;aUeSiOlNnKrIsEurb;av,eF+,uE;bor,j85;dom,/E;h,s8;eEuc;ba,c,p1;eEo0ujn3;d7gub&,hlu=b,jon,l,muic,rEz.c;ava,rib;a,eb1ovn3Tuc;cílGdr85eE/b;fErt1;%p5Hs1S;!os;iuq4l31rE;p,r3;c[,hc,rEsn0M;ab,g7P;&,ice0H]f,n7XoEpal2sorg;c0Fd0Dg0Ch09iZjXlVmTnCrMtJuGv%n,çE;[1iuge0nE;&4Pe%uq,u1R;tExul;iEr+;ec/2Urip1;iej,nFsE;ejAiuq,og;[1e]t;dDeJiIoE;c$r,giG]FmEr(h,v%f;a,i0;c,v;r,v;ehc,)D;d5#g,za0;af,i*,rE;ahc,of;ez,ibuj,uE;baf,g;aE>4;gCr3;cJdIgiH]v,/m=h,rEs$;*FoEuc;lg,t+;irc,_m;do0l2;*,o,ut1;&g,iGnEu.m;anWeE;d#t,<s,ta;bma,lAtsr5W;lFnE;am,ir9og%v;+&Aug(;irCn8;adiuc,eRiElA/b,rN;av,<bah,r9vud;oj,s+;d4rp;aWd$lAeVgTiHtuo,uE;c1dFgEp,tuf;es6H;!am;eEol;cMdLgKh$1NlJ@0/Ioçia6rut#Hssorg,tFuquobE;ax;iE.,oh<b_b;ag;va;ip;atipsoh,is&b;$rt1;a8S(;aEitsuj,n81;f,pa6;am,eE;n,)í;c.s,psó0;c,lc,r;@l,ot;aHeGg?,%Eíu#g;dom,tE;!.,xe;r7uqC;bru,ci%ma,iElp,muh,rit,y`sG;avGd<w,]ti,%Estaey,t$k,ugnuoy;bElpek;ew;ah;iEl9sDutsóp;ním,tFxE;ám,ó0;lú,íg`,ó;eEiuq5Iun;b,l&[,=ma;bás,cAdSeRnQrFvbó,zE;av;a?iNf,pó0áGés,ótaE;fsEsuca;itas;d^B?,<h,nIrHs0PtE;iE#d7o;lBnE(22;amuh,um3;*^,~m*,)3;?(Eois+;!aZ;se0;óval1ôpal;f,hc;as,ém;leInE;aGiFoE;_r,t_6;uqsDzB;rt1ts9;m%v,v;iE/l,=l;em,t$;aWeViInHomóc,(g,uGíE;&tEul5;n0Rs?;hc/hc2m;^,ufo0;cOdnMgLlós,mít,#ve0pKrItFvE;e4Tív;emort4%vE;?,oE;rtxe;eEfBpm3;f,uq;ár,út1;.f,ír;eEêlp1;erprus,t#;eEúl;hn0C=lc1;l,rg7za;c0Ie0Gg0Ch0Bi09j08l07m05n03o02puco3XrWsRtKvIxHziFçE;&g#,r0G;lE$g(;a2+ic;al2ie4N;iElA%s2;rp,tom3Z;iFlov2$c#,(Esafa;pm3;cHeG@<,piFrri,sE;secen;ce0;j2ps2;[9xe;ep,n9sFuE;!o;aFerE;pa,t1;c&f,p0R;[e0bi<uqe3Mdauq,eH/h,%,tGuE;g=ma,oE;d,t1;`,surf;dEpsL;n5om;gAv~r2Rz;iEoxi[a;f2lpics?,m%t8tsW;a,iEon2saisut#;m,$;cic2u@ss?;es8;fnEg`+i0;ocs8;cob8lom,#40;eFlE$z;as,o3Y;pEssB;as8;mEz/rb;of1;ecIiEofus,ude;d8fiFlEt_fB;ed,pa;]E;uq;bo;&f,iF$rEuol;b,f;dí%v,f01g00lYmXnVorUpTrRtExót;nNsKuecam=hp,áGíFóE;npih,ruen;l5rc;mG$f,pErp;it$,mE;is;`bo0s5I;áEí@$;bmEc=s,t$f;ob;âmFêE;tua;or;!é5HófE;ue;ít;eh;cét,égoirc,íc,ôssEú;&tlu;rédipe,â.dordih,él5;búp,íteEóc$lD;ca;látson,ám,óloib;árgit&tseo/rc,íE;cEngA;ep1;eEiur,ob,um3;gavl7voj;a0DeOiFoh$p1uE;s,za;báh,cLgáK#vJrItFvE;ic;nFréf,soh,us,ás%v,úE;!f;af4eg;+,ét1;uj;!rf;áf,íf?,ód;if1Vurc,vE;áKíEó@;/ps?,rHsEtab@;+erp@,n7sE;ec,~E;!@;c4rE;*,oh;co],dRgiQiOma,oz&,rJsHtFvE;o0uol;ieps2#tsEon,(pEse;us4;/pserEs[;!ri;eGimda,oE;da,nE;oh;lot,nE;>,luv;cEf;#g^gen,os;ma;&ga12imrEuas;of;rc;col,e0Dfnui6g0Ci04m(n,nToSpRrNsnDtHuE;dFgi,tE;a,n5;at1+?4;+,#mFot,(mE;!i;aEi)7;dnE;uf;em;amacGeFoEutan;ti`e;b^,def,g;ib;ic.0;ssC;emo#f,iLoE;iFrtE;[;cEg2;aFiE;da6;nEr,sn7;!r0S;f,giE;(;on;cHdGnF(t>,vE;oj;eg;num,r3;ep1ifEos,=p@;o,rE;epus;se;`,ov;di,lZ/tirCr;ol;cod,d16ippuy,m11p`er7r0Vs#0TtIuGvE;aE`;rg,us;gní<6qiE;hc;nG(FsE;eo,i6;f,n;a01eEiug7;aZcXdUgQiMlLmKod,rHse0tEuq,vom3zul2;epmocU~F_sE;er,rC;!e0;aFeE;f?,ocQ;c,psM;*;av,ecF;cGdeboF<s2#vn3%pE;xe;!s8;[,ife;iEru;lFsExe;$6;*4gen;iF#pedEu0;!.;c.2rrB;eEo4sebup;d,r;rta;cVgThlRiQ<g+,.csPrIsserHtFvEzi<t%f;`2it9;a6(pE;@;*4;bHeEongi;lFveE;srC;ot;+,muE;ls8;ed;af;d&,fn3=<h;em7iE;rb;`e,ig,loEor=;pme;ip,ot,rA;am;/iE=iuga;ab;boHd5geXtsFvE;^;euqe,uE;<;n,p;es;ergH^bGrE;if,oE;#;us;ní;lG$FrEur;av3>;rg;eb2imuh;er;b%bBc0Ud]%mse-e0Senâ(pme)3g0Pi0Gj$=l,l0Bm0An04r00sUtE;c+4erRircópih,sE;eb,iGíE;oge,urtE;];cedrMfrusdnL]eK@InH=gG_crF)MvitagE;en;an;+;oiccefrCut(po;ssCto;ep;di,r;iw;ak;?;.;ecHoFsE;ur;is#te0viE;&;$E;rf;ieE;cnE@0;anE;if;amIeHiF%tE;.,xe;.mEvB;ef;lp;uh;itlú;e=gGoEucsúnX;círE;ga;at;al;dKrE;áFós+o0;rp;?,tE;enFubi6;rt;om;uj,ém,í@tlE;um;itEleb;$;oc;drE;>;epOiHoFuruxE;im;ir9;ac;rGsFtíl5;~;áb,íf;téGóE;tsE;ih;le;as;os",
    "Noun": "true¦:!1:#$%&()*+./<=>?@[]^_`~:er,re,ro,ne,ar,na,op,ni,et,se,ts,rt,ev,uq,rc,es,la,rp,pm,ac,ir;0:E6;1:EM;2:EN;3:DX;4:DD;5:E4;6:EO;7:CB;8:BB;9:EG;A:D7;B:CI;C:91;D:D3;E:E7;F:CE;a9Ce7Ai78l6Wm6No0CrYsQuNzJãIéGôva;fGp;!`;hn9mri;apI>,iHov,uG;l,@;(,uj;!(;aH[um,éG;c,pahc;p,rg;aL#oKoIuHág,élgAêGí5;m,?r9;ed,pr0;)lp,tG;n*,udo1xB;dagoj,tua;d&v,mGrbo,si0;(BN.sis;aSeRoG;c,dNhn7i$tMlKma,s/fo1tGvaf;cIiH+p,om,uG;a,do1od;el,@3;aDC#C;aGf;c,v;+,xe;!aG#r0imu3R;#>,goj,h]b(t,nGtuF;[,$vog;díl,hlum,tcár2za1;!gul,hlim,lód,m,p,tilim;ba5Pc5Md52el50f(gár5g4Uh4Li3Xj3Wl3Pm3Ln3Ep3Cr2Vs2Nt1EudívidAv1Axe19z18ãKçG;aHe1ivr7oG%f3;cs8m];d8p3rbG;!a;c,dadic,gró,hc,i10m0Zp,r0Ys0Nt0Lxi5z(,çG;aWcTiPnMome,pKuG;dIloG=3F;sATveG;!r;#,o1;ecGo;n0xe;`,eGuf;tGv6R;a,+;dIele,+f4s*HteFuG;b~<Cti<n11;!m0o,sCxe;(t,e,n0;aAHeG;lGrCs,to1;[,oc;cZdnuf,giYiVlUm%fTnSpRrOsn7tKutJvIziG;lG)g%,tavi1;a6itu;o^a,$sbo;ca,is;#p6D&Hov,%pD/G;!fin9;i%,s#pG;a,#;alc4eHoG<i+mda;c,lpD;def,g,po,t];iciACucoe1;!gis4;!+,s5L;a0P#,fAup*;coH]va,rG;av,c;gen,ssa;l,rbo,<0P;iGude;fissalc,lGnum0;bup,pG;a,xe;ip2r2/G;g,?;iNnL$v,sGulcn0;eIiGucsC;fo1mG;!oc;^Gs;!mi,xe;apDeG;mCtD;c4^,vG;!eGid;lBr;d5>,t5;!ri;gHnGs`o,va;ipo,u9A;#,il6;a1íuje1;lFs;itGo4T;cGejHom,uceD;a,ejG;bo;a0Lc0He0Gi07nMov,pa,rLsHuGx.AF;do1+m,rf,tiR;eIoGuc;g,_Gr;i,oc;g,r,to1;[4*;aZeHo7IuG;jn0ssa;mHvG;!e;aPele,iIom,uG;a,cod,gra,rG;<A;cJdeco1],rFtHvG;lovn2Bom;n7sG;>A;eHsG;an,#c;hn0lebat3tnoca;gKic)+f,lr5no1Qpi?e,sJtHçG;)l,%;(t,rG;ap4oF;`,n8;ap,luj;c,s;bNcréDdé@,eHlfn0rGsó5L;g,<Cíp3;cn0fJjIpHrG;id,t3;!s6;!us;!eG;!^;mâ,áh;jo1n;aIeG;jGpsa;bo,o1;!_i,r4Ftn0;cid+s,dHg,noe_2rG;!t6;i73n9;`,eM~LrJsGu;ap,eGimorFo;cGrgn0;a,o1us;e4QucG;!#,n0sC;!%s;p,^;bUcTdSeRiNrLtHuGvil;g7j,o,tuf;aBemInHsi+mG;!-oriemi1;ec,oc&;!ít&c,óli?;aGe9H;b,c,gic;eGt;g)89hG;c,nG;aFeg&,id;mún,nég;a?,iv;ul;mGutuo;em,o;it,mGr0urg;`,.;aLeKiJoIrGu];>Got;+,og;d,s;#,nEs&,<4;mó&f,rrB;!lp;(,rBsiHt~,uG;sn0;)Grut;cEg%;av2cic,eLit3oJ_eDuG;cHtíG;p2t;lác,ríc,át55és,í>;bGs;!mís;b2dom,<2;[4ieb;(,bál,cZdY[s5fXgél0mé1nV*a,pícTrHtGvan;!ís;!áLéHótG;al6~rB;_i,tG;iHsinG;im;@;]s,nJrIsHteGusu;~3L@7;#_e,$vda;oh,tn0;ec,oG;icnuf;inG+1;um;ímGómi=5;od;!as4;ní,ár,é1;nêlis,rém0ál5íHóG;gen,s;c$DfiG+;de;cib,lLnG;aJeHiGos;m2v,ziv;_Gs4;[4;b,mat;aHeGif,o;cn0p3raZsn0;b(t,vr2;#JiHoGr2;f,j,láC;dóc,mGr8tra;a,iA;g,pG;me;cGó=8;ún;aMeLiJnHoG%ca,ut3úe1W;m,tém,ír8;am0uG;f,m;cBd8nu,r9tG;n7r5/v;d,m;cRdQePgNiMl,nLtKvHziliG;tu;eHorG;pa;le;(t,lus6/,up4;[,imon4;cossa,];!il,ovG;da;mon,sab;!iuc,los;ob,rE;idH)b,olb,rab,siG;d,r;ém;c,id;eIiHoG;s,t;draj,f;dKgGmoh,vun;aGiJr9;iv,mi,no2Lr0sHtGug+l;)v,%p6;nEs5;%;aKeIoG;b.Goclá,s;uf;nor0p5toh,vG;ín,óm1F;iLmi),nJ$&g,s2tHvi<G;ef;em,ipG;`,soh;`,iG%j,ubiU;f,s;c&t*,$t9;ap,eG;l,r;bulc,c1Fd0Ofehc,i0Ml0Km0Gn0Fp0Cr0Bs05tKuHvaGxi8ãm;!hc;g)s,qG;atGr5;a,s4;abZe+bag,iYnMrH/G;d%n,l,t;aJoG;c,m,psGs;)G;=;!p;aOeHoG;f,m,p,zi%h;c&tr8dKgJiInHrG;eg,f;i05oF;bma,lc;!a,~C;!iG;ca,/1;dHtG;ibah,&s#p6sA;)m0ut3;el,mil,on;ed,m0;aK.ópih,iIsG;alc,eG*;$tA;láG@;);b,f,rf;d5ovrá,%t,<E;iHlG;og;cní1?e;ofelBr2;aDiIlif,oHuG;lS<0;f,n;g6@,t;av,ep,orG;tn0;cGrés;ép3íf$pus;aJeHutGúas;ita,&vuj;rGs;!ap;dItG;em,nG;ov;eiXiIlucH$Guas;bil,v;af,ifC;!cSlPnuNrMsJtnHvG;itca,on;aGe;?;$H/cG;en;vinu;otua;!m0t%G;po;aHibG;asn*s6iss*;#,no08?;!ap2olG;>;cos,rG;po1;af,idní,)mor;lc;c4Xd4B#á,f#at,g46h3Wi2Hj2Gl29m1Yn1Soss8p1Mr0Ys0Tt07u04vZxXzeUçG;aQePi<OnGom,%f;aIeG;od,$fC/1tn7;id;dJiIrG;eGug7;dil,p3;fn0],@;!um;uj;b2p;eHrG;!g,p;ma;lHrutGt$c;an;eb;at,iaG;c,f;itGo1$s6uhc;aHcepG;sr8;iciAn$t],tG;c2WnB;gGl,r;nGá;íl;ad,eZiYlXnUoTrSsHuG;l,rf;ePiIoG;c,pG;o1s6;lItHv#G;!t&;&ic,ra;!aG;iHnrG;oj;cep3;f,%lf;`,*;n,rr4;aLoHuG;gr8j;c,p;af,ov;ec6@3siv;)G*;lp;aJeHiGlob,n#_i,$vn0s9u2;oc,?s8;f4m,ps4^G;me,rus;!c;a02b00d8ep3g6ieVnUohT_0$Stel,uGval5;co1gif,tG;aMcKieJlHnG$ba;ip;a,ucG;!~ga;fe1l;.i?Gu18;ra;diI$G;_BtG;il;dn2;t,ug;!n7;oh;dIfGn9rr2tnorf;!-aG;dnug7tx7;aG)b;c,m;mGo;os;c,mâc;aKiuJlIoHuG;or;c,=;uc;qe;p,te;am7eJiIoHr8ul0;ep;d,z;cidEgáp,m,nE?ám;c,p,tnG;ec;aOeLiJ],rG;a,oG;fGn;!#;c,lc,rgGtív;ál;lbo1+c,*,tG;!sG;is;c,rG;go1;aLeJiv,oIuG;a,cíGléc,mróf;tr5;b,c3;bat,nG=3;aj;c3s;#gi,ol;a1c05d,e02fZgVh)Flímaf,mSrK/ItG?ratua,v;!n(G;ag;*,ugeG;rf;at#c7geLoK<údAéJóG;mEtG;iv,sG;ih;f,t9;.,g.2i9;];[;edaGonoce;ca;_0;oloncB$HétaG;=3;&;.;(gotHosolG;if;of;dHlbm[G;sa;`,i,];(com4nIíG;l*,tG;on;âtVêGívo1;dRga,iNloM$fLsK<iJuG;lfAqeG;rf,sG;!n0;s6xe;ua;#,n0;iv;cIrG;epD;xe;!sn0;i/1&G;pedAt;+;%pJsG;bHid,nucrG;ic;us;mi;ed;cOlKnG;aHiG;(,l,z0;_2tnG;om;atIiHoG;c3f;!f;ab;or,r9;el0iGord,r2;ma,rapG;(;at;rá;aVeUiOnLoKrHuja,íG;as;aug,eGoc;p,?3;/;m,r;ab,eGo;r,v,zG;af;dEm0&Irr0tr5vG;!íd,úd;ap;va;oc;em;om,?;cKgImaHn,=G;&,/;c,hc;eGurd9;hc;/,éd;iIoHr9sub;am;b,pé,=;lbúp6rbáf,súm,tG;sí$tc(2á1íG;lG@;*;^;`;#",
    "Adverb": "true¦:!1:#$%&()*+-./:la,ed,tn,at,er,ne,sa,ni,uq,op,em;a10eUiuT#SmLoCragav$,s3z2á0ãhnama,ê-r.,ía,ós;c,j,l0çi-;!oca;as*,ev#t;a7e2iam1onDá0évarta;i#,rt9;!aj,$;ru2%0;a0/(tH;!d;g#,h0;#,)n;)pa,rev$;cu.7d5g#,i4r%$,*ca,t2v#s,xiab1ã0;)s,t;a,$;ium,n&,re0;c$,p;/;ai07ec,o0ut;m0Nt;!m&;e4i1é0;bm&,-a;f1s0;!*;);b,%o0;!eT;m,+fa;m,qa;d01gnol,joh,rpmes,*Z%0v(b;aW/0orf$;a9e4l0os,selpPumFzilef;a2ev0icifM;a0iss.;tse%ocDvoP;(,+f,pic+Orutan;dnarg,rvE%1ve0;l,rb;&imocn8e0iug1;seK-0;esn6;ciKdGen&luFgiEiraDmBr7s4t3vi0;s0tefe;secAulc0;+,xe;aid/i,elpm1rec;)t1ojar0;oc;+;a2ie0ugG;g0mi9;il;lc,r;(t0itlu,#c;xe;id;%a;mis;a0nufo1;/on,i1tis.o0;rp;*mB;nu,tavl3;idDt*b,va0;!rod;-;es;(da,#b5no2r1úi0;ma;&;a,d;d+a,mi7r2ss(p1tre0;#;$;ienam3o1u%evr0;.;f0ga,rtuo;!a;(bos;ca",
    "Infinitive": "true¦:!1:#$%&()*+./<=>?@[]^_`~:er,ne,oc,ra,se,la,ni,ed,na,ba,xe,ar,ro,re,hc,da,uq,id,op,ep,pa;0:0G8;1:0G6;2:0F3;3:0G2;4:0FI;5:0G5;6:0FQ;7:0EC;8:0DQ;9:0FH;A:0FA;B:0DO;C:0FV;D:0BT;E:0D7;F:0EF;G:0C4;H:0EV;I:0FK;J:0F8;K:0CU;L:0EB;M:08H;rN;a87e3YiY_Nôp;aWbVeTmSoR?QsOusN<;!(5;+,^N.F_;!e5*;pDt8;!rp,tL;i,%3Q;d,rNt.;!bLp,t1;os,us;!rY0tsuj;!a3Hb3Cc&004d2Pg27hn26l20m1Un1Mp1Kr14ssot,t0KuZvVzN;.rf,rTuN;dPlN;!eNs08M;meFr;aTN/,eOnZorN;p7t8;!d,r,s;ap3ec,uz;!aP[,eOnMVo5?Nuo7;s2t8;d,rOK;!#,rXNs0;b05csimi,g01lXnWp,qUrPss_,tN;at3itsN*;bDeHnPo5;!fQp,r0tsN;bO+,nN;i,%7;a,o2;!usu;eZJ*l0>tN;#,<;a,imB;a,/,cPfO^,oN;p,ve;!a,e3In0B5;n0B4<;esP*tO&N;!d6;sB<;!n4r9so5;irtNmi;a,#,n4sB;al,celf05e03im01nWrTsPuN;bAcNlg0;*,?p7sB;evPiNor,ur1;sN<LN;bDeHn0ASr9sa2;!#,*,s0;apOevNos,u6P;[,^;!eHm4;a&g,eN;mPsN;!n4sN;a,#Y4^;!ef,s0;[7e2Vi,o,?Ns07C;p,te5;lf6pN;#,m4;!#,*,u$g;!ap,bZeUgen0i]ToRpQrPtun2uN;aNbm4rp;h,<;ag,os;muc2us;fab3lNv03B;f7%2;[7#,*,r9;[,fOgNs8te5]8;!^,*,us;!a,eN^,n0A3o5r0C6sIEua;dRTrN;!p,r4;aO%N;!#,$,s0;!#BW;lucsTXrCsNut097;+,uc;aTeSiRrOuN;!#,mP5p,rb,s0z;eNof;cNd01Q;n4sB;f0t7;l,v0X;b,g;=b,#0DZiO>d,usN;!bD#X6n4sa7;d6rN<;g3^,pN;eHmNo,us,<;i7%;aRePoOpmi[R8uN;bKHp03I;bMJg1m0p7;cId,pN;#,m09Do5<;bYZf,t3;alp,#,urg;a02iZluf7nUrPuN;fNm,r;!#,s062;ap3ePuN;!sN;!*,s6;mNpsa,t0vWS;bDe,i;iOuN;!jQSm,pYO;c,f,pmi,rNt09N;!f8tsN;bo,[,#,n4;d6lOrNs05R<;e,f,^,r4;e,f063%;!#,oNr0AXv;c,rt6;a07e03iYnToRrPuN;al~,ca03SlN;a,i2;ac07ZuN;!s,ta;lN?;ce,p0CN;aQicP%,uN;fNtn4;!^,n08Js05D;!sQ;c3pIrb;cQlPsOv^N;!bD;#VY;e,i,%;+,*HW;mPpOrgN;a,#,or2Ls054;!mi2s0<7;!%,s0;!usNvS7;?p2sB;iPmuNus;cNz;*,us;*2oN<;c,rp;bAcQrtOsNv3;!s#KZ;!a,bDeHn04Yor29sN<;/,^;!eHs0;b3Rc28d1Ng1Ih1El1Bm17o16pmor14r0Ws0Vt0Jug?0IvY<m7zN;aP^N$b,%;!=TX#VDlEnNr09Ws0;eb,%;fPj,rN;pNt;a,m4s0;!-meb,aQeOr9sN;+,itas;mut,rN]il;!=,>t,tup;!rTOs0;!a05eZivYloUoQrN;eOosN;!/;f,t8;@,mNrp2;!eHoN;cNrp;!ol;sPvN;!eN$2;!d,r;!/,#,sB;!#K7n4;d,rNt.;!csNp,t05H;bDeOnNo5;aFi,uV0;!d,#,rN;bLp;ce5#,h;!#,os;!aWbo,eQnP?vOsN;/,us;!bDe04Sn06WorT0?02;am,%;d,mOrN;!r0t1;!bD#PoNr08V;cGrN;pWDt8;!&,t1;!bNl;!a,eHm04T(;!%2(05I;!c2e]SfLrN;av,oN;cNm;!a,eHn06Io01J?OsN;e,^,.F;p,t8;!-N#,lE;meb,siE;!rN;et8i,%;d04Pm2Gp,rL2s;eO%N;!rC;g,rNt;p01Jt;!avOeN;cIrZ1;!i]e,s0;c$PloN;cNt;!a,#,$,(;!e5s0;eQiv,nN?ts/;aNir,om;rNt;!/,fn4t05J;le7rKMtoSK;e03nO_,rN;a,`,om7;eOoN;c3psKH;cW#pVfUlpROpSrRtNv7;!a2e5nNs047;eOiN%;!r036;!bDs0;!pC6;!a,eAYmi,o5sN<;+,us;!+,o;a,eHm03NrD;a7#,n097sN;a,eN.F;d03Sr;cNf;!a,eOn4orNr07Fus,<;p,t6;rp,t.;eX$WrUsN;aSeN;bur1dQi]a,lPmut8nOrNv?fe;c05XoJ5;am6evuj6;avn4o[;!.c8urc6;n7p;eIotN;!#,n4sKF;tr9v03D;a0Tb?bos1d0Nf03Wh0Ljir1l0Fm0En0Ao[,p09rWtQ]OvN;aQebAi=1;aNir1.P(,uol1;!rf1;!eRionQ)1noP>MsOuN;rbA;a/,+,iF2ubor;ca,t1;a,e;~,rt1;aXboWd_a,eUgTiXRoRrQuN;csOdNf1;amG$;bo,e;at3o/;lo/,m3vN;af2);aAe1;fo,mNp;!i,s0;$,pA;c043lc3pN;!aV3m4s016;me,>t1;aPef,rN;aNet1of;c3ug2;mr9v18;eUO>[;aReNiv1oM;bN&M;atsNme;bDeN;!e5r;f2t>f,ve5;lSJnN;aM%UP;aReQiP.OrNuA;at1ev6us1;lpPTrg1s1;av1lCUod1;bo2mu;pTFrga;m3v3;aPeNmal;b03UcN;#,n%IZ?pA9;c,s;b07Bc02Nd00CeWZfWGgUIhRZiOZjNUlL9mK1nH4oGCpFQrBEsA3t50u4Cv3Mx3Bz0PçN;a0De0Ai04)03nWoTrOuN;b6f,ga,im3lLoFrb0;aQePoN;!fNm);!#,(;ci),t;fsBg3p;b3c,[,hJmOpArN;!ov),t2;#,);aPeOiNugab;!rts0;?fBva;c),d,ifa,lOrNva;`(2t02X;!abN#;!a8F;!c2#;!b4d?p04oRrQtOugNv;#pYE$;a,ief1sN;em,uj;!e,uo;f,)b;/c03CmPGpOrN;+018~;me,oF;bU0cWdUeMgThSlRmQnKov3p3rN;abTZ/,gO>Nt;c3m;n00Xs0;!ufY2;!eCZ$;c6l07;ab3#01Cl+a;`N>M;(061;!ip3;a27e22iQnOog,uN;bmal,rc;aNic;b,z;=01Pc>Id1Xe$gomoh,g,h.t#b,l0Um0Sn0Kr00tRuOvaN;rc3us;ja,qN;etC&N;.,?ih;aQePnOoN>M;c,npih;amor,eic01V;/f),d0fo5ngE_,rI7t*s;b,f1mOpNrcAR;it.,mis;!=d,eOgNilc,o&,>n,uaF;it3;lbo5tsis;a00belec,eXitWoO?ta,tN;acic,ele;bTet,getCirR)v2meQ$m>p,pPrrOtN;inom,ua2;eta,oh;av,met00A;m,ta;eNp;f8tI;&,ur;as,rE;jo,lZZtOvlN;up;=Cc=CuC;dilLgluv,ilRlN;_,uN;ciOgNp_;#,*s;dir,trK;imaf,uc9;aTeSivBoQ?OuN;mi,t>po;dom,f8tNv1;=f,e;brCce5ga,l4m&YFnCrNt*s,çE;dKi;bW1d8lLma;bru,g>S1muYCrit,tisul;anBel_,iNon%e,>f07;*m,to,xE;aVeg.ve,iOoNs0ucatsbo;bmis,coJZhnU9%),ponom;bOcod,ga,?t3tN]XZvic;?f,soh,uIV;aPiNom9M;n_sBsNtapm4;$s,s_;em?pmi,ivIRpluc,?nluv,sn_s6tN;n4on,(;b0Fc0DdnV0e0Cg0Bi08m06n02oss9rXsVtRuOvN;a,ir;di27qe,sOtN;a,ca,irBF<MZ;iv,$00H;iO$mNot,>mi;!ur4D;gBpNv;ac,soh;an,?vN;inu;eQg02Qom2tPuN;lp,tanN;!r20s0;$c2uen;bil,$g;aP`,iXYoN;icNsr9;an,utitsn9W;b,c;i.,>N;f,n;cN$v,?tE;`3iN$t_,os,?m4;fo,*;el,^o5;di,r;^=,oNsif;f,l;!a,?v;&d.t3uga;f1lYUpArOvN;as0#;!pN;!sN;+,o$m;!rpB5v;aWeViRorQ&,uN;l,orOpN;!#,me;fa,t1;b,&;aPeOfNl,m;!a,e5;d,f1ls0];bE7cYZf1;.,v;l7%,rg1t;a08e05iXlWoSrOuN;j[4ol;eOot3uN;cZ9t;!$02YsN;bo,#N1n4;!cRQnPrNs022;pNt;!a2#,m4;#,i;asR4#&,is;=,[d,e,)s,on,rTtPuNva7;!qN;&,(;aPcLBeNis_,luc,$c8om,(;fe,jN;bo,[;!c,#,s0;cUG+,p;c,lNn,rt1s;!bDeN$,os;!rC1;cPf,h*),lNNrN;bs0cNgFIp0t85;!$2s0;!#,nZ8(;c08d06fHQg03jej,ma,n01qZrYsTTtN;aWcUeTiRluPnOrivs0(,uN;a,lf,m;eJ_;c,mN;ut;/h,ecNs;e5n4;cIfe,pr9;aM7eN;fe;!r00Ot;!b0c1`,&,ts$m;+a,*N;gnol,por~;et5BiN;s8tnVG;aOe,iN*m;.~,?va,za~;!s0x1;=g,iN;v^8;aN#;!ve;a49c45e3Oi2Pl2Gn17o0Xp0Sr0GsZuOxN;ete5;aWbVcUfT@,l7mS*m,ohJpQrNtE;cNfs0;#,sN;e,r9;eHmNsWK;a,i,%;i,%,r9sUU;#,n4;eI(;al,+,iF;lf,p;a00bo,eUiRnXVoOuN;c,g00GjGsSR;cOg2mNpCBr&,t;a,eVO;a,#,$2;d,g6lGps0rJU]nK9vN;a,#N;!t1;!b,fRlom,noh,oQpArOssa,tN]6;!a,+,n4o5;!bLc,pN&;!a,me;d,m[;inEn019;bY4fa,gOp,rNv0;&,tn4;!a,$,?v,s0;aWeQoOuN;c1f;/,c7fnJVh,pNtWM<;!a,eHmXBsU5us,<;bRcQfo,lPpOsNx1;+,nYQsB;a2(00O;a,f;!a,nU6;il,oJ;cXRfN~;!n00U;aQeOoN;![,%;cNr;#,rZ2;c,[,r;bVcTdGg3hlibsib,iga,lSnRpCrOvZJxN;iFQ$;!ag,b,ol,rNt;aN+;!/,ma;!a,+,%;!ip,rUA;!apA+,iN;ob,rt;!as,me,s0;a0ReWiVoRuN;!gPjOsN;eb,sa;!a,[,n%8Z;e5r9;cN9mN9pPrN;deMfN~;a,+,n4;a2#,s0;f,lit,p7]6;bV1c0Fd0Egufa,i0Dl0BmWp?s,rVsTtRuOvN;!a,iv,*7?fG;gOqNrc;a,#f,_a,(;a,.s1;!a2nXPsN;o,us;!#pNi,_a,sa,ua;!a7#;aD5f1>Juc3;aYeWgViRoBFrPuN;a,cod,g&,rN;ts8;ef,oN;[,ta;c,dPgUM),~,rOvN;ap,om;`Ipmuc;es,n4;=f,es,ip;lpNrc8s;mVSus;c^em,dnuf,lOma,n>,rN;ap,cas,uj;!rKug6;aNoiv;!ca,s0;bMcapmi,)s,>MD;!ess0iJ$;o8sN;a~,#J;cPgiga,hlir/,i[,j,lpOmi,p3rNuga,velG;ata,be]G;!mi,sSAus;!=HJ+,$2;aSiva,oRuN;cOd8m,pes,sNva,<;#,nVC;af,ifBo,sN;e,ua;c3s,v7;f,m3sN<;!sN;a,#86;b0Ic0Gd0De05f,g04l00mYoWpUrTsQt)s,uPvN;=g,eN*,%);!l,p3;cric,q2;=Keh,iO.F_0sN;ecen,um;]6v;b,csbDf,g,it,ri,ta;!aN#c,ice5lKos,u@;!c0;cNfa,nr9p,ça;a,si/;aFiNov,>d;!lXE;cir9fn4iNo4G;bNcaf;aN+,iss_Q6;#,h,*;a,^CE%M6rug6ur;c7Qd,fTjSl0pPrOvNza;),or~;^1p3t3;!sN;eNus;d,r2;a,#,$,us;!a,nSL;!aOeNrWH;!#,m9OrcAW;!rGG;!a~cC2#,ilNnUBorc,?IsusM3<;efC1os,pI;aOeN>I;d,r&;h,%;b02cZfYgev,iWjVlT*f),_,pSrQsor,tPuNv;qNrip;ite,sCY;ap,i]&;cNex,f,prW5&J;eWG<;at1(;eWE%,pN;m4ucol;bo,eXD*,o5;nE]N;!a,*;a,*2;aOnN;al6e;!c;!af),eh;aPeNim,&4u?;fQWjo5l4nQOpNt0;(,<;j,l,pmi,tn4;!b01c00dZ#,gYhJlVmUpKRrQs0tOv=N;ag3g3;a/,n4sN;n4_a;!aOf6tN;!eHlEn4s8V;bNpsB;lEs0;!#S2ilJ>f,s0;eOiNo5;d,]a;d,r81;$2s6;!^nC;!a2e5iJ;ab,#&;a0Ue0Ri0Ll0In0Do0Bp09r05sTuN;!aR/,cQ+1fOlc6oN;!p7;a&pNsPW;!a2s0;a,#,(;c,p;aUePiOoN;ca,d1f,ma,pJ1rg1;nu),r?ta;cLNf6OgSLmRJp3rOvaN;!rtG;et*2gOpNt3;a,<;#,*,o5;!cPl,ma2pNrg,v0;!=tlu,#,mLBr9sN;aFeF.F;!=f;eOucN;!n4sB;psBvN;![,ig?t,nPJ;al4ilN;ce;d,lg,mMIp4VrNt;cen,p,t1;aQeN;c8dOpNrpNUt8;!a,#,mEVsB;a,n4;c2ma,rt;af,obOupN;!#,mS8o5<;!meIY;b,ce5)R%,p7rQssa,uPvN;!a,eN^,o82rPO;let,r;g,qs9;b,f,i,p6;!.,rK;iv1lOpNrpAVtS2;!os;!g8;!bS2c2f0rOvN;aAK$,sOQ;!/,&,ta;a3Pb3Gc3Dd39e2Ff2Cg26i1Tl1RnoOWo14p13r0Rt0AuPvN;alNil;!a~;ats06c05d03fHHg00jZmYoXpW8sVtN;aSbo,ceReRirQ$va,pC>t,sPuN;f,rt(Ns;!#,r;im,%2;c3t;jn4;!fNm,ns0rf,s;!unE;=,em,$Nsif,ualc1;c,m2B;!d,ga,(tR6t3;!a,rum;!/,n%MQ;esMAifNluf,&Mua94;!a,e5n4sN;+,.F;!amGbo,+,lom2B$pTWrN;`,og1;!a,o5s0;#,*;alodi,e01i00lif8XnXsN;aVeTiRnQoPuN;lNrf;!i;mU6rp;om0;g6l,*mN;!bD[;[,lKma,$f0]N;es,>;c,dClG;eN%$HM;!cN[,#;!nNT;b&,c)c6v);lL$pGEpN;mi,r9;aWeTiSoRuN;!bAm3pAsPtNz;ac,nN(;apA;!sD;b,dom,fGj,t;bQOca,m,p3;!b,cOfGpAs,tN;a,$2os,s0;!$,s0;bLRcLRgNm6Yn;a,s0;m4osLAut3;!b07c06[,faGCg05h04i03j02lYmUnTpRr9s(QtPvN<;aN+,),&;l,~;a,cDYinom,sKut;fo5ssa;ave,rN(,ut3;%8;gi,im;!aPeNir~;d,mNr;!#,%;!n12;aPfa,oOpN;+,mi,<;bAc2;ca,v;am,`;p,?t0;c,lem,n9;!iv7;!+O6.,oJ(T8;alNor4I;!e,%;aNi@;@,p;!aYbAeSg,l0mRpOtNv7;!a,#,(;!mav,sN<;a,eNGnNus;aFi,%;![;bGca,dEgi),@QlOn9oNt8ug3;jGpA;a@,iN;f1s=/;!*N;rt1;p,vs0;aQePim0BnOolN;!am;as,is;),r,t*FY;lfNsNK;!+,n4;anOiN;cRP@;ip3;!b0Fc0Bd06fi05g04l03m01nXpSsim,tO]J9vesNz;r9sa;alb0iOlN;a,u[;!#,lN;bo,sLQ;mQoPsOuN;ap0c6s,tiv;aIe2o5;!%;etNCi;ePic8lOoNum6;!s0<;uv;geHv;olga,(,unN;!e;eEEot;!aIirf6;cov,lo5;ef,iPn_3SoN;m,pN;a,me;l,snN;%F4;aPlu,$,&cOsiN;ve;$,<;lGYm;e/,ilQUo,?v7uI;aPeOiv,nN;alEeg1ilem;m,pA;l,]NU;aOeNul;sbo,<;l,ssE;eUiSmOoNucule;!c7dEQnEs,çL;at3ePossa,ulN;a,sN;+,iv;lEMms0;as1lNv;!i]e2;lec,$t1]7;!cSfNHlcS8mRpOsNt,],v,<,za;!siv);!a,eOi]e,mNsB;a2es0%;d,rB7s;a,uf;a,nOsNuça;am2+;ac3e;a05e03i01lZmUoTrQsPuN;coN@,_,~,rgG;!#B0s0;aLB#c1i@;aOitI%1uN;su,t0;!c,z;)g,s1t;aOiNoDS;!l;cOl6tN;!(QN;!a,$;apGucN;!*,s0;cNrKPssB]e;et.,itrCO.A;c0rN;csBtIC;cO@,lLpN4rNt2çaJ;!r0;!$,(;b0Dc0Cd09g08h05j1l,p04r01sZtXvTzSçN;aGPiN$/;=ta,dPefN;a,?pN;!a,mi;)mG$/;!=LF;!eOoN;p2rt;n,rN;!bL;!nNo/2s0;aJe,oM;!sN;a,#;ag,[~,)/,oOrNt0Z;ef,oM;b3c;me,&;lO*uN;qa;a/ta,irga;am,eJN;!nOo1rN;a)g,`,ota;a,`a;!e,(;as1#,mC;a2Ae23g1Xi0WoYrQsPuN;[4f1),tN;!>pmi;=g,it,or;acB5eQoN;!bDc,[,mGtN;!#,nK4sN;e,.F;bih,[,f8tOvN;*,og2;),*,sN<;n4o5;/2dC3felet,iQlFUpmat,rPsNt31xia2Tzas;!sN;#,^;o58t2;cWp3sQt(O<N;lf7;gN];!nILus;aco,el,iQluOsNuf;#pH0im4;pNvn4;mi,o5;r~,vN;!or~,rIY;a03c00eXiTnPoApeceH>HOuN;ac,loN;s,veJ8;as,eOuN;f,p;m,t30vN;bDn4;bMdOefr9s_7tN;`,rK;a,n%N;!a,#;fnL3lNps8r^7s;!eN%;rp,s;eNirf;fnNles,s;i2%;!lNrP9sHRt3]e,vo;#N;!r4;a0Mb0Lc0Hd>bD#DQf0Gg0El0CmYnGpXrVsTtQuNzub;qNr&;aN*,(;m,rt;aOoMrHQsNulga;=co5bo,+00;!/s,p,s0;$,saN;!ssa;af,cuza,g#9tNu;!uod;!ac,me,oLK;!aZeYiVluUoRrOuN;jn4li,r;ac,eN;g,tNv;!+P<;!/,c,dOnN;!+,g4;!e5;c,f;le,rcN;!#,*,sN;+,^;g,ssB;l,t6W<;cNob,picsB;eH*;ami,iN;>;a2#,n4oM;aPitav,lC.l,oNsaf,u);ic=,rN;it,tK;@,v;m4ob;lpGma;at3eQiOupN;!#,mi,o5<;d1IsN;eHn4r9;rpN;mi;cHZdRgiQi),n87pPrOtaN]`a,zam&;cn4;d,es,fLg1oMt;!a,+,me2;csim,xo;n4>N;!e5%,s0;/,cUd,fTg8Lh),irdnElRmQnPpOrg,s,tNzata;!i]aF;me,(;!a/;!aEIe,ri,uh;ag1f,pN;!a,<;!a,o5u;$,uta;a0Je0Hi07l05o03rXsUtir,uN;fSlova,*,p3rRsQtN<;abAsN;e,%N;!a2;n4s6;!~,&2t3;!+,r9(;aOe,iN;/,c,fLrc;/,isut1lp,p;aReQifPofNut1;!eHnNsFP;e2i,%;!a7nIT;!f1ta;!),s0;d,g1lpBrNsDNt7;a,bA;aNif;cGpDZ;cVd*v,eUlTmG.9D%7GrStOxorNzB;~2;iPlu,*,sN;al,eN;!bDrG1;gel,v;!cal,gal,p,&;!bD%;t,];+,$;fsalb,g),rNtsis;!c,tI;!cWfUgT@,lRm2rOsN;+,lLW;b,gOrNt;a6I+;!o5;cNfW;!a,eHn4o5<;!)M;aN^,*;!za;a,(LG;a1Wb1Uc1Te1Cf1AgGXi0Vo0Ep0Cr0Bsigel,uN;a08b05cZdXgWjab,lu5ImS.,pQtNza,ça;=gGBiNor,s_;p64tN;!*;!iN%;nEt3;ePiN>f7ucG;sNt3;!sB;!rt;a4#,.86uj;a,nNom;`,o;aR`3iOlC*v2o8ric,sN;aAo;d$pr9ev,rtEtN;&2sN;eg;je,m;aOirta,maN;!+,r9;cH3fFR;/,j1;el;o,ub;meNoJ;tn4<;b02cZd.&f,f3gYhnAAiXmWpUrSsQtOvN;e,n4;a,iN;b,]nE;!+,iNn4sa;!rJ;!aN$2&,tnE1;p,tnC;aNrJ2;rtI;a,i,(;ag1t3v;+,*rg0;!=O+,oNs0;to5;ac1;!a,#,me;ab,bZcYfXgiv,@4missa,nufa,pVrUsa,tQuO<,zN;i],uf;g*x,qN;am,i.;a,nPsOuN;m,r;eK0*,_a;ev,ic;rI2t,ub;!+,ip,m4oN;c7s0;!r9s0;av,so;isBAom,uN;j7nbo;a,*,uN;mCr,s8;!b01cYdom7gXm,.,og3pWrTs,tQud,vNz;!a,#,iOoNs0;$,toJ;fa,n;at3.Oo5rE(f6uN;aJt;ms0;!aOiCtN;a2(;f3gat,ma;!a,#&,lA1orta,rI2s0;!alf,+,nCY;af3nN;aNip;c,@2;aNeH;/,cs0g1;et,ic6(m;iNun;rd;!bWcVdUf,gThnu~,mG0*Spo5rRsQtOugi2vN<;!rHRs6;!$,sN;e,*;aJsava;!ruc1t3;!sAG;!#E7;ab,`;!rHJ(;!a,me2;a0OeViT.RoQrPuN;/b,peE9rNs,ta&g;?fEMt8;at,of;)2$,ps0rDZt1;b3m,rN;f,&2;eN),m,r1zog6;b,);bLc0Dd0Af09l06m03.02ov,p01rYsXtRuOvN;=b3),*,oF;gaOqN;=8OnEob,&;g,rp;al,e5lRoQrOsN;=,ef;aN%;pA9]3;c,g,m;ov;+,$,?v;aOd`a,gen,oNuom;mur,p;!cCf,m,tnCv;!m8Gs0;csot,lp,m7ts9;aOirN);cal,gal;@,lf;ac,eOoN;cas,g>g;p,v;ab,lL;aO.,rN;ad,ev;!pm85;=Niv,ob,>f;b,g,t;b,g1iv,rNssKt.va,ug*l;!%DLtN;!lu,$;a2Jb2Gc1Id16f11g0U@,l0Nm0Mn0Lo0Jp0FrXsVtTuQvOxifsa,zN;av3imoh,uf3;aNbo,#/,i),$7ossa,s0u.2;!#,rtIs0ta;g,ln4qN;am,esbo,.rf,sN;e,ot;af,is,sN;afDBe,i.,ug.;!atNet(.,.,porcen;.f,<;aZbYcXdnEes,fWi,oSporpRrQtOuN;j8mal;apIsN;e,ud8;a,of);a2<;c3lgPtN;iv,siN;h,v;!.v;(BK;!#,o5;e8^ul;!c,gQ)ssa,mDrPtnOvN;!a,(BI;ev8;tn4;.;!a&l,#&,iPoN(,urrD<;cNdor,rt3;!o?x;c*5rrD;bN~;!a,m4;oga,ulC;!e5%1u);!aS#&,iPoNpM;fNp3;!(,<;bom2cNfGxua2;imod,nN;%7;!p,t6va;aRelivi5iOoNuf6;le;tNv;il,(N;rp2;lp,s(5tN;n4(;!aQe@,nPoN>p,s0;c,rN;af,ta;e,%2;!c9Ks0;aWeUisT$RoPrub)b,uN;j,le5pN;#,iF;!rKtsN;uc;c8pN;iliv,m4;bDsB;mNs7Et1;!#,rEJ;!lgBrNv;!ri;a0J#pGUi0BnUoRrPuN;b)b,nNrc;im;em4oN;sn4vB;gen,sN;n4sN;a2^;a00eQunN;a,eNo5;!d,rN;!p;cil,dTgRirQlis,?O(5tNulf8viv;in9$s,_;fNg,v6;^,n4;`I;a,ilN.t;gen,^;ac,iN;fn4vN;e,o5;*f,tsN;busA4e,^,nuN;cric;c,d8feTlRnQpP&cGtOvN;!es;on;o5sua;i7um;aNeEZ_,pD;!m;lE$b;bAfe5ma,rga,s;aOmNossa;ac7;ss6;!cOf,gapKms0rNs1t3v;!p3;!ot;c1Ol0JnN;a0Be07iToRuN;!cOmetsNpAr/J;et;!),sN;=;grNs;ev1;aZcof,f0lYmaW.EHpVrStagAR](m,vRzN;ePivO%N;!-é5;!a,n4;ma,pR;a,#c3i[;aO[NotnC>~;~,]3;ca,fAJma,ssK;a,(;cNvuol;!$1H;a2bD;b0Sc;dPg1pOrN(H;bApA;me2s0;>,s0;bScRf&MgQl,ma,pPrNssa;a0M&,tN;$2(;a,moJ;!#,&b;a,o/;!#&;a09e05iUoTuN;af,bRcsav,gPrOtN;a,$2;b1FtK;a,$,rN;em,o;+,>b,(;!f,m,rr2D;!bom,c$WdVfUmTpA9rStP]EvN;=El_,rN;ef;ag1rNsor;apN;!m4;b,rBIt;lKuh;!r9;+,or1;!vs0;beFg1mPoja,p3&pOsnoNtn9;ca2;a2me;es4N?vG;/Fc01d00eMfZgYmXoVpUrRsaQtOvNça07;ox1>;!aNeH$;!b;ga;!aNt;bNt;!me2;=ta,me,(;cNssa;!a@;!=;im3n3F&g,ub3;!&f;./;!aOnNo@,>pA;e2ihJ;va;a01e00iZnUoRrQuN;bN@;eNme;rt3;am,%3um;b0cGhJm,rNta;bNp6&;!as0;aPiNuf=31;!@9l6p,rNs0ug;!ts0;g1l,mNr&;!#,s0;f,@4m4p46rpCug3;f2lf,rt9;!c44ga,lD5ps0rNs,t;!r37;a1Ee0Vi0Kl0Fn06oXrSsQuN;f7jO),og6rNs,t3x1;dE$;!bDn4os;aN`,if;g1r;aPeNotuo,up03;bNts_,v89x1;);bNc,lGma;me2;fUj,lSrOvN;![,#;!-bPd,rN;a,eNo5;d,t8;a,us;aNomoh;^,tC;a2#;aUeTiRolQuN;f,mNs;%Ns6;!<;a,eBIo5;g,@,m=o@,pTtCv,xNz6;!ac;pC&;m,z;aQoOuN;j,mo5v0L;c,fNma,pA;!s6;g,s,t*p,vC;=&2dWeMlVm>f,ps6rStN;af,iQrPsN;aNev8*,uf;c,m;`A;l,m;bN`,ri,t8;!a2oN;!l,s0;!fo5%,r9Ms0;afG$m,o5;c,f04@02i&v,l01m00nYpWrQsNvan7;!>m,sosN;!sN;as0;!f3gRpQrOtN;$,(;acN%3;!e66$,s0;!me2s0;a2es,n4;!a2(N;d,p;!/,eNos;d,r5T;a@,uf;!a,eHofs6;!a,nN;%G;aFo;c,d8fa,@,iR),m3pQrOvN;!^;fuNp,t28;an,s;!a,o5;$v,rbA;aYeXiUlTnuiFoRrPuN;b,@,l,rNt23;!t;aNus;!g;fa,m,solN;if;af3og6B;b,ec,ns,p,rOtN;ap3;!g,>b;lb,&ta;/Sg,rNs,t3;!gN&g1;!oN;litOtN;of,>;ad;!s0ta;b2Vc2Md29f28g26h23j1Zl1Tm1Pn1Ip1Cr10s0Tt00uOxo03zN;ag,norb,ov;gUqN;aRnOoN&;lb2m,rb;aNorb;lf,rN;b,f;b,cEf3l,rNs,t3;f,t;aNn6of;pNv,zeugiz;ap,mN;al6;a0Ccat,e0Ai08l07n00oVrSsOuaN;lf,rt;aPeOoNuc;c,r;!pA;h,r;aOoN;n2s;c,~;cPl,mOrNsip;!it;ac3;aNi@;@,&s;aReOoN;p,t0S;malrKpOs#p7tNza5;!ap;!?s,s0;c,lNrp;ag,p;a0Bov;eNot;lp;fN@%ir,lob>b,zag;ob3;!c,flo,g6@,pOrNt,v=b;!ab,ip,t;!as;aR)f,$c6oPsaOuN;an,nE;!c3p,s0;f>matem,mNrp;im,>fa;b,rfN;=K;aXbmVc6dnUev,fTli@,oRp,rOtsNual,valK;a6Re;aOeN;d,~,ug;!cGf,pmE;/s,h$sNlf,p3tsK;!sa;!#,$2os;ol;e,oN;!s;!cGlc,m,p,r;!aRlog,mOolNsa;ag;aOetaN;ssK;c,l6rg;!c,m,p,s,tQ;aRem,il0oQrN;ac,`OoN;c,t;!(;rit,vK;cNlp,m,s,tipCv0;as,(;!al1ePlKoO?pN;!mi;f3n7;rt1s;aQ`,$2oOuxuN;rb;!bNc,g;!mab;bNm,p,r;!mC;ap,nOrN;og;aNosil;rg;cOlN;a,of;ac,#;!aNrE;$moh,ssa5Vt.@;a,$,s0;aY`rXi,)b,nSoRrOumatrN;at;aNel;bmN);ob;gKr;aPoOuN;/gav,f;!@Crt3;b,c1gaN;po5;ot;c2Kl,n>j,rg;!aTeSioR.O%s9rN;ec;lOmN;or;!ab,#;c3f;bCr;f,gN~F;en;mOob,rNutit;ab;aNob;b,l;!a1Oe1Fi10l0Xn05o03rTs0uN;aRc3ga,iMja,)s,mOns0rg2sNt3;.F<;!+,sN;.F;ma;rf5Cs;aSeRoNufa@;bPcNg1;a2#,nNsB;%2;!a,s1I;h,s0;c,),tPugNvoJ;!aNs6;!v)s;!#,sa/;g1m%NpGr,ça;a,*;a0Ae02i00oYuN;bTcQd6fOgN*;es;!a,oN;rpG;eOrN;ic;f,s;!aN;!gOrN;`D;av;d0Zm,rNs;!t3;f,lNrb,ug;!a,b,s0;ga,mRrOv2zaN;fa;!eNp,&;fNm;#,o;eO%N;#,$;!r;!b66mPrO(N;d,rt;bGic;!a,+,%,s0;aOoN;mGs,t;b,c3m,ps6rfs0s;cY`,lVmit8odUpSrQuPvNxo;=g1#,^1lo,nNud;e,%;c2qil,r;am,pmN;%1;alNeF;!+,^;a,$;!avOeZosN;!n4;!#,*;a,iDuN;lNrt;e,^;bUce/,d,iTmRpsQrPsO],vNza;!el;!bo;apAev1ge3F$2p0&;oh;#N;!&;~;ebA;/UcSf0KlsRnPrNx1;b,gN;a2+,ort6;!eN;rbL;aF.F;#N;&;/;a3Ze3Qi1Dl19n0Xo0Jr06sSuN;dQ@ElEoPrt6tN;aNuc;b0Nc;),~,t,vC;ac,e;aXeWiQoOuN;b7fo,maQ;bAm,rN;$2;!af,bQc,dPfn4leb,p,rOt9vuN;@;!a4L&;!>m;=,mN;al;p,rf6;c2drOl,m,rNvahJ;!n0E;ev;aUeSoQuN;fOpN;sn4;ib;bAfN;!$;cGm,p,tN;),(;!bO@1mN;!+,s0;a,mN;aNe2;ça;bYc,fXhWlUpSrRs,tQvN;a,e,iuOnNo5;i,%;qe;!#,$;!b,ex,pic6r0t;ap,ipN(;!me;!a7bD%7s0;us;c,)f;!$,of,us;#,mN;es0;aUeTiQorOuN;j,rt;!tN;$,s0;fGrNv;b,t;!a;le,ps0rc1;bPm,p3rOs0t3vaN;),rta;&,t;!a,s0;aOuN;c8s;cNfs0;!a,eH;b1Yco[,d1Of0GgEjn0El07mel_,n04p03rWtO],xN;ot8uf;!aTirc,nRsN;eOifLongNuC;aBo5;!mN;od;etNi;ua;!rp;aRbQeO$,oman,rut3tN;uf;bN<m;eb;af,mi,ur;pKve5;ap;!#,)s,oF;`0ip,rNum4;of;_;bup7c,pN;a,#,iQmPuN<;d,r[Ns;];i,%2;rt,tlN;um;acs0;am;!aFiN;c0Qd0J#,l0Hm0Gn0Bpit,r05sZtOvN;iv;aVeUnRon,rPsOuN;rf;et,im2uj;ec,oN;f,m;aOeNo5;di,ic,(5;s,];l,r;eb,rN;!g,t3;lRnP?vBsaN;lc2m;^;et8;*;af;alc,bQcPev,oOteNup;m,p;lg,pr4;as;ul;it;aQgOoNu;b,sr9t;am,iN;d,s;d,lp;=,um;a]2pmNun;a,eIis;e7iPoN;cNm;!+;lL]N;il;os;!#;ap,`3uN;rc;rt;=U/,eT*RrQuN;aOjN;[,e5;lc;om;!vN;!i6;d,m,rp;!?;[;!a,+;/,cUf0@,pTrRsOt_Nvax;ih;!sN;eH^;d,r;b,#9pN;+,mi;!as,(;bo;bsVhJlTpArRsQtN;!a2(N;!d;!s0;!$,sa;/,&Nta,ub3;ta;!~;ca;abA;me;a0Ies1i0BmZoXrPuN;cnN[,or,rr0;e,i;eRutN;!n4r9sN;am,^;`;%;bosOcaIva;<;sa;d,fa,lg1n3rpN;mi,<;aUiSoPuN;b,@,t6;#;bOl,rNt,z;am,&,t;ir;@CrC;ac;c,hlPlOrNs;ip;!f;uc3;lQrN;rOt3;(;a,+;!e5i;rp;$;b,cPg,lOs0;+;is;a,sonN;em",
    "Ordinal": "true¦:a1o1s0;a0o0;dnugGmi1nFriecret,t0vatio;niDraDxF;céd,sé0tés;g5lim,tne0;c3gn0;i0on;r7t0uq,üq;co,es;!ert,ud,x8;a1i0otco;rt,v;n4r2u0x5;qni0tp4;uq,üq;da0;uq;on;es",
    "LastName": "true¦:avlis,gnaw,i03nToSrRsLv9yrrep,z0;e0oñum;dnanre6hcLlazn5m5n4pol,r2u0;g0qzF;irdMnimod;a0ep,imJreitug;us,vE;emij,itr8;og;f,h;e6o0;damm4l3n1rt0stenzuk;ep,imid;a0ojmes,rims;sah,vi;iahhim,vap,zH;am;j0yi3;e1liss0;av;rBske0;la;aj4er3o0;m1t0;nas;ar;olf,rot;or;etsof,olyat;rtsac,ssur;e3iwrad,oss0;lr1nahoj,re0;dna;ak;s0yugn;n2r0;al,ed0;ep,na;ah,e0;j,tsirhc;l,ved",
    "MaleName": "true¦!1:#$:an,ar;a04b02cYdVeRfr#k,gQhMiKjHkDlCm8n7pol,r5s3tom2vaughn,wa1y0;i,ousouf,uuma;de,rrQ;as,oh$u;al5o0;nny,uJ;#Ne0ocky;x,za;athy,iSomaT;a1in0;ik;ck,lachai,r0sEx;co,k;#ce,iV;a2en1ir0;by,ollos;dall,t;na7them;a1ess0ie,ordJ;!e;ck,y;chika,nu0ra;k,nnguJ;$0ina1yd$;ris1u0;ta;on;ene,r#t;$2d1lmo,nrique,rgi,ym0;en;dy;l,nest;a1e0iego,rew;#,nver;llas,ne;h0level#d,ole,urtis;$lie,risti1u0;ck;#;e0ob,runo;nedict,shoi;b2d3j#i,l1putsi0ustin;aq;fredo,i;dullo,r0ulfazl;am",
    "Preposition": "true¦aAc9de6e4junto c9p2s0vind8às;em,ob0;!re;ara0or;! c5;m0ntre;! cim6b1;!b0ntr1pois,s6;aix0;o 4;om; partir 2cerc1lém,t0;ravés 1é;a 0;de",
    "Person": "true¦carson palmer,jaime,ora,rush limbaugh,sung,tiger woods,virgin mary",
    "Conjunction": "true¦como,e3logo,mas,nem,ou,po0q2;is,r0;q0ém;ue;!mbora,ntão",
    "Pronoun": "true¦!1:#:enhor;aPcJeHisGlFmDnBo9qu8s7t6v0;o0ós;cêQs0;!sa 0;majes1s0;anti0#ia;ta4;e,i,u;e,i;al,em; s#,cê,n0s s#es;de;os,ó0;is,s;e0im;!ritíssimo;aCheCoC;so,to;l9s0u;s8t8;o1uj0ê;a7o7;m2n0;no0o0s1t1;sco;igo; 3qu0s s#as;el0ilo;a0e0;!s;gente,s#a",
    "Determiner": "true¦a2el,o2u0;m0ns;!a0;!s",
    "City": "true¦:!1:#$%&()*+-./<=>?@[]^_`~:re,ac,na,ra,ar,et, o,og,la,ep,uq,von,le,an,aug,éd,no,ts,hc, e,ni,hzi;a1Ec.1Ddor+< yn~n,e0Tfrod=ssüd,g0Rh0Oi0Gks0Dl0Bm04nYoIrGs9u6v5y4z3á1ã0óiecam,ń>zop;c(]a,d#]ma,#);dgab,t0;+ob,ucl$;d9eráuj1Q;err2n=^_ynhze#b>;ialokym,ot19;e^1oDç?0P@iv0ă`și^;)nD;%h,us;a4e2i1o0ubmuloc,íulN;hlu&ug,#l-b$ sol 09;lopá%id`,&p;lopán,rdn0;ol;ix$_d_/ud,=xurb,n0;)a,i0R;adons(k,evo%h,o0;dav-s,-0F;cDd(gCg7i6l5mloco1Vpm$*d*d&n#bEr4t3vo1ã0;d#]ema,lim,#),tn$;cs0;om;emisi/&b,i/,- =;até#/,pind;açn+8lijurt,uap8;rásor,/ót;ai0Urub0;m1s0;e%oj,#t.4;ah,e0ir0J;ro,t+;lE+lT;ixém*11sic%rf0;*ãs;a2o1á0íl=dKóicpec[c;cailuc,muc9;]uZél;'ix,p1ve#i,za0;k,yr;l$u>,o12;i1#p,u0él5;g%r,tr$;lr3r2/0;.,n0;>,ux;ut;eb;at>,toyóc-uhazen,u0valso&y;bma]i,es;`bay=9te1v0;e~,o%ylu;[d,pil;a5h4l0ttailgot;$0@; 1ix0;em;ed*gai00;c($,l@;g%x,ne0;^;ir iyvy1`m i^*h_09ze[r0;ov;rk;[k 7rubsi0;ud;dClliv[skOnup,picnírpArge-At7u0;g3q0;inum,`s=h,oceu1ro0;i a<;gnB;ah0D[ceu0;gn0;oh;(rus,se0;pad0r$0;ub;*tr0;op;a1%rg*0;pmK;ba1dg0ir;ab;de1#di0;ah;ma;)$e;bodróc,c00d&guZfu,gaWhlUiLj%g,koukuf,lHmGnAo7pi/e&,r5ssax`4t2ugánV<êg,zn1ç+0;a&s;.;&0ucúc;caj;/;$%,#is al_d zurc a0;tnU;bs1ss.*ã0;oj;il;a3e1iser0;);gatr0iv;$;rit,y?0; dadu4;il,or;a0us*rd. nJ;k^ahkCm)? a0;d_dad0;ic;cnêl7f6~ro5lísa4n2+1rd%xe-,vó0;c(c,sr6;>;âi0ól9ôl9;+;rb;paz;l@alif,ós;av;esr0ives;am;h0lám,rp;n.0;oc;]e;ad,inôl0;as",
    "Country": "true¦:!1:#$%&()*+./<=>?@[]^_`~:na,am, a,ni, e ,ab,la,od,ir,ar,ro,ru,se,mo,ma,uq,us,en,ts,me,ci;a0Ie09h>dalg#b,i03lWmiVnToGrDs6tiawuk,u3á2ã1é&ug0;!%von-aupap;?,ri;da#c,@#p;a1*vut,r0tau#v;ep,uan;*p,ssib-V;a4e3iv^(oãvó_.c07o0;al,corr$,d0xi) >síZ;)rZinu s0;eb/á s+/i`,+at>;llehcyes,<?c,õr$ac;@hW&0=dnoh,vidl$;da#rg(etne~v01pilif;a1egín,+a0;[e,v*s le;cságad$,m#ym;cBdinu o&er,g9n8rg^etnom,saf%&k=b,t7ã0;bag,d],ji)reza,?*sHpaj,t0;si0ub;n3u0;gri[,q0;a0ebzu,ijat;p,zac;agefa,e`[=t;ige,o>l;)íl,.$ #s;)ot(dadi&rt,noc +%~0ot,=b`xul;l1Ntárco`d1M;anóm,ixém;eméi,ie0;rhD_nethceil;fr$ +1FnE;a3e/si,isa8*hsr$2] + 0;a0oãd];c.fá,iE; sahli;g1.ota[e 0p^;é&R;^Kut<p;aug2dnu=b,^u1jif,l$,t0wal$;).ik,iah,uobijd;rb;/0u=;ap;);d6li7@n5picnírp(é?t4rpi7t2[1wb)miz,zil0;eb;/i,ib@çom;<n +%i0>l-<mit;e<c; oãs;.],teiv;a0rev obD;hc;buc,c0Qd0Mg0Kh#0HiCjobmBk#l .s,l9n5o3r2t1ugáracMç0;#rf,í];iduas%ibáYl$;r+#,upag&s;el%rr0@s;es;a1i0;hc,tnegTvogezreh e%insób;~0g,i2wst6;&m+0Mrfa-ortnec0M;$eta0euz^ev,og#;ug;ac;bZcUdnPert.e,gróeg,lLnBpóite,r7s3[2v0;rés,ádlLíl0;ob;r1ávD;súr2álTéno1ín0;ut;d&,r~m;!<leib;gnuh,_uá,ágl2é0ís;bBg0;in;ub;â6é3ó0;dec$%d05l1t0;el,>;op;m1[,v0;olO;or,ra;bNd<j,rcu,tiDut1zn0;at;il;á2ég1ógn0;om;ra;?s,r_ua,ti;âl0í;ez%vHi1n0si;if;at,za0;];áorc,é3í1úl%tn0;as;=0;$;rg,];m2í0;l,m0;an;â0ôlD;g,z;`1p0;>;*;eur0not;on;a#rg,#1ubr) e%ugít0;#;gu,l0ur;ri;ehc4i0r$a&d;$2gléb,&m+,r0;%_0;oc;aj;%~l0;búp0;er",
    "FemaleName": "true¦:aHeBi7kooAl4m3n2oGsunev,telracs,y0;bur,dna0stap,trebil;rb,s;evar,ref;ossolb,utat;a1ezah,i0raep;ag,rva;roc,tsyrc;dn1nayangirm,r0tsirhc;amukaynak,dua,eg;a0ic;rb;c3d2i1l0nimsaj,oz,us;ag,eirbag;brab,loj,xid;aj,ed;arg,nero0;lf;dGerdna,iBjed,lAmre,n7r4si3t0y1;i1narkadn0;am;nob,ve;!la;a1im,o0;c,lf;mas,s,t;ad,e1i0odal;!er,latac,n,rt,t;gomi,l,res;iw,ue;cil3el,l2m,r0;!ad,elav,o0;lg,tciv;!a,ed;a,e;a3e2i1leme,n0;ama,il,or;!le;l,v;!vmayirp",
    "Place": "true¦ams,bcn,den,fco,i0jfk,lax,ord,phl,syd;cn,st",
    "Region": "true¦:a1dnalsi drawde ecnirp,erihskroy htron,o0rimhsak;daro1rerreug;inigriv,mi0raec,yhdam;loc",
    "Month": "true¦: orie5lirba,o0;h2i1rbme0tsoga,çr1;tes,von,zed;am;l0n0;uj;naj,revef",
    "WeekDay": "true¦domingo,qu0sábado,terç1;art0int0;a-feira",
    "FirstName": "true¦nelly",
    "Cardinal": "true¦bilhão,cKdCmilAnove9o6qu3se2tr0vinte,zero;eze0inNês;!ntD;is5ssKte6;a1in0;h9ze;rHtro2;it0nK;enGo0;!c5;!c4nE;!h0;ão,ões;ez4o3u0;as,z0;ent0;as,os;is,ze;!a0e0oi8;nove,sse0;is,te;ator6e4in0;co,q0;u0ü0;en0;ta;m,n0;to;ze"
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

  const symbols$1 = function (t) {
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
      symbols$1(trie);
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

  /*! spencermountain/suffix-thumb 6.1.0 MIT */
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
    if (typeof model === 'string') {
      throw new Error('suffix-thumb: convert expects a model - uncompress() a packed string first')
    }
    const { ex = {}, fwd = {}, both = {} } = model;
    if (Object.hasOwn(ex, str)) {
      return ex[str]
    }
    // longest suffix first - the stem is only cut once a rule matches
    for (let i = 0; i <= str.length; i += 1) {
      const suff = str.slice(i);
      if (Object.hasOwn(fwd, suff)) {
        return str.slice(0, i) + fwd[suff]
      }
      if (Object.hasOwn(both, suff)) {
        return str.slice(0, i) + both[suff]
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
      reversed: !model.reversed,
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
    "conditional": {
      "first": "3ria:zer{a,i}|0ia:r{aze{mpr,j},ntrança,oroça}|3caria:çar{tran,rin,ro}|2oria:ôr~0ia:r|6coitaria:çoitar|3caria:çar{ati,co,emo,bra}~3zer:ria{di{re,on,en,ra,s,l,er},a{f{s,e,tra,esa,er,-},spr}}|2:ria{gredi,a{taref,lef,scoit,ratic}}|5çar:caria{strin,stro}~3ria:zer{fa,afa,tra,di}|2oria:pôr|3caria:çar{cal,for,ro,la}",
      "second": "3rias:zer{a,i}|0ias:r{aze{mpr,j},ntrança,oroça}|3carias:çar{tran,rin,ro}|2orias:ôr~0ias:r|6coitarias:çoitar|3carias:çar{ati,co,emo,bra}~4zer:rias{di{re,on,en,ra,s,l,er},a{f{s,e,tra,esa,er,-},spr}}|3:rias{gredi,a{taref,lef,scoit,ratic}}|6çar:carias{strin,stro}~3rias:zer{fa,afa,tra,di}|2orias:pôr|3carias:çar{cal,for,ro,la}",
      "third": "3ria:zer{a,i}|0ia:r{aze{mpr,j},ntrança,oroça}|3caria:çar{tran,rin,ro}|2oria:ôr~0ia:r|6coitaria:çoitar|3caria:çar{ati,co,emo,bra}~3zer:ria{di{re,on,en,ra,s,l,er},a{f{s,e,tra,esa,er,-},spr}}|2:ria{gredi,a{taref,lef,scoit,ratic}}|5çar:caria{strin,stro}~3ria:zer{fa,afa,tra,di}|2oria:pôr|3caria:çar{cal,for,ro,la}",
      "firstPlural": "3ríamos:zer{a,i}|0íamos:r{aze{mpr,j},ntrança,oroça}|3caríamos:çar{tran,rin,ro}|2oríamos:ôr~0íamos:r|6coitaríamos:çoitar|3caríamos:çar{ati,co,emo,bra}~6zer:ríamos{di{re,on,en,ra,s,l,er},a{f{s,e,tra,esa,er,-},spr}}|5:ríamos{gredi,a{taref,lef,scoit,ratic}}|8çar:caríamos{strin,stro}~3ríamos:zer{fa,afa,tra,di}|2oríamos:pôr|3caríamos:çar{cal,for,ro,la}",
      "secondPlural": "3ríeis:zer{a,i}|0íeis:r{aze{mpr,j},ntrança,oroça}|3caríeis:çar{tran,rin,ro}|2oríeis:ôr~0íeis:r|6coitaríeis:çoitar|3caríeis:çar{ati,co,emo,bra}~5zer:ríeis{di{re,on,en,ra,s,l,er},a{f{s,e,tra,esa,er,-},spr}}|4:ríeis{gredi,a{taref,lef,scoit,ratic}}|7çar:caríeis{strin,stro}~3ríeis:zer{fa,afa,tra,di}|2oríeis:pôr|3caríeis:çar{cal,for,ro,la}",
      "thirdPlural": "3riam:zer{a,i}|0iam:r{aze{mpr,j},ntrança,oroça}|3cariam:çar{tran,rin,ro}|2oriam:ôr~0iam:r|6coitariam:çoitar|3cariam:çar{ati,co,emo,bra}~4zer:riam{di{re,on,en,ra,s,l,er},a{f{s,e,tra,esa,er,-},spr}}|3:riam{gredi,a{taref,lef,scoit,ratic}}|6çar:cariam{strin,stro}~3riam:zer{fa,afa,tra,di}|2oriam:pôr|3cariam:çar{cal,for,ro,la}"
    },
    "futureTense": {
      "first": "3rei:zer{fa,tra,i}|3carei:çar{tran,ro,ti}|2orei:ôr~0ei:r|6coitarei:çoitar|3carei:çar{co,bra}~3zer:rei{di{pre,on,en,ra,s,l},fa{s,e,er}}~3rei:zer{fa,afa,tra,di}|2orei:pôr|3carei:çar{cal,for,ati,ro,la}",
      "second": "3rás:zer{fa,tra,i}|3carás:çar{tran,ro,ti}|2orás:ôr~0ás:r|6coitarás:çoitar|3carás:çar{co,bra}~3zer:rás{di{pre,on,en,ra,s,l},fa{s,e,er}}~3rás:zer{fa,afa,tra,di}|2orás:pôr|3carás:çar{cal,for,ati,ro,la}",
      "third": "3rá:zer{fa,tra,i}|3cará:çar{tran,ro,ti}|2orá:ôr~0á:r|6coitará:çoitar|3cará:çar{co,bra}~2zer:rá{di{pre,on,en,ra,s,l},fa{s,e,er}}~3rá:zer{fa,afa,tra,di}|2orá:pôr|3cará:çar{cal,for,ati,ro,la}",
      "firstPlural": "3remos:zer{fa,tra,i}|3caremos:çar{tran,ro,ti}|2oremos:ôr~0emos:r|6coitaremos:çoitar|3caremos:çar{co,bra}~5zer:remos{di{pre,on,en,ra,s,l},fa{s,e,er}}~3remos:zer{fa,afa,tra,di}|2oremos:pôr|3caremos:çar{cal,for,ati,ro,la}",
      "secondPlural": "3reis:zer{fa,tra,i}|3careis:çar{tran,ro,ti}|2oreis:ôr~0eis:r|6coitareis:çoitar|3careis:çar{co,bra}~4zer:reis{di{pre,on,en,ra,s,l},fa{s,e,er}}~3reis:zer{fa,afa,tra,di}|2oreis:pôr|3careis:çar{cal,for,ati,ro,la}",
      "thirdPlural": "3rão:zer{fa,tra,i}|3carão:çar{tran,ro,ti}|2orão:ôr~0ão:r|6coitarão:çoitar|3carão:çar{co,bra}~3zer:rão{di{pre,on,en,ra,s,l},fa{s,e,er}}~3rão:zer{fa,afa,tra,di}|2orão:pôr|3carão:çar{cal,for,ati,ro,la}"
    },
    "imperativeNeg": {
      "second": "1nhas:r|2as:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istas:estir|3ças:edir,cir|3gas:izer|3jas:aver,ger|3as:uer|3ques:çar{tran,rin,ro,ati}|3ces:çar{ntran,oro}|2onhas:ôr~2as:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jas:gir|1jas:ver{e,ter}|2ejas:brestar|5irjas:vergir|3ças:r{ce,faze,spraze,uvi}|2enhas:vir|1nhas:ter|2has:aler|3ssas:oder|5ussas:ossir|5irtas:ertir|5urtas:ortir|5intas:entir|4itas:etir|5urmas:ormir|4iras:erir|3iras:equerer,arir|5ubras:obrir|5igras:egrir|5igas:eguir|3gas:trazer|3as:nguir|1as:air,orrir|1ias:crer|4idas:redir|3ibas:aber|4íbas:oibir|5irvas:servir|3cas:erder|5águas:saguar|6ínquas:inquir|4ulas:golir|4ilas:elir|4únas:eunir|4inas:prevenir|5irzas:erzir|5ispas:espir|2es:ar|4údes:udar{sa,i}|6coites:çoitar|4úles:baular|3ques:ar{c,coç,emoç,braç}|5ísques:aiscar|5éques:equar|2ues:gar|6ólegues:olegar|5águes:aguar|3ces:çar|4úces:iuçar|2ies:ear|3eies:iar{ns,med,cend}|4ízes:izar{e,ju,a}|4ínes:ruinar~3ger:jas{e,vi,an,on,ster}|3ver:hajas|3dir:eças{p,sm}|3cer:peças{em,r}|3cir:arças|2er:as{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|2ir:as{nh,curt,mit,uir,garr}|4r:onhas|5estir:vistas|2uer:gas|3zer:digas|2ar:es{scoit,u{inq{p,g},ig{ver,z,n}}}|4çar:ques{strin,stro}|3ar:enseies~2vás:ir|1jas:er{s,v,prov}|2ejas:estar|2ês:dar|2onhas:pôr|3iras:querer|1as:rir|1ias:ler{,re}|3ças:medir|3eies:odiar|4ulas:polir|3ques:çar{cal,for,ati,ro,la}|2as:arder,rer,condir|5ílies:mobiliar|2es:guar{min,e}|5ictas:flectir",
      "third": "1nha:r|2a:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5ista:estir|3ça:edir|3ga:izer|3ja:aver,ger|3a:uer|3que:çar{tran,rin,ro,ati}|3ce:çar{ntran,oro}|2onha:ôr~2a:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3ja:gir|1ja:ver{e,ter}|2eja:brestar|5irja:vergir|3ça:r{ce,faze,spraze,uvi}|2enha:vir|1nha:ter|2ha:aler|3ssa:oder|5ussa:ossir|5irta:ertir|5urta:ortir|5inta:entir|4ita:etir|5urma:ormir|4ira:erir|3ira:equerer,arir|5ubra:obrir|5igra:egrir|5iga:eguir|3ga:trazer|3a:nguir|1a:air,orrir|1ia:crer|4ida:redir|3iba:aber|4íba:oibir|5irva:servir|3ca:erder|5água:saguar|6ínqua:inquir|4ula:golir|4ila:elir|4úna:eunir|4ina:prevenir|5irza:erzir|5ispa:espir|2e:ar|4úde:udar{sa,i}|6coite:çoitar|4úle:baular|3que:ar{c,coç,emoç,braç}|5ísque:aiscar|5éque:equar|2ue:gar|6ólegue:olegar|5águe:aguar|3ce:çar|4úce:iuçar|2ie:ear|3eie:iar{ns,med,cend}|4íze:izar{e,ju,a}|4íne:ruinar|3ças:cir~2ger:ja{e,vi,an,on,ster}|2ver:haja|2dir:eça{p,sm}|2cer:peça{em,r}|1er:a{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|1ir:a{nh,curt,mit,uir,garr}|3r:onha|4estir:vista|1uer:ga|2zer:diga|1ar:e{scoit,u{inq{p,g},ig{ver,z,n}}}|3çar:que{strin,stro}|2ar:enseie~2vá:ir|1ja:er{s,v,prov}|2eja:estar|2ê:dar|2onha:pôr|3ira:querer|1a:rir|1ia:ler{,re}|3ça:medir|3eie:odiar|4ula:polir|3que:çar{cal,for,ati,ro,la}|2a:arder,rer,condir|5ílie:mobiliar|2e:guar{min,e}|5icta:flectir",
      "firstPlural": "1nhamos:r|2amos:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istamos:estir|3çamos:edir,cir|3gamos:izer|3jamos:aver,ger|3amos:uer|3quemos:çar{tran,rin,ro,ati}|3cemos:çar{ntran,oro}|2onhamos:ôr~2amos:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|5irvamos:servir|3jamos:gir|1jamos:ver{e,ter}|2ejamos:brestar|5irjamos:vergir|3çamos:r{ce,faze,spraze,uvi}|2enhamos:vir|1nhamos:ter|2hamos:aler|3ssamos:oder|5ussamos:ossir|5irtamos:ertir|5urtamos:ortir|5intamos:entir|4itamos:etir|5urmamos:ormir|4iramos:erir|3iramos:equerer,arir|5ubramos:obrir|5igramos:egrir|5igamos:eguir|3gamos:trazer|3amos:nguir|1amos:air,orrir|1iamos:crer|4idamos:redir|3ibamos:aber|3camos:erder|1mos:saguar|4ulamos:golir|4ilamos:elir|4inamos:prevenir|5irzamos:erzir|5ispamos:espir|2emos:ar|6coitemos:çoitar|3quemos:ar{c,coç,emoç,braç}|2uemos:gar|3cemos:çar~4er:amos{v,h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,x,el,az,oz,enz,mp,o}|5ger:jamos{e,vi,an,on,ster}|5ver:hajamos|5dir:eçamos{p,sm}|5cer:peçamos{em,r}|5cir:arçamos|4ir:amos{nh,curt,mit,uir,garr}|6r:onhamos|7estir:vistamos|4uer:gamos|5zer:digamos|4ar:emos{scoit,u{pinq,ginq,deq,g{xa,veri,zi,ni}}}|6çar:quemos{strin,stro}~2vamos:ir|1jamos:er{s,v,prov}|2ejamos:estar|2onhamos:pôr|3iramos:querer|1amos:rir|1iamos:ler{,re}|3çamos:medir|4ulamos:polir|2emos:guar{a,min,e}|3quemos:çar{cal,for,ati,ro,la}|2amos:arder,rer,condir|3emos:mobiliar|5ictamos:flectir",
      "secondPlural": "1nhais:r|2ais:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istais:estir|3çais:edir,cir|3gais:izer|3jais:aver,ger|3ais:uer|3queis:çar{tran,rin,ro,ati}|3ceis:çar{ntran,oro}|2onhais:ôr~2ais:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jais:gir|1jais:ver{e,ter}|2ejais:brestar|5irjais:vergir|3çais:r{ce,faze,spraze,uvi}|2enhais:vir|1nhais:ter|2hais:aler|3ssais:oder|5ussais:ossir|5irtais:ertir|5urtais:ortir|5intais:entir|4itais:etir|5urmais:ormir|4irais:erir|3irais:equerer,arir|5ubrais:obrir|5igrais:egrir|5igais:eguir|3gais:trazer|3ais:nguir|1ais:air,orrir|1iais:crer|4idais:redir|3ibais:aber|5irvais:servir|3cais:erder|1is:saguar|4ulais:golir|4ilais:elir|4inais:prevenir|5irzais:erzir|5ispais:espir|2eis:ar|6coiteis:çoitar|3queis:ar{c,coç,emoç,braç}|2ueis:gar|3ceis:çar~4ger:jais{e,vi,an,on,ster}|4ver:hajais|4dir:eçais{p,sm}|4cer:peçais{em,r}|4cir:arçais|3er:ais{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|3ir:ais{nh,curt,mit,uir,garr}|5r:onhais|6estir:vistais|3uer:gais|4zer:digais|3ar:eis{scoit,u{pinq,ginq,deq,g{xa,veri,zi,ni}}}|5çar:queis{strin,stro}~2vades:ir|1jais:er{s,v,prov}|2ejais:estar|2onhais:pôr|3irais:querer|1ais:rir|1iais:ler{,re}|3çais:medir|4ulais:polir|2eis:guar{a,min,e}|3queis:çar{cal,for,ati,ro,la}|2ais:arder,rer,condir|5ictais:flectir",
      "thirdPlural": "1nham:r|2am:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istam:estir|3çam:edir,cir|3gam:izer|3jam:aver,ger|3am:uer|3quem:çar{tran,rin,ro,ati}|3cem:çar{ntran,oro}|2onham:ôr~2am:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jam:gir|1jam:ver{e,ter}|2ejam:brestar|5irjam:vergir|3çam:r{ce,faze,spraze,uvi}|2enham:vir|1nham:ter|2ham:aler|3ssam:oder|5ussam:ossir|5irtam:ertir|5urtam:ortir|5intam:entir|4itam:etir|5urmam:ormir|4iram:erir|3iram:equerer,arir|5ubram:obrir|5igram:egrir|5igam:eguir|3gam:trazer|3am:nguir|1am:air,orrir|1iam:crer|4idam:redir|3ibam:aber|4íbam:oibir|5irvam:servir|3cam:erder|5águam:saguar|6ínquam:inquir|4ulam:golir|4ilam:elir|4únam:eunir|4inam:prevenir|5irzam:erzir|5ispam:espir|2em:ar|4údem:udar{sa,i}|6coitem:çoitar|4úlem:baular|3quem:ar{c,coç,emoç,braç}|5ísquem:aiscar|5équem:equar|2uem:gar|6óleguem:olegar|5águem:aguar|3cem:çar|4úcem:iuçar|2iem:ear|3eiem:iar{ns,med,cend}|4ízem:izar{e,ju,a}|4ínem:ruinar~3ger:jam{e,vi,an,on,ster}|3ver:hajam|3dir:eçam{p,sm}|3cer:peçam{em,r}|3cir:arçam|2er:am{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|2ir:am{nh,curt,mit,uir,garr}|4r:onham|5estir:vistam|2uer:gam|3zer:digam|2ar:em{scoit,u{inq{p,g},ig{ver,z,n}}}|4çar:quem{strin,stro}|3ar:enseiem~2vão:ir|1jam:er{s,v,prov}|2ejam:estar|2eem:dar|2onham:pôr|3iram:querer|1am:rir|1iam:ler{,re}|3çam:medir|3eiem:odiar|4ulam:polir|3quem:çar{cal,for,ati,ro,la}|2am:arder,rer,condir|5íliem:mobiliar|2em:guar{min,e}|5ictam:flectir"
    },
    "imperative": {
      "second": "1:r{,rgui,e{ev{cr,atr,d},rt},ntrança,oroça}|2e:ir{sum{s,e},sfug,trogred,gu,ebul}|4ole:ulir|3ca:çar{tran,rin,ro}|2õe:ôr~1:r{ai,orri,ui,e{bat,met,rret,jaz,mpraz,po}}|3ói:r{oe,strui{on,e}}|2ê:er{ev,terv,cr}|2:zer{a,i}|4úda:udar{sa,i}|6coita:çoitar|4úla:baular|3ca:çar{ati,co,emo,bra}|5usca:moscar|5ísca:aiscar|6ólega:olegar|4úça:iuçar|2ia:ear|3eia:iar{ns,med,cend}|5équa:equar|5água:aguar|4íza:izar{e,ju,a}|4ína:ruinar|2ém:ter,vir|4á:aver|2á:brestar|2e:ir{,uv,serv}|4ode:cudir|4ide:redir|5urte:ortir|4ome:umir|2õe:or|5igre:egrir|4obe:ubir|4íbe:oibir|4oge:fugir|4ege:frigir|6ínque:inquir|4úne:eunir|4ine:prevenir|5irze:erzir|5ospe:uspir|4ope:upir~0r:a{,scoit,ratic,amusc},e{d{po,en,on,ce,fe,er,or},ert,com,em,r{or,var,ue,f},ab,eb,amb,v,g{vi,e,an,on,ster},rgu,c,ess,os,val,rel,cel,x,lh,ch,oz,enz,mp}|2çar:strinca,stroca|2ar:enseia|1ir:e{rt{ive,dve,cu},nquer,arc}|3ulir:apole~2vai:ir|2ê:er{s,v,prov,l,rel}|2em:vir|2á:estar,dar|1m:ter|2õe:pôr|2:querer|1:rir,arder,rer|3eia:odiar|4ule:polir|3ca:çar{cal,for,ro,la}|4ole:bulir|5ília:mobiliar|2e:condir",
      "third": "1nha:r|2a:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5ista:estir|3ça:edir,cir|3ga:izer|3ja:aver,ger|3a:uer|3que:çar{tran,rin,ro,ati}|3ce:çar{ntran,oro}|2onha:ôr~2a:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3ja:gir|1ja:ver{e,ter}|2eja:brestar|5irja:vergir|3ça:r{ce,faze,spraze,uvi}|2enha:vir|1nha:ter|2ha:aler|3ssa:oder|5ussa:ossir|5irta:ertir|5urta:ortir|5inta:entir|4ita:etir|5urma:ormir|4ira:erir|3ira:equerer,arir|5ubra:obrir|5igra:egrir|5iga:eguir|3ga:trazer|3a:nguir|1a:air,orrir|1ia:crer|4ida:redir|3iba:aber|4íba:oibir|5irva:servir|3ca:erder|6ínqua:inquir|4ula:golir|4ila:elir|4úna:eunir|4ina:prevenir|5irza:erzir|5ispa:espir|2e:ar|4úde:udar{sa,i}|6coite:çoitar|4úle:baular|3que:ar{c,coç,emoç,braç}|5usque:moscar|5ísque:aiscar|5éque:equar|2ue:gar|6ólegue:olegar|5águe:aguar|3ce:çar|4úce:iuçar|2ie:ear|3eie:iar{ns,med,cend}|4íze:izar{e,ju,a}|4íne:ruinar~2ger:ja{e,vi,an,on,ster}|2ver:haja|2dir:eça{p,sm}|2cer:peça{em,r}|2cir:arça|1er:a{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|1ir:a{nh,curt,mit,uir,garr}|3r:onha|4estir:vista|1uer:ga|2zer:diga|1ar:e{scoit,u{inq{p,g},ig{ver,z,n}}}|3çar:que{strin,stro}|3car:amusque|2ar:enseie~2vá:ir|1ja:er{s,v,prov}|2eja:estar|2ê:dar|2onha:pôr|3ira:querer|1a:rir|1ia:ler{,re}|3ça:medir|3eie:odiar|4ula:polir|3que:çar{cal,for,ati,ro,la}|2a:arder,rer,condir|5ílie:mobiliar|2e:guar{min,e}|5icta:flectir",
      "firstPlural": "1nhamos:r|2amos:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istamos:estir|3çamos:edir,cir|3gamos:izer|3jamos:aver,ger|3amos:uer|3quemos:çar{tran,rin,ro,ati}|3cemos:çar{ntran,oro}|2onhamos:ôr~2amos:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|5irvamos:servir|3jamos:gir|1jamos:ver{e,ter}|2ejamos:brestar|5irjamos:vergir|3çamos:r{ce,faze,spraze,uvi}|2enhamos:vir|1nhamos:ter|2hamos:aler|3ssamos:oder|5ussamos:ossir|5irtamos:ertir|5urtamos:ortir|5intamos:entir|4itamos:etir|5urmamos:ormir|4iramos:erir|3iramos:equerer,arir|5ubramos:obrir|5igramos:egrir|5igamos:eguir|3gamos:trazer|3amos:nguir|1amos:air,orrir|1iamos:crer|4idamos:redir|3ibamos:aber|3camos:erder|4ulamos:golir|4ilamos:elir|4inamos:prevenir|5irzamos:erzir|5ispamos:espir|2emos:ar|6coitemos:çoitar|3quemos:ar{c,coç,emoç,braç}|2uemos:gar|3cemos:çar~4er:amos{v,h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,x,el,az,oz,enz,mp,o}|5ger:jamos{e,vi,an,on,ster}|5ver:hajamos|5dir:eçamos{p,sm}|5cer:peçamos{em,r}|5cir:arçamos|4ir:amos{nh,curt,mit,uir,garr}|6r:onhamos|7estir:vistamos|4uer:gamos|5zer:digamos|4ar:emos{scoit,u{pinq,ginq,deq,g{xa,sa,veri,zi,ni}}}|6çar:quemos{strin,stro}~2vamos:ir|1jamos:er{s,v,prov}|2ejamos:estar|2onhamos:pôr|3iramos:querer|1amos:rir|1iamos:ler{,re}|3çamos:medir|4ulamos:polir|2emos:guar{a,min,e}|3quemos:çar{cal,for,ati,ro,la}|2amos:arder,rer,condir|3emos:mobiliar|5ictamos:flectir",
      "secondPlural": "1i:r{,e{ev{cr,atr,d},t{ba,rre,me,r}},ntrança,oroça}|1:ir{serv,egu,ngu,qu}|3cai:çar{tran,rin,ro}|2onde:ôr~1de:r{orri,eve,terve,cre}|1nde:vir,ter,or|1:ir|6coitai:çoitar|3cai:çar{ati,co,emo,bra}|2í:air,uir|3çais:uvir~1r:i{e,a,scoita,ratica}|3çar:cai{strin,stro}~1de:r{i,ri,e{s,v,prov,l,rel}}|2onde:pôr|1:ouvir|3cai:çar{cal,for,ro,la}",
      "thirdPlural": "1nham:r|2am:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istam:estir|3çam:edir,cir|3gam:izer|3jam:aver,ger|3am:uer|3quem:çar{tran,rin,ro,ati}|3cem:çar{ntran,oro}|2onham:ôr~2am:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jam:gir|1jam:ver{e,ter}|2ejam:brestar|5irjam:vergir|3çam:r{ce,faze,spraze,uvi}|2enham:vir|1nham:ter|2ham:aler|3ssam:oder|5ussam:ossir|5irtam:ertir|5urtam:ortir|5intam:entir|4itam:etir|5urmam:ormir|4iram:erir|3iram:equerer,arir|5ubram:obrir|5igram:egrir|5igam:eguir|3gam:trazer|3am:nguir|1am:air,orrir|1iam:crer|4idam:redir|3ibam:aber|4íbam:oibir|5irvam:servir|3cam:erder|6ínquam:inquir|4ulam:golir|4ilam:elir|4únam:eunir|4inam:prevenir|5irzam:erzir|5ispam:espir|2em:ar|4údem:udar{sa,i}|6coitem:çoitar|4úlem:baular|3quem:ar{c,coç,emoç,braç}|5usquem:moscar|5ísquem:aiscar|5équem:equar|2uem:gar|6óleguem:olegar|5águem:aguar|3cem:çar|4úcem:iuçar|2iem:ear|3eiem:iar{ns,med,cend}|4ízem:izar{e,ju,a}|4ínem:ruinar~3ger:jam{e,vi,an,on,ster}|3ver:hajam|3dir:eçam{p,sm}|3cer:peçam{em,r}|3cir:arçam|2er:am{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|2ir:am{nh,curt,mit,uir,garr}|4r:onham|5estir:vistam|2uer:gam|3zer:digam|2ar:em{scoit,u{inq{p,g},ig{ver,z,n}}}|4çar:quem{strin,stro}|4car:amusquem|3ar:enseiem~2vão:ir|1jam:er{s,v,prov}|2ejam:estar|2eem:dar|2onham:pôr|3iram:querer|1am:rir|1iam:ler{,re}|3çam:medir|3eiem:odiar|4ulam:polir|3quem:çar{cal,for,ati,ro,la}|2am:arder,rer,condir|5íliem:mobiliar|2em:guar{min,e}|5ictam:flectir"
    },
    "imperfect": {
      "first": "1a:uir{g,q}|2ia:er,rter|3cava:çar{tran,ro,ti}|2unha:ôr~1a:r,uvir,servir|2ia:er{bat,met,rret,po}|1va:ar|6coitava:çoitar|3cava:çar{co,bra}|1nha:vir|2inha:ter|2unha:or|2ía:air,uir,oer~2er:ia{z,v,d{po,en,on,ce,fe,r},ert,om,em,r{ue,r,c,f},val,rel,ab,eb,amb,vig,eg,ang,ergu,c,os,x,h,mp}|1r:ia{uz,anz,rz,urd,vert{i,d},sorr,arc,nh}~3era:ser|2unha:pôr|2ia:ler|2ía:arguir|3cava:çar{cal,for,ati,ro,la}|1a:remir",
      "second": "1as:uir{g,q}|2ias:er,rter|3cavas:çar{tran,ro,ti}|2unhas:ôr~1as:r,uvir,servir|2ias:er{bat,met,rret,po}|1vas:ar|6coitavas:çoitar|3cavas:çar{co,bra}|1nhas:vir|2inhas:ter|2unhas:or|2ías:air,uir,oer~3er:ias{z,v,d{po,en,on,ce,fe,r},ert,om,em,r{ue,r,c,f},val,rel,ab,eb,amb,vig,eg,ang,ergu,c,os,x,h,mp}|2r:ias{uz,anz,rz,urd,vert{i,d},sorr,arc,nh}~3eras:ser|2unhas:pôr|2ias:ler|2ías:arguir|3cavas:çar{cal,for,ati,ro,la}|1as:remir",
      "third": "1a:uir{g,q}|2ia:er,rter|3cava:çar{tran,ro,ti}|2unha:ôr~1a:r,uvir,servir|2ia:er{bat,met,rret,po}|1va:ar|6coitava:çoitar|3cava:çar{co,bra}|1nha:vir|2inha:ter|2unha:or|2ía:air,uir,oer~2er:ia{z,v,d{po,en,on,ce,fe,r},ert,om,em,r{ue,r,c,f},val,rel,ab,eb,amb,vig,eg,ang,ergu,c,os,x,h,mp}|1r:ia{uz,anz,rz,urd,vert{i,d},sorr,arc,nh}~3era:ser|2unha:pôr|2ia:ler|2ía:arguir|3cava:çar{cal,for,ati,ro,la}|1a:remir",
      "firstPlural": "2íamos:er,rter|3cávamos:çar{tran,ro,ti}|2únhamos:ôr~2íamos:r{i,uvi,servi,te{ba,me,rre}}|2ávamos:ar|6coitávamos:çoitar|3cávamos:çar{co,bra}|2ínhamos:vir,ter|2únhamos:or~5er:íamos{z,v,d{po,en,on,ce,fe,r},ert,om,em,r{ue,r,c,f},val,rel,ab,eb,amb,vig,eg,ang,ergu,c,os,x,h,mp,o}|5ir:íamos{uz,anz,rz,urd,vert{i,d},sorr,arc,nh}~3éramos:ser|2únhamos:pôr|2íamos:ler,remir|3cávamos:çar{cal,for,ati,ro,la}",
      "secondPlural": "2íeis:er,rter|3cáveis:çar{tran,ro,ti}|2únheis:ôr~2íeis:r{i,uvi,servi,te{ba,me,rre}}|2áveis:ar|6coitáveis:çoitar|3cáveis:çar{co,bra}|2ínheis:vir,ter|2únheis:or~4er:íeis{z,v,d{po,en,on,ce,fe,r},ert,om,em,r{ue,r,c,f},val,rel,ab,eb,amb,vig,eg,ang,ergu,c,os,x,h,mp,o}|4ir:íeis{uz,anz,rz,urd,vert{i,d},sorr,arc,nh}~3éreis:ser|2únheis:pôr|2íeis:ler,remir|3cáveis:çar{cal,for,ati,ro,la}",
      "thirdPlural": "1am:uir{g,q}|2iam:er,rter|3cavam:çar{tran,ro,ti}|2unham:ôr~1am:r,uvir,servir|2iam:er{bat,met,rret,po}|1vam:ar|6coitavam:çoitar|3cavam:çar{co,bra}|1nham:vir|2inham:ter|2unham:or|2íam:air,uir,oer~3er:iam{z,v,d{po,en,on,ce,fe,r},ert,om,em,r{ue,r,c,f},val,rel,ab,eb,amb,vig,eg,ang,ergu,c,os,x,h,mp}|2r:iam{uz,anz,rz,urd,vert{i,d},sorr,arc,nh}~3eram:ser|2unham:pôr|2iam:ler|2íam:arguir|3cavam:çar{cal,for,ati,ro,la}|1am:remir"
    },
    "pastTense": {
      "first": "1:r|2i:er{,cav,rt}|3fui:ser|3quei:çar{tran,rin,ro,ati}|3cei:çar{ntran,oro}|2us:ôr~1:ir{egu,ngu,qu,uv,serv}|2ei:ar|6coitei:çoitar|3quei:ar{c,coç,emoç,braç}|2uei:gar|3cei:çar|2i:er{bat,met,rret,ss,os,jaz,po}|4iz:azer|1m:vir|2ive:ter,brestar|4ouve:aver,mprazer|4ude:oder|3sse:izer|4ouxe:trazer|4oube:aber|2us:or|2í:air,uir,oer~0r:i{,vert{i,d},frem,sorr,garr,nquer,card,urd,arc,oss,nh}|1er:i{u,v,ert,om,em,r{r,c,ue,f},val,rel,cel,d{en,on,ce,fe,r},eb,amb,g{vi,e,an,on,ster},c,x,h,oz,enz,mp}|2ar:ei{scoit,u{pinq,ginq,deq,g{xa,sa,veri,zi,ni}}}|4çar:quei{strin,stro}~2fui:ir|2ive:estar|2us:pôr|4is:querer|2i:ler|2ei:guar{a,min,e}|3quei:çar{cal,for,ati,ro,la}|1:remir,condir",
      "second": "1ste:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3foste:ser|3caste:çar{tran,rin,ro}|2useste:ôr~1ste:r|4izeste:azer|1este:vir|2iveste:ter,brestar|4ouveste:aver,mprazer|4udeste:oder|2useste:or|3sseste:izer|4ouxeste:trazer|4oubeste:aber|6coitaste:çoitar|3caste:çar{ati,co,emo,bra}|3regulamentasseiaste:baciar|2iste:ver{e,ter}|2íste:air,uir~3r:aste{scoit,ratic}|5çar:caste{strin,stro}~2foste:ir|2iste:ver|2iveste:estar|2este:dar|2useste:pôr|4iseste:querer|2íste:arguir|3caste:çar{cal,for,ro,la}",
      "third": "1u:r{uvi,servi,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}}}|3foi:ser|3cou:çar{tran,rin,ro}|2ou:çar{ntran,oro}|1s:ôr~4ez:azer|1u:r|2ou:ar|6coitou:çoitar|3cou:çar{ati,co,emo,bra}|2iu:ver{e,ter}|2eio:vir|1ve:ter|2eve:brestar|4ouve:aver,mprazer|4ôde:oder|3sse:izer|4ouxe:trazer|4oube:aber|2ôs:or~2ar:scoitou,raticou|3çar:cou{strin,stro}~2foi:ir|2iu:ver|2eve:estar|2eu:dar|1s:pôr|4is:querer|3cou:çar{cal,for,ro,la}",
      "firstPlural": "1mos:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fomos:ser|3camos:çar{tran,rin,ro}|2usemos:ôr~1mos:r|4izemos:azer|1emos:vir|2ivemos:ter,brestar|4ouvemos:aver,mprazer|4udemos:oder|2usemos:or|3ssemos:izer|4ouxemos:trazer|4oubemos:aber|6coitamos:çoitar|3camos:çar{ati,co,emo,bra}|2imos:ver{e,ter}|2ímos:air,uir~3r:amos{scoit,ratic}|5çar:camos{strin,stro}~2fomos:ir|2imos:ver|2ivemos:estar|2emos:dar|2usemos:pôr|4isemos:querer|2ímos:arguir|3camos:çar{cal,for,ro,la}",
      "secondPlural": "1stes:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fostes:ser|3castes:çar{tran,rin,ro}|2usestes:ôr~1stes:r|4izestes:azer|1estes:vir|2ivestes:ter,brestar|4ouvestes:aver,mprazer|4udestes:oder|2usestes:or|3ssestes:izer|4ouxestes:trazer|4oubestes:aber|6coitastes:çoitar|3castes:çar{ati,co,emo,bra}|2istes:ver{e,ter}|2ístes:air,uir~4r:astes{scoit,ratic}|6çar:castes{strin,stro}~2fostes:ir|2istes:ver|2ivestes:estar|2estes:dar|2usestes:pôr|4isestes:querer|2ístes:arguir|3castes:çar{cal,for,ro,la}",
      "thirdPlural": "0am:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3foram:ser|3caram:çar{tran,rin,ro}|2useram:ôr~0am:r|4izeram:azer|1eram:vir|2iveram:ter,brestar|4ouveram:aver,mprazer|4uderam:oder|2useram:or|3sseram:izer|4ouxeram:trazer|4ouberam:aber|6coitaram:çoitar|3caram:çar{ati,co,emo,bra}|2iram:ver{e,ter}|2íram:air,uir|2ou:saguar~2:aram{scoit,ratic}|5çar:caram{strin,stro}~2foram:ir|2iram:ver|2iveram:estar|2eram:dar|2useram:pôr|4iseram:querer|2íram:arguir|3caram:çar{cal,for,ro,la}"
    },
    "pluperfect": {
      "first": "0a:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fora:ser|3cara:çar{tran,rin,ro}|2usera:ôr~0a:r|4izera:azer|1era:vir|2ivera:ter,brestar|4ouvera:aver,mprazer|4udera:oder|2usera:or|3ssera:izer|4ouxera:trazer|4oubera:aber|6coitara:çoitar|3cara:çar{ati,co,emo,bra}|2ira:ver{e,ter}|2íra:air,uir~1:ara{scoit,ratic}|4çar:cara{strin,stro}~2fora:ir|2ira:ver|2ivera:estar|2era:dar|2usera:pôr|4isera:querer|2íra:arguir|3cara:çar{cal,for,ro,la}",
      "second": "0as:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3foras:ser|3caras:çar{tran,rin,ro}|2useras:ôr~0as:r|4izeras:azer|1eras:vir|2iveras:ter,brestar|4ouveras:aver,mprazer|4uderas:oder|2useras:or|3sseras:izer|4ouxeras:trazer|4ouberas:aber|6coitaras:çoitar|3caras:çar{ati,co,emo,bra}|2iras:ver{e,ter}|2íras:air,uir~2:aras{scoit,ratic}|5çar:caras{strin,stro}~2foras:ir|2iras:ver|2iveras:estar|2eras:dar|2useras:pôr|4iseras:querer|2íras:arguir|3caras:çar{cal,for,ro,la}",
      "third": "0a:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fora:ser|3cara:çar{tran,rin,ro}|2usera:ôr~0a:r|4izera:azer|1era:vir|2ivera:ter,brestar|4ouvera:aver,mprazer|4udera:oder|2usera:or|3ssera:izer|4ouxera:trazer|4oubera:aber|6coitara:çoitar|3cara:çar{ati,co,emo,bra}|2ira:ver{e,ter}|2íra:air,uir~1:ara{scoit,ratic}|4çar:cara{strin,stro}~2fora:ir|2ira:ver|2ivera:estar|2era:dar|2usera:pôr|4isera:querer|2íra:arguir|3cara:çar{cal,for,ro,la}",
      "firstPlural": "2íramos:vir{u,ser}|3fôramos:ser|2êramos:er{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}}|3cáramos:çar{tran,rin,ro}|2áramos:çar{ntran,oro}|2uséramos:ôr~4izéramos:azer|1éramos:vir|2ivéramos:ter,brestar|4ouvéramos:aver,mprazer|4udéramos:oder|2uséramos:or|3sséramos:izer|4ouxéramos:trazer|4oubéramos:aber|2áramos:ar|6coitáramos:çoitar|3cáramos:çar{ati,co,emo,bra}|2íramos:ir,ever,terver|2êramos:er~6ar:áramos{scoit,ratic}|7çar:cáramos{strin,stro}~2fôramos:ir|2íramos:ver|2ivéramos:estar|2éramos:dar|2uséramos:pôr|4iséramos:querer|3cáramos:çar{cal,for,ro,la}",
      "secondPlural": "2íreis:vir{u,ser}|3fôreis:ser|2êreis:er{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}}|3cáreis:çar{tran,rin,ro}|2áreis:çar{ntran,oro}|2uséreis:ôr~4izéreis:azer|1éreis:vir|2ivéreis:ter,brestar|4ouvéreis:aver,mprazer|4udéreis:oder|2uséreis:or|3sséreis:izer|4ouxéreis:trazer|4oubéreis:aber|2áreis:ar|6coitáreis:çoitar|3cáreis:çar{ati,co,emo,bra}|2íreis:ir,ever,terver|2êreis:er~5ar:áreis{scoit,ratic}|6çar:cáreis{strin,stro}~2fôreis:ir|2íreis:ver|2ivéreis:estar|2éreis:dar|2uséreis:pôr|4iséreis:querer|3cáreis:çar{cal,for,ro,la}",
      "thirdPlural": "0am:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3foram:ser|3caram:çar{tran,rin,ro}|2useram:ôr~0am:r|4izeram:azer|1eram:vir|2iveram:ter,brestar|4ouveram:aver,mprazer|4uderam:oder|2useram:or|3sseram:izer|4ouxeram:trazer|4ouberam:aber|6coitaram:çoitar|3caram:çar{ati,co,emo,bra}|2iram:ver{e,ter}|2íram:air,uir~2:aram{scoit,ratic}|5çar:caram{strin,stro}~2foram:ir|2iram:ver|2iveram:estar|2eram:dar|2useram:pôr|4iseram:querer|2íram:arguir|3caram:çar{cal,for,ro,la}"
    },
    "presentTense": {
      "first": "1nho:r|2o:r{i,e,rrete,rte}|3ço:r{uvi,edi,ci,ce}|5isto:estir|4ito:etir|1o:rrir|4iro:erir|5igo:eguir|3o:nguir,uer|4ulo:olir|4ilo:elir|4ino:enir|3go:izer|3sso:oder|1io:ler|2ho:aler|4ei:aber|3jo:ger|5usco:oscar|3co:çar{tran,ro,ti}|2onho:ôr~2ou:brestar|2o:r{a,e{bat,met,crev,dev},epoli}|3ço:fazer|4úço:iuçar|5urmo:ormir|2enho:vir|1nho:ter|3jo:gir|1jo:ver{e,ter}|5irjo:vergir|5usso:ossir|5irto:ertir|5urto:ortir|5into:entir|6coito:çoitar|4ido:redir|4údo:saudar|5ubro:obrir|3iro:equerer,arir|5igro:egrir|3go:trazer|6ólego:olegar|1o:air|2io:ear|1io:crer|3eio:iar{ns,med,nd}|5ílio:biliar|3ibo:caber|4íbo:oibir|5irvo:servir|3co:erder,coçar,braçar|5ísco:aiscar|5équo:equar|6ínquo:inquir|5águo:aguar|5ispo:espir|5irzo:erzir|4ízo:izar{e,u,a}|4úno:eunir|4íno:uinar|4ei:aver~2vir:ouço|2cer:ço{e,en,s,xer,tor}|2dir:peço|1ar:o{eç{op,om,der},turm,essum,lgem,j{e,a{i,or,tr,g},ei,mi,zi,su,rru,pu,an{rr,m,b},or,o},t{apar,fur,pin,vis{a,tre},vomi,imi,escu,ecu},nd{e{sv,er,m,g},afu,ofu},migr,mendig,strag,nsai,mai,cerc,tun}|2cir:sarço|1er:o{com,em,colh,tolh,ench,os,vert,erret,d{en,pon,con,mor,ce,fe},r{cor,mor,var,of},eb,amb,v{vi,ho,mo,spro,fer,or,ol},rro,mo,po,mex,omp,z{ja,ra,co,n}}|1ir:o{m{ri,exi,di,su},runh,t{par,cur,ran,sis,xis,mi,cu,glu,bu},d{lau,lu,cu,pan,fun,cin,i{iv,ec,nc,col,s},va,ua,lo},apul,bul,impl,r{ab,ump,sup,ut,ui},ib,sub,umb,u{ss,min,an,r,l,b,rg,tit,int},tup,usp,duz,luz,anz,fin,un}|3r:ponho|2er:valho|2ger:jo{ote,eele,vi,an}|3der:posso|4estir:visto|3etir:ito{ep,mp,fl}|3olir:ngulo|3elir:pilo|3erir:iro{f,pret,d,g,s}|2zer:digo|3eguir:sigo|1uir:tingo|1r:orrio|2r:releio|4oscar:musco|3enir:vino|2aber:sei~2vou:ir|2ou:ser,estar,dar|1jo:ver{,pro}|2onho:pôr|2o:r{quere,roe,arde,a{gir,vai,rai,rem,rim,pil}}|1o:rir|1io:ler|3ço:medir|3eio:odiar|3jo:eger{r,el}|3o:erguer|3co:çar{cal,for,ati,ro,la}",
      "second": "1s:r{i{a,rr,u,rgu},creve,deve,rte}|2es:ir{sum{s,e},gu}|5uscas:oscar|3cas:çar{tran,ro,ti}|2ões:ôr~1s:r{,e{bat,met,rret,al,po}}|3óis:r{oe,strui{on,e}}|2es:ir{,uv,serv}|5irzes:erzir|4odes:cudir|4ides:redir|5urtes:ortir|4omes:umir|2ões:or|5igres:egrir|4obes:ubir|4íbes:oibir|4oges:fugir|4eges:frigir|6ínques:inquir|4oles:ulir|4únes:eunir|4ines:enir|5ospes:uspir|4opes:upir|4údas:saudar|6coitas:çoitar|3cas:çar{co,bra}|5íscas:aiscar|6ólegas:olegar|4úças:iuçar|2ias:ear|3eias:iar{ns,med,nd}|5ílias:biliar|5équas:equar|5águas:aguar|4ízas:izar{e,u,a}|4ínas:uinar|2éns:ter,vir|2ês:er{ev,terv,l,cr}|4ás:aver|2ás:brestar~1r:es{z,d{po,en,on,ce,fe,r},ert,com,em,uer,rr,fr,ab,eb,amb,v,vig,eg,ang,rgu,c,os,x,lh,ch,mp}|2ir:es{uz,anz,rt{ive,dve,cu},arc,gol,epol,fin}|5oscar:muscas~2vais:ir|3és:ser|2ens:vir|2ês:ver{,pro}|2ás:estar,dar|1ns:ter|2ões:pôr|1s:rir|3eias:odiar|4ules:polir|3cas:çar{cal,for,ati,ro,la}",
      "third": "1:r{,rgui,creve,deve,rte}|2e:ir{sum{s,e},gu}|5usca:oscar|3ca:çar{tran,ro,ti}|2õe:ôr~1:r{ai,rri,ui,e{bat,met,rret,al,po}}|3ói:r{oe,strui{on,e}}|2:r{aze,ize,ere,uzi}|4úda:saudar|6coita:çoitar|3ca:çar{co,bra}|5ísca:aiscar|6ólega:olegar|4úça:iuçar|2ia:ear|3eia:iar{ns,med,nd}|5ília:biliar|5équa:equar|5água:aguar|4íza:izar{e,u,a}|4ína:uinar|2ém:ter,vir|2ê:er{ev,terv,l,cr}|4á:aver|2á:brestar|2e:ir{,uv,serv}|4ode:cudir|4ide:redir|5urte:ortir|4ome:umir|2õe:or|5igre:egrir|4obe:ubir|4íbe:oibir|4oge:fugir|4ege:frigir|6ínque:inquir|4ole:ulir|4úne:eunir|4ine:enir|5ospe:uspir|4ope:upir|5irze:erzir~0r:a,e{d{po,en,on,ce,fe,r},ert,com,em,rr,fr,ab,eb,amb,v,vig,eg,ang,rgu,c,os,x,lh,ch,mp,oz,enz}|4oscar:musca|1ir:e{rt{ive,dve,cu},arc,gol,epol,fin}~2vai:ir|3é:ser|2em:vir|2ê:ver{,pro}|2á:estar,dar|1m:ter|2õe:pôr|1:rir|3eia:odiar|4ule:polir|3ca:çar{cal,for,ati,ro,la}",
      "firstPlural": "1mos:uir{g,q}|3camos:çar{tran,ro,ti}|2omos:ôr~1mos:r|6coitamos:çoitar|3camos:çar{co,bra}|2ímos:air,uir~~2vamos:ir|2omos:ser,pôr|2ímos:arguir|3camos:çar{cal,for,ati,ro,la}",
      "secondPlural": "1is:r{,e{crev,dev,t{ba,rre,me,r},al}}|1s:ir{uv,serv,egu,ngu,qu}|3cais:çar{tran,ro,ti}|2ondes:ôr~1des:r{rri,e{ev,terv,l,cr}}|1ndes:vir,ter,or|1s:ir|6coitais:çoitar|3cais:çar{co,bra}|2ís:air,uir~2r:eis,ais~1des:r{i,ri,ve,prove}|2ois:ser|2ondes:pôr|3cais:çar{cal,for,ati,ro,la}",
      "thirdPlural": "2em:sumir{s,e}|1m:er{crev,dev,rt}|5uscam:oscar|3cam:çar{tran,ro,ti}|2õem:ôr~4ão:aver|2ão:brestar|1m:r{,e{bat,met,rret,al}}|2em:ir{,uv,serv}|5irzem:erzir|1em:r{e{ev,terv,l,cr},rri}|4odem:cudir|4idem:redir|5urtem:ortir|4omem:umir|2õem:or|5igrem:egrir|4obem:ubir|4íbem:oibir|4ogem:fugir|4egem:frigir|6ínquem:inquir|4olem:ulir|3oem:struir{on,e}|4únem:eunir|4inem:enir|5ospem:uspir|4opem:upir|4údam:saudar|6coitam:çoitar|3cam:çar{co,bra}|5íscam:aiscar|6ólegam:olegar|4úçam:iuçar|2iam:ear|3eiam:iar{ns,med,nd}|5íliam:biliar|5équam:equar|5águam:aguar|4ízam:izar{e,u,a}|4ínam:uinar|2êm:vir,ter~1r:em{z,d{po,en,on,ce,fe,r},ert,com,em,uer,rr,fr,ab,eb,amb,v,vig,eg,ang,ergu,c,os,x,lh,ch,o,mp}|2ir:em{uz,anz,rt{ive,dve,cu},arc,gol,epol,fin}|5oscar:muscam~2vão:ir|2ão:ser,estar,dar|1em:ver,prover,rir|2õem:pôr|3eiam:odiar|4ulem:polir|3cam:çar{cal,for,ati,ro,la}"
    },
    "infinitivo": {
      "first": "3car:çar{tran,ro,ti}~0:r|6coitar:çoitar|3car:çar{co,bra}~~3car:çar{cal,for,ati,ro,la}",
      "second": "0es:uir{g,q}|3cares:çar{tran,ro,ti}|2ores:ôr~0es:r|6coitares:çoitar|3cares:çar{co,bra}|2íres:air,uir~~2ores:pôr|2íres:arguir|3cares:çar{cal,for,ati,ro,la}",
      "third": "3car:çar{tran,ro,ti}~0:r|6coitar:çoitar|3car:çar{co,bra}~~3car:çar{cal,for,ati,ro,la}",
      "firstPlural": "3carmos:çar{tran,ro,ti}|2ormos:ôr~0mos:r|6coitarmos:çoitar|3carmos:çar{co,bra}~~2ormos:pôr|3carmos:çar{cal,for,ati,ro,la}",
      "secondPlural": "3cardes:çar{tran,ro,ti}|2ordes:ôr~0des:r|6coitardes:çoitar|3cardes:çar{co,bra}~~2ordes:pôr|3cardes:çar{cal,for,ati,ro,la}",
      "thirdPlural": "0em:uir{g,q}|3carem:çar{tran,ro,ti}|2orem:ôr~0em:r|6coitarem:çoitar|3carem:çar{co,bra}|2írem:air,uir~~2orem:pôr|2írem:arguir|3carem:çar{cal,for,ati,ro,la}"
    },
    "subjPresent": {
      "first": "1nha:r|2a:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5ista:estir|3ça:edir,cir|3ga:izer|3ja:aver,ger|3a:uer|3que:çar{tran,rin,ro,ati}|3ce:çar{ntran,oro}|2onha:ôr~2a:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3ja:gir|1ja:ver{e,ter}|2eja:brestar|5irja:vergir|3ça:r{ce,faze,spraze,uvi}|2enha:vir|1nha:ter|2ha:aler|3ssa:oder|5ussa:ossir|5irta:ertir|5urta:ortir|5inta:entir|4ita:etir|5urma:ormir|4ira:erir|3ira:equerer,arir|5ubra:obrir|5igra:egrir|5iga:eguir|3ga:trazer|3a:nguir|1a:air,orrir|1ia:crer|4ida:redir|3iba:aber|4íba:oibir|5irva:servir|3ca:erder|6ínqua:inquir|4ula:golir|4ila:elir|4úna:eunir|4ina:prevenir|5irza:erzir|5ispa:espir|2e:ar|4úde:udar{sa,i}|6coite:çoitar|4úle:baular|3que:ar{c,coç,emoç,braç}|5usque:moscar|5ísque:aiscar|5éque:equar|2ue:gar|6ólegue:olegar|5águe:aguar|3ce:çar|4úce:iuçar|2ie:ear|3eie:iar{ns,med,cend}|4íze:izar{e,ju,a}|4íne:ruinar|2o:xplodir~2ger:ja{e,vi,an,on,ster}|2ver:haja|2dir:eça{p,sm}|2cer:peça{em,r}|2cir:arça|1er:a{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|1ir:a{nh,curt,mit,uir,garr}|3r:onha|4estir:vista|1uer:ga|2zer:diga|1ar:e{scoit,u{inq{p,g},ig{ver,z,n}}}|3çar:que{strin,stro}|3car:amusque|2ar:enseie~2vá:ir|1ja:er{s,v,prov}|2eja:estar|2ê:dar|2onha:pôr|3ira:querer|1a:rir|1ia:ler{,re}|3ça:medir|3eie:odiar|4ula:polir|3que:çar{cal,for,ati,ro,la}|2a:arder,rer,condir|5ílie:mobiliar|2e:guar{min,e}|5icta:flectir",
      "second": "1nhas:r|2as:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istas:estir|3ças:edir,cir|3gas:izer|3jas:aver,ger|3as:uer|3ques:çar{tran,rin,ro,ati}|3ces:çar{ntran,oro}|2onhas:ôr~2as:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jas:gir|1jas:ver{e,ter}|2ejas:brestar|5irjas:vergir|3ças:r{ce,faze,spraze,uvi}|2enhas:vir|1nhas:ter|2has:aler|3ssas:oder|5ussas:ossir|5irtas:ertir|5urtas:ortir|5intas:entir|4itas:etir|5urmas:ormir|4iras:erir|3iras:equerer,arir|5ubras:obrir|5igras:egrir|5igas:eguir|3gas:trazer|3as:nguir|1as:air,orrir|1ias:crer|4idas:redir|3ibas:aber|4íbas:oibir|5irvas:servir|3cas:erder|6ínquas:inquir|4ulas:golir|4ilas:elir|4únas:eunir|4inas:prevenir|5irzas:erzir|5ispas:espir|2es:ar,xplodir|4údes:udar{sa,i}|6coites:çoitar|4úles:baular|3ques:ar{c,coç,emoç,braç}|5usques:moscar|5ísques:aiscar|5éques:equar|2ues:gar|6ólegues:olegar|5águes:aguar|3ces:çar|4úces:iuçar|2ies:ear|3eies:iar{ns,med,cend}|4ízes:izar{e,ju,a}|4ínes:ruinar~3ger:jas{e,vi,an,on,ster}|3ver:hajas|3dir:eças{p,sm}|3cer:peças{em,r}|3cir:arças|2er:as{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|2ir:as{nh,curt,mit,uir,garr}|4r:onhas|5estir:vistas|2uer:gas|3zer:digas|2ar:es{scoit,u{inq{p,g},ig{ver,z,n}}}|4çar:ques{strin,stro}|4car:amusques|3ar:enseies~2vás:ir|1jas:er{s,v,prov}|2ejas:estar|2ês:dar|2onhas:pôr|3iras:querer|1as:rir|1ias:ler{,re}|3ças:medir|3eies:odiar|4ulas:polir|3ques:çar{cal,for,ati,ro,la}|2as:arder,rer,condir|5ílies:mobiliar|2es:guar{min,e}|5ictas:flectir",
      "third": "1nha:r|2a:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5ista:estir|3ça:edir,cir|3ga:izer|3ja:aver,ger|3a:uer|3que:çar{tran,rin,ro,ati}|3ce:çar{ntran,oro}|2onha:ôr~2a:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3ja:gir|1ja:ver{e,ter}|2eja:brestar|5irja:vergir|3ça:r{ce,faze,spraze,uvi}|2enha:vir|1nha:ter|2ha:aler|3ssa:oder|5ussa:ossir|5irta:ertir|5urta:ortir|5inta:entir|4ita:etir|5urma:ormir|4ira:erir|3ira:equerer,arir|5ubra:obrir|5igra:egrir|5iga:eguir|3ga:trazer|3a:nguir|1a:air,orrir|1ia:crer|4ida:redir|3iba:aber|4íba:oibir|5irva:servir|3ca:erder|6ínqua:inquir|4ula:golir|4ila:elir|4úna:eunir|4ina:prevenir|5irza:erzir|5ispa:espir|2e:ar,xplodir|4úde:udar{sa,i}|6coite:çoitar|4úle:baular|3que:ar{c,coç,emoç,braç}|5usque:moscar|5ísque:aiscar|5éque:equar|2ue:gar|6ólegue:olegar|5águe:aguar|3ce:çar|4úce:iuçar|2ie:ear|3eie:iar{ns,med,cend}|4íze:izar{e,ju,a}|4íne:ruinar~2ger:ja{e,vi,an,on,ster}|2ver:haja|2dir:eça{p,sm}|2cer:peça{em,r}|2cir:arça|1er:a{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|1ir:a{nh,curt,mit,uir,garr}|3r:onha|4estir:vista|1uer:ga|2zer:diga|1ar:e{scoit,u{inq{p,g},ig{ver,z,n}}}|3çar:que{strin,stro}|3car:amusque|2ar:enseie~2vá:ir|1ja:er{s,v,prov}|2eja:estar|2ê:dar|2onha:pôr|3ira:querer|1a:rir|1ia:ler{,re}|3ça:medir|3eie:odiar|4ula:polir|3que:çar{cal,for,ati,ro,la}|2a:arder,rer,condir|5ílie:mobiliar|2e:guar{min,e}|5icta:flectir",
      "firstPlural": "1nhamos:r|2amos:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istamos:estir|3çamos:edir,cir|3gamos:izer|3jamos:aver,ger|3amos:uer|3quemos:çar{tran,rin,ro,ati}|3cemos:çar{ntran,oro}|2onhamos:ôr~2amos:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|5irvamos:servir|3jamos:gir|1jamos:ver{e,ter}|2ejamos:brestar|5irjamos:vergir|3çamos:r{ce,faze,spraze,uvi}|2enhamos:vir|1nhamos:ter|2hamos:aler|3ssamos:oder|5ussamos:ossir|5irtamos:ertir|5urtamos:ortir|5intamos:entir|4itamos:etir|5urmamos:ormir|4iramos:erir|3iramos:equerer,arir|5ubramos:obrir|5igramos:egrir|5igamos:eguir|3gamos:trazer|3amos:nguir|1amos:air,orrir|1iamos:crer|4idamos:redir|3ibamos:aber|3camos:erder|4ulamos:golir|4ilamos:elir|4inamos:prevenir|5irzamos:erzir|5ispamos:espir|2emos:ar|6coitemos:çoitar|3quemos:ar{c,coç,emoç,braç}|2uemos:gar|3cemos:çar|1mos:xplodir~4er:amos{v,h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,x,el,az,oz,enz,mp,o}|5ger:jamos{e,vi,an,on,ster}|5ver:hajamos|5dir:eçamos{p,sm}|5cer:peçamos{em,r}|5cir:arçamos|4ir:amos{nh,curt,mit,uir,garr}|6r:onhamos|7estir:vistamos|4uer:gamos|5zer:digamos|4ar:emos{scoit,u{pinq,ginq,deq,g{xa,sa,veri,zi,ni}}}|6çar:quemos{strin,stro}~2vamos:ir|1jamos:er{s,v,prov}|2ejamos:estar|2onhamos:pôr|3iramos:querer|1amos:rir|1iamos:ler{,re}|3çamos:medir|4ulamos:polir|2emos:guar{a,min,e}|3quemos:çar{cal,for,ati,ro,la}|2amos:arder,rer,condir|5ictamos:flectir",
      "secondPlural": "1nhais:r|2ais:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istais:estir|3çais:edir,cir|3gais:izer|3jais:aver,ger|3ais:uer|3queis:çar{tran,rin,ro,ati}|3ceis:çar{ntran,oro}|2onhais:ôr~2ais:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jais:gir|1jais:ver{e,ter}|2ejais:brestar|5irjais:vergir|3çais:r{ce,faze,spraze,uvi}|2enhais:vir|1nhais:ter|2hais:aler|3ssais:oder|5ussais:ossir|5irtais:ertir|5urtais:ortir|5intais:entir|4itais:etir|5urmais:ormir|4irais:erir|3irais:equerer,arir|5ubrais:obrir|5igrais:egrir|5igais:eguir|3gais:trazer|3ais:nguir|1ais:air,orrir|1iais:crer|4idais:redir|3ibais:aber|5irvais:servir|3cais:erder|4ulais:golir|4ilais:elir|4inais:prevenir|5irzais:erzir|5ispais:espir|2eis:ar|6coiteis:çoitar|3queis:ar{c,coç,emoç,braç}|2ueis:gar|3ceis:çar|1s:xplodir~4ger:jais{e,vi,an,on,ster}|4ver:hajais|4dir:eçais{p,sm}|4cer:peçais{em,r}|4cir:arçais|3er:ais{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|3ir:ais{nh,curt,mit,uir,garr}|5r:onhais|6estir:vistais|3uer:gais|4zer:digais|3ar:eis{scoit,u{pinq,ginq,deq,g{xa,sa,veri,zi,ni}}}|5çar:queis{strin,stro}~2vades:ir|1jais:er{s,v,prov}|2ejais:estar|2onhais:pôr|3irais:querer|1ais:rir|1iais:ler{,re}|3çais:medir|4ulais:polir|2eis:guar{a,min,e}|3queis:çar{cal,for,ati,ro,la}|2ais:arder,rer,condir|5ictais:flectir",
      "thirdPlural": "1nham:r|2am:r{ti{issen,emen,sves},e{,ev{cr,atr,d},rt}}|5istam:estir|3çam:edir,cir|3gam:izer|3jam:aver,ger|3am:uer|3quem:çar{tran,rin,ro,ati}|3cem:çar{ntran,oro}|2onham:ôr~2am:r{i{,rrefer,trogred,opel},te{ba,me,rre}}|3jam:gir|1jam:ver{e,ter}|2ejam:brestar|5irjam:vergir|3çam:r{ce,faze,spraze,uvi}|2enham:vir|1nham:ter|2ham:aler|3ssam:oder|5ussam:ossir|5irtam:ertir|5urtam:ortir|5intam:entir|4itam:etir|5urmam:ormir|4iram:erir|3iram:equerer,arir|5ubram:obrir|5igram:egrir|5igam:eguir|3gam:trazer|3am:nguir|1am:air,orrir|1iam:crer|4idam:redir|3ibam:aber|4íbam:oibir|5irvam:servir|3cam:erder|6ínquam:inquir|4ulam:golir|4ilam:elir|4únam:eunir|4inam:prevenir|5irzam:erzir|5ispam:espir|2em:ar,xplodir|4údem:udar{sa,i}|6coitem:çoitar|4úlem:baular|3quem:ar{c,coç,emoç,braç}|5usquem:moscar|5ísquem:aiscar|5équem:equar|2uem:gar|6óleguem:olegar|5águem:aguar|3cem:çar|4úcem:iuçar|2iem:ear|3eiem:iar{ns,med,cend}|4ízem:izar{e,ju,a}|4ínem:ruinar~3ger:jam{e,vi,an,on,ster}|3ver:hajam|3dir:eçam{p,sm}|3cer:peçam{em,r}|3cir:arçam|2er:am{h,s,ert,om,em,rr,fr,er,d{en,on,e,or},eb,amb,v,x,el,az,oz,enz,mp,o}|2ir:am{nh,curt,mit,uir,garr}|4r:onham|5estir:vistam|2uer:gam|3zer:digam|2ar:em{scoit,u{inq{p,g},ig{ver,z,n}}}|4çar:quem{strin,stro}|4car:amusquem|3ar:enseiem~2vão:ir|1jam:er{s,v,prov}|2ejam:estar|2eem:dar|2onham:pôr|3iram:querer|1am:rir|1iam:ler{,re}|3çam:medir|3eiem:odiar|4ulam:polir|3quem:çar{cal,for,ati,ro,la}|2am:arder,rer,condir|5íliem:mobiliar|2em:guar{min,e}|5ictam:flectir"
    },
    "subjImperfect": {
      "first": "1sse:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fosse:ser|3casse:çar{tran,rin,ro}|2usesse:ôr~1sse:r|4izesse:azer|1esse:vir|2ivesse:ter,brestar|4ouvesse:aver,mprazer|4udesse:oder|2usesse:or|3ssesse:izer|4ouxesse:trazer|4oubesse:aber|6coitasse:çoitar|3casse:çar{ati,co,emo,bra}|2isse:ver{e,ter}|2ísse:air,uir~3r:asse{scoit,ratic}|5çar:casse{strin,stro}~2fosse:ir|2isse:ver|2ivesse:estar|2esse:dar|2usesse:pôr|4isesse:querer|2ísse:arguir|3casse:çar{cal,for,ro,la}",
      "second": "1sses:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fosses:ser|3casses:çar{tran,rin,ro}|2usesses:ôr~1sses:r|4izesses:azer|1esses:vir|2ivesses:ter,brestar|4ouvesses:aver,mprazer|4udesses:oder|2usesses:or|3ssesses:izer|4ouxesses:trazer|4oubesses:aber|6coitasses:çoitar|3casses:çar{ati,co,emo,bra}|2isses:ver{e,ter}|2ísses:air,uir~4r:asses{scoit,ratic}|6çar:casses{strin,stro}~2fosses:ir|2isses:ver|2ivesses:estar|2esses:dar|2usesses:pôr|4isesses:querer|2ísses:arguir|3casses:çar{cal,for,ro,la}",
      "third": "1sse:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fosse:ser|3casse:çar{tran,rin,ro}|2usesse:ôr~1sse:r|4izesse:azer|1esse:vir|2ivesse:ter,brestar|4ouvesse:aver,mprazer|4udesse:oder|2usesse:or|3ssesse:izer|4ouxesse:trazer|4oubesse:aber|6coitasse:çoitar|3casse:çar{ati,co,emo,bra}|2isse:ver{e,ter}|2ísse:air,uir~3r:asse{scoit,ratic}|5çar:casse{strin,stro}~2fosse:ir|2isse:ver|2ivesse:estar|2esse:dar|2usesse:pôr|4isesse:querer|2ísse:arguir|3casse:çar{cal,for,ro,la}",
      "firstPlural": "2íssemos:vir{u,ser}|3fôssemos:ser|2êssemos:er{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}}|3cássemos:çar{tran,rin,ro}|2ássemos:çar{ntran,oro}|2uséssemos:ôr~4izéssemos:azer|1éssemos:vir|2ivéssemos:ter,brestar|4ouvéssemos:aver,mprazer|4udéssemos:oder|2uséssemos:or|3sséssemos:izer|4ouxéssemos:trazer|4oubéssemos:aber|2ássemos:ar|6coitássemos:çoitar|3cássemos:çar{ati,co,emo,bra}|2íssemos:ir,ever,terver|2êssemos:er~7ar:ássemos{scoit,ratic}|8çar:cássemos{strin,stro}~2fôssemos:ir|2íssemos:ver|2ivéssemos:estar|2éssemos:dar|2uséssemos:pôr|4iséssemos:querer|3cássemos:çar{cal,for,ro,la}",
      "secondPlural": "2ísseis:vir{u,ser}|3fôsseis:ser|2êsseis:er{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}}|3cásseis:çar{tran,rin,ro}|2ásseis:çar{ntran,oro}|2usésseis:ôr~4izésseis:azer|1ésseis:vir|2ivésseis:ter,brestar|4ouvésseis:aver,mprazer|4udésseis:oder|2usésseis:or|3ssésseis:izer|4ouxésseis:trazer|4oubésseis:aber|2ásseis:ar|6coitásseis:çoitar|3cásseis:çar{ati,co,emo,bra}|2ísseis:ir,ever,terver|2êsseis:er~6ar:ásseis{scoit,ratic}|7çar:cásseis{strin,stro}~2fôsseis:ir|2ísseis:ver|2ivésseis:estar|2ésseis:dar|2usésseis:pôr|4isésseis:querer|3cásseis:çar{cal,for,ro,la}",
      "thirdPlural": "1ssem:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fossem:ser|3cassem:çar{tran,rin,ro}|2usessem:ôr~1ssem:r|4izessem:azer|1essem:vir|2ivessem:ter,brestar|4ouvessem:aver,mprazer|4udessem:oder|2usessem:or|3ssessem:izer|4ouxessem:trazer|4oubessem:aber|6coitassem:çoitar|3cassem:çar{ati,co,emo,bra}|2issem:ver{e,ter}|2íssem:air,uir~4r:assem{scoit,ratic}|6çar:cassem{strin,stro}~2fossem:ir|2issem:ver|2ivessem:estar|2essem:dar|2usessem:pôr|4isessem:querer|2íssem:arguir|3cassem:çar{cal,for,ro,la}"
    },
    "subjFuture": {
      "first": "0:r{uvi,servi,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3for:ser|3car:çar{tran,rin,ro}|2user:ôr~0:r|4izer:azer|1er:vir|2iver:ter,brestar|4ouver:aver,mprazer|4uder:oder|2user:or|3sser:izer|4ouxer:trazer|4ouber:aber|6coitar:çoitar|3car:çar{ati,co,emo,bra}|2ir:ver{e,ter}~0:scoitar,raticar|3çar:car{strin,stro}~2for:ir|2ir:ver|2iver:estar|2er:dar|2user:pôr|4iser:querer|3car:çar{cal,for,ro,la}",
      "second": "0es:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fores:ser|3cares:çar{tran,rin,ro}|2useres:ôr~0es:r|4izeres:azer|1eres:vir|2iveres:ter,brestar|4ouveres:aver,mprazer|4uderes:oder|2useres:or|3sseres:izer|4ouxeres:trazer|4ouberes:aber|6coitares:çoitar|3cares:çar{ati,co,emo,bra}|2ires:ver{e,ter}|2íres:air,uir~2:ares{scoit,ratic}|5çar:cares{strin,stro}~2fores:ir|2ires:ver|2iveres:estar|2eres:dar|2useres:pôr|4iseres:querer|2íres:arguir|3cares:çar{cal,for,ro,la}",
      "third": "0:r{uvi,servi,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3for:ser|3car:çar{tran,rin,ro}|2user:ôr~0:r|4izer:azer|1er:vir|2iver:ter,brestar|4ouver:aver,mprazer|4uder:oder|2user:or|3sser:izer|4ouxer:trazer|4ouber:aber|6coitar:çoitar|3car:çar{ati,co,emo,bra}|2ir:ver{e,ter}~0:scoitar,raticar|3çar:car{strin,stro}~2for:ir|2ir:ver|2iver:estar|2er:dar|2user:pôr|4iser:querer|3car:çar{cal,for,ro,la}",
      "firstPlural": "0mos:r{uvi,servi,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3formos:ser|3carmos:çar{tran,rin,ro}|2usermos:ôr~0mos:r|4izermos:azer|1ermos:vir|2ivermos:ter,brestar|4ouvermos:aver,mprazer|4udermos:oder|2usermos:or|3ssermos:izer|4ouxermos:trazer|4oubermos:aber|6coitarmos:çoitar|3carmos:çar{ati,co,emo,bra}|2irmos:ver{e,ter}~3:armos{scoit,ratic}|6çar:carmos{strin,stro}~2formos:ir|2irmos:ver|2ivermos:estar|2ermos:dar|2usermos:pôr|4isermos:querer|3carmos:çar{cal,for,ro,la}",
      "secondPlural": "0des:r{uvi,servi,e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3fordes:ser|3cardes:çar{tran,rin,ro}|2userdes:ôr~0des:r|4izerdes:azer|1erdes:vir|2iverdes:ter,brestar|4ouverdes:aver,mprazer|4uderdes:oder|2userdes:or|3sserdes:izer|4ouxerdes:trazer|4ouberdes:aber|6coitardes:çoitar|3cardes:çar{ati,co,emo,bra}|2irdes:ver{e,ter}~3:ardes{scoit,ratic}|6çar:cardes{strin,stro}~2fordes:ir|2irdes:ver|2iverdes:estar|2erdes:dar|2userdes:pôr|4iserdes:querer|3cardes:çar{cal,for,ro,la}",
      "thirdPlural": "0em:r{i{uv,serv,gu,qu},e{os,ss,jaz,v{ca,cre,atre,de},t{ba,rre,me,r}},ntrança,oroça}|3forem:ser|3carem:çar{tran,rin,ro}|2userem:ôr~0em:r|4izerem:azer|1erem:vir|2iverem:ter,brestar|4ouverem:aver,mprazer|4uderem:oder|2userem:or|3sserem:izer|4ouxerem:trazer|4ouberem:aber|6coitarem:çoitar|3carem:çar{ati,co,emo,bra}|2irem:ver{e,ter}|2írem:air,uir~2:arem{scoit,ratic}|5çar:carem{strin,stro}~2forem:ir|2irem:ver|2iverem:estar|2erem:dar|2userem:pôr|4iserem:querer|2írem:arguir|3carem:çar{cal,for,ro,la}"
    },
    "gerunds": {
      "gerunds": "2ondo:ôr~1ndo:r|3cando:çar{co,bra}~~2ondo:pôr"
    },
    "pastParticiple": {
      "pastParticiple": "2osto:ôr~1do:r{,uvi,servi,gui}|2ido:er|3cado:çar{co,bra}|1ndo:vir|2ído:air,uir,oer|3to:izer|4eito:fazer|4ito:crever|2isto:rever|1sto:or|3erto:brir~2r:ido{ss,t{r,en,ran,is,es,la,pe,le,i,u},d,rm,um,r,sorr,uz,fal,ol,ub,ib,g,n,p}|3er:ido{nvert,d{po,en,on,ce,fe,r},r{ue,r,c,f},vig,eg,rgu}~1do:ir|2isto:ver|2osto:pôr"
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

  // rule-based noun inflection - portuguese plurals change the end of the word, and its written accent

  // [singular, plural]
  const pairs$1 = [
    ['mal', 'males'],
    ['cônsul', 'cônsules'],
    ['caráter', 'caracteres'],
    ['júnior', 'juniores'],
    ['sênior', 'seniores'],
    ['cânon', 'cânones'],
    ['túnel', 'túneis'],
    ['qualquer', 'quaisquer'],
    ['mãe', 'mães'],
    ['pai', 'pais'],
    ['herói', 'heróis'],
    // an unstressed '-en' loses its accent
    ['hífen', 'hifens'],
    ['pólen', 'polens'],
    ['abdômen', 'abdomens'],
    ['líquen', 'liquens'],
    ['éden', 'edens'],
    ['gérmen', 'germens'],
    // a stressed '-s' loses it too
    ['gás', 'gases'],
    ['ás', 'ases'],
    ['ananás', 'ananases'],
    ['lilás', 'lilases'],
    ['revés', 'reveses'],
    ['convés', 'conveses'],
    ['viés', 'vieses'],
    ['retrós', 'retroses'],
    ['rês', 'reses'],
    ['obus', 'obuses'],
    ['país', 'países'],
    ['deus', 'deuses'],
    ['adeus', 'adeuses'],
    // loanwords
    ['gol', 'gols']
  ];
  const irregular$2 = { toPlural: {}, fromPlural: {} };
  pairs$1.forEach((a) => {
    irregular$2.toPlural[a[0]] = a[1];
    irregular$2.fromPlural[a[1]] = a[0];
  });
  // both are right
  irregular$2.fromPlural.carateres = 'caráter';

  const set$1 = (str) => new Set(str.split(','));
  // '-ão' is '-ões', but not for these - 'pães', 'alemães'
  const aes = set$1('pão,cão,alemão,capitão,escrivão,tabelião,capelão,catalão,charlatão,sacristão,guardião');
  // .. or these - 'mãos', 'irmãos' - and any unstressed '-ão' - 'órgãos'
  const aos = set$1('mão,irmão,cidadão,cristão,pagão,grão,chão,vão,são,artesão,cortesão,ancião,afegão,desvão');
  // singular nouns that end in an unstressed '-s'
  const same = set$1('lápis,tênis,oásis,íris,cútis,pélvis,práxis,cais,grátis,pires,alferes,ourives,herpes,simples,atlas,jeans');
  // nouns that are only used in the plural
  const pluralOnly = set$1('óculos,férias,parabéns,núpcias,pêsames,arredores,víveres,fezes,cócegas,anais,afazeres');
  // stressed '-i' nouns, which look like the plural of an '-il' - 'rubis', but 'barris'
  const plainI = set$1('rubi,javali,abacaxi,gibi,jabuti,saci,quati,caqui,bisturi,colibri,kiwi,esqui,tupi,guarani,siri,zumbi,sushi');
  // '-e' nouns, which look like the plural of a consonant - 'árvores', but 'flores'
  const plainE = set$1('árvore,hectare,folclore,software,hardware,gaze,doze,treze');

  const strip = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', â: 'a', ê: 'e', ô: 'o' };
  const hasAccent = /[áéíóúâêô]/;
  const noAccent$1 = (str) => str.replace(/[áéíóúâêô]/g, (c) => strip[c]);
  // '-ês' is a singular - 'inglês', 'mês' - but 'bebês' is a plural
  const isEs = /(guês|glês|ancês|cocês|[aoi]nês|landês|amês|[rn]tês|^mês|marquês)$/;

  // is this a noun, or an adjective, in the given lexicon?
  const isWord$1 = (str, lex) => Boolean(lex) && lex.hasOwnProperty(str) && /Noun|Adjective|Singular/.test(lex[str]);
  // the first of these words that we know - or the first one
  const pick = (lex, arr) => arr.find((str) => isWord$1(str, lex)) || arr[0];

  // 'lápis', 'vírus', 'tórax', 'mês' are not plurals
  const isSingular = function (str) {
    if (!str.endsWith('s')) {
      return true
    }
    // 'ônibus', 'bíceps', 'português'
    return same.has(str) || irregular$2.toPlural.hasOwnProperty(str) || isEs.test(str) || (/([^aeiouáéíóúâêô]us|ps)$/.test(str) && hasAccent.test(str))
  };

  // irregulars -> invariables -> spelling rules -> '-s'
  const toPlural$1 = (str) => {
    if (irregular$2.toPlural.hasOwnProperty(str)) {
      return irregular$2.toPlural[str]
    }
    const stem = str.slice(0, -1);
    const two = str.slice(0, -2);
    // 'pão' -> 'pães', 'mão' -> 'mãos', 'órgão' -> 'órgãos', 'lição' -> 'lições'
    if (str.endsWith('ão')) {
      if (aes.has(str)) {
        return two + 'ães'
      }
      return aos.has(str) || hasAccent.test(two) ? str + 's' : two + 'ões'
    }
    // 'homem' -> 'homens'
    if (str.endsWith('m')) {
      return stem + 'ns'
    }
    // 'raiz' -> 'raízes', 'flor' -> 'flores', 'luz' -> 'luzes'
    if (/[rz]$/.test(str)) {
      return str.replace(/([aeou])iz$/, '$1íz') + 'es'
    }
    // 'animal' -> 'animais' - but 'troll' -> 'trolls'
    if (/[^l]l$/.test(str)) {
      // 'fóssil' -> 'fósseis', 'barril' -> 'barris'
      if (str.endsWith('il')) {
        return hasAccent.test(str) ? two + 'eis' : stem + 's'
      }
      // 'papel' -> 'papéis', 'lençol' -> 'lençóis' - but 'túnel' -> 'túneis', 'álcool' -> 'álcoois'
      if (/[eo]l$/.test(str) && !hasAccent.test(str)) {
        return two + (str.endsWith('el') ? 'éis' : 'óis')
      }
      // 'animal' -> 'animais', 'azul' -> 'azuis'
      return stem + 'is'
    }
    if (str.endsWith('s')) {
      // 'lápis', 'ônibus' never change - but 'mês' -> 'meses', 'inglês' -> 'ingleses'
      return isEs.test(str) ? str.slice(0, -2) + 'eses' : str
    }
    // 'hífen' -> 'hifens'
    if (/en$/.test(str) && hasAccent.test(str)) {
      return noAccent$1(str) + 's'
    }
    // 'tórax' - and 'casa' -> 'casas', 'café' -> 'cafés', 'shopping' -> 'shoppings'
    return str.endsWith('x') ? str : str + 's'
  };

  // irregulars -> invariables -> spelling rules -> known words -> the most likely one
  // 'lex' is an optional lexicon, to look for the singular in
  const fromPlural = (str, lex) => {
    if (irregular$2.fromPlural.hasOwnProperty(str)) {
      return irregular$2.fromPlural[str]
    }
    if (isSingular(str) || pluralOnly.has(str)) {
      return str
    }
    const e = str.slice(0, -1);
    const stem = str.slice(0, -2);
    const three = str.slice(0, -3);
    // 'lições' -> 'lição', 'pães' -> 'pão'
    if (/(õe|ãe)s$/.test(str)) {
      return three + 'ão'
    }
    // 'homens' -> 'homem' - but 'elétrons' -> 'elétron', 'slogans' -> 'slogan'
    if (str.endsWith('ns')) {
      return /ans$/.test(str) || (/ons$/.test(str) && hasAccent.test(stem)) ? e : pick(lex, [stem + 'm', e])
    }
    if (str.endsWith('is')) {
      // 'papéis' -> 'papel', 'lençóis' -> 'lençol'
      if (/[éó]is$/.test(str)) {
        return pick(lex, [three + noAccent$1(str.slice(-3, -2)) + 'l', e])
      }
      if (/[aeou]is$/.test(str)) {
        // 'reis' -> 'rei', 'bois' -> 'boi' - but 'animais' -> 'animal', 'azuis' -> 'azul'
        if (!hasAccent.test(str)) {
          return /[au]is$/.test(str) ? pick(lex, [stem + 'l', e]) : e
        }
        // 'álcoois' -> 'álcool', 'amáveis' -> 'amável', 'fósseis' -> 'fóssil'
        if (!str.endsWith('eis')) {
          return stem + 'l'
        }
        return str.endsWith('veis') ? pick(lex, [stem + 'l', three + 'il']) : pick(lex, [three + 'il', stem + 'l'])
      }
      // 'táxis' -> 'táxi', 'rubis' -> 'rubi' - but 'barris' -> 'barril'
      return hasAccent.test(str) || plainI.has(e) ? e : pick(lex, [e + 'l', e])
    }
    if (!str.endsWith('es') || /(ss|[^aeiouáéíóúâêô][rz])es$/.test(str) || plainE.has(e)) {
      // 'casas' -> 'casa', 'classes' -> 'classe', 'padres' -> 'padre', 'árvores' -> 'árvore'
      return e
    }
    // 'flores' -> 'flor', 'raízes' -> 'raiz', 'luzes' -> 'luz' - and 'hífenes' -> 'hífen'
    if (/[rz]es$/.test(str) || (/[eo]nes$/.test(str) && hasAccent.test(str))) {
      return pick(lex, [stem.replace(/íz$/, 'iz'), e])
    }
    // 'portugueses' -> 'português', 'meses' -> 'mês' - but 'teses' -> 'tese'
    const es = str.slice(0, -4) + 'ês';
    return str.endsWith('eses') && isEs.test(es) ? pick(lex, [es, e]) : e
  };

  const all$1 = function (str) {
    const plur = toPlural$1(str);
    if (str === plur) {
      return [str]
    }
    return [str, plur]
  };

  // only people and animals have a feminine form - 'menino' -> 'menina', but not 'livro'
  // [masculine, feminine]
  const pairs =
    'ator:atriz,actor:actriz,imperador:imperatriz,embaixador:embaixatriz,rei:rainha,réu:ré,herói:heroína,poeta:poetisa,profeta:profetisa,' +
    'sacerdote:sacerdotisa,conde:condessa,visconde:viscondessa,abade:abadessa,duque:duquesa,príncipe:princesa,barão:baronesa,' +
    'tigre:tigresa,leão:leoa,patrão:patroa,leitão:leitoa,pavão:pavoa,ladrão:ladra,sultão:sultana,cão:cadela,judeu:judia,' +
    'avô:avó,bisavô:bisavó,pai:mãe,homem:mulher,padrinho:madrinha,padrasto:madrasta,padre:madre,compadre:comadre,genro:nora,' +
    'cavalo:égua,galo:galinha,boi:vaca,bode:cabra,carneiro:ovelha,juiz:juíza,deus:deusa,frade:freira,monge:monja,mestre:mestra,' +
    'espanhol:espanhola,elefante:elefanta,garçom:garçonete,czar:czarina,maestro:maestrina,peru:perua,macho:fêmea';
  const irregular$1 = { toFeminine: {}, fromFeminine: {} };
  pairs.split(',').forEach((str) => {
    const [m, f] = str.split(':');
    irregular$1.toFeminine[m] = f;
    irregular$1.fromFeminine[f] = m;
  });

  // people and animals in '-o', and '-ão' - 'gato' -> 'gata', 'irmão' -> 'irmã'
  const animate = new Set(
    (
      'menin,garot,moç,filh,net,bisnet,sobrinh,prim,ti,sogr,cunhad,espos,noiv,namorad,amig,inimig,vizinh,alun,médic,advogad,' +
      'engenheir,enfermeir,cozinheir,secretári,funcionári,empregad,operári,empresári,bibliotecári,veterinári,voluntári,usuári,' +
      'proprietári,padeir,pedreir,carteir,bombeir,marinheir,costureir,jardineir,cabeleireir,faxineir,prefeit,ministr,deputad,' +
      'candidat,sóci,don,técnic,músic,físic,químic,matemátic,polític,mecânic,arquitet,fotógraf,filósof,gat,cachorr,pat,lob,urs,' +
      'macac,coelh,burr,porc,rat,pomb,gans,velh,brux,mag,sant,criad,escrav,viúv,solteir,companheir,parceir,guerreir,herdeir,' +
      'prisioneir,passageir,estrangeir,brasileir,mexican,american,italian,african,angolan,russ,greg,turc,suíç,argentin,cuban,' +
      'indian,índi,cigan,convidad,conhecid,desconhecid,delegad,aposentad,mendig,gême,irmã,campeã,cidadã,anã,alemã,capitã,órfã,' +
      'cristã,pagã,anciã,aldeã,espiã,guardiã,artesã,cirurgiã,escrivã,anfitriã,vilã,catalã'
    ).split(',')
  );
  // nouns with one form for both genders - 'o estudante', 'a estudante'
  const common =
    /^(estudante|cliente|gerente|agente|assistente|paciente|doente|amante|visitante|habitante|participante|presidente|comerciante|viajante|imigrante|representante|adolescente|jovem|colega|atleta|chefe|intérprete|mártir|policial|fã|camarada|.*iatra|.{3,}[ií]sta)$/;
  const isCommon = (str) => common.test(str) && !/(re|tre|con)vista$/.test(str);

  // '-or' nouns that are not a person - 'motor', 'computador'
  const notPerson = /^((ar|pu|o|fe|pen|ver|con|esplen)?dor|(mo|se|fac?|tra|ve|ro|rea|cober|proje|extin|interrup)tor|.*(comput|ventil|elev|refriger|liquidific|aspir|radi|aceler|carreg|sec|process|naveg)ador|televisor|sensor|cursor)$/;

  // '-ão' that is '-ona' - 'solteirão', 'chorão'
  const big = /(solteir|comil|alh|chor|sabich|valent|resmung|bonit|grand|bob)ão$/;
  // '-eu' that is '-eia' - 'europeu', 'ateu'
  const eu = /(rop|^at|br|eb|gm|il)eu$/;

  // irregulars -> people that we know -> endings that are always a person
  const toFeminine = function (str) {
    if (irregular$1.toFeminine.hasOwnProperty(str)) {
      return irregular$1.toFeminine[str]
    }
    // 'menino' -> 'menina', 'irmão' -> 'irmã', 'psicólogo' -> 'psicóloga'
    if (animate.has(str.slice(0, -1)) || /[^r]ólogo$/.test(str)) {
      return str.endsWith('ão') ? str.slice(0, -1) : str.slice(0, -1) + 'a'
    }
    // 'professor' -> 'professora', 'senhor' -> 'senhora'
    if (/([dts]or|^senhor)$/.test(str) && !notPerson.test(str)) {
      return str + 'a'
    }
    // 'freguês' -> 'freguesa'
    if (/.{2}ês$/.test(str)) {
      return str.slice(0, -2) + 'esa'
    }
    // 'solteirão' -> 'solteirona'
    if (big.test(str)) {
      return str.slice(0, -2) + 'ona'
    }
    // 'europeu' -> 'europeia'
    return eu.test(str) ? str.slice(0, -1) + 'ia' : str
  };

  const fromFeminine = function (str) {
    if (irregular$1.fromFeminine.hasOwnProperty(str)) {
      return irregular$1.fromFeminine[str]
    }
    // 'professora' -> 'professor'
    if (/([dts]or|^senhor)a$/.test(str)) {
      return str.slice(0, -1)
    }
    // 'freguesa' -> 'freguês'
    if (/.{2}esa$/.test(str) && toFeminine(str.slice(0, -3) + 'ês') === str) {
      return str.slice(0, -3) + 'ês'
    }
    // 'irmã' -> 'irmão', 'solteirona' -> 'solteirão', 'europeia' -> 'europeu'
    if (/ã$/.test(str) || big.test(str.slice(0, -3) + 'ão')) {
      return str.replace(/(ã|ona)$/, 'ão')
    }
    if (eu.test(str.slice(0, -2) + 'u')) {
      return str.slice(0, -2) + 'u'
    }
    // 'menina' -> 'menino'
    return isCommon(str) ? str : str.replace(/a$/, 'o')
  };

  // [male, female]
  const irregular = { bom: 'boa', mau: 'má', cru: 'crua', nu: 'nua', judeu: 'judia', espanhol: 'espanhola', andaluz: 'andaluza' };
  const fromIrregular = {};
  Object.keys(irregular).forEach((k) => {
    fromIrregular[irregular[k]] = k;
  });
  // '-ês' and '-or' add an '-a' - 'inglesa', 'trabalhadora' - but not 'cortês', 'incolor', 'maior'
  const gendered = /([^t]ês|[dts]or)$/;
  // '-a' adjectives that have no '-o' form - 'otimista', 'agrícola', 'belga'
  const commonA = /^(persa|maia|celta|rosa|lilás|violeta|laranja)$|([ií]sta|ícola|icida|crata|ócrita|[ip]ota|belga|asteca|ômade|ígena)$/;
  // .. but these ones do - 'mista', 'prevista'
  const notCommon = /^(mista|(im|pre)?vista)$/;
  // '-esa' that is '-ês' - 'portuguesa', 'francesa' - but 'obesa'
  const esa = /(gu|gl|anc|coc|[aoi]n|land|am)esa$/;

  // irregulars -> endings that add an '-a' -> '-o'
  // 'bonito' -> 'bonita', 'inglês' -> 'inglesa', but 'grande' -> 'grande'
  const toFemale$1 = (str) => {
    if (irregular.hasOwnProperty(str)) {
      return irregular[str]
    }
    if (str.endsWith('o') && !str.endsWith('ão')) {
      return str.slice(0, -1) + 'a'
    }
    // 'alemão' -> 'alemã', but 'chorão' -> 'chorona'
    if (str.endsWith('ão')) {
      return big.test(str) ? str.slice(0, -2) + 'ona' : str.slice(0, -1)
    }
    if (gendered.test(str)) {
      return str.replace(/ês$/, 'es') + 'a'
    }
    // 'europeu' -> 'europeia'
    return eu.test(str) ? str.slice(0, -1) + 'ia' : str
  };
  // the same spelling rules as the nouns - 'feliz' -> 'felizes', 'fácil' -> 'fáceis'
  const toPlural = (str) => toPlural$1(str);
  const toFemalePlural = (str) => toPlural$1(toFemale$1(str));

  // 'bonita' -> 'bonito', 'inglesa' -> 'inglês', but 'otimista' -> 'otimista'
  // 'lex' is an optional lexicon, to look for the adjective in
  const fromFemale = (str, lex) => {
    if (fromIrregular.hasOwnProperty(str)) {
      return fromIrregular[str]
    }
    // 'alemã' -> 'alemão', 'chorona' -> 'chorão'
    if (str.endsWith('ã') || big.test(str.slice(0, -3) + 'ão')) {
      return str.replace(/(ã|ona)$/, 'ão')
    }
    if (!str.endsWith('a')) {
      return str
    }
    const stem = str.slice(0, -1);
    const o = stem + 'o';
    if (isWord$1(o, lex)) {
      return o
    }
    // 'europeia' -> 'europeu'
    if (eu.test(stem.slice(0, -1) + 'u')) {
      return stem.slice(0, -1) + 'u'
    }
    // 'trabalhadora' -> 'trabalhador', 'inglesa' -> 'inglês'
    if (/[dts]ora$/.test(str)) {
      return stem
    }
    if (esa.test(str)) {
      return stem.slice(0, -2) + 'ês'
    }
    return (commonA.test(str) && !notCommon.test(str)) || isWord$1(str, lex) ? str : o
  };
  const toSingular = (str, lex) => fromPlural(str, lex);
  const fromFemalePlural = (str, lex) => (/[aãá]s$/.test(str) ? fromFemale(str.slice(0, -1), lex) : fromPlural(str, lex));

  const all = function (str) {
    const arr = [str, toFemale$1(str), toPlural(str), toFemalePlural(str)];
    return Array.from(new Set(arr))
  };

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
      all: all$1, toPlural: toPlural$1, fromPlural: fromPlural, toSingular: fromPlural,
      toFeminine, fromFeminine, isCommon, isSingular,
    },
    adjective: {
      all: all, toFemale: toFemale$1, toPlural, toFemalePlural, fromFemale, toSingular, fromPlural: toSingular, fromFemalePlural,
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

  // verb-forms that are also another word - 'conto', 'visita', 'casa'
  const verbForms = {};
  const isVerb = (tags) => /Tense|Imper|Subj|Cond|Plup|Infin|Gerund|Partic|Copula|Person|Verb/.test(tags);
  // forms of an adjective that are also another word - 'cara', 'bonita', 'interior'
  const adjForms = {};
  const adj = methods.adjective;
  // 'antiga', 'antigos' are in the list, beside 'antigo'
  const isInflected = (w, words) => [adj.fromFemale(w), adj.toSingular(w), adj.fromFemalePlural(w)].some((s) => s !== w && words.hasOwnProperty(s));
  const addToLex = function (obj, tags, lex) {
    // find forms that repeat across persons, like 'falava' (1st + 3rd)
    const counts = {};
    Object.values(obj).forEach(w => {
      counts[w] = (counts[w] || 0) + 1;
    });
    Object.keys(obj).forEach(k => {
      const w = obj[k];
      // skip the person-tag for ambiguous forms
      const out = counts[w] > 1 ? tags : tags.concat([tagMap[k]]);
      if (!lex[w]) {
        lex[w] = out;
      } else if (!isVerb(lex[w]) && !verbForms[w]) {
        verbForms[w] = out;
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
      if (tag === 'Adjective' && isInflected(w, wordsObj)) {
        return
      }
      if (lexicon$1[w] && isVerb(lexicon$1[w]) && tag !== 'Infinitive') {
        verbForms[w] = lexicon$1[w];
      }
      if (lexicon$1[w] && /Adjective/.test(lexicon$1[w])) {
        adjForms[w] = lexicon$1[w];
      }
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
        // the noun wins over a form of an adjective - 'estrangeiros', 'trabalhadora'
        const add = function (str, tags, old) {
          const isAdj = /Adjective/.test(lexicon$1[str]);
          if (isAdj) {
            adjForms[str] = lexicon$1[str];
          }
          if (!lexicon$1[str] || isAdj || lexicon$1[str] === old) {
            lexicon$1[str] = tags;
          }
        };
        add(methods.noun.toPlural(w), 'Plural');
        // professor → professora, menino → menina - but not 'pai' → 'mãe'
        const fem = methods.noun.toFeminine(w);
        if (fem !== w && fem.slice(0, 2) === w.slice(0, 2)) {
          add(fem, ['Noun', 'FemaleNoun', 'Singular'], 'Noun');
          add(methods.noun.toPlural(fem), ['Noun', 'FemaleNoun', 'Plural'], 'Plural');
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

  // console.log(lexicon['acordado'])
  // console.log(Object.keys(lexicon).length)


  // names of people and places, shared by every language - our own words win
  Object.keys(properNouns).forEach(tag => {
    Object.keys(unpack(properNouns[tag])).forEach(w => {
      lexicon$1[w] = lexicon$1[w] || tag;
    });
  });

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
    model: { two: { verbForms, adjForms } },
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

  // words that end in a period, but don't end a sentence - 'Dr.'
  // (these replace the english abbreviations, which collide with real words here)
  const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]));

  var abbreviations = toObj(`
  sr sra srs sras srta dr dra drs dras prof profa profs eng arq
  exa exmo exma ilmo ilma pe sto sta gen cel cap ten sgt maj
  av cia ltda trav vs depto dep univ ed séc
  pág págs art vol fig tab núm ref ex tel aprox obs doc etc
  kg km cm mm ml min
  seg qua qui sex
  jan fev abr mai jun jul ago set out nov dez
`);

  var tokenizer = {
    mutate: (world) => {
      world.model.one.unicode = unicode;

      world.model.one.contractions = contractions;

      // our own abbreviations, for the sentence-parser
      world.model.one.abbreviations = { ...abbreviations };

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


  const tagger$1 = function (view) {
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
      preTagger: tagger$1
    },
    model: {
      two: model
    },
    // methods,
    hooks: ['preTagger']
  };

  const postTagger$2 = function (doc) {
    // ('oitenta e três', 'um milhão' and 'menos noventa' are done in ./numbers.js)
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
    // 'a verdade era..', 'eu o vi' are in article-clitic.js

    // 'preciso que..', 'eu preciso de ajuda' - verb-use of 'preciso'
    // but not 'o trabalho preciso', where it stays an adjective
    doc.match('^[preciso] (que|de|#Infinitive)', 0).tag('Verb', 'preciso-verb');
    doc.match('(#Pronoun|#Negative|#Adverb) [preciso] (que|de|#Infinitive)', 0).tag('Verb', 'pron-preciso-verb');

    // ==subjunctive context==
    // 'espero que fale', 'talvez ele venha', 'que você não fale'
    doc.match('(que|talvez|embora) (#Pronoun|#Negative)? (#Pronoun|#Negative)? [#Imperative]', 0).tag('Subjunctive', 'que-subjunctive');

    // 'se eu fosse' - conditional-if, not the reflexive pronoun
    doc.match('[se] (eu|tu|ele|ela|nós|vós|você|vocês|eles|elas)', 0).tag('Conjunction', 'se-if');


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

    // ==misc==
    // four vs room
    doc.match('#Determiner [quarto]', 0).tag('Noun', 'quatro-room');
    doc.match('#Determiner [quartos]', 0).tag('Plural', 'quatro-room');
  };

  // some articles are also object-pronouns - and the word after them may be a noun, or a verb
  // this is the decision, and it knows no language - the words, tags and endings all come from a config object:
  //
  //  articles      - {word: {plural, not, but}} - each article, whether it is plural, and the endings that can not
  //                  follow it as a noun ('not'), apart from some exceptions ('but')
  //  clitics       - Set of the articles that are also object-pronouns
  //  verbBefore    - Set of words that an object-pronoun follows - a subject-pronoun, a negation
  //  clauseBefore  - Set of words that either one may follow - a conjunction, an adverb
  //  joins         - Set of coordinating conjunctions
  //  quantifiers   - {word: article} - words that come before their own article
  //  nounAfter     - Set of words that follow a noun, and not a verb - 'of'
  //  verbEnding    - RegExp of a present-tense ending that few nouns have
  //  pluralEnding  - RegExp of the ending of a plural noun
  //  nouns         - Set of words that are a noun after an article, whatever their tag
  //  nonFinite, nounForm, weak, present, pluralPerson, afterVerb, homograph, skip - lists of tags
  //  hyphen        - true if an object-pronoun may hang from a hyphen
  //  initial       - true if an object-pronoun may begin a sentence
  //  isNoun(str, world)   - do we know this word as a noun?
  //  getVerb(term, world) - tags of the verb-form that this term also is, if it has another tag
  //
  // the cues, in order:
  //  1. is this article a pronoun at all? is it an object, after a verb or a preposition?
  //  2. is there a subject-pronoun, or a negation, before it?
  //  3. can the word follow this article, as a noun?
  //  4. is it a real verb-form, that is not a noun that we know?
  //  5. is there a subject before it, and no verb yet?
  //  6. what comes after it?

  const getStr = (term) => term.implicit || term.normal;
  const has$1 = (term, tag) => Boolean(term) && term.tags.has(tag);
  const hasAny = (term, tags) => Boolean(term) && tags.some((tag) => term.tags.has(tag));
  const hasPunct = (term) => /[,;:.!?]/.test(term.post || '');
  const isLower = (term) => !/\p{Lu}/u.test(term.text);

  const tagArticles = function (view, config) {
    const world = view.world;
    const setTag = world.methods.one.setTag;
    const { articles, clitics, verbBefore, clauseBefore } = config;
    const retag = function (term, tags, reason) {
      term.tags.clear();
      setTag([term], tags, world, false, reason);
    };
    const agrees = function (art, str) {
      const o = articles[art];
      return !o.not.test(str) || o.but.test(str)
    };

    view.docs.forEach((terms) => {
      // the verb-form that this term is, or also is
      const verbs = terms.map((term) => {
        if (has$1(term, 'Verb')) {
          return hasAny(term, config.nonFinite) ? null : Array.from(term.tags)
        }
        return isLower(term) && hasAny(term, config.homograph) ? config.getVerb(term, world) : null
      });
      const isFinite = (n) => Boolean(verbs[n]) && has$1(terms[n], 'Verb');
      // a noun that we know - not a name, or a word that the tagger guessed
      const isKnown = (n) => !hasAny(terms[n], ['Verb', 'ProperNoun']) || config.isNoun(terms[n].normal, world);
      // does a verb begin here? - '[is] high', '[it pays] John', '[not] going'
      const verbAt = function (n) {
        while (hasAny(terms[n], ['Adverb', 'Negative'])) {
          n += 1;
        }
        const term = terms[n];
        if (term && (clitics.has(getStr(term)) || verbBefore.has(getStr(term)))) {
          return isFinite(n + 1)
        }
        return isFinite(n)
      };
      // is there already a verb in this clause?
      const verbBehind = function (n) {
        for (n -= 1; n >= 0 && !hasPunct(terms[n]) && !clauseBefore.has(getStr(terms[n])); n -= 1) {
          if (isFinite(n)) {
            return true
          }
        }
        return false
      };
      let choose = null;
      // what do the words after it say?
      const lookAfter = function (i) {
        const next = terms[i + 1];
        if (!next || hasPunct(terms[i])) {
          return null
        }
        if (hasAny(next, config.nonFinite)) {
          return 'Verb'
        }
        if (verbAt(i + 1) || config.nounAfter.has(getStr(next)) || has$1(next, 'Adjective')) {
          return 'Noun'
        }
        // 'buys it and sells it', but 'the houses and the cat'
        if (config.joins.has(getStr(next)) && terms[i + 2]) {
          if (clitics.has(getStr(terms[i + 2])) && verbs[i + 3]) {
            return choose(i + 2)
          }
          return verbAt(i + 2) ? 'Verb' : 'Noun'
        }
        return hasAny(next, config.afterVerb) ? 'Verb' : null
      };
      // is the verb-form after this article a noun, or a verb?
      choose = function (i) {
        const art = getStr(terms[i]);
        const str = terms[i + 1].normal;
        const tags = verbs[i + 1];
        const prev = terms[i - 1];
        const before = prev && !hasPunct(prev) ? getStr(prev) : '';
        // 1.
        if (!clitics.has(art) || config.quantifiers[before] === art || (!before && !config.initial)) {
          return 'Noun'
        }
        if (before && (has$1(prev, 'Preposition') || has$1(prev, 'Verb'))) {
          return 'Noun'
        }
        // 2. - but 'to her' is not a subject
        const isObject = has$1(terms[i - 2], 'Preposition');
        if (verbBefore.has(before) && !(isObject && has$1(prev, 'Pronoun'))) {
          return 'Verb'
        }
        // 3.
        if (!agrees(art, str)) {
          return 'Verb'
        }
        // 4.
        const known = isKnown(i + 1);
        if (!known && config.pluralPerson.some((tag) => tags.includes(tag))) {
          return 'Verb'
        }
        const isPresent = config.present.some((tag) => tags.includes(tag));
        const isWeak = config.weak.some((tag) => tags.includes(tag));
        if (isWeak) {
          return clauseBefore.has(before) && lookAfter(i + 1) !== 'Noun' ? 'Verb' : 'Noun'
        }
        if (!known && (!isPresent || config.verbEnding.test(str))) {
          // .. unless the tagger only guessed that it is a verb
          return terms[i + 1].confidence < 1 && lookAfter(i + 1) === 'Noun' ? 'Noun' : 'Verb'
        }
        // 5.
        const after = lookAfter(i + 1);
        const isPhrase = has$1(prev, 'Noun') && hasAny(terms[i - 2], ['Determiner', 'Possessive']) && !has$1(terms[i - 3], 'Preposition');
        const isSubject = ((hasAny(prev, ['ProperNoun', 'Pronoun']) && !isObject) || isPhrase) && !has$1(prev, 'Possessive') && !clauseBefore.has(before);
        if (before && isSubject && after !== 'Noun' && !verbBehind(i)) {
          return 'Verb'
        }
        // 6.
        if (known) {
          return after === 'Verb' && before ? 'Verb' : 'Noun'
        }
        return after || (clauseBefore.has(before) ? 'Verb' : 'Noun')
      };

      for (let i = 0; i < terms.length; i += 1) {
        const art = getStr(terms[i]);
        const term = terms[i + 1];
        if (!articles.hasOwnProperty(art) || !has$1(terms[i], 'Determiner')) {
          continue
        }
        // a pronoun that hangs from its verb
        if (config.hyphen && /-/.test((terms[i - 1] || {}).post + terms[i].post)) {
          if (clitics.has(art) && has$1(terms[i - 1], 'Verb')) {
            retag(terms[i], 'Pronoun', 'clitic-hyphen');
          }
          continue
        }
        if (!term || hasPunct(terms[i]) || !isLower(term)) {
          continue
        }
        const next = hasPunct(term) ? null : terms[i + 2];
        if (config.nouns.has(term.normal) || (hasAny(term, config.nounForm) && agrees(art, term.normal) && !has$1(next, 'Noun'))) {
          // a word that is a noun, after any article - 'the afternoon', 'the dinner', 'the guests'
          retag(term, 'Noun', 'article-noun');
        } else if (verbs[i + 1] && !hasAny(term, config.skip)) {
          if (choose(i) === 'Verb') {
            retag(terms[i], 'Pronoun', 'clitic-verb');
            if (!has$1(term, 'Verb')) {
              retag(term, ['Verb'].concat(verbs[i + 1]), 'clitic-verb');
            }
            continue
          }
          if (has$1(term, 'Verb')) {
            retag(term, 'Noun', 'article-noun');
          }
        }
        // an adjective with no noun after it is the noun - 'the young arrived'
        if (has$1(term, 'Adjective')) {
          const isNoun = verbs[i + 2] && has$1(next, 'Verb') && !hasAny(next, config.skip) && agrees(art, next.normal) && isLower(next);
          if (isNoun && config.present.concat(config.weak).some((tag) => has$1(next, tag))) {
            retag(next, 'Noun', 'article-noun');
          } else if (!has$1(next, 'Noun') && !(has$1(next, 'Adjective') && has$1(terms[i + 3], 'Noun'))) {
            retag(term, 'Noun', 'article-adjective');
          }
        }
        if (!has$1(term, 'Noun') || has$1(term, 'Pronoun')) {
          continue
        }
        // a name in lower-case is not a name
        if (has$1(term, 'ProperNoun')) {
          retag(term, 'Noun', 'article-noun');
        }
        // the article knows the number of a noun that does not show it
        if (articles[art].plural && config.pluralEnding.test(term.normal)) {
          setTag([term], 'Plural', world, false, 'plural-article');
        } else if (!articles[art].plural && has$1(term, 'Plural')) {
          setTag([term], 'Singular', world, false, 'singular-article');
        }
      }
    });
  };

  // everything portuguese that article-clitic.js needs to know
  const set = (str) => new Set(str.split(','));
  // masculine nouns in '-a'
  const maleA = '([eoa]ma|ista|^(dia|mapa|planeta|cometa|clima|samba|panda|gorila|guarda|colega|atleta|poeta|papa|nada))';
  const none = /^$/;

  var config = {
    // 'not' are endings that a noun can not have, after this article - 'but' are its exceptions
    articles: {
      o: { plural: false, not: /[as]$/, but: new RegExp(maleA + '$|ês$') },
      a: { plural: false, not: /[os]$/, but: /(ão|^(foto|moto|tribo|libido))$/ },
      os: { plural: true, not: /([^sx]|as)$/, but: new RegExp(maleA + 's$') },
      as: { plural: true, not: /([^sx]|os)$/, but: /^(foto|moto|tribo|libido)s$/ },
      um: { plural: false, not: none, but: none },
      uma: { plural: false, not: none, but: none },
      uns: { plural: true, not: none, but: none },
      umas: { plural: true, not: none, but: none }
    },
    // 'o', 'a', 'os', 'as' are object-pronouns too - 'eu a vejo'
    clitics: set('o,a,os,as'),
    // words that an object-pronoun follows - 'não a vejo', 'ela o conta'
    verbBefore: set('não,nunca,jamais,nem,eu,tu,ele,ela,você,nós,vós,eles,elas,vocês,quem,ninguém,alguém'),
    // .. or a noun - 'se a conta é alta', but 'se a compra'
    clauseBefore: set('que,se,quando,porque,onde,como,enquanto,embora,já,também,sempre,ainda,só,talvez,aqui,agora,hoje,logo'),
    joins: set('e,ou,mas'),
    // 'todos os dias', 'toda a gente'
    quantifiers: { todo: 'o', toda: 'a', todos: 'os', todas: 'as', ambos: 'os', ambas: 'as' },
    // 'a venda da casa'
    nounAfter: set('de'),
    // 'vende', 'conheces' are verbs - '-er' and '-ir' verbs do not make nouns like 'a compra', 'o canto'
    verbEnding: /es?$/,
    // 'os lápis', 'os tórax'
    pluralEnding: /[sx]$/,
    // these are adverbs, or pronouns, in the lexicon - 'a tarde', 'o bem', 'os nós'
    nouns: set('tarde,bem,mal,sede,nós'),
    nonFinite: ['Infinitive', 'Gerund', 'PastParticiple'],
    // 'o jantar', 'os poderes', 'o namorado'
    nounForm: ['Infinitive', 'PastParticiple'],
    // forms that want a 'que', or a 'não' - 'que o faça'
    weak: ['Subjunctive', 'Imperative'],
    present: ['PresentTense'],
    pluralPerson: ['FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
    // 'a canta muito bem', 'a paga o João'
    afterVerb: ['Adverb', 'Determiner', 'Value', 'ProperNoun', 'Pronoun', 'Date'],
    // tags of a word that may also be a verb-form - 'conta', 'limpa', 'como'
    homograph: ['Noun', 'Adjective', 'Conjunction'],
    // 'a era', 'o ser'
    skip: ['Copula', 'Auxiliary', 'Pronoun', 'Value'],
    // 'vejo-a', 'dar-lhe-ei'
    hyphen: true,
    // .. but can not begin a sentence - 'O vejo'
    initial: false,
    isNoun: function (str, world) {
      const lexicon = world.model.one.lexicon;
      return /^(Noun|Plural)$/.test(lexicon[str]) || lexicon[world.methods.two.transform.noun.fromPlural(str)] === 'Noun'
    },
    getVerb: (term, world) => world.model.two.verbForms[term.normal] || null
  };

  // the lexicon gives 'cara', 'interior' to a noun, 'bonita' to a name, and 'estreita' to a verb
  // but after 'ser' or 'estar', a form of an adjective that we know is that adjective - 'é cara', 'são bonitas'
  const copulaAdjective = function (view) {
    const world = view.world;
    const setTag = world.methods.one.setTag;
    const forms = world.model.two.adjForms;
    view.docs.forEach((terms) => {
      for (let i = 1; i < terms.length; i += 1) {
        const term = terms[i];
        let n = i - 1;
        // 'é muito cara'
        while (n > 0 && terms[n].tags.has('Adverb')) {
          n -= 1;
        }
        if (terms[n].tags.has('Copula') && forms.hasOwnProperty(term.normal) && !term.tags.has('Adjective') && !/\p{Lu}/u.test(term.text)) {
          term.tags.clear();
          setTag([term], forms[term.normal], world, false, 'copula-adjective');
        }
      }
    });
  };

  // [number, cardinal, ordinal] - the brazilian spellings are the ones that get written
  var data = {
    ones: [
      [1, 'um', 'primeiro'],
      [2, 'dois', 'segundo'],
      [3, 'três', 'terceiro'],
      [4, 'quatro', 'quarto'],
      [5, 'cinco', 'quinto'],
      [6, 'seis', 'sexto'],
      [7, 'sete', 'sétimo'],
      [8, 'oito', 'oitavo'],
      [9, 'nove', 'nono'],
      [10, 'dez', 'décimo'],
      [11, 'onze'],
      [12, 'doze'],
      [13, 'treze'],
      [14, 'catorze'],
      [15, 'quinze'],
      [16, 'dezesseis'],
      [17, 'dezessete'],
      [18, 'dezoito'],
      [19, 'dezenove'],
    ],
    tens: [
      [20, 'vinte', 'vigésimo'],
      [30, 'trinta', 'trigésimo'],
      [40, 'quarenta', 'quadragésimo'],
      [50, 'cinquenta', 'quinquagésimo'],
      [60, 'sessenta', 'sexagésimo'],
      [70, 'setenta', 'septuagésimo'],
      [80, 'oitenta', 'octogésimo'],
      [90, 'noventa', 'nonagésimo'],
    ],
    // 'cem' is a hundred by itself
    hundreds: [
      [100, 'cento', 'centésimo'],
      [200, 'duzentos', 'ducentésimo'],
      [300, 'trezentos', 'trecentésimo'],
      [400, 'quatrocentos', 'quadringentésimo'],
      [500, 'quinhentos', 'quingentésimo'],
      [600, 'seiscentos', 'sexcentésimo'],
      [700, 'setecentos', 'septingentésimo'],
      [800, 'oitocentos', 'octingentésimo'],
      [900, 'novecentos', 'nongentésimo'],
    ],
    // [number, singular, plural, ordinal] - the short scale of brazil: a 'bilhão' is a thousand millions
    multiples: [
      [1e12, 'trilhão', 'trilhões', 'trilionésimo'],
      [1e9, 'bilhão', 'bilhões', 'bilionésimo'],
      [1e6, 'milhão', 'milhões', 'milionésimo'],
      [1e3, 'mil', 'mil', 'milésimo'],
    ],
    // other spellings that are read, but not written - european, and before the 1990 reform
    cardinals: {
      quatorze: 14,
      dezasseis: 16,
      dezassete: 17,
      dezanove: 19,
      cinqüenta: 50,
    },
    ordinals: {
      undécimo: 11,
      duodécimo: 12,
      qüinquagésimo: 50,
      setuagésimo: 70,
      tricentésimo: 300,
      qüingentésimo: 500,
      seiscentésimo: 600,
      setingentésimo: 700,
      noningentésimo: 900,
    },
  };

  // 'três' is often written 'tres', and 'milhão' as 'milhao'
  const noAccent = str => str.normalize('NFD').replace(/\p{M}/gu, '');

  // number-words, and their values
  const cardinals$1 = { zero: 0, cem: 100, uma: 1, duas: 2, ...data.cardinals };
  const ordinals$1 = { ...data.ordinals };
  const multiples = {};
  // the bottom of a fraction - 'três quartos'
  const fractions = { meio: 2, meia: 2, meios: 2, terço: 3, terços: 3, centésimos: 100, milésimos: 1000 };

  const list = [...data.ones, ...data.tens, ...data.hundreds];
  list.forEach(a => {
    const [num, card, ord] = a;
    cardinals$1[card] = num;
    if (ord) {
      ordinals$1[ord] = num;
    }
    // 'duzentas'
    if (num > 100) {
      cardinals$1[card.replace(/os$/, 'as')] = num;
    }
    // 'quintos'
    if (num > 3 && num <= 10) {
      fractions[ord + 's'] = num;
    }
  });
  data.multiples.forEach(a => {
    const [num, single, plural, ord] = a;
    multiples[single] = num;
    multiples[plural] = num;
    ordinals$1[ord] = num;
  })
  ;[cardinals$1, ordinals$1, multiples].forEach(obj => {
    Object.keys(obj).forEach(k => {
      obj[noAccent(k)] = obj[k];
    });
  });
  // 'milhão', and anything larger
  const bigs$1 = new Set(Object.keys(multiples).filter(k => multiples[k] > 1000));

  // how large can the word after this one be? - 'cento' leaves room for 'vinte', and then for 'três'
  // - 'cem' is a whole hundred, and an ordinal ten has its ones - 'décimo primeiro'
  const getRoom = function (v, w, isOrd) {
    if (v >= 100) {
      return w === 'cem' ? 0 : 100
    }
    if (v >= 20 || isOrd) {
      return v % 10 === 0 ? 10 : 0
    }
    return 0
  };

  // 'primeira', 'primeiros' or 'primeiras' -> 1
  const getOrdinal = function (w) {
    const single = w.replace(/s$/, '');
    const str = [w, single, single.replace(/a$/, 'o')].find(s => ordinals$1.hasOwnProperty(s));
    return str === undefined ? undefined : ordinals$1[str]
  };

  // the words that are a number, wherever they are - 'um', 'uma' and 'meio' are tagged by their neighbours
  const words = {};
  Object.keys(cardinals$1).forEach(k => {
    words[k] = ['Cardinal', 'TextValue'];
  });
  Object.keys(multiples).forEach(k => {
    words[k] = ['Cardinal', 'TextValue'];
  });
  // 'primeiro', 'primeira', 'primeiros', 'primeiras'
  Object.keys(ordinals$1).forEach(k => {
    const fem = k.replace(/o$/, 'a')
    ;[k, fem, k + 's', fem + 's'].forEach(str => {
      words[str] = ['Ordinal', 'TextValue'];
    });
  });
  delete words.um;
  delete words.uma;

  // number-words that are known by their neighbours
  //  - 'um' and 'uma' are articles, and are a number only inside of one - 'um milhão', 'cento e um',
  //    'trinta e uma' - or before a unit - 'um euro', 'um km', 'um por cento' - or when a sentence
  //    gives it no word to be the article of - 'tenho um.', 'um, dois e três'
  //  - 'e' joins the parts of a number - 'cento e vinte e três', 'mil e cem' - but 'três e quatro' are two numbers
  const isOne = /^uma?$/;
  // 'três quartos'
  const parts = /^(meios|terços|quartos|quintos|sextos|sétimos|oitavos|nonos|décimos|centésimos|milésimos)$/;
  const isHalf = /^mei[oa]$/;
  const isComma = /^v[íi]rgula$/;
  // 'segunda-feira' is a day
  const isFeira = /^(segunda|terça|quarta|quinta|sexta)$/;
  // 'pelo menos cinco', 'mais ou menos cinco'
  const notMinus = new Set(['pelo', 'o', 'ao', 'ou', 'nem', 'muito', 'pouco', 'bem', 'nada']);

  const cardinal = ['Cardinal', 'TextValue'];
  const fraction = ['Fraction', 'TextValue'];
  const has = (term, tag) => Boolean(term) && term.tags.has(tag);
  const isText = term => has(term, 'TextValue') && has(term, 'Cardinal');

  // how large can the word after 'e' be? - 'vinte e três', 'cento e vinte', 'mil e cem'
  const roomAfter = w => (multiples.hasOwnProperty(w) ? 1000 : getRoom(cardinals$1[w], w, false));

  const tagNumbers = function (view) {
    const world = view.world;
    const setTag = world.methods.one.setTag;
    // 'euros', 'reais'
    const money = new Set(world.model.two.europeanNumbers.currencies);
    const isCurrency = term => has(term, 'Currency') || (Boolean(term) && money.has(term.normal));
    view.docs.forEach(terms => {
      // are these two words side-by-side?
      const joins = i => Boolean(terms[i] && terms[i + 1]) && !/\S/.test(terms[i].post + terms[i + 1].pre);
      // start again - an article, noun or adjective is now a number
      const tag = function (i, tags, reason) {
        if (terms[i].frozen !== true) {
          terms[i].tags.clear();
          setTag([terms[i]], tags, world, false, reason);
        }
      };
      // tag the whole number, before this word
      const tagBefore = function (i, str, reason) {
        for (let n = i - 1; n >= 0 && joins(n) && has(terms[n], 'Value'); n -= 1) {
          setTag([terms[n]], str, world, false, reason);
        }
      };
      const str = i => (terms[i] ? terms[i].normal : '');
      // does a number begin here?
      const isNumber = i => has(terms[i], 'Value') || (isOne.test(str(i)) && joins(i) && bigs$1.has(str(i + 1)));
      for (let i = 0; i < terms.length; i += 1) {
        const term = terms[i];
        const w = term.normal;
        const before = joins(i - 1);
        const after = joins(i);
        if (isOne.test(w)) {
          // 'um milhão', 'um euro', 'um por cento'
          let found = after && (bigs$1.has(str(i + 1)) || isCurrency(terms[i + 1]) || has(terms[i + 1], 'Unit'));
          found = found || (after && joins(i + 1) && str(i + 1) === 'por' && str(i + 2) === 'cento');
          // 'um meio', 'um terço' - but 'um meio de transporte'
          const isMeans = str(i + 1) === 'meio' && joins(i + 1) && str(i + 2) === 'de';
          if (after && /^(meio|terço)$/.test(str(i + 1)) && !isMeans) {
            found = true;
            tag(i + 1, fraction, 'um-terço');
          }
          // 'só tenho um.' - but the word by itself is still the article
          if (found || (!after && terms.length > 1)) {
            tag(i, cardinal, 'um-number');
          }
        } else if (w === 'e') {
          if (before && after && isText(terms[i - 1])) {
            const next = str(i + 1);
            const room = roomAfter(str(i - 1));
            if (cardinals$1[next] > 0 && cardinals$1[next] < room && !/[0-9]/.test(next)) {
              // 'cento e vinte', 'trinta e uma'
              tag(i, 'TextValue', 'vinte-e-três');
              if (isOne.test(next)) {
                tag(i + 1, cardinal, 'vinte-e-um');
              }
            } else if (isHalf.test(next)) {
              // 'dois e meio', 'um milhão e meio'
              tag(i, 'TextValue', 'dois-e-meio');
              tag(i + 1, fraction, 'dois-e-meio');
            } else if (next === 'mil' && bigs$1.has(str(i - 1))) {
              // 'um milhão e mil'
              tag(i, 'TextValue', 'milhão-e-mil');
            }
          }
        } else if (w === 'menos') {
          // 'menos cinco', but 'três menos dois' and 'pelo menos cinco'
          const prev = terms[i - 1];
          const isLess = Boolean(prev) && (notMinus.has(prev.normal) || notMinus.has(prev.machine));
          if (after && isNumber(i + 1) && !has(terms[i + 1], 'Ordinal') && !has(prev, 'Value') && !isLess) {
            // 'menos 5' is still written in digits
            tag(i, has(terms[i + 1], 'NumericValue') ? 'Value' : 'TextValue', 'menos-cinco');
          }
        } else if (isComma.test(w)) {
          // 'três vírgula cinco'
          if (before && after && isText(terms[i - 1]) && isText(terms[i + 1])) {
            tag(i, 'TextValue', 'três-vírgula-cinco');
          }
        } else if (w === 'por' && after && str(i + 1) === 'cento' && before && has(terms[i - 1], 'Value')) {
          // 'cinco por cento'
          tagBefore(i, 'Percent', 'por-cento');
          tag(i, 'Unit', 'por-cento');
          tag(i + 1, 'Unit', 'por-cento');
          i += 1;
        } else if (isCurrency(term) && before && has(terms[i - 1], 'Value')) {
          // 'vinte e um euros'
          tagBefore(i, 'Money', 'value-currency');
          setTag([term], 'Currency', world, false, 'value-currency');
        } else if (parts.test(w)) {
          if (before && isText(terms[i - 1])) {
            tag(i, fraction, 'três-quartos');
          }
        } else if (isHalf.test(w) && !has(term, 'Fraction')) {
          // 'meio milhão', 'meio km', or the word by itself
          if (terms.length === 1 || (after && (bigs$1.has(str(i + 1)) || has(terms[i + 1], 'Unit')))) {
            tag(i, fraction, 'meio');
          }
        } else if (w === 'segundos' && before && has(terms[i - 1], 'Cardinal')) {
          // 'cinco segundos' are not fifths
          tag(i, ['Noun', 'Plural'], 'cinco-segundos');
        } else if (w === 'segundo' && has(term, 'Ordinal') && after && !has(terms[i - 1], 'Determiner')) {
          // 'segundo ele', 'segundo o jornal'
          if (['Determiner', 'Pronoun', 'ProperNoun'].some(t => has(terms[i + 1], t))) {
            tag(i, 'Preposition', 'segundo-ele');
          }
        } else if (isFeira.test(w) && terms[i + 1] && str(i + 1) === 'feira' && /^-?$/.test(term.post.trim())) {
          tag(i, 'WeekDay', 'segunda-feira');
          tag(i + 1, 'WeekDay', 'segunda-feira');
          i += 1;
        }
      }
    });
  };

  // 'a' is an article, a pronoun, and a preposition too
  // 'escrevi a ela', 'obrigado a todos'
  const aPronoun = new Set('ele,ela,eles,elas,mim,ti,si,nós,vós,você,vocês,todos,todas,ninguém,alguém,isso,isto,aquilo,quem'.split(','));
  // 'fui a pé', 'cheguei a tempo', 'daqui a pouco'
  const aNoun = new Set('pé,tempo,pouco,cavalo,respeito,sério,bordo,caminho,favor,propósito,princípio'.split(','));
  const prepositionA = function (view) {
    const world = view.world;
    view.docs.forEach((terms) => {
      terms.forEach((term, i) => {
        const prev = terms[i - 1] || { tags: new Set(), post: '' };
        const next = terms[i + 1];
        // 'vejo-a' is a pronoun
        if (term.normal !== 'a' || !term.tags.has('Determiner') || !next || /-/.test(prev.post)) {
          return
        }
        // 'começou a chover', 'vou a Lisboa', 'dei o livro a Maria'
        const isPrep = ['Infinitive', 'City'].some((tag) => next.tags.has(tag)) || (prev.tags.has('Noun') && !prev.tags.has('Pronoun') && next.tags.has('Person'));
        if (isPrep || aPronoun.has(next.normal) || aNoun.has(next.normal) || prev.implicit === 'aqui') {
          term.tags.clear();
          world.methods.one.setTag([term], 'Preposition', world, false, 'a-preposition');
        }
      });
    });
  };

  // a noun that ends in '-s' is a plural - but not 'lápis', 'ônibus', 'país'
  const nounNumber = function (view) {
    const world = view.world;
    const { isSingular } = world.methods.two.transform.noun;
    view.docs.forEach((terms) => {
      terms.forEach((term) => {
        const tags = term.tags;
        if (tags.has('Noun') && !['Plural', 'Singular', 'Pronoun', 'ProperNoun', 'Possessive'].some((tag) => tags.has(tag)) && !isSingular(term.normal)) {
          world.methods.one.setTag([term], 'Plural', world, false, 'plural-s');
        }
      });
    });
  };

  const postTagger$1 = function (view) {
    // 'um milhão', 'trinta e uma' - before these words are taken for articles
    tagNumbers(view);
    prepositionA(view);
    nounNumber(view);
    // 'a conta' or 'ela a conta'
    tagArticles(view, config);
    // 'é cara'
    copulaAdjective(view);
    postTagger$2(view);
    return view
  };

  // the whole tagging process, for re-tagging text after a change
  const tagger = view => view.compute(['freeze', 'lexicon', 'preTagger', 'europeanNumbers', 'postTagger', 'unfreeze']);

  var postTagger = {
    compute: {
      postTagger: postTagger$1,
      tagger
    },
    hooks: ['postTagger']
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var nouns$1 = {
    Noun: {
      aliases: [null, 'Substantivo'],
    },
    Singular: {
      not: ['Plural'],
    },
    ProperNoun: {
      aliases: [null, 'NomePróprio'],
    },
    Person: {
      aliases: [null, 'Pessoa'],
    },
    FirstName: {
      aliases: [null, 'PrimeiroNome'],
    },
    MaleName: {
      aliases: [null, 'NomeMasculino'],
    },
    FemaleName: {
      aliases: [null, 'NomeFeminino'],
    },
    LastName: {
      aliases: [null, 'Sobrenome'],
    },
    Honorific: {
      aliases: [null, 'Título'],
      is: 'Noun',
    },
    Place: {
      aliases: [null, 'Lugar'],
    },
    Country: {
      aliases: [null, 'País'],
    },
    City: {
      aliases: [null, 'Cidade'],
    },
    Region: {
      aliases: [null, 'Região'],
    },
    Address: {
      aliases: [null, 'Endereço'],
    },
    Organization: {
      aliases: [null, 'Organização'],
    },
    SportsTeam: {
      aliases: [null, 'Equipe'],
    },
    School: {
      aliases: [null, 'Escola'],
    },
    Company: {
      aliases: [null, 'Empresa'],
    },
    Plural: {
      not: ['Singular'],
    },
    Uncountable: {
      aliases: [null, 'Incontável'],
    },
    Pronoun: {
      aliases: [null, 'Pronome'],
    },
    Actor: {
      not: ['Person', 'Place', 'Organization'],
    },
    Activity: {
      aliases: [null, 'Atividade'],
    },
    Unit: {
      aliases: [null, 'Unidade'],
    },
    Demonym: {
      aliases: [null, 'Gentílico'],
    },
    Possessive: {
      aliases: [null, 'Possessivo'],
    },
    FemaleNoun: {
      aliases: [null, 'SubstantivoFeminino'],
      is: 'Noun',
      not: ['MaleNoun'],
    },
    MaleNoun: {
      aliases: [null, 'SubstantivoMasculino'],
      is: 'Noun',
      not: ['FemaleNoun'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var verbs$1 = {
    Verb: {
      aliases: [null, 'Verbo'],
    },
    PresentTense: {
      aliases: [null, 'Presente'],
      not: ['PastTense'],
    },
    Infinitive: {
      aliases: [null, 'Infinitivo'],
    },
    Gerund: {
      aliases: [null, 'Gerúndio'],
      not: ['Copula', 'FutureTense'],
    },
    PastTense: {
      aliases: [null, 'Passado'],
    },
    FutureTense: {
      aliases: [null, 'Futuro'],
      not: ['PresentTense', 'Gerund', 'PastTense'],
    },
    Copula: {
      aliases: [null, 'Cópula'],
    },
    Negative: {
      aliases: [null, 'Negação'],
      not: ['Value'],
    },
    Modal: {
      is: 'Auxiliary',
      not: undefined,
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
    },
    Particle: {
    },
    Auxiliary: {
      aliases: [null, 'Auxiliar'],
      not: ['Conjunction'],
    },
    Conditional: {
      aliases: [null, 'Condicional'],
      is: 'Verb',
      not: ['Infinitive', 'Imperative'],
    },
    Reflexive: {
      aliases: [null, 'Reflexivo'],
    },
    Perfecto: {
      is: 'Verb',
    },
    Imperative: {
      aliases: [null, 'Imperativo'],
      not: ['Subjunctive'],
    },
    Subjunctive: {
      aliases: [null, 'Subjuntivo'],
      is: 'Verb',
      not: ['Imperative'],
    },
    Imperfect: {
      aliases: [null, 'Imperfeito'],
      is: 'PastTense',
      not: ['Imperative'],
    },
    FirstPerson: {
      aliases: [null, 'PrimeiraPessoa'],
      is: 'Verb',
      not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
    },
    SecondPerson: {
      aliases: [null, 'SegundaPessoa'],
      is: 'Verb',
      not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
    },
    ThirdPerson: {
      aliases: [null, 'TerceiraPessoa'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
    },
    FirstPersonPlural: {
      aliases: [null, 'PrimeiraPessoaPlural'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural'],
    },
    SecondPersonPlural: {
      aliases: [null, 'SegundaPessoaPlural'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural'],
    },
    ThirdPersonPlural: {
      aliases: [null, 'TerceiraPessoaPlural'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var values = {
    Value: {
      aliases: [null, 'Número'],
    },
    Ordinal: {
    },
    Cardinal: {
    },
    Fraction: {
      aliases: [null, 'Fração'],
    },
    Multiple: {
      aliases: [null, 'Múltiplo'],
      is: 'Value',
    },
    RomanNumeral: {
      aliases: [null, 'NúmeroRomano'],
      not: ['TextValue'],
    },
    TextValue: {
      aliases: [null, 'Numeral'],
      not: ['NumericValue'],
    },
    NumericValue: {
      aliases: [null, 'Numérico'],
      not: ['TextValue'],
    },
    Money: {
      aliases: [null, 'Dinheiro'],
    },
    Percent: {
      aliases: [null, 'Porcentagem'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var dates = {
    Date: {
      aliases: [null, 'Data'],
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
      not: undefined,
    },
    Year: {
      aliases: [null, 'Ano'],
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      aliases: [null, 'Trimestre'],
      not: 'Fraction',
    },
    Holiday: {
      aliases: [null, 'Feriado'],
    },
    Season: {
      aliases: [null, 'Estação'],
      not: undefined,
    },
    Timezone: {
      aliases: [null, 'FusoHorário'],
      is: 'Noun',
      also: ['Date'],
    },
    Time: {
      aliases: [null, 'Hora'],
      not: ['AtMention'],
    },
    Duration: {
      aliases: [null, 'Duração'],
      is: 'Noun',
      also: ['Date'],
    },
  };

  // only our own tags, and what differs from the shared tagset - see ../plugin.js
  var misc = {
    Adjective: {
      aliases: [null, 'Adjetivo'],
    },
    FemaleAdjective: {
      aliases: [null, 'AdjetivoFeminino'],
      is: 'Adjective',
      not: ['MaleAdjective'],
    },
    MaleAdjective: {
      aliases: [null, 'AdjetivoMasculino'],
      is: 'Adjective',
      not: ['FemaleAdjective'],
    },
    PluralAdjective: {
      aliases: [null, 'AdjetivoPlural'],
      is: 'Adjective',
      not: ['SingularAdjective'],
    },
    SingularAdjective: {
      aliases: [null, 'AdjetivoSingular'],
      is: 'Adjective',
      not: ['PluralAdjective'],
    },
    Comparable: {
      aliases: [null, 'Comparável'],
    },
    Comparative: {
      aliases: [null, 'Comparativo'],
    },
    Superlative: {
      aliases: [null, 'Superlativo'],
    },
    NumberRange: {
      aliases: [null, 'IntervaloNumérico'],
    },
    Adverb: {
      aliases: [null, 'Advérbio'],
    },
    Determiner: {
      aliases: [null, 'Determinante', 'Artigo'],
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction', 'Preposition'],
    },
    Conjunction: {
      aliases: [null, 'Conjunção'],
      is: undefined,
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'],
    },
    Preposition: {
      aliases: [null, 'Preposição'],
      is: undefined,
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
    },
    QuestionWord: {
      aliases: [null, 'Interrogativo'],
    },
    Currency: {
      aliases: [null, 'Moeda'],
    },
    Expression: {
      aliases: [null, 'Interjeição'],
      not: ['Noun', 'Adjective', 'Verb', 'Adverb', 'Conjunction'],
    },
    Abbreviation: {
      aliases: [null, 'Abreviatura'],
    },
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      aliases: [null, 'Telefone'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {
    },
    AtMention: {
      aliases: [null, 'Menção'],
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
      aliases: [null, 'Acrônimo'],
      not: ['Plural', 'RomanNumeral'],
    },
    Condition: {
      aliases: [null, 'Condição'],
      is: undefined,
    },
  };

  const ours = Object.assign({}, nouns$1, verbs$1, values, dates, misc);

  // start from the shared tagset, then apply our own tags and changes
  const tags = { ...allTags };

  Object.keys(ours).forEach(tag => {
    const en = tags[tag];
    if (!en) {
      tags[tag] = ours[tag];
      return
    }
    // our aliases lead, so the first one stays the preferred name - then the english ones, like #NN
    const aliases = (ours[tag].aliases || [null]).concat((en.aliases || []).filter(str => str));
    tags[tag] = { ...en, ...ours[tag], aliases };
  });

  var tagset = {
    tags
  };

  const isDigit = term => /[0-9]/.test(term.text);
  // is there anything between these two words? - 'três, quatro'
  const isBroken = (a, b) => /\S/.test(a.post + b.pre);
  // 'mil', and anything larger
  const getMult = term => (term && multiples.hasOwnProperty(term.normal) ? multiples[term.normal] : 0);

  // digits, and the words that multiply them - '1 000', '2,5 milhões', '3 mil milhões'
  const readDigits = function (terms, i, res) {
    let end = i + 1;
    const joins = () => terms[end] && !isBroken(terms[end - 1], terms[end]);
    if (/^[0-9]{1,3}$/.test(terms[i].text)) {
      while (joins() && /^[0-9]{3}$/.test(terms[end].text)) {
        end += 1;
      }
    }
    res.digits = [i, end];
    res.mult = 1;
    if (/^[-+−]?[0-9][0-9.,]*$/.test(terms[end - 1].text)) {
      if (joins() && getMult(terms[end]) === 1000) {
        res.mult = 1000;
        end += 1;
      }
      if (joins() && getMult(terms[end]) > 1000) {
        res.mult *= getMult(terms[end]);
        end += 1;
      }
    }
    res.end = end;
    return res
  };

  // read the one number that begins at this term, and say where it ends
  // - each new word must fit beside the ones before it, so 'dois três' is two numbers
  // - inside of a group, the words are joined by 'e' - 'cento e vinte e três' - so 'vinte três' is two numbers
  // - a new group may begin without one - 'mil cento e vinte', 'mil e cem'
  const readNumber = function (terms, start) {
    const res = { start, end: start + 1, num: null, neg: false };
    let i = start;
    if (terms[i].normal === 'menos' && terms[i + 1] && !isBroken(terms[i], terms[i + 1])) {
      res.neg = true;
      i += 1;
    }
    if (isDigit(terms[i])) {
      return readDigits(terms, i, res)
    }
    const isOrd = terms[i].tags.has('Ordinal');
    // 'décima-primeira'
    const breaks = (a, b) => isBroken(a, b) && !(isOrd && a.post === '-' && !b.pre);
    let total = 0; // the millions
    let section = 0; // the thousands
    let group = 0; // the hundreds, tens and ones
    // the next word must be smaller than this
    let room = 1000;
    // nothing is in this group yet
    let fresh = true;
    let lastBig = Infinity;
    let lastMult = 1;
    let usedMil = false;
    let afterE = false;
    let any = false;
    let int = null; // the whole part, before a 'vírgula'
    let zeros = '';
    let over = 1;
    let extra = 0;
    for (; i < terms.length; i += 1) {
      const term = terms[i];
      const w = term.normal;
      const next = terms[i + 1];
      const joins = Boolean(next) && !isBroken(term, next);
      if ((i > start && breaks(terms[i - 1], term)) || isDigit(term)) {
        break
      }
      if (term.tags.has('Fraction') && fractions.hasOwnProperty(w)) {
        if (isOrd || int !== null) {
          break
        }
        // 'meio milhão'
        if (!any) {
          group = 1 / fractions[w];
          room = 0;
          fresh = false;
          any = true;
          continue
        }
        // 'dois e meio', 'um milhão e meio', or 'três quartos'
        if (afterE) {
          extra = lastMult / fractions[w];
        } else {
          over = fractions[w];
        }
        i += 1;
        break
      }
      if (w === 'e') {
        if (!any || isOrd || afterE || !joins || isDigit(next)) {
          break
        }
        const v = cardinals$1[next.normal];
        const isHalf = int === null && next.tags.has('Fraction') && fractions[next.normal] === 2;
        // 'um milhão e mil'
        const isMil = fresh && total > 0 && section === 0 && getMult(next) === 1000;
        if (isHalf || isMil || (v > 0 && v < room)) {
          afterE = true;
          continue
        }
        break
      }
      // 'três vírgula cinco'
      if (w === 'vírgula' || w === 'virgula') {
        if (!any || isOrd || int !== null || !joins || !cardinals$1.hasOwnProperty(next.normal)) {
          break
        }
        int = total + section + group;
        total = 0;
        section = 0;
        group = 0;
        room = 1000;
        fresh = true;
        continue
      }
      if (isOrd !== term.tags.has('Ordinal')) {
        break
      }
      const mult = isOrd ? 0 : getMult(term);
      if (mult) {
        // 'mil mil', 'dois milhões três milhões'
        if (int !== null || (mult === 1000 ? usedMil : mult >= lastBig)) {
          break
        }
        if (mult === 1000) {
          section = (group || 1) * 1000;
        } else {
          total += (section + group || 1) * mult;
          section = 0;
          lastBig = mult;
        }
        usedMil = mult === 1000;
        lastMult = mult;
        group = 0;
        room = 1000;
        fresh = true;
        afterE = false;
        any = true;
        continue
      }
      const v = isOrd ? getOrdinal(w) : cardinals$1[w];
      if (v === undefined) {
        break
      }
      // 'três vírgula zero cinco'
      if (v === 0 && int !== null && fresh) {
        zeros += '0';
        continue
      }
      // 'milésimo primeiro'
      if (v >= 1000 && !any) {
        total = v;
        any = true;
        continue
      }
      // 'dois três', 'zero um', and 'vinte três' - but 'vinte e três', and 'vigésimo terceiro'
      if (v >= room || (v === 0 && any) || (!isOrd && !fresh && !afterE)) {
        break
      }
      room = getRoom(v, w, isOrd);
      group += v;
      fresh = false;
      afterE = false;
      any = true;
    }
    if (!any) {
      // an unknown word is its own number - and a loose 'e' is nothing
      return /^(e|v[íi]rgula|menos)$/.test(terms[start].normal) ? null : res
    }
    let num = total + section + group;
    if (int !== null) {
      num = Number(int + '.' + zeros + group);
    }
    num = (num / over) + extra;
    res.num = res.neg ? num * -1 : num;
    res.end = i;
    return res
  };

  // split these terms into each of their numbers
  const scan = function (terms) {
    const out = [];
    let i = 0;
    while (i < terms.length) {
      const res = readNumber(terms, i);
      if (res) {
        out.push(res);
      }
      i = res ? res.end : i + 1;
    }
    return out
  };

  // find each number - 'dois mil e três' is one, and 'dois três', 'dois, três' and 'quarenta e 3' are two
  const findNumbers = function (view) {
    const ptrs = [];
    view.match('#Value+').fullPointer.forEach(ptr => {
      const [n, start, end] = ptr;
      scan(view.document[n].slice(start, end)).forEach(res => {
        ptrs.push([n, start + res.start, start + res.end]);
      });
    });
    return view.update(ptrs)
  };

  // read digits with the shared european-numbers plugin - '1.234,56', '-5', '3,5%'
  const fromNumber = function (terms, m) {
    const { read } = m.methods.two.europeanNumbers;
    const locale = m.model.two.europeanNumbers;
    const pre = terms[0].pre;
    // thousands may be split-up by a space - '1 000'
    const res = read(terms.map(t => t.text).join(' '), pre, locale);
    if (res.num !== null || terms.length === 1) {
      return res
    }
    return read(terms[0].text, pre, locale)
  };

  const parseNumber = function (m) {
    const terms = m.docs[0];
    const found = scan(terms)[0] || { num: null };
    let res = { num: found.num, prefix: '', suffix: '', hasComma: false };
    // any digits come first - '2,5 milhões'
    if (found.digits) {
      res = fromNumber(terms.slice(found.digits[0], found.digits[1]), m);
      if (res.num !== null) {
        // '2,5 milhões' is 2.5 * 1,000,000 - without the noise of a float
        const num = res.num * found.mult;
        res.num = (Number.isInteger(num) ? num : Number(num.toPrecision(15))) * (found.neg ? -1 : 1);
      }
    }
    return {
      hasComma: res.hasComma,
      prefix: res.prefix,
      num: res.num,
      suffix: res.suffix,
      // how the digits were written
      decimal: res.decimal,
      group: res.group,
      // '.º', 'ª' or 'o'
      ordinal: res.ordinal || null,
      isText: m.has('#TextValue'),
      isOrdinal: m.has('#Ordinal'),
      isFraction: m.has('#Fraction'),
      isMoney: m.has('#Money'),
    }
  };

  // words for each part of a number
  const cardinals = {};
  const ordinals = {}
  ;[...data.ones, ...data.tens, ...data.hundreds].forEach(a => {
    cardinals[a[0]] = a[1];
    ordinals[a[0]] = a[2];
  });
  const bigs = data.multiples.filter(a => a[0] > 1000);

  // 'uma', 'duas', 'duzentas'
  const toFemale = str => str.replace(/^um$/, 'uma').replace(/^dois$/, 'duas').replace(/entos$/, 'entas');

  // 1-999 - 'cento e vinte e um'
  const toGroup = function (num, fem) {
    if (num === 100) {
      return ['cem']
    }
    const rest = num % 100;
    let parts = [num - rest];
    if (rest < 20) {
      parts.push(rest);
    } else {
      parts.push(rest - (rest % 10), rest % 10);
    }
    parts = parts.filter(n => n).map(n => (fem ? toFemale(cardinals[n]) : cardinals[n]));
    return parts.join(' e ').split(' ')
  };

  // an 'e' goes before the last group, when that is under a hundred, or is whole hundreds
  // - 'mil e cem' and 'dois mil e três', but 'mil cento e vinte'
  const join = function (groups) {
    let words = [];
    groups.forEach((a, i) => {
      const [count, arr] = a;
      if (i > 0 && i === groups.length - 1 && (count < 100 || count % 100 === 0)) {
        words.push('e');
      }
      words = words.concat(arr);
    });
    return words
  };

  // each group of a number, and how many of them there are - [[2, ['dois', 'milhões']], [500, ['quinhentos', 'mil']]]
  const toGroups = function (num, fem) {
    const out = [];
    let rest = num;
    bigs.forEach(a => {
      const [size, single, plural] = a;
      const count = Math.floor(rest / size);
      rest -= count * size;
      // 'um milhão', 'dois milhões' - a million is masculine
      if (count === 1) {
        out.push([count, ['um', single]]);
      } else if (count) {
        out.push([count, join(toGroups(count, false)).concat(plural)]);
      }
    });
    const mil = Math.floor(rest / 1000);
    // 'mil', and not 'um mil'
    if (mil) {
      out.push([mil, mil === 1 ? ['mil'] : toGroup(mil, fem).concat('mil')]);
    }
    if (rest % 1000) {
      out.push([rest % 1000, toGroup(rest % 1000, fem)]);
    }
    return out
  };

  // write a whole number as words - `opts.isFemale` is 'uma', 'duas' and 'duzentas'
  const toText = function (num, opts = {}) {
    if (!Number.isSafeInteger(num)) {
      return null
    }
    if (num === 0) {
      return ['zero']
    }
    const words = num < 0 ? ['menos'] : [];
    return words.concat(join(toGroups(Math.abs(num), opts.isFemale)))
  };

  // 'centésimo vigésimo primeiro' - up to 1999, and 'milionésimo'
  const toTextOrdinal = function (num, opts = {}) {
    let words = [];
    let rest = num;
    const big = data.multiples.find(a => a[0] === num);
    if (big) {
      words.push(big[3]);
    } else if (!Number.isInteger(num) || num < 1 || num >= 2000) {
      return null
    } else {
      if (rest > 1000) {
        words.push('milésimo');
        rest -= 1000;
      }
      const ones = rest % 10;
      const tens = (rest % 100) - ones;
      words = words.concat([rest - tens - ones, tens, ones].filter(n => n).map(n => ordinals[n]));
    }
    // every word agrees - 'décima primeira', 'vigésimos primeiros'
    if (opts.isFemale) {
      words = words.map(w => w.replace(/o$/, 'a'));
    }
    return opts.isPlural ? words.map(w => w + 's') : words
  };

  const { write } = europeanNumbers.methods.two.europeanNumbers;

  // returns null when a number can't be written this way
  const formatNumber = function (parsed, fmt) {
    const num = parsed.num;
    if (fmt === 'TextOrdinal' || fmt === 'TextCardinal') {
      const words = fmt === 'TextOrdinal' ? toTextOrdinal(num, parsed) : toText(num, parsed);
      return words ? words.join(' ') : null
    }
    // numeric formats
    if (fmt === 'Ordinal') {
      if (!Number.isInteger(num) || num < 1) {
        return null
      }
      // '1.º', '1ª' and '1o' keep their ending
      return String(num) + (parsed.ordinal || (parsed.isFemale ? 'ª' : 'º'))
    }
    // digits go back the way they were found - '1.234,5', '5,3€'
    return write(num, parsed)
  };

  // the words for a symbol that is written on a number - '50%', '5€', 'R$5'
  // [singular, plural, tag, isFemale]
  const symbols = {
    '%': ['por cento', 'por cento', 'Unit'],
    '€': ['euro', 'euros', 'Currency'],
    $: ['dólar', 'dólares', 'Currency'],
    us$: ['dólar', 'dólares', 'Currency'],
    r$: ['real', 'reais', 'Currency'],
    '£': ['libra', 'libras', 'Currency', true],
    '¥': ['iene', 'ienes', 'Currency'],
  };

  // 'euros' -> '€' - to find a unit that is already written out
  const fromWord = {};
  Object.keys(symbols).forEach(k => {
    const [single, plural] = symbols[k];
    fromWord[single] = fromWord[single] || k;
    fromWord[plural] = fromWord[plural] || k;
  });

  // a unit that can stand as its own word - 'km', 'kg', 'm²'
  const isWord = /^\p{L}+[²³]?$/u;

  // 'cinco euros', but 'um euro'
  const unitWords = function (key, num) {
    const [single, plural] = symbols[key];
    return Math.abs(num) === 1 ? single : plural
  };

  // floating-point noise - 0.1 + 0.2 - but a whole number is already exact
  const tidy = num => (Number.isInteger(num) ? num : Number(num.toPrecision(15)));

  const hasDash = /[-−–]$/;
  // 'uma', 'duas', 'duzentas'
  const femCardinal = /^(uma|duas)$|entas$/;
  // 'milhão', 'milhões', 'bilhão' ..
  const isBig = str => bigs$1.has(str);
  const isNoun = term => term.tags.has('Noun') && !term.tags.has('Pronoun');
  // 'as duas casas' - these are only ever feminine
  const femBefore = new Set(['as', 'umas', 'estas', 'essas', 'aquelas', 'minhas', 'tuas', 'suas', 'nossas']);

  // the word after these ones, if nothing is in the way
  const getNext = function (terms, end) {
    const next = terms[end];
    return next && next.text && !/\S/.test(terms[end - 1].post + next.pre) ? next : null
  };

  // parse a number, and remember how it was written - so that it can be written back the same way
  const parse = function (val) {
    const obj = parseNumber(val);
    const terms = val.docs[0];
    const isOrdinal = t => t.tags.has('Ordinal') && t.tags.has('TextValue');
    // the gender of 'primeira', '1ª', '1a' or 'duzentas'
    obj.isFemale = /[ªa]$/.test(obj.ordinal || '') || terms.some(t => {
      return t.tags.has('Ordinal') ? isOrdinal(t) && /as?$/.test(t.normal) : femCardinal.test(t.normal)
    });
    // 'primeiros', 'primeiras'
    obj.isPlural = terms.some(t => isOrdinal(t) && /s$/.test(t.normal));
    // the tokenizer keeps the sign of '-5%' apart from the term, as punctuation
    obj.hasDash = !obj.isText && obj.num < 0 && hasDash.test(terms[0].pre);
    return obj
  };

  // return the nth elem of a doc
  const getNth$3 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // turn a number, or a string like 'doze' or '12', into a number (or null)
  const toNum = function (view, n) {
    if (typeof n === 'number') {
      return Number.isFinite(n) ? n : null
    }
    if (typeof n !== 'string' || !n.trim()) {
      return null
    }
    const str = n.trim();
    // plain digits, like '12' or '-2.5'
    if (/^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)$/.test(str)) {
      return Number(str)
    }
    // a written-out number, like 'doze' or 'um milhão'
    const m = view.fromText(str).compute(['index', 'postTagger']).numbers();
    if (m.length !== 1 || m.text('normal') !== m.all().text('normal')) {
      return null
    }
    const num = parseNumber(m.eq(0)).num;
    return typeof num === 'number' && Number.isFinite(num) ? num : null
  };

  // tags that describe the form of a number - these are set again for each new number
  const formTags = new Set(['Value', 'TextValue', 'NumericValue', 'Cardinal', 'Ordinal', 'Fraction', 'Determiner']);

  // find the symbol or unit of a number, and the terms that it is written in.
  // - it may be attached - '50%', '€5', '5km' - or be the next word - '5 €', 'cinquenta por cento'
  // - or the word before - 'R$ 5'
  const findUnit = function (val, obj, end) {
    const [n, start] = val.fullPointer[0];
    const terms = val.document[n];
    const last = terms[end - 1];
    const next = getNext(terms, end);
    // a sign is not a symbol - '+5%', '10+'
    const lead = /^\+/.test(obj.prefix) ? '+' : '';
    const trail = /\+$/.test(obj.suffix) ? '+' : '';
    const prefix = obj.prefix.slice(lead.length).toLowerCase();
    const suffix = obj.suffix.slice(0, obj.suffix.length - trail.length).toLowerCase();
    if (!obj.isText && (prefix || suffix)) {
      // '5km' is a contraction of two terms - '5km' and an empty 'km'
      const silent = terms[end];
      const isSplit = Boolean(silent && silent.text === '' && silent.implicit && last.implicit);
      const unit = { attached: true, isSplit, lead, trail, view: isSplit ? val.update([[n, start, end + 1]]) : val };
      // the symbol, in its original case - '5 Kg'
      unit.prefix = lead + obj.prefix.slice(lead.length);
      unit.suffix = obj.suffix;
      if (prefix && suffix) {
        return unit
      }
      if (symbols.hasOwnProperty(prefix || suffix)) {
        unit.key = prefix || suffix;
      } else if (suffix && isWord.test(suffix)) {
        unit.word = unit.suffix.slice(0, suffix.length);
        unit.tag = isSplit ? Array.from(silent.tags) : [];
      }
      return unit
    }
    // 'R$ 5', '€ 5'
    const before = terms[start - 1];
    if (!obj.isText && before && symbols.hasOwnProperty(before.normal) && !/\S/.test(before.post + terms[start].pre)) {
      return { attached: false, key: before.normal, view: val.update([[n, start - 1, end]]) }
    }
    if (!next) {
      return null
    }
    const unit = { attached: false, view: val.update([[n, start, end + 1]]) };
    // '5 €'
    if (symbols.hasOwnProperty(next.normal)) {
      unit.key = next.normal;
      return unit
    }
    // 'cinco por cento'
    const after = terms[end + 1];
    if (next.normal === 'por' && next.tags.has('Unit') && after && after.tags.has('Unit')) {
      unit.key = '%';
      unit.isWord = true;
      unit.view = val.update([[n, start, end + 2]]);
      return unit
    }
    // 'cinco euros'
    if (fromWord.hasOwnProperty(next.normal)) {
      unit.key = fromWord[next.normal];
      unit.isWord = true;
      return unit
    }
    return null
  };

  // choose the new text for a number, and for its symbol or unit.
  // a symbol is never left stuck to a word - '50%' is 'cinquenta por cento', and not 'cinquenta%'
  // - returns null if this number can't be written like that
  const getPlan = function (val, obj, fmt, toSymbol) {
    const [n, start, stop] = val.fullPointer[0];
    const terms = val.document[n];
    // 'um milhão de euros' - this 'de' belongs to the number
    const de = getNext(terms, stop);
    const hasDe = Boolean(de) && de.normal === 'de' && isBig(terms[stop - 1].normal) && Boolean(getNext(terms, stop + 1));
    const end = hasDe ? stop + 1 : stop;
    const isCardinal = fmt === 'TextCardinal' || fmt === 'Cardinal';
    const unit = isCardinal ? findUnit(val, obj, end) : null;
    // the word that this number counts - 'uma menina', 'duzentas casas'
    const next = getNext(terms, end);
    const noun = next && isNoun(next) ? next : null;
    const how = Object.assign({}, obj, { prefix: '', suffix: '' });
    // the tagger knows the gender of some nouns - 'menina', 'professoras'
    const before = terms[start - 1];
    const hasFem = Boolean(before) && femBefore.has(before.machine || before.normal) && !/\S/.test(before.post + terms[start].pre);
    how.isFemale = obj.isFemale || Boolean(noun && (noun.tags.has('FemaleNoun') || hasFem));
    const plan = { view: val.update([[n, start, end]]), unitTerms: 0, unitTag: null, inPlace: false };
    // 'um milhão de casas'
    const withDe = str => (str && noun && isBig(str.split(' ').pop()) ? str + ' de' : str);
    if (!unit) {
      plan.str = formatNumber(fmt === 'Cardinal' ? obj : how, fmt);
      plan.numTerms = (plan.str || '').split(' ').length;
      // '+5' is '+cinco'
      if (fmt === 'TextCardinal' && plan.str) {
        plan.str = (/^\+/.test(obj.prefix) ? '+' : '') + withDe(plan.str);
      }
      return plan
    }
    if (fmt === 'Cardinal') {
      plan.str = formatNumber(obj, fmt);
      if (unit.attached) {
        // '5km' -> '6km' - keep both halves of the contraction
        plan.inPlace = unit.isSplit;
        plan.num = formatNumber(how, fmt);
        plan.str = (obj.num < 0 ? '-' : '') + unit.prefix + plan.num.replace(/^-/, '') + unit.suffix;
      } else if (toSymbol && unit.isWord && unit.key === '%') {
        // 'cinquenta por cento' -> '50 %'
        plan.view = unit.view;
        plan.str = plan.str + ' %';
        plan.unitTerms = 1;
        plan.unitTag = 'Unit';
      }
      plan.numTerms = 1;
      return plan
    }
    // written-out
    let words = null;
    if (unit.key) {
      words = unitWords(unit.key, obj.num);
      plan.unitTag = symbols[unit.key][2];
      // 'um euro' and 'uma libra'
      how.isFemale = Boolean(symbols[unit.key][3]);
    } else if (unit.word) {
      words = unit.word;
      plan.unitTag = unit.tag;
    }
    let num = formatNumber(how, fmt);
    // '#5' or '10+' have no words
    if (!words || !num) {
      return null
    }
    plan.numTerms = num.split(' ').length;
    // 'um milhão de euros'
    if (unit.key !== '%' && isBig(num.split(' ').pop())) {
      num += ' de';
    }
    plan.view = unit.view;
    plan.str = (unit.lead || '') + num + ' ' + words + (unit.trail || '');
    plan.unitTerms = words.split(' ').length;
    return plan
  };

  // swap-in the new form of this number, and tag it as the tagger would have.
  // - the terms made by .replaceWith() are tagged without their neighbours - so the 'um' of
  // 'um gato' is a Determiner, and '.numbers()' can't find it again.
  // returns the new number, without its unit
  const replace = function (val, obj, fmt, toSymbol) {
    const plan = getPlan(val, obj, fmt, toSymbol);
    if (!plan || !plan.str) {
      return val
    }
    const first = val.docs[0][0];
    // the sign is written by the number, now
    if (obj.hasDash) {
      first.pre = first.pre.replace(hasDash, '');
    }
    // re-write the first half of '5km', beside its silent 'km'
    if (plan.inPlace) {
      first.text = plan.str;
      first.normal = plan.str.toLowerCase();
      first.implicit = plan.num;
      first.machine = plan.num;
      return val
    }
    // remember any tags about the role of the number - #Money, #Percent, #Date
    const keep = Array.from(first.tags).filter(tag => !formTags.has(tag));
    let m = plan.view;
    m.replaceWith(plan.str);
    const [n, start, end] = m.fullPointer[0];
    // split the number from its unit
    if (plan.unitTerms > 0) {
      const unit = m.update([[n, end - plan.unitTerms, end]]);
      unit.unTag('Value');
      unit.tag(plan.unitTag);
    }
    m = m.update([[n, start, start + plan.numTerms]]);
    const isText = fmt === 'TextCardinal' || fmt === 'TextOrdinal';
    const isOrdinal = fmt === 'Ordinal' || fmt === 'TextOrdinal';
    m.unTag('Determiner');
    m.tag(isText ? 'TextValue' : 'NumericValue');
    m.tag(isOrdinal ? 'Ordinal' : 'Cardinal');
    if (keep.length > 0) {
      m.tag(keep);
    }
    return m
  };

  // run a change on each number, and keep this view pointing at the new terms
  // - .replaceWith() only repairs the one-match view that it is called on. Without this,
  // the view that the user holds keeps the ids of the deleted terms, and core 'repairs'
  // each of its matches by stretching it out to the end of the sentence.
  // returns the same view, so that every link of a chain stays in sync
  const mutate = function (view, fn) {
    const res = view.map(val => fn(val) || val);
    view.ptrs = res.fullPointer;
    view.uncache();
    return view
  };

  const api$3 = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth$3(this, n).map(parseNumber, [])
      }
      get(n) {
        return getNth$3(this, n).map(parseNumber, []).map(o => o.num)
      }
      json(n) {
        // a number selects the nth match, anything else is json options
        const opts = typeof n === 'number' ? undefined : n;
        const doc = getNth$3(this, n);
        return doc.map(p => {
          const json = p.toView().json(opts)[0];
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
        return this.growRight('#Unit+').match('#Unit+$')
      }
      /** return only ordinal numbers */
      isOrdinal() {
        return this.if('#Ordinal')
      }
      /** return only cardinal numbers*/
      isCardinal() {
        return this.if('#Cardinal')
      }

      /** convert to numeric form like '8' or '8º' */
      toNumber() {
        return mutate(this, val => {
          // leave 'três quartos' alone
          if (!val.has('#TextValue') || val.has('#Fraction')) {
            return val
          }
          const obj = parse(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          // 'cinquenta por cento' becomes '50 %'
          return replace(val, obj, fmt, true)
        })
      }
      /** convert to text form like 'oito' or 'oitavo' */
      toText() {
        return mutate(this, val => {
          if (val.has('#TextValue')) {
            return val
          }
          const obj = parse(val);
          // there are no words for '3,5' or '1/2'
          if (!Number.isInteger(obj.num)) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          return replace(val, obj, fmt)
        })
      }
      /** convert ordinal to cardinal form, like 'oito', or '8' */
      toCardinal() {
        return mutate(this, val => {
          if (!val.has('#Ordinal')) {
            return val
          }
          const obj = parse(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          return replace(val, obj, fmt)
        })
      }
      /** convert cardinal to ordinal form, like 'oitavo', or '8º' */
      toOrdinal() {
        return mutate(this, val => {
          if (val.has('#Ordinal')) {
            return val
          }
          const obj = parse(val);
          // there is no ordinal for '1,5', 'três quartos' or '-5'
          if (!Number.isInteger(obj.num) || obj.num < 1) {
            return val
          }
          // ... or for an amount - '50%', '5€', '5km', 'cinco euros'
          if (obj.prefix || obj.suffix || val.has('(#Percent|#Money)')) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          return replace(val, obj, fmt)
        })
      }

      /** return only numbers that are == n */
      isEqual(n) {
        return this.filter(val => parseNumber(val).num === n)
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter(val => parseNumber(val).num > n)
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter(val => parseNumber(val).num < n)
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter(val => {
          const num = parseNumber(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        n = toNum(this, n);
        if (n === null) {
          return this // not a number
        }
        return mutate(this, val => {
          const obj = parse(val);
          obj.num = n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (val.has('#TextValue')) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          return replace(val, obj, fmt)
        })
      }
      add(n) {
        n = toNum(this, n);
        if (!n) {
          return this // don't bother
        }
        return mutate(this, val => {
          const obj = parse(val);
          if (obj.num === null) {
            return val
          }
          // avoid float noise - 0.1 + 0.2
          obj.num = tidy(obj.num + n);
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          return replace(val, obj, fmt)
        })
      }
      /** decrease each number by n*/
      subtract(n) {
        n = toNum(this, n);
        if (!n) {
          return this // don't bother
        }
        return this.add(n * -1)
      }
      /** increase each number by 1 */
      increment() {
        return this.add(1)
      }
      /** decrease each number by 1 */
      decrement() {
        return this.add(-1)
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
    api: api$3,
    // 'duzentas', 'dezasseis', 'primeira', 'trilhões'
    words,
    model: {
      // '1o' and '1a' are ordinals, and not a number and its unit
      one: { numberSuffixes: { o: true, a: true } },
      two: {
        // the shared european-numbers plugin reads '1.234,56' - these are our ordinals: '2ª', '3.º', '1o'
        europeanNumbers: {
          ordinal: '\\.?[ºª°]|[oa]',
          // the words beside a number - '50 por cento', '5,30 euros'
          percent: ['por cento'],
          currencies: ['euro', 'euros', 'real', 'reais', 'dólar', 'dólares', 'dolar', 'dolares', 'libra', 'libras'],
        },
      },
    },
  };

  const getNth$2 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // words that agree with their noun - articles, their contractions ('do', 'na', 'pelo', 'num'), demonstratives and possessives
  const isDet = /^(([dn]|pel|pr)?[oa]|ao|à|[dn]?uma?|[dn]?(est|ess)[ea]|[dnà]?aquel[ea]|meu|minha|teu|tua|seu|sua|[nv]oss[oa]|(outr|tod)[oa]|(alg|nenh)uma?)$/;
  // the article hidden inside of a contraction - 'do' is 'de' + 'o'
  const inner = /^([oa]s?|uma?s?|uns)$/;

  // .. and the order that they come in, from the noun
  const order = [/^(meu|minha|teu|tua|seu|sua|[nv]oss[oa]|outr[oa])s?$/, /^[^t]/, /^t/];

  const plural = (str) => (str.endsWith('m') ? str.slice(0, -1) + 'ns' : str + 's');
  const singular = (str) => (str.endsWith('ns') ? str.slice(0, -2) + 'm' : str.slice(0, -1));
  // 'o' -> 'a', 'do' -> 'da', 'ao' -> 'à', 'um' -> 'uma', 'meu' -> 'minha', 'este' -> 'esta'
  const female = function (str) {
    if (str === 'ao') {
      return 'à'
    }
    if (/[mst]eu$/.test(str)) {
      return str === 'meu' ? 'minha' : str.slice(0, -2) + 'ua'
    }
    return str.endsWith('m') ? str + 'a' : str.replace(/[oe]$/, 'a')
  };
  const swaps = {
    toPlural: (str) => (isDet.test(str) ? plural(str) : null),
    toSingular: (str) => (/s$/.test(str) && isDet.test(singular(str)) ? singular(str) : null),
    toFeminine: function (str) {
      const isPlural = /s$/.test(str) && isDet.test(singular(str));
      const one = isPlural ? singular(str) : str;
      if (!isDet.test(one) || /(a|à|ua)$/.test(one)) {
        return null
      }
      return isPlural ? plural(female(one)) : female(one)
    }
  };

  // the word(s) before this noun follow it - 'o meu livro' -> 'os meus livros', 'do menino' -> 'da menina'
  const swapArticle = function (m, kind) {
    const [n, start] = m.fullPointer[0];
    const terms = m.document[n];
    let last = 0;
    for (let i = start - 1; i >= 0; i -= 1) {
      const term = terms[i];
      // the second half of a contraction has no text
      if (!term.text) {
        const str = swaps[kind](term.implicit || '');
        if (!inner.test(term.implicit) || !str) {
          return
        }
        term.implicit = str;
        continue
      }
      // 'voltei a casa' is a preposition
      const str = term.tags.has('Preposition') && !term.implicit ? null : swaps[kind](term.normal);
      // 'todos' + 'os' + 'meus' + 'livros'
      const rank = order.findIndex((reg) => reg.test(term.normal));
      if (!str || rank < last || /[,;:.!?-]/.test(term.post)) {
        return
      }
      last = rank + 1;
      const isTitle = /^\p{Lu}/u.test(term.text) && !/^\p{Lu}{2}/u.test(term.text);
      term.text = isTitle ? str[0].toUpperCase() + str.slice(1) : str;
      term.normal = str;
    }
  };

  const api$2 = function (View) {
    class Nouns extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Nouns';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.noun;
        const lexicon = this.model.one.lexicon;
        return getNth$2(this, n).map(m => {
          const str = m.text('normal');
          const one = m.has('#Plural') ? methods.fromPlural(str, lexicon) : str;
          const out = { singular: one, plural: m.has('#Plural') ? str : methods.toPlural(str) };
          // only people, and animals, have a feminine form
          const fem = methods.toFeminine(one);
          if (fem !== one || methods.isCommon(one) || m.has('#FemaleNoun')) {
            out.feminine = fem;
          }
          return out
        }, [])
      }
      toFeminine(n) {
        const methods = this.methods.two.transform.noun;
        const lexicon = this.model.one.lexicon;
        getNth$2(this, n).forEach(m => {
          const str = m.text('normal');
          const isPlural = m.has('#Plural');
          const one = isPlural ? methods.fromPlural(str, lexicon) : str;
          const fem = methods.toFeminine(one);
          if (fem === one && !methods.isCommon(one)) {
            return
          }
          // agree the determiner - 'o professor' → 'a professora'
          swapArticle(m, 'toFeminine');
          if (fem !== one) {
            m.replaceWith(isPlural ? methods.toPlural(fem) : fem);
            m.tag(isPlural ? 'Plural' : 'Singular', 'toFeminine');
          }
        });
        return this
      }
      isPlural(n) {
        return getNth$2(this, n).if('#Plural')
      }
      toPlural(n) {
        const methods = this.methods.two.transform.noun;
        getNth$2(this, n).ifNo('(#Plural|#Pronoun)').forEach(m => {
          const str = m.text('normal');
          swapArticle(m, 'toPlural');
          m.replaceWith(methods.toPlural(str));
          m.tag('Plural', 'toPlural');
        });
        return this
      }
      toSingular(n) {
        const methods = this.methods.two.transform.noun;
        const lexicon = this.model.one.lexicon;
        getNth$2(this, n).if('#Plural').ifNo('#Pronoun').forEach(m => {
          const str = methods.fromPlural(m.text('normal'), lexicon);
          // 'os óculos' has no singular
          if (str === m.text('normal') && !methods.isSingular(str)) {
            return
          }
          swapArticle(m, 'toSingular');
          m.replaceWith(str);
          m.tag('Singular', 'toSingular');
        });
        return this
      }
    }

    View.prototype.nouns = function (n) {
      let m = this.match('#Noun');
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

  // portuguese word-rules for .clauses() - the method itself comes from compromise/shared
  const clauses = {
    // a comma, but not a clause break
    notClause: [
      '@hasComma (e|ou) .', // grande, e forte
    ],
    // split a clause after these
    splitAfter: [
      '^#Pron (disse|diz)', // ele disse
    ],
    // split a clause before these
    splitBefore: [
      '(disse|diz) #Prop$',
      'e enquanto',
      'agora que',
      'desde que',
      'até que',
      'embora',
      'mesmo (se|que|quando)',
      'como se',
      'enquanto', // while, whereas
      '(cujo|cuja|cujos|cujas)', // whose
    ],
    // split a clause before the [captured] word
    splitBeforeGroup: [
      '#Verb .* [mas] .* #Verb', // é bom mas é ..
      'se .{2,9} [então] .', // se é isto então aquilo
    ],
  };

  var clauseRules = {
    model: { three: { clauses } },
  };

  nlp.plugin(tokenizer);
  nlp.plugin(tagset);
  nlp.plugin(lexicon);
  nlp.plugin(preTagger);
  // tags '1.234,56' and '5,30€' from their raw text
  nlp.plugin(europeanNumbers);
  nlp.plugin(postTagger);
  nlp.plugin(nouns);
  nlp.plugin(adjectives);
  nlp.plugin(verbs);
  nlp.plugin(numbers);

  // language-neutral plugins, shared with compromise
  nlp.plugin(lazy$1); // nlp.lazy() - only tags the sentences that may match
  nlp.plugin(misc$1); // .parentheses(), .quotations(), .acronyms(), .emails() ...
  nlp.plugin(clauses$1); // .clauses() - split on punctuation, and our rules below
  nlp.plugin(clauseRules);
  nlp.plugin(topics); // .people(), .places(), .organizations(), .topics()
  nlp.plugin(plugin); // .redact()


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
