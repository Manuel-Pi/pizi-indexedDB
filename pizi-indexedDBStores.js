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
        root.indexedDBStores = factory();
  }
}(this, function(){
	return {
		1 :{
			user : {
				keyPath : 'login',
				autoIncrement: true,
				indexes : []
			},
			transaction : {
				keyPath : 'id',
				autoIncrement: true,
				indexes : []
			},
			session : {
				keyPath : 'id',
				autoIncrement: true,
				indexes : []
			}
		}
	};
}));