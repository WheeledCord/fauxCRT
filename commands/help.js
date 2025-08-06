(function(FauxOS){
  FauxOS.register('help', (env) => async (_, line) => {
    const names = env.listCommands ? env.listCommands() : [];
    await line('Built-in Commands:\n');
    for (const n of names) await line('  ' + n);
    await line('\nType a command with args, e.g. "mkdir projects" or "cat readme.txt"');
  });
})(window.FauxOS);
