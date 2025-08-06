(function(FauxOS){
  FauxOS.register('pwd', (env) => async (_, line) => {
    const parts = env.getCwd();
    const path = '/' + parts.join('/');
    await line(path === '/' ? '/' : path);
  });
})(window.FauxOS);
