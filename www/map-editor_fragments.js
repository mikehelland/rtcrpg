export function NPCFragment(npc, npcDiv, editor) {
    this.editor = editor
    this.map = editor.map
    this.div = document.createElement("div")
    this.npc = npc
    
    var caption
    
    this.npcDetailsName   = document.createElement("input")
    this.div.appendChild(this.npcDetailsName)
    this.npcDetailsSound  = document.createElement("div")
    this.div.appendChild(this.npcDetailsSound)
    this.npcDetailsDialog = document.createElement("textarea")
    this.div.appendChild(this.npcDetailsDialog)
    
    caption = document.createElement("div")
    caption.innerHTML = "Animating"
    this.div.appendChild(caption)
    
    this.npcAnimating = document.createElement("input")
    this.npcAnimating.type = "checkbox"
    this.div.appendChild(this.npcAnimating)
    this.npcAnimating.checked = npc.animating
    this.npcAnimating.onchange = e => npc.animating = this.npcAnimating.checked

    this.npcDetailsCanvas = document.createElement("canvas")
    this.npcDetailsCanvas.width = 32
    this.npcDetailsCanvas.height = 32
    
    //this.div.appendChild(this.npcDetailsCanvas)

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

    this.npcDetailsDialog.value = npc.dialog ? npc.dialog.join("\n") : ""
    this.npcDetailsDialog.onkeyup = e => {
        npc.dialog = this.npcDetailsDialog.value.split("\n")
    }

    this.setupMotionSelect()
    
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

    this.selectObjective = document.createElement("select")
    this.selectObjective.innerHTML = `
        <option>none</option>
        <option>red</option>
        <option>blue</option>
        <option>green</option>
        <option>yellow</option>
        <option>metronome</option>
        <option>key</option>`
    caption = document.createElement("div")
    caption.innerHTML = "Objective:"
    this.div.appendChild(caption)
    this.div.appendChild(this.selectObjective)

    this.selectObjective.value = npc.objective || "none"
    this.selectObjective.onchange = e => {
        if (this.selectObjective.selectedIndex === 0) {
            delete npc.objective 
        }
        else {
            npc.objective =  this.selectObjective.value 
        }
    }


    this.div.appendChild(document.createElement("hr"))

    this.setupSheetSelects()

    this.div.appendChild(document.createElement("hr"))

    this.npcDetailsDelete = document.createElement("button")
    this.npcDetailsDelete.innerHTML = "Delete NPC"
    this.div.appendChild(this.npcDetailsDelete)

    this.npcDetailsDelete.onclick = e => {
        let i = this.map.data.npcs.indexOf(npc)
        this.map.data.npcs.splice(i, 1)
        
        npcDiv.parentElement.removeChild(npcDiv)
        for (i = 0; i < this.map.activeSprites.length; i++) {
            if (this.map.activeSprites[i].thing === npc) {
                this.map.activeSprites.splice(i, 1)
            }
        }
        this.editor.drawNPCs()

        this.window.close()
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

NPCFragment.prototype.setupSheetSelects = function () {
    var caption

    caption = document.createElement("div")
    caption.innerHTML = "Music Beat:"
    this.div.appendChild(caption)

    this.selectBeat = document.createElement("select")
    this.selectBeat.innerHTML = "<option></option><option>1</option><option>2</option><option>3</option><option>4</option>"
    this.div.appendChild(this.selectBeat)

    this.selectBeat.value = this.npc.musicBeat || ""
    this.selectBeat.onchange = e => this.npc.musicBeat = this.selectBeat.value * 1


    var sheetOptions = "<option></option>"
    var sheets = this.npc.sprite.sheets
    for (var sheetName in sheets) {
        sheetOptions += "<option>" + sheetName + "</option>"
    }

    caption = document.createElement("div")
    caption.innerHTML = "Initial State:"
    this.div.appendChild(caption)
    
    this.selectInitialState = document.createElement("select")
    this.selectInitialState.innerHTML = "<option>off</option><option>on</option>"
    this.selectInitialState.value = this.npc.initialState || "off"
    this.selectInitialState.onchange = e => {
        this.npc.initialState =  this.selectInitialState.value 
    }
    this.div.appendChild(this.selectInitialState)

    caption = document.createElement("div")
    caption.innerHTML = "On Sheet:"
    this.div.appendChild(caption)
    

    this.selectOnSheet = document.createElement("select")
    this.selectOnSheet.innerHTML = sheetOptions
    this.selectOnSheet.value = this.npc.onSheet || ""
    this.selectOnSheet.onchange = e => {
        this.npc.onSheet =  this.selectOnSheet.value 
    }
    this.div.appendChild(this.selectOnSheet)

    caption = document.createElement("div")
    caption.innerHTML = "Off Sheet:"
    this.div.appendChild(caption)

    this.selectOffSheet = document.createElement("select")
    this.selectOffSheet.innerHTML = sheetOptions
    this.selectOffSheet.value = this.npc.offSheet || ""
    this.selectOffSheet.onchange = e => {
        this.npc.offSheet =  this.selectOffSheet.value 
        console.log(this.npc)
    }
    this.div.appendChild(this.selectOffSheet)

    caption = document.createElement("div")
    caption.innerHTML = "Beat Sheet:"
    this.div.appendChild(caption)

    this.selectBeatSheet = document.createElement("select")
    this.selectBeatSheet.innerHTML = sheetOptions
    this.selectBeatSheet.value = this.npc.beatSheet || ""
    this.selectBeatSheet.onchange = e => {
        this.npc.beatSheet =  this.selectBeatSheet.value 
        console.log(this.npc)
    }
    this.div.appendChild(this.selectBeatSheet)

}

NPCFragment.prototype.setupMotionSelect = function () {
    let caption = document.createElement("div")
    caption.innerHTML = "Motion:"
    this.div.appendChild(caption)
    this.motionSelect = document.createElement("select")
    this.motionSelect.innerHTML = "<option>NONE</option><option>UPDOWN</option><option>LEFTRIGHT</option>"
    this.motionSelect.value = this.npc.motion || "NONE"
    this.motionSelect.onchange = e => {
        this.npc.motion = this.motionSelect.value
    }
    this.div.appendChild(this.motionSelect)
    
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
    this.map = editor.map
    var song = editor.song

    this.gamePage = "char.htm"

    this.div = document.createElement("div")

    this.data.music = song ? song.getData() : undefined
    
    // check to see what's actually changed?
    var mapChanged = true
    this.showSaveButtons()

}

SaveFragment.prototype.save = function () {
    this.data.name = this.nameInput.value
    this.data.type = "RPGMAP"
    this.map.updateYLines()
    

    omg.server.post(this.data, res => {
        this.saved(res)        
    })
}

SaveFragment.prototype.saved = function (res) {
    this.data.id = res.id
    this.data.user_id = res.user_id

    this.div.innerHTML = "Saved!<br>" + 
                        "<a href='" + this.gamePage + "?id=" + res.id + "'>" +
                        this.gamePage + "?id=" + res.id + "</a>"

    
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

    this.nameInput = document.createElement("input")
    var caption = document.createElement("div")
    caption.innerHTML = "Map Name:"
    this.div.appendChild(caption)

    this.nameInput.value = this.data.name
    this.div.appendChild(this.nameInput)

    this.div.appendChild(document.createElement("br"))

    var canOverwrite = this.user && this.data.user_id === this.user.id

    if (this.data.id && canOverwrite) {
        var overwriteButton = document.createElement("button")
        overwriteButton.innerHTML = "Overwrite MAP"
        overwriteButton.onclick = e => {
            this.save()
        }

        var saveCopyButton = document.createElement("button")
        saveCopyButton.innerHTML = "Save Copy of MAP"
        saveCopyButton.onclick = e => {
            delete this.data.id
            this.save()
        }
        
        this.div.appendChild(overwriteButton)
        this.div.appendChild(saveCopyButton)
    }
    else {
        delete this.data.id
        this.save()
    }
}


export function RegionFragment(region, toolboxDiv, editor) {
    this.editor = editor
    this.data = editor.map.data
    this.map = editor.map
    this.div = document.createElement("div")
    
    var caption
    caption = document.createElement("div")
    caption.innerHTML = "Region name:"
    this.div.appendChild(caption)
    this.nameInput   = document.createElement("input")
    this.nameInput.value = region.name
    this.div.appendChild(this.nameInput)

    this.selectType = document.createElement("select")
    this.selectType.innerHTML = "<option value='HTML'>HTML</option><option value='MAP'>Door to another map</option>"
    this.div.appendChild(this.selectType)

    caption = document.createElement("div")
    caption.innerHTML = "Data:"
    this.div.appendChild(caption)

    this.dataInput = document.createElement("textarea")
    this.dataInput.value = region.data
    this.div.appendChild(this.dataInput)

    this.nameInput.onkeypress = e => {
        if (e.key === "Enter") {
            region.name = this.nameInput.value
            
            toolboxDiv.innerHTML = region.name
        }
    }

    this.dataInput.onkeyup = e => {
        region.data = this.dataInput.value //.split("\n")
    }

    caption = document.createElement("div")
    caption.innerHTML = "Music Beat:"
    this.div.appendChild(caption)

    this.selectBeat = document.createElement("select")
    this.selectBeat.innerHTML = "<option></option><option>1</option><option>2</option><option>3</option><option>4</option>"
    this.div.appendChild(this.selectBeat)

    this.selectBeat.value = region.musicBeat || ""
    this.selectBeat.onchange = e => region.musicBeat = this.selectBeat.value * 1

    caption = document.createElement("div")
    caption.innerHTML = "Walkable:"
    this.div.appendChild(caption)

    this.selectWalkable = document.createElement("select")
    this.selectWalkable.innerHTML = "<option></option><option>true</option><option>onbeat</option><option>offbeat</option>"
    this.div.appendChild(this.selectWalkable)

    this.selectWalkable.value = region.walkable || ""
    this.selectWalkable.onchange = e => region.walkable = this.selectWalkable.value

    caption = document.createElement("div")
    caption.innerHTML = "Function:"
    this.div.appendChild(caption)

    this.functionInput   = document.createElement("input")
    this.functionInput.value = region.function || ""
    this.div.appendChild(this.functionInput)


    this.functionInput.onkeypress = e => {
        if (e.key === "Enter") {
            region.function = this.functionInput.value
            
        }
    }


    caption = document.createElement("div")
    caption.innerHTML = "<hr>"
    this.div.appendChild(caption)

    var deleteButton = document.createElement("button")
    deleteButton.innerHTML = "Delete Region"
    this.div.appendChild(deleteButton)

    deleteButton.onclick = e => {
        var i = this.data.regions.indexOf(region)
        if (i > -1) {
            this.data.regions.splice(i, 1)
        }
        for (i = 0; i < this.map.activeSprites.length; i++) {
            if (this.map.activeSprites[i].thing === region) {
                this.map.activeSprites.splice(i, 1)
            }
        }
        
        editor.drawNPCs()
        this.window.close()

        toolboxDiv.parentElement.removeChild(toolboxDiv)
        
    }

}

export function SizeFragment(editor) {
    this.data = editor.data
    this.editor = editor
    var map = editor.map
    this.map = map
    this.div = document.createElement("div")

    var caption
    caption = document.createElement("span")
    caption.innerHTML = "Size: "
    this.div.appendChild(caption)

    this.widthInput = document.createElement("input")
    this.widthInput.type = "number"
    this.heightInput = document.createElement("input")
    this.heightInput.type = "number"

    this.widthInput.className = "size-input"
    this.heightInput.className = "size-input"

    this.widthInput.value = this.data.width
    this.heightInput.value = this.data.height
 
    this.div.appendChild(this.widthInput)
    
    caption = document.createElement("span")
    caption.innerHTML = "&times;"
    this.div.appendChild(caption)

    this.div.appendChild(this.heightInput)

    this.div.appendChild(document.createElement("br"))
    this.div.appendChild(document.createElement("br"))

    this.zoomInButton = document.createElement("button")
    this.zoomOutButton = document.createElement("button")   

    this.zoomInButton.innerHTML = "Zoom +"
    this.zoomOutButton.innerHTML = "Zoom -"

    this.div.appendChild(this.zoomInButton)
    this.div.appendChild(this.zoomOutButton)

    this.widthInput.onchange = e => editor.resizeMap(parseInt(this.widthInput.value), parseInt(this.heightInput.value))
    this.heightInput.onchange = e => editor.resizeMap(parseInt(this.widthInput.value), parseInt(this.heightInput.value))
    
    this.zoomInButton.onclick = () => {
        map.tileSize += 2
        map.resizeSpriters()
        editor.resizeMap()
    }
    this.zoomOutButton.onclick = () => {
        map.tileSize -= 2
        map.resizeSpriters()
        editor.resizeMap()
    }

    this.div.appendChild(document.createElement("br"))
    this.div.appendChild(document.createElement("hr"))
    this.div.appendChild(document.createElement("br"))

    this.doubleXButton = document.createElement("button")
    this.doubleYButton = document.createElement("button")   

    this.doubleXButton.innerHTML = "Double Width"
    this.doubleYButton.innerHTML = "Double Height"

    this.div.appendChild(this.doubleXButton)
    this.div.appendChild(this.doubleYButton)

    this.doubleXButton.onclick = e => this.doubleX()
    this.doubleYButton.onclick = e => this.doubleY()
}

SizeFragment.prototype.doubleX = function () {

    var tiles = []
    var row
    var i = 0
    for (var x = 0; x < this.data.width; x++) {
        row = [] 
        tiles.push(row)
        tiles.push(row)
        for (var y = 0; y < this.data.height; y++) {
            row.push(this.map.tiles[x][y])
        }
    }
    this.map.tiles = tiles
    this.data.width = this.data.width * 2
    this.widthInput.value = this.data.width
    this.map.draw()

    this.editor.onChanged({type: "SIZE", mode: "Double Width"})
}

SizeFragment.prototype.doubleY = function () {

    var tiles = []
    var row
    var i = 0
    for (var x = 0; x < this.data.width; x++) {
        row = [] 
        tiles.push(row)
        for (var y = 0; y < this.data.height; y++) {
            row.push(this.map.tiles[x][y])
            row.push(this.map.tiles[x][y])
        }
    }
    this.map.tiles = tiles
    this.data.height = this.data.height * 2
    this.heightInput.value = this.data.height
    this.map.draw()

    this.editor.onChanged({type: "SIZE", mode: "Double Height"})
}

export function MiniMapFragment(editor) {
    this.editor = editor
    this.div = document.createElement("canvas")
    this.ctx = this.div.getContext("2d")
    this.map = editor.map
    this.draw()
    
}

MiniMapFragment.prototype.draw = function () {
    this.map.drawCustom({
        canvas: this.div, 
        tileSize: 16
    })
}


export function UndoFragment(editor) {
    this.editor = editor
    this.map = editor.map
    this.undoStack = editor.undoStack
    this.div = document.createElement("div")


    var undoButton = document.createElement("button")
    undoButton.onclick = () => this.undo() 
    undoButton.innerHTML = "Undo Last"
    this.div.appendChild(undoButton)

    this.listDiv = document.createElement("div")
    this.div.appendChild(this.listDiv)

    this.divMap = new Map()

    for (let undo of editor.undoStack) {
        let div = document.createElement("div")
        div.innerHTML = undo.time.toLocaleTimeString() + " " + undo.type + " " + (undo.mode || "")
        this.listDiv.insertBefore(div, this.listDiv.firstChild)
        this.divMap.set(undo, div)
    }

    this.listener = undo => {
        let div = document.createElement("div")
        div.innerHTML = undo.time.toLocaleTimeString() + " " + undo.type + " " + (undo.mode || "")
        this.listDiv.insertBefore(div, this.listDiv.firstChild)
        this.divMap.set(undo, div)
    }
    editor.onchangedlisteners.push(this.listener)

}

UndoFragment.prototype.undo = function () {
    if (this.undoStack.length === 0) {
        return
    }

    let undo = this.undoStack.pop()
    
    this.map.data.yLines = undo.state.yLines
    this.map.loadTiles()
    this.map.draw()

    this.editor.setWorkingState()

    let div = this.divMap.get(undo)
    if (div) {
        this.listDiv.removeChild(div)
    }
}

export function PropertiesFragment(editor) {
    this.editor = editor
    this.map = editor.map
    this.data = editor.data

    this.div = document.createElement("div")
    
    var caption
    caption = document.createElement("div")
    caption.innerHTML = "Map Name:"
    this.div.appendChild(caption)

    var nameInput = document.createElement("input")
    nameInput.value = this.data.name
    this.div.appendChild(nameInput)

    caption = document.createElement("div")
    caption.innerHTML = "Gravity On:"
    this.div.appendChild(caption)

    var gravityInput = document.createElement("input")
    gravityInput.type = "CHECKBOX"
    gravityInput.checked = this.data.gravity
    this.div.appendChild(gravityInput)

    nameInput.onchange = e => this.data.name = nameInput.value
    gravityInput.onchange = e => this.data.gravity = gravityInput.checked


}

export function PaletteFragment(editor) {
    this.editor = editor
    this.map = editor.map
    this.div = document.createElement("div")
    
    var caption
    caption = document.createElement("div")
    caption.innerHTML = "Palette Colors:"
    this.div.appendChild(caption)

    for (var i = 0; i < this.map.data.palette.length; i++) {
        let div = document.createElement("div")
        let color = this.map.data.palette[i]
        div.style.fontSize = "1.4em"
        div.innerHTML = "<span style='background-color:" + color + ";'>&nbsp;&nbsp;&nbsp;&nbsp;</span> " +  color

        let deleteButton = document.createElement("span")
        deleteButton.innerHTML = " &times;"
        deleteButton.onclick = e => {
            this.div.removeChild(div)
            //debugger
            var index = this.map.data.palette.indexOf(color)
            this.map.data.palette.splice(index, 1)
        }
        div.appendChild(deleteButton)
        this.div.appendChild(div)
    }

}