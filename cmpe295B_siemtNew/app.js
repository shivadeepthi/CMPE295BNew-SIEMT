/**
 * Module dependencies.
 */
var http = require('http');
var express = require('express');
var app = module.exports.app = express();
var port=3000;
var SensorTag = require('sensortag');
var path = require('path');
var fs = require('fs');
var mongo=require('./routes/mongoapi');
var bodyParser=require('body-parser');
var cookieParser=require('cookie-parser');
var multer=require('multer');
var nodemailer = require("nodemailer");
var io=require('socket.io');


var smtpTransport = nodemailer.createTransport("SMTP",{
	service: "Gmail",
	auth: {
	user: "chilukuri3@gmail.com",
	pass: "deepthi999"
	}
	});

//all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(bodyParser());
app.use(cookieParser());
//app.use(expressSession({ secret : process.env.SESSION_SECRET||'secret',resave:false,saveuninitialized:false}));
app.use(express.methodOverride());
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


app.get("/chart",function(req,res){
	mongo.getSplineChartData(function(err,reslt){
		if(err){
			throw err;
		}else{
			var recs=JSON.parse(JSON.stringify(reslt));
			console.log(reslt.length);
			var dates=[];
			var temp=[];
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
			
			res.render('charts',{"dates":JSON.stringify(dates),"ambTemp":JSON.stringify(temp)});
		}
	});
	
	/*mongo.getTempPressure(function(err,result){
		if(err){
			throw err;
		} 
		else{
			
		}
		
	});*/
	
});


app.post("/suggestedValue",function(req,res){
	var dp=req.body.datapoint;
	console.log("In post  "+dp);
	if(dp=="Temperature"){
	mongo.suggestTempValue(function(err,result){
		if(err){
			throw err;
		}else{
			var r=result;
			console.log("average temp  "+r);
			mongo.insertPredictedValue(function(err,resl){
				if(err){
					throw err;
				}else{
					console.log("r"+r);
			res.setHeader('Content-Type','application/json');
					res.send(JSON.stringify({rsl:r}));

				}
			},dp,r);
		}
	});
	}else if(dp=="Humidity"){
		mongo.suggestHumdValue(function(err,result){
			if(err){
				throw err;
			}else{
				console.log("average humid  "+result);
				mongo.insertPredictedValue(function(err,resl){
					if(err){
						throw err;
					}else{
						console.log("resl"+resl);
					}
				},dp,result);
			}
		});
		}else if(dp=="Pressure"){
			mongo.suggestPressValue(function(err,result){
				if(err){
					throw err;
				}else{
					console.log("average Press  "+result);
					mongo.insertPredictedValue(function(err,resl){
						if(err){
							throw err;
						}else{
							console.log("resl"+resl);
						}
					},dp,result);
				}
			});
			}
});

var io = require('socket.io').listen(app.listen(3000,function(){
    console.log("We have started our server on port 3000");
   // SensorTag.discover(function(tag) { and close it with }); above ondiscover mthod
    function onDiscover(tag){
		
		tag.on('disconnect', function() {
			console.log('disconnected!');
			process.exit(0);
		});
		
		function connectAndSetUpMe() {			// attempt to connect to the tag
		     console.log('connectAndSetUp' + tag.id);
		     tag.connectAndSetUp(enableDataPoints);	// when you connect, call enableIrTempMe
		    
		   }
		     
			function enableDataPoints(){
				console.log('enabling Temp datapoint');
				tag.enableIrTemperature(notifyMe);
				tag.enableHumidity(notifyHumd);
				tag.enableBarometricPressure(notifyPress);
			}	
			
			function notifyMe(){
				console.log("notifying temp datapoints");
				tag.notifyIrTemperature(listenForReading);
			}
			function notifyHumd(){
				console.log("notifying humd datapoints");
				tag.notifyHumidity(listenForHumdReading);
			}
			function notifyPress(){
				console.log("notify pressure");
				tag.notifyBarometricPressure(listenForPress);
			}
			
				function  listenForReading(){		
					tag.on('irTemperatureChange', function(objectTemp, ambientTemp) {
						
					     console.log('\tObject Temp = %d deg. C', objectTemp.toFixed(1));
					     function TempChange() {
					       	io.sockets.emit('objTemp', { sensorId:tag.id, objTemp: objectTemp, ambTemp: ambientTemp});
					       };
					      TempChange();	 
					       
					   });
				}
				
					function  listenForHumdReading(){
						tag.on('humidityChange', function(temperature, humidity){
					
					     function HumdChange() {
					       	io.sockets.emit('humTemp', { sensorId:tag.id,humTemp: temperature,humidity: humidity });
					       
					       };
					       HumdChange();
					      
					   });
				}
					
					function  listenForPress(){
							tag.on('barometricPressureChange', function(pressure){
								 console.log('\tpressure = %d', pressure.toFixed(1));
					     function PressChange() {
					       	io.sockets.emit('Pressure', {sensorId:tag.id, press: pressure }); 	
					       };
					       PressChange();
					      
					   });
				}
				connectAndSetUpMe();
	}
    SensorTag.discover(onDiscover);
})
);

//io.listen(server);
