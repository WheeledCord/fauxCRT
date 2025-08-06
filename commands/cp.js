(function(FauxOS){
  FauxOS.register('cp', (env) => async (args, line) => {
    if (args.length < 2) return line('cp: need src dest');
    const src = env.resolvePath(args[0]);
    const dst = env.resolvePath(args[1]);
    const srcNode = env.getNode(src);
    if (!env.isFile(srcNode)) return line(`cp: ${args[0]}: not a regular file`);
    let destParent, destName;
    const dstNode = env.getNode(dst);
    if (dstNode && env.isDir(dstNode)) {
      destParent = dstNode;
      destName   = src.at(-1);
    } else {
      destParent = env.getNode(dst.slice(0, -1), true);
      destName   = dst.at(-1);
    }
    if (destParent.__file) return line('cp: destination inside file');
    destParent[destName] = { __file: true, content: srcNode.content };
    env.flush();
  });
})(window.FauxOS);
