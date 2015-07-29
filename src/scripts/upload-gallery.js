ko.components.register('upload', {
    viewModel: function (params) {
        var self = this,
            array_intersect = function (a, b) {
                var ai = bi = 0;
                var result = [];

                while (ai < a.length && bi < b.length) {
                    if (a[ai] < b[bi]) {
                        ai++;
                    }
                    else if (a[ai] > b[bi]) {
                        bi++;
                    }
                    else /* they're equal */
                    {
                        result.push(ai);
                        ai++;
                        bi++;
                    }
                }
                return result;
            };
        getParamDefault = function (param, defaultValue) {
            if (param != undefined)
                return param;
            else
                return defaultValue;
        },
            getParamObservable = function (param) {
                return ko.isObservable(param) ? param : ko.observable(param);
            },
            getParamObservableArray = function (param) {
                return ko.isObservable(param) ? param : ko.observableArray(param);
            },
            getFormattedSize = function (size) {
                if (size < 1025) { // 1000kb
                    return Math.ceil(size / 1024) + " kb's";
                } else {
                    return Math.ceil(size / 1024 / 1024) + " mb's";
                }
            },
            errorList = [],
            // todo, refactor viewModel and js
            fileJs = function () {
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
            },
            isImage = function (extension) {
                return self.imageExtensions.indexOf(extension) >= 0;
            },
            getExtensionByPathName = function (path) {
                var matches = path.match(/([\w\W]*)\.([\w\d]*)$/);
                return matches && matches.length === 3 ? matches[2] : '';
            },
            fileModel = function (f) {
                var fm = this;
                this.name = ko.observable(f.name);
                this.blob = ko.observable(f.blob);
                ko.computed(function () {
                    if (fm.blob())
                        fm.name(fm.blob().name);
                });
                this.friendlyName = ko.observable(f.friendlyName || f.name);
                this.serverPath = ko.observable(f.serverPath || '');
                this.extension = ko.observable(f.extension || getExtensionByPathName(fm.serverPath()));
                this.serverId = ko.observable(f.serverId);
                this.removed = ko.observable(f.removed);
                this.fileSize = ko.observable(f.fileSize);
                this.fileReadProgress = ko.observable(f.fileReadProgress);
                this.uploadProgress = ko.observable(f.uploadProgress);
                this.uploadStatus = ko.observable(f.uploadStatus); // 0 default, 1 success, 2 error,
                this.uploadMessage = ko.observable(f.uploadMessage);
                // todo: tornar computable e se sucesso for falso, exibir mensagem e abrir opção para retentar o upload.
                this.uploadSuccess = ko.observable();
                this.uploadStatusCss = ko.observable('hide');
                this.uploadContentCss = ko.observable('hide');

                // Servidor deve retornar serverId, serverPath, name, extension.
                // todo: informações abaixo podem ser extendidas
                this.isImage = ko.observable();
                ko.computed(function () {
                    return fm.isImage(isImage(fm.extension()));
                }, this);

                this.showUploadStatus = function () {
                    if (fm.uploadSuccess()) {
                        fm.uploadStatusCss('success');
                        window.setTimeout(function () {
                            fm.uploadContentCss('show');
                            fm.uploadStatusCss('hide');
                        }, 1500);
                    } else {
                        fm.uploadStatusCss('error');
                        fm.imageData('');
                    }
                    ;
                };

                // upload file
                fm.uploadFile = function () {
                    var xhr = new XMLHttpRequest(),
                        formData = new FormData();

                    var reset = function () {
                        //item.removeClass('success').removeClass('error');
                    };

                    formData.append('file', fm.blob());

                    if (xhr.upload) {
                        xhr.upload.onprogress = function (e) {
                            console.log(e.loaded, e.total);
                            if (e.lengthComputable) {
                                fm.uploadProgress((e.loaded / e.total * 100));
                            }
                        };
                        //xhr.upload.onloadstart
                        //xhr.upload.onload
                        xhr.upload.onerror = function (e) {
                            fm.uploadSuccess(false);
                            fm.uploadMessage('Erro ao enviar arquivo');
                            fm.showUploadStatus();
                        };
                    }
                    xhr.onreadystatechange = function (e) {
                        // complete
                        var response = JSON.parse(e.currentTarget.response);

                        fm.uploadMessage(response['Mensagem']);
                        fm.uploadSuccess(response['Sucesso']);
                        fm.showUploadStatus();

                        // todo: parametrizar
                        fm.serverPath(response['FilePath']);
                        fm.name(response['Arquivo']);

                        fm.uploadProgress(100);
                    };

                    xhr.open("POST", self.serverURL, true);
                    xhr.send(formData);

                };

                // load image before upload to server
                this.imageData = ko.observable();
                ko.computed(function () {
                    //if (!self.uploadOnSelect) {
                    if (this.blob() && this.isImage()) {
                        var reader = new FileReader();
                        reader.readAsDataURL(this.blob());
                        reader.onload = function (img) {
                            fm.imageData(img.target.result);
                        };
                        reader.onprogress = function (e) {
                            if (e.lengthComputable) {
                                fm.fileReadProgress(Math.round((e.loaded * 100) / e.total));
                            }
                        };
                        reader.onloadend = function (e) {
                            fm.fileReadProgress(100);
                            if (self.uploadOnSelect)
                                fm.uploadFile();
                        }
                    } else {

                        if (self.uploadOnSelect && fm.serverId() == 0)
                            fm.uploadFile();
                    }

                }, this);

                this.icon = ko.computed(function () {
                    var icon = self.fileIconExtensions[this.extension()];
                    return icon ? icon : ['jpg', 'gif', 'png'];
                }, this);
            };
        //fileModel = ko.mapping.fromJS(new fileJs());

        self.uploadSingleImage = getParamDefault(params.uploadSingleImage, false);
        self.uploadMaxSize = (((getParamDefault(params.uploadMaxSize, 100) * 1024) * 1024) * 1024); // mb
        self.uploadOnSelect = true;
        self.showUploadProgress = getParamDefault(params.showSingleImage, true);
        self.showOverallUploadProgress = getParamDefault(params.showOverallUploadProgress, true);
        self.enableMultipleUpload = getParamDefault(params.enableMultipleUpload, true);
        self.enableEditFilename = getParamDefault(params.enableEditFilename, true);
        self.enableDragndrop = getParamDefault(params.enableDragndrop, true);

        // Aviso de segurança. O servidor deve restringir os arquivos por mimetype, qualquer verificação por client é insegura!
        self.serverURL = ko.utils.unwrapObservable(params.serverURL);
        self.allowedExtensions = ko.utils.unwrapObservable(params.allowedExtensions); // se não está na lista, não é permitido
        self.imageExtensions = ko.utils.unwrapObservable(params.imageExtensions);
        self.fileIconExtensions = ko.utils.unwrapObservable(params.fileIconExtensions);

        var getFilesFromVM = function (files) {
            var mapped = ko.utils.arrayMap(files, function (file) {
                return new fileModel(file);
            });
            return mapped;
        };

        self.filesJS = getParamObservableArray(params.filesJS);
        self.files = ko.observableArray(getFilesFromVM(ko.utils.unwrapObservable(params.files)));

        // Single image
        self.image = ko.observableArray([]);
        self.hasImage = ko.observable(false);

        if (self.uploadSingleImage) {
            self.enableMultipleUpload = false;
            self.enableEditFilename = false;

            self.files.subscribe(function (value) {
                console.log('files', value);
                if (value.length > 0) {
                    self.image(value[0]);
                    self.hasImage(true);
                } else {
                    self.hasImage(false);
                    self.image([]);
                }
            });
        }

        ko.computed(function () {
            self.filesJS(ko.mapping.toJS(self.files()));
            console.log('return to VM Host', self.filesJS());
        }).extend({rateLimit: {timeout: 500, method: "notifyWhenChangesStop"}});

        self.isValid = function (file) {
            var isValid = true, errorStringArray = [];
            if (file.size > self.maxSize) {
                errorStringArray.push('O arquivo <strong>' + file.name + '</strong> excedeu o tamanho máximo permitido de ' + getFormattedSize(self.maxSize));
                isValid = false;
            }
            if (self.allowedExtensions.indexOf(file.extension) < 0) {
                errorStringArray.push('O formato <strong>' + file.extension + '</strong> não é permitido.');
                isValid = false;
            }
            if (self.uploadSingleImage && !file.isImage) {
                var extensions = array_intersect(self.allowedExtensions, self.imageExtensions),
                    message = extensions.length > 1 ?
                    'Somente os formatos de imagem <strong>' + extensions.join(', ') + '</strong> são permitidos.' :
                    'Somente o formato de imagem <strong>' + extensions + '</strong> é permitido.';
                errorStringArray.push(message);
                isValid = false;
            }
            if (!isValid)
                errorList.push(errorStringArray.join('<br />'));

            return isValid;
        };

        self.removeFile = function () {
            self.files.remove(this);
        };

        self.showErrors = function () {
            errorList.forEach(function (el) {
                toastr.error(el, '', 5000);
            })
        };

        self.getFilesFromInput = function (filesFromInput) {
            errorList = [];
            // mapping selected input files to vm files
            ko.utils.arrayForEach(filesFromInput, function (inputFile) {

                var file = new fileJs();
                file.blob = inputFile;
                file.extension = getExtensionByPathName(inputFile.name);
                file.name = inputFile.name;
                file.isImage = isImage(file.extension);
                file.friendlyName = inputFile.friendlyName;
                file.size = inputFile.size;

                if (self.isValid(file))
                    self.files.push(new fileModel(file));
            });
            if (errorList.length > 0)
                self.showErrors();
        };

        self.debug = false;


    },
    template: {fromUrl: 'upload.html', maxCacheAge: 9999}
});

