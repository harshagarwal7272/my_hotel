var express = require('express');
var router = express.Router();
var multer = require('multer');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var db = require('monk')('localhost/my_hotel');

var User = require('../models/user');
var Hotel = require('../models/hotel_database');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/our_resort', function(req, res, next) {
  res.render('our_resorts');
});


router.get('/profile',ensureAuthenticated, function(req, res) {
  var rooms_database = db.get('rooms_database');
  var hotels = db.get('hotel_database');
  var user__id = req.user._id;


//  hotels.update({hotel_name:"Subu"},{$push:{pasand:user__id}});

  rooms_database.find({user_id:user__id},function(err,rooms){
    res.render('profile',{
      "rooms":rooms
    });
  });
});

router.post('/profile',function(req,res){
  var hotel_name = req.body.hotel_name;
  console.log(hotel_name);
  var room_id = req.body.room_id;
  var hotels = db.get('hotel_database');
  var rooms = db.get('rooms_database');
  var rooms_to_add = 0;
  var valid = "nope";
  rooms.findOne({_id:room_id},function(err,room){
    if(err){
      console.log(err);
      return;
    }else{
      if(room.valid=="available"){
        rooms_to_add = parseInt(room.cnt_room);
      }
      hotels.findOne({hotel_name:hotel_name},function(err,hotel){
        if(err){
          console.log(err);
          return;
        }else{
          var upd_value = hotel.rooms + rooms_to_add;
          hotels.update({hotel_name:hotel_name},{$set:{rooms:upd_value}});
          rooms.remove({_id:room_id});
          req.flash('success','u successfully cancelled the booking,par paise wapis nai karunga :P');
          res.location('/');
          res.redirect('/');
        }
      });
    }
  });
});

router.get('/reviews', function(req, res) {
  var reviews = db.get('reviews');
  var admin = null;
  var username = null;
  if(req.user!=null)
  {
    username = req.user.username;
  }
  if(username=="admin")
  {
    admin = "admin";
  }
  reviews.find({},{},function(err,reviews){
      res.render('reviews',{
        "reviews":reviews,
        "admin":admin
    });
  });
});

router.get('/hotels',function(req,res){
  var hotels = db.get('hotel_database');
  hotels.find({},{},function(err,hotels){
    res.render('hotels',{
      "hotels":hotels
    });
  });
});

router.post('/hotels',function(req,res){
  var hotels = db.get('hotel_database');
  var hotel_id = req.body.hotel_id;
  var username = req.user.username;
  hotels.findOne({_id:hotel_id},function(err,hotel){
    if(err){
      console.log(err);
      return;
    }else{
      var counter = hotel.pasand_count;
      if(counter==null || counter==NaN)
      {
        counter=0;
      }
      var is_present=false;
      for(var i=0;i<counter;i++)
      {
        if(hotel.pasand[i]==username)
        {
          is_present=true;
        }
      }
      if(is_present==false){
        hotels.update({_id:hotel_id},{$push:{pasand:username}});
        hotels.update({_id:hotel_id},{$set:{pasand_count:counter+1}});
        res.location('/users/hotels');
        res.redirect('/users/hotels');
      }else{
        var counter = hotel.pasand_count;
        hotels.update({_id:hotel_id},{$set:{pasand_count:counter-1}});
        var pasand = hotel.pasand;
        var index = pasand.indexOf(username);
        pasand.splice(index,1);
        hotels.update({_id:hotel_id},{$set:{pasand:pasand}});
        res.location('/users/hotels');
        res.redirect('/users/hotels');
      }
    }
  });
});

router.get('/hotels/:id',function(req,res){
  var hotels = db.get('hotel_database');
  hotels.findOne(req.params.id,function(err,hotel){
      if(err){
        console.log(err);
      }else {
        res.render('hotel',{
          "hotel":hotel
        });
      }
  });
});

router.get('/bookroom/:id',function(req,res){
  var hotels = db.get('hotel_database');
  hotels.findOne(req.params.id,function(err,hotel){
    if(err){
      console.log(err);
    }else{
	   res.render('bookroom',{
       "hotel":hotel
     });
    }
  });
});

