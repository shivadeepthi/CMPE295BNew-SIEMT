/**
 * Module dependencies.
 */
var http = require('http');
var express = require('express');
var app = module.exports.app = express();
var port=3000;
var db;
var SensorTag = require('sensortag');
var path = require('path');
var fs = require('fs');
var mongo=require('./routes/mongoapi');
var bodyParser=require('body-parser');
var cookieParser=require('cookie-parser');
var multer=require('multer');
var nodemailer = require("nodemailer");
var io=require('socket.io');
var session = require('express-session')
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var mongodb = require('mongodb');


var mongoose = require('mongoose/');
mongoose.connect('mongodb://username:password@ds045704.mongolab.com:45704/cmpe295b_siemt');



db = new mongodb.Db('cmpe295b_siemt', new mongodb.Server(
			'ds045704.mongolab.com', 45704, {
				auto_reconnect : true
			}));

var smtpTransport = nodemailer.createTransport("SMTP",{
	service: "Gmail",
	auth: {
		user: "fromcmpe295bsiemt@gmail.com",
		pass: "cmpe295b"
	}
});

//all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(bodyParser());
app.use(cookieParser());
app.use(session({
  cookieName: 'session',
  secret: 'random_string_goes_here',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));
app.use(express.methodOverride());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); 


if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}


app.get("/",function(req,res){
	res.render('index');
});

app.get("/ruleEngine",function(req,res){
	var temp=10;
	res.render('RuleEngine',{"r":0});
});



app.post('/authenticate',
  passport.authenticate('local', {
    successRedirect: '/loginSuccess',
    failureRedirect: '/loginFailure',
    failureFlash:true
  })
);

app.get('/loginFailure', function(req, res, next) {
  res.render('Index');
});

app.get('/loginSuccess', function(req, res, next) {
  res.render('RuleEngine');
});


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
passport.authenticate('local', { failureFlash: 'Invalid username or password.' });
passport.use(new LocalStrategy(function(username, password, done) {
  process.nextTick(function() {
    // Auth Check Logic
  });
}));

var Schema = mongoose.Schema;
var UserDetail = new Schema({
      username: String,
      password: String
    }, {
      collection: 'userInfo'
    });
var UserDetails = mongoose.model('userInfo', UserDetail);
passport.use(new LocalStrategy(function(username, password, done) {
  process.nextTick(function() {
    UserDetails.findOne({
      'username': username, 
    }, function(err, user) {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false);
      }

      if (user.password != password) {
        return done(null, false);
      }

      return done(null, user);
    });
  });
}));


app.post("/sendEmailAlert",function(req,res){
	//console.log("sending email alert");
	var mess=JSON.stringify(req.body.mess);
	console.log("mess"+mess);
			var mailOptions={
					to : "tocmpe295bsiemt@gmail.com",
					subject :"SIEMT ALERT",
					text : "Rule condition met---"+mess
					}
					//console.log(mailOptions);
					smtpTransport.sendMail(mailOptions, function(error, response){
					if(error){
					//console.log(error);
					res.end("error");
					}else{
					console.log("Message sent");
					}
					});
		});
		
