import Ember from 'ember';

import {checkAccount} from 'chinwag/utils/connection';

var jappixBOSH = 'wss://websocket.jappix.com/';
//var jappixBOSH = 'https://bind.jappix.com/';

export default Ember.Controller.extend({
	error: undefined,
	formDisabled: false,

	jid: undefined,
	password: undefined,
	boshURL: jappixBOSH,

	showAdvanced: false,

	setError: function(error) {
		this.setProperties({
			error: error,
			formDisabled: false
		});
	},

	accountSaved: function(account) {
		this.setProperties({
			error: undefined,
			formDisabled: false,

			jid: undefined,
			password: undefined,
			boshURL: jappixBOSH,
			showAdvanced: false
		});

		this.transitionToRoute('accounts.edit', account);
	},

	accountSaveFailed: function(e) {
		console.error('[accounts.add]', 'Account save failed:', e);
		this.setError('A database error occurred');
	},

	accountCheckSuccess: function(account) {
		var record = this.store.createRecord('account', account);
		record.save().then(this.accountSaved.bind(this, account)).catch(this.accountSaveFailed.bind(this));
	},

	accountCheckFailed: function(e) {
		console.warn('[accounts.add]', 'Account check failed:', e);

		if(e.message != null) {
			this.setError(e.message);
		} else {
			this.setError('Account check failed.');
		}
	},

	actions: {
		addAccount: function() {
			this.setProperties({
				formDisabled: true,
				error: undefined
			});

			if(this.store.hasRecordForId('account', this.get('jid'))) {
				this.setError('This account has already been added.');
				return;
			}

			var account = {
				id: this.get('jid'),
				password: this.get('password'),
				boshURL: this.get('boshURL')
			};

			checkAccount(account).then(this.accountCheckSuccess.bind(this, account)).catch(this.accountCheckFailed.bind(this));
		}
	}
});
