var express = require("express");
var cookieParser = require('cookie-parser');
//var session = require('express-session');
var mysql = require('mysql');
//var async = require("async");
//var util = require('util')

var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var Gamepad1_Connected = false;

app.use(cookieParser());

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: "users"
});

db.connect(function(err) {
    if (err) throw err;
    console.log("mysql Connected!");
    Create_New_table()
});

//db.query_promise = util.promisify(db.query)
//module.exports = db
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views")

server.listen(80);
var check_game_pad_1 = true;
var check_game_pad_2 = true;
var check_room = 0;
var check_ready = 0;
var check_timeout = 0;
var turn;

var UserGlobal = new Map()
var Room2Users = new Map()
var Array_Gamepad = []

//io.set('heartbeat timeout', 7000); 
//io.set('heartbeat interval', 3000);

io.on("connection", function(socket) {
    var req = socket.request;
    console.log("ID ket noi: " + socket.id);
    socket.check_connect_gamepad = null // kiem tra gamepad hay client connect
    /**************************************
     ********Connection handler page*******
     **************************************/
    socket.on("from", function(msg) {
        //console.log("Page type is: " + msg.type);
        var temp = CheckSession(msg.cookie)
        console.log("temp: " + temp)
        if (temp != null)
            if (msg.type != temp)
                socket.emit("Change_Page", temp)


        console.log("cookie: " + msg.cookie)
        socket.player = true
        CompairSession(msg.cookie, socket)
        switch (msg.type) {
            case "index":
                HandlerIndexPage(socket, msg)
                break;
            case "selectRemote":
                HandlerSelectremotePage(socket, msg)
                break;
            case "login":
                HandlerLoginPage(socket, msg)
                break;
            case "register":
                HandlerRegisterPage(socket, msg)
                break;
            default:
                break;
        }
        console.log("socket.name : " + socket.username)
    });

    socket.on("disconnect", function() {
        //phuong
        console.log("disconnect")
        if (socket.check_connect_gamepad != null) {
            var numberOfElementInArray = Array_Gamepad.findIndex(myFunction);
		
            function myFunction(value, index, array) {
                return value.address == socket.check_connect_gamepad;
            }
            Array_Gamepad.splice(numberOfElementInArray, 1)
            io.sockets.emit('Server_Gamepad_Status', Array_Gamepad);
			console.log(Array_Gamepad)
			console.log(" dis game pab disconnect")

        }


    });
    /************************************************************************/



    /********************************************
     ********select gamepad related socket*******
     ********************************************/
    socket.on("Client_Gamepad_Status", function() {

        socket.emit("Server_Gamepad_Status", Array_Gamepad);
        console.log(Array_Gamepad)
    });

    socket.on("Client_Select_Gamepad", function(data) {
        temp = UserGlobal.get(socket.username)
        if (temp.page == "selectRemote") {
            console.log("Selected GamePad " + data);
            // phuong

            var numberOfElementInArray = Array_Gamepad.findIndex(myFunction);

            function myFunction(value, index, array) {
                return value.address == data;
            }

            //Array_Gamepad[numberOfElementInArray].status = false
            if (Array_Gamepad[numberOfElementInArray].status == true) {
                Array_Gamepad[numberOfElementInArray].status = false
                io.sockets.emit('Server_Gamepad_Status', Array_Gamepad);

                console.log(UserGlobal);
                temp = UserGlobal.get(socket.username)
                temp.gamepad = data
                temp.page = "room"
                UserGlobal.set(socket.username, temp)

                socket.emit("Change_Page", "./room")

            } else {
                socket.emit("Change_Page", "./selectRemote")
            }

        }

    });

    socket.on("Change_Gamepad", function() {
        console.log("Change_Gamepad trigger")
        temp = UserGlobal.get(socket.username)
        gamepad_name = temp.gamepad

        var numberOfElementInArray = Array_Gamepad.findIndex(myFunction);

        function myFunction(value, index, array) {
            return value.address == gamepad_name;
        }
        Array_Gamepad[numberOfElementInArray].status = true
        io.sockets.emit('Server_Gamepad_Status', Array_Gamepad);

        temp2 = UserGlobal.get(socket.username)
        temp2.page = "selectRemote"
        UserGlobal.set(socket.username, temp2)
        socket.emit("Change_Page", "./selectRemote")
    })

    /************************************************************************/

    

    /**************************************
     ********Gamepad related socket*******
     **************************************/
    socket.on("Gamepad_Connect", function(data) {
		
        console.log("Gamepad connect from ESP " + data)
        //phuong
        
        socket.check_connect_gamepad = data
        socket.join(data)
		var length = io.sockets.adapter.rooms[data].length
		if(  length != 2 )
		{
			var temp = { "address": data, "status": true }
			Array_Gamepad.push(temp) //mang nay se luu dang sach gamepad dang ket noi
		}
		else
		{
			var temp = { "address": data, "status": false }
			Array_Gamepad.push(temp) //mang nay se luu dang sach gamepad dang ket noi
		}
		io.sockets.emit('Server_Gamepad_Status', Array_Gamepad);
		

    });

    socket.on("Gamepad_Command", function(data) {
        var gamepad_room_name = socket.check_connect_gamepad
        if (data == 'right')
            socket.to(gamepad_room_name).emit("Server_Commands", 'd');
        if (data == 'left')
            socket.to(gamepad_room_name).emit("Server_Commands", 'a');
        if (data == 'down')
            socket.to(gamepad_room_name).emit("Server_Commands", 's');
        if (data == 'up')
            socket.to(gamepad_room_name).emit("Server_Commands", 'w');
        if (data == 'ok')
            socket.to(gamepad_room_name).emit("Server_Commands", 'f');
        if (data == 'cancle')
            socket.to(gamepad_room_name).emit("Server_Commands", 'g');

        console.log("nut bam : " + data);
    });
    /************************************************************************/



    /**************************************
     ********Gameplay related socket*******
     **************************************/
    socket.on("Client_PlaceShip_Done", function(data) {
        var room_name = UserGlobal.get(socket.username).room
        io.sockets.adapter.rooms[room_name].check_ready += 1;
        console.log("Placeship_ done: " + io.sockets.adapter.rooms[room_name].check_ready)
        console.log(io.sockets.adapter.rooms[room_name].length)
        var check_ready = io.sockets.adapter.rooms[room_name].check_ready;
        if (check_ready == 2) {
            var num = randomNumber()
            if (num) {
                //io.sockets.adapter.rooms[room_name].turn = 1;
                socket.emit("Server_SelectPlayTurn", true);
                socket.to(room_name).emit("Server_SelectPlayTurn", false);
            } else {
                socket.emit("Server_SelectPlayTurn", false);
                socket.to(room_name).emit("Server_SelectPlayTurn", true);
                //io.sockets.adapter.rooms[room_name].turn = 2;
            }
            io.sockets.adapter.rooms[room_name].check_ready = 0;
        }
    })

    socket.on("Client_Time_Out", function(data) {
        var room_name = UserGlobal.get(socket.username).room

        io.sockets.adapter.rooms[room_name].check_timeout++
        console.log("Client Time out " + io.sockets.adapter.rooms[room_name].check_timeout)
        if (io.sockets.adapter.rooms[room_name].check_timeout == 2) {
            // if (io.sockets.adapter.rooms[room_name].turn == 1)
            //     io.sockets.adapter.rooms[room_name].turn = 2
            // else io.sockets.adapter.rooms[room_name].turn = 1
            io.in(room_name).emit("Server_SwitchRole")
            io.sockets.adapter.rooms[room_name].check_timeout = 0;
        }
    })

    socket.on("Client_Shot", function(data) {
        var room_name = UserGlobal.get(socket.username).room

        console.log("Client shot receive : " + data)
        // if (io.sockets.adapter.rooms[room_name].turn == 1) {
        //     console.log("1 shot 2")
        //     io.sockets.in('2').emit("Server_WereShot", data);
        // }
        // if (io.sockets.adapter.rooms[room_name].turn == 2) {
        //     console.log("2 shot 1")
        //     io.sockets.in('1').emit("Server_WereShot", data);
        // }
        socket.to(room_name).emit("Server_WereShot", data)
    })

    socket.on("Client_Shot_Result", function(data) {
        var room_name = UserGlobal.get(socket.username).room

        console.log("Client_Shot_Result : " + data)
        // if (turn == 1) {
        //     io.sockets.in('1').emit("Server_Shot_Result", data);
        // } else {
        //     if (turn == 2)
        //         io.sockets.in('2').emit("Server_Shot_Result", data);
        // }
        socket.to(room_name).emit("Server_Shot_Result", data)
        if (!data) {
            // if (turn == 1)
            //     turn = 2
            // else turn = 1
            //io.sockets.emit("Server_SwitchRole")
            io.in(room_name).emit("Server_SwitchRole")
            io.sockets.adapter.rooms[room_name].check_timeout = 0;
        }
    })

    socket.on("Client_Hit_Vibration", function(data) {
        var gamepad = UserGlobal.get(socket.username).gamepad
        var room_name = UserGlobal.get(socket.username).room
        //switch (data) {
        //case "Hit":
        // if (turn == 1) {
        //     io.sockets.in('1').emit("Server_SendVibra", data);
        // } else if (turn == 2) {
        //     io.sockets.in('2').emit("Server_SendVibra", data);
        // }
        console.log("ban trung ")
        socket.to(gamepad).emit("Server_SendVibra", data)
        // break;
        //case "EndGame":
        // if (turn == 1) {
        //     io.sockets.in('1').emit("Server_SendVibra", data);
        // } else if (turn == 2) {
        //     io.sockets.in('2').emit("Server_SendVibra", data);
        // }
        //socket.to(gamepad).emit("Server_SendVibra", data)
        // break;
        //}
    })
    /*********************************************************/



    /*********************************
     ***********Room socket************
     **********************************/
    //phuong
    socket.on("Client_Room_Status", function() {
        socket.emit("Server_Room_Status", Array.from(Room2Users));
        console.log(Room2Users)



        db.query("SELECT TotalWin, TotalLose , TotalHit , TotalShot FROM client WHERE Username=? ", [socket.username], function(err, rows, fields) {
            if (err) throw err;
            var win = 0
            var lose = 0
            var hit = 0
            var shot = 0
            hit = rows[0].TotalHit
            shot = rows[0].TotalShot
            win = rows[0].TotalWin
            lose = rows[0].TotalLose

            socket.emit("User_History", { "win": win, "lose": lose, "shot": shot, "hit": hit })
        })



    })


    socket.on("Client_Create_Room", function(data) {
        Room2Users.set(data, {
            "User": 0,
            "UserName": [],
            "Status": true
        })
        io.sockets.emit("Server_Room_Status", Array.from(Room2Users));
        //socket.join(data)
        // io.sockets.adapter.rooms[data].check_ready = 0
        // io.sockets.adapter.rooms[data].check_timeout = 0
        // io.sockets.adapter.rooms[data].turn = 0
        console.log(Room2Users)
    })

    socket.on("Client_Delete_Room", function(data) {

        Room2Users.delete(data)
        io.sockets.emit("Server_Room_Status", Array.from(Room2Users));
        console.log(Room2Users)
    })


    socket.on("Client_Join_Room", function(data) {
        temp = UserGlobal.get(socket.username)
        if (temp.page == "room") {
            console.log("Client_Join_Room" + data)
            console.log(socket.username)
            temp2 = Room2Users.get(data)
            console.log(temp2)
            if (temp2.Status == true) {

                temp2.User = temp2.User + 1
                if (temp2.User == 2)
                    temp2.Status = false

                temp2.UserName.push(socket.username) // cong chuoi vo
                Room2Users.set(data, temp2)
                io.sockets.emit("Server_Room_Status", Array.from(Room2Users));

                // ben chom room 2 nguoi choi


                temp.room = data
                temp.page = "index"
                UserGlobal.set(socket.username, temp)

                console.log(Room2Users)
                console.log(UserGlobal)
            }
        }
        var page = "/" + temp.page
        socket.emit("Change_Page", page)
		

    })

    socket.on("Logout", function() {


        temp = UserGlobal.get(socket.username)
        gamepad_name = temp.gamepad

        var numberOfElementInArray = Array_Gamepad.findIndex(myFunction);

        function myFunction(value, index, array) {
            return value.address == gamepad_name;
        }
        Array_Gamepad[numberOfElementInArray].status = true
        UserGlobal.delete(socket.username)
        io.sockets.emit('Server_Gamepad_Status', Array_Gamepad);
        socket.emit("Change_Page", "./selectRemote")
    })

    socket.on("Match_Result", function(data) {
        temp = UserGlobal.get(socket.username)

        temp2 = Room2Users.get(temp.room)

        temp2.User = temp2.User - 1
        if (temp2.User == 0)
            temp2.Status = true

        //temp2.UserName.pop() // cong chuoi vo
        var indexUser = temp2.UserName.indexOf(socket.username);

        temp2.UserName.splice(indexUser, 1);


        Room2Users.set(temp.room, temp2)


        io.sockets.emit("Server_Room_Status", Array.from(Room2Users));

        // ben chom room 2 nguoi choi


        temp.room = null
        temp.page = "room"
		temp.ingame = false
        UserGlobal.set(socket.username, temp)
        
        console.log("da chay vo Match_Result")
        console.log(data)
        db.query("SELECT TotalWin, TotalLose , TotalHit , TotalShot FROM client WHERE Username=? ", [socket.username], function(err, rows, fields) {

            if (err) throw err;
            var win = 0
            var lose = 0
            var hit = 0
            var shot = 0
            console.log(rows)
            hit = rows[0].TotalHit + data.hit
            shot = rows[0].TotalShot + data.shot
            if (data.result == true) {
                win = rows[0].TotalWin + 1
                lose = rows[0].TotalLose
            } else {
                lose = rows[0].TotalLose + 1
                win = rows[0].TotalWin
            }
            db.query("UPDATE client SET  TotalWin = ?, TotalLose = ? , TotalHit = ? , TotalShot = ?  WHERE Username=? ", [win, lose, hit, shot, socket.username], function(err, rows, fields) {
                if (err) throw err;

            })
        })

        socket.emit("Change_Page", "./room")
    })

	
	socket.on("Give_Up_Match",function(data){
		
		
		db.query("SELECT TotalWin, TotalLose , TotalHit , TotalShot FROM client WHERE Username=? ", [socket.username], function(err, rows, fields) {

            if (err) throw err;
            var win = 0
            var lose = 0
            var hit = 0
            var shot = 0
            console.log(rows)
            hit = rows[0].TotalHit + data.hit
            shot = rows[0].TotalShot + data.shot
            if (data.result == true) {
                win = rows[0].TotalWin + 1
                lose = rows[0].TotalLose
            } else {
                lose = rows[0].TotalLose + 1
                win = rows[0].TotalWin
            }
            db.query("UPDATE client SET  TotalWin = ?, TotalLose = ? , TotalHit = ? , TotalShot = ?  WHERE Username=? ", [win, lose, hit, shot, socket.username], function(err, rows, fields) {
                if (err) throw err;

            })
        })


        temp = UserGlobal.get(socket.username)

        temp2 = Room2Users.get(temp.room)

        temp2.User = temp2.User - 1
        if (temp2.User == 0)
            temp2.Status = true

        //temp2.UserName.pop() // cong chuoi vo
        var indexUser = temp2.UserName.indexOf(socket.username);

        temp2.UserName.splice(indexUser, 1);


        Room2Users.set(temp.room, temp2)


        io.sockets.emit("Server_Room_Status", Array.from(Room2Users));

        // ben chom room 2 nguoi choi
		socket.to(temp.room).emit('Server_Send_Give_Up_Match',socket.username);

        temp.room = null
        temp.page = "room"
		temp.ingame = false
        UserGlobal.set(socket.username, temp)

		
        //socket.emit("Change_Page", "./room")
		
		
		
	})
	

    /*********************************************************/


});



