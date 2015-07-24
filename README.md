# pizi-indexedDB

A wrapper to indexedDB HTML5 API. 

## functions

### open(options   [Object])

**options [Object]** The option object:

	{
		dbName: "name", // Name of the IDBDatabase
		dbVersion: "1", // Version of the database
		success: function(){...}, // Success callback
		error: function(){...} // Error callback
	} 

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
	
### save(store , objects , options)

**store [String]** The store to save in.

**object [Object / Array]** The object or array of objects to save.

**options [Object]** The option object:

	{
		success: function(){...}, // Success callback
		error: function(){...}, // Error callback
		dbName: "name", // Name of the IDBDatabase
		dbVersion: "1", // Version of the database
		allSuccess: false, // true if the callback should be called for each saved object
		addOnly: false // true if you want to use DBObjectStore.add in place of DBObjectStore.put (firing exeption if already existing)
	} 

Save objects to a specified store. If the database is not already openned, it will be open using the options.dbName and options.dbVersion parameters. Then execute the options.success or options.error callbacks if defined. Return the object filled with id if the store is auto-incremented. If not auto-incremented, need to fill the attribute corresponding to the keyPath of the store. options.allSuccess is set to false by default, meaning the success callback is called only after all objects are saved with the array of saved objets as argument. If set to true the callback is called for each object saved with the object as argument.

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
	
### remove(store, key, options)


**store [String]** The store to save in.

**key [String / Array]** The key or array of keysof object to remove.

**options [Object]** The option object:

	{
		success: function(){...}, // Success callback
		error: function(){...}, // Error callback
		dbName: "name", // Name of the IDBDatabase
		dbVersion: "1", // Version of the database
		allSuccess: false // true if the callback should be called for each deleted object
	} 

Remove the value at the sepcified keys in the store. Then, execute the options.success callback. options.allSuccess is set to false by default, meaning the success callback is called only after all objects are deleted with the array of saved objets as argument. If set to true the callback is called for each object deleted with the object as argument.

_Exemple:_

	pizi-indexedDB.remove('user', "Bernard", {
		dbName: "database name",
		dbVersion: "1",
		success : function(){
			console.log("removed!");
		}
	});

	/* Outpout result
	"removed!"
	 */

### get(store, key, options)


**store [String]** The store to get value from.

**key [String / Array]** The key or array of keys of objects to get.

**options [Object]** The option object:

	{
		success: function(){...}, // Success callback
		error: function(){...}, // Error callback
		dbName: "name", // Name of the IDBDatabase
		dbVersion: "1", // Version of the database
		allSuccess: false // true if the callback should be called for each deleted object
	} 

Get the value at the sepcified keys in the store. Then, execute the options.success callback. options.allSuccess is set to false by default, meaning the success callback is called only after all objects are getted with the array of objets as argument. If set to true the callback is called for each object getted with the object as argument.

_Exemple:_

	pizi-indexedDB.get('user', "Bernard", {
		dbName: "database name",
		dbVersion: "1",
		success : function(user){
			console.log("user.login");
		}
	});

	/* Outpout result
	"Bernard"
	 */