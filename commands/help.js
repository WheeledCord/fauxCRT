(function(FauxOS){
  FauxOS.register('help', () => async (_, line) => {
    const defs = [
      {name:'append',  desc:'Append lines to a file interactively (end with a blank line).',                 usage:'append <file>'},
      {name:'cd',      desc:'Change directory. Supports relative, absolute, . and ..',                       usage:'cd <dir> | cd / | cd ..'},
      {name:'clear',   desc:'Clear the screen.',                                                               usage:'clear'},
      {name:'cp',      desc:'Copy a file to a path or into a directory.',                                      usage:'cp <src> <dest>'},
      {name:'create',  desc:'Create an empty file (alias: touch).',                                            usage:'create <file>'},
      {name:'del',     desc:'Delete a file or directory.',                                                     usage:'del <path>'},
      {name:'echo',    desc:'Print text.',                                                                     usage:'echo <text>'},
      {name:'help',    desc:'Show this help.',                                                                 usage:'help'},
      {name:'ls',      desc:'List the contents of a directory (current dir by default).',                      usage:'ls [dir]'},
      {name:'mkdir',   desc:'Create a directory path (parents created as needed).',                            usage:'mkdir <dir>'},
      {name:'mv',      desc:'Move or rename a file or directory.',                                             usage:'mv <src> <dest>'},
      {name:'pwd',     desc:'Print the current working directory.',                                            usage:'pwd'},
      {name:'read',    desc:'Output the contents of a file.',                                                  usage:'read <file>'},
      {name:'rebuild', desc:'Reload commands from /commands (after editing).',                                 usage:'rebuild'},
      {name:'resetfs', desc:'Wipe the filesystem and restore built-ins (asks for confirmation, restarts).',    usage:'resetfs'},
      {name:'whoami',  desc:'Print the current user.',                                                         usage:'whoami'},
      {name:'write',   desc:'Overwrite a file interactively (end with a blank line).',                         usage:'write <file>'},
    ];

    const maxName = defs.reduce((m, d) => Math.max(m, d.name.length), 0);

    await line('Built-in Commands:\n', 0);
    for (const d of defs) {
      await line('  ' + d.name.padEnd(maxName, ' ') + '  ' + d.desc);
      await line('     Usage: ' + d.usage + '\n');
    }
    await line('Tip: Edit files in /commands/*.js and run "rebuild" to apply changes.');
  });
})(window.FauxOS);
