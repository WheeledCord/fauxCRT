const term  = document.getElementById('terminal');
const wait  = ms => new Promise(r => setTimeout(r, ms));

// Anchor for active prompt so we can insert output above it.
window._fauxPromptEl = null;

async function line(txt = '', delay = 25) {
  await wait(delay);
  const p       = document.createElement('p');
  p.className   = 'line';
  p.textContent = txt;

  // Insert above the active prompt so prompt always stays last.
  if (window._fauxPromptEl && window._fauxPromptEl.parentNode === term) {
    term.insertBefore(p, window._fauxPromptEl);
  } else {
    term.appendChild(p);
  }
  term.scrollTop = term.scrollHeight;
}

function newPrompt() {
  const p = document.createElement('p');
  p.className = 'line';
  p.innerHTML = '<span class="prompt-prefix"></span><span class="prompt-input"></span><span class="cursor"></span>';
  term.appendChild(p);
  term.scrollTop = term.scrollHeight;
  window._fauxPromptEl = p;
  return p;
}

function setPrompt(prefix, input = '') {
  if (!window._fauxPromptEl) newPrompt();
  const pfx = window._fauxPromptEl.querySelector('.prompt-prefix');
  const inp = window._fauxPromptEl.querySelector('.prompt-input');
  pfx.textContent = prefix;
  inp.textContent = input;
  term.scrollTop = term.scrollHeight;
}

// boot sequence
async function boot() {
  const box = [
    '########################################',
    '#                                      #',
    '#           fauxCRT  v1.3              #',
    '#         CPU : Virtual 8086           #',
    '#           RAM : 4096 KB              #',
    '#                                      #',
    '########################################'
  ];
  for (const l of box) await line(l);
  await line(' ');
  await wait(1000);

  await line(); await line('Searching floppy disk...'); await wait(2700);
  await line(' ');
  await line(); await line('Searching hard disk...');   await wait(743);

  const barLine = document.createElement('p');
  barLine.className = 'line';
  term.appendChild(barLine);
  for (let i = 0; i <= 300; i++) {
    barLine.textContent = '#'.repeat(i);
    await wait(20);
  }

  await wait(200);
  await line(); await line('Loading fauxOS...'); await wait(500);

  term.innerHTML = '';
  await line('fauxOS Bootloader v1.3');
  await line('Copyright (C) 1987 fauxComputing Inc.');
  await line(' ');
  await wait(200);
  await line('System BIOS Check... OK');
  await line('CMOS battery... OK');
  await line('Checking base memory: 640 KB OK');
  await line('Checking extended memory: 3584 KB OK');
  await line(' ');
  await line('Initializing CPU...');
  await line('  Vendor: crudCPU INC');
  await line('  Model: 8086-compatible');
  await line('  Clock Speed: 16.000 MHz');
  await line('  Math Co-Processor: NONE');
  await line('  Cooling Fan... OPERATIONAL (loud)');
  await line('  Smoke Output... DANGEROUSLY HIGH');
  await line('  Internal Temperature... warm-ish');
  await line(' ');
  await line('Oil Level... LOW (please refill)');
  await line('Hydraulic Pressure... HIGH');
  await line('Mouse Trap Status... ARMED');
  await line(' ');
  await line('Detecting storage devices...');
  await line('  Floppy Drive 0: 1.44MB"');
  await line('  Hard Disk 0: 20MB ST-506 Interface');
  await line('  Urainium rods: Not Present');
  await line(' ');
  await line('Performing floppy seek test...');
  await line('  Seek... OK');
  await line('  Motor spin-up... OK');
  await line('  Death Level... MINIMAL');
  await line(' ');
  await line('Boot device selected: Hard Disk 0');
  await line('Loading boot sector...'); await wait(1000);
  await line('Executing MBR...');        await wait(800);
  await line(' ');
  await line('Hacking mainframe...');
  await wait(69);
  await line("I'm in!");
  await line(' ');
  await line('fauxOS Kernel v0.3 Loading');
  await line('Initializing interrupt vectors...');
  await line('Installing device drivers...');
  await line('  COM1: 9600 baud');
  await line('  COM2: Not Detected');
  await line('  LPT1: Online');
  await line('  Keyboard: 101-key, AT-compatible');
  await line('  Mouse: Missing (probably stolen)');
  await line('  Beer Dispenser: Driver not found');
  await line(' ');
  await line('Mounting filesystem /dev/hda1...');
  await line('File system type: fauxFS');
  await line('Mount successful (scratched sector skipped)');
  await line(' ');
  await line('Setting system clock...');
  await line('  CMOS Time: 12:00:00 01-JAN-1987');
  await line('  Accuracy: +/- several minutes');
  await line(' ');
  await line('System initialization complete.'); await wait(500);

  term.innerHTML = '';
  await line('Welcome to fauxOS!');
  await line("Type 'help' to get started");

  // ensure commands are loaded before starting the shell
  await window.FauxOS.ready;

  shell();
}