/**************************************
 ***********Helper function************
 **************************************/
function HandlerIndexPage(socket, msg) {
    //console.log("on emit from index!");
    //console.log("Server save Cookie: " + saveSessionKey[0] + "  --  "  + saveSessionKey[1]);
    //console.log("Client Send Cookie: " + msg.cookie );
    if (socket.username == null) {
        console.log("undefined player at index, kick it out")
        socket.emit("Cookie_Fail");
    } else
        console.log(socket.username + " player at index")

    //console.log("Connect GamePad: " + check_room);
    //console.log(io.sockets.adapter.rooms);

    temp = UserGlobal.get(socket.username)
	if(temp.ingame == false)
	{
		temp.ingame = true
		UserGlobal.set(socket.username,temp)
		socket.join(temp.gamepad)
		socket.join(temp.room)
		
		console.log(socket.username + " joining room " + temp.room)
		console.log("room lenght " + io.sockets.adapter.rooms[temp.room].length)
		// first player to enter the room
		if (io.sockets.adapter.rooms[temp.room].length == 1) {
			io.sockets.adapter.rooms[temp.room].check_ready = 0
			io.sockets.adapter.rooms[temp.room].check_timeout = 0
			io.sockets.adapter.rooms[temp.room].turn = 0
		}
	}
	else{
		socket.emit("Error")
	}
	
}

