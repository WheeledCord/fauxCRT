(function(FauxOS){
  FauxOS.register('write', (env) => async (args, line, ctx) => {
    if (!args.length) return line('write: missing file');
    const target = env.resolvePath(args[0]);
    const parent = env.getNode(target.slice(0, -1), true);
    if (parent.__file) return line('write: cannot write inside file');
    const name = target.at(-1);
    if (parent[name] && !env.isFile(parent[name])) return line(`write: ${args[0]} is a directory`);
    await line(`Writing to ${args[0]}. End with blank line to finish`);
    ctx.write = {
      buffer: [],
      finish(lines){
        parent[name] = { __file: true, content: lines.join('\n') };
        env.flush();
      }
    };
  });
})(window.FauxOS);
