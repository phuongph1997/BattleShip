var express = require("express");
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mysql = require('mysql');

var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var Gamepad1_Connected = false;

var Login_SocketID_Arr = [];
var User_Name_Arr = [];
var AfterLogin_Status_Arr = [];
var __IndexOfArr = 0;
var __User_Used = false;
var __User_Disconnect = false;
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
});
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views")

server.listen(80);
var check_game_pad_1 = true;
var check_game_pad_2 = true;
var check_room_1;
var check_room_2;
var check_ready = 0;
var check_timeout = 0;
var turn;
// socket.on("Get_All_Remote_Status", function(){

// })
io.on("connection", function(socket) {
    var req = socket.request;
    console.log("ID ket noi: " + socket.id);

    /**************************************
     ********Connection handler page*******
     **************************************/
    socket.on("from", function(msg) {
        //console.log("Page type is: " + msg.type);

        socket.username = CompairSession(msg.cookie)
        socket.player = true

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
    });

    socket.on("disconnect", function() {
        if (socket.player)
            console.log(socket.user + " Change page/ reload");
        else {
            console.log("tay cam " + socket.Phong + " ngat ket noi")
        }

        for (var i = 0; i < __IndexOfArr; i++) {
            console.log("Status of current disconnect: " + AfterLogin_Status_Arr[i + 1]);
            if ((socket.id == Login_SocketID_Arr[i + 1]) && (AfterLogin_Status_Arr[i + 1] == true)) {
                console.log("Only run when disconnect appear at selectRemote page!!");
                if (__IndexOfArr == 0) {
                    User_Name_Arr = null;
                    console.log("User: " + User_Name_Arr[i]);
                    return 1;
                }
                for (var j = i; i < __IndexOfArr; i++) {
                    for (var u = j + 1; u < __IndexOfArr; u++) {
                        User_Name_Arr[j] = User_Name_Arr[u];
                    }
                }
                for (var j = i; i < __IndexOfArr; i++) {
                    for (var u = j + 1; u < __IndexOfArr; u++) {
                        AfterLogin_Status_Arr[j] = AfterLogin_Status_Arr[u];
                    }
                }
                __IndexOfArr--;
            }
        }
        for (var i = 0; i < __IndexOfArr; i++) {
            console.log("User: " + User_Name_Arr[i] + "  ");
        }

        if (socket.Phong == "1") {
            console.log("ngat ket noi gamepad 1")
            check_game_pad_1 = true;
        } else {
            if (socket.Phong == "2") {
                console.log("Ngat ket noi gamepad 2")
                check_game_pad_2 = true;
            }
        }
    });
    /************************************************************************/



    /**************************************
     ********Gamepad related socket*******
     **************************************/
    socket.on("Gamepad_Connect", function() {
        socket.player = false

        if (!(Gamepad1_Connected)) {
            if (check_game_pad_1 == true) {
                // true san sang ket noi
                Gamepad1_Connected = true;
                console.log("Gamepad 1 connected");
                socket.Phong = "1";
                check_game_pad_1 = false;
                socket.join(socket.Phong);
                socket.emit("Gamepad_Ok", socket.Phong);
            } else {
                if (check_game_pad_2 == true) {
                    console.log("Gamepad 2 connected");
                    socket.Phong = "2";
                    check_game_pad_2 = false;
                    socket.join(socket.Phong);
                    socket.emit("Gamepad_Ok", socket.Phong);
                }
            }
        } else {
            console.log("Gamepad 2 connected");
            socket.Phong = "2";
            check_game_pad_2 = false;
            socket.join(socket.Phong);
            socket.emit("Gamepad_Ok", socket.Phong);
            Gamepad1_Connected = false;
        }
        //console.log("gamepab connect" +socket.Phong);

        var status = {
            "status1": check_game_pad_1,
            "status2": check_game_pad_2
        };
        console.log("Nguoi choi da ket noi: ", socket.Phong)
        io.sockets.emit("Sever_Gamepad_Status", status);
        //console.log ("emit Server_Gamepad_status to everyone")
        console.log(JSON.stringify(status));
    });

    socket.on("Gamepad_Command", function(data) {

        if (data == 'right')
            io.sockets.in(socket.Phong).emit("Server_Commands", 'd');
        if (data == 'left')
            io.sockets.in(socket.Phong).emit("Server_Commands", 'a');
        if (data == 'down')
            io.sockets.in(socket.Phong).emit("Server_Commands", 's');
        if (data == 'up')
            io.sockets.in(socket.Phong).emit("Server_Commands", 'w');
        if (data == 'ok')
            io.sockets.in(socket.Phong).emit("Server_Commands", 'f');
        if (data == 'cancle')
            io.sockets.in(socket.Phong).emit("Server_Commands", 'g');

        console.log("nut bam : " + data);
    });

    socket.on("Client_Select_Gamepad", function(data) {
        if (data == 1)
            check_game_pad_1 = true;
        else if (data == 2)
            check_game_pad_2 = true;

        var status = {
            "status1": check_game_pad_1,
            "status2": check_game_pad_2
        };
        io.sockets.emit("Sever_Gamepad_Status", status);

        console.log("Selected GamePad " + data);
        socket.join(data);
        check_room = data;
    });
    /************************************************************************/



    /**************************************
     ********Gameplay related socket*******
     **************************************/
    socket.on("Client_PlaceShip_Done", function(data) {
        check_ready++;
        if (check_ready == 2) {
            var num = randomNumber()
            if (num) {
                turn = 1;
                io.sockets.in('1').emit("Server_SelectPlayTurn", true);
                io.sockets.in('2').emit("Server_SelectPlayTurn", false);
            } else {
                io.sockets.in('1').emit("Server_SelectPlayTurn", false);
                io.sockets.in('2').emit("Server_SelectPlayTurn", true);
                turn = 2;
            }
            check_ready = 0;
        }
    })

    socket.on("Client_Time_Out", function(data) {
        check_timeout++;
        console.log("Client Time out " + check_timeout)
        if (check_timeout == 2) {
            if (turn == 1)
                turn = 2
            else turn = 1
            io.sockets.emit("Server_SwitchRole")
            check_timeout = 0;
        }
    })
    socket.on("Client_Shot", function(data) {
        console.log("Client shot receive : " + data)
        if (turn == 1) {
            console.log("1 shot 2")
            io.sockets.in('2').emit("Server_WereShot", data);
        }
        if (turn == 2) {
            console.log("2 shot 1")
            io.sockets.in('1').emit("Server_WereShot", data);
        }
    })

    socket.on("Client_Shot_Result", function(data) {
        console.log("Client_Shot_Result : " + data)
        if (turn == 1) {
            io.sockets.in('1').emit("Server_Shot_Result", data);
        } else {
            if (turn == 2)
                io.sockets.in('2').emit("Server_Shot_Result", data);
        }
        if (!data) {
            if (turn == 1)
                turn = 2
            else turn = 1
            io.sockets.emit("Server_SwitchRole")
            check_timeout = 0;
        }
    })

    socket.on("Client_Hit_Vibration", function(data) {
        switch (data) {
            case "Hit":
                if (turn == 1) {
                    io.sockets.in('1').emit("Server_SendVibra", data);
                } else if (turn == 2) {
                    io.sockets.in('2').emit("Server_SendVibra", data);
                }
                break;
            case "EndGame":
                if (turn == 1) {
                    io.sockets.in('1').emit("Server_SendVibra", data);
                } else if (turn == 2) {
                    io.sockets.in('2').emit("Server_SendVibra", data);
                }
                break;
        }
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
        console.log("undefined player at index")

    socket.join(check_room);
    console.log("Connect GamePad: " + check_room);
    console.log(io.sockets.adapter.rooms);
}

function HandlerSelectremotePage(socket, msg) {
    // console.log("Save: " + saveSessionKey );
    // console.log("Client: " + msg.cookie );
    if (socket.username != null) {
        socket.on("Client_Gamepad_Status", function() {
            //console.log("Transfering Page!\r\n");
            var status = {
                "status1": check_game_pad_1,
                "status2": check_game_pad_2
            };
            socket.emit("Sever_Gamepad_Status", status);
            console.log(JSON.stringify(status));
        });
    } else {
        console.log("undefined player at index, kick it out");
        socket.emit("Cookie_Fail");
    }
}

function HandlerLoginPage(socket, msg) {
    socket.on("Client_Login", function(data) {
        //console.log("Login!!");
        user = data.user,
            pass = data.pass;
        if ((!user) || (!pass)) {
            socket.emit("Server_Login_Fail");
        } else {
            SessionKey = Login(user, pass)
            if (SessionKey == null) {
                socket.emit("Server_Login_Fail");
            } else {
                var saveCookie = {
                    "resUserName": user,
                    "resSessionkey": SessionKey
                };
                console.log("Cookie Created:  " + SessionKey);
                socket.emit("Server_Login_Sucess", saveCookie);
            }
        }
    });
}

function HandlerRegisterPage(socket, msg) {
    socket.on("Sign_Up", function(data) {
        user = data.username;
        pass = data.password;

        if (Register(user, pass)) {
            console.log("register suscess");
            socket.emit("Sign_Up_Successfully");
        } else {
            socket.emit("Sign_Up_fail");
        }
    });
}


function randomNumber() {
    var number = Math.random()
    console.log("random number : " + number)
    return (number > 0.5) ? 1 : 0;
}
/*********************************************************/



/******************************
 ********HTTP GET handler*******
 ******************************/
app.get("/", function(req, res) {
    res.render("login");
});

app.get("/index", function(req, res) {
    res.render("index");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/selectRemote", function(req, res) {
    res.render("selectRemote");
});

app.get("/register", function(req, res) {
    res.render("register");
});
/***********************************************/



/******************************
 ***Database helper function***
 ******************************/

function Create_New_table() {
    var sql = "CREATE TABLE client (Username VARCHAR(255), Password VARCHAR(255),Status INT,Session VARCHAR(32),GamePad INT )";
    db.query(sql, function(err, result) {
        if (err) throw err;
        console.log("Table created");
    });

}

function Login(username, pass) {
    db.query("SELECT * FROM client WHERE Username=? AND Password=? AND Status=? ", [username, pass, 0], function(err, rows, fields) {
        if (rows.length == 0) {
            return false
        }
    })
    // ham tao session chua co,

    var Session = CreateSessionKey()
    db.query("UPDATE client SET Session = ?,Status=? WHERE Username = ?", [Session, 1, username], function(err, rows, fields) {
        if (error) throw error;

        return true
    })
}

function Register(username, pass) {
    db.query("SELECT * FROM client WHERE Username=? ", [username], function(err, rows, fields) {
        if (rows.length != 0) {
            return false
        }
    })

    db.query("INSERT INTO client(Username,Password) VALUES(?, ?)", [username, pass], , function(err, rows, fields) {
        if (error) throw error;
        return true
    })
}

function LogOut(username) {
    db.query("UPDATE client SET Status=? WHERE Username = ?", [0, username], function(err, rows, fields) {
        if (error) throw error;
        console.log("Number of records deleted: " + rows.affectedRows);
    })
}

function CompairSession(session) {

    db.query("SELECT * FROM client ", function(err, rows, fields) {
        if (rows.length == 0) {
            return null
        }
        return rows[0].Username
    })
}

function CreateSessionKey() {
    var str = "";
    for (; str.length < 32; str += Math.random().toString(36).substr(2));
    var SessionKey = str.substr(0, 32);
    return SessionKey
}


/***********************************************************************/