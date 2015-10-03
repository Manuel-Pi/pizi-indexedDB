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

	var buildStores = function buildStores(ver) {
		if (this.conf.stores) {
			var indexedDBStores = this.conf.stores;
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
			console.log('indexedDBStores.js is not valid!');
		}
	};

	var open = function open(options) {
		options = options || {};
		if (db) {
			if (options && options.success) {
				options.success(db);
			}
		} else {
			var dbName = options.dbName || this.conf.dbName;
			var dbVersion = options.dbVersion || this.conf.dbVersion;
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
				buildStores.apply(context, [dbVersion]);
			};
		}
	};

	var save = function save(store, object, options) {
		options = options || {};
		var success = options.success;
		options.success = function () {
			var objects = object instanceof Array ? object : [object];
			var transaction;
			try {
				transaction = db.transaction([store], "readwrite");
			} catch (e) {
				var err = new Error(e.message + " Store: " + store);
				err.name = e.name;
				if (options && options.error) {
					options.error(err);
				} else {
					throw err;
				}
				return;
			}
			var objectStore = transaction.objectStore(store);
			var saved = [];

			var dealRequest = function dealRequest(request) {
				if (success) {
					request.onsuccess = function (event) {
						if (!options.allSuccess) {
							success(event.target.result);
						} else {
							saved.push(event.target.result);
						}
					};
				}
				if (options && options.error) {
					request.onerror = function (event) {
						options.error(this.error);
					};
				}
			};

			if (options && options.allSuccess) {
				transaction.oncomplete = function (event) {
					options.success(saved);
				};
			}

			for (var obj in objects) {
				if (options && options.addOnly) {
					dealRequest(objectStore.add(objects[obj]));
				} else {
					dealRequest(objectStore.put(objects[obj]));
				}
			}
		};
		open.apply(this, [options]);
	};

	var remove = function remove(store, key, options) {
		options = options || {};
		var success = options.success;
		options.success = function () {
			var keys = key instanceof Array ? key : [key];
			var transaction = db.transaction([store], "readwrite");
			var objectStore = transaction.objectStore(store);

			var dealRequest = function dealRequest(request) {
				if (success) {
					request.onsuccess = function (event) {
						if (!options.allSuccess) {
							success();
						}
					};
				}
				if (options && options.error) {
					request.onerror = function (event) {
						options.error(this.error);
					};
				}
			};

			if (options && options.allSuccess) {
				transaction.oncomplete = function (event) {
					options.allSuccess();
				};
			}

			for (var k in keys) {
				dealRequest(objectStore['delete'](keys[k]));
			}
		};
		open.apply(this, [options]);
	};

	var get = function get(store, key, options) {
		options = options || {};
		var success = options.success;
		options.success = function () {
			var keys = key instanceof Array ? key : [key];
			var transaction = db.transaction([store], "readwrite");
			var objectStore = transaction.objectStore(store);
			var objects = [];

			var dealRequest = function dealRequest(request) {
				request.onsuccess = function (event) {
					if (this.result) {
						if (success && !options.allSuccess) {
							if (!options.allSuccess) {
								success(event.target.result);
							} else {
								objects.push(event.target.result);
							}
						}
					} else {
						if (options && options.error) {
							options.error(this.error);
						}
					}
				};
				if (options && options.error) {
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
	};

	var getAll = function getAll(store, options) {
		options = options || {};
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
				if (options && options.error) {
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

			dealRequest(objectStore.openCursor());
		};
		open.apply(this, [options]);
	};

	module.exports = {
		open: open,
		save: save,
		remove: remove,
		get: get,
		getAll: getAll
	};
});
