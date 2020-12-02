function OMGMapEditor (canvas, frontCanvas) {
    this.canvas = canvas
    this.context = canvas.getContext("2d")
    this.zoom = 1

    this.frontCanvas = frontCanvas
    this.frontContext = this.frontCanvas.getContext("2d")
    this.frontCanvas.style.pointerEvents = "none"

    this.mode = "TILE"
    this.img = {
        characters: document.getElementById("characters-spritesheet"),
        tiles: {}
    }

    this.spriters = new Map()


    this.setupEvents(canvas)
    this.setupControls()

}

OMGMapEditor.prototype.load = function (data) {

    var load = () => {
        if (!data.tileSet) {
            data.tileSet = this.tileSets[0]
        }
        this.loadTileSet(data.tileSet)

        this.map = new OMGRPGMap(data, this.canvas, {img: this.img})
        this.data = data
        
        this.nameInput.value = data.name
        this.widthInput.value = data.width
        this.heightInput.value = data.height

        this.canvas.width = this.data.width * this.map.tileSize * this.zoom
        this.canvas.height = this.data.height * this.map.tileSize * this.zoom 
        this.canvas.style.width = this.canvas.width + "px"
        this.canvas.style.height = this.canvas.height + "px"
        
        this.loadNPCs()
        this.loadHTML()

        this.map.draw()
        this.drawNPCs()
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

OMGMapEditor.prototype.loadTile = function (key, tileSet) {
    var img = document.createElement("img")
    if (tileSet.tileCodes[key].startsWith("data:image/png")) {
        img.src = tileSet.tileCodes[key]
    }
    else {
        img.src = (tileSet.prefix + "") + tileSet.tileCodes[key] + (tileSet.postfix || "")
    }
    this.img.tiles[key] = img
    if (this.tileListDiv) {
        this.tileListDiv.appendChild(img)
        img.onclick = () => {
            if (this.selectedTile) {
                this.img.tiles[this.selectedTile].className = ""
            }
            this.selectedTile = key
            img.className = "selected"
        }
        img.ondblclick = e => {
            this.showTileEditor(key, img, tileSet)    
        }
    }
    return img
}


OMGMapEditor.prototype.setupEvents = function (canvas) {
    canvas.onmousedown = (e) => {
        if (this.mode === "TILE" && this.tileDrawMode !== "Fill") {
            this.tileEvent(Math.floor(e.layerX / this.map.tileSize), Math.floor(e.layerY / this.map.tileSize))
        }
        if (this.mode === "TILE" && this.tileDrawMode === "Fill") {
            this.tileFill(Math.floor(e.layerX / this.map.tileSize), Math.floor(e.layerY / this.map.tileSize))
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
        if (this.mode === "TILE" && this.tileDrawMode !== "Fill") {
            if (this.isTouching) {
                this.tileEvent(Math.floor(e.layerX / this.map.tileSize), Math.floor(e.layerY / this.map.tileSize))
            }
            else {
                this.tilePreview(Math.floor(e.layerX / this.map.tileSize), Math.floor(e.layerY / this.map.tileSize))
            }
        }
        else if (this.mode.indexOf("NPC_PLACE") > -1 || this.mode.indexOf("NPC_MOVE") > -1) {
            this.drawSpritePreview(e)
        }
        else if (this.mode.indexOf("_PLACE") > -1) {
            this.highlightTile(e)
        }
        else if (this.mode.indexOf("_MOVE") > -1) {
            this.highlightTile(e)
        }
        else if (this.mode === "HTML_STRETCH") {
            this.stretchHTML(e)
        }
    }
    canvas.onmouseup = (e) => {
        
        if (this.mode === "TILE" && this.tileDrawMode === "Fill") {
            if (this.isTouching) {
                //this.tileFill(e)
            }    
        }
        else if (this.mode === "NPC_PLACE") {
            this.addNPC(e)
        }
        else if (this.mode === "NPC_MOVE") {
            this.moveNPC(e)
        }
        else if (this.mode === "HERO_MOVE") {
            this.moveHero(e)
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

        this.context.drawImage(this.img.tiles[this.selectedTile],
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
    this.context.drawImage(this.img.tiles[this.selectedTile],
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
        this.context.drawImage(this.img.tiles[this.selectedTile],
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
        this.frontContext.drawImage(this.img.tiles[this.selectedTile],
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
    
    document.getElementById("save-button").onclick = () => this.save()

    document.getElementById("new-copy-button").onclick = e => {
        delete this.data.id
        omg.server.post(this.data, res => {
            window.location = "game.htm?id=" + res.id
        })
    }
    document.getElementById("overwrite-button").onclick = e => {
        omg.server.post(this.data, res => {
            window.location = "game.htm?id=" + res.id
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
    
    this.setupTileEditor()
    this.setupNPCControls()
    this.setupHTMLControls()
    this.setupMusicControls()

    this.selectCharacterDialog = document.getElementById("select-character-dialog")
    this.selectCharacterList = document.getElementById("select-character-list")

    omg.server.getHTTP("/data/?type=TILESET", results => {
        this.tileSets = results
        results.forEach(result => {
            result.url = window.location.origin + "/data/" + result.id
            newOption = document.createElement('option')
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
    omg.server.getHTTP("/data/?type=SPRITE", results => {
        results.forEach(result => {
            var newEl = document.createElement("canvas")
            newEl.className = "select-character-dialog-item"
            this.selectCharacterList.appendChild(newEl)
            try {
                var spriter = new OMGSpriter(result, newEl)
                spriter.setSheet()
                spriter.draw()
            }
            catch (e) {console.error(e)}

            newEl.onclick = e => {
                this.placeNPC(result)
            }
        })
    })
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
                this.map.tiles[x][y] = {code: " "}
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
            omg.ui.showDialog(document.getElementById("overwrite-or-new"))
            return
        }
        else {
            delete this.data.id
        }
    }

    omg.server.post(this.data, res => {
        window.location = "game.htm?id=" + res.id
    })
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
        this.closeSelectCharacerDialog = omg.ui.showDialog(this.selectCharacterDialog)
    }
    this.npcDetailsDiv = document.getElementById("npc-details")
    this.npcDetailsName = document.getElementById("npc-details-name")
    this.npcDetailsSound = document.getElementById("npc-details-sound")
    this.npcDetailsDialog = document.getElementById("npc-dialog-input")
    this.npcDetailsCanvas = document.getElementById("npc-details-canvas")
    this.npcDetailsDelete = document.getElementById("npc-details-delete")
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
        this.setupMusicEditor(this.map.music.id)
    }
    
}

OMGMapEditor.prototype.highlightTile = function (e) {
    this.tileHighlightDiv.style.display = "block"
    this.tileHighlightDiv.style.width = this.map.tileSize * this.zoom + "px"
    this.tileHighlightDiv.style.height = this.map.tileSize * this.zoom + "px"
    this.tileHighlightDiv.style.left = Math.floor(e.clientX / this.map.tileSize) * this.map.tileSize - 3 + "px"
    this.tileHighlightDiv.style.top = Math.floor(e.clientY / this.map.tileSize) * this.map.tileSize + 1.5 + "px"
}

OMGMapEditor.prototype.addNPC = function (e) {
    var x = Math.floor((e.clientX - this.canvas.offsetLeft) / this.map.tileSize)
    var y = Math.floor((e.clientY - this.canvas.offsetTop) / this.map.tileSize)

    var npc = {
        "name": this.selectedSprite ? this.selectedSprite.name : "name me",
        "x": x,
        "y": y,
        "sprite": this.selectedSprite,
        "dialog": [
          "Hi!"
        ]
    }

    let spriter = new OMGSpriter(npc.sprite, this.frontCanvas)
    spriter.w = spriter.w * this.zoom
    spriter.h = spriter.h * this.zoom

    this.spriters.set(npc, spriter)
    this.previewSpriter = null


    var div = this.setupNPCToolBoxDiv(npc)
    
    this.map.data.npcs.push(npc)
    this.showNPCDetails(npc, div)
    
    this.mode = "NPC_SELECT"
    this.tileHighlightDiv.style.display = "none"
    this.addNPCButton.innerHTML = "+Add"

    this.drawNPCs()
}

OMGMapEditor.prototype.placeNPC = function (sprite) {
    this.addNPCButton.innerHTML = "Place..."
    this.mode = "NPC_PLACE"
    this.selectedSprite = sprite
    this.previewSpriter = new OMGSpriter(sprite, this.frontCanvas)
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
    this.npcDetailsDiv.style.display = "block"
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

    this.selectedNPC = npc
    this.drawNPCs()
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

    this.frontCanvas.width = this.canvas.width
    this.frontCanvas.height = this.canvas.height
    this.frontCanvas.style.width = this.canvas.width * this.zoom + "px"
    this.frontCanvas.style.height = this.canvas.height * this.zoom + "px"

    this.frontContext.fillStyle = "white"

    this.frontContext.fillRect(
        this.data.startX * this.map.tileSize,
        this.data.startY * this.map.tileSize,
        this.map.tileSize, this.map.tileSize)

    this.frontContext.strokeStyle = "red"
    if (this.htmlBeingAdded) {
        this.frontContext.strokeRect(this.htmlBeingAdded.x * this.map.tileSize,
            this.htmlBeingAdded.y * this.map.tileSize,
            this.htmlBeingAdded.width * this.map.tileSize,
            this.htmlBeingAdded.height * this.map.tileSize)
    }
    
    if (this.data.html) {
        for (this._loop_drawNPCs_i = 0;  this._loop_drawNPCs_i < this.data.html.length; this._loop_drawNPCs_i++) {
            this.frontContext.strokeRect(
                this.data.html[this._loop_drawNPCs_i].x * this.map.tileSize,
                this.data.html[this._loop_drawNPCs_i].y * this.map.tileSize,
                this.data.html[this._loop_drawNPCs_i].width * this.map.tileSize,
                this.data.html[this._loop_drawNPCs_i].height * this.map.tileSize)

        }
    }

    for (this._loop_drawNPCs_i = 0;  this._loop_drawNPCs_i < this.data.npcs.length; this._loop_drawNPCs_i++) {

        this._loop_draw_npc = this.data.npcs[this._loop_drawNPCs_i]
        

        this._loop_draw_spriter = this.spriters.get(this._loop_draw_npc)
        if (this._loop_draw_npc === this.selectedNPC) {

            this.frontContext.lineWidth = 4
            this.frontContext.strokeStyle = "red" 
            this.frontContext.strokeRect(
                this._loop_draw_npc.x * this.map.tileSize,
                this._loop_draw_npc.y * this.map.tileSize,
                this._loop_draw_spriter.w, this._loop_draw_spriter.h)
        }

        this._loop_draw_spriter.drawXY(this._loop_draw_npc.x * this.map.tileSize, this._loop_draw_npc.y * this.map.tileSize)        
    }

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
    this.spriters = new Map()

    for (var i = 0; i < this.data.npcs.length; i++) {
        let spriter = new OMGSpriter(this.data.npcs[i].sprite, this.frontCanvas)
        spriter.w = spriter.w * this.zoom
        spriter.h = spriter.h * this.zoom

        this.spriters.set(this.data.npcs[i], spriter)

        this.setupNPCToolBoxDiv(this.data.npcs[i])
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

OMGMapEditor.prototype.moveHero = function (e) {
    var x = Math.floor((e.clientX - this.canvas.offsetLeft) / this.map.tileSize)
    var y = Math.floor((e.clientY - this.canvas.offsetTop) / this.map.tileSize)
    this.map.startX = x
    this.map.startY = y
    this.mode = "HERO_MOVE" 
    this.tileHighlightDiv.style.display = "none"
    this.drawNPCs()
}

OMGMapEditor.prototype.drawSpritePreview = function (e) {
    if (this.previewSpriter) {
        this.previewSpriter.x = Math.floor((e.clientX - this.canvas.offsetLeft) / this.map.tileSize) * this.map.tileSize
        this.previewSpriter.y = Math.floor((e.clientY - this.canvas.offsetTop) / this.map.tileSize) * this.map.tileSize
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

            this.map.music = {id: viewer.data.id}


        }
    }
}

OMGMapEditor.prototype.setupMusicEditor = function (id) {

    var iframe = document.createElement("iframe")
    iframe.src = "/apps/music/remixer/?id=" + id
    this.musicDetailsEditor.appendChild(iframe)
    
    iframe.onload = () => {
        iframe.contentWindow.onclickcontent = viewer => {
            console.log(viewer) 

            this.map.music = {id: viewer.data.id}


        }
    }
}

OMGMapEditor.prototype.setupTileEditor = function (tile, img) {
    
    this.tileDetails = {}

    this.tileDetails.addButton = document.getElementById("tile-list-new-button")
    this.tileDetails.addButton.onclick = e => {
        var code = "n" + Math.trunc(Math.random() * 1000)
        this.data.tileSet.tileCodes[code] = ""
        var img = this.loadTile(code, this.data.tileSet)
        this.showTileEditor(code, img)
    }

    this.tileDetails.div = document.getElementById("tile-editor-details")
    this.tileDetailsName = document.getElementById("tile-details-name")
    this.tileDetailsSound = document.getElementById("tile-details-sound")
    this.tileDetailsDialog = document.getElementById("tile-dialog-input")
    this.tileDetailsDelete = document.getElementById("tile-details-delete")

    this.tileDetails.editorDiv = document.getElementById("tile-editor")
    this.tileDetails.saveButton = document.getElementById("tile-editor-save-button")
    
}

OMGMapEditor.prototype.showTileEditor = function (tile, img, tileSet) {
    this.tileDetails.div.style.display = "block"

    if (!this.tileDetails.editor) {
        this.tileDetails.editor = new OMGTileEditor(this.tileDetails.editorDiv)
    }
    
    var imgData
    this.tileDetails.editor.load(img, {
        previewCallback: (data) => {
            img.src = data
            this.map.img.tiles[tile].src = data
            this.map.draw()
        }
    })

    this.tileDetails.saveButton.onclick = e => {
        console.log(tile)
        this.data.tileSet.tileCodes[tile] = this.tileDetails.editor.getData()
    }

}
