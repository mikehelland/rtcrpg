import OMGSpriter from "/apps/sprite/spriter.js"
import OMGRPGMap from "./rpgmap.js"
import OMGWindowManager from "/js/window_manager.js"

export default function OMGMapEditor (div) {
    console.log(div)
    this.div = div
    this.zoom = 1

    this.mode = "TILE"
    this.img = {
        characters: document.getElementById("characters-spritesheet"),
        tiles: {}
    }

    this.spriters = new Map()

    this.gamePage = "char.htm"

    this.wm = new OMGWindowManager({div: document.body})
    this.setupMenu()
    this.setupControls()

}

OMGMapEditor.prototype.load = function (data) {

    var load = () => {
        if (!data.tileSet) {
            data.tileSet = this.tileSets[0]
        }
        this.loadTileSet(data.tileSet)

        this.map = new OMGRPGMap(data, {div: this.div, img: this.img})
        this.data = data
        this.canvas = this.map.charCanvas
        this.setupEvents(this.map.charCanvas)

        //this.map.charCanvas.style.width = "100%"
        //this.map.charCanvas.style.height = "100%"
        
        if (!this.data.palette) {
            this.data.palette = []
        }
        this.nameInput.value = data.name
        this.widthInput.value = data.width
        this.heightInput.value = data.height

        //this.div.style.width = this.data.width * this.map.tileSize * this.zoom + "px"
        //this.div.style.height = this.data.height * this.map.tileSize * this.zoom + "px"
        
        this.loadNPCs()
        this.loadHTML()

        this.map.draw()
        this.drawNPCs()

        if (this.map.data.music) {
            this.loadMusic(this.map.data.music)
        }
    }

    if (this.tileSets) {
        load()
    }
    else {
        this.onready = () => load()
    }
}


OMGMapEditor.prototype.loadTileSet = function (tileSet) {
    
    Object.keys(tileSet.tileCodes).forEach(key => {
        this.loadTile(key, tileSet)
    })
}

OMGMapEditor.prototype.loadTile = function (key, tileSet, onload) {
    var img = document.createElement("img")
    img.onload = onload
    if (!tileSet.tileCodes[key]) {
        img.src = OMGTileEditor.prototype.blankTile
    }
    else if (tileSet.tileCodes[key].startsWith("data:image/png")) {
        img.src = tileSet.tileCodes[key]
    }
    else {
        img.src = (tileSet.prefix + "") + tileSet.tileCodes[key] + (tileSet.postfix || "")
    }
    this.img.tiles[key] = img
    if (this.tileListDiv) {
        this.tileListDiv.appendChild(img)
        img.onclick = () => {
            if (this.selectedTileDiv) {
                this.selectedTileDiv.classList.remove("selected")
            }
            this.selectedTile = key
            this.selectedTileDiv = img
            img.className = "selected"
        }
        img.ondblclick = e => {
            this.showTileEditor(key, img, tileSet)    
        }
        if (this.tileListDiv.childElementCount === 1) {
            img.onclick()
        }
    }
    return img
}