function shell() {
  let history  = [];
  let histPtr  = 0;
  let input    = '';

  const ctx = {
    write: null,          // { buffer: [], finish(lines) {} }
    modal: null,          // { buffer: '', resolve }
    readLine: null        // function(message?) => Promise<string>
  };

  // Always pull a fresh map so `rebuild`/edits take effect immediately
  const getCommands = () => window.FauxOSCommands(line, ctx);

  function currentPrefix() {
    // Modal confirmations and write/append use "> "
    if (ctx.modal || ctx.write) return '> ';
    // Regular shell prompt:
    return 'root@fauxos~# ';
  }

  function refresh() {
    setPrompt(currentPrefix(), input);
  }

  // Provide a modal read-line helper for commands (used by resetfs)
  ctx.readLine = async (message) => {
    if (message) await line(message);
    // start modal input
    ctx.modal = { buffer: '', resolve: null };
    input = '';
    refresh();
    return new Promise(resolve => {
      ctx.modal.resolve = resolve;
    });
  };

  // Create initial prompt
  newPrompt();
  refresh();

  document.addEventListener('keydown', async e => {
    // --- Modal prompt handling (e.g., confirmations) ---
    if (ctx.modal) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        input += e.key; refresh();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        input = input.slice(0, -1); refresh();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Finalize the modal line visually
        setPrompt(currentPrefix(), input);
        const val = input;
        input = '';
        const resolve = ctx.modal.resolve;
        ctx.modal = null;
        // After command continues, place a fresh prompt
        newPrompt(); refresh();
        resolve(val);
      }
      return;
    }

    // --- Interactive write/append entry mode ---
    if (ctx.write) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        input += e.key; refresh();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        input = input.slice(0, -1); refresh();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // finalize the current input line
        setPrompt(currentPrefix(), input);
        ctx.write.buffer.push(input);
        if (input === '') {
          // blank line ends the session
          ctx.write.finish(ctx.write.buffer);
          ctx.write = null;
          await line('(file written)');
        }
        input = '';
        newPrompt(); refresh();
      }
      return;
    }

    // --- Normal shell ---
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      input += e.key; refresh();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      input = input.slice(0, -1); refresh();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // finalize the command line
      setPrompt(currentPrefix(), input);
      // detach active prompt anchor so output prints below this line
      window._fauxPromptEl = null;

      history.push(input); histPtr = history.length;

      const [cmd, ...args] = input.trim().split(/\s+/);
      input = '';

      if (cmd) {
        const map = getCommands();
        const fn  = map[cmd];
        if (!fn) {
          await line(`${cmd}: command not found`);
        } else {
          await fn(args);
        }
      }
      newPrompt(); refresh();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histPtr > 0) histPtr--;
      input = history[histPtr] || ''; refresh();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histPtr < history.length - 1) histPtr++;
      else { histPtr = history.length; input = ''; }
      input = history[histPtr] || ''; refresh();
    }
  });
}

boot();