var templateFromUrlLoader = {
    loadTemplate: function (name, templateConfig, callback) {
        if (templateConfig.fromUrl) {
            // Uses jQuery's ajax facility to load the markup from a file
            var fullUrl = '/templates/' + templateConfig.fromUrl + '?cacheAge=' + templateConfig.maxCacheAge;
            $.ajax({
                url: fullUrl,
                type: 'GET',
                async: true,
                success: function (markupString) {
                    // We need an array of DOM nodes, not a string.
                    // We can use the default loader to convert to the
                    // required format.
                    ko.components.defaultLoader.loadTemplate(name, markupString, callback);
                }
            });
        } else {
            // Unrecognized config format. Let another loader handle it.
            callback(null);
        }
    }
};
// Register loader
ko.components.loaders.unshift(templateFromUrlLoader);

ko.bindingHandlers.linkClick = {
    init: function (element, valueAccessor, allBindings, vm, bindingContext) {
        $(element).on('click', function (e) {
            e.preventDefault();
            if (vm.isImage()) {
                bootbox.dialog({
                    className: 'uploader-preview',
                    closeButton: true,
                    message: '<img src="' + vm.serverPath() + '" alt="' + vm.friendlyName() + '" />',
                    title: vm.friendlyName(),
                    onEscape: true
                });
            }
        });
    },
    update: function (element, valueAccessor, allBindings, vm, bindingContext) {
    }
};

ko.bindingHandlers.imageLoad = {
    init: function (element, valueAccessor, allBindings, vm, bindingContext) {
        element.onerror = function () {
            if (vm.serverPath().length > 0)
                vm.isImage(false);
        };
    },
    update: function (element, valueAccessor, allBindings, vm, bindingContext) {
    }
};

ko.bindingHandlers.upload = {
    init: function (element, valueAccessor, allBindings, vm, bindingContext) {
        // This will be called when the binding is first applied to an element
        // Set up any initial state, event handlers, etc. here
        var $element = $(element);

        $element.on('change', '.upload-input', function (e) {
            var input = $(e.target),
                inputFiles = e.target.files || e.dataTransfer.files;

            vm.getFilesFromInput(inputFiles);
            // reset input
            input.val('');
        });

        $element.on('keypress', '.upload-filename-input', function (e) {
            $this = $(e.target);

            if (e.keyCode === 13 || e.keyCode === 10) {
                e.preventDefault();
                e.stopPropagation(); // prevent bubbleUp
                $this.blur();
            }
        });
    },
    update: function (element, valueAccessor, allBindings, vm, bindingContext) {
    }
};

