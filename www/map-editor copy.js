function OMGMapEditor (canvas, frontCanvas) {
    this.canvas = canvas
    this.context = canvas.getContext("2d")
    this.tileSize = 16
    this.spriteScale = 0.5

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

OMGMapEditor.prototype.loadTileSet = function (tileSet) {
    
    this.tileCharSize = tileSet.tileCharSize || 1

    this.map.tileSet = tileSet
    Object.keys(tileSet.tileCodes).forEach(key => {
        var img = document.createElement("img")
        img.src = (tileSet.prefix + "") + tileSet.tileCodes[key] + (tileSet.postfix || "")
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
        }
    })
}

OMGMapEditor.prototype.load = function (map) {
    this.map = map
    this.mapLines = map.mapLines
    this.nameInput.value = map.name
    this.widthInput.value = map.width
    this.heightInput.value = map.height

    if (map.tileSet) {
        this.loadTileSet(map.tileSet)
    }
    else {
        if (this.tileSets) {
            this.loadTileSet(this.tileSets[0])
        }
    }
    
    this.loadNPCs()
    this.loadHTML()

    this.resizeMap()
}


OMGMapEditor.prototype.draw = function () {
    this.canvas.width = this.map.width * this.tileSize
    this.canvas.height = this.map.height * this.tileSize
    this.canvas.style.width = canvas.width + "px"
    this.canvas.style.height = canvas.height + "px"

    this.context.fillStyle = "black"
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.mapTiles = []

    let tileCode, currentRow 
    for (var y = 0; y < this.mapLines.length; y++) { 
        currentRow = []
        this.mapTiles.push(currentRow)
        for (var x = 0; x < this.map.width; x++) {
            if (this.mapLines[y][x]) {
                tileCode = this.mapLines[y].substr(x * this.tileCharSize, this.tileCharSize)
                currentRow.push(tileCode)
                console.log(tileCode)
                if (tileCode && this.img.tiles[tileCode]) {
                    this.context.drawImage(this.img.tiles[tileCode],
                        x * this.tileSize, 
                        y * this.tileSize,
                        this.tileSize, this.tileSize)
                }
            }
        }    
    }
}

