function OMGMapEditor (canvas) {
    this.canvas = canvas
    this.context = canvas.getContext("2d")
    this.tileSize = 16
    this.img = {
        characters: document.getElementById("characters-spritesheet"),
        tiles: {
            "d": "desk.png",
            "b": "brick.png",
            "s": "brick.png",
            ".": "bushes.png",
            "r": "sand.png",
            " ": "grass.png",
            "t": "trees.png",
            "I": "wall1.png",
            "l": "wall2.png",
            "w": "water1.png",
            "c": "chair.png",
            "C": "chest.png",
            "O": "chestopen.png",
            "<": "stagenw.png",
            "/": "stagen.png",
            ">": "stagene.png",
            "[": "stagew.png",
            "]": "stagee.png",
            "{": "stagesw.png",
            "\\": "stages.png",
            "}": "stagese.png",
            "f": "flowers.png",
            "p": "portal.png"
            
        }
    }
    this.tileListDiv = document.getElementById("tile-list")
    Object.keys(this.img.tiles).forEach(key => {
        var img = document.createElement("img")
        img.src = "img/" + this.img.tiles[key]
        this.img.tiles[key] = img
        this.tileListDiv.appendChild(img)
        img.onclick = () => {
            if (this.selectedTile) {
                this.img.tiles[this.selectedTile].className = ""
            }
            this.selectedTile = key
            img.className = "selected"
        }
    })
    this.setupEvents(canvas)
}

OMGMapEditor.prototype.load = function (map) {
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
}

OMGMapEditor.prototype.loadRaw = function (map) {
    this.mapLines = map.split("\n")
    this.width = this.mapLines[0].length
    this.height = this.mapLines.length
    
    this.map = {
        name: "",
        width: this.width,
        height: this.height,
        startX: 0,
        startY: 0,
        npcs: [],
        mapLines: this.mapLines
    }
}

OMGMapEditor.prototype.draw = function () {
    this.canvas.width = this.width * this.tileSize
    this.canvas.height = this.height * this.tileSize
    this.canvas.style.width = canvas.width + "px"
    this.canvas.style.height = canvas.height + "px"

    for (var y = 0; y < this.mapLines.length; y++) { 
        for (var x = 0; x < this.mapLines[y].length; x++) {
            if (this.mapLines[y][x] && this.img.tiles[this.mapLines[y][x]]) {
                this.context.drawImage(this.img.tiles[this.mapLines[y][x]],
                    x * this.tileSize, 
                    y * this.tileSize,
                    this.tileSize, this.tileSize)
            }
        }    
    }
}

OMGMapEditor.prototype.setupEvents = function (canvas) {
    canvas.onmousedown = (e) => {
        this.tileEvent(e)
        this.isTouching = true
    }
    canvas.onmousemove = (e) => {
        if (this.isTouching) {
            this.tileEvent(e)
        }
    }
    canvas.onmouseup = () => {
        this.isTouching = false
    }
}

OMGMapEditor.prototype.tileEvent = function (e) {
    var x = Math.floor(e.layerX / this.tileSize)
    var y = Math.floor(e.layerY / this.tileSize)
    
    if (this.selectedTile && this.mapLines[y] && this.mapLines[y][x]) {
        this.mapLines[y] = this.mapLines[y].slice(0, x) + this.selectedTile + this.mapLines[y].slice(x + 1)
        //this.draw()
        this.context.drawImage(this.img.tiles[this.mapLines[y][x]],
            x * this.tileSize, 
            y * this.tileSize,
            this.tileSize, this.tileSize)
    }
}