class BoundClass {
	constructor() {
		super(...arguments);

		this.autoBind();
	}

	// Bind an array of method name to class instance
	bind(methods) {
		methods.forEach(method => {
			this[method] = this[method].bind(this);
		});
	}

	// Bind all methods to class instance
	autoBind() {
		this.bind(
			Object.getOwnPropertyNames(this.constructor.prototype)
				.filter(prop => typeof this[prop] === 'function')
		);
	}
}

export {BoundClass};
