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
	var dates=[];
	var temp=[];
	var finalJson=[];
	var piechart=[];
	mongo.getSplineChartData(function(err,reslt){
		if(err){
			throw err;
		}else{
			var recs=JSON.parse(JSON.stringify(reslt));
			console.log(reslt.length);

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
							console.log("retrun from the pie chart::::"+piereslt.length);
							
							/*piechart.push({"name":"abc", "y":reslt[0].count10},
									{"name":"def", "y":reslt[0].count30},
									{"name":"dgh", "y":reslt[0].count60},
									{"name":"jkl", "y":reslt[0].count90},
									{"name":"nmk", "y":reslt[0].count120},
									{"name":"iop", "y":reslt[0].count150}
									);
							var newpie =JSON.parse(piechart);*/
								console.log(piereslt);
					finalJson.push({"chart1":{"dates":dates,"ambTemp":temp}}, {"chart2":{"maxO": maxObj, "minO": minObj, "maxA":maxAmb, "minA": minAmb}});
					
					res.render('charts',{"minObj":JSON.stringify(finalJson).replace(/\"/g, ""),"pieChart":JSON.stringify(piereslt).replace(/\"/g, "")});
					
					// write another function..and so on and close accordingly
					
						}
					});
				}

			});

		}
	});

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
			tag.enableAccelerometer(notifyAccel);
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
		function notifyAccel(){
			console.log("notify Accerlerometer");
			tag.notifyAccelerometer(listenForAcc);
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
		function  listenForAcc(){
			tag.on('accelerometerChange', function(x,y,z){

				function AccChange() {
					io.sockets.emit('Accelero', { sensorId:tag.id,acc: x, ler: y, met:z });

				};
				AccChange();

			});
		}


		connectAndSetUpMe();
	}
	SensorTag.discover(onDiscover);
})
);

//io.listen(server);
