(function (global) {

    const FS_COOKIE = 'fauxfs';
    const cookieTTL = 365 * 24 * 60 * 60 * 1000;   // 1y

    function loadFS() {
        const kv = document.cookie.split('; ')
        .find(s => s.startsWith(FS_COOKIE + '='));
        if (!kv) return { '/': {} };
        try { return JSON.parse(decodeURIComponent(kv.split('=').slice(1).join('='))); }
        catch { return { '/': {} }; }
    }
    function saveFS(tree) {
        const exp = new Date(Date.now() + cookieTTL).toUTCString();
        document.cookie = `${FS_COOKIE}=${encodeURIComponent(JSON.stringify(tree))}; expires=${exp}; path=/`;
    }

    let FS  = loadFS();   //in mem tree
    let cwd = ['/'];      //current working dir


    function resolvePath(raw) {
        if (!raw) return [...cwd];
        const parts = raw.split('/').filter(Boolean);
        const stack = raw.startsWith('/') ? [] : [...cwd];
        for (const p of parts) {
        if (p === '.' || p === '') continue;
        if (p === '..') { if (stack.length) stack.pop(); }
        else stack.push(p);
        }
        return stack;
    }
    function getNode(pathArr, createDirs = false) {
        let node = FS['/'];
        for (let i = 0; i < pathArr.length; i++) {
        const part = pathArr[i];
        if (!(part in node)) {
            if (createDirs) node[part] = {};
            else return null;
        }
        node = node[part];
        if (node && node.__file && i < pathArr.length - 1) return null;
        }
        return node;
    }
    const isDir  = n => n && !n.__file;
    const isFile = n => n &&  n.__file;

    //commandees
    const cmds = {};

    cmds.clear = async (_, line) => {
        document.getElementById('terminal').innerHTML = '';
    };

    cmds.whoami = async (_, line) => { await line('root'); };

    cmds.resetfs = async (_, line) => {
        FS = { '/': {} };
        saveFS(FS);
        await line('Filesystem wiped.');
    };

    cmds.mkdir = async (a, line) => {
        if (!a.length) return line('mkdir: missing operand');
        for (const dir of a) {
        const path = resolvePath(dir);
        const parent = getNode(path.slice(0, -1), true);
        if (!parent || parent.__file) { await line(`mkdir: cannot create '${dir}'`); continue; }
        const name = path.at(-1);
        if (parent[name]) { await line(`mkdir: '${dir}': exists`); continue; }
        parent[name] = {};
        }
        saveFS(FS);
    };

    cmds.ls = async (a, line) => {
        const target = a.length ? resolvePath(a[0]) : [...cwd];
        const node   = getNode(target);
        if (!node) return line(`ls: cannot access '${a[0] || '.'}'`);
        if (isFile(node)) return line(a[0]);
        await line(Object.keys(node).sort().join(' '));
    };

    cmds.cd = async (a, line) => {
        const target = resolvePath(a[0] || '/');
        const node   = getNode(target);
        if (!node || isFile(node)) return line(`cd: ${a[0] || '/'}: no such dir`);
        cwd = target;
    };

    cmds.read = async (a, line) => {
        if (!a.length) return line('read: missing file');
        const n = getNode(resolvePath(a[0]));
        if (!isFile(n)) return line(`read: ${a[0]}: no such file`);
        await line(n.content);
    };

    function writeLike(mode) {
        return async (args, line, ctx) => {
        if (!args.length) return line(`${mode}: missing file`);
        const target = resolvePath(args[0]);
        const parent = getNode(target.slice(0, -1), true);
        if (parent.__file) return line(`${mode}: cannot write inside file`);
        const name = target.at(-1);
        if (parent[name] && isDir(parent[name]))
            return line(`${mode}: ${args[0]} is a directory`);
        const existing = parent[name]?.content || '';
        await line(`${mode === 'append' ? 'Appending to' : 'Writing to'} ${args[0]}. End with blank line to finish`);
        ctx.write = {
            buffer: [],
            finish(lines) {
            const newTxt = mode === 'append'
                ? existing + (existing ? '\n' : '') + lines.join('\n')
                : lines.join('\n');
            parent[name] = { __file: true, content: newTxt };
            saveFS(FS);
            }
        };
        };
    }
        cmds.write  = writeLike('write');
    cmds.append = writeLike('append');

    cmds.del = async (a, line) => {
        if (!a.length) return line('del: missing operand');
        for (const e of a) {
        const p = resolvePath(e);
        const name = p.at(-1);
        const par  = getNode(p.slice(0, -1));
        if (!par || !(name in par)) { await line(`del: cannot remove '${e}'`); continue; }
        delete par[name];
        }
        saveFS(FS);
    };

    cmds.create = cmds.touch = async (a, line) => {
        if (!a.length) return line('create: missing file');
        for (const f of a) {
        const p = resolvePath(f);
        const par = getNode(p.slice(0, -1), true);
        const name = p.at(-1);
        if (par.__file) { await line(`create: cannot create in file`); continue; }
        if (!par[name]) par[name] = { __file: true, content: '' };
        }
        saveFS(FS);
    };

    cmds.cp = async (a, line) => {
        if (a.length < 2) return line('cp: need src dest');
        const src = resolvePath(a[0]);
        const dst = resolvePath(a[1]);
        const srcNode = getNode(src);
        if (!isFile(srcNode)) return line(`cp: ${a[0]}: not a regular file`);
        let destParent, destName;
        const dstNode = getNode(dst);
        if (dstNode && isDir(dstNode)) {
        destParent = dstNode;
        destName   = src.at(-1);
        } else {
        destParent = getNode(dst.slice(0, -1), true);
        destName   = dst.at(-1);
        }
        if (destParent.__file) return line('cp: destination inside file');
        destParent[destName] = { __file: true, content: srcNode.content };
        saveFS(FS);
    };

    cmds.mv = async (a, line) => {
        if (a.length < 2) return line('mv: need src dest');
        const src = resolvePath(a[0]);
        const dst = resolvePath(a[1]);
        const srcPar = getNode(src.slice(0, -1));
        const srcName = src.at(-1);
        if (!srcPar || !(srcName in srcPar)) return line(`mv: ${a[0]}: no such file or directory`);
        const obj = srcPar[srcName];
        let destParent, destName;
        const dstNode = getNode(dst);
        if (dstNode && isDir(dstNode)) {
        destParent = dstNode;
        destName   = srcName;
        } else {
        destParent = getNode(dst.slice(0, -1), true);
        destName   = dst.at(-1);
        }
        if (destParent.__file) return line('mv: destination inside file');
        destParent[destName] = obj;
        delete srcPar[srcName];
        saveFS(FS);
  };

    cmds.echo = async (a, line) => { await line(a.join(' ')); };

    cmds.help = async (_, line) => {
    const helptext = [
        'Built-in Commands:',
        '',
        '  clear: Clear the screen.',
        '  whoami: Display current user (just returns root. I am NOT adding users or groups).',
        '  resetfs: Reset and wipe the file system.',
        '',
        '  mkdir <dir>: Create a new directory.',
        '  ls [dir]: List contents of a directory.',
        '  cd <dir>: Change working directory.',
        '  pwd: Show current path.',
        '',
        '  read <file>: Output contents of a file.',
        '  write <file>: Overwrite a file interactively.',
        '  append <file>: Add lines to the end of a file.',
        '  create <file>: Create empty file (alias: touch).',
        '  del <file|dir>: Delete a file or directory.',
        '',
        '  cp <src> <dest>: Copy a file.',
        '  mv <src> <dest>: Move or rename a file or directory.',
        '',
        '  echo <text>: Print text.',
        '  help: Hmmmmmm.. Guess.'
    ];
    for (const l of helptext) await line(l);
    };

    global.FauxOSCommands = function (lineFn, ctx) {
        const wrapper = {};
        for (const [k, fn] of Object.entries(cmds)) {
        wrapper[k] = (args) => fn(args, lineFn, ctx);
        }
        return wrapper;
    };

})(window);
