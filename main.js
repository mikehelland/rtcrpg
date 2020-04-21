const express = require('express');
const app = express();
const https = require("https")
const fs = require("fs")


try {
    var options = {
        key: fs.readFileSync('privkey.pem'),
        cert: fs.readFileSync('fullchain.pem')
    };
    var httpsServer = https.createServer(options, app);
    var port = 8081
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


var activeSockets = []
var users = {}
io.on("connection", socket => {
    var name

    socket.on("join", data => {
        if (users[data.name]) {
            //todo
        }

        name = data.name
        users[name] = socket.id

        io.emit("update-user-list", users);
    })


    socket.on("disconnect", () => {
        if (name) {
            delete users[name]
        }
        io.emit("update-user-list", users);
    });

    socket.on("call-user", data => {
        console.log("call-user", data)
        io.to(data.to).emit("incoming-call", {
          offer: data.offer,
          callerName: name,
          socket: socket.id
        });
    });

    socket.on("make-answer", data => {
        console.log("make-answer", data)
        io.to(data.to).emit("answer-made", {
          calleeName: name,
          socket: socket.id,
          answer: data.answer
        });
    });

    socket.on("candidate", data => {
        console.log("candidate", data)
        io.to(data.to).emit("candidate", {
          caller: name,
          socket: socket.id,
          label: data.label,
          id: data.id,
          candidate: data.candidate
        });
    });
})
