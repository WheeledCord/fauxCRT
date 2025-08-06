(function(FauxOS){
  FauxOS.register('rebuild', () => async (_, line) => {
    await FauxOS.rebuild();
    await line('Commands reloaded.');
  });
})(window.FauxOS);
