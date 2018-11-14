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
io.use(function (socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});
app.use(sessionMiddleware);
app.use(cookieParser());







var db = mysql.createConnection({
  host    : 'localhost',
  user    : 'root',
  password: '',
  database: "users"
});

db.connect(function(err) {
  if (err) throw err;
  console.log("mysql Connected!");
  //con.query("CREATE DATABASE users");
  //var sql = "CREATE TABLE users (Username VARCHAR(255), Password VARCHAR(255))";
  //  //var sql = "INSERT INTO customers (name) VALUES ('Company Inc', 'Highway 37')";
  // con.query(sql, function (err, result) {
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
  socket.on("Client_Login", function(data){
    user = data.user,
    pass = data.pass;
    console.log(user + ':' + pass +':');
    if( !user || !pass){
      socket.emit("Server_Login_Fail");
      console.log("loi");
    }
    else {
      console.log("da chay vo dong 69");
      db.query("SELECT * FROM users WHERE Username=?", [user], function(err, rows, fields){
        if(rows.length == 0){

            db.query("INSERT INTO users(`Username`, `Password`) VALUES(?, ?)", [user, pass], function(err, result){
              if(!!err)
              throw err;
              console.log(result);
              socket.emit("Server_Login_Sucess");
            });

        }
        else{
          const dataUser = rows[0].Username,  dataPass = rows[0].Password;
            if(user == dataUser && pass == dataPass){
              socket.emit("Server_Login_Sucess");
              console.log("login thanh cong");
              req.session.user_Name = rows[0].Username;
              req.session.save();
              console.log(rows[0].Username);
              console.log("test dong 100:"+req.session.user_Name+":" );
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

    //console.log(socket.adapter.rooms);
    //console.log("test bien  "+ check_game_pad_1 + "bien 2" + check_game_pad_2);
  });
  socket.on("Gamepad_Command",function(data){
    io.sockets.in(socket.Phong).emit("Server_Command",data);
    console.log("nut bam : "+ data);
  });


  socket.on("Client_Login",function(data){
    var sql = 'SELECT * FROM customers WHERE name = ' + mysql.escape(data);
    con.query(sql, function (err, result) {
      if (err) throw err;
      if(result== null)
      {
        console.log("ten nguoi choi hop le");
        socket.emit("Server_Login_Sucess");
        con.query('INSERT INTO customers (name) VALUES (?)', data);
      }
      else {
        console.log("ten nguoi choi da ton tai");
        socket.emit("Server_Login_Fail");
      }
    });
  });
  socket.on("Client_Gamepad_Status",function(){
    io.sockets.emit("Sever_Gamepad_Status",{status1:check_game_pad_1,status2:check_game_pad_2});
  });
  //con.query('INSERT INTO customers (name) VALUES (?)', data); // chay dc
  //var sql = "INSERT INTO customers (name) VALUES (?)";
  //con.query(sql,data, function (err, result) {
  //if (err) throw err;


  // con.query(sql, function (err, result) {
  //   if (err) throw err;
  //   console.log("table created");
  // });
  // con.query("SELECT * FROM customers", function (err, result, fields) {
  //   if (err) throw err;
  //   console.log(result);
  // });
  //
  // 	var  mang=[];
  // 	for(r in socket.adapter.rooms){
  // 		mang.push(r);
  // 	}
  // 	io.sockets.emit("server-send-rooms",mang);
  //
  // 	//socket.emit("server-send-room-socket",data)
  //
  //
  //
  // socket.on("client-send-chat",function(data){
  // 	io.sockets.in(socket.Phong).emit("server-send-Message",data);
  // });
});
app.get("/", function(req, res){
  res.render("login");
});

app.get("/index", function(req, res){
  res.render("index");
});

app.get("/selectRemote", function(req, res){
  res.render("selectRemote");
});
