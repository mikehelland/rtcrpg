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

var users = {}
io.on("connection", socket => {
    var name

    socket.on("join", msg => {
        if (users[msg.name]) {
            //todo
        }

        name = msg.name
        users[name] = {id: socket.id, data: msg.data, name: name}

        io.emit("update-user-list", users);
    })


    socket.on("disconnect", () => {
        if (name) {
            delete users[name]
        }
        io.emit("update-user-list", users);
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
        if (users[name]) {
            users[name].data = data
        }
        socket.broadcast.emit("updateRemoteUserData", {
            name: name,
            data, data
        });
    });

    socket.on("textMessage", data => {
        if (users[data.to]) {
            io.to(users[data.to].id).emit("textMessage", {
                from: name,
                message: data.message
            })
        }
    })
})
