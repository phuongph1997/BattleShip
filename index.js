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
// socket.on("Get_All_Remote_Status", function(){

// })
io.on("connection", function(socket) {
    var req = socket.request;
    console.log("ID ket noi: " + socket.id);
    socket.check_connect_gamepad = null // kiem tra gamepad hay client connect
    /**************************************
     ********Connection handler page*******
     **************************************/
    socket.on("from", function(msg) {
        //console.log("Page type is: " + msg.type);

        console.log("cookie: " + msg.cookie)
        socket.player = true
        CompairSession(msg.cookie, socket)
        switch (msg.type) {
            case "Index":
                HandlerIndexPage(socket, msg)
                break;
            case "selectRemote":
                HandlerSelectremotePage(socket, msg)
                break;
            case "Login":
                HandlerLoginPage(socket, msg)
                break;
            case "Register":
                HandlerRegisterPage(socket, msg)
                break;
            default:
                break;
        }
        console.log("socket.name : " + socket.username)
    });

    socket.on("disconnect", function() {
        //phuong
        if (socket.check_connect_gamepad != null) {
            var numberOfElementInArray = Array_Gamepad.findIndex(myFunction);

            function myFunction(value, index, array) {
                return value.address == socket.check_connect_gamepad;
            }
            Array_Gamepad.splice(numberOfElementInArray, 1)
            io.sockets.emit('Sever_Gamepad_Status', Array_Gamepad);
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

        console.log("Selected GamePad " + data);
        // phuong

        var numberOfElementInArray = Array_Gamepad.findIndex(myFunction);

        function myFunction(value, index, array) {
            return value.address == data;
        }

        Array_Gamepad[numberOfElementInArray].status = false
        io.sockets.emit('Server_Gamepad_Status', Array_Gamepad);

        console.log(UserGlobal);
        temp = UserGlobal.get(socket.username)
        temp.gamepad = data
        UserGlobal.set(socket.username, temp)



    });
    /************************************************************************/



    /**************************************
     ********Gamepad related socket*******
     **************************************/
    socket.on("Gamepad_Connect", function(data) {
        console.log("gamepad connect" + data)
        //phuong
        var temp = { "address": data, "status": true }
        Array_Gamepad.push(temp) //mang nay se luu dang sach gamepad dang ket noi
        socket.check_connect_gamepad = data
        socket.join(data)
        io.sockets.emit('Server_Gamepad_Status', Array_Gamepad);
        console.log("arraygamepab connect ")
        console.log(Array_Gamepad)

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
        switch (data) {
            case "Hit":
                // if (turn == 1) {
                //     io.sockets.in('1').emit("Server_SendVibra", data);
                // } else if (turn == 2) {
                //     io.sockets.in('2').emit("Server_SendVibra", data);
                // }
                io.in(gamepad).emit("Server_SendVibra", data)
                break;
            case "EndGame":
                // if (turn == 1) {
                //     io.sockets.in('1').emit("Server_SendVibra", data);
                // } else if (turn == 2) {
                //     io.sockets.in('2').emit("Server_SendVibra", data);
                // }
                io.in(gamepad).emit("Server_SendVibra", data)
                break;
        }
    })
    /*********************************************************/



    /*********************************
     ***********Room socket************
     **********************************/
    //phuong
    socket.on("Client_Room_Status", function() {
        socket.emit("Server_Room_Status", Array.from(Room2Users));
        console.log(Room2Users)
    })


    socket.on("Client_Create_Room", function(data) {
        Room2Users.set(data, {
            "User": 0,
            "UserName": [],
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

        console.log("Client_Join_Room" + data)
        console.log(socket.username)
        temp = Room2Users.get(data)
        console.log(temp)
        temp.User = temp.User + 1

        temp.UserName.push(socket.username) // cong chuoi vo
        Room2Users.set(data, temp)
        io.sockets.emit("Server_Room_Status", Array.from(Room2Users));

        // ben chom room 2 nguoi choi

        temp = UserGlobal.get(socket.username)
        temp.room = data
        UserGlobal.set(socket.username, temp)
        console.log(Room2Users)
        console.log(UserGlobal)

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

    console.log("Connect GamePad: " + check_room);
    console.log(io.sockets.adapter.rooms);

    temp = UserGlobal.get(socket.username)
    socket.join(temp.gamepad)
    socket.join(temp.room)

    console.log (socket.userame + " joining room " + temp.room)
    console.log ("room lenght " + io.sockets.adapter.rooms[temp.room].length)
    // first player to enter the room
    if (io.sockets.adapter.rooms[temp.room].length == 1) {
        io.sockets.adapter.rooms[temp.room].check_ready = 0
        io.sockets.adapter.rooms[temp.room].check_timeout = 0
        io.sockets.adapter.rooms[temp.room].turn = 0
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
        "room": null
    })

    socket.emit("Server_Login_Sucess", saveCookie);

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
            return true
        }
    }
    return false
}

app.get("/", function(req, res) {
    if (CheckSession(req.cookies.seasion)) {
        res.redirect('/selectRemote')
    } else
        res.render("login");
});

app.get("/login", function(req, res) {
    if (CheckSession(req.cookies.seasion)) {
        res.redirect('/selectRemote')
    } else
        res.render("login");
});

app.get("/index", function(req, res) {
    if (CheckSession(req.cookies.seasion)) {
        res.render("index");
    } else
        res.redirect('/login')
});

app.get("/selectRemote", function(req, res) {
    if (CheckSession(req.cookies.seasion)) {
        res.render("selectRemote");
    } else
        res.redirect('/login')
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/room", function(req, res) {
    if (CheckSession(req.cookies.seasion)) {
        res.render("room");
    } else
        res.redirect('/login')
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
    var sql = "CREATE TABLE IF NOT EXISTS client (Username VARCHAR(255), Password VARCHAR(255), GamePad INT )";
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