OMGMapEditor.prototype.setupEvents = function (canvas) {
    this.offsets = omg.ui.totalOffsets(canvas)
        
    canvas.onmousedown = (e) => {
        this.offsets = omg.ui.totalOffsets(canvas)
        this._movex = Math.floor((e.clientX - this.offsets.left) / this.map.tileSize)
        this._movey = Math.floor((e.clientY - this.offsets.top) / this.map.tileSize)
        if (this.mode === "TILE" && this.tileDrawMode !== "Fill") {
            this.tileEvent(this._movex, this._movey)
        }
        if (this.mode === "TILE" && this.tileDrawMode === "Fill") {
            this.tileFill(this._movex, this._movey)
        }
        if (this.mode === "HTML_PLACE") {
            this.htmlBeingAdded = this.addHTML(e)
            this.mode = "HTML_STRETCH"
        }
        if (this.mode === "NPC_SELECT") {
            this.mode = "NPC_MOVE"
        }
        this.isTouching = true    
    }
    canvas.onmousemove = (e) => {
        if (!this.map) {
            return
        }
        this._movex = Math.floor((e.clientX - this.offsets.left) / this.map.tileSize)
        this._movey = Math.floor((e.clientY - this.offsets.top) / this.map.tileSize)
        if (this.mode === "TILE" && this.tileDrawMode !== "Fill") {
            if (this.isTouching) {
                this.tileEvent(this._movex, this._movey)
            }
            else {
                this.tilePreview(this._movex, this._movey)
            }
        }
        else if (this.mode.indexOf("NPC_PLACE") > -1 || this.mode.indexOf("NPC_MOVE") > -1) {
            this.drawSpritePreview(this._movex, this._movey)
        }
        else if (this.mode.indexOf("_PLACE") > -1) {
            this.highlightTile(this._movex, this._movey)
        }
        else if (this.mode.indexOf("_MOVE") > -1) {
            this.highlightTile(this._movex, this._movey)
        }
        else if (this.mode === "HTML_STRETCH") {
            this.stretchHTML(e)
        }
    }
    canvas.onmouseup = (e) => {
        
        this._movex = Math.floor((e.clientX - this.offsets.left) / this.map.tileSize)
        this._movey = Math.floor((e.clientY - this.offsets.top) / this.map.tileSize)
        
        if (this.mode === "TILE" && this.tileDrawMode === "Fill") {
            if (this.isTouching) {
                //this.tileFill(e)
            }    
        }
        else if (this.mode === "NPC_PLACE") {
            this.addNPC(this._movex, this._movey)
        }
        else if (this.mode === "NPC_MOVE") {
            this.moveNPC(this._movex, this._movey)
        }
        else if (this.mode === "HERO_MOVE") {
            this.moveHero(this._movex, this._movey)
        }
        else if (this.mode === "HTML_STRETCH") {
            //this.addHTML(e)
            this.mode = "HTML_SELECT"
        }
        this.isTouching = false
    }

    canvas.onmouseleave = e => {
        this.drawNPCs()
    }
}

OMGMapEditor.prototype.tileEvent = function (x, y, brushing) {
    
    if (this.selectedTile && this.map.tiles[x] && this.map.tiles[x][y]) {
        this.map.tiles[x][y] = {code: this.selectedTile}

        this.map.ctx.drawImage(this.img.tiles[this.selectedTile],
            x * this.map.tileSize, 
            y * this.map.tileSize,
            this.map.tileSize, this.map.tileSize)
    }

    if (this.tileDrawMode === "Brush" && !brushing) {
        this.tileEvent(x - 1, y - 1, true)
        this.tileEvent(x - 1, y, true)
        this.tileEvent(x - 1, y + 1, true)
        this.tileEvent(x, y - 1, true)
        this.tileEvent(x, y + 1, true)
        this.tileEvent(x + 1, y - 1, true)
        this.tileEvent(x + 1, y, true)
        this.tileEvent(x + 1, y + 1, true)
    }
}

OMGMapEditor.prototype.tileFill = function (x, y) {
    
    var fillTile = this.map.tiles[x][y].code

    var tilesChecked = {}
    var nextTiles = [[x, y]]
    this.map.tiles[x][y].code = this.selectedTile
    this.map.ctx.drawImage(this.img.tiles[this.selectedTile],
        x * this.map.tileSize, 
        y * this.map.tileSize,
        this.map.tileSize, this.map.tileSize)

    while (nextTiles.length > 0) {
        var newTiles = []

        for (var i = 0; i < nextTiles.length; i++) {
            x = nextTiles[i][0]
            y = nextTiles[i][1]
            //console.log(y, x)

            if (!tilesChecked[x + "," + y]) {
                tilesChecked[x + "," + y] = true

                this.checkFillTile(x + 1, y, fillTile, newTiles)
                this.checkFillTile(x - 1, y, fillTile, newTiles)
                this.checkFillTile(x, y + 1, fillTile, newTiles)
                this.checkFillTile(x, y - 1, fillTile, newTiles)

            }
        }

        nextTiles = newTiles
    }

}

OMGMapEditor.prototype.checkFillTile = function (x, y, fillTile, newTiles) {
    if (this.map.tiles[x] && this.map.tiles[x][y] && this.map.tiles[x][y].code === fillTile) {
        newTiles.push([x, y])
        this.map.tiles[x][y].code = this.selectedTile
        this.map.ctx.drawImage(this.img.tiles[this.selectedTile],
            x * this.map.tileSize, 
            y * this.map.tileSize,
            this.map.tileSize, this.map.tileSize)
        
    }
}


