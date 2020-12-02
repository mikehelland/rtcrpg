function OMGRPGMap(data, canvas, options) {
    
    options = options || {}

    this.tileSize = 32
    this.data = data || {}
    this.canvas = canvas 
    this.ctx = this.canvas.getContext("2d")

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
                    this.ctx.drawImage(this.img.tiles[tileCode],
                        x * this.tileSize, 
                        y * this.tileSize,
                        this.tileSize + 0.5, this.tileSize + 0.5)
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