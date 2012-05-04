var formidable = require('formidable');
var	http = require('http');
var util = require('util');
var fs = require('fs');
var cradle = require('cradle');
var isConnected = false;
var loginUser = null;
var db    = new(cradle.Connection)().database('users');
var dbPdf = new(cradle.Connection)().database('pdfs');


db.exists(function (err, exists) {
  if (err) {
	console.log('error', err);
  } else if (exists) {
	console.log('database users OK.');
  } else {
	console.log('database does not exists.');
	db.create();
	console.log('database users created.');
  }
});

dbPdf.exists(function (err, exists) {
  if (err) {
	console.log('error', err);
  } else if (exists) {
	console.log('database pdfs OK.');
  } else {
	console.log('database does not exists.');
	db.create();
	console.log('database pdfs created.');
  }
});

db.save('_design/users', {
	all: {
		map: function (doc) {
		if (doc.name) emit(doc.name, doc);
		}
	}
});

dbPdf.save('_design/pdfs', {
	all: {
		map: function (doc) {
			if (doc.user) emit(doc.user, doc);
		}
	}
});

function send(res, filename, mapping, content_type)
{  
	fs.readFile(filename, function(err, data)
	{
		if(err)
		{
			res.writeHead(401, {'content-type': 'text/plain'});
			res.end(String(err));
		}
		else
		{
			if(content_type)
			{
				res.writeHead(200, {'content-type': content_type});
			}	
			else
			{
				res.writeHead(200, {'content-type': 'text/html'});
			}
			
			if(mapping && mapping.length > 0)
			{
				data = String(data);
				
				for(var i = 0; i < mapping.length; i += 2)
				{
					data = data.replace(mapping[i], mapping[i + 1]);
				}
			}
			
			res.end(data);
		}
	});
}

function keygen()
{
	return Math.floor(Math.random() * 10) + Math.floor(Math.random()* 2000000000).toString(36);
}

hostname = 'localhost:8000'

keys = {};

