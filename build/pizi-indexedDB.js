(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("pizi-indexedDB", [], factory);
	else if(typeof exports === 'object')
		exports["pizi-indexedDB"] = factory();
	else
		root["pizi-indexedDB"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
var db = void 0;

function buildStores(ver, options) {
    var indexedDBStores = options.conf && options.conf.stores || this.conf.stores;
    if (indexedDBStores) {
        for (var version in indexedDBStores) {
            if (indexedDBStores.hasOwnProperty(version) && version === ver) {
                for (var store in indexedDBStores[version]) {
                    if (indexedDBStores[version].hasOwnProperty(store)) {
                        var objectStore = db.createObjectStore(store, { keyPath: indexedDBStores[version][store].keyPath, autoIncrement: indexedDBStores[version][store].autoIncrement || false });
                        for (var index in indexedDBStores[version][store].indexes) {
                            if (indexedDBStores[version][store].indexes.hasOwnProperty(index)) {
                                objectStore.createIndex(index, index, { unique: false });
                            }
                        }
                    }
                }
            }
        }
    } else {
        console.log('conf.stores is not defined!');
    }
}

function open() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (db) {
        if (options.success) {
            options.success(db);
        }
    } else {
        var dbName = options.dbName || options.conf && options.conf.dbName || this.conf.dbName;
        var dbVersion = options.dbVersion || options.conf && options.conf.dbVersion || this.conf.dbVersion;
        var context = this;
        var request = indexedDB.open(dbName, dbVersion);
        request.onerror = function (event) {
            console.log('Cannot open database: ' + dbName + ' v:' + dbVersion);
            if (options && options.error) {
                options.error();
            }
        };
        request.onsuccess = function (event) {
            db = this.result;
            if (options && options.success) {
                options.success(db);
            }
        };
        request.onupgradeneeded = function (event) {
            db = this.result;
            buildStores.apply(context, [dbVersion, options]);
        };
    }
}

function save(store, object) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var success = options.success;
    options.success = function () {
        var objects = object instanceof Array ? object : [object];
        var transaction = void 0;
        try {
            transaction = db.transaction([store], "readwrite");
        } catch (e) {
            var err = new Error(e.message + " Store: " + store);
            err.name = e.name;
            if (options.error) {
                options.error(err);
            } else {
                throw err;
            }
            return;
        }
        var objectStore = transaction.objectStore(store);
        var saved = [];

        var dealRequest = function dealRequest(request) {

            request.onsuccess = function (event) {
                if (success) {
                    success(event.target.result);
                }
                if (options.allSuccess) {
                    saved.push(event.target.result);
                }
            };

            if (options.error) {
                request.onerror = function (event) {
                    options.error(this.error);
                };
            }
        };

        if (options.allSuccess) {
            transaction.oncomplete = function (event) {
                options.allSuccess(saved);
            };
        }

        for (var obj in objects) {
            if (options.addOnly) {
                dealRequest(objectStore.add(objects[obj]));
            } else {
                dealRequest(objectStore.put(objects[obj]));
            }
        }
    };
    open.apply(this, [options]);
}

function remove(store, key) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    options = options || {};
    var success = options.success;
    options.success = function () {
        var keys = key instanceof Array ? key : [key];
        var transaction = db.transaction([store], "readwrite");
        var objectStore = transaction.objectStore(store);

        var dealRequest = function dealRequest(request, key) {
            request.deletedKey = key;
            if (success) {
                request.onsuccess = function (event) {
                    success(event.deletedKey);
                };
            }
            if (options.error) {
                request.onerror = function (event) {
                    options.error(this.error);
                };
            }
        };

        if (options.allSuccess) {
            transaction.oncomplete = function (event) {
                options.allSuccess();
            };
        }

        for (var k in keys) {
            dealRequest(objectStore.delete(keys[k]), keys[k]);
        }
    };
    open.apply(this, [options]);
}

function get(store, key) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var success = options.success;
    options.success = function () {
        var keys = key instanceof Array ? key : [key];
        var transaction = db.transaction([store], "readwrite");
        var objectStore = transaction.objectStore(store);
        var objects = [];

        var dealRequest = function dealRequest(request) {
            request.onsuccess = function (event) {
                if (this.result) {
                    if (success) {
                        success(event.target.result);
                    }
                    if (options.allSuccess) {
                        objects.push(event.target.result);
                    }
                } else {
                    if (options.error) {
                        var err = new Error("Model not found");
                        err.name = "ModelNotFound";
                        options.error(err);
                    }
                }
            };
            if (options.error) {
                request.onerror = function (event) {
                    options.error(this.error);
                };
            }
        };

        if (options && options.allSuccess) {
            transaction.oncomplete = function (event) {
                options.allSuccess(objects);
            };
        }

        for (var k in keys) {
            dealRequest(objectStore.get(keys[k]));
        }
    };
    open.apply(this, [options]);
}

function getAll(store) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var success = options.success;
    options.success = function () {
        var transaction = db.transaction([store], "readwrite");
        var objectStore = transaction.objectStore(store);
        var objects = [];

        var dealRequest = function dealRequest(request) {
            request.onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    if (success) {
                        success(cursor.value);
                    }
                    objects.push(cursor.value);
                    cursor.continue();
                }
            };
            if (options.error) {
                request.onerror = function (event) {
                    options.error(this.error);
                };
            }
        };

        if (options.allSuccess) {
            transaction.oncomplete = function (event) {
                options.allSuccess(objects);
            };
        }

        dealRequest(objectStore.openCursor());
    };
    open.apply(this, [options]);
}

/* harmony default export */ __webpack_exports__["default"] = ({
    open: open,
    save: save,
    remove: remove,
    get: get,
    getAll: getAll
});

/***/ })
/******/ ]);
});