var express = require("express");
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mysql = require('mysql');

var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var NumberOfUser = 0;
var Player1_Login_Fail = false;
var Player2_Login_Fail = false;
var First_UserName = null;
var Error_Login = false;
var TwoUserSameTime = false;
app.use(cookieParser());

var saveSessionKey = [];
var index_SessionKey = 0;
var saveUser;
var db = mysql.createConnection({
  host    : 'localhost',
  user    : 'root',
  password: '',
  database: "users"
});

db.connect(function(err) {
  if (err) throw err;
  console.log("mysql Connected!");
  //db.query("CREATE DATABASE users");
  //var sql = "CREATE TABLE users (Username VARCHAR(255), Password VARCHAR(255))";
  // var sql = "INSERT INTO users (Username,Password) VALUES ('admin', 'admin')";
  // db.query(sql, function (err, result) {
  //   if (err) throw err;
  //   console.log("table created");
  // });
  // con.query("SELECT * FROM customers", function (err, result, fields) {
  //   if (err) throw err;
  //   console.log(result);
  // });

  // con.query("SELECT * FROM customers WHERE address = 'Park Lane 38'", function (err, result) {
  //  if (err) throw err;
  //  console.log(result);

});
app.use(express.static("public"));
app.set("view engine","ejs");
app.set("views","./views")



server.listen(80);
var check_game_pad_1 = true;
var check_game_pad_2 = true;
var check_room_1;
var check_room_2;
var check_ready=0;
var check_timeout = 0;
var turn;
// socket.on("Get_All_Remote_Status", function(){

// })