var server = http.createServer(function(req, res)
{
	//console.log(req.url);
	
	var method = req.method.toLowerCase();
	
	if(method == 'get')
	{
		if(req.url == "/")
		{
			do
			{
				key = keygen();
			} while(key in keys);
			
			keys[key] = {token: keygen(), page: 1, clientsInRoom: new Array, leadArray: new Array, totalClients: 0, clientsConnected: 0, timerDelete: null, tabHistoryDraw: new Array};
			
			send(res, 'public/index.html', [/@@key@@/g, key, /@@file@@/g, '', /@@host@@/g, hostname]);
			
		}
		else if(found = req.url.match(/^\/([0-9][a-z0-9]*)$/))
		{
			if(found[1] in keys)
			{
				key = found[1];
				send(res, 'public/view.html', [/@@key@@/g, key, /@@host@@/g, hostname]);
			}
			else
			{
				res.writeHead(301, {'content-type': 'text/plain'});
				res.end('not allowed');
			}		
		}
		else if(found = req.url.match(/^\/([0-9][a-z0-9]*)\.pdf$/))
		{
			if(found[1] in keys)
			{
				send(res, 'pdf/' + found[1] + '.pdf', [], 'application/pdf');
			}
			else
			{
				res.writeHead(401, {'content-type': 'text/plain'});
				res.end('not found');
			}
		}
		else
		{
			send(res, 'public/' + req.url);
		}
	}
	else if(method == 'post')
	{
		var status = '@@status@@';
		if(req.url == '/')
		{
			var form = new formidable.IncomingForm();
			
			
			form.uploadDir="./tmp";
			
			form.parse(req, function(err, fields, files)
			{
				if(fields.status == ('Welcome ' + loginUser))
				{
						var tabPdf = new Array(); 
						dbPdf.view('pdfs/all', function (err, result){
						
							for ( var cle in result ) {
								 for (var k in result[cle])
							  	{				
									  if(k == "value")
									  {
								    	for(var j in result[cle][k])
								    	{
											  if(result[cle][k][j] == loginUser)
											  {
												  tabPdf[cle] = new Array (result[cle][k]['_id'], result[cle][k]['title'], result[cle][k]['_rev']);
											  }
								    	}
									  }		
							   	}
						  	}
						  send(res, 'public/list.html', [/@@key@@/g, key, /@@token@@/g, key, /@@file@@/g, '', /@@host@@/g, hostname,/@@tabPdf@@/g, tabPdf]);
						});
					
				} else if(fields.accountPseudo != undefined)
				{
				  status = "Successful registration";
				  db.get(fields.accountPseudo, function (err, row) 
				  {
					if(err)
					{
					  db.save(fields.accountPseudo, 
					  {
						 name: fields.accountName,
						 firstname: fields.accountFirstname,
						 email: fields.accountEmail,
						 password: SHA1(fields.accountPassword)
					  }, function (err, res) 
					  {
					  });
					  send(res, 'public/index.html', [/@@key@@/g, key, /@@token@@/g, key, /@@file@@/g, '', /@@host@@/g, hostname,/@@status@@/g, status]);
					}
					else
					{
					  send(res, 'public/index.html', [/@@key@@/g, key, /@@token@@/g, key, /@@file@@/g, '', /@@host@@/g, hostname,/@@status@@/g, "Login already used"]);
					}
				  });
				  
				}               
				else if(fields.loginPseudo != undefined)
				{
				  db.get(fields.loginPseudo, function (err, row) 
				  {
					status = "Invalid login or password";
				
					if(err)
					{
					  send(res, 'public/index.html', [/@@key@@/g, key, /@@token@@/g, key, /@@file@@/g, '', /@@host@@/g, hostname,/@@status@@/g, status]);
					}
					else if(row.password == SHA1(fields.loginPassword))
					{
					  isConnected = true;
					  loginUser = fields.loginPseudo;
					  status = "Welcome" + fields.loginPseudo;
					  send(res, 'public/index.html', [/@@key@@/g, key, /@@token@@/g, key, /@@file@@/g, '', /@@host@@/g, hostname,/@@status@@/g, status]);
					}
					else
					{
					  send(res, 'public/index.html', [/@@key@@/g, key, /@@token@@/g, key, /@@file@@/g, '', /@@host@@/g, hostname,/@@status@@/g, status]);
					}
				  });
				}
				else if(fields.DeleteId != undefined)
				{
				  dbPdf.remove(fields.DeleteId, fields.DeleteRev, function (err, res) {
          });
          
          fs.unlink('pdf/' + fields.DeleteId + '.pdf', function(err)
					{
						console.log('removed ' + key + '.pdf', err);
					});
					
				  var tabPdf = new Array(); 
					dbPdf.view('pdfs/all', function (err, result){
					
					for ( var cle in result ) {
						 for (var k in result[cle])
					  	{				
							  if(k == "value")
							  {
						    	for(var j in result[cle][k])
						    	{
									  if(result[cle][k][j] == loginUser)
									  {
									    if(result[cle][k]['_id'] != fields.DeleteId)
										    tabPdf[cle] = new Array (result[cle][k]['_id'], result[cle][k]['title'], result[cle][k]['_rev']);									
									  }
						    	}
							  }		
					   	}
				  	}
					  send(res, 'public/list.html', [/@@key@@/g, key, /@@token@@/g, key, /@@file@@/g, '', /@@host@@/g, hostname,/@@tabPdf@@/g, tabPdf]);
					});
				}
				else if(fields.EditId != undefined)
				{
				  dbPdf.merge(fields.EditId, {
              title: fields.EditTitle
          }, function (err, res) {
              // Handle response
          });
				  console.log("edit : " + fields.EditTitle);
				  
				  var tabPdf = new Array(); 
					dbPdf.view('pdfs/all', function (err, result){
					
					for ( var cle in result ) {
            for (var k in result[cle])
            {				
              if(k == "value")
              {
              	for(var j in result[cle][k])
              	{
					              if(result[cle][k][j] == loginUser)
					              {
					                if(result[cle][k]['_id'] == fields.EditId)
					                  tabPdf[cle] = new Array (result[cle][k]['_id'], fields.EditTitle, result[cle][k]['_rev']);
					                else
						                tabPdf[cle] = new Array (result[cle][k]['_id'], result[cle][k]['title'], result[cle][k]['_rev']);									
					              }
              	}
              }		
            }
          }
					send(res, 'public/list.html', [/@@key@@/g, key, /@@token@@/g, key, /@@file@@/g, '', /@@host@@/g, hostname,/@@tabPdf@@/g, tabPdf]);
					});
				}
				else //Upload
				{
				  if(!(fields.key in keys)) err = "key not recognized";
				  
				  if(err)
				  {
					  res.writeHead(501, {'content-type': 'text/plain'});
					  res.end(util.inspect(err));
				  }
				  else
				  {   
					  fs.rename(String(files.pdf.path), "pdf/" + fields.key + ".pdf", function(err)
					  {
						  if(err)
						  {
							  throw err;
							  res.writeHead(501, {'content-type': 'text/plain'});
							  res.end(String(err));
						  }
						  
						  else
						  {
							var buffer = new Buffer(100);
							fs.open("pdf/" + fields.key + ".pdf",'r',function(err,fd){
							  fs.read(fd,buffer,0,3,1,function(e,l,b){
								if((b.toString('utf8',0,l) == "PDF") && (Math.floor(files.pdf.size / 1024) <= 15000))
								{

								  if(isConnected && loginUser != null)
								  {
									  
									  dbPdf.save(fields.key, {
										  title: files.pdf.name,
										  user: loginUser
									  }, function (err, res) {
										  if (err) {
											  console.log("Error while adding a pdf");
										  } else {
											  console.log("Pdf added");
										  }
									  });
								  }
								  send(res, 'public/index.html', [/@@key@@/g, fields.key, /@@token@@/g, fields.key,
									  /@@file@@/g, "<b>" + files.pdf.name + " " + Math.floor(files.pdf.size / 1024) + "k</b>",
									  /@@host@@/g, hostname, /@@status@@/g,status]);
								}
								else
								{
								  send(res, 'public/index.html', [/@@key@@/g, fields.key, /@@token@@/g, fields.key,
									  /@@file@@/g, 'error', /@@host@@/g, hostname, /@@status@@/g,status]);
								}                                
							  });
							  
							  fs.close(fd);
							});                            
						  }
					  });
				  }
			  }
			});
		}
		else
		{
			res.writeHead(501, {'content-type': 'text/plain'});
			res.end('denied');
		}
	}
});

