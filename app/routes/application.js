import Ember from 'ember';

export default Ember.Route.extend({
	currentModal: undefined,

	actions: {
		willTransition: function() {
			this.controller.set('drawerOpen', false);

			if(this.get('currentModal') !== undefined) {
				this.send('closeModal');
			}
		},

		openModal: function(modalName, model) {
			if(this.get('currentModal') !== undefined) {
				throw "Modal is already being displayed";
			}

			this.set('currentModal', modalName);
			return this.render(modalName, {
				into: 'application',
				outlet: 'modal',

				model: model
			});
		},

		closeModal: function() {
			if(this.get('currentModal') === undefined) {
				throw "No modal is being displayed";
			}

			this.disconnectOutlet({
				outlet: 'modal',
				parentView: 'application'
			});
			this.controllerFor(this.get('currentModal')).destroy();
			this.set('currentModal', undefined);
		}
	}
});