function HandlerSelectremotePage(socket, msg) {
    //console.log(socket.username)
    if (socket.username != null) {
        console.log(socket.username + " player at select remote")
    } else {
        console.log("undefined player at selectRemote, kick it out");
        socket.emit("Cookie_Fail");
    }
}

function HandlerLoginPage(socket, msg) {
    if (socket.username != null) {
        var saveCookie = {
            "resUserName": socket.username,
            "resSessionkey": UserGlobal.get(socket.username)
        };
        socket.emit("Server_Login_Sucess", saveCookie);
        return
    }

    socket.on("Client_Login", function(data) {
        //console.log("Login!!");
        user = data.user;
        pass = data.pass;
        Login(user, pass, socket)
    });
}

function HandlerRegisterPage(socket, msg) {
    socket.on("Sign_Up", function(data) {
        user = data.username;
        pass = data.password;

        Register(user, pass, socket)
    });
}

function randomNumber() {
    var number = Math.random()
    console.log("random number : " + number)
    return (number > 0.5) ? 1 : 0;
}

function LoginSuccess(username, pass, socket) {
    console.log(username + " login success")
    var SessionKey = CreateSessionKey()
    var saveCookie = {
        "resUserName": user,
        "resSessionkey": SessionKey
    };
    console.log("Cookie Created:  " + SessionKey);
    //UserGlobal.set(username, SessionKey)
    UserGlobal.set(username, {
        "session": SessionKey,
        "gamepad": null,
        "room": null,
        "page": "selectRemote",
		"ingame": false
    })

    socket.emit("Server_Login_Sucess", saveCookie);
    socket.emit("Change_Page", "./selectRemote")

    console.log(UserGlobal)
}