var io = require('socket.io').listen(server);

PORT = 8000;

server.listen(Number(process.env.PORT || PORT));

function nameAlreadyExist(key, newName)
{
	var nameAlreadyExist = false;
			
	for(var i = 0; i < io.sockets.clients(key).length; ++i)
	{
		io.sockets.clients(key)[i].get('name', function(err, name)
		{	
			if(name == newName)
				nameAlreadyExist = true;
		});
	}
			
	return nameAlreadyExist;
}

function copySocketAttribute(socket)
{
	var attribute;
	
	socket.get('name', function(err, name)
	{
		socket.get('connected', function(err, connected)
		{
			attribute = {'name': name, 'connected': connected};
		});
	});
	
	return attribute;
}

function tokenAlreadyTaken(key)
{
	var tokenAlreadyTaken = false;
	
	for(var i = 0; i < io.sockets.clients(key).length; ++i)
	{
		io.sockets.clients(key)[i].get('token', function(err, token)
		{
			if(token != null)
				tokenAlreadyTaken = true;
		});
	}
	
	return tokenAlreadyTaken;
}

function displayLeadArray()
{
	var str = 'LEADARRAY: ';
	
	for(var i = 0; i < keys[key].leadArray.length; ++i)
	{
		str += keys[key].leadArray[i]['name'] + '/' + keys[key].leadArray[i]['connected'] + ' ';
	}
	
	console.log(str);
}

