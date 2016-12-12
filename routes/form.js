var express = require('express');
var router = express.Router();
var Eventx = require('../models/event');
var User = require('../models/user');
var Verify = require('./verify');
var Sif = require('../models/sif');
var Robotics = require('../models/robotics');
var Ecell = require('../models/ecell');
var Quiz = require('../models/quiz');
var Literary = require('../models/literary');
var Astronomy = require('../models/astronomy');
var Cybros = require('../models/cybros');


router.get('/sif/startup', Verify.verifyOrdinaryUser ,function(req, res) {
    ecell = process.env.ECELL;
    poc = process.env.POC;
    if(req.decoded.sub === "" || (ecell.indexOf(req.decoded.sub) === -1 && poc.indexOf(req.decoded.sub) === -1)){
         isLoggedIn = false;
         res.redirect('../../../');
     }
    Sif.find(function (err, results) {
        if (err){
            return console.error(err);
        }
        else{

            User.findOne({'email' : req.decoded.sub }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);
                // check to see if theres already a user with that email
                if (user){
                    console.log(results[0]);
                    res.render('partials/startup',{
                        results : results,
                        isLoggedIn : true,
                        user : user,
                    });
                }
            });
        }
    });
});

router.get('/sif/startup', Verify.verifyOrdinaryUser ,function(req, res) {
    var poc = process.env.POC;
    if(req.decoded.sub === "" || (ecell.indexOf(req.decoded.sub) === -1 && poc.indexOf(req.decoded.sub) === -1)){
         isLoggedIn = false;
         res.redirect('../../../');
     }
    Sif.find(function (err, results) {
        if (err){
            return console.error(err);
        }
        else{
            User.findOne({'email' : req.decoded.sub }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);
                // check to see if theres already a user with that email
                if (user){
                    console.log(results[0]);
                    res.render('partials/startup',{
                        results : results,
                        isLoggedIn : true,
                        user : user,
                    });
                }
            });
        }
    });
});

router.get('/participants/*', Verify.verifyOrdinaryUser ,function(req, res) {
    console.log(req.params['0']);
    console.log(req.query.event)
    var poc = process.env.POC;

    var poc = process.env.POC;
    if(req.decoded.sub === "" || (poc.indexOf(req.decoded.sub) === -1)){
         isLoggedIn = false;
         res.redirect('../../../');
     }

    switch(req.params['0']) {
        case "astronomy":
            eventx = Astronomy;
            break;
        case "Astronomy":
            eventx = Astronomy;
            break;
        case "coding":
            eventx = Cybros;
            break;
        case "literature":
            eventx = Literary;
            break;
        case "robotics":
            eventx = Robotics;
            break;
        case "management":
            eventx = Ecell;
            break;
        case "quizzing":
            eventx = Quiz;
            break;
    }


    eventx.find({'eventName' : 'armageddon'},function (err, results) {
        if (err){
            return console.error(err);
        }
        else{
            User.findOne({'email' : req.decoded.sub }, function(err, user) {
                // if there are any errors, return the error
                if (err){
                    return done(err);
                }
                // check to see if theres already a user with that email
                if (user){
                    res.render('partials/team',{
                        results : results,
                        isLoggedIn : true,
                        user : user,
                    });
                }
            });
        }
    });
});




module.exports = router;
