var socket = io.connect("18.136.212.75")

var map = new Map()

var serverCheck = {
    "type": "room",
    "username": getCookie("username"),
    "cookie": getCookie("seasion")
}

socket.emit("from", serverCheck);

function getCookie(name) {
    var nameEQ = name + "=";
    //alert(document.cookie);
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(nameEQ) != -1) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

$(document).ready(function(e) {
    socket.emit("Client_Room_Status");
    //Create_room("room1", 1, "hahahha");
    //Create_room("room2", 1, ["abcd","der"]);
    //Create_room("room3", 1, ["asdf","sdgadsg"]);

    $("#name").text(getCookie("username"))

    $("#btn_create_room").click(function() {
        var room_name = $("#input_name").val()
        console.log(room_name)
        $(".error").addClass('hidden')
        if (map.has(room_name)) {
            $("#error1").removeClass('hidden')
            console.log("create room: " + room_name + " already exist")
        } else if(room_name == ""){
            $("#error2").removeClass('hidden')
            console.log("please enter room name")
        } else {
            console.log("create room: " + "create " + room_name)

            Create_room(room_name, 0, "")
            socket.emit("Client_Create_Room", room_name)
        }

    })

    $("#btn_logout").click(function(){
        console.log("Logout")
        socket.emit("Logout")
    })

    $("btn_btn_change_gamepad").click(function(){
        console.log("change gamepad")
        socket.emit("Change_Gamepad")
    })
})

function Change_status(room_name, status) {
    if (status <= 2)
        $('#' + room_name + "_status").html(status + "/2")
}

function Change_player(room_name, player) {
    $('#' + room_name + "_player").html(player[0] + "," + player[1])
}

function Delete_room_list() {
    var container = document.getElementById('room_container');

    while (container.firstChild) {
        container.removeChild(container.firstChild)
    }
}

function Delete_room(room_name) {
    var container = document.getElementById('room_container');

    var children = container.children;
    for (var i = 0; i < children.length; i++) {
        var tableChild = children[i];
        if (tableChild.id == room_name) {
            container.removeChild(children[i])
            break;
        }
        // Do stuff
    }
}

function Create_room(room_name, status, player) {
    var container = document.getElementById('room_container');

    var div = document.createElement('div')
    div.className += "room_element"
    div.id = room_name

    // create room name text
    var h1 = document.createElement('h4');
    h1.textContent = "Tên phòng: " + room_name
    h1.appendChild(document.createElement('br'))

    // create status text
    var h2 = document.createElement('h4');
    h2.textContent = "tình trạng: "

    var span = document.createElement('span')
    span.id = room_name + "_status"
    span.textContent = status + "/2"
    h2.appendChild(span)
    h2.appendChild(document.createElement('br'))

    // create player in room text
    var h3 = document.createElement('h4')
    h3.textContent = "Player trong phòng: "
    var span2 = document.createElement('span')
    span2.id = room_name + "_player"
    span2.textContent = player
    h3.appendChild(span2)
    h3.appendChild(document.createElement('br'))

    var Button = document.createElement('button')
    Button.className = "btn_join"
    Button.textContent = "vào phòng"
    Button.onclick = buton_join_callback.bind(Button, room_name)
    if (status == 2)
        Button.disabled = true

    var DelButton = document.createElement('button')
    DelButton.className = "btn_join"
    DelButton.textContent = "xóa phòng"
    if (status != 0)
        DelButton.disabled = true;
    DelButton.onclick = buton_del_callback.bind(DelButton, room_name)

    div.appendChild(h1)
    div.appendChild(h2)
    div.appendChild(h3)
    div.appendChild(Button)
    div.appendChild(DelButton)

    container.appendChild(div);
}

function buton_join_callback(room_name) {
    console.log("join in room: " + room_name)
    socket.emit("Client_Join_Room", room_name)
    window.location.href = './index'
}

function buton_del_callback(room_name) {
    console.log("del room: " + room_name)
    Delete_room(room_name)
    socket.emit("Client_Delete_Room", room_name)
}

socket.on("Server_Room_Status", function(data) {
    Delete_room_list()
    map = new Map(data)

    if (map.size != 0) {
        for (const [k, v] of map.entries()) {
            console.log("k:" + k)
            console.log("v:" + v)
            Create_room(k, v.User, v.UserName)
        }
    } else {
        var container = document.getElementById('room_container');
        container.innerText = "Không có room tồn tại, hãy tạo room mới"
    }
})

socket.on("Change_Page", function(data){
    window.location.href = data
})