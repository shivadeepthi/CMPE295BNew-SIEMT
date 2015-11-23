var mongodb = require('mongodb');
//url='mongodb://username:password@ds045704.mongolab.com:45704/cmpe295b_siemt';
var db;

function createUser(callback, userfirstname, userlastname, username, email,
		password, userprofile) {
	console.log('inserting into mongodb');
	db = new mongodb.Db('cmpe295b_siemt', new mongodb.Server(
			'ds045704.mongolab.com', 45704, {
				auto_reconnect : true
			}), {});
	db.open(function(err, db) {
		db.authenticate('username', 'password', function(err) {
			if (err) {
				throw err;
			} else {
				db.collection('user', function(err, collection) {
					doc = {
						"FirstName" : userfirstname,
						"LastName" : userlastname,
						"userName" : username,
						"Email" : email,
						"password" : password,
						"userprofile" : userprofile
					}
					collection.insert(doc, function(err, res) {
						if (err) {
							throw err;
						} else {
							callback(null, res);
							console.log('inserted');
						}
						db.close();
					});
				});
			}
		});
	});
}

function checkUser(callback, username, passwd) {
	console.log('authenticating user');
	db = new mongodb.Db('cmpe295b_siemt', new mongodb.Server(
			'ds045704.mongolab.com', 45704, {
				auto_reconnect : true
			}), {});
	db.open(function(err, db) {
		db.authenticate('username', 'password', function(err) {
			if (err) {
				throw err;
			} else {
				var collec = db.collection('user');
				console.log("username  " + username + "  " + "passwd   "
						+ passwd);
				var cursor = collec.find({
					$and : [ {
						"userName" : username
					}, {
						"password" : passwd
					} ]
				});
				console.log("cursor length  " + cursor.length);
				cursor.each(function(err, doc) {
					if (doc != null) {
						console.log(doc);
						callback(null, doc);
					} else {
						callback(null, null);
					}
				});
			}
		});
	});
}

function updatePassword(callback, username, currentpassword, newpassword) {
	console.log("update password");
	var un = username;
	console.log("username  " + username);
	var np = newpassword;
	db = new mongodb.Db('cmpe295b_siemt', new mongodb.Server(
			'ds045704.mongolab.com', 45704, {
				auto_reconnect : true
			}), {});
	db.open(function(err, db) {
		db.authenticate('username', 'password', function(err) {
			if (err) {
				throw err;
			} else {
				console.log("db.collection('user').update( { userName:" + un
						+ "  },{ $set: {password:" + np + "} }");
				db.collection('user').update(
						{
							"userName" : un
						},
						{
							$set : {
								"password" : np
							}
						},
						function(err, results) {
							if (err) {
								throw err;
							} else {
								console.log("set new password   "
										+ JSON.stringify(results));
								callback(null, results);
							}
						});
			}
		});
	});
}

function getRules(callback){
	console.log("getting rules");
	db=new mongodb.Db('cmpe295b_siemt', new mongodb.Server('ds045704.mongolab.com', 45704, {auto_reconnect:true}), {});
	db.open(function(err, db) {
		db.authenticate('username','password',function(err){
			if(err){
				throw err;
			}else{
				var i=0;
				var cursor=db.collection('Rule').find({}).toArray(function(err, docs) {
				    console.log(docs.length);
				    console.log("Found the following records");
				    console.log(docs);
				    callback(null,docs);
				  });	
			}
		});
	});
}



function getSplineChartData(callback){
	console.log("getting temp and timestamp");
	db=new mongodb.Db('cmpe295b_siemt', new mongodb.Server('ds045704.mongolab.com', 45704, {auto_reconnect:true}), {});
	db.open(function(err, db) {
		db.authenticate('username','password',function(err){
			if(err){
				throw err;
			}else{
				var cursor=db.collection('temp').aggregate([{$group : {_id : { $substr: [ "$timeStamp", 0, 10] }, objTemp : {$avg : "$ObjectTemp"},ambTemp:{$avg : "$AmbientTemp"}}},{ $sort : { _id : 1 } }]).toArray(function(err, docs) {
				    
				    callback(null,docs);
				  });	
			}
		});
	});
}

