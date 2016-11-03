var express = require('express');
var router = express.Router();


/**
 *Displays a search form along with a list of the top 10 books
 */
router.get('', function(req, res){
	res.render("books", {role: req.session.role, title: ""});
});

/**
 *Redirects based on the type of search
 */
router.post('/search', function(req, res){
	
	res.redirect("/books/search/isbn/:isbn");
});

/**
 *Displays search results with a form to submit a new search
 */
router.get('/search/isbn/:isbn', function(req, res){
	res.render("books_search_isbn_isbn", {role: req.session.role, title: " search isbn :isbn"});
});

/**
 *Displays search results, along with a form to specify a new search
 */
router.get('/search/state/:state', function(req, res){
	res.render("books_search_state_state", {role: req.session.role, title: " search state :state"});
});

/**
 *Displays search results, along with a form to specify a new search
 */
router.get('/search/user/:user', function(req, res){
	res.render("books_search_user_user", {role: req.session.role, title: " search user :user"});
});

module.exports = router;