function LoginFail(username, socket) {
    console.log(username + " login fail")
    socket.emit("Server_Login_Fail");
}

function RegisterSuccess(username, socket) {
    db.query("INSERT INTO client(Username,Password) VALUES(?, ?)", [username, pass], function(err, rows, fields) {
        if (err) throw err;
        console.log("add user " + username)
        console.log("register suscess");
        socket.emit("Sign_Up_Successfully")
    })
}

function RegisterFail(username, socket) {
    console.log("user allready exist")
    console.log("registr fail");
    socket.emit("Sign_Up_fail");
}
/*********************************************************/



/******************************
 ********HTTP GET handler*******
 ******************************/
function CheckSession(session) {
    for (const v of UserGlobal.values()) {
        if (v.session.localeCompare(session) == 0) {
            console.log("change page")
            return v.page
        }
    }
    return null
}

app.get("/", function(req, res) {
    var temp = CheckSession(req.cookies.seasion)
    if (temp != null) {
        res.render(temp)
    } else
        res.render("login");
});

app.get("/login", function(req, res) {
    var temp = CheckSession(req.cookies.seasion)
    if (temp != null) {
        res.redirect(temp)
    } else
        res.render("login");
});

app.get("/index", function(req, res) {
    var temp = CheckSession(req.cookies.seasion)
    if (temp == "index") {
        res.render(temp)
    } else if (temp != null) {
        res.redirect(temp)
    } else
        res.redirect("login");
});

