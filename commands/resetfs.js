(function(FauxOS){
  FauxOS.register('resetfs', (env) => async (_, line, ctx) => {
    await line('WARNING: This will DELETE all files and reset fauxOS to factory state.');
    await line('You will lose all changes. fauxOS will restart after reset.');
    const ans = await ctx.readLine('Type "y" to continue or "n" to cancel:');

    if ((ans || '').trim().toLowerCase().startsWith('y')) {
      env.setFS({ '/': {} });
      env.flush();
      await line('Filesystem wiped. Restarting fauxOS...');
      setTimeout(() => location.reload(), 300);
    } else {
      await line('Reset cancelled.');
    }
  });
})(window.FauxOS);
