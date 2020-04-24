function OMGRealTime() {
    this.userName = window.location.search.slice(1) || (Math.round(Math.random() * 100000) + "")
    this.remoteUsers = {}

    this.socket = io("")
    this.socket.on("update-user-list", users => this.updateUserList(users))
    this.socket.on("incoming-call", async data => this.onIncomingCall(data))
    this.socket.on("answer-made", data => this.onAnswerMade(data))
    this.socket.on("candidate", data => this.onCandidate(data))

    this.socket.on("updateRemoteUserData", msg => this.updateRemoteUserData(msg))

    this.socket.on("disconnect", () => {
        //connectedStatusEl.innerHTML = "not connected"
    });
}

OMGRealTime.prototype.getUserMedia = function (callback) {

    this.localVideo = document.createElement("video")

    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    }).then((stream) => {
        this.localStream = stream
        this.localVideo.srcObject = stream
        this.localVideo.muted = true
        this.localVideo.play()

        if (callback) callback(this.localVideo)
    })
}
OMGRealTime.prototype.join = function (roomName, userName) {
    this.socket.emit("join", {
        name: userName
    })
}

OMGRealTime.prototype.updateUserList = function (users) {
    //connectedStatusEl.innerHTML = "connected"
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

    if (!this.isJoined) {
        this.isJoined = true
        if (this.onjoined) this.onjoined(this.remoteUsers)
    }
}

OMGRealTime.prototype.setupNewUser = function (name, data) {
    this.remoteUsers[name] = data
    this.remoteUsers[name].video = document.createElement("video")
    if (this.onNewUser) this.onNewUser(name, this.remoteUsers[name])
}

OMGRealTime.prototype.onIncomingCall = async function(data) {
    console.log("incoming-call")
    var remoteUsers = this.remoteUsers
    var name = data.callerName
    var user = remoteUsers[name]
    if (!user) {
        console.log("incoming caller doesn't exist", name)
        // todo not there
    }
    if (user.peerConnection) {
        console.log("incoming connection already exists", name)
        // todo 
    }

    user.caller = true
    user.peerConnection = this.createPeerConnection(user)

    this.localStream.getTracks().forEach(track => user.peerConnection.addTrack(track, this.localStream));

    await user.peerConnection.setRemoteDescription(data.offer)

    const answer = await user.peerConnection.createAnswer();
    await user.peerConnection.setLocalDescription(new RTCSessionDescription(answer));
    
    this.socket.emit("make-answer", {
        answer,
        to: data.socket
    });
};

    

OMGRealTime.prototype.onAnswerMade = async function(data) {
    var remoteUsers = this.remoteUsers
    console.log("answer-made", data)
    var name = data.calleeName
    var user = remoteUsers[name]
    if (!user) {
        console.log("callUser doesn't exist", name)
        // todo not there
    }
    if (!user.peerConnection) {
        console.log("callUser connection doesn't exists", name)
        // todo 
    }

    await user.peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer)
    );
    
    //user.peerConnection.ontrack = function({ streams: [stream] }) {
    //    user.video.srcObject = stream;
    //    user.video.play()
    //};
};

OMGRealTime.prototype.onCandidate = function (data) {
    var name = data.caller
    var user = this.remoteUsers[name]
    if (!user) {
        console.log("caller doesn't exist", name)
        // todo not there
    }

    var candidate = new RTCIceCandidate({
        sdpMLineIndex: data.label,
        //sdpMid: data.id,
        candidate: data.candidate + "",
    })
    
    user.peerConnection.addIceCandidate(candidate)
}

OMGRealTime.prototype.callUser = async function(name) {
        console.log("call", name)
        var user = this.remoteUsers[name]
        if (!user) {
            console.log("callUser doesn't exist", name)
            // todo not there
        }
        if (user.peerConnection) {
            console.log("callUser connection already exists", name)
            // todo 
        }
        
        user.peerConnection = this.createPeerConnection(user)

        this.localStream.getTracks().forEach(track => user.peerConnection.addTrack(track, this.localStream));

    }; 


OMGRealTime.prototype.createPeerConnection = function (user) {
    console.log("creating peer connection", user)
    var peerConnection = new RTCPeerConnection({
        iceServers: [     // Information about ICE servers - Use your own!
            {
                urls: "stun:stun.stunprotocol.org"
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
        console.log("onnegotiatedneedeed")
        peerConnection.createOffer().then(function(offer) {
            return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
            this.socket.emit("call-user", {
                offer: peerConnection.localDescription, 
                to: user.id
            })
        })
        .catch((error) => console.error(error));
    };

    peerConnection.ontrack = function({ streams: [stream] }) {
        user.video.srcObject = stream;
        user.video.play()
    };
    /*peerConnection.onremovetrack = handleRemoveTrackEvent;
    peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
    peerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
    peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;*/
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
        console.log("no user to update", msg)
        return
    }   
    this.remoteUsers[msg.name].data = msg.data
}