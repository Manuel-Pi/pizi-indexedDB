(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.piziIndexedDB = factory();
    }
}(this, function IndexedDB(){
	if(!indexedDB){
		console.log('IndexedDB not avaiable!');
		return;
	} else {

		var db;

		var buildStores = function(ver){
			if(this.conf.stores){
				var indexedDBStores = this.conf.stores;
				for(var version in indexedDBStores){
					if(indexedDBStores.hasOwnProperty(version) && version === ver){
						for(var store in indexedDBStores[version]){
							if(indexedDBStores[version].hasOwnProperty(store)){
								var objectStore = db.createObjectStore(store, { keyPath: indexedDBStores[version][store].keyPath, autoIncrement: indexedDBStores[version][store].autoIncrement || false});
								for(var index in indexedDBStores[version][store].indexes){
									if(indexedDBStores[version][store].indexes.hasOwnProperty(index)){
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

		var open = function(options){
			options = options || {};
			if(db){
				if(options && options.success){
					options.success(db);
				}
			} else {
				var dbName = options.dbName || this.conf.dbName;
				var dbVersion = options.dbVersion || this.conf.dbVersion;
				var context = this;
				var request = indexedDB.open(dbName, dbVersion);
				request.onerror = function(event) {
					console.log('Cannot open database: ' + dbName + ' v:' + dbVersion);
					if(options && options.error){
						options.error();
					}
				};
				request.onsuccess = function(event) {
					db = this.result;
					if(options && options.success){
						options.success(db);
					}
				};
				request.onupgradeneeded = function(event) {
					db = this.result;
					buildStores.apply(context, [dbVersion]);
				};
			}
		};

		var save = function(store, object, options){
			options = options || {};
			var success = options.success;
			options.success = function(){
				var objects = object instanceof Array ? object : [object];
				var transaction;
				try {
					transaction = db.transaction([store], "readwrite");
				} catch (e) {
					var err = new Error(e.message + " Store: " + store);
					err.name = e.name;
					if(options && options.error){
						options.error(err);
					} else {
						throw err;
					}
					return;
				}
				var objectStore = transaction.objectStore(store);
				var saved = [];

				var dealRequest = function(request){
					if(success){
						request.onsuccess = function(event) {
							if(!options.allSuccess){
								success(event.target.result);
							} else {
								saved.push(event.target.result);
							}
						};
					}
					if(options && options.error){
						request.onerror = function(event) {
							options.error(this.error);
						};
					}
				};

				if(options && options.allSuccess){
					transaction.oncomplete = function(event) {
						options.success(saved);
					};
				}
				
				for (var obj in objects){
					if(options && options.addOnly){
						dealRequest(objectStore.add(objects[obj]));
					} else {
						dealRequest(objectStore.put(objects[obj]));
					}
				}
			};
			open.apply(this, [options]);
		};

		var remove = function(store, key, options){
			options = options || {};
			var success = options.success;
			options.success = function(){
				var keys = key instanceof Array ? key : [key];
				var transaction = db.transaction([store], "readwrite");
				var objectStore = transaction.objectStore(store);

				var dealRequest = function(request){
					if(success){
						request.onsuccess = function(event) {
							if(!options.allSuccess){
								success();
							}
						};
					}
					if(options && options.error){
						request.onerror = function(event) {
							options.error(this.error);
						};
					}
				};

				if(options && options.allSuccess){
					transaction.oncomplete = function(event) {
						options.allSuccess();
					};
				}
				
				for (var k in keys){
					dealRequest(objectStore.delete(keys[k]));
				}
			};
			open.apply(this, [options]);
		};

		var get = function(store, key, options){
			options = options || {};
			var success = options.success;
			options.success = function(){
				var keys = key instanceof Array ? key : [key];
				var transaction = db.transaction([store], "readwrite");
				var objectStore = transaction.objectStore(store);
				var objects = [];

				var dealRequest = function(request){
					request.onsuccess = function(event) {
						if(this.result){
							if(success && !options.allSuccess){
								if(!options.allSuccess){
									success(event.target.result);
								} else {
									objects.push(event.target.result);
								}
							}
						} else {
							if(options && options.error){
								options.error(this.error);
							}
						}
					};
					if(options && options.error){
						request.onerror = function(event) {
							options.error(this.error);
						};
					}
				};

				if(options && options.allSuccess){
					transaction.oncomplete = function(event) {
						options.allSuccess(objects);
					};
				}
				
				for(var k in keys){
					dealRequest(objectStore.get(keys[k]));
				}
			};
			open.apply(this, [options]);
		};

		var getAll = function(store, options){
			options = options || {};
			var success = options.success;
			options.success = function(){
				var transaction = db.transaction([store], "readwrite");
				var objectStore = transaction.objectStore(store);
				var objects = [];

				var dealRequest = function(request){
					request.onsuccess = function(event) {
						var cursor = event.target.result;
						if (cursor) {
							if(success){
								success(cursor.value);
							}
							objects.push(cursor.value);
							cursor.continue();
						}
					};
					if(options && options.error){
						request.onerror = function(event) {
							options.error(this.error);
						};
					}
				};

				if(options && options.allSuccess){
					transaction.oncomplete = function(event) {
						options.allSuccess(objects);
					};
				}
				
				dealRequest(objectStore.openCursor());
			};
			open.apply(this, [options]);
		};

		return {
			open : open,
			save : save,
			remove : remove,
			get : get ,
			getAll : getAll
		};
	}
}));