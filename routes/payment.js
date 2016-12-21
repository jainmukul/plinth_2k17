var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var Eventx = require('../models/event');
var User = require('../models/user');
var UserEvent = require('../models/userevent');
var Verify = require('./verify');
var Robotics = require('../models/robotics');
var Ecell = require('../models/ecell');
var Quiz = require('../models/quiz');
var Literary = require('../models/literary');
var Astronomy = require('../models/astronomy');
var Cybros = require('../models/cybros');
var Sif = require('../models/sif');
var PaymentDB = require('../models/payment');
var PaymentMUN = require('../models/paymentMUN');
var mongoose = require('mongoose');
var paytm = require('../config/paytm');
var checksum = require('../checksum/checksum');

var hostURL = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://plinth.in'

router.post('/fetchData', Verify.verifyOrdinaryUser, function(req, res) {

    var oneMemberAmount = 100;

    switch(req.body.clubName) {
        case "astronomy":
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
            oneMemberAmount = 200;
            break;
        case "management":
            eventx = Ecell;
            break;
        case "quizzing":
            eventx = Quiz;
            break;
    }

    eventx.find({ 'eventName' : req.body.eventName , 'teamEmail' : req.body.email },function (err, result) {
        if (err){
            return console.error(err);
        }
        else{
            console.log(result);
            response = {
                data : result,
                oneMemberAmount : oneMemberAmount,
            }
            res.json(response);
        }
    });

});


router.get('/initiatepayment', function(req, res) {
    paymentdb = new PaymentDB();
    var oneMemberAmount = 100;
    var id = req.query.id;

    switch(req.query.clubName) {
        case "astronomy":
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
            oneMemberAmount = 200;
            break;
        case "management":
            eventx = Ecell;
            break;
        case "quizzing":
            eventx = Quiz;
            break;
    }

    eventx.find({'_id' : id },function (err, results) {
        if (err){
            return console.error(err);
        }
        else{
            if(results){
                paymentdb.id = id;
                paymentdb.clubName = req.query.clubName;
                paymentdb.eventName = req.query.eventName;
                console.log(results)
                var resultone = results[0];
                timestamp = + new Date();
                paramaters ={
                    REQUEST_TYPE    : "DEFAULT",
                    ORDER_ID        : id + timestamp,
                    CUST_ID         : resultone.teamEmail,
                    TXN_AMOUNT      : oneMemberAmount * resultone.team.length,
                    CHANNEL_ID      :'WEB',
                    INDUSTRY_TYPE_ID : paytm.industryID,
                    MID             : paytm.mid,
                    WEBSITE         : paytm.website,
                    MOBILE_NO       : resultone.teamNumber,
                    EMAIL           : resultone.teamEmail,
                    CALLBACK_URL    : hostURL +  '/payment/response',
                }
                    checksum.genchecksum(paramaters, paytm.key, function (err, result) {
                        paymentdb.order_id = result.ORDER_ID;
                        paymentdb.save(function(err) {
                            if (err){
                                return done(err);
                            }
                            else{
                                res.render('pgredirect.ejs',{ 'restdata' : result });
                            }
                        })
                    });
                }
                else{
                    res.json({status : false});
                }
            }
    });

});

router.post('/mun/initiatepayment', function(req, res) {
    paymentmun = new PaymentMUN;
    var id_tag = process.env.NODE_ENV === 'development' ? 'dev' : '2017'
    if((req.body.type !== "delegate" && req.body.type !== "ip")){
        res.json({status : false, message : "Data Tempered"});
    }
    else{
        amount = req.body.type === "delegate" ? 1300 : 750;
        PaymentMUN.count({}, function(err, count){
            var order_id = "MUN-" + req.body.type + "-" + (count + 1) + "-" + id_tag;
            paymentmun.order_id    = order_id;
            paymentmun.type        = req.body.type;
            paymentmun.name        = req.body.user.name;
            paymentmun.email       = req.body.user.email;
            paymentmun.phoneNumber = req.body.user.phoneNumber;
            paymentmun.institute   = req.body.user.institute;
            paymentmun.amount      = amount;
            paymentmun.status      = "";


            paymentmun.save(function(err) {
                if (err){
                    return done(err);
                }
                else{
                    res.json({ order_id : order_id, status : true})
                }
            });
        });
    }
});

