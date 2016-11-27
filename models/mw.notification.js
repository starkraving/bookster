var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;
var validator   = require('validator');

module.exports = (function(){
	var notificationModel = mongoose.model('booksNotification', new Schema({
		'email'		: String,
		'message'	: String
	}));

	var objReturn = {

		create: function(email, message) {
			if ( !validator.isEmail(email) ) return;
			var notification = new notificationModel({
				email: email,
				message: message
			}).save();
		},

		deleteByEmail: function(email) {
			if ( !validator.isEmail(email) ) return;
			notificationModel.find({email: email}).exec(function(err, messages){
				if ( err || !messages ) return;
				for ( var i in messages ) {
					messages[i].remove();
				}
			});
		},

		getAndClear: function(req, res, next) {
			notificationModel.find({email: req.session.memberInfo.email}).exec(function(err, messages){
				if ( err || !messages ) messages = [];
				res.notifications = messages;
				for ( var n in messages ) {
		    		messages[n].remove();
		    	}
		    	next();
			});
		}
		
	};

	return objReturn;
	
})();