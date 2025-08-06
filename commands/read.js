(function(FauxOS){
  function impl(env){
    return async (args, line) => {
      if (!args.length) return line('read: missing file');
      const n = env.getNode(env.resolvePath(args[0]));
      if (!env.isFile(n)) return line(`read: ${args[0]}: no such file`);
      await line(n.content);
    };
  }
  FauxOS.register('read', impl);
  FauxOS.register('cat',  impl);
})(window.FauxOS);