app.get("/selectRemote", function(req, res) {
    var temp = CheckSession(req.cookies.seasion)
    if (temp == "selectRemote") {
        res.render(temp)
    } else if (temp != null) {
        res.redirect(temp)
    } else
        res.redirect("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/room", function(req, res) {

    var temp = CheckSession(req.cookies.seasion)

    if (temp == "room") {
        res.render(temp)
    } else if (temp != null) {
        res.redirect(temp)
    } else
        res.redirect("login");
});

app.get("/gamepad", function(req, res) {
    res.render("gamepad");
});
/***********************************************/



/******************************
 ***Database helper function***
 ******************************/

db.on('error', function(err) {
    console.log("[mysql error]", err);
});

function Create_New_table() {
    var sql = "CREATE TABLE IF NOT EXISTS client (Username VARCHAR(255), Password VARCHAR(255), TotalWin INT default 0 , TotalLose INT default 0, TotalHit INT default 0, TotalShot INT default 0)";

    db.query(sql, function(err, result) {
        if (err) throw err;
        //console.log(result)
        //console.log("Table created");
    });

}

function Login(username, pass, socket) {
    console.log(UserGlobal.get(username))
    if (UserGlobal.get(username) == undefined)
        db.query("SELECT * FROM client WHERE Username=? AND Password=?", [username, pass], function(err, rows, fields) {
            if (err) throw err;
            if (rows.length == 0) {
                console.log("wrong username or pass")
                LoginFail(username, socket)
            } else {
                LoginSuccess(username, pass, socket)
            }
        })
    else {
        console.log("user allready login")
        LoginFail(username, socket)
    }
}

function Register(username, pass, socket) {
    db.query("SELECT * FROM client WHERE Username=?", [username], function(err, rows, fields) {
        if (err) throw err;
        //console.log("length " + rows.length)
        if (rows.length == 0) {
            RegisterSuccess(username, socket)
        } else {
            RegisterFail(username, socket)
        }
    })
}

function LogOut(username) {
    console.log(username + " logout")
    UserGlobal.delete(username)
    console.log(UserGlobal)
}

function CompairSession(session, socket) {
    socket.username = null
    for (const [k, v] of UserGlobal.entries()) {
        if (v.session.localeCompare(session) == 0) {
            socket.username = k
            break
        }
    }
    console.log(UserGlobal)
}

function CreateSessionKey() {
    var str = "";
    for (; str.length < 32; str += Math.random().toString(36).substr(2));
    var SessionKey = str.substr(0, 32);
    return SessionKey
}

// , function(err, rows, fields) {
//         if (err) throw err;
//         if (rows.length == 0) {
//             socket.username = null
//         }else{
//             console.log("user login")
//             socket.username = rows[0].Username
//         }
//     })
/***********************************************************************/