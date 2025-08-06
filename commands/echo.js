(function(FauxOS){
  FauxOS.register('echo', () => async (args, line) => {
    await line(args.join(' '));
  });
})(window.FauxOS);