io.on("connection",function(socket){
  var req = socket.request;


  console.log("ID ket noi: "+ socket.id);
  socket.on("from",function(msg){
    //console.log("Page type is: " + msg.type);
    switch(msg.type){
        case "Index":
        //console.log("on emit from index!");
        console.log("Server save Cookie: " + saveSessionKey[0] + "  --  "  + saveSessionKey[1]);
        console.log("Client Send Cookie: " + msg.cookie );
        if((msg.cookie != saveSessionKey[0])&&(msg.cookie != saveSessionKey[1]))
        {
			console.log("Call back login from index!");
            socket.emit("Cookie_Fail");
        }
        socket.join(check_room);
        console.log("Connect GamePad: " + check_room);
		console.log(io.sockets.adapter.rooms);
        break;
        case "selectRemote":
        // console.log("Save: " + saveSessionKey );
        // console.log("Client: " + msg.cookie );
		//console.log("User from selectRemote: " + msg.username + " User Saved: " + saveUser);
            if(((msg.cookie == saveSessionKey[0])||(msg.cookie == saveSessionKey[1])) && (msg.username == saveUser))
            {
                //console.log(" Match!");
                socket.on("Transfer_to_selectRemote",function(){
                    //console.log("Transfering Page!\r\n");
                    var status = {
                        "status1": check_game_pad_1,
                        "status2": check_game_pad_2
                    };
                    socket.emit("Sever_Gamepad_Status",status);
                    console.log(JSON.stringify(status));
                    });
            }
            else{
// New emit
				console.log("Call back login from selectRemote!");
                socket.emit("Cookie_Fail");
            }
                break;
        case "Login":
			if(NumberOfUser == 2)
			{
				//console.log("Over User!");
				NumberOfUser = 1;
			}
			NumberOfUser+=1;
			console.log("Is on user: " + NumberOfUser);
			//console.log("Loging!!");
			if(NumberOfUser == 2)
				{
					console.log("2 User in!");
					if(First_UserName == null)
					{
						//console.log("2 User but didn't input pass!");
						NumberOfUser = 1;
						TwoUserSameTime = true;
					}
				}
			socket.on("Client_Login", function(data){
				//console.log("Login!!");
				user = data.user,
				pass = data.pass;
				//console.log("2 User in, Number of user: " + NumberOfUser);
				if(NumberOfUser == 2)
				{
					if(user == First_UserName)
					{
						Error_Login = true;
						NumberOfUser = 1;
					}
				}
					console.log("User: " + user + '  Pass :' + pass);
				if(Error_Login == true)
				{
					//console.log("User: " + user + " was in use!");
					socket.emit("Server_Login_Fail");
					Error_Login = false;
				}
				else
				{
					if( (!user) || (!pass) )
						{
							socket.emit("Server_Login_Fail");
//							console.log("Invalid user or password!");
							if(NumberOfUser == 1)
								{
									Player1_Login_Fail = true;
								}
								if(NumberOfUser == 2)
								{
									Player2_Login_Fail = true;
								}
						}
					else 
					{
						//console.log("check account!");		
						//console.log("da chay vo dong 69");
						db.query("SELECT * FROM users WHERE Username=?", [user], function(err, rows, fields){
						if(rows.length == 0)
						{
								if(NumberOfUser == 1)
								{
									Player1_Login_Fail = true;
								}
								if(NumberOfUser == 2)
								{
									Player2_Login_Fail = true;
								}
							socket.emit("Server_Login_Fail");
//							console.log("Lengh = 0");
						}
						else
						{
							const dataUser = rows[0].Username,  dataPass = rows[0].Password;
							if(user == dataUser && pass == dataPass)
							{
								saveUser = user;
								if(NumberOfUser == 1)
								{
									First_UserName = user;
									//console.log("User save to check: " + First_UserName);
									if(TwoUserSameTime == true)
									{
										console.log("2 User in, increase!");
										NumberOfUser+=1;
									}
								}
								if(NumberOfUser == 2 && !(TwoUserSameTime))
								{
									//console.log("2User, User login success!");
									NumberOfUser = 0;
									First_UserName = null;
								}
								if((NumberOfUser == 2) && (TwoUserSameTime))
								{
									//console.log("Wanna come here!");
									TwoUserSameTime = false;
								}
								//req.session.user_Name = rows[0].Username;
								//req.session.save();
								// generate session key
								var str = "";
								for (; str.length < 32; str += Math.random().toString(36).substr(2));
								var SessionKey = str.substr(0, 32);
								saveSessionKey[index_SessionKey] = SessionKey;
								index_SessionKey+= 1;
								var saveCookie = 
								{
									"resUserName": user,
									"resSessionkey": SessionKey
								};
								console.log("Cookie Created:  " + SessionKey);
								socket.emit("Server_Login_Sucess",saveCookie);
							}
							else
							{
								console.log("Check account not in SQL");
								if(NumberOfUser == 1)
								{
									Player1_Login_Fail = true;
								}
								if(NumberOfUser == 2)
								{
									Player2_Login_Fail = true;
								}
								socket.emit("Server_Login_Fail");
								//console.log("tai khoan pass sai");
							}
						}
						});
					}
				}
			});
			break;
        case "Register":
		socket.on("Sign_Up", function(data)
            {
              user= data.username;
              pass = data.password;

              db.query("SELECT * FROM users WHERE Username=?", [user], function(err, rows, fields){
                if(rows.length == 0){
                    console.log("Success!");
                  db.query("INSERT INTO users(`Username`, `Password`) VALUES(?, ?)", [user, pass], function(err, result){
                    if(!!err)
                    throw err;
                    console.log(result);
                    socket.emit("Sign_Up_Successfully");
                    //
                  });
                }
                else{
                  socket.emit("Sign_Up_fail");
                }
            });
            });
			if(NumberOfUser == 1)
			{
			NumberOfUser = 0;
			}
			if(NumberOfUser == 2)
			{
				NumberOfUser = 1;
			}
            break;
        }
});

    socket.on("Gamepad_Connect",function(){
		if(check_game_pad_1== true){
		  // true san sang ket noi
		  socket.Phong="1";
		  check_game_pad_1 = false;
		  socket.join(socket.Phong);
		  socket.emit("Gamepad_Ok",socket.Phong);
		}
		else {
		  if(check_game_pad_2==true){
			socket.Phong="2";
			check_game_pad_2 = false;
			socket.join(socket.Phong);
			socket.emit("Gamepad_Ok",socket.Phong);
		  }
		}
		//console.log("gamepab connect" +socket.Phong);

		var status = {
			"status1": check_game_pad_1,
			"status2": check_game_pad_2
		};
		console.log ("Nguoi choi da ket noi: ",socket.Phong )
		io.sockets.emit("Sever_Gamepad_Status",status);
		//console.log ("emit Server_Gamepad_status to everyone")
		console.log(JSON.stringify(status));
	});
    socket.on("disconnect",function(){
      console.log("co nguoi ngat ket noi "+ socket.id);
//	  console.log("Number of user is: " + NumberOfUser);
//	  console.log("Player 1 : " + Player1_Login_Fail + '  Player 2 :' + Player2_Login_Fail);
	  if(Player1_Login_Fail == true) 
	  {
		  NumberOfUser = 1;
		  Player1_Login_Fail = false;
	  }
	  if(Player2_Login_Fail == true)
	  {
		  NumberOfUser = 1;
		  Player2_Login_Fail = false;
	  }
//	  	  console.log("Number of user is 2: " + NumberOfUser);
      if(socket.Phong=="1"){
		  console.log ("ngat ket noi gamepad 1")
        check_game_pad_1 = true;
      }
      else {
        if(socket.Phong=="2"){
			console.log("Ngat ket noi gamepad 2")
          check_game_pad_2 = true;
        }
      }
    });
  socket.on("Gamepad_Command",function(data){

	  if(data== 'right')
		  io.sockets.in(socket.Phong).emit("Server_Commands",'d');
	  if(data== 'left')
		  io.sockets.in(socket.Phong).emit("Server_Commands",'a');
	  if(data== 'down')
		  io.sockets.in(socket.Phong).emit("Server_Commands",'s');
	  if(data== 'up')
		  io.sockets.in(socket.Phong).emit("Server_Commands",'w');
	  if(data== 'ok')
		  io.sockets.in(socket.Phong).emit("Server_Commands",'f');
	  if(data== 'cancle')
		  io.sockets.in(socket.Phong).emit("Server_Commands",'g');

    console.log("nut bam : "+ data);
  });

  socket.on("Client_Select_Gamepad",function(data){
	  if (data == 1)
		  check_game_pad_1 = true;
	  else if (data == 2)
		  check_game_pad_2 = true;
	  
	  var status = {
			"status1": check_game_pad_1,
			"status2": check_game_pad_2
		};
	  io.sockets.emit("Sever_Gamepad_Status",status);
	   
      console.log("Selected GamePad " + data);
      socket.join(data);
      check_room = data;
  });

  socket.on("Client_PlaceShip_Done",function(data){
	  check_ready++;
	  if(check_ready == 2 ){
		  var num = randomNumber()
		  if (num){
			  turn=1;
			  io.sockets.in('1').emit("Server_SelectPlayTurn",true);
			  io.sockets.in('2').emit("Server_SelectPlayTurn",false);
		  }
		  else {
			  io.sockets.in('1').emit("Server_SelectPlayTurn",false);
			  io.sockets.in('2').emit("Server_SelectPlayTurn",true);
			  turn =2;
		  }
		  check_ready = 0;
	  }
  })

  socket.on("Client_Time_Out", function(data){
	  check_timeout ++;
	  console.log("Client Time out " + check_timeout)
	  if (check_timeout == 2){
		  if (turn == 1)
			  turn = 2
		  else turn = 1
		  io.sockets.emit("Server_SwitchRole")
		  check_timeout = 0;
	  }
  })
  socket.on("Client_Shot",function(data){
    //row= data.row;
    //column = data.column;
	console.log("Client shot receive : " + data)
    if (turn == 1)
    {
		console.log("1 shot 2")
      io.sockets.in('2').emit("Server_WereShot",data);
    }
	if (turn == 2){
		console.log("2 shot 1")
	  io.sockets.in('1').emit("Server_WereShot",data);
	}
      
  })
  socket.on("Client_Shot_Result",function(data){
    //row= data.row;
    //column = data.column;
	console.log("Client_Shot_Result : " + data)
	if (turn == 1)
	{
	  io.sockets.in('1').emit("Server_Shot_Result",data);
	}
	  else {
		if (turn == 2)
		  io.sockets.in('2').emit("Server_Shot_Result",data);
	  }
	  if (!data){
		  if (turn == 1)
			  turn = 2
		  else turn = 1
		  io.sockets.emit("Server_SwitchRole")
		  check_timeout = 0;
		  }
		  
  })



});

function randomNumber()
{
	var number = Math.random()
	console.log("random number : " + number)
    return  (number > 0.5) ? 1 : 0;
}

app.get("/", function(req, res){
  res.render("login");
});

app.get("/index", function(req, res){
  res.render("index");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/selectRemote", function(req, res){
  res.render("selectRemote");
});

app.get("/register", function(req, res){
  res.render("register");
});