router.post('/bookroom',function(req,res){

  var hotel_id = req.body.hotel_id;
  var hotel_name = req.body.hotel_name;
  var adults = req.body.cnt_adult;
  var child = req.body.cnt_child;
  var visit_date = req.body.visit_date;
  var leave_date = req.body.leave_date;
  var room = req.body.cnt_room;
  var type = req.body.room_type;
  var user_id = req.user._id;
  var valid = req.body.valid;
  var jane_ka_date = new Date(visit_date);
  var wapis_ka_date = new Date(leave_date);
  var current_date = new Date();

  var date_error=0;

  if(jane_ka_date.getYear()<current_date.getYear())
  {
    console.log('year');
    date_error=1;
  }
  else if(jane_ka_date.getYear()==current_date.getYear())
  {
    if(jane_ka_date.getMonth()<current_date.getMonth())
    {
      console.log('month');
      date_error=1;
    }
    else if(jane_ka_date.getMonth()==current_date.getMonth())
    {
      if(jane_ka_date.getDate()<current_date.getDate())
      {
        date_error=1;
      }
    }
  }

  if(jane_ka_date.getYear()>wapis_ka_date.getYear())
  {
    date_error=1;
  }
  else if(jane_ka_date.getYear()==wapis_ka_date.getYear())
  {
    if(jane_ka_date.getMonth()>wapis_ka_date.getMonth())
    {
      date_error=1;
    }
    else if(jane_ka_date.getMonth()==wapis_ka_date.getMonth())
    {
      if(jane_ka_date.getDate()>=wapis_ka_date.getDate())
      {
        date_error=1;
      }
    }
  }

  req.checkBody('cnt_adult','Enter the number of adults.').notEmpty();
  req.checkBody('cnt_child','Enter the number of child.').notEmpty();
  req.checkBody('visit_date','Enter the start date.').notEmpty();
  req.checkBody('leave_date','Enter the leave date.').notEmpty();
  req.checkBody('cnt_room','Enter the number of rooms.').notEmpty();

  var errors = req.validationErrors();

  var hotels = db.get('hotel_database');

  if(errors){
    hotels.findOne({_id: hotel_id},function(err,hotel){
      if(err){
        console.log(err);
      }
      else{

  //      hotel.updateOne(document,{$set:},null);
        res.render('bookroom',{
          "hotel":hotel,
          "errors":errors,
          "cnt_adult":adults,
          "cnt_child":child,
          "visit_date":visit_date,
          "leave_date":leave_date,
          "cnt_room":room,
          "room_type":type
      });
    }
    });
  }else if(date_error==1){
    console.log("date error");
    hotels.findOne({_id: hotel_id},function(err,hotel){
      if(err){
        console.log(err);
        return;
      }
      res.render('bookroom',{
        "hotel":hotel,
        "errors":[{"msg":"Invalid dates provided"}],
        "cnt_adult":adults,
        "cnt_child":child,
        "visit_date":visit_date,
        "leave_date":leave_date,
        "cnt_room":room,
        "room_type":type
    });
    });
  }else{
      hotels.findOne({_id:hotel_id},function(err,hotel){
        var upd_room = hotel.rooms-room;
        if(upd_room<0){
          req.flash('failure','Room booking failed.Not enough rooms available');
          res.location('/');
          res.redirect('/');
        }else{
          var hotels = db.get('hotel_database');
          hotels.update({_id:hotel_id},{ $set:{rooms:upd_room} },null);
          var rooms_database = db.get('rooms_database');
          rooms_database.insert({
            "user_id":user_id,
            "hotel_id":hotel_id,
            "hotel_name":hotel_name,
            "cnt_adult":adults,
            "cnt_child":child,
            "visit_date":visit_date,
            "leave_date":leave_date,
            "cnt_room":room,
            "room_type":type,
            "valid":valid
          },function(err,room){
            if(err){
              res.send("there was as issue submitting");
            }else{
              req.flash('success','congo u booked the room');
              res.location('/');
              res.redirect('/');
            }
        });
      }
      });
  }
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

router.post('/reviews',ensureAuthenticated,function(req,res,next){
  var kya_karu = req.body.kya_karu;
  if(kya_karu=="delete"){
    var reviews = db.get('reviews');
    var id = req.body.review_id;
    console.log(id);
    reviews.remove({"_id": id},function(err){
      if(err){
        console.log(err);
        return;
      }
      req.flash('success','review deleted');
      res.location('/');
      res.redirect('/');
    });
  }else{
    var username = req.user.username;
    var body = req.body.body;

  /*
    var users = db.get("users");
    var username;
    users.findOne(user_id,function(err,user){
      username = user.username
      console.log(username);
    });
  */

    console.log(username);
    req.checkBody('body','Review is required').notEmpty();

    var errors = req.validationErrors();

    if(errors){
      console.log(errors);
      var reviews = db.get("reviews");
      reviews.find({},{},function(err,reviews){
          res.render('reviews',{
            "errors":errors,
            "reviews":reviews
        });
      });
    }else{
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

function ensureAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }else{
    req.flash('danger','please log In first');
    res.redirect('/users/login');
  }
}

module.exports = router;