OMGMapEditor.prototype.tilePreview = function (x, y, brushing) {

    if (!brushing) {
        this.drawNPCs()
    }

    if (this.selectedTile) {
        this.map.charCtx.drawImage(this.img.tiles[this.selectedTile],
            x * this.map.tileSize, 
            y * this.map.tileSize,
            this.map.tileSize, this.map.tileSize)
    }

    if (this.tileDrawMode === "Brush" && !brushing) {
        this.tilePreview(x - 1, y - 1, true)
        this.tilePreview(x - 1, y, true)
        this.tilePreview(x - 1, y + 1, true)
        this.tilePreview(x, y - 1, true)
        this.tilePreview(x, y + 1, true)
        this.tilePreview(x + 1, y - 1, true)
        this.tilePreview(x + 1, y, true)
        this.tilePreview(x + 1, y + 1, true)
    }
}

OMGMapEditor.prototype.setupControls = function () {

    /*this.mainMenuWindow = this.wm.newWindow({
        div: document.getElementById("main-menu"),
        x:80, y:0, width: window.innerWidth - 84, height: 60
    })*/
    this.canvasWindow = this.wm.newWindow({
        div: document.getElementById("drawing-window"),
        x:100, y:5, width: window.innerWidth - 130, height: window.innerHeight - 50,
        caption: "Map"
    })
    this.toolBoxWindow = this.wm.newWindow({
        div: document.getElementById("tools"),
        x:0, y:5, width: 95, height: window.innerHeight - 50,
        caption: "Toolbox"
    })
    

    this.nameInput = document.getElementById("map-name")
    this.widthInput = document.getElementById("map-width-input")
    this.heightInput = document.getElementById("map-height-input")
    this.widthInput.onchange = e => this.resizeMap()
    this.heightInput.onchange = e => this.resizeMap()
    this.toolBoxSelect = document.getElementById("tool-box-select")
    this.tileModeDiv = document.getElementById("tile-mode")
    this.tileListDiv = document.getElementById("tile-list")
    this.characterModeDiv = document.getElementById("character-mode")
    this.characterListDiv = document.getElementById("character-list")
    this.htmlListDiv = document.getElementById("html-list")
    this.musicModeDiv = document.getElementById("music-mode")
    this.tileHighlightDiv = document.getElementById("tile-highlight")

    this.toolBoxSelect.onchange = e => this.selectToolBox(e)
    this.toolBoxSelect.value = "Tiles"
    this.selectToolBox({target: {value: "Tiles"}})
    
    document.getElementById("zoom-out-button").onclick = () => {
        this.map.tileSize -= 2
        this.resizeMap()
    }
    document.getElementById("zoom-in-button").onclick = () => {
        this.map.tileSize += 2
        this.resizeMap()
    }

    document.getElementById("save-button").onclick = () => this.save()

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
    omg.server.getHTTP("/user", user => this.user = user)

    this.tileSetSelect = document.getElementById("tile-set-select")

    this.tileSelectMode = document.getElementById("tile-draw-mode")
    this.tileSelectMode.onchange = e => {
        this.tileDrawMode = this.tileSelectMode.value
    }
    this.tileDrawMode = this.tileSelectMode.value

    this.tileSetSelect.onchange = e => {
        for (let i = 0; i < this.tileSets.length; i++) {
            if (this.tileSets[i].name === this.tileSetSelect.value) {
                this.tileListDiv.innerHTML = ""
                this.map.data.tileSet = this.tileSets[i]
                this.loadTileSet(this.tileSets[i])
                this.map.draw()
                return
            }
        }
    }

    this.copyTileButton = document.getElementById("tile-list-copy-button")
    this.addTileButton = document.getElementById("tile-list-new-button")
    this.addTileButton.onclick = e => {
        var code = "n" + Math.trunc(Math.random() * 1000)
        this.data.tileSet.tileCodes[code] = ""
        var img = this.loadTile(code, this.data.tileSet)
        img.onclick()
        this.showTileEditor(code, img)
    }
    this.copyTileButton.onclick = e => {
        var code = "n" + Math.trunc(Math.random() * 1000)
        this.data.tileSet.tileCodes[code] = "" //this.sourceCtx.canvas.toDataURL("image/png")
        var img = this.loadTile(code, this.data.tileSet)
        img.src = this.img.tiles[this.selectedTile].src
        img.onclick()
        this.showTileEditor(code, img)
    }

    
    this.setupNPCControls()
    this.setupHTMLControls()
    this.setupMusicControls()

    this.selectCharacterDialog = document.getElementById("select-character-dialog")
    this.selectCharacterList = document.getElementById("select-character-list")

    omg.server.getHTTP("/data/?type=TILESET", results => {
        this.tileSets = results
        results.forEach(result => {
            result.url = window.location.origin + "/data/" + result.id
            var newOption = document.createElement('option')
            this.tileSetSelect.appendChild(newOption)
            newOption.innerHTML = result.name
        })

        // we want the tilesets loaded for a blank map before we're ready to load
        if (this.onready) {
            this.onready()
        }
    })
}

