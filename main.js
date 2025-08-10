

const term = document.getElementById('terminal');
const wait = ms => new Promise(r => setTimeout(r, ms));



async function line(txt = '', delay = 25) {
  await wait(delay);
  const p = document.createElement('p');
  p.className = 'line';
  p.textContent = txt;
  if (window._fauxPromptEl && window._fauxPromptEl.parentNode === term) {
    term.insertBefore(p, window._fauxPromptEl);
  } else {
    term.appendChild(p);
  }
  term.scrollTop = term.scrollHeight;
}

function newPrompt(prefix = 'root@fauxos~# ', input = '') {
  const p = document.createElement('p');
  p.className = 'line';
  p.innerHTML =
    `<span class="prompt-prefix">${prefix}</span>` +
    `<span class="prompt-input">${input}</span>` +
    `<span class="cursor"></span>`;
  term.appendChild(p);
  term.scrollTop = term.scrollHeight;
  window._fauxPromptEl = p;
  return p;
}

function setPrompt(prefix, input = '') {
  if (!window._fauxPromptEl) newPrompt(prefix, input);
  window._fauxPromptEl.querySelector('.prompt-prefix').textContent = prefix;
  window._fauxPromptEl.querySelector('.prompt-input').textContent  = input;
  term.scrollTop = term.scrollHeight;
}

function freezePrompt() {
  term.querySelectorAll('.cursor').forEach(c => c.remove());
  window._fauxPromptEl = null;
}


async function boot() {
  await line('Welcome to fauxOS!');
  await line("Type 'help' to get started");
  await window.FauxOS.ready;
  shell();
}



function shell() {
  let history = [], histPtr = 0, input = '';

  const ctx = {
    write: null,   
    modal: null,   
    readLine: null
  };

  ctx.readLine = async msg => {
    if (msg) await line(msg);
    ctx.modal = { resolve: null };
    input = ''; refresh();
    return new Promise(r => (ctx.modal.resolve = r));
  };

  const commands = () => window.FauxOSCommands(line, ctx);
  const promptOf = () => (ctx.modal || ctx.write) ? '> ' : 'root@fauxos~# ';
  const refresh  = () => setPrompt(promptOf(), input);

  newPrompt(); refresh();

 
  const executeShellLine = async () => {
    setPrompt(promptOf(), input); freezePrompt();
    history.push(input); histPtr = history.length;
    const [cmd, ...args] = input.trim().split(/\s+/);
    input = '';
    const fn = commands()[cmd];
    fn ? await fn(args) : await line(`${cmd}: command not found`);
    newPrompt(); refresh();
  };

 
  document.addEventListener('paste', async e => {
    const text = e.clipboardData?.getData('text');
    if (!text) return;
    e.preventDefault();

    const lines = text.replace(/\r/g, '').split('\n');

   
    if (ctx.write) {
      input += lines.shift();
      for (const ln of lines) {
        setPrompt(promptOf(), input); freezePrompt();
        ctx.write.buffer.push(input);
        input = ln;
        newPrompt(); refresh();
      }
      refresh();
      return;
    }

   
    if (ctx.modal) {
      input += lines[0];
      refresh();
      return;
    }

   
    for (const [idx, ln] of lines.entries()) {
      if (idx === 0) {                
        input += ln;
      } else {
        await executeShellLine();     
        input = ln;                   
      }
    }
    refresh();
  });

 
  document.addEventListener('keydown', async e => {

    refresh();
   
    if (ctx.modal) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); input += e.key; refresh();
      } else if (e.key === 'Backspace') {
        e.preventDefault(); input = input.slice(0, -1); refresh();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setPrompt(promptOf(), input); freezePrompt();
        const out = input; input = '';
        const res = ctx.modal.resolve; ctx.modal = null;
        newPrompt(); refresh(); res(out);
      }
      return;
    }

   
    if (ctx.write) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); input += e.key; refresh();
      } else if (e.key === 'Backspace') {
        e.preventDefault(); input = input.slice(0, -1); refresh();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setPrompt(promptOf(), input); freezePrompt();
        ctx.write.buffer.push(input);
        if (input === '') {
          ctx.write.finish(ctx.write.buffer); ctx.write = null;
          await line('(file written)');
        }
        input = ''; newPrompt(); refresh();
      }
      return;
    }

   
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault(); input += e.key; refresh();
    } else if (e.key === 'Backspace') {
      e.preventDefault(); input = input.slice(0, -1); refresh();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      await executeShellLine();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); if (histPtr > 0) histPtr--; input = history[histPtr] || ''; refresh();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histPtr < history.length - 1) histPtr++; else { histPtr = history.length; input = ''; }
      input = history[histPtr] || ''; refresh();
    }
  });
}

boot();
