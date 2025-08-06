(function(FauxOS){
  FauxOS.register('cd', (env) => async (args, line) => {
    const target = env.resolvePath(args[0] || '/');
    const node   = env.getNode(target);
    if (!node || env.isFile(node)) return line(`cd: ${args[0] || '/'}: no such dir`);
    env.setCwd(target);
  });
})(window.FauxOS);
