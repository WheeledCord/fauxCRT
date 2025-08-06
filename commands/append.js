(function(FauxOS){
  FauxOS.register('append', (env) => async (args, line, ctx) => {
    if (!args.length) return line('append: missing file');
    const target = env.resolvePath(args[0]);
    const parent = env.getNode(target.slice(0, -1), true);
    if (parent.__file) return line('append: cannot write inside file');
    const name = target.at(-1);
    const existing = parent[name]?.content || '';
    if (parent[name] && !env.isFile(parent[name])) return line(`append: ${args[0]} is a directory`);
    await line(`Appending to ${args[0]}. End with blank line to finish`);
    ctx.write = {
      buffer: [],
      finish(lines){
        const newTxt = existing + (existing ? '\n' : '') + lines.join('\n');
        parent[name] = { __file: true, content: newTxt };
        env.flush();
      }
    };
  });
})(window.FauxOS);
