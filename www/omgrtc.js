function OMGRealTime(userName) {
    this.userName = userName || (Math.round(Math.random() * 100000) + "")
    this.remoteUsers = {}

    this.socket = io("")

    this.socket.on("joined", users => {
        this.updateUserList(users)
        this.isJoined = true
        if (this.onjoined) this.onjoined(this.remoteUsers)
    })
    this.socket.on("update-user-list", users => this.updateUserList(users))
    this.socket.on("incoming-call", async data => this.onIncomingCall(data))
    this.socket.on("answer-made", data => this.onAnswerMade(data))
    this.socket.on("candidate", data => this.onCandidate(data))

    this.socket.on("signaling", data => this.onSignal(data))

    this.socket.on("updateRemoteUserData", msg => this.updateRemoteUserData(msg))
    this.socket.on("textMessage", data => this.ontextmessage(data))

    this.socket.on("disconnect", () => {
        //connectedStatusEl.innerHTML = "not connected"
    });
}

OMGRealTime.prototype.log = function (message) {
    console.log(message)
    if (this.onlog) {
        this.onlog(message)
    }
}

OMGRealTime.prototype.getUserMedia = function (callback) {
    this.log("Getting camera and microphone")

    this.localVideo = document.createElement("video")

    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    }).then((stream) => {
        this.log("Got camera and microphone.")

        this.localStream = stream
        this.localVideo.srcObject = stream
        this.localVideo.muted = true
        this.localVideo.play()

        if (callback) callback(this.localVideo)
    })
}
OMGRealTime.prototype.join = function (roomName, userName) {
    this.log("Joining room.")
    this.socket.emit("join", {
        name: userName,
        room: roomName
    })
}

OMGRealTime.prototype.updateUserList = function (users) {
    //connectedStatusEl.innerHTML = "connected"
    this.log("Updating user list.")
    for (var name in users) {
        if (name == this.userName) continue;
        if (!this.remoteUsers[name]) {
            this.setupNewUser(name, users[name])
        }
        else {
            this.remoteUsers[name].id = users[name].id
            // if they have a new socket, 
        }
    }
    for (name in this.remoteUsers) {
        if (!users[name]) {
            if (this.onRemoveUser) {
                this.onRemoveUser(name, this.remoteUsers[name])
            }
            if (this.remoteUsers[name].peerConnection) {
                this.remoteUsers[name].peerConnection.close()
            }
            delete this.remoteUsers[name]
        }
    }
    if (Object.keys(this.remoteUsers).length === 0) {
        //userListEl.innerHTML = "no users yet"
    }
}

OMGRealTime.prototype.setupNewUser = function (name, data) {
    this.remoteUsers[name] = data
    this.remoteUsers[name].video = document.createElement("video")
    if (this.onNewUser) this.onNewUser(name, this.remoteUsers[name])
}

OMGRealTime.prototype.onIncomingCall = async function(data) {
    this.log("incoming-offer")
    var remoteUsers = this.remoteUsers
    var name = data.callerName
    var user = remoteUsers[name]
    if (!user) {
        this.log("incoming caller doesn't exist", data)
        // todo not there
    }
    if (user.peerConnection) {
        this.log("incoming connection already exists", name)
        // todo 
    }

    user.caller = true
    user.peerConnection = this.createPeerConnection(user)

    await user.peerConnection.setRemoteDescription(data.offer)

    const answer = await user.peerConnection.createAnswer();
    await user.peerConnection.setLocalDescription(new RTCSessionDescription(answer));

    this.log("make-answer")
    this.socket.emit("make-answer", {
        answer,
        to: data.socket
    });    
};

    

OMGRealTime.prototype.onAnswerMade = async function(data) {
    var remoteUsers = this.remoteUsers
    this.log("answer-made")
    var name = data.calleeName
    var user = remoteUsers[name]
    if (!user) {
        this.log("onanswermade calleeName doesn't exist", name)
        // todo not there
    }
    if (!user.peerConnection) {
        this.log("onanswermade calleeName connection doesn't exists", name)
        // todo 
    }

    await user.peerConnection.setRemoteDescription(data.answer);
    this.log("ok?")    
};

OMGRealTime.prototype.onCandidate = function (data) {
    var name = data.caller
    var user = this.remoteUsers[name]
    if (!user) {
        this.log("caller doesn't exist", name)
        // todo not there
    }

    var candidate = new RTCIceCandidate({
        sdpMLineIndex: data.label,
        //sdpMid: data.id,
        candidate: data.candidate + "",
    })
    
    user.peerConnection.addIceCandidate(candidate)
}