OMGMapEditor.prototype.setupSelectCharacterDialog = function () {

    var searchBox = new OMGSearchBox({types: ["SPRITE"]})

    this.selectCharacterList.appendChild(searchBox.div)
    
    searchBox.onclickcontent = e => {
        this.placeNPC(e.data)
    }

    searchBox.search()
}

OMGMapEditor.prototype.resizeMap = function () {
    this.data.width = parseInt(this.widthInput.value)
    this.data.height = parseInt(this.heightInput.value)
    this.canvas.width = this.data.width * this.map.tileSize * this.zoom
    this.canvas.height = this.data.height * this.map.tileSize * this.zoom
    this.canvas.style.width = this.canvas.width + "px"
    this.canvas.style.height = this.canvas.height + "px"

    for (var x = 0; x < this.data.width; x++) {
        if (!this.map.tiles[x]) {
            this.map.tiles[x] = []
        }
        for (var y = 0; y < this.data.height; y++) {
            if (!this.map.tiles[x][y]) {
                this.map.tiles[x][y] = {code: ""}
            }
        }
    }

    this.map.draw()
}

OMGMapEditor.prototype.save = function () {
    this.data.name = this.nameInput.value
    this.data.type = "RPGMAP"

    this.map.updateYLines()
    
    if (this.data.id) {
        if (this.user && this.data.user_id === this.user.id) {
            this.wm.newWindow({div: document.getElementById("overwrite-or-new"), width: 200, height: 200})
            return
        }
        else {
            delete this.data.id
        }
    }

    omg.server.post(this.data, res => {
        this.saved(res)        
    })
}

OMGMapEditor.prototype.saved = function (res) {
    var urlTag = document.getElementById("saved-url")
    var url = this.gamePage + "?id=" + res.id
    urlTag.href = url
    urlTag.innerHTML = url

    this.wm.newWindow({div: document.getElementById("saved"), caption: "Saved", width: 200, height: 200})
}

OMGMapEditor.prototype.selectToolBox = function (e) {
    if (this.lastToolBox) {
        this.lastToolBox.style.display = "none"
        this.lastToolBox = null
    }

    if (e.target.value === "Tiles") {
        this.tileModeDiv.style.display = "block"
        this.mode = "TILE"
        this.lastToolBox = this.tileModeDiv
    }
    else if (e.target.value === "NPCs") {
        this.characterModeDiv.style.display = "block"
        this.mode = "NPC_SELECT"
        this.lastToolBox = this.characterModeDiv
    }
    else if (e.target.value === "HTML") {
        this.htmlListDiv.style.display = "block"
        this.mode = "HTML_SELECT"
        this.lastToolBox = this.htmlListDiv
    }
    else if (e.target.value === "Hero") {
        this.mode = "HERO_MOVE"
    }
    else if (e.target.value === "Music") {
        this.musicModeDiv.style.display = "block"
        this.mode = "MUSIC"
        this.lastToolBox = this.musicModeDiv
    }
    
}

OMGMapEditor.prototype.setupNPCControls = function () {
    this.tileHighlightDiv = document.getElementById("tile-highlight")
    this.addNPCButton = document.getElementById("add-npc-button")
    this.addNPCButton.onclick = e => {
        if (!this.isCharacterDialogAnimate) {
            this.isCharacterDialogAnimate = true
            this.setupSelectCharacterDialog()
        }
        this.selectCharacterDialog.style.display = "block"
        this.closeSelectCharacerDialog = omg.ui.showDialog(this.selectCharacterDialog)
    }
    
}

