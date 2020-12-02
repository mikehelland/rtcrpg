function OMGTileEditor(div) {
    
    this.div = div

    var canvas = document.createElement("canvas")
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.pixelSize = 10
    this.width = 32
    this.height = 32

    canvas.width = this.width * this.pixelSize
    canvas.height = this.height * this.pixelSize
    div.appendChild(this.canvas)

    this.frontCanvas = document.createElement("canvas")
    this.frontCtx = this.frontCanvas.getContext("2d")

    this.frontCanvas.style.position = "absolute"
    
    this.frontCanvas.style.left = this.canvas.offsetLeft + 2 + "px"
    this.frontCanvas.style.top = this.canvas.offsetTop + 2 + "px"
    this.frontCanvas.width = this.canvas.width
    this.frontCanvas.height = this.canvas.height
    this.frontCanvas.style.width = this.canvas.clientWidth  + "px"
    this.frontCanvas.style.height = this.canvas.clientHeight + "px"    
    
    div.appendChild(this.frontCanvas)

    this.setupEvents(this.frontCanvas)
    this.setupControls()

    this.frontCtx.fillStyle = "red"
    
}

OMGTileEditor.prototype.load = function (img, options) {
    //this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height)

    var tempCanvas = document.createElement("canvas")
    var tctx = tempCanvas.getContext("2d")
    tempCanvas.width = this.width
    tempCanvas.height = this.height
    tctx.drawImage(img, 0, 0, this.width, this.height)

    var imgData = tctx.getImageData(0, 0, this.width, this.height)

    var i = 0
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            this.ctx.fillStyle = "rgba(" + imgData.data[i++] + ", " + imgData.data[i++] + 
                                 ", " + imgData.data[i++] + "," + imgData.data[i++] + ")"
            this.ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize)
        }
    }
    
    this.sourceCtx = tctx
    this.sourceCanvas = tempCanvas
    this.previewCallback = options.previewCallback
    this.saveCallback = options.saveCallback
}

OMGTileEditor.prototype.setupEvents = function (canvas) {
    canvas.onmousedown = (e) => {
        this.isTouching = true    
        this.ondown(Math.floor(e.layerX / this.pixelSize), Math.floor(e.layerY / this.pixelSize))
    }
    canvas.onmousemove = (e) => {
        this.onmove(Math.floor(e.layerX / this.pixelSize), Math.floor(e.layerY / this.pixelSize))
    }
    canvas.onmouseup = (e) => {
        this.onup(Math.floor(e.layerX / this.pixelSize), Math.floor(e.layerY / this.pixelSize))
        this.isTouching = false
    }

    canvas.onmouseleave = e => {
        this.onleave()
    }
}


OMGTileEditor.prototype.ondown = function (x, y) {
    if (this.toolSelect.value === "Pencil" || this.toolSelect.value === "Brush") {
        this.drawPixel(x, y, this.colorPicker.value, this.toolSelect.value === "Brush")
    }

}

OMGTileEditor.prototype.onmove = function (x, y) {
    if (this.isTouching) {
        if (this.toolSelect.value === "Pencil" || this.toolSelect.value === "Brush") {
            this.drawPixel(x, y, this.colorPicker.value, this.toolSelect.value === "Brush")
        }
    }
}

OMGTileEditor.prototype.onup = function (x, y) {
    if (this.isTouching) {
        if (this.toolSelect.value === "Fill") {
            this.fill(x, y, this.colorPicker.value)
        }
        if (this.previewCallback) {
            this.previewCallback(this.sourceCtx.canvas.toDataURL("image/png"))
        }
    }
}

OMGTileEditor.prototype.onleave = function (x, y) {

}

OMGTileEditor.prototype.setupControls = function () {
    this.toolSelect = document.createElement("select")
    this.toolSelect.innerHTML = "<option>Pencil</option><option>Brush</option><option>Fill</option>"

    this.colorPicker = document.createElement("input")
    this.colorPicker.type = "color"

    this.canvas.parentElement.appendChild(this.toolSelect)
    this.canvas.parentElement.appendChild(this.colorPicker)
}

OMGTileEditor.prototype.drawPixel = function (x, y, color, brush) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize)

    this.sourceCtx.fillStyle = color
    this.sourceCtx.fillRect(x, y, 1, 1)

    if (brush) {
        this.drawPixel(x - 1, y - 1, color)
        this.drawPixel(x, y - 1, color)
        this.drawPixel(x + 1, y - 1, color)
        this.drawPixel(x - 1, y, color)
        this.drawPixel(x + 1, y, color)
        this.drawPixel(x - 1, y + 1, color)
        this.drawPixel(x, y + 1, color)
        this.drawPixel(x + 1, y + 1, color)
    }
}

OMGTileEditor.prototype.getData = function () {
    return this.sourceCtx.canvas.toDataURL("image/png")
}

OMGTileEditor.prototype.fill = function (x, y, color) {

    var imgData = this.sourceCtx.getImageData(x, y, 1, 1).data
    console.log(imgData)
    this.drawPixel(x, y, color)

    var tilesChecked = {}
    var nextTiles = [[x, y]]
    
    while (nextTiles.length > 0) {
        var newTiles = []

        for (var i = 0; i < nextTiles.length; i++) {
            x = nextTiles[i][0]
            y = nextTiles[i][1]
            
            if (!tilesChecked[x + "," + y]) {
                tilesChecked[x + "," + y] = true

                this.checkFillTile(x + 1, y, color, imgData, newTiles)
                this.checkFillTile(x - 1, y, color, imgData, newTiles)
                this.checkFillTile(x, y + 1, color, imgData, newTiles)
                this.checkFillTile(x, y - 1, color, imgData, newTiles)

            }
        }

        nextTiles = newTiles
    }

}

OMGTileEditor.prototype.checkFillTile = function (x, y, color, fillPixel, newTiles) {
    if (x >= 0 && x < this.sourceCanvas.width && y >= 0 && y < this.sourceCanvas.height) {
        var imgData = this.sourceCtx.getImageData(x, y, 1, 1).data
        if (imgData[0] === fillPixel[0] && imgData[1] === fillPixel[1] && 
                    imgData[2] === fillPixel[2] && imgData[3] === fillPixel[3]) {
            console.log(imgData)
            newTiles.push([x, y])
            this.drawPixel(x, y, color)
        }
    }
}