(function(FauxOS){
  FauxOS.register('expose', () => async (_, line) => {
    await FauxOS.exposeBase();
    await line('Base commands copied into /commands (editable). Run `rebuild` after edits.');
  });
})(window.FauxOS);
