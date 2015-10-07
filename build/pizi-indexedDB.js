(function (global, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['exports', 'module'], factory);
	} else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
		factory(exports, module);
	} else {
		var mod = {
			exports: {}
		};
		factory(mod.exports, mod);
		global.piziIndexedDB = mod.exports;
	}
})(this, function (exports, module) {
	'use strict';

	var db;

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
		var _this = this;

		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		if (db) {
			if (options.success) {
				options.success(db);
			}
		} else {
			(function () {
				var dbName = options.dbName || options.conf && options.conf.dbName || _this.conf.dbName;
				var dbVersion = options.dbVersion || options.conf && options.conf.dbVersion || _this.conf.dbVersion;
				var context = _this;
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
			})();
		}
	}

	function save(store, object) {
		var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

		var success = options.success;
		options.success = function () {
			var objects = object instanceof Array ? object : [object];
			var transaction = undefined;
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
		var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

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
				dealRequest(objectStore['delete'](keys[k]), keys[k]);
			}
		};
		open.apply(this, [options]);
	}

	function get(store, key) {
		var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

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
		var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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
						cursor['continue']();
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

	module.exports = {
		open: open,
		save: save,
		remove: remove,
		get: get,
		getAll: getAll
	};
});