OMGMapEditor.prototype.setupHTMLControls = function () {
    
    this.addHTMLButton = document.getElementById("add-html-button")
    this.addHTMLButton.onclick = e => {
        e.target.innerHTML = "Place..."
        this.mode = "HTML_PLACE"
    }
    this.htmlDetailsDiv = document.getElementById("html-details")
    this.htmlDetailsName = document.getElementById("html-details-name")
    this.htmlDetailsInput = document.getElementById("html-input")
}

OMGMapEditor.prototype.setupMusicControls = function () {
    
    this.musicDetailsSelect = document.getElementById("music-details-select")
    this.musicDetailsEditor = document.getElementById("music-details-editor")
    this.selectMusicButton = document.getElementById("music-select-button")
    this.selectMusicButton.onclick = e => {
        this.musicDetailsSelect.style.display = "block"
        this.musicDetailsEditor.style.display = "none"
        
        if (!this.isMusicSelectSetup) {
            this.setupMusicSelect()
            this.isMusicSelectSetup = true
        }
        
    }

    this.musicEditorButton = document.getElementById("music-editor-button")
    this.musicEditorButton.onclick = e => {
        this.musicDetailsSelect.style.display = "none"
        this.musicDetailsEditor.style.display = "block"
        if (!this.data.music) {
            this.data.music = {}
        }
        this.setupMusicEditor(this.data.music.id)
    }
    
}

OMGMapEditor.prototype.highlightTile = function (x, y) {
    this.tileHighlightDiv.style.display = "block"
    this.tileHighlightDiv.style.width = this.map.tileSize * this.zoom + "px"
    this.tileHighlightDiv.style.height = this.map.tileSize * this.zoom + "px"
    this.tileHighlightDiv.style.left = x * this.map.tileSize - 3 + "px"
    this.tileHighlightDiv.style.top = y * this.map.tileSize + 1.5 + "px"
}

OMGMapEditor.prototype.addNPC = async function (x, y) {
    
    var npc = {
        "name": this.selectedSprite ? this.selectedSprite.name : "name me",
        "x": x,
        "y": y,
        "sprite": this.selectedSprite,
        "dialog": [
          "Hi!"
        ]
    }

    let spriter = this.previewSpriter
    spriter.w = spriter.w * this.zoom
    spriter.h = spriter.h * this.zoom

    this.spriters.set(npc, spriter)
    this.previewSpriter = null


    var div = this.setupNPCToolBoxDiv(npc)
    
    this.map.data.npcs.push(npc)
    this.showNPCDetails(npc, div)

    // todo this should be where the npc is selected
    this.selectedNPC = npc

    this.mode = "NPC_SELECT"
    this.tileHighlightDiv.style.display = "none"
    this.addNPCButton.innerHTML = "+Add"

    this.map.activeSprites.push({npc, spriter})
    this.drawNPCs()
}

OMGMapEditor.prototype.placeNPC = function (sprite) {
    this.addNPCButton.innerHTML = "Place..."
    this.mode = "NPC_PLACE"
    this.selectedSprite = sprite
    this.previewSpriter = new OMGSpriter(sprite, this.map.charCanvas)
    this.previewSpriter.setSheet()
    this.previewSpriter.w = this.previewSpriter.w * this.zoom
    this.previewSpriter.h = this.previewSpriter.h * this.zoom


    if (this.closeSelectCharacerDialog) {
        this.closeSelectCharacerDialog()
    }
}

OMGMapEditor.prototype.addHTML = function (e) {
    var x = Math.floor((e.clientX - this.canvas.offsetLeft) / this.map.tileSize)
    var y = Math.floor((e.clientY - this.canvas.offsetTop) / this.map.tileSize)

    var html = {
        "name": "name me",
        "x": x,
        "y": y,
        "innerHTML": "<iframe src='URL_HERE'></iframe>"
    }

    var div = this.setupHTMLToolBoxDiv(html)
    
    this.map.html.push(html)
    //this.showHTMLDetails(html, div)
    
    this.mode = "HTML_SELECT"
    this.tileHighlightDiv.style.display = "none"
    this.addHTMLButton.innerHTML = "+Add"

    this.drawNPCs()
    return html
}

OMGMapEditor.prototype.showNPCDetails = function (npc, npcDiv) {
    
    var f = new NPCFragment(npc, this)
    this.wm.showFragment(f, {
        width: 350,
        height: 500,
        caption: "NPC - " + npc.name,
        x: window.innerWidth - 510,
        y: 70
    })


    //this.drawNPCs()
}

