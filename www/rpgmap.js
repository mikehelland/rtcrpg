import OMGSpriter from "/apps/sprite/spriter.js"

export default function OMGRPGMap(data, options) {
    
    options = options || {}

    this.tileSize = options.tileSize || 32
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

    this.loadTiles()

    this.canvas.width = this.data.width * this.tileSize
    this.canvas.height = this.data.height * this.tileSize
    
    this.charCanvasOffsetX = 0
    this.charCanvasOffsetY = 0

    if (!this.data.npcs) {
        this.data.npcs = []
    }
    if (!this.data.regions) {
        this.data.regions = []
    }

    this.activeSprites = []
    var loadPromises = []
    this.loadNPCs(loadPromises)
    this.loadRegions(loadPromises)
    Promise.all(loadPromises).then(() => this.drawNPCs())
}

OMGRPGMap.prototype.loadTileSet = function (tileSet) {

    //todo use omg object to cache tilesets? 
    
    this.img.tiles = {}

    var onload = () => {
        loaded++
        if (loaded === toLoad) {
            this.draw()
        }
    }
    var toLoad = 0
    var loaded = 0
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
        img.onload = e => onload()
        img.onerror = e => onload()
        toLoad++        
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

OMGRPGMap.prototype.drawCustom = function (canvas, tileSize) {
    canvas.width = this.data.width * tileSize
    canvas.height = this.data.height * tileSize
    var ctx = canvas.getContext("2d")
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (var x = 0; x < this.data.width; x++) {
        for (var y = 0; y < this.data.height; y++) { 
            if (this.tiles[x] && this.tiles[x][y]) {
                var tileCode = this.tiles[x][y].code
                if (this.img.tiles[tileCode]) {
                    try {
                        ctx.drawImage(this.img.tiles[tileCode],
                            x * tileSize, 
                            y * tileSize,
                            tileSize + 0.5, tileSize + 0.5)
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

OMGRPGMap.prototype.loadSprite = function (thing, type) {
    thing.width = thing.sprite.frameWidth / 32
    thing.height = thing.sprite.frameHeight / 32
    var spriter = new OMGSpriter(thing.sprite, this.charCanvas)
    spriter[type] = thing
    spriter.w = thing.width * this.tileSize
    spriter.h = thing.height * this.tileSize
    
    //todo this isn't used
    if (thing.soundURL) {
        fetch(thing.soundURL).then(res => res.json()).then(data => {
            this.loadNPCMusic(thing, data)
        }).catch(e => console.error(e))
    }
    return spriter
}

OMGRPGMap.prototype.drawNPCs = function (advanceFrame) {
    for (this._dnpc of this.activeSprites) {
        if (advanceFrame && this._dnpc.thing.animating) {
            this._dnpc.spriter.next()
        }
        this._dnpc.spriter.drawXY(
            this._dnpc.thing.x * this.tileSize + this.charCanvasOffsetX, 
            this._dnpc.thing.y * this.tileSize + this.charCanvasOffsetY)
    }

}

OMGRPGMap.prototype.loadNPCs = function (loadPromises) {
    
    for (var npc of this.data.npcs) {
        var spriter = this.loadSprite(npc, "npc")
        npc.on = npc.initialState === "on"
        loadPromises.push(spriter.setSheet(npc.on ? npc.onSheet : npc.offSheet))
        this.activeSprites.push({thing: npc, spriter, type: "npc"})
   }
}

OMGRPGMap.prototype.loadRegions = function (loadPromises) {
    
    for (var region of this.data.regions) {
        if (region.sprite) {
            var spriter = this.loadSprite(region, "region")
            loadPromises.push(spriter.setSheet())
            this.activeSprites.push({thing: region, spriter, type: "region"})
        }
   }
}


OMGRPGMap.prototype.resizeSpriters = function () {

    for (var sprite of this.activeSprites) {
        console.log(sprite)
        sprite.spriter.w = sprite.thing.width * this.tileSize
        sprite.spriter.h = sprite.thing.height * this.tileSize
    }
}

OMGRPGMap.prototype.loadTiles = function () {
    this.tiles = []
    for (var x = 0; x < this.data.width; x++) {
        this.tiles[x] = []

        var ys = (this.data.yLines[x] || "").split(this.tileSplitChar)
        for (var y = 0; y < this.data.height; y++) {
            var tile = {code: ys[y] || ""}
            tile.walkable = !(tile.code.charAt(0) === tile.code.charAt(0).toUpperCase())
            this.tiles[x][y] = tile
        }
    
    }
}