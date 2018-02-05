var express = require('express');
var router = express.Router();
var multer = require('multer');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var db = require('monk')('localhost/my_hotel');

var User = require('../models/user');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/reviews', function(req, res) {
  var reviews = db.get('reviews');
  reviews.find({},{},function(err,reviews){
      res.render('reviews',{
        "reviews":reviews
    });
  });
});

router.get('/bookroom',function(req,res){
	res.render('bookroom');
});

router.get('/login',function(req,res){
	res.render('login');
});

router.get('/register',function(req,res){
	res.render('register');
});

router.post('/register',function(req,res,next){
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	console.log(name);

	//Form validator
	req.checkBody('name','Name field is required').notEmpty();
	req.checkBody('email','Email field is required').notEmpty();
	req.checkBody('email','Invalid email').isEmail();
	req.checkBody('username','Username is required').notEmpty();
	req.checkBody('password','Password is required').notEmpty();
	req.checkBody('password2','Passwords do not match').equals(req.body.password);

	console.log('well well');

	//errors
	var errors = req.validationErrors();

	if(errors){
		console.log('errors aaya hain');
		res.render('register',{
			errors: errors,
			name: name,
			email: email,
			username: username
		});
	}else{
		var newUser = new User({
			errors: errors,
			name: name,
			email: email,
			username: username,
			password: password,
		});

		//Create user
		User.createUser(newUser,function(err,user){
			if(err) throw err;
			console.log(user);
		});

		//success message
		req.flash('success','you are now registered.');
		res.location('/');
		res.redirect('/');
	}
});

router.post('/reviews',function(req,res,next){
  console.log("he yaa");
  var username = req.body.username;
  var body = req.body.body;

  req.checkBody('username','username is required').notEmpty();
  req.checkBody('body','Review is required').notEmpty();

  var errors = req.validationErrors();

  if(errors){
    console.log("we");
    var reviews = db.get("reviews");
    res.render('reviews',{
      "errors" : errors,
      "reviews" : reviews
    });
  }else{
    console.log("he");
    var reviews = db.get("reviews");
    reviews.insert({
      "username":username,
      "body":body
    },function(err,review){
      if(err){
        res.send("error");
      }else{
        req.flash('success','review submitted');
        res.location('/');
        res.redirect('/');
      }
    });
  }
});

passport.serializeUser(function(user,done){
	done(null,user.id);
});

passport.deserializeUser(function(id,done){
	User.getUserById(id,function(err,user){
		done(err,user);
	});
});

passport.use(new LocalStrategy(
	function(username,password,done) {
		User.getUserByUsername(username,function(err,user){
			if(err) throw err;
			if(!user){
				console.log('Unknown user');
				return done(null,false,{message:'Unknown User'});
			}

			User.comparePassword(password,user.password,function(err,isMatch){
				if(err) throw err;
				if(isMatch){
					return done(null,user);
				}else{
					console.log('Invalid password');
					return done(null,false,{message:'Invalid password'});
				}
			});
		});
	}
));

router.post('/login',passport.authenticate('local',{failureRedirect:'/users/login',failureFlash:'Invalid username or password'}),function(req,res){
	console.log('Authentication success');
	req.flash('success','you are now logged in');
	res.redirect('/');
});

router.get('/logout',function(req,res){
	req.logout();
	req.flash('success','you have logged out');
	res.redirect('/users/login');
});

module.exports = router;
