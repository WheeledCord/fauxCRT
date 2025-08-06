(function(FauxOS){
  FauxOS.register('ls', (env) => async (args, line) => {
    const target = args.length ? env.resolvePath(args[0]) : env.getCwd();
    const node   = env.getNode(target);
    if (!node) return line(`ls: cannot access '${args[0] || '.'}'`);
    if (env.isFile(node)) return line(args[0] || '');
    await line(Object.keys(node).sort().join(' '));
  });
})(window.FauxOS);
