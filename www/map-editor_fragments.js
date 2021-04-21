export function NPCFragment(npc, editor) {
    this.editor = editor
    this.div = document.createElement("div")
    
    var caption
    
    this.npcDetailsName   = document.createElement("input")
    this.div.appendChild(this.npcDetailsName)
    this.npcDetailsSound  = document.createElement("div")
    this.div.appendChild(this.npcDetailsSound)
    this.npcDetailsDialog = document.createElement("textarea")
    this.div.appendChild(this.npcDetailsDialog)
    this.npcDetailsCanvas = document.createElement("canvas")
    this.npcDetailsCanvas.width = 32
    this.npcDetailsCanvas.height = 32
    
    this.div.appendChild(this.npcDetailsCanvas)
    this.npcDetailsDelete = document.createElement("button")
    this.div.appendChild(this.npcDetailsDelete)

    this.npcDetailsName.value = npc.name
    this.npcDetailsSound.value = npc.soundURL || ""
    this.npcDetailsName.onkeypress = e => {
        if (e.key === "Enter") {
            npc.name = this.npcDetailsName.value
            npcDiv.getElementsByTagName("div")[0].innerHTML = npc.name
        }
    }
    this.npcDetailsSound.onkeypress = e => {
        if (e.key === "Enter") {
            npc.soundURL = this.npcDetailsSound.value
        }
    }

    this.npcDetailsDialog.value = npc.dialog.join("\n")
    this.npcDetailsDialog.onkeyup = e => {
        npc.dialog = this.npcDetailsDialog.value.split("\n")
    }

    this.npcDetailsDelete.onclick = e => {
        let i = this.map.npcs.indexOf(npc)
        this.map.npcs.splice(i, 1)
        this.drawNPCs()

        npcDiv.parentElement.removeChild(npcDiv)
    }

    this.selectMusicPart = document.createElement("select")
    if (this.editor.song) {
        this.loadMusicParts()
    }
    caption = document.createElement("div")
    caption.innerHTML = "Music Part:"
    this.div.appendChild(caption)
    this.div.appendChild(this.selectMusicPart)

    this.selectMusicPart.value = npc.musicPart || "(None}"
    this.selectMusicPart.onchange = e => {
        if (this.selectMusicPart.selectedIndex === 0) {
            delete npc.musicPart 
        }
        else {
            npc.musicPart =  this.selectMusicPart.value 
        }
    }
 
}

NPCFragment.prototype.loadMusicParts = function () {
    this.selectMusicPart.innerHTML = "<option value=''>(None)</option>"
    for (var partName in this.editor.song.parts) {
        var option = document.createElement("option")
        option.innerHTML = partName
        this.selectMusicPart.appendChild(option)
    }
    
}

export function ImportTileFragment(editor) {
    this.editor = editor
    this.div = document.createElement("div")
    this.backButton = document.createElement("button")
    this.backButton.innerHTML = "< Back"
    this.backButton.onclick = e => {
        this.backButton.style.display = "none"
        searchBox.div.style.display = "block"
        this.tileListDiv.style.display = "none"
    }
    this.backButton.style.display = "none"

    this.tileListDiv = document.createElement("div")
    var searchBox = new OMGSearchBox({types: ["TILESET", "RPGMAP"]})

    this.div.appendChild(searchBox.div)
    this.div.appendChild(this.backButton)
    this.div.appendChild(this.tileListDiv)
    
    searchBox.onclickcontent = e => {

        this.tileListDiv.innerHTML = ""
        searchBox.div.style.display = "none"
        this.backButton.style.display ="block"
        this.tileListDiv.style.display = "block"

        var tileSet
        if (e.data.type === "TILESET") {
            tileSet = e.data
        }
        else if (e.data.type === "RPGMAP") {
            tileSet = e.data.tileSet
        }

        if (tileSet) {
            for (var tileCode in tileSet.tileCodes) {
                var url = tileSet.tileCodes[tileCode]
                if (!url.startsWith("data:")) {
                    url = (tileSet.prefix || "") + url + (tileSet.postfix || "")
                }
                this.makeTile(tileCode, url)
            }
        }
        
    }

    searchBox.search()
}

ImportTileFragment.prototype.makeTile = function (tileCode, url) {
    var img = document.createElement("img")
    img.src = url
    img.width = 32
    img.height = 32
    this.tileListDiv.appendChild(img)
    img.onclick = e => {
        this.editor.data.tileSet.tileCodes[tileCode] = url //"" //this.sourceCtx.canvas.toDataURL("image/png")
        var img = this.editor.loadTile(tileCode, this.editor.data.tileSet)
        img.src = url //this.img.tiles[this.selectedTile].src
        img.onclick()
               
    }
}

