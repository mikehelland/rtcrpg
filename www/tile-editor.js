function OMGTileEditor(div, palette) {
    
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
    
    //this.frontCanvas.style.left = this.canvas.offsetLeft + 2 + "px"
    
    div.appendChild(this.frontCanvas)

    this.palette = palette

    this.setupEvents(this.frontCanvas)
    this.setupControls()

    this.frontCtx.fillStyle = "red"
    
}

OMGTileEditor.prototype.load = function (img, options) {
    this.frontCanvas.style.top = this.canvas.offsetTop + "px"
    this.frontCanvas.width = this.canvas.width
    this.frontCanvas.height = this.canvas.height
    this.frontCanvas.style.width = this.canvas.clientWidth  + "px"
    this.frontCanvas.style.height = this.canvas.clientHeight + "px"    
    
    //this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height)
    this.undoStack = []
    this.canvas.width = this.canvas.width
    
    var tempCanvas = document.createElement("canvas")
    var tctx = tempCanvas.getContext("2d")
    tempCanvas.width = this.width
    tempCanvas.height = this.height
    tctx.drawImage(img, 0, 0, this.width, this.height)

    var imgData = tctx.getImageData(0, 0, this.width, this.height)

    this.loadImgData(imgData)
    
    this.sourceCtx = tctx
    this.sourceCanvas = tempCanvas
    this.previewCallback = options.previewCallback
    this.saveCallback = options.saveCallback


    this.loadPalette()
}

OMGTileEditor.prototype.loadImgData = function (imgData, updateSource) {
    var i = 0
    for (var y = 0; y < imgData.height; y++) {
        for (var x = 0; x < imgData.width; x++) {
            var color = "rgba(" + imgData.data[i++] + ", " + imgData.data[i++] + 
                ", " + imgData.data[i++] + "," + imgData.data[i++] + ")"
            if (updateSource) {
                this.sourceCtx.fillStyle = color
                this.sourceCtx.fillRect(x, y, 1, 1)
            }

            this.ctx.fillStyle = color
            this.ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize)
        }
    }
    
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
        this.isTouching = false
    }
}


OMGTileEditor.prototype.ondown = function (x, y) {
    this.undoStack.push(this.sourceCtx.getImageData(0, 0, this.width, this.height))

    if (this.toolSelect.value === "Pencil" || this.toolSelect.value === "Brush") {
        this.drawPixel(x, y, this.colorPicker.value, this.toolSelect.value === "Brush")
    }
    else if (this.toolSelect.value = "Eyedropper") {
        var imgData = this.sourceCtx.getImageData(x, y, 1, 1).data
        this.colorPicker.value = this.rgbToHex(imgData[0], imgData[1], imgData[2])
    }

}

OMGTileEditor.prototype.onmove = function (x, y) {
    if (this.isTouching) {
        if (this.toolSelect.value === "Pencil" || this.toolSelect.value === "Brush") {
            this.drawPixel(x, y, this.colorPicker.value, this.toolSelect.value === "Brush")
        }
    }
    else {
        this.frontCanvas.width = this.frontCanvas.width
        this.frontCtx.fillStyle = this.colorPicker.value
        if (this.toolSelect.value === "Pencil") {
            this.frontCtx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize)
        }
        else if (this.toolSelect.value === "Brush") {
            this.frontCtx.fillRect((x - 1) * this.pixelSize, (y - 1) * this.pixelSize, this.pixelSize * 3, this.pixelSize * 3)
        }

    }
}

OMGTileEditor.prototype.onup = function (x, y) {
    if (this.isTouching) {
        if (this.toolSelect.value === "Fill") {
            this.fill(x, y, this.colorPicker.value)
        }
        this.onChange()
    }
}

OMGTileEditor.prototype.onleave = function (x, y) {

}

