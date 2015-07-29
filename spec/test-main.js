require.config({
  baseUrl: '/base', //karma servers files from base
  paths: {
    knockout: 'bower_components/knockout.js/knockout'
  }
});

require(['spec/upload'], window.__karma__.start);