app.get("/temperature",function(req,res){
	var dates=[];
	var temp=[];
	var finalJson=[];
	var piechart=[];
	mongo.getSplineChartData(function(err,reslt){
		if(err){
			throw err;
		}else{
			var recs=JSON.parse(JSON.stringify(reslt));
			//console.log(reslt.length);

			var date;
			for(var k=0;k<reslt.length;k++){
				if(reslt[k]._id!=""){
					date = Date.parse(reslt[k]._id);
					var objTemp=[];
					var ambTemp=[];
					objTemp[0] = date;
					ambTemp[0]= date;
					objTemp[1] = reslt[k].objTemp;
					ambTemp[1] = reslt[k].ambTemp;
					dates.push(objTemp);
					temp.push(ambTemp);
				}

			}
			mongo.getTempMinMax(function(err,result){
				var maxObj=[];
				var minObj=[];
				var maxAmb=[];
				var minAmb=[];
				if(err){
					throw err;
				} 
				else{
					var recs=JSON.parse(JSON.stringify(result));
					

					var date;
					for(var k=result.length-1;k>=0;k--){
						if(result[k]._id!=""){
							date = Date.parse(result[k]._id);
							var objTemp=[];
							var objTemp1=[];
							var objTemp2=[];
							var objTemp3=[];
							objTemp[0] = date;
							objTemp[1] = result[k].objTempMax;
							objTemp1[0] = date;
							objTemp1[1] = result[k].objTempMin;
							objTemp2[0] = date;
							objTemp2[1] = result[k].ambTempMax;
							objTemp3[0] = date;
							objTemp3[1] = result[k].ambTempMin;
							maxObj.push(objTemp);
							minObj.push(objTemp1);
							maxAmb.push(objTemp2);
							minAmb.push(objTemp3);
						}

					}
					
					
					mongo.getPieChartTemp(function(err,piereslt){
						if(err){
							throw err;
						}else{
							var recs=JSON.stringify(piereslt);
							//console.log("retrun from the pie chart::::"+piereslt.length);
							//console.log(piereslt);
					finalJson.push({"chart1":{"dates":dates,"ambTemp":temp}}, {"chart2":{"maxO": maxObj, "minO": minObj, "maxA":maxAmb, "minA": minAmb}});
					
					res.render('temperatureChart',{"minObj":JSON.stringify(finalJson).replace(/\"/g, ""),"pieChart":JSON.stringify(piereslt).replace(/\"/g, "")});
										
						}
					});
				}

			});

		}
	});

});


app.get("/humidity",function(req,res){
	var dates=[];
	var finalJson=[];
	mongo.getSplineHumidityChartData(function(err,reslt){
		if(err){
			throw err;
		}else{
			var recs=JSON.parse(JSON.stringify(reslt));
			//console.log(reslt.length);

			var date;
			for(var k=0;k<reslt.length;k++){
				if(reslt[k]._id!=""){
					date = Date.parse(reslt[k]._id);
					var humidity=[];
					humidity[0] = date;
					humidity[1] = reslt[k].humidity;
					dates.push(humidity);
				}

			}
			mongo.getHumidityMinMax(function(err,result){
				var maxObj=[];
				var minObj=[];
				if(err){
					throw err;
				} 
				else{
					var recs=JSON.parse(JSON.stringify(result));
					

					var date;
					for(var k=result.length-1;k>=0;k--){
						if(result[k]._id!=""){
							date = Date.parse(result[k]._id);
							var Humidity=[];
							var Humidity1=[];
							Humidity[0] = date;
							Humidity[1] = result[k].HumidityMax;
							Humidity1[0] = date;
							Humidity1[1] = result[k].HumidityMin;
							maxObj.push(Humidity);
							minObj.push(Humidity1);
						}

					}
					
					mongo.getPieChartHumidity(function(err,piereslt){
						if(err){
							throw err;
						}else{
							var recs=JSON.stringify(piereslt);
							//console.log("retrun from the pie chart::::"+piereslt.length);
							//console.log(piereslt);
					finalJson.push({"chart1":{"dates":dates}}, {"chart2":{"maxO": maxObj, "minO": minObj}});
					
					res.render('humidityChart',{"minObj":JSON.stringify(finalJson).replace(/\"/g, ""),"pieChart":JSON.stringify(piereslt).replace(/\"/g, "")});
										
						}
					});
				}

			});

		}
	});

});

app.get("/pressure",function(req,res){
	var dates=[];
	var finalJson=[];
	mongo.getSplinePressureChartData(function(err,reslt){
		if(err){
			throw err;
		}else{
			var recs=JSON.parse(JSON.stringify(reslt));
			//console.log(reslt.length);

			var date;
			for(var k=0;k<reslt.length;k++){
				if(reslt[k]._id!=""){
					date = Date.parse(reslt[k]._id);
					var Pressure=[];
					Pressure[0] = date;
					Pressure[1] = reslt[k].pressure;
					dates.push(Pressure);
				}

			}
			mongo.getPressureMinMax(function(err,result){
				var maxObj=[];
				var minObj=[];
				if(err){
					throw err;
				} 
				else{
					var recs=JSON.parse(JSON.stringify(result));
					

					var date;
					for(var k=result.length-1;k>=0;k--){
						if(result[k]._id!=""){
							date = Date.parse(result[k]._id);
							var Pressure=[];
							var Pressure1=[];
							Pressure[0] = date;
							Pressure[1] = result[k].PressureMax;
							Pressure1[0] = date;
							Pressure1[1] = result[k].PressureMin;
							maxObj.push(Pressure);
							minObj.push(Pressure1);
						}

					}
					
					mongo.getPieChartPressure(function(err,piereslt){
						if(err){
							throw err;
						}else{
							var recs=JSON.stringify(piereslt);
							//console.log("retrun from the pie chart::::"+piereslt.length);
							//console.log(piereslt);
					finalJson.push({"chart1":{"dates":dates}}, {"chart2":{"maxO": maxObj, "minO": minObj}});
					
					res.render('pressureChart',{"minObj":JSON.stringify(finalJson).replace(/\"/g, ""),"pieChart":JSON.stringify(piereslt).replace(/\"/g, "")});
										
						}
					});
				}

			});

		}
	});

});

app.get("/reports",function(req,res){

	res.render('reports');
});

// app.get("/getValue",function(req,res){

	

// 		mongo.getTemperatureOfDay(function(err,reslt){
// 		if(err){
// 			throw err;
// 		}else{
// 			var recs=JSON.parse(JSON.stringify(reslt));
// 			console.log(recs.length);
			
// 			console.log(recs);
// 		}

// 		res.json(recs);
// 	});

// // 	

// });


app.post('/checkOptions', function (req, res) {
  //console.log(req.body.option);
  		if(req.body.option=='Temperature')
  		{}



  // db.contactlist.insert(req.body, function(err, doc) {
  //   res.json(doc);
  // });
});


app.post("/getValueOption",function(req,res){
		var options =req.body.option;
		var date =req.body.date;
		var results;
		//console.log("inside post"+date+options);

		mongo.getTemperatureOfDay(function(err,reslt){
		if(err){
			throw err;
		}else{
			var recs=JSON.parse(JSON.stringify(reslt));
			//console.log(recs.length);
			
			//console.log(recs);
		res.json(recs);
		}

	},options,date);



});

app.get("/suggestedValueTemp",function(req,response){
    mongo.suggestTempValue(function(err,result){
          response.json(result);       
    });

});

app.get("/suggestedValuePress",function(req,response){
    mongo.suggestPressValue(function(err,result){
            response.json(result);
       
    });

});

app.get("/suggestedValueHumd",function(req,response){
    mongo.suggestHumdValue(function(err,result){
            response.json(result);
    });
});
app.get("/suggestedValueAmpTemp",function(req,response){
	//console.log("Reached here");
    mongo.suggestAmbTempValue(function(err,result){
            response.json(result);
    });
});


var io = require('socket.io').listen(app.listen(3000,function(){
	console.log("We have started our server on port 3000")
	// SensorTag.discover(function(tag) { and close it with }); above ondiscover mthod
	function onDiscover(tag){

		tag.on('disconnect', function() {
			console.log('disconnected!');
			
			//process.exit(0);
		});

		function connectAndSetUpMe() {			// attempt to connect to the tag
			console.log('connectAndSetUp' + tag.id);
			tag.connectAndSetUp(enableDataPoints);	// when you connect, call enableIrTempMe

		}

		function enableDataPoints(){
			//console.log('enabling Temp datapoint');
			tag.enableIrTemperature(notifyMe);
			tag.enableHumidity(notifyHumd);
			tag.enableBarometricPressure(notifyPress);
			tag.enableAccelerometer(notifyAccel);
			tag.enableMagnetometer(notifyMagneto);
		}	

		function notifyMe(){
			
			tag.notifyIrTemperature(listenForReading);
		}
		function notifyHumd(){
			
			tag.notifyHumidity(listenForHumdReading);
		}
		function notifyPress(){
			
			tag.notifyBarometricPressure(listenForPress);
		}
		function notifyAccel(){
			
			tag.notifyAccelerometer(listenForAcc);
		}
		function notifyMagneto(){
			
			tag.notifyMagnetometer(listenForMagneto);
		}

		function  listenForReading(){		
			tag.on('irTemperatureChange', function(objectTemp, ambientTemp) {

				//console.log('\tObject Temp = %d deg. C', ambientTemp.toFixed(1));
				function TempChange() {
					io.sockets.emit('objTemp', { sensorId:tag.id, objTemp: objectTemp, ambTemp: ambientTemp});
				};
				TempChange();	 

			});
		}

		function  listenForHumdReading(){
			tag.on('humidityChange', function(temperature, humidity){
				//console.log('\thumidity = %d', humidity.toFixed(1));
				function HumdChange() {
					io.sockets.emit('humTemp', { sensorId:tag.id,humTemp: temperature,humidity: humidity });

				};
				HumdChange();

			});
		}

		function  listenForPress(){
			tag.on('barometricPressureChange', function(pressure){
				//console.log('\tpressure = %d', pressure.toFixed(1));
				function PressChange() {
					io.sockets.emit('Pressure', {sensorId:tag.id, press: pressure }); 	
				};
				PressChange();

			});
		}
		function  listenForAcc(){
			
			tag.on('accelerometerChange', function(x,y,z){
				/*console.log('\tAccx = %d', x.toFixed(1));
				console.log('\tAccY = %d', y.toFixed(1));
				console.log('\tAccZ = %d', z.toFixed(1));*/
				function AccChange() {
					io.sockets.emit('Accelero', { sensorId:tag.id,acc: x, ler: y, met:z });
				};
				AccChange();

			});
		}

		function  listenForMagneto(){
			
			tag.on('magnetometerChange', function(x,y,z){
				
				function MagnetoChange() {
					io.sockets.emit('Magneto', { sensorId:tag.id,magX: x, magY: y, magZ:z });
				};
				MagnetoChange();

			});
		}

		connectAndSetUpMe();
	}
	SensorTag.discover(onDiscover);
})
);