export function SaveFragment(editor) {
    this.editor = editor
    this.data = editor.data
    this.user = editor.user
    var song = editor.song

    this.div = document.createElement("div")
    
    // check to see what's actually changed
    var mapChanged = true
    var musicChanged = !!this.data.music && song

    // if there's music, make sure to ask about changing that first

    if (this.data.music && song && musicChanged) {
        this.musicDiv = document.createElement("div")
        this.div.appendChild(this.musicDiv)

        var caption = document.createElement("div")
        caption.innerHTML = "The music has changed. Save it?"
        this.musicDiv.appendChild(caption)
    
        if (song.data.id) {
            var overwriteSongButton = document.createElement("button")
            overwriteSongButton.innerHTML = "Overwrite MUSIC"

            var saveNewSongButton = document.createElement("button")
            saveNewSongButton.innerHTML = "Save Copy of MUSIC"

            this.musicDiv.appendChild(overwriteSongButton)
            this.musicDiv.appendChild(saveNewSongButton)
            
            overwriteSongButton.onclick = e => {
                omg.server.post(song.getData(), res => {
                    this.showSaveButtons()
                })
            }

            saveNewSongButton.onclick = e => {
                delete song.data.id
                omg.server.post(song.getData(), res => {
                    this.showSaveButtons()
                })
            }
        }
        else {
            var saveMusicButton = document.createElement("button")
            saveMusicButton.innerHTML = "Save MUSIC"
            saveMusicButton.onclick = e => {
                omg.server.post(song.getData(), res => {
                    this.showSaveButtons()
                })
            }

            this.musicDiv.appendChild(saveMusicButton)
        }
        var discardMusicButton = document.createElement("button")
        discardMusicButton.innerHTML = "Discard MUSIC"
        discardMusicButton.onclick = e => {
            this.showSaveButtons()
        }

        this.musicDiv.appendChild(discardMusicButton)

    }

    if (mapChanged && musicChanged) {
        var saveAllButton = document.createElement("button")
        saveAllButton.innerHTML = "Save Map and Music"
        saveAllButton.onclick = e => this.saveAll()
    }

    
    document.getElementById("new-copy-button").onclick = e => {
        delete this.data.id
        omg.server.post(this.data, res => {
            this.saved(res)
        })
    }
    document.getElementById("overwrite-button").onclick = e => {
        omg.server.post(this.data, res => {
            this.saved(res)
        })
    }
    document.getElementById("new-copy-music-button").onclick = e => {
        
    }

}

SaveFragment.prototype.save = function () {
    this.data.name = this.nameInput.value
    this.data.type = "RPGMAP"

    this.map.updateYLines()
    
    this.overwriteDiv = document.getElementById("overwrite-or-new")
    this.overwriteMusicDiv = document.getElementById("overwrite-music")
    this.savedDiv = document.getElementById("saved")
    this.saveDiv = document.getElementById("save")

    this.savedWindow = this.wm.newWindow({caption: "Save", div: this.saveDiv, width: 300, height: 350})

    this.savedDiv.style.display = "none"
    if (this.data.id) {
        if (this.user && this.data.user_id === this.user.id)  {
            this.overwriteDiv.style.display = "block"
            return
        }
        else {
            this.overwriteDiv.style.display = "none"
            delete this.data.id
        }
    }
    else {
        this.overwriteDiv.style.display = "none"
    }

    if (this.song) {
        this.overwriteMusicDiv.style.display = "block"
    }
    else {
        this.overwriteMusicDiv.style.display = "none"
    }

    omg.server.post(this.data, res => {
        this.saved(res)        
    })
}

SaveFragment.prototype.saved = function (res) {
    var urlTag = document.getElementById("saved-url")
    var url = this.gamePage + "?id=" + res.id
    urlTag.href = url
    urlTag.innerHTML = url

    this.overwriteDiv.style.display = "none"
    this.savedDiv.style.display = "block"
}

SaveFragment.prototype.savedMusic = function (res) {
    var urlTag = document.getElementById("saved-url")
    var url = this.gamePage + "?id=" + res.id
    urlTag.href = url
    urlTag.innerHTML = url

    this.overwriteMusicDiv.style.display = "none"
    this.savedMusicDiv.style.display = "block"
}

SaveFragment.prototype.showSaveButtons = function () {

    this.musicDiv.style.display = "none"

    var canOverwrite = this.user && this.data.user_id === this.user.id

    if (this.data.id && canOverwrite) {
        var overwriteButton = document.createElement("button")
        overwriteButton.innerHTML = "Overwrite MAP"
        overwriteButton.onclick = e => {
            omg.server.post(this.data, res => {
                this.saved(res)        
            })
        }

        var saveCopyButton = document.createElement("button")
        saveCopyButton.innerHTML = "Save Copy of MAP"
        saveCopyButton.onclick = e => {
            delete this.data.id
            omg.server.post(this.data, res => {
                this.saved(res)        
            })
        }
        
        this.div.appendChild(overwriteButton)
        this.div.appendChild(saveCopyButton)
    }
    else {
        delete this.data.id
        omg.server.post(this.data, res => {
            this.saved(res)        
        })

    }
}

SaveFragment.prototype.saved = function (res) {
    this.gamePage = "char.htm"

    this.data.id = res.id

    this.div.innerHTML = "Saved!<br>" + 
                        "<a href='" + this.gamePage + "?id=" + res.id + "'>" +
                        this.gamePage + "?id=" + res.id + "</a>"

}