OMGRealTime.prototype.callUser = async function(name, callback) {
    this.log("call", name)
    var user = this.remoteUsers[name]
    if (!user) {
        this.log("callUser doesn't exist", name)
        return
    }

    user.callee = true

    user.outgoingCallCallback = callback
    var whenReady = () => {
        this.socket.emit("signaling", {
            from: this.userName,
            to: name,
            type: "call"
        })
    }

    if (!this.localStream) {
        this.getUserMedia(() => {
            whenReady()
        })
    }
    else {
        whenReady()
    }
}
    

OMGRealTime.prototype.createPeerConnection = function (user) {
    this.log("creating peer connection")
    var peerConnection = new RTCPeerConnection({
        iceServers: [     // Information about ICE servers - Use your own! 
            {
                urls: "stun:stun.openmusic.gallery:3478"
            },
            {
                urls: "turn:turn.openmusic.gallery:3478",
                credential: "12345",
                username: "omgrtc"
            }
        ]
    });

    peerConnection.onicecandidate = (event) => {
        console.log("onicecandidate")
        if (event.candidate) {
            this.socket.emit("candidate", {
                to: user.id,
                candidate: event.candidate.candidate,
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid
            });
        }
    };

    peerConnection.onnegotiationneeded = () => {
        //should only need to do this when calling, not being called
        if (!user.callee) {
            return
        }

        this.log("negotiating connection...")
        peerConnection.createOffer().then(function(offer) {
            return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
            this.socket.emit("call-user", {
                offer: peerConnection.localDescription, 
                to: user.id
            })
        })
        .catch((error) => this.log("error negotiating"));
    };

    peerConnection.ontrack = function({ streams: [stream] }) {
        try {
            user.video.srcObject = stream;
            user.video.play()
        }
        catch (e) {
            console.log("user stream ended")
        }
    };

    this.localStream.getTracks().forEach(track => peerConnection.addTrack(track, this.localStream));
    /*peerConnection.onremovetrack = handleRemoveTrackEvent;
    peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
    peerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
    peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;*/

    this.log("peer connection created")
    return peerConnection
}

OMGRealTime.prototype.updateLocalUserData = function (user) {
    this.socket.emit("updateLocalUserData", user)
}

OMGRealTime.prototype.updateRemoteUserData = function (msg) {
    if (msg.name === this.userName) {
        console.log("updating myself over sockets.. fix this")
        return
    }

    if (!this.remoteUsers[msg.name]) {
        this.log("no user to update", msg)
        return
    }   
    this.remoteUsers[msg.name].data = msg.data
}

OMGRealTime.prototype.sendTextMessage = function (remoteUserName, message) {
    this.socket.emit("textMessage", {
        to: remoteUserName,
        message: message
    })
}

OMGRealTime.prototype.ontextmessage = function () {}

OMGRealTime.prototype.onSignal = function (signal) {
    this.log("signal " + signal.type)
    if (signal.type === "call") {
        this.onGetCall(signal)
    }
    else if (signal.type === "pickup") {
        this.onPickUp(signal)
    }
}

OMGRealTime.prototype.onGetCall = function (signal) {
    this.log("get call " + signal.from)
    var pickUp = () => {
        if (!this.localStream) {
            this.getUserMedia(() => {
                this.socket.emit("signaling", {
                    type: "pickup",
                    from: this.userName,
                    to: signal.from
                })
            })
        }
        else {
            this.socket.emit("signaling", {
                type: "pickup",
                from: this.userName,
                to: signal.from
            })
        }
    }

    if (this.acceptAllCalls) {
        pickUp()
    }
    else if (this.onincomingcall) {
        this.onincomingcall(name, () => {
            pickUp()
        })
    }

}

OMGRealTime.prototype.onPickUp = function (signal) {
    var user = this.remoteUsers[signal.from]
    if (user.outgoingCallCallback) {
        user.outgoingCallCallback(true)
        delete user.outgoingCallCallback
    }
    if (user.peerConnection) {
        this.log("onPickUp connection already exists", name)
        // todo 
    }    
    user.peerConnection = this.createPeerConnection(user)

}

//[1] https://ourcodeworld.com/articles/read/1175/how-to-create-and-configure-your-own-stun-turn-server-with-coturn-in-ubuntu-18-04