io.sockets.on('connection', function (socket)
{	
	socket.on('key', function(data)
	{
		key = data.key;
		
		pseudo = data.pseudo;
		
		isRegister = data.isRegister;
		
		if(key in keys)
		{        
			socket.join(key);
			
			socket.set('key', key);
			
			socket.set('register', isRegister);
			
			/* Annulation du timer */
			
			if(keys[key].timerDelete != null)
				clearTimeout(keys[key].timerDelete);
				
			/* Attribution du pseudo */
			
			if(pseudo != null && !nameAlreadyExist(key, pseudo)) // Pseudo en cookie (storage)
			{
				socket.set('name', pseudo);
			
				keys[key].clientsInRoom.push(pseudo);
			
				socket.emit('setName', {name: pseudo});
			
				socket.broadcast.to(key).emit('chat', {chat: pseudo + " has joined the room"});
				socket.emit('chat', {chat: "You are known as " + pseudo});
			}
			else // Pseudo attribué par défaut
			{
				var newClientName = 'Guest' + (keys[key].totalClients + 1);
				
				socket.set('name', newClientName);
			
				keys[key].clientsInRoom.push(newClientName);
			
				socket.emit('setName', {name: newClientName});
			
				socket.broadcast.to(key).emit('chat', {chat: newClientName + " has joined the room"});
				socket.emit('chat', {chat: "You are known as " + newClientName});
			}
			
			socket.set('connected', true);
			
			/* Attribution ou non du token */
			
			if(keys[key].clientsConnected == 0 || !tokenAlreadyTaken(key))
			{
				keys[key].leadArray = new Array;
				keys[key].leadArray.push(copySocketAttribute(socket));
				
				socket.emit('setToken', {token: keys[key].token});
				socket.set('token', keys[key].token);
			}
			else
			{
				socket.set('token', null);
			}
			
			/* Replacement dans le leadArray si nécessaire */
			
			for(var i = 0; i < keys[key].leadArray.length; ++i)
			{
				socket.get('name', function(err, newName)
				{
					var oldName = keys[key].leadArray[i]['name'];
					var connected = keys[key].leadArray[i]['connected'];

					if(!connected && oldName == newName)
					{
						keys[key].leadArray[i] = copySocketAttribute(socket);
					}
				});
			}
			
			/* Mise a jour du chat */
			
			socket.broadcast.to(key).emit('updateRoom', {room: keys[key].clientsInRoom});
			socket.emit('updateRoom', {room: keys[key].clientsInRoom});
			
			socket.emit('savePage', {page: keys[key].page});
			
			/* Incrementation des variables */
			
			keys[key].totalClients++;
			keys[key].clientsConnected++;
			socket.emit('historyDraw', {history: keys[key].tabHistoryDraw});
			
			//displayLeadArray();
		}
		else
		{
			socket.emit('error', {error: "Invalid key"});
		}
	});
	
	socket.on('chefLoadDraw', function (data)
	{
		socket.emit('historyDraw', {history: keys[key].tabHistoryDraw});
	});
	
	socket.on('show', function (data)
	{
		token = data.token;
		
		key = data.key;
		
		if(key in keys && keys[key].token == token)
		{
			keys[key].page = data.page;

			socket.broadcast.to(key).emit('show', {page: data.page});
			socket.emit('show', {page: data.page});
		}
		
		//console.log(data);
	});
	
	socket.on('changeName', function (data)
	{
		key = data.key;
		
		if(key in keys)
		{		
			if(nameAlreadyExist(key,data.newName))
			{
				socket.emit('error', {error: "This name is already use, choose an other one"});
			}
			else
			{
				for(var i = 0; i < keys[key].clientsInRoom.length; ++i)
				{
					if(keys[key].clientsInRoom[i] == data.oldName)
						keys[key].clientsInRoom[i] = data.newName;
				}
				
				socket.set('name', data.newName);
				
				socket.emit('setName', {name: data.newName});
				
				socket.broadcast.to(key).emit('updateRoom', {room: keys[key].clientsInRoom});
				socket.emit('updateRoom', {room: keys[key].clientsInRoom});
				
				socket.broadcast.to(key).emit('chat', {chat: data.oldName + " is now known as " + data.newName});
				socket.emit('chat', {chat: "You are now known as " + data.newName});
			}
		}
	});
	
	socket.on('changeLeader', function (data)
	{
		token = data.token;
		
		key = data.key;
		
		from = data.from;
		
		if(key in keys && keys[key].token == token)
		{	
			for(var i = 0; i < io.sockets.clients(key).length; ++i)
			{	
				io.sockets.clients(key)[i].get('name', function(err, name)
				{
					if(name == data.newLeaderName)
					{
						socket.set('token', null);
						socket.emit('eraseToken');
						
						io.sockets.clients(key)[i].emit('setToken', {token: keys[key].token});
						io.sockets.clients(key)[i].set('token', keys[key].token);
						
						keys[key].leadArray.push(copySocketAttribute(io.sockets.clients(key)[i]));
					}
				});
			}
		}
		
		//displayLeadArray();
	});
	
	socket.on('chat', function (data)
	{
		key = data.key;
		
		if(key in keys)
		{
			socket.emit('chat', {chat: data.chat});
			socket.broadcast.to(key).emit('chat', {chat: data.chat});
		}
	});
	
	socket.on('updateRoom', function (data)
	{
		key = data.key;
		
		if(key in keys)
		{
			socket.broadcast.to(key).emit('updateRoom', {room: keys[key].clientsInRoom});
			socket.emit('updateRoom', {room: keys[key].clientsInRoom});
		}
	});
	
	socket.on('drawFirstPoint', function (data)
	{
		token = data.token;
		key = data.key
		
		if(key in keys && keys[key].token == token)
		{
			
			if (keys[key].tabHistoryDraw[data.page] == null)
				keys[key].tabHistoryDraw[data.page] = new Array;
			keys[key].tabHistoryDraw[data.page].push(data.x + " " + data.y);
		}
				
	});
	
	
	socket.on('draw', function (data)
	{
		token = data.token;
		
		key = data.key;
		
		if(key in keys && keys[key].token == token)
		{
			socket.broadcast.to(key).emit('draw', {page: data.page, x: data.x, y: data.y});
			if (keys[key].tabHistoryDraw[data.page] == null)
				keys[key].tabHistoryDraw[data.page] = new Array;
			keys[key].tabHistoryDraw[data.page].push(data.x + " " + data.y);
		}
	});
	
	socket.on('stopdraw', function (data)
	{
		token = data.token;
		
		key = data.key;
		
		if(key in keys && keys[key].token == token)
		{
			socket.broadcast.to(key).emit('stopdraw', {page: data.page});
			if(keys[key].tabHistoryDraw[data.page] == null)
				keys[key].tabHistoryDraw[data.page] = new Array;
			keys[key].tabHistoryDraw[data.page].push("STOP");
		}
	});
	
	socket.on('erase', function (data)
	{
		token = data.token;
		
		key = data.key;
		
		if(key in keys && keys[key].token == token)
		{
			socket.broadcast.to(key).emit('erase', {page: data.page});
			keys[key].tabHistoryDraw[data.page] = new Array;
		}
	});
	
	socket.on('redDot', function (data)
	{
		token = data.token;
		
		key = data.key;
		
		if(key in keys && keys[key].token == token)
		{
			socket.broadcast.to(key).emit('redDot', {page: data.page, x: data.x, y: data.y});
		}
	});
	
	socket.on('stopRedDot', function (data)
	{
		token = data.token;
		
		key = data.key;
		
		if(key in keys && keys[key].token == token)
		{
			socket.broadcast.to(key).emit('stopRedDot', {});
		}
	});
	
	socket.on('disconnect', function(data, addr)
	{
		socket.get('key', function(err, key)
		{
			if(err || key == undefined)
			{
				console.log(err);
			}
			else
			{
				socket.get('name', function(err, discoName)
				{
					/* Mise a jour du chat */
					
					var clientsInRoomUpdated = new Array;
				
					for(var i = 0; i < keys[key].clientsInRoom.length; ++i)
					{
						if(keys[key].clientsInRoom[i] != discoName)
						{
							clientsInRoomUpdated.push(keys[key].clientsInRoom[i]);
						}
					}
				
					keys[key].clientsInRoom = clientsInRoomUpdated;
				
					socket.broadcast.to(key).emit('updateRoom', {room: keys[key].clientsInRoom});
					socket.broadcast.to(key).emit('chat', {chat: discoName + ' has left the room'});
					
					/* Suppression du socket de la chaîne de lead (si non register)*/
					
					socket.get('register', function(err, isRegister)
					{
						if(isRegister) // l'utilisateur est enregistré, il garde sa position dans la file
						{
							for(var i = 0; i < keys[key].leadArray.length; ++i)
							{				
								if(keys[key].leadArray[i]['name'] == copySocketAttribute(socket)['name'])
								{
									keys[key].leadArray[i]['connected'] = false;
								}				
							}
						}
						else // l'utilisateur n'est pas enregistré, il perd sa position dans la file
						{
							var tempLeadArray = new Array;
							for(var i = 0; i < keys[key].leadArray.length; ++i)
							{
								if(keys[key].leadArray[i]['name'] != copySocketAttribute(socket)['name'])
								{
									tempLeadArray.push(keys[key].leadArray[i]);
								}				
							}
							
							keys[key].leadArray = tempLeadArray;
						}
					});
					
					/* Passage du token */

					socket.get('token', function(err, discoToken)
					{					
						if(discoToken == keys[key].token)
						{					
							for(var i = keys[key].leadArray.length-1; i >= 0; --i)
							{
								var connected = keys[key].leadArray[i]['connected'];

								if(connected)
								{
									var newLeaderSocket;
									
									for(var j = 0; j < io.sockets.clients(key).length; ++j)
									{
										if(keys[key].leadArray[i]['name'] == copySocketAttribute(io.sockets.clients(key)[j])['name'])
										{
											newLeaderSocket = io.sockets.clients(key)[j];
											break;
										}
									}
						
									newLeaderSocket.get('name', function(err, newLeaderName)
									{
										newLeaderSocket.broadcast.to(key).emit('error', {error: discoName + ' has disconnected. ' + newLeaderName + ' become the new conference leader.'});
										newLeaderSocket.emit('setToken', {token: keys[key].token});
										newLeaderSocket.set('token', keys[key].token);
									});
									
									break;
								}				
							}
						}
					});
				});
				
				//displayLeadArray();
				
				keys[key].clientsConnected--;
				
				if((keys[key].clientsConnected) <= 0 && (!isConnected))
				{    
					keys[key].timerDelete = setTimeout(function endConference()
					{				
						fs.unlink('pdf/' + key + '.pdf', function(err)
						{
							console.log('removed ' + key + '.pdf', err);
						});
						
						keys[key].totalClients = 0;
						
					},60000);
				}
			}
		});
	});
});

