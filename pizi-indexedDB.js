(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['pizi-indexedDBStores'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('pizi-indexedDBStores'));
    } else {
        // Browser globals (root is window)
        root.iDB = factory(root.indexedDBStores);
    }
}(this, function IndexedDB(indexedDBStores){
	if(!indexedDB){
		console.log('IndexedDB not avaiable!');
		return;
	} else {

		var db;

		var buildStores = function(ver){
			if(indexedDBStores){
				for(var version in indexedDBStores){
					if(indexedDBStores.hasOwnProperty(version) && version === ""+ver){
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
			if(db){
				if(options && options.success){
					options.success();
				}
			} else {
				var request = indexedDB.open(options.dbName, options.dbVersion);
				request.onerror = function(event) {
					console.log('Cannot open database: ' + options.dbName + ' v:' + options.dbVersion);
					if(options && options.error){
						options.error();
					}
				};
				request.onsuccess = function(event) {
					db = this.result;
					if(options && options.success){
						options.success();
					}
				};
				request.onupgradeneeded = function(event) {
					db = this.result;
					buildStores(version);
				};
			}
		};

		var save = function(store, object, options){
			options = options || {};
			var success = options.success;
			options.success = function(){
				var objects = object instanceof Array ? object : [object];
				var transaction = db.transaction([store], "readwrite");
				var objectStore = transaction.objectStore(store);

				var dealRequest = function(request){
					if(success){
						request.onsuccess = function(event) {
							success(event.target.result);
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
				
				for (var obj in objects){
					if(options && options.addOnly){
						dealRequest(objectStore.add(objects[obj]));
					} else {
						dealRequest(objectStore.put(objects[obj]));
					}
				}
			};
			open(options);
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
							success();
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
			open(options);
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
							if(success){
								success(this.result);
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
			open(options);
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
			open(options);
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