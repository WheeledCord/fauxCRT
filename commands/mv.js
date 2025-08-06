(function(FauxOS){
  FauxOS.register('mv', (env) => async (args, line) => {
    if (args.length < 2) return line('mv: need src dest');
    const src = env.resolvePath(args[0]);
    const dst = env.resolvePath(args[1]);
    const srcPar = env.getNode(src.slice(0, -1));
    const srcName = src.at(-1);
    if (!srcPar || !(srcName in srcPar)) return line(`mv: ${args[0]}: no such file or directory`);
    const obj = srcPar[srcName];
    let destParent, destName;
    const dstNode = env.getNode(dst);
    if (dstNode && env.isDir(dstNode)) {
      destParent = dstNode;
      destName   = srcName;
    } else {
      destParent = env.getNode(dst.slice(0, -1), true);
      destName   = dst.at(-1);
    }
    if (destParent.__file) return line('mv: destination inside file');
    destParent[destName] = obj;
    delete srcPar[srcName];
    env.flush();
  });
})(window.FauxOS);
