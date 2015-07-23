# pizi-indexedDB

A wrapper to indexedDB HTML5 API. 

## functions

### open(options   [Object])

Open a connection to a store. Use options.dbName and options.dbVersion to open the right store. Then, execute the options.success callback if available (or options.error). Only need to call this function once, then the database is memorised. This function is called during save, remove, get and getAll functions, so don't need to use it before calling those functions, just give the right options.dbName an options.dbVersion. Return the IDBDatabase object as argument of the callback function.

_Exemple:_

	pizi-indexedDB.open({
		dbName: "database name",
		dbVersion: "1",
		success : function(db){
			db instanceof IDBDatabase;
		}
	});

	/* Outpout result
	true
	 */
	
### save(store [String], object  [Object], options  [Object])

Save an object to a specified store. If the database is not already openned, it will be open using the options.dbName and options.dbVersion parameters. Then execute the options.success or options.error callbacks if defined. Return the object filled with id if the store is auto-incremented.

_Exemple:_

	pizi-indexedDB.save('user', {login: "Bernard", age="60"}, {
		dbName: "database name",
		dbVersion: "1",
		success : function(savedObject){
			savedObject.login;
		}
	});

	/* Outpout result
	"Bernard"
	 */
	
### remove(store [String], keys [Array], options [Object])

Remove the value at the sepcified keys in the store.