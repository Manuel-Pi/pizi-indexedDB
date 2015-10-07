var db;

function buildStores(ver, options){
	let indexedDBStores = options.conf && options.conf.stores || this.conf.stores;
	if(indexedDBStores){
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
		console.log('conf.stores is not defined!');
	}
}

function open(options = {}){
	if(db){
		if(options.success){
			options.success(db);
		}
	} else {
		let dbName = options.dbName || options.conf && options.conf.dbName || this.conf.dbName;
		let dbVersion = options.dbVersion || options.conf && options.conf.dbVersion || this.conf.dbVersion;
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
			buildStores.apply(context, [dbVersion, options]);
		};
	}
}

function save(store, object, options = {}){
	let success = options.success;
	options.success = () => {
		let objects = object instanceof Array ? object : [object];
		let transaction;
		try {
			transaction = db.transaction([store], "readwrite");
		} catch (e) {
			let err = new Error(e.message + " Store: " + store);
			err.name = e.name;
			if(options.error){
				options.error(err);
			} else {
				throw err;
			}
			return;
		}
		let objectStore = transaction.objectStore(store);
		let saved = [];

		let dealRequest = (request) => {
			
			request.onsuccess = function(event) {
				if(success){
					success(event.target.result);
				} 
				if(options.allSuccess){
					saved.push(event.target.result);
				}
			};

			if(options.error){
				request.onerror = function(event) {
					options.error(this.error);
				};
			}
		};

		if(options.allSuccess){
			transaction.oncomplete = function(event) {
				options.allSuccess(saved);
			};
		}
		
		for (let obj in objects){
			if(options.addOnly){
				dealRequest(objectStore.add(objects[obj]));
			} else {
				dealRequest(objectStore.put(objects[obj]));
			}
		}
	};
	open.apply(this, [options]);
}

function remove(store, key, options = {}){
	options = options || {};
	let success = options.success;
	options.success = () => {
		let keys = key instanceof Array ? key : [key];
		let transaction = db.transaction([store], "readwrite");
		let objectStore = transaction.objectStore(store);

		let dealRequest = (request, key) => {
			request.deletedKey = key;
			if(success){
				request.onsuccess = function(event) {
					success(event.deletedKey);
				};
			}
			if(options.error){
				request.onerror = function(event) {
					options.error(this.error);
				};
			}
		};

		if(options.allSuccess){
			transaction.oncomplete = (event) => {
				options.allSuccess();
			};
		}
		
		for (let k in keys){
			dealRequest(objectStore.delete(keys[k]), keys[k]);
		}
	};
	open.apply(this, [options]);
}

function get(store, key, options = {}){
	let success = options.success;
	options.success = () => {
		let keys = key instanceof Array ? key : [key];
		let transaction = db.transaction([store], "readwrite");
		let objectStore = transaction.objectStore(store);
		let objects = [];

		let dealRequest = (request) => {
			request.onsuccess = function(event) {
				if(this.result){
					if(success){
						success(event.target.result);
					} 
					if (options.allSuccess){
						objects.push(event.target.result);
					}
				} else {
					if(options.error){
						let err = new Error("Model not found");
						err.name = "ModelNotFound";
						options.error(err);
					}
				}
			};
			if(options.error){
				request.onerror = function(event) {
					options.error(this.error);
				};
			}
		};

		if(options && options.allSuccess){
			transaction.oncomplete = (event) => {
				options.allSuccess(objects);
			};
		}
		
		for(let k in keys){
			dealRequest(objectStore.get(keys[k]));
		}
	};
	open.apply(this, [options]);
}

function getAll(store, options = {}){
	let success = options.success;
	options.success = () => {
		let transaction = db.transaction([store], "readwrite");
		let objectStore = transaction.objectStore(store);
		let objects = [];

		let dealRequest = (request) => {
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
			if(options.error){
				request.onerror = function(event) {
					options.error(this.error);
				};
			}
		};

		if(options.allSuccess){
			transaction.oncomplete = (event) => {
				options.allSuccess(objects);
			};
		}
		
		dealRequest(objectStore.openCursor());
	};
	open.apply(this, [options]);
}

export default {
	open : open,
	save : save,
	remove : remove,
	get : get,
	getAll : getAll
};