OMGMapEditor.prototype.showHTMLDetails = function (html, div) {
    this.htmlDetailsDiv.style.display = "block"
    this.htmlDetailsName.value = html.name
    this.htmlDetailsName.onkeypress = e => {
        if (e.key === "Enter") {
            html.name = this.htmlDetailsName.value
            div.getElementsByTagName("div")[0].innerHTML = html.name
        }
    }

    this.htmlDetailsInput.value = html.innerHTML //.join("\n")
    this.htmlDetailsInput.onkeyup = e => {
        html.innerHTML = this.htmlDetailsInput.value //.split("\n")
    }

    this.selectedHTML = html
    this.drawNPCs()
}

OMGMapEditor.prototype.setupNPCToolBoxDiv = function (npc) {
    var npcDiv = document.createElement("div")
    npcDiv.className = "npc-tool-item"
    var npcImg = document.createElement("img")
    var npcName = document.createElement("div")
    npcName.innerHTML = npc.name
    //npcDiv.appendChild(npcImg)
    npcDiv.appendChild(npcName)
    npcDiv.onclick = e => {
        this.showNPCDetails(npc, npcDiv)
    }
    this.characterListDiv.appendChild(npcDiv)
    return npcDiv
}

OMGMapEditor.prototype.setupHTMLToolBoxDiv = function (html) {
    var div = document.createElement("div")
    div.className = "npc-tool-item"
    var name = document.createElement("div")
    name.innerHTML = html.name
    div.appendChild(name)
    div.onclick = e => {
        this.showHTMLDetails(html, div)
    }
    this.htmlListDiv.appendChild(div)
    return div
}

OMGMapEditor.prototype.drawNPCs = function () {
    if (!this.data) {
        return
    }

    this.map.charCanvas.width = this.map.canvas.width
    this.map.charCanvas.height = this.map.canvas.height
    this.map.charCanvas.style.width = this.map.canvas.width * this.zoom + "px"
    this.map.charCanvas.style.height = this.map.canvas.height * this.zoom + "px"

    this.map.charCanvas.fillStyle = "white"

    this.map.charCtx.fillRect(
        this.data.startX * this.map.tileSize,
        this.data.startY * this.map.tileSize,
        this.map.tileSize, this.map.tileSize)

    this.map.charCtx.strokeStyle = "red"
    if (this.htmlBeingAdded) {
        this.map.charCtx.strokeRect(this.htmlBeingAdded.x * this.map.tileSize,
            this.htmlBeingAdded.y * this.map.tileSize,
            this.htmlBeingAdded.width * this.map.tileSize,
            this.htmlBeingAdded.height * this.map.tileSize)
    }
    
    if (this.data.html) {
        for (this._loop_drawNPCs_i = 0;  this._loop_drawNPCs_i < this.data.html.length; this._loop_drawNPCs_i++) {
            this.map.charCtx.strokeRect(
                this.data.html[this._loop_drawNPCs_i].x * this.map.tileSize,
                this.data.html[this._loop_drawNPCs_i].y * this.map.tileSize,
                this.data.html[this._loop_drawNPCs_i].width * this.map.tileSize,
                this.data.html[this._loop_drawNPCs_i].height * this.map.tileSize)

        }
    }

    this.map.drawNPCs()
    
    if (this.previewSpriter) {
        this.previewSpriter.draw()
    }

    
}

OMGMapEditor.prototype.drawCharacter = function (context, x, y) {
    context.drawImage(this.img.characters,
        ge.hero.spritesheetCoords.x + (ge.animationFrame ? ge.img.frameDiff : 0), 
        ge.hero.spritesheetCoords.y + 50 * ge.hero.facing, 36, 36,
        x, y, 
        this.map.tileSize, this.map.tileSize)
}

OMGMapEditor.prototype.loadNPCs = function () {
    
    for (var item of this.map.activeSprites) {
        
        item.spriter.w = item.spriter.w * this.zoom
        item.spriter.h = item.spriter.h * this.zoom

        this.spriters.set(item.npc, item.spriter)

        this.setupNPCToolBoxDiv(item.npc)
    }
}

