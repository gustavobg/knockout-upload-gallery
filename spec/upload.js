define(['knockout', 'src/upload'], function(ko, upload) {

  describe('Upload', function() {
    var viewModel;
    var element;
    var root;

    before(function () {
      root = document.createElement('div');
      root.innerHTML = '<input id="input" data-bind="upload:obs">';
      document.body.appendChild(root);
      element = document.getElementById('input');
    });

    beforeEach(function() {
      viewModel = {
        obs: ko.observable()
      };

      ko.applyBindings(viewModel, root);
    });

    afterEach(function() {
      ko.cleanNode(root);
    });

    it('should be bound', function() {
      expect(ko.dataFor(element)).to.be(viewModel);
    });

  });
});
