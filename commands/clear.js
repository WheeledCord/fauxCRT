(function(FauxOS){
  FauxOS.register('clear', () => async () => {
    document.getElementById('terminal').innerHTML = '';
  });
})(window.FauxOS);