OMGMapEditor.prototype.loadHTML = function () {
    if (!this.map.html) {
        this.map.html = []
    }
    for (var i = 0; i < this.map.html.length; i++) {
        this.setupHTMLToolBoxDiv(this.map.html[i])
    }
}

OMGMapEditor.prototype.stretchHTML = function (e) {
 
    var x = Math.ceil((e.clientX - this.canvas.offsetLeft) / this.map.tileSize)
    var y = Math.ceil((e.clientY - this.canvas.offsetTop) / this.map.tileSize)
    this.htmlBeingAdded.width = x - this.htmlBeingAdded.x
    this.htmlBeingAdded.height = y - this.htmlBeingAdded.y

    this.drawNPCs()
}

OMGMapEditor.prototype.moveNPC = function (e) {
    var x = Math.floor((e.clientX - this.canvas.offsetLeft) / this.map.tileSize)
    var y = Math.floor((e.clientY - this.canvas.offsetTop) / this.map.tileSize)
    this.selectedNPC.x = x
    this.selectedNPC.y = y
    this.mode = "NPC_SELECT" 
    this.tileHighlightDiv.style.display = "none"
    this.drawNPCs()
}

OMGMapEditor.prototype.moveHero = function (x, y) {
    this.map.data.startX = x
    this.map.data.startY = y
    this.mode = "HERO_MOVE" 
    this.tileHighlightDiv.style.display = "none"
    this.drawNPCs()
}

OMGMapEditor.prototype.drawSpritePreview = function (x, y) {
    if (this.previewSpriter) {
        this.previewSpriter.x = x * this.map.tileSize
        this.previewSpriter.y = y * this.map.tileSize
        this.drawNPCs() 
    }
}

OMGMapEditor.prototype.setupMusicSelect = function () {

    var iframe = document.createElement("iframe")
    iframe.src = "/select.htm?type=SONG"
    this.musicDetailsSelect.appendChild(iframe)
    
    iframe.onload = () => {
        iframe.contentWindow.onclickcontent = viewer => {
            console.log(viewer) 

            this.map.data.music = {id: viewer.data.id}


        }
    }
}

OMGMapEditor.prototype.setupMusicEditor = function (id) {

    var iframe = document.createElement("iframe")
    iframe.src = "/apps/music/remixer/?id=" + (id || "")
    this.musicDetailsEditor.appendChild(iframe)
    
    iframe.onload = () => {
    }
}


OMGMapEditor.prototype.showTileEditor = function (tile, img, tileSet) {

    if (!this.tileDetails) {
        this.setupTileEditor() 
    }
    else {
        this.wm.show(this.tileDetails.window)
    }

    this.tileDetails.div.style.display = "block"
    this.tileDetails.code.value = tile
    this.tileDetails.tile = tile
    this.tileDetails.img = img

    this.tileDetails.editor.load(img, {
        previewCallback: (data) => {
            img.src = data
            this.data.tileSet.tileCodes[this.tileDetails.code.value] = data //this.tileDetails.editor.getData()
            this.map.img.tiles[tile].src = data
            this.map.img.tiles[tile].onload = () => {this.map.draw()}
            
        }
    })

}


OMGMapEditor.prototype.setupTileEditor = function () {
    
    this.tileDetails = {}

    this.tileDetails.div = document.getElementById("tile-editor-details")
    this.tileDetails.code = document.getElementById("tile-editor-code")
    this.tileDetailsSound = document.getElementById("tile-details-sound")
    this.tileDetailsDialog = document.getElementById("tile-dialog-input")
    this.tileDetailsDelete = document.getElementById("tile-details-delete")

    this.tileDetails.editorDiv = document.getElementById("tile-editor")
    this.tileDetails.renameButton = document.getElementById("tile-editor-rename-button")

    
    if (!this.tileDetails.editor) {
        this.tileDetails.editor = new OMGTileEditor(this.tileDetails.editorDiv, this.map.data.palette)
    }
    
    this.tileDetails.code.onchange = e => {
        this.tileDetails.renameButton.style.display = "inline"    
    }
    this.tileDetails.renameButton.onclick = e => {
        //this.data.tileSet.tileCodes[this.tileDetails.code.value] = this.tileDetails.editor.getData()

        // they changed the name, so update the tiles
        if (this.tileDetails.tile !== this.tileDetails.code.value) {
            for (var col of this.map.tiles) {
                for (var row of col) {
                    if (row.code === this.tileDetails.tile) {
                        row.code = this.tileDetails.code.value
                    }
                }
            }

            if (this.tileListDiv) {
                this.tileListDiv.removeChild(this.tileDetails.img)
            }

            this.data.tileSet.tileCodes[this.tileDetails.code.value] = this.data.tileSet.tileCodes[this.tileDetails.tile]
            delete this.data.tileSet.tileCodes[this.tileDetails.tile]
            this.tileDetails.tile = this.tileDetails.code.value
            this.tileDetails.img = this.loadTile(this.tileDetails.tile, this.data.tileSet, () => {
                this.tileDetails.img.onclick()
                this.tileDetails.img.ondblclick()  
            })
        }
        //this.tileDetails.renameButton.style.display = "none"    
    }

    this.tileDetails.window = this.wm.newWindow({
        div: this.tileDetails.div,
        width: 350,
        height: 500,
        caption: "Tile Editor",
        x: window.innerWidth - 510,
        y: 70
    })

}


