var db;

var buildStores = function(ver){
	if(this.conf.stores){
		let indexedDBStores = this.conf.stores;
		for(let version in indexedDBStores){
			if(indexedDBStores.hasOwnProperty(version) && version === ver){
				for(let store in indexedDBStores[version]){
					if(indexedDBStores[version].hasOwnProperty(store)){
						let objectStore = db.createObjectStore(store, { keyPath: indexedDBStores[version][store].keyPath, autoIncrement: indexedDBStores[version][store].autoIncrement || false});
						for(let index in indexedDBStores[version][store].indexes){
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

var open = function(options = {}){
	if(db){
		if(options.success){
			options.success(db);
		}
	} else {
		let dbName = options.dbName || this.conf.dbName;
		let dbVersion = options.dbVersion || this.conf.dbVersion;
		let context = this;
		let request = indexedDB.open(dbName, dbVersion);
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

var save = function(store, object, options = {}){
	let success = options.success;
	options.success = function(){
		let objects = object instanceof Array ? object : [object];
		let transaction;
		try {
			transaction = db.transaction([store], "readwrite");
		} catch (e) {
			let err = new Error(e.message + " Store: " + store);
			err.name = e.name;
			if(options && options.error){
				options.error(err);
			} else {
				throw err;
			}
			return;
		}
		let objectStore = transaction.objectStore(store);
		let saved = [];

		let dealRequest = function(request){
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
		
		for (let obj in objects){
			if(options && options.addOnly){
				dealRequest(objectStore.add(objects[obj]));
			} else {
				dealRequest(objectStore.put(objects[obj]));
			}
		}
	};
	open.apply(this, [options]);
};

var remove = function(store, key, options = {}){
	options = options || {};
	let success = options.success;
	options.success = function(){
		let keys = key instanceof Array ? key : [key];
		let transaction = db.transaction([store], "readwrite");
		let objectStore = transaction.objectStore(store);

		let dealRequest = function(request){
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
		
		for (let k in keys){
			dealRequest(objectStore.delete(keys[k]));
		}
	};
	open.apply(this, [options]);
};

var get = function(store, key, options = {}){
	let success = options.success;
	options.success = function(){
		let keys = key instanceof Array ? key : [key];
		let transaction = db.transaction([store], "readwrite");
		let objectStore = transaction.objectStore(store);
		let objects = [];

		let dealRequest = function(request){
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
		
		for(let k in keys){
			dealRequest(objectStore.get(keys[k]));
		}
	};
	open.apply(this, [options]);
};

var getAll = function(store, options = {}){
	let success = options.success;
	options.success = function(){
		let transaction = db.transaction([store], "readwrite");
		let objectStore = transaction.objectStore(store);
		let objects = [];

		let dealRequest = function(request){
			request.onsuccess = function(event) {
				let cursor = event.target.result;
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

export default {
	open : open,
	save : save,
	remove : remove,
	get : get ,
	getAll : getAll
};