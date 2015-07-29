require(['require-config'], function() {
    require( ['knockout', 'upload-gallery'],
        function(ko) {
            var vm = function () {
                valor = ko.observable('Olá mundo!');
            };

            this.name = '';
            this.extension = '';
            this.friendlyName = '';
            this.blob = null;
            this.serverPath = '';
            this.serverId = 0;
            this.removed = false;
            this.fileSize = 0;
            this.fileReadProgress = 0;
            this.uploadProgress = 0;
            this.uploadStatus = 0; // 0 default, 1 success, 2 error,
            this.uploadMessage = '';

            ko.applyBindings(new vm(), document.getElementById('ko-uploader'));

        }
    );
});