OMGMapEditor.prototype.setupEvents = function (canvas) {
    canvas.onmousedown = (e) => {
        if (this.mode === "TILE" && this.tileDrawMode !== "Fill") {
            this.tileEvent(Math.floor(e.layerX / this.tileSize), Math.floor(e.layerY / this.tileSize))
        }
        if (this.mode === "TILE" && this.tileDrawMode === "Fill") {
            this.tileFill(Math.floor(e.layerX / this.tileSize), Math.floor(e.layerY / this.tileSize))
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
                this.tileEvent(Math.floor(e.layerX / this.tileSize), Math.floor(e.layerY / this.tileSize))
            }
            else {
                this.tilePreview(Math.floor(e.layerX / this.tileSize), Math.floor(e.layerY / this.tileSize))
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
}

OMGMapEditor.prototype.tileEvent = function (x, y, brushing) {
    
    //if (this.selectedTile && this.mapLines[y] && this.mapLines[y][x]) {
    if (this.selectedTile && this.mapTiles[y]) {
        this.mapTiles[y][x] = this.selectedTile

        //this.mapLines[y] = this.mapLines[y].slice(0, x) + this.selectedTile + this.mapLines[y].slice(x + 1)
        //this.draw()
        this.context.drawImage(this.img.tiles[this.selectedTile],
            x * this.tileSize, 
            y * this.tileSize,
            this.tileSize, this.tileSize)
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

OMGMapEditor.prototype.tileFill = function (x, y, brushing) {
    var startX = x
    var startY = y

    var fillTile = this.mapTiles[y][x]

    var tilesChecked = {}
    var nextTiles = [[x, y]]
    this.mapTiles[y][x] = this.selectedTile
    this.context.drawImage(this.img.tiles[this.selectedTile],
        x * this.tileSize, 
        y * this.tileSize,
        this.tileSize, this.tileSize)
    
    //tilesChecked[x + "," + y] = true

    var nx, ny
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
    if (this.mapTiles[y] && this.mapTiles[y][x] === fillTile) {
        newTiles.push([x, y])

        this.context.drawImage(this.img.tiles[this.selectedTile],
            x * this.tileSize, 
            y * this.tileSize,
            this.tileSize, this.tileSize)
        
    }
}


OMGMapEditor.prototype.tilePreview = function (x, y, brushing) {

    if (!brushing) {
        this.drawNPCs()
    }

    if (this.selectedTile && this.mapTiles[y]) {
        this.frontContext.drawImage(this.img.tiles[this.selectedTile],
            x * this.tileSize, 
            y * this.tileSize,
            this.tileSize, this.tileSize)
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
    this.widthInput.onkeydown = e => this.sizeInputKeyPress(e)
    this.heightInput.onkeydown = e => this.sizeInputKeyPress(e)
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
        delete this.map.id
        omg.server.post(this.map, res => {
            window.location = "game.htm?id=" + res.id
        })
    }
    document.getElementById("overwrite-button").onclick = e => {
        omg.server.post(this.map, res => {
            window.location = "game.htm?id=" + res.id
        })
    }
    omg.server.getHTTP("/user", user => this.user = user)

    this.tileSetSelect = document.getElementById("tile-set-select")
    omg.server.getHTTP("/data/?type=TILESET", results => {
        this.tileSets = results
        results.forEach(result => {
            result.url = window.location.origin + "/data/" + result.id
            newOption = document.createElement('option')
            this.tileSetSelect.appendChild(newOption)
            newOption.innerHTML = result.name
        })
        if (this.map && !this.map.tileSet) {//we've already loaded a map, but it's an empty tileset
            this.loadTileSet(this.tileSets[0])
        }
    })
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

    this.tileSelectMode = document.getElementById("tile-draw-mode")
    this.tileSelectMode.onchange = e => {
        this.tileDrawMode = this.tileSelectMode.value
    }
    this.tileDrawMode = this.tileSelectMode.value

    this.tileSetSelect.onchange = e => {
        for (let i = 0; i < this.tileSets.length; i++) {
            if (this.tileSets[i].name === this.tileSetSelect.value) {
                this.tileListDiv.innerHTML = ""
                this.map.tileSet = this.tileSets[i]
                this.loadTileSet(this.tileSets[i])
                this.draw()
                return
            }
        }
    }
    
    this.setupNPCControls()
    this.setupHTMLControls()
    this.setupMusicControls()

    this.selectCharacterDialog = document.getElementById("select-character-dialog")
    this.selectCharacterList = document.getElementById("select-character-list")

}

OMGMapEditor.prototype.sizeMap = function () {
    for (var i = 0; i < this.mapLines.length; i++) {
        if (this.mapLines[i].length < this.map.width) {
            this.mapLines[i] = this.mapLines[i].padEnd(this.map.width, " ")
        }
    }
    for (i = this.mapLines.length; i < this.map.height; i++) {
        this.mapLines.push("".padEnd(this.map.width, " "))
    }
}

OMGMapEditor.prototype.resizeMap = function () {
    this.map.width = this.widthInput.value
    this.map.height = this.heightInput.value
    this.sizeMap()
    this.draw()
    this.drawNPCs()
}

OMGMapEditor.prototype.sizeInputKeyPress = function (e) {
    if (e.key === "Enter") {
        this.resizeMap()
    }
    else if (e.key === "ArrowUp") {
        e.target.value = e.target.value * 1 + 1
        this.resizeMap()
    }
    else if (e.key === "ArrowDown") {
        e.target.value = e.target.value * 1 - 1
        this.resizeMap()
    }
}

OMGMapEditor.prototype.save = function () {
    this.map.name = this.nameInput.value
    this.map.type = "MAP"
    this.map.omgVersion = 1

    this.map.mapLines = []
    for (var iy = 0; iy < this.map.height; iy++) {
        this.map.mapLines.push(this.mapTiles[iy].join(""))
    }

    if (this.map.id) {
        if (this.user && this.map.user_id === this.user.id) {
            omg.ui.showDialog(document.getElementById("overwrite-or-new"))
            return
        }
        else {
            delete this.map.id
        }
    }

    omg.server.post(this.map, res => {
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
    this.tileHighlightDiv.style.width = this.tileSize + "px"
    this.tileHighlightDiv.style.height = this.tileSize + "px"
    this.tileHighlightDiv.style.left = Math.floor(e.clientX / this.tileSize) * this.tileSize - 3 + "px"
    this.tileHighlightDiv.style.top = Math.floor(e.clientY / this.tileSize) * this.tileSize + 1.5 + "px"
}

OMGMapEditor.prototype.addNPC = function (e) {
    var x = Math.floor((e.clientX - this.canvas.offsetLeft) / this.tileSize)
    var y = Math.floor((e.clientY - this.canvas.offsetTop) / this.tileSize)

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
    spriter.w = spriter.w * this.spriteScale
    spriter.h = spriter.h * this.spriteScale

    this.spriters.set(npc, spriter)
    this.previewSpriter = null


    var div = this.setupNPCToolBoxDiv(npc)
    
    this.map.npcs.push(npc)
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
    this.previewSpriter.w = this.previewSpriter.w * this.spriteScale
    this.previewSpriter.h = this.previewSpriter.h * this.spriteScale


    if (this.closeSelectCharacerDialog) {
        this.closeSelectCharacerDialog()
    }
}

OMGMapEditor.prototype.addHTML = function (e) {
    var x = Math.floor((e.clientX - this.canvas.offsetLeft) / this.tileSize)
    var y = Math.floor((e.clientY - this.canvas.offsetTop) / this.tileSize)

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
    if (!this.map) {
        return
    }

    this.frontCanvas.width = this.canvas.width
    this.frontCanvas.height = this.canvas.height
    this.frontCanvas.style.width = this.canvas.width + "px"
    this.frontCanvas.style.height = this.canvas.height + "px"

    this.frontContext.fillStyle = "white"

    this.frontContext.fillRect(
        this.map.startX * this.tileSize,
        this.map.startY * this.tileSize,
        this.tileSize, this.tileSize)

    this.frontContext.strokeStyle = "red"
    if (this.htmlBeingAdded) {
        this.frontContext.strokeRect(this.htmlBeingAdded.x * this.tileSize,
            this.htmlBeingAdded.y * this.tileSize,
            this.htmlBeingAdded.width * this.tileSize,
            this.htmlBeingAdded.height * this.tileSize)
    }
    for (this._loop_drawNPCs_i = 0;  this._loop_drawNPCs_i < this.map.html.length; this._loop_drawNPCs_i++) {
        this.frontContext.strokeRect(
            this.map.html[this._loop_drawNPCs_i].x * this.tileSize,
            this.map.html[this._loop_drawNPCs_i].y * this.tileSize,
            this.map.html[this._loop_drawNPCs_i].width * this.tileSize,
            this.map.html[this._loop_drawNPCs_i].height * this.tileSize)

    }

    for (this._loop_drawNPCs_i = 0;  this._loop_drawNPCs_i < this.map.npcs.length; this._loop_drawNPCs_i++) {

        this._loop_draw_npc = this.map.npcs[this._loop_drawNPCs_i]
        

        this._loop_draw_spriter = this.spriters.get(this._loop_draw_npc)
        if (this._loop_draw_npc === this.selectedNPC) {

            this.frontContext.lineWidth = 4
            this.frontContext.strokeStyle = "red" 
            this.frontContext.strokeRect(
                this._loop_draw_npc.x * this.tileSize,
                this._loop_draw_npc.y * this.tileSize,
                this._loop_draw_spriter.w, this._loop_draw_spriter.h)
        }

        this._loop_draw_spriter.drawXY(this._loop_draw_npc.x * this.tileSize, this._loop_draw_npc.y * this.tileSize)        
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
        this.tileSize, this.tileSize)
}

OMGMapEditor.prototype.loadNPCs = function () {
    this.spriters = new Map()

    for (var i = 0; i < this.map.npcs.length; i++) {
        let spriter = new OMGSpriter(this.map.npcs[i].sprite, this.frontCanvas)
        spriter.w = spriter.w * this.spriteScale
        spriter.h = spriter.h * this.spriteScale

        this.spriters.set(this.map.npcs[i], spriter)

        this.setupNPCToolBoxDiv(this.map.npcs[i])
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
 
    var x = Math.ceil((e.clientX - this.canvas.offsetLeft) / this.tileSize)
    var y = Math.ceil((e.clientY - this.canvas.offsetTop) / this.tileSize)
    this.htmlBeingAdded.width = x - this.htmlBeingAdded.x
    this.htmlBeingAdded.height = y - this.htmlBeingAdded.y

    this.drawNPCs()
}

OMGMapEditor.prototype.moveNPC = function (e) {
    var x = Math.floor((e.clientX - this.canvas.offsetLeft) / this.tileSize)
    var y = Math.floor((e.clientY - this.canvas.offsetTop) / this.tileSize)
    this.selectedNPC.x = x
    this.selectedNPC.y = y
    this.mode = "NPC_SELECT" 
    this.tileHighlightDiv.style.display = "none"
    this.drawNPCs()
}

OMGMapEditor.prototype.moveHero = function (e) {
    var x = Math.floor((e.clientX - this.canvas.offsetLeft) / this.tileSize)
    var y = Math.floor((e.clientY - this.canvas.offsetTop) / this.tileSize)
    this.map.startX = x
    this.map.startY = y
    this.mode = "HERO_MOVE" 
    this.tileHighlightDiv.style.display = "none"
    this.drawNPCs()
}

OMGMapEditor.prototype.drawSpritePreview = function (e) {
    if (this.previewSpriter) {
        this.previewSpriter.x = Math.floor((e.clientX - this.canvas.offsetLeft) / this.tileSize) * this.tileSize
        this.previewSpriter.y = Math.floor((e.clientY - this.canvas.offsetTop) / this.tileSize) * this.tileSize
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