router.get('/mun/initiatepayment', function(req, res) {
    var order_id = req.query.order_id;
    console.log(hostURL)
    PaymentMUN.findOne({'order_id' : order_id },function (err, result) {
            paramaters ={
                REQUEST_TYPE     : "DEFAULT",
                ORDER_ID         : order_id,
                CUST_ID          : result.email,
                TXN_AMOUNT       : result.amount,
                CHANNEL_ID       :'WEB',
                INDUSTRY_TYPE_ID : paytm.industryID,
                MID              : paytm.mid,
                WEBSITE          : paytm.website,
                MOBILE_NO        : result.phoneNumber,
                EMAIL            : result.email,
                CALLBACK_URL     : hostURL + '/payment/mun/response',
            }
            checksum.genchecksum(paramaters, paytm.key, function (err, result) {
                paymentmun.save(function(err) {
                    if (err){
                        return done(err);
                    }
                    else{
                        res.render('pgredirect.ejs',{ 'restdata' : result });
                    }
                })
            });
        });
});

router.post('/response', Verify.verifyOrdinaryUser,function(req,res){
    var paramlist = req.body;

    if(checksum.verifychecksum(paramlist, paytm.key)){
        PaymentDB.findOne({'order_id' : paramlist.ORDERID}, function(err, result){
            if(err){
                console.log(err)
                return;
            }
            else{

                if(paramlist.STATUS === "TXN_FAILURE"){
                    res.render('payment_failed', {
                        clubName : result.clubName,
                    });
                }

                switch(result.clubName) {
                    case "astronomy":
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

                payment = {
                    status   : paramlist.STATUS,
                    order_id : paramlist.ORDERID,
                    date     : paramlist.TXNDATE,
                    amount   : paramlist.TXNAMOUNT
                }
                eventx.findOneAndUpdate({'_id' : result.id}, {$set : {'payment' : payment}},{new: true}, function(err, doc){
                    if(err){
                        console.log(err);
                        return;
                    }
                    else{
                        if(paramlist.STATUS === 'TXN_SUCCESS'){
                            var emails = [];
                            for(var i=0; i<doc.team.length; i++ ){
                                emails.push(doc.team[i].email);
                            }
                            // bulk

                            var bulk = UserEvent.collection.initializeOrderedBulkOp();
                            for(var i=0; i < emails.length; i++){
                                bulk.find({'email': emails[i]}).upsert().update(
                                    {
                                        $push : {paidEvents: result.eventName},
                                        $set  : {email : emails[i]}
                                    }
                                );
                            }
                            bulk.execute();

                            var bulk = User.collection.initializeOrderedBulkOp();
                            for(var i=0; i < emails.length; i++){
                                bulk.find({'email': emails[i]}).update({$push: {paidEvents: result.eventName}});
                            }
                            bulk.execute();

                            res.render('payment_succeed',{
                                details : doc
                            })
                        }
                        else{
                            res.render('payment_open',{
                                amount   : doc.payment.amount,
                                order_id : doc.payment.order_id,
                                eventName : doc.eventName
                            })
                        }
                    }
                });
            }
        })
    }
    else{
        res.render('payment_failed', {
            clubName : result.clubName,
        });
    };
});


router.post('/mun/response', Verify.verifyOrdinaryUser,function(req,res){
    var paramlist = req.body;
    if(checksum.verifychecksum(paramlist, paytm.key)){
        PaymentMUN.findOneAndUpdate({'order_id' : paramlist.ORDERID}, {$set : {'status' : paramlist.STATUS }},{new: true}, function(err, result){
            if(err){
                console.log(err)
                return;
            }
            else{
                console.log(paramlist);
                if(paramlist.STATUS === "OPEN"){
                    res.render('payment_open',{
                        amount   : doc.payment.amount,
                        order_id : doc.payment.order_id,
                        eventName : doc.eventName
                    })
                }
                else if(paramlist.STATUS === 'TXN_SUCCESS'){
                    doc ={
                        team : [
                            {
                                name : result.name,
                                email : result.email,
                                phoneNumber : result.phoneNumber,
                            }
                        ],
                        payment :{
                            order_id : result.order_id,
                            date : paramlist.TXNDATE,
                            amount : paramlist.TXNAMOUNT,
                        },
                        eventName : "MUN 2017"
                    }
                    res.render('payment_succeed',{
                        details : doc
                    })
                }
                else{
                    res.render('payment_failed', {
                        clubName : "",
                    });
                }
            }
        });
    }
    else{
        res.render('payment_failed', {
            clubName : "",
        });
    };
});


module.exports = router;