function getTempMinMax(callback){
	db=new mongodb.Db('cmpe295b_siemt', new mongodb.Server('ds045704.mongolab.com', 45704, {auto_reconnect:true}), {});
    
	db.open(function(err, db) {
		db.authenticate('username','password',function(err){
			if(err){
				throw err;
			}else{
				var cursor=	db.collection('temp').aggregate( [{ $match: { $and: [{ ObjectTemp: {$lt: 90, $gt: 0 } }, { AmbientTemp: {$lt: 90, $gt: 0 } }] }},{ $group: {_id: {$substr: ["$timeStamp", 0, 10]}, objTempMax: { $max: "$ObjectTemp" }, objTempMin: { $min: "$ObjectTemp" }, ambTempMax: { $max: "$AmbientTemp" }, ambTempMin: { $min: "$AmbientTemp" } } },
				           	                 {$sort: {_id: -1}}, {$limit:7}] ).toArray(function(err, docs){
					console.log(docs.length);
				    console.log("Found the following in max min records");
				    console.log(docs);
				    callback(null,docs);

				  });
				
			
			}
		});
	});
}


function suggestTempValue(callback){
	console.log("getting the recommended value for objtemp");
	db=new mongodb.Db('cmpe295b_siemt', new mongodb.Server('ds045704.mongolab.com', 45704, {auto_reconnect:true}), {});
	db.open(function(err, db) {
		db.authenticate('username','password',function(err){
			if(err){
				throw err;
			}else{
				var cursor=db.collection('temp').aggregate([{$group : {_id : { $substr: [ "$timeStamp", 0, 10] }, objTemp : {$avg : "$ObjectTemp"}}},{ $sort : { _id : -1 } },{$limit:5}]).toArray(function(err,docs){
					console.log(docs.length);
				    console.log("Found the following records");
				    console.log(docs);
				    var sumTemp=0;
				    var objTempRecommndedvalu=0;
				    for(var j=0;j<docs.length;j++){
				    	console.log(docs[j].objTemp);
				    	sumTemp=sumTemp+(docs[j].objTemp);
				    	console.log(sumTemp);
				    }
				    objTempRecommndedvalu=sumTemp/(docs.length);
				    console.log("avg"+objTempRecommndedvalu);
				    callback(null,objTempRecommndedvalu);
				});
			}
		});
	});
}

function suggestHumdValue(callback){
	console.log("getting the recommended value for humid");
	db=new mongodb.Db('cmpe295b_siemt', new mongodb.Server('ds045704.mongolab.com', 45704, {auto_reconnect:true}), {});
	db.open(function(err, db) {
		db.authenticate('username','password',function(err){
			if(err){
				throw err;
			}else{
				var cursor=db.collection('humidity').aggregate([{$group : {_id : { $substr: [ "$timeStamp", 0, 10] }, humid : {$avg : "$Humidity"}}},{ $sort : { _id : -1 } },{$limit:5}]).toArray(function(err,docs){
					console.log(docs.length);
				    console.log("Found the following records");
				    console.log(docs);
				    var sumhumd=0;
				    var humidRecommndedvalu=0;
				    for(var j=0;j<docs.length;j++){
				    	console.log(docs[j].humid);
				    	sumhumd=sumhumd+(docs[j].humid);
				    	console.log(sumhumd);
				    }
				    humidRecommndedvalu=sumhumd/(docs.length);
				    console.log("avg "+humidRecommndedvalu);
				    callback(null,humidRecommndedvalu);
				});
			}
		});
	});
}

