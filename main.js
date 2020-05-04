const express = require('express');
const app = express();

var useHttps = false //heroku can do it

const https = useHttps ? require("https") : require("http")
const fs = require("fs")


try {
    if (useHttps) {
        var options = {
            key: fs.readFileSync('privkey.pem'),
            cert: fs.readFileSync('fullchain.pem')
        };
        var httpsServer = https.createServer(options, app);    
    }
    else {
        var httpsServer = https.createServer(app);
    }
    const port = process.env.PORT || 3000
    httpsServer.listen(port, function () {
        console.log("https port", port);
    });
}
catch (excp) {
    console.log(excp);
    console.log("did not create https server");
}


app.use(express.static('www'))


///oooh socket time, for the webrtc singaling

var io = require('socket.io')(httpsServer);

var rooms = {}
io.on("connection", socket => {
    var name
    var roomName
    var room = {users: {}}

    socket.on("join", msg => {

        if (!msg.name) {
            return
        }

        socket.join(msg.room)

        if (!rooms[msg.room]) {
            rooms[msg.room] = {users: {}}
        }
        room = rooms[msg.room]
        name = msg.name
        roomName = msg.room

        room.users[name] = {id: socket.id, data: msg.data, name: name}

        socket.to(msg.room).emit("update-user-list", room.users);
        socket.emit("joined", room.users);
        
    })


    socket.on("leave", () => {
        if (name) {
            delete room.users[name]
        }
        io.in(roomName).emit("userLeft", name);
    });

    socket.on("disconnect", () => {
        if (name) {
            delete room.users[name]
        }
        io.in(roomName).emit("userDisconnected", name);
    });

    socket.on("call-user", data => {
        io.to(data.to).emit("incoming-call", {
          offer: data.offer,
          callerName: name,
          socket: socket.id
        });
    });

    socket.on("make-answer", data => {
        io.to(data.to).emit("answer-made", {
          calleeName: name,
          socket: socket.id,
          answer: data.answer
        });
    });

    socket.on("candidate", data => {
        io.to(data.to).emit("candidate", {
          caller: name,
          socket: socket.id,
          label: data.label,
          id: data.id,
          candidate: data.candidate
        });
    });

    socket.on("updateLocalUserData", data => {
        if (room.users[name]) {
            room.users[name].data = data
        }
        socket.to(roomName).emit("updateRemoteUserData", {
            name: name,
            data, data
        });
    });

    socket.on("signaling", signal => {
        if (!signal.from) {
            signal.from = name
        }
        try {
            if (signal.to && room.users[signal.to]) {
                io.to(room.users[signal.to].id).emit("signaling", signal)
            }
            else if (signal.room) {
                socket.to(roomName).emit("signaling", signal)
            }
        }
        catch (e) {}
    })
})
