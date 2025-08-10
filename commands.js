// commands.js
(function (global) {
  const FS_COOKIE = 'fauxfs';
  const cookieTTL = 365 * 24 * 60 * 60 * 1000;

  function loadFS() {
    const kv = document.cookie.split('; ').find(s => s.startsWith(FS_COOKIE + '='));
    if (!kv) return { '/': {} };
    try { return JSON.parse(decodeURIComponent(kv.split('=').slice(1).join('='))); }
    catch { return { '/': {} }; }
  }
  function saveFS(tree) {
    const exp = new Date(Date.now() + cookieTTL).toUTCString();
    document.cookie = `${FS_COOKIE}=${encodeURIComponent(JSON.stringify(tree))}; expires=${exp}; path=/`;
  }

  let FS  = loadFS();
  let cwd = ['/', 'home', 'root'];

  function ensureBaseFS() {
    const root = (FS['/'] ||= {});
    root.commands   ||= {};
    root.home       ||= {};
    root.home.root  ||= {};
    root.__meta     ||= {};
    if (typeof root.__meta !== 'object' || root.__meta.__file) root.__meta = {};
  }
  ensureBaseFS();

  function getMeta() {
    ensureBaseFS();
    return FS['/'].__meta;
  }
  function setMeta(m) {
    FS['/'].__meta = m || {};
    saveFS(FS);
  }

  function resolvePath(raw) {
    if (!raw) return [...cwd].slice(1);
    const parts = raw.split('/').filter(Boolean);
    const stack = raw.startsWith('/') ? [] : [...cwd].slice(1);
    for (const p of parts) {
      if (p === '.' || p === '') continue;
      if (p === '..') { if (stack.length) stack.pop(); }
      else stack.push(p);
    }
    return stack;
  }
  function getNode(pathArr, createDirs = false) {
    let node = FS['/'];
    for (let i = 0; i < pathArr.length; i++) {
      const part = pathArr[i];
      if (!(part in node)) {
        if (createDirs) node[part] = {};
        else return null;
      }
      node = node[part];
      if (node && node.__file && i < pathArr.length - 1) return null;
    }
    return node;
  }
  const isDir  = n => n && !n.__file;
  const isFile = n => n &&  n.__file;

  const registry = new Map();

  function register(name, factory) {
    registry.set(name, factory);
  }
  function listCommands() {
    return Array.from(registry.keys()).sort();
  }

  const env = {
    resolvePath,
    getNode,
    isDir,
    isFile,
    flush: () => saveFS(FS),
    getCwd: () => [...cwd].slice(1),
    setCwd: (next) => { cwd = ['/', ...next]; },
    getFS:  () => FS,
    setFS:  (tree) => { FS = tree; ensureBaseFS(); saveFS(FS); },
    listCommands,
  };

  const rel = (p) => new URL(p, location.href).toString();
  async function fetchText(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return await r.text();
  }
  async function loadManifest() {
    try {
      const txt = await fetchText(rel('commands/manifest.json'));
      const list = JSON.parse(txt);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function listFSCommands() {
    const cmdDir = (FS['/'].commands && isDir(FS['/'].commands)) ? FS['/'].commands : null;
    if (!cmdDir) return [];
    return Object.entries(cmdDir)
      .filter(([k, v]) => /\.js$/.test(k) && isFile(v))
      .map(([k]) => k.replace(/\.js$/, ''))
      .sort();
  }

  async function evalSource(name, src) {
    try {
      const fn = new Function('FauxOS', src + `\n//# sourceURL=fauxfs:/commands/${name}.js`);
      fn(global.FauxOS);
    } catch (e) {
      console.error(`Command '${name}' failed to load:`, e);
    }
  }

  async function exposeBaseOnce() {
    const meta = getMeta();
    if (meta.baseExposed) return;
    const names = await loadManifest();
    const root = FS['/'];
    root.commands ||= {};
    for (const n of names) {
      if (root.commands[`${n}.js`]?.__file) continue;
      try {
        const src = await fetchText(rel(`commands/${n}.js`));
        root.commands[`${n}.js`] = { __file: true, content: src };
      } catch (e) {
        console.warn(`exposeBaseOnce: skip ${n}.js`, e);
      }
    }
    meta.baseExposed = true;
    setMeta(meta);
    saveFS(FS);
  }

  async function loadAllFromFS() {
    registry.clear();
    ensureBaseFS();
    const root = FS['/'];
    const cmdDir = root.commands || {};
    const names = listFSCommands();
    for (const n of names) {
      const node = cmdDir[`${n}.js`];
      if (isFile(node)) await evalSource(n, node.content);
    }
    if (registry.size === 0) {
      console.warn('[fauxOS] No commands loaded. If you reset the FS, run `rebuild` to re-seed from static.');
    }
  }

  async function initialBoot() {
    ensureBaseFS();
    await exposeBaseOnce();
    await loadAllFromFS();
  }

  async function rebuild() {
    ensureBaseFS();
    const meta = getMeta();
    if (!meta.baseExposed) {
      await exposeBaseOnce();
    }
    await loadAllFromFS();
  }

  const readyPromise = initialBoot();

  global.FauxOS = {
    register,
    env,
    ready: readyPromise,
    rebuild,
    exposeBase: exposeBaseOnce,
    listCommands,
  };

  global.FauxOSCommands = function (lineFn, ctx) {
    const wrapper = {};
    for (const [name, factory] of registry.entries()) {
      const impl = factory(env);
      wrapper[name] = (args) => impl(args, lineFn, ctx);
    }
    return wrapper;
  };

})(window);
