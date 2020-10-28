function OMGEmbeddedViewerMAP (viewer) {
    this.canvas = document.createElement("canvas")
    this.context = this.canvas.getContext("2d")
    this.tileSize = 16
    this.img = {
        characters: document.getElementById("characters-spritesheet"),
        tiles: {}
    }
    
    this.canvas.style.width = "100%"
    this.canvas.style.height = "100%"
    viewer.embedDiv.appendChild(this.canvas)
    this.load(viewer.data)
    this.draw()
    
}

OMGEmbeddedViewerMAP.prototype.loadTileSet = function (tileSet) {

    /*if (tileSet.url && !tileSet.tileCodes) {
        omg.server.getHTTP(tileSet.url, data => {
            data.url = tileSet.url
            this.map.tileSet = data
            this.loadTileSet(this.map.tileSet)
        })
        return
    }*/

    this.tileCharSize = tileSet.tileCharSize || 1
    Object.keys(tileSet.tileCodes).forEach(key => {
        var img = document.createElement("img")
        img.src = (tileSet.prefix || "") + tileSet.tileCodes[key] + (tileSet.postfix || "")
        img.onload = e => this.draw()
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

OMGEmbeddedViewerMAP.prototype.load = function (map) {
    this.map = map
    this.width = map.width 
    this.height = map.height
    this.mapLines = map.mapLines

    for (var i = 0; i < this.mapLines.length; i++) {
        if (this.mapLines[i].length < this.width) {
            this.mapLines[i] = this.mapLines[i].padEnd(this.width, " ")
        }
    }
    for (i = this.mapLines.length; i < this.height; i++) {
        this.mapLines.push("".padEnd(this.width, " "))
    }

    this.loadTileSet(map.tileSet)
}

OMGEmbeddedViewerMAP.prototype.draw = function () {
    this.canvas.width = this.width * this.tileSize
    this.canvas.height = this.height * this.tileSize
    //this.canvas.style.width = this.canvas.width + "px"
    //this.canvas.style.height = this.canvas.height + "px"

    for (var y = 0; y < this.height; y++) { 
        for (var x = 0; x < this.width; x++) {
            if (this.mapLines[y]) {
                var tileCode = this.mapLines[y].substr(x * this.tileCharSize, this.tileCharSize)
                if (this.img.tiles[tileCode]) {
                    this.context.drawImage(this.img.tiles[tileCode],
                        x * this.tileSize, 
                        y * this.tileSize,
                        this.tileSize, this.tileSize)
                }
            }
        }    
    }
}

