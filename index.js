var express = require("express");
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mysql = require('mysql');

var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

var sessionMiddleware = session({
  secret: "keyboard cat"
});
app.use(sessionMiddleware);
app.use(cookieParser());
io.use(function (socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});
var saveSessionKey;
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



server.listen(3000);
var check_game_pad_1 = true;
var check_game_pad_2 = true;

// socket.on("Get_All_Remote_Status", function(){

// })

io.on("connection",function(socket){
  var req = socket.request;
  console.log("test dong 60:"+req.session.user_Name+":" );
  if(req.session.user_Name == null){
        console.log("test dong 62 rong" );
  }
  if(req.session.user_Name != null){
        console.log("da chay vo dong 61");
        db.query("SELECT * FROM users WHERE Username=?", [req.session.user_Name], function(err, rows, fields){
        socket.emit("logged_in", {user: rows[0].Username});
    });
  }
  console.log("co nguoi ket noi "+ socket.id);
  socket.on("from",function(msg){
    console.log("Page type is: " + msg.type);
    switch(msg.type){
        case "Index":
        console.log("on emit from index!");
        console.log("Save: " + saveSessionKey );
        console.log("Client: " + msg.cookie );
        if(msg.cookie != saveSessionKey)
        {
            socket.emit("Cookie_Fail");
        }
        break;
        case "selectRemote":
        // console.log("Save: " + saveSessionKey );
        // console.log("Client: " + msg.cookie );
            if(msg.cookie == saveSessionKey)
            {
                console.log(" Match!");
                socket.on("Transfer_to_selectRemote",function(){
                    console.log("Transfering Page!\r\n");
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
        console.log(" Fail!");
                socket.emit("Cookie_Fail");
            }
                break;
        case "Login":
            console.log("Loging!!");
            socket.on("Client_Login", function(data){
                console.log("Login!!");
                user = data.user,
                pass = data.pass;
                console.log(user + ':' + pass +':');
                if( !user || !pass){
                  socket.emit("Server_Login_Fail");
                }
                else {
                  console.log("da chay vo dong 69");
                  db.query("SELECT * FROM users WHERE Username=?", [user], function(err, rows, fields){
                    if(rows.length == 0){
            
                      socket.emit("Server_Login_Fail");
                    }
                    else{
                      const dataUser = rows[0].Username,  dataPass = rows[0].Password;
                        if(user == dataUser && pass == dataPass){
            
                          req.session.user_Name = rows[0].Username;
                          req.session.save();
// generate session key
                          var str = "";
                          for (; str.length < 32; str += Math.random().toString(36).substr(2));
                          var SessionKey = str.substr(0, 32);
                          saveSessionKey = SessionKey;
                          var saveCookie = {
                                "resUserName": user,
                                "resSessionkey": SessionKey
                          };
                          socket.emit("Server_Login_Sucess",saveCookie);
                        }else{
                          socket.emit("Server_Login_Fail");
                          console.log("tai khoan pass sai");
                        }
                    }
                  });
                }
                if(req.session.user_Name != null){
                  console.log("test dong 110:"+req.session.user_Name+":" );
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
            break;
        }
});

    socket.on("Gamepad_Connect",function(){
    //console.log(socket.adapter.rooms);
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
});
    socket.on("disconnect",function(){
      console.log("co nguoi ngat ket noi "+ socket.id);
      if(socket.Phong=="1"){
        check_game_pad_1 = true;
      }
      else {
        if(socket.Phong=="2"){
          check_game_pad_2 = true;
        }
      }
    });
  socket.on("Gamepad_Command",function(data){
    io.sockets.in(socket.Phong).emit("Server_Commands",data);
    console.log("nut bam : "+ data);
  });

  socket.on("Client_Select_Gamepad",function(data){
      console.log("Stoping here!");
    socket.Phong=data;
  })
});


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