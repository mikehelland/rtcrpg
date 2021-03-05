function OMGRPGMap(data, options) {
    
    options = options || {}

    this.tileSize = 32
    this.data = data || {}

    this.canvas = options.backCanvas || document.createElement("canvas")
    this.ctx = this.canvas.getContext("2d")
    this.charCanvas = options.charCanvas ||document.createElement("canvas")
    this.charCtx = this.charCanvas.getContext("2d")

    if (!options.backCanvas) {
        this.canvas.style.position = "absolute"
        this.canvas.style.top = "0px"
        this.canvas.style.left = "0px"
        //this.canvas.style.height = "100%"
        //this.canvas.style.width = "100%"
    }

    if (!options.charCanvas) {
        this.charCanvas.style.position = "absolute"
    }

    if (options.div) {
        options.div.appendChild(this.canvas)
        options.div.appendChild(this.charCanvas)
    }

    this.img = options.img || {}
    this.tileSplitChar = "·"

    this.loadTileSet(data.tileSet)

    this.tiles = []
    for (var x = 0; x < this.data.width; x++) {
        this.tiles[x] = []

        var ys = (this.data.yLines[x] || "").split(this.tileSplitChar)
        for (var y = 0; y < this.data.height; y++) {
            this.tiles[x][y] = {code: ys[y] || ""}
        }
    
    }

    this.canvas.width = this.data.width * this.tileSize
    this.canvas.height = this.data.height * this.tileSize
    
    this.charCanvasOffsetX = 0
    this.charCanvasOffsetY = 0
    this.loadNPCs()
}

OMGRPGMap.prototype.loadTileSet = function (tileSet) {

    //todo use omg object to cache tilesets? 
    
    this.img.tiles = {}

    Object.keys(tileSet.tileCodes).forEach(key => {
        if (!this.img.tiles[key]) {
            this.img.tiles[key] = document.createElement("img")
        }
        var img = this.img.tiles[key]
        if (tileSet.tileCodes[key].startsWith("data:image/")) {
            img.src = tileSet.tileCodes[key]
        }
        else {
            img.src = (tileSet.prefix || "") + tileSet.tileCodes[key] + (tileSet.postfix || "")
        }
        img.onload = e => this.draw()
        
    })

    
}


OMGRPGMap.prototype.draw = function () {
    this.canvas.width = this.data.width * this.tileSize
    this.canvas.height = this.data.height * this.tileSize
    
    this.ctx.fillStyle = "black"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    for (var x = 0; x < this.data.width; x++) {
        for (var y = 0; y < this.data.height; y++) { 
            if (this.tiles[x] && this.tiles[x][y]) {
                var tileCode = this.tiles[x][y].code
                if (this.img.tiles[tileCode]) {
                    try {
                        this.ctx.drawImage(this.img.tiles[tileCode],
                            x * this.tileSize, 
                            y * this.tileSize,
                            this.tileSize + 0.5, this.tileSize + 0.5)
                    }
                    catch (e) {}
                }
            }
        }    
    }

}

OMGRPGMap.prototype.updateYLines = function () {

    this.data.yLines = []
    for (var x = 0; x < this.data.width; x++) {
        var yLine = []
        for (var y = 0; y < this.data.height; y++) {
            yLine.push(this.tiles[x][y].code)
        }
        this.data.yLines.push(yLine.join(this.tileSplitChar))
    }
    
}

OMGRPGMap.prototype.loadNPC = function (npc) {
    
    npc.width = npc.sprite.frameWidth / 32
    npc.height = npc.sprite.frameHeight / 32

    var spriter = new OMGSpriter(npc.sprite, this.charCanvas)
    spriter.w = npc.width * this.tileSize
    spriter.h = npc.height * this.tileSize
    
    if (npc.soundURL) {
        fetch(npc.soundURL).then(res => res.json()).then(data => {
            this.loadNPCMusic(npc, data)
        }).catch(e => console.error(e))
    }
    return spriter
}

OMGRPGMap.prototype.drawNPCs = function () {
    for (this._dnpc of this.activeSprites) {
        this._dnpc.spriter.drawXY(
            this._dnpc.npc.x * this.tileSize + this.charCanvasOffsetX, 
            this._dnpc.npc.y * this.tileSize + this.charCanvasOffsetY)        
    }

}

OMGRPGMap.prototype.loadNPCs = function () {
    this.activeSprites = []

    for (var npc of this.data.npcs) {
        var spriter = this.loadNPC(npc)
        this.activeSprites.push({npc, spriter})
   }
}