/**
*
*  Secure Hash Algorithm (SHA1)
*  http://www.webtoolkit.info/
*
**/
 
function SHA1 (msg) {
 
	function rotate_left(n,s) {
		var t4 = ( n<<s ) | (n>>>(32-s));
		return t4;
	};
 
	function lsb_hex(val) {
		var str="";
		var i;
		var vh;
		var vl;
 
		for( i=0; i<=6; i+=2 ) {
			vh = (val>>>(i*4+4))&0x0f;
			vl = (val>>>(i*4))&0x0f;
			str += vh.toString(16) + vl.toString(16);
		}
		return str;
	};
 
	function cvt_hex(val) {
		var str="";
		var i;
		var v;
 
		for( i=7; i>=0; i-- ) {
			v = (val>>>(i*4))&0x0f;
			str += v.toString(16);
		}
		return str;
	};
 
 
	function Utf8Encode(string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	};
 
	var blockstart;
	var i, j;
	var W = new Array(80);
	var H0 = 0x67452301;
	var H1 = 0xEFCDAB89;
	var H2 = 0x98BADCFE;
	var H3 = 0x10325476;
	var H4 = 0xC3D2E1F0;
	var A, B, C, D, E;
	var temp;
 
	msg = Utf8Encode(msg);
 
	var msg_len = msg.length;
 
	var word_array = new Array();
	for( i=0; i<msg_len-3; i+=4 ) {
		j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
		msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
		word_array.push( j );
	}
 
	switch( msg_len % 4 ) {
		case 0:
			i = 0x080000000;
		break;
		case 1:
			i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
		break;
 
		case 2:
			i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
		break;
 
		case 3:
			i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8	| 0x80;
		break;
	}
 
	word_array.push( i );
 
	while( (word_array.length % 16) != 14 ) word_array.push( 0 );
 
	word_array.push( msg_len>>>29 );
	word_array.push( (msg_len<<3)&0x0ffffffff );
 
 
	for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
 
		for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
		for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
 
		A = H0;
		B = H1;
		C = H2;
		D = H3;
		E = H4;
 
		for( i= 0; i<=19; i++ ) {
			temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
 
		for( i=20; i<=39; i++ ) {
			temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
 
		for( i=40; i<=59; i++ ) {
			temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
 
		for( i=60; i<=79; i++ ) {
			temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
 
		H0 = (H0 + A) & 0x0ffffffff;
		H1 = (H1 + B) & 0x0ffffffff;
		H2 = (H2 + C) & 0x0ffffffff;
		H3 = (H3 + D) & 0x0ffffffff;
		H4 = (H4 + E) & 0x0ffffffff;
 
	}
 
	var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
 
	return temp.toLowerCase();
 
}


