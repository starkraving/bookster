var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var validator       = require('validator');
var notification    = require('../models/mw.notification.js');

module.exports = (function(){

	var bookModel = mongoose.model('bookItems', new Schema({
		googleID: String,
		volumeInfo: {
			title: String,
			authors: [String],
			description: String,
			industryIdentifiers: [{}],
			categories: [String],
			imageLinks: {
				smallThumbnail: String,
				thumbnail: String
			}
		},
		owners: [String],
		trades: [{
			requester: String,
			requestee: String
		}]
	}));

	var objReturn = {

		find: function(criteria, callback) {
			bookModel.find(criteria).exec(function(err, results){
				if ( err || !results ) results = [];
				callback(results);
			});
		},

		insert: function(bookData, callback) {
			console.log(bookData);
			var book = new bookModel(bookData).save(function(err, doc, rowsaffected){
				callback();
			});
		},

		insertTrade: function(id, tradeData, callback) {
			if ( !tradeData.requester || !tradeData.requestee || !validator.isEmail(tradeData.requester) || !validator.isEmail(tradeData.requestee) ) {
				callback();
			} else {
				bookModel.findOne({googleID: id}).exec(function(err, book){
					if ( err || !book ) {
						callback();
					} else {
						var trades = book.trades;
						var foundTrade = trades.filter(function(trade){
							return ( trade.requester == tradeData.requester && trade.requestee == tradeData.requestee );
						});
						if ( foundTrade.length > 0 ) {
							callback();
						} else {
							book.trades.push(tradeData);
							book.save(function(err, doc, rowsaffected){
								callback();
							});
						}
					}
				});
			}
		},

		cancelTrade: function(id, tradeData, callback) {
			bookModel.findOne({googleID: id}).exec(function(err, book){
				if ( err || !book ) {
					callback();
				} else {
					book.trades = book.trades.filter(function(trade){
						return ( trade.requester != tradeData.requester || trade.requestee != tradeData.requestee );
					});
					book.save(function(err, doc, rowsaffected){
						callback();
					});
				}
			});
		},

		rejectTrade: function(id, tradeData, callback) {
			bookModel.findOne({googleID: id}).exec(function(err, book){
				if ( err || !book ) {
					callback();
				} else {
					book.trades = book.trades.filter(function(trade){
						if ( trade.requester != tradeData.requester || trade.requestee != tradeData.requestee ) {
							return true;
						} else {
							notification.create(tradeData.requester, tradeData.requestee+' rejected your trade request for '+book.volumeInfo.title);
							return false;
						}
					});
					book.save(function(err, doc, rowsaffected){
						callback();
					});
				}
			});
		},

		acceptTrade: function(id, tradeData, callback) {
			if ( !tradeData.requester || !tradeData.requestee || !validator.isEmail(tradeData.requester) || !validator.isEmail(tradeData.requestee) ) {
				callback();
			} else {
				bookModel.findOne({googleID: id}).exec(function(err, book){
					if ( err || !book ) {
						callback();
					} else {
						var requesteePos = book.owners.indexOf(tradeData.requestee);
						var requesterPos = book.owners.indexOf(tradeData.requester);
						if ( requesteePos == -1 ) {
							callback();
						} else {
							book.owners.splice(requesteePos, 1);
							if ( requesterPos == -1 ) {
								book.owners.push(tradeData.requester);
								notification.create(tradeData.requester, tradeData.requestee+' accepted your trade request for '+book.volumeInfo.title);
							}
							book.trades = book.trades.filter(function(trade){
								if ( trade.requestee != tradeData.requestee ) {
									return true;
								} else if ( trade.requester != tradeData.requester ) {
									notification.create(trade.requester, tradeData.requestee+' traded '+book.volumeInfo.title+' to someone else');
								}
								return false;
							});
							book.save(function(err, doc, rowsaffected){
								callback();
							});
						}
					}
				});
			}
		},

		update: function(id, newBookData, callback) {
			bookModel.findOne({googleID: id}).exec(function(err, book){
				if ( err || !book ) {
					callback();
				} else {
					for ( var key in newBookData ) {
						book[key] = newBookData[key];
					}
					book.save(function(err, doc, rowsaffected){
						callback();
					});
				}
			});
		},

		remove: function(id, callback) {
			bookModel.findOne({googleID: id}).exec(function(err, book){
				if ( err || !book ) {
					callback();
				} else {
					book.remove(function(err, doc, rowsaffected){
						callback();
					});
				}
			});
		},

		removeOwner: function(id, email, callback) {
			bookModel.findOne({googleID: id}).exec(function(err, book){
				if ( err || !book ) {
					callback();
				} else {
					var bookOwners = book.owners;
					var idx = bookOwners.indexOf(email);
					if ( idx > -1 ) {
						bookOwners.splice(idx, 1);
						book.owners = bookOwners;
						book.save(function(err, doc, rowsaffected){
							callback();
						});
					} else {
						callback();
					}
				}
			});
		}
		
	};

	objReturn.allBooks = function(req, res, next) {
		objReturn.find(null, function(results){
			res.allBooks = results;
			next();
		});
	};

	objReturn.myBooks = function(req, res, next) {
		objReturn.find({owners:{ $in: [req.session.memberInfo.email] }}, function(results){
			res.myBooks = results;
			next();
		});
	};

	objReturn.myTrades = function(req, res, next) {
		objReturn.find(null, function(results){
			var trades = {requester: [], requestee: []};
			for ( var i in results ) {
				var book = results[i];
				var requesterTrades = book.trades.filter(function(trade){
					return ( trade.requester == req.session.memberInfo.email );
				});
				var requesteeTrades = book.trades.filter(function(trade){
					return ( trade.requestee == req.session.memberInfo.email );
				});
				if ( requesterTrades.length > 0 ) {
					trades.requester.push({googleID: book.googleID, volumeInfo: book.volumeInfo, trades: requesterTrades});
				}
				if ( requesteeTrades.length > 0 ) {
					trades.requestee.push({googleID: book.googleID, volumeInfo: book.volumeInfo, trades: requesteeTrades});
				}
			}
			res.myTrades = trades;
			next();
		});
	};

	objReturn.ownersByBook = function(scope) {
		return function(req, res, next) {
			objReturn.find({googleID: req[scope].id}, function(results){
				res.owners = ( results.length ) ? results[0].owners : [];
				next();
			});
		};
	}

	return objReturn;

})();