///ignore this pls
(function(FauxOS){
  FauxOS.register('expose', () => async (_, line) => {
    await FauxOS.exposeBase();
    await line('done');
  });
})(window.FauxOS);
