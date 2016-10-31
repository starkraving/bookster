module.exports = (function() {

	var props = {
		sessKeyToCheck : 'role',
		loginRedirect  : '/member/login'
	};

	var objReturn = {
		init : function(params) {
			for ( var key in params ) {
				props[key] = params[key];
			}
		},
		requires : function(role) {
			return function(req, res, next) {
				var sess = req.session;
				if ( sess[props.sessKeyToCheck] && sess[props.sessKeyToCheck] == role ){
					next();
				} else {
					res.redirect(props.loginRedirect);
				}
			};
		}
	};

	return objReturn;
})();