(function(FauxOS){
  function impl(env){
    return async (args, line) => {
      if (!args.length) return line('create: missing file');
      for (const f of args) {
        const p = env.resolvePath(f);
        const par = env.getNode(p.slice(0, -1), true);
        const name = p.at(-1);
        if (par.__file) { await line('create: cannot create in file'); continue; }
        if (!par[name]) par[name] = { __file: true, content: '' };
      }
      env.flush();
    };
  }
  FauxOS.register('create', impl);
  FauxOS.register('touch',  impl);
})(window.FauxOS);