OMGTileEditor.prototype.setupControls = function () {
    this.toolSelect = document.createElement("select")
    this.toolSelect.innerHTML = "<option>Pencil</option><option>Brush</option><option>Fill</option><option>Eyedropper</option>"

    this.colorPicker = document.createElement("input")
    this.colorPicker.type = "color"
    this.colorPicker.onchange = e => {
        if (!this.palette) {
            this.palette = []
        }
        if (this.palette.indexOf(this.colorPicker.value) === -1) {
            this.palette.push(this.colorPicker.value)
        }
        this.makePalette(this.colorPicker.value)
    }

    this.flipXButton = document.createElement("button")
    this.flipXButton.innerHTML = "FlipX"
    this.flipYButton = document.createElement("button")
    this.flipYButton.innerHTML = "FlipY"
    this.rotateButton = document.createElement("button")
    this.rotateButton.innerHTML = "Rotate"
    
    this.undoButton = document.createElement("button")
    this.undoButton.innerHTML = "Undo"

    this.canvas.parentElement.appendChild(this.toolSelect)
    this.canvas.parentElement.appendChild(this.colorPicker)
    this.canvas.parentElement.appendChild(this.flipXButton)
    this.canvas.parentElement.appendChild(this.flipYButton)
    this.canvas.parentElement.appendChild(this.rotateButton)
    this.canvas.parentElement.appendChild(this.undoButton)
    
    this.rotateButton.onclick = e => this.rotate()
    this.flipXButton.onclick = e => this.flipX()
    this.flipYButton.onclick = e => this.flipY()
    this.undoButton.onclick = e => {
        if (this.undoStack.length) {
            this.loadImgData(this.undoStack.pop(), true)
            if (this.previewCallback) {
                this.previewCallback(this.sourceCtx.canvas.toDataURL("image/png"))
            }
        }
    }
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
    if (this.previewCallback) {
        this.previewCallback(this.sourceCtx.canvas.toDataURL("image/png"))
    }
}

OMGTileEditor.prototype.checkFillTile = function (x, y, color, fillPixel, newTiles) {
    if (x >= 0 && x < this.sourceCanvas.width && y >= 0 && y < this.sourceCanvas.height) {
        var imgData = this.sourceCtx.getImageData(x, y, 1, 1).data
        if (imgData[0] === fillPixel[0] && imgData[1] === fillPixel[1] && 
                    imgData[2] === fillPixel[2] && imgData[3] === fillPixel[3]) {
            newTiles.push([x, y])
            this.drawPixel(x, y, color)
        }
    }
}


OMGTileEditor.prototype.blankTile = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFACAYAAADNkKWqAAABpElEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                                    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                                    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                                    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                                    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMCn" +
                                    "AUGaAAH3lkeeAAAAAElFTkSuQmCC"

OMGTileEditor.prototype.rotate = function () {

    var imgData = this.sourceCtx.getImageData(0, 0, this.width, this.height)

    var i = 0
    for (var x = this.width - 1; x >= 0; x--) {
        for (var y = 0; y < this.height; y++) {
            this.ctx.fillStyle = "rgba(" + imgData.data[i++] + ", " + imgData.data[i++] + 
                                 ", " + imgData.data[i++] + "," + imgData.data[i++] + ")"
            this.ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize)
            this.sourceCtx.fillStyle = this.ctx.fillStyle
            this.sourceCtx.fillRect(x, y, 1, 1)
        }
    }
    this.onChange()
}

OMGTileEditor.prototype.flipX = function () {

    var imgData = this.sourceCtx.getImageData(0, 0, this.width, this.height)

    var i = 0
    for (var y = 0; y < this.height; y++) {
        for (var x = this.width - 1; x >= 0; x--) {
            this.ctx.fillStyle = "rgba(" + imgData.data[i++] + ", " + imgData.data[i++] + 
                                 ", " + imgData.data[i++] + "," + imgData.data[i++] + ")"
            this.ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize)
            this.sourceCtx.fillStyle = this.ctx.fillStyle
            this.sourceCtx.fillRect(x, y, 1, 1)
        }
    }
    this.onChange()
}

OMGTileEditor.prototype.flipY = function () {

    var imgData = this.sourceCtx.getImageData(0, 0, this.width, this.height)

    var i = 0
    for (var y = this.height - 1; y >= 0; y--) {
        for (var x = 0; x < this.width; x++) {
            this.ctx.fillStyle = "rgba(" + imgData.data[i++] + ", " + imgData.data[i++] + 
                                 ", " + imgData.data[i++] + "," + imgData.data[i++] + ")"
            this.ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize)
            this.sourceCtx.fillStyle = this.ctx.fillStyle
            this.sourceCtx.fillRect(x, y, 1, 1)
        }
    }
    this.onChange()
}

OMGTileEditor.prototype.loadPalette = function () {
    if (this.palette) {
        if (!this.palettePicker) {
            this.palettePicker = document.createElement("div")
            this.div.appendChild(this.palettePicker)
        }
        this.palettePicker.innerHTML = ""
        this.palette.forEach(color => {
            this.makePalette(color)
        })
    }
}

OMGTileEditor.prototype.makePalette = function (color) {
    var div = document.createElement("div")
    div.className = "color-palette-picker"
    div.style.backgroundColor = color
    div.onclick = e => {
        this.colorPicker.value = color
    }
    this.palettePicker.appendChild(div)
}

OMGTileEditor.prototype.onChange = function () {

    if (this.previewCallback) {
        this.previewCallback(this.sourceCtx.canvas.toDataURL("image/png"))
    }
}

OMGTileEditor.prototype.componentToHex = function (c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  
OMGTileEditor.prototype.rgbToHex = function (r, g, b) {
    return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
}