function suggestPressValue(callback){
	console.log("getting the recommended value for pressure");
	db=new mongodb.Db('cmpe295b_siemt', new mongodb.Server('ds045704.mongolab.com', 45704, {auto_reconnect:true}), {});
	db.open(function(err, db) {
		db.authenticate('username','password',function(err){
			if(err){
				throw err;
			}else{
				var cursor=db.collection('pressure').aggregate([{$group : {_id : { $substr: [ "$timeStamp", 0, 10] }, press : {$avg : "$Pressure"}}},{ $sort : { _id : -1 } },{$limit:5}]).toArray(function(err,docs){
					console.log(docs.length);
				    console.log("Found the following records");
				    console.log(docs);
				    var sumpress=0;
				    var pressRecommndedvalu=0;
				    for(var j=0;j<docs.length;j++){
				    	console.log(docs[j].press);
				    	sumpress=sumpress+(docs[j].press);
				    	console.log(sumpress);
				    }
				    pressRecommndedvalu=sumpress/(docs.length);
				    console.log("avg "+pressRecommndedvalu);
				    callback(null,pressRecommndedvalu);
				});
			}
		});
	});
}



function insertPredictedValue(callback,datapoint,predVal){
	console.log("getting the predicted values for datapoints");
	predVal=parseInt(predVal);
	var datapoint1="\""+datapoint+"\"";
	console.log(datapoint1);
	db=new mongodb.Db('cmpe295b_siemt', new mongodb.Server('ds045704.mongolab.com', 45704, {auto_reconnect:true}), {});
	db.open(function(err, db) {
		db.authenticate('username','password',function(err){
			if(err){
				throw err;
			}else{
				console.log("db.collection('predictionValues').update( { \"_id\" : \"pid\" },{ $set: {"+datapoint1+":"+predVal + "} }");
				if(datapoint=="Temperature"){
				db.collection('predictionValues').update(
						{
							"_id" : "pid"
						},
						{
							$set : {
								"Temperature": predVal
							}
						},
						function(err, results) {
							if (err) {
								throw err;
							} else {
								console.log("updated suggested value"+ JSON.stringify(results));
								callback(null, results);
							}
						});
				}else if(datapoint=="Humidity"){
					db.collection('predictionValues').update(
							{
								"_id" : "pid"
							},
							{
								$set : {
									"Humidity": predVal
								}
							},
							function(err, results) {
								if (err) {
									throw err;
								} else {
									console.log("updated suggested value"+ JSON.stringify(results));
									callback(null, results);
								}
							});
					}else if(datapoint=="Pressure"){
						db.collection('predictionValues').update(
								{
									"_id" : "pid"
								},
								{
									$set : {
										"pressure": predVal
									}
								},
								function(err, results) {
									if (err) {
										throw err;
									} else {
										console.log("updated suggested value"+ JSON.stringify(results));
										callback(null, results);
									}
								});
						}
//				console.log("{\"_id\":\""+pid+"\"},[['_id','asc']],{$set:{"+datapoint1+":"+predVal+"}},{}");
//				db.collection("predictionValues").findAndModify({"_id":"pid"},[['_id','asc']],{$set:{datapoint1:predVal}},{},function(err,reslt){
//					if(err){
//						console.log("i'm error");
//						throw err;
//					}else{
//						callback(null,reslt);
//					}
//				});
			}
		});
	});
}



/*
function insertTemp(callback, objectTemp, ambientTemp) {
	console.log('inserting into mongodb');
	db = new mongodb.Db('cmpe295b_siemt', new mongodb.Server(
			'ds045704.mongolab.com', 45704, {
				auto_reconnect : true
			}), {});
	db.open(function(err, db) {
		db.authenticate('username', 'password', function(err) {
			if (err) {
				throw err;
			} else {
				db.collection('temp', function(err, collection) {
					doc = {
						"ObjectTemp" : objectTemp,
						"AmbientTemp" : ambientTemp,
						"timeStamp" : new Date()
					}
					collection.insert(doc, function(err, res) {
						if (err) {
							throw err;
						} else {
							callback(null, res);
							console.log('inserted');
						}
						db.close();
					});
				});
			}
		});
	});
}

function insertHumd(callback, temperature, humidity) {
	console.log('inserting into mongodb');
	db = new mongodb.Db('cmpe295b_siemt', new mongodb.Server(
			'ds045704.mongolab.com', 45704, {
				auto_reconnect : true
			}), {});
	db.open(function(err, db) {
		db.authenticate('username', 'password', function(err) {
			if (err) {
				throw err;
			} else {
				db.collection('humidity', function(err, collection) {
					doc = {
						"Temperature" : temperature,
						"Humidity" : humidity,
						"timeStamp" : new Date()
					}
					collection.insert(doc, function(err, res) {
						if (err) {
							throw err;
						} else {
							callback(null, res);
							console.log('inserted');
						}
						db.close();
					});
				});
			}
		});
	});
}

function insertPress(callback, pressure) {
	console.log('inserting into mongodb');
	db = new mongodb.Db('cmpe295b_siemt', new mongodb.Server(
			'ds045704.mongolab.com', 45704, {
				auto_reconnect : true
			}), {});
	db.open(function(err, db) {
		db.authenticate('username', 'password', function(err) {
			if (err) {
				throw err;
			} else {
				db.collection('pressure', function(err, collection) {
					doc = {
						"Pressure" : pressure,
						"timeStamp" : new Date()
					}
					collection.insert(doc, function(err, res) {
						if (err) {
							throw err;
						} else {
							callback(null, res);
							console.log('inserted');
						}
						db.close();
					});
				});
			}
		});
	});
}

function ruleEngine(callback, rulename, parameter, criteria, value, action) {
	console.log('rule Engine');
	db = new mongodb.Db('cmpe295b_siemt', new mongodb.Server(
			'ds045704.mongolab.com', 45704, {
				auto_reconnect : true
			}), {});
	db.open(function(err, db) {
		db.authenticate('username', 'password', function(err) {
			if (err) {
				throw err;
			} else {
				db.collection('rules', function(err, collection) {
					doc = {
						"Rule Name" : rulename,
						"Attribute" : parameter,
						"Condition" : criteria,
						"Value" : value,
						"Action" : action
					}
					collection.insert(doc, function(err, res) {
						if (err) {
							throw err;
						} else {
							callback(null, res);
							console.log('inserted rule');
						}
						db.close();
					});
				});
			}
		});
	});
}

//db.collection('user').findAndModify({ 'userName': username },
//{$set: { "password": newpassword } },
function fetchTempChart(callback, chartname) {
	console.log("i am here mongo");
	db = new mongodb.Db('cmpe295', new mongodb.Server('ds031982.mongolab.com',
			31982, {
				auto_reconnect : true
			}), {});
	db.open(function(err, p_client) {
		db.authenticate('cmpe295', 'cmpe295', function(err) {
			if (err)
				throw err;
			else {
				var collec = db.collection('attributes');
				collec.findOne({
					"name" : chartname
				}, function(err, recs) {
					if (err) {
						throw err;
					} else {
						if (recs.length != 0) {
							console.log("insde find method");
							console.log(recs);
							callback(err, recs);
						} else {
							callback(err, null);
						}
					}
				});
			}
		});
	});
}

function alertTemp(callback, chartname, condi, adata) {
	console.log("i am here mongo");
	db = new mongodb.Db('cmpe295', new mongodb.Server('ds031982.mongolab.com',
			31982, {
				auto_reconnect : true
			}), {});
	db.open(function(err, p_client) {
		db.authenticate('cmpe295', 'cmpe295', function(err) {
			if (err)
				throw err;
			else {
				var collec = db.collection('attributes');
				console.log("chartname" + chartname + "condi" + condi + "data"
						+ adata);
				//				 var suvqry="{"+condi+":"+adata+"}";
				//				 var subq=JSON.parse(JSON.stringify(suvqry));
				//				 var sq=subq.replace("\'", "");
				//				 console.log(sq);
				if (condi == "$gte") {
					console.log("inside GTE");
					console.log(adata);
					var numval = parseInt(adata);
					var qury = {
						$and : [ {
							"name" : chartname,
							"data_temp.temp_value" : {
								$gte : numval
							}
						} ]
					};
					console.log(qury);
					collec.findOne(qury, function(err, recs) {
						if (err) {
							throw err;
						} else {
							if (recs) {
								console.log("insde find method");
								console.log(recs);
								callback(err, recs);
							}

							else {
								//  callback(err,"rule not met");
								console.log("rule not met");
							}

						}
					});
				} else if (condi == "$gt") {
					console.log("inside GT");
					console.log(adata);
					var numval = parseInt(adata);
					var qury = {
						$and : [ {
							"name" : chartname,
							"data_temp.temp_value" : {
								$gt : numval
							}
						} ]
					};
					console.log(qury);
					collec.findOne(qury, function(err, recs) {
						if (err) {
							throw err;
						} else {
							if (recs) {
								console.log("insde find method");
								console.log(recs);
								callback(err, recs);
							}

							else {
								//						//   callback(err,null);
								console.log("something is wrng");
							}

						}
					});
				} else if (condi == "$lt") {
					console.log("inside LT");
					console.log(adata);
					var numval = parseInt(adata);
					var qury = {
						$and : [ {
							"name" : chartname,
							"data_temp.temp_value" : {
								$lt : numval
							}
						} ]
					};
					console.log(qury);
					collec.findOne(qury, function(err, recs) {
						if (err) {
							throw err;
						} else {
							if (recs) {
								console.log("insde find method");
								console.log(recs);
								callback(err, recs);
							}

							else {
								//						//   callback(err,null);
								console.log("something is wrng");
							}

						}
					});
				} else if (condi == "$lte") {
					console.log("inside LTE");
					console.log(adata);
					var numval = parseInt(adata);
					var qury = {
						$and : [ {
							"name" : chartname,
							"data_temp.temp_value" : {
								$lte : numval
							}
						} ]
					};
					console.log(qury);
					collec.findOne(qury, function(err, recs) {
						if (err) {
							throw err;
						} else {
							if (recs) {
								console.log("insde find method");
								console.log(recs);
								callback(err, recs);
							}

							else {
								//						//   callback(err,null);
								console.log("something is wrng");
							}

						}
					});
				}
			}
		});

	});
}

function fetchHumidityCharts(callback, chartname) {
	console.log("i am here mongo");
	db = new mongodb.Db('cmpe295', new mongodb.Server('ds031982.mongolab.com',
			31982, {
				auto_reconnect : true
			}), {});
	db.open(function(err, p_client) {
		db.authenticate('cmpe295', 'cmpe295', function(err) {
			if (err)
				throw err;
			else {
				var collec = db.collection('attributes');
				collec.findOne({
					"name" : chartname
				}, function(err, recs) {
					if (err) {
						throw err;
					} else {
						if (recs.length != 0) {
							console.log("insde find method");
							console.log(recs);
							callback(err, recs);

						} else {
							callback(err, null);
						}
					}
				});
			}
		});

	}
*/

exports.createUser=createUser;
exports.checkUser=checkUser;
exports.updatePassword=updatePassword;
exports.getRules=getRules;
exports.getSplineChartData=getSplineChartData;
exports.getTempMinMax=getTempMinMax;
exports.suggestTempValue=suggestTempValue;
exports.suggestHumdValue=suggestHumdValue;
exports.suggestPressValue=suggestPressValue;
exports.insertPredictedValue=insertPredictedValue;
//exports.insertTemp=insertTemp;
//exports.insertHumd=insertHumd;
//exports.insertPress=insertPress;
	