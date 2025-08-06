(function(FauxOS){
  FauxOS.register('del', (env) => async (args, line) => {
    if (!args.length) return line('del: missing operand');
    for (const e of args) {
      const p = env.resolvePath(e);
      const name = p.at(-1);
      const par  = env.getNode(p.slice(0, -1));
      if (!par || !(name in par)) { await line(`del: cannot remove '${e}'`); continue; }
      delete par[name];
    }
    env.flush();
  });
})(window.FauxOS);
