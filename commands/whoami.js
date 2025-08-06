(function(FauxOS){
  FauxOS.register('whoami', () => async (_, line) => {
    await line('root');
  });
})(window.FauxOS);