OMGMapEditor.prototype.setupMenu = function () {
    this.wm.showMainMenu({
        items: [
            {name: "File", items: [
                {name: "User", onclick: () => this.showUserWindow()},
                {separator: true},
                {name: "New", onclick: () => this.newSong()},
                {name: "Open", onclick: () => this.showOpenWindow()},
                {name: "Save", onclick: () => this.save()},
                {separator: true},
                {name: "Settings", onclick: () => this.showSettingsWindow()},
                {separator: true},
                //{name: "OMG Home", onclick: () => this.showSaveWindow()}
            ]},
            {name: "Window", items: [
                {name: "Size", onclick: () => this.showSizeWindow()},
                {name: "Music", onclick: () => this.showMusicWindow()}
            ]},
            {name: "Help", items: [
            ]}
        ]
    })
}

OMGMapEditor.prototype.showSizeWindow = function () {
    this.canvasWindow = this.wm.newWindow({
        div: document.getElementById("size-menu"),
        caption: "Size", width: 200, height: 150
    })

}


OMGMapEditor.prototype.showMusicWindow = function () {
    if (!this.map.data.music) {

        var searchBox = new OMGSearchBox({types: ["SONG"]})

        this.selectCharacterList.appendChild(searchBox.div)
        
        searchBox.onclickcontent = e => {
            this.selectMusic(e.data)
            win.close()
        }

        searchBox.search()

        var win = this.wm.newWindow({
            caption: "Select Music",
            div: searchBox.div, 
            x: 50, y: 50, width: 500, height: 500,
            overflowY: "auto"
        })
    }
    else {
        this.showDawesome()
    }
}

OMGMapEditor.prototype.selectMusic = async function (data) {
    console.log(data)
    this.map.data.music = {
        type: data.type,
        omgurl: data.omgurl
    }

    this.musicData = data
    await this.loadMusic(data)
    this.showDawesome()
}

OMGMapEditor.prototype.showDawesome = async function () {

    if (!this.dawesome) {
        var o = await import("/apps/dawesome/js/dawesome.js")
        this.dawesome = new o.default({div: document.body, 
            song: this.song,
            player: this.musicPlayer,
            musicContext: this.musicContext, 
            transportWindowConfig: {
                caption: "Transport",
                x: window.innerWidth / 2, y: 100,
                width: window.innerWidth / 3, height: 90
            }, 
            timelineWindowConfig: {
                caption: "Timeline",
                x: 30, y: window.innerHeight - 400,
                width: window.innerWidth - 80, height: 350
            },
            mixerWindowConfig: {
                caption: "Mixer", 
                x: window.innerWidth - 360, y: window.innerHeight / 4,
                width: 300, height: 300
            }, 
            fxWindowConfig: {
                hidden: true
            }
        })
        //this.dawesome.load(data)
    }
}

OMGMapEditor.prototype.loadMusic = async function (music) {
    if (!this.musicPlayer) {
        var o = await import("/apps/music/js/omusic.js")
        var OMusicContext = o.default
        this.musicContext = new OMusicContext()
    }

    if (music.type === "SONG" && music.omgurl) {
        var res = await fetch(music.omgurl)
        var data = await res.json()
        
        var {player, song} = await this.musicContext.load(data)
        this.musicPlayer = player
        this.song = song

    }

}




function NPCFragment(npc, editor) {
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

