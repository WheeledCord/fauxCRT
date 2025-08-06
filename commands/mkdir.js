(function(FauxOS){
  FauxOS.register('mkdir', (env) => async (args, line) => {
    if (!args.length) return line('mkdir: missing operand');
    for (const dir of args) {
      const path = env.resolvePath(dir);
      const parent = env.getNode(path.slice(0, -1), true);
      if (!parent || parent.__file) { await line(`mkdir: cannot create '${dir}'`); continue; }
      const name = path.at(-1);
      if (parent[name]) { await line(`mkdir: '${dir}': exists`); continue; }
      parent[name] = {};
    }
    env.flush();
  });
})(window.FauxOS);
