import OMGRPGMap from "./rpgmap.js"
import OMGSpriter from "/apps/sprite/spriter.js"
import OMusicContext from "/apps/music/js/omusic.js"

export default function OMGGameEngine(params) {
    this.debugBoxes = false
    this.params = params

    this.setupCanvas()

    this.setupInputs()

    this.hero = {
        facingX: 0,
        facingY: 1,
        dx: 0,
        dy: 0,
        wishX: 0,
        wishY: 0,
        x: 0,
        y: 0,
        jumping: 0
    }

    this.friction = 1.1
    this.maxJump = 1//25

    this.frameCount = 0
    this.physicsFrame = 0

    this.dmax = 8
    this.gravity = 0 
    this.gravityOnValue = 0.5
    this.targetTiles = []

    this.fudge = 8

    this.beatColors = ["green", "yellow", "blue", "yellow"]

    this.setupGamepad()

}

OMGGameEngine.prototype.mainLoop = function () {
    
    if (this.gamepad) {
        if (this.gamepad.buttons[0] && this.gamepad.buttons[0].pressed) {
            console.log("button0 pressed")
        }

    }


    this.physics()

    this.render()

}

OMGGameEngine.prototype.loadMap = function (data, mapName) {
    this.roomName = mapName

    this.map = new OMGRPGMap(data, {backCanvas: this.backgroundCanvas, charCanvas: this.canvas})
    this.map.tileSize = this.tileSize
    
    this.background.style.width = this.backgroundCanvas.width + "px"
    this.background.style.height = this.backgroundCanvas.height + "px"

    this.npcs = data.npcs || []

    for (var npc of this.npcs) {
        npc.dx = 0
        npc.dy = 0
        if (npc.motion === "LEFTRIGHT") {
            npc.dx = -0.2
            npc.reflect = true
        }
        if (npc.motion === "UPDOWN") {
            npc.dy = -0.2
            npc.reflect = true
        }
    }
    
    if (this.map.data.gravity) {
        this.gravity = this.gravityOnValue
    }


    if (!this.running) {
        //this.mainLoop()
        setInterval(() => this.mainLoop(), 1000 / 60)
        this.running = true

        this.hero.x = data.startX * this.tileSize
        this.hero.y = data.startY * this.tileSize
        this.hero.facing = 0    
    }

    if (this.map.data.music) {
        this.loadMusic(this.map.data.music)
    }
}


OMGGameEngine.prototype.setupCanvas = function () {

    this.gameDisplay = document.getElementById("game-display")
    this.background = document.getElementById("background")
    this.backgroundCanvas = document.getElementById("backgroundCanvas")
    this.backgroundContext = this.backgroundCanvas.getContext("2d")

    this.canvas = document.getElementById("mainCanvas")
    this.canvas.style.width = "100%" //window.innerWidth + "px"
    this.canvas.style.height = "100%" //window.innerHeight + "px"
    this.canvas.width = this.canvas.clientWidth // todo 1920
    this.canvas.height = this.canvas.clientHeight // 1080
    this.context = this.canvas.getContext("2d")

    // 1080p is 1,920x1,080

    /*var aspectRatio = 1920 / 1080
    var windowAspectRatio = window.innerWidth / window.innerHeight
    if (windowAspectRatio === aspectRatio) {
        this.offsetLeft = 0
        this.offsetTop = 0
    }
    else if (windowAspectRatio > aspectRatio) {
        this.offsetLeft = 0
        this.offsetTop = 0
    }*/

    // make it square
    this.tileOffset = 8
    if (this.canvas.height > this.canvas.width) {
        this.tileSize = 32 //Math.floor(this.canvas.width / (this.tileOffset * 2 + 1))
        this.offsetTop = (this.canvas.height - this.canvas.width) / 2
        this.offsetLeft = 0
    }
    else {
        this.tileSize = 32 // Math.floor(this.canvas.height / (this.tileOffset * 2 + 1))
        this.offsetLeft = (this.canvas.width - this.canvas.height) / 2
        this.offsetTop = 0
    }

    this.offsetTop = 0
    this.offsetLeft = 0
    

    this.tileWidth = this.tileSize
    this.tileHeight = this.tileSize


    //our character is always in the middle
    //this sets how many tiles each direction are shown
    this.middleTileX = this.canvas.width / 2 - this.tileWidth / 2
    this.middleTileY = this.canvas.height / 2 - this.tileHeight / 2

}

OMGGameEngine.prototype.setupInputs = function () {

    this.keysPressed = {}
    
    document.onkeydown = e => {
        if (e.target.tagName.toLowerCase() === "input") {
            return
        }

        if (this.activeDialog) {
            document.body.removeChild(this.activeDialog)
            this.activeDialog = null
            return
        }

        if (this.gravity && e.key === " " && !this.keysPressed[" "] && !this.hero.jumping) {
            this.hero.jumpInput = true
            this.hero.jumping = Date.now()
            this.heroSpriter.setSheet("jump")
            this.heroSpriter.i = 0
            
            //this.hero.wishY = -1
            this.hero.dy = -16
        }
        else if (!this.gravity && e.key === " ") {
            this.actionKey()
        }
        else if (e.key === "ArrowUp") {
            this.hero.wishY = -1
            this.hero.facing = 2
        }
        else if (e.key === "ArrowDown") {
            this.hero.wishY = 1
            this.hero.facing = 0
        }
        else if (e.key === "ArrowLeft") {
            this.hero.wishX = -1
            this.hero.facing = 3
        }
        else if (e.key === "ArrowRight") {
            this.hero.wishX = 1
            this.hero.facing = 1
        }
        else if (e.key === "G") {
            if (this.gravity) {
                this.gravity = 0
            }
            else {
                this.gravity = this.gravityOnValue
            }
        }
        else if (e.key === "D") {
            this.heroSpriter.drawBorder = !this.heroSpriter.drawBorder
            this.debugBoxes = !this.debugBoxes
            for (var sprite of this.map.activeSprites) {
                sprite.spriter.drawBorder = !sprite.spriter.drawBorder
            }
        }
        else if (e.key === "E") {
            window.location = "map-editor.htm?id=" + this.map.data.id
        }

        this.keysPressed[e.key] = true

        if (this.musicPlayer && !this.musicStarted && (this.hero.wishX || this.hero.wishY)) {
            this.musicPlayer.play()
            this.musicStarted = true
        }
    }
    document.onkeyup = e => {
        if (e.key === " ") {
            if (this.hero.dy < 0) {
                this.hero.dy = Math.floor(this.hero.dy / 4)
            }
            this.hero.wishY = 0
            //this.hero.jumping = this.maxJump
            this.hero.jumpInput = false
        }
        if (e.key === "ArrowUp" && !this.keysPressed["ArrowDown"]) {
            this.hero.wishY = 0
        }
        else if (e.key === "ArrowDown" && !this.keysPressed["ArrowUp"]) {
            this.hero.wishY = 0
        }
        else if (e.key === "ArrowLeft" && !this.keysPressed["ArrowRight"]) {
            this.hero.wishX = 0
        }
        else if (e.key === "ArrowRight" && !this.keysPressed["ArrowLeft"]) {
            this.hero.wishX = 0
        }
        delete this.keysPressed[e.key]
    }
    
}

OMGGameEngine.prototype.move = function (x, y) {

    this.hero.facingX = x
    this.hero.facingY = y
    if (y === 1) this.hero.facing = 0
    if (y === -1) this.hero.facing = 2
    if (x === 1) this.hero.facing = 1
    if (x === -1) this.hero.facing = 3

    if (x) {
        this.hero.dx += x
        this.hero.dx = Math.max(-5, Math.min(5, this.hero.dx))
    }
    else {
        this.hero.dy += y
        this.hero.dy = Math.max(-5, Math.min(5, this.hero.dy))
    }
}



OMGGameEngine.prototype.render = function () {

    if (Date.now() - this.frameCount > 250) {
        this.frameCount = Date.now()
        this.nextFrame = true
    }

    if (!this.drawnBackground) {
        this.map.draw()
        this.drawnBackground = true
    }

    this.background.style.left = this.hero.x * -1 + this.middleTileX + "px"
    this.background.style.top = this.hero.y * -1 + this.middleTileY  + "px"

    this.canvas.width = this.canvas.width
    
    this.drawCharacters()
    if (this.debugBoxes) {
        this.context.fillStyle = "white"
        this.context.font = "14pt serif"
        this.context.fillText(this.hero.wishX, 10, 20)
        this.context.fillText(this.hero.wishY, 10, 50)
        this.context.fillText(this.hero.dx, 10, 80)
        this.context.fillText(this.hero.dy, 10, 110)

        this.drawHighlightedTiles()
    }
    this.nextFrame = false
}

OMGGameEngine.prototype.loadHero = async function (spriteData) {
    this.heroSprite = spriteData

    // todo move to top
    this.heroSpriter = new OMGSpriter(spriteData, this.canvas)
    this.heroSpriter.setSheet("walk")
    if (this.debugBoxes) {
        this.heroSpriter.drawBorder = true
    }
    this.heroSpriter.x = this.offsetLeft+ this.middleTileX
    this.heroSpriter.y = this.offsetTop + this.middleTileY

    this.heroWidth = spriteData.frameWidth / 32
    this.heroHeight = spriteData.frameHeight / 32
    this.heroSpriter.w = this.heroWidth * this.tileSize
    this.heroSpriter.h = this.heroHeight * this.tileSize

}

OMGGameEngine.prototype.drawCharacters = function () {

    this.map.charCanvasOffsetX = this.middleTileX - this.hero.x
    this.map.charCanvasOffsetY = this.middleTileY - this.hero.y

    this.drawBeatRegions()

    this.map.drawNPCs(this.nextFrame)

    if (this.heroSpriter) {
        this.heroSpriter.setRow(this.hero.facing)
        if (!this.hero.jumping) {
            if (this.nextFrame) {
                if (this.heroSpriter.sheetName !== "walk") {
                    this.heroSpriter.setSheet("walk")
                    this.heroSpriter.i = 0
                }
                else {
                    this.heroSpriter.next()
                }
            }
        }
        else {
            this.heroSpriter.i = Date.now() - this.hero.jumping < 150 ? 0 : this.hero.jumpInput ? 1 : 2
        }
        this.heroSpriter.draw()
    }

}

OMGGameEngine.prototype.drawHighlightedTiles = function () {

    this.context.strokeStyle = "blue"
    this.context.lineWidth = 5

    for (var tileData of this.targetTiles) {
        this.context.strokeRect(tileData.x * this.tileSize - this.hero.x + this.middleTileX, 
                                tileData.y * this.tileSize - this.hero.y + this.middleTileY,
                                this.tileSize, this.tileSize)

    }
}

OMGGameEngine.prototype.physics = function () {

    if (this.gravity) { 
        this.hero.dy += this.gravity
        this.hero.dy = Math.max(-2 * this.dmax, Math.min(2 * this.dmax, this.hero.dy + this.hero.wishY))
    }
    else {
        this.hero.dy = Math.max(-this.dmax, Math.min(this.dmax, this.hero.dy + this.hero.wishY))
    }
    this.hero.dx = Math.max(-this.dmax, Math.min(this.dmax, this.hero.dx + this.hero.wishX))    
    
    if (this.hero.stunned) {
        this.hero.dx = 0
        this.hero.dy = 0
    }
 
    if (!this.gravity && this.hero.dx && this.hero.dy) {
        var hyp = Math.sqrt(Math.pow(this.hero.dx, 2) + Math.pow(this.hero.dy, 2))
        if (hyp > this.dmax) {
            this.hero.dx = this.hero.dx * (this.dmax / hyp) 
            this.hero.dy = this.hero.dy * (this.dmax / hyp)
        }
    }

    
    this.targetTiles = []

    if (this.hero.dy || this.hero.dx) {
        this.touchingNPC = null
    }


    if (this.hero.dy && this.canProceedY()) {
        if (this.gravity && !this.hero.jumping) {
            this.heroSpriter.setSheet("jump")
            this.heroSpriter.i = 0
            this.hero.jumping = Date.now()
        }
        this.hero.y += this.hero.dy
    }
    else {
        this.hero.dy = 0
    }
    if (this.hero.dx && this.canProceedX()) {
        this.hero.x += this.hero.dx
    }
    
    if (!this.hero.jumping && this.hero.dx > 0 && !this.keysPressed["ArrowRight"]) {
        if (this.hero.dx < this.friction) {
            this.hero.dx = 0
        }
        else {    
            this.hero.dx -= this.friction
        }
    }
    else if (!this.hero.jumping && this.hero.dx < 0 && !this.keysPressed["ArrowLeft"]) {
        if (0 - this.hero.dx < this.friction) {
            this.hero.dx = 0
        }
        else {    
            this.hero.dx += this.friction
        }
    }
    else if (!this.gravity && this.hero.dy > 0 && !this.keysPressed["ArrowDown"]) {
        if (this.hero.dy < this.friction) {
            this.hero.dy = 0
        }
        else {    
            this.hero.dy -= this.friction
        }
    }
    else if (!this.gravity && this.hero.dy < 0 && !this.keysPressed["ArrowUp"]) {
        if (0 - this.hero.dy < this.friction) {
            this.hero.dy = 0
        }
        else {    
            this.hero.dy += this.friction
        }
    }

    this.moveNPCs()
}

OMGGameEngine.prototype.canProceedX = function () {
    
    var targets = []
    var target
    var targety

    var x = Math.floor((this.hero.x + this.hero.dx) / this.tileSize)
    var y = Math.floor((this.hero.y) / this.tileSize)

    //console.log(this.hero.y, this.tileSize, this.hero.y / this.tileSize)
    if (this.hero.dx > 0) {
        x += this.heroWidth
    }
    if (this.hero.dy > 0) {
        //y += this.heroHeight
    }
    
    var boxCount = this.heroHeight
    var boxStart = 0
    var margin = this.hero.y - y * this.tileSize
    

    if (margin < this.fudge) {
        boxCount -= 1
    }
    else if (margin > this.fudge * -1 + this.tileSize) {
        boxStart = 1
    }

    // if we're we can walk in all directions,
    // use the feet as the hit box
    if (!this.gravity) {
        boxStart = boxCount
    }
    var blocked = false
    if (this.hero.dx !== 0) {
        for (this.imoveHitTest = boxStart; this.imoveHitTest <=  boxCount; this.imoveHitTest++) {
            if (this.map.tiles[x]) {
                target = this.map.tiles[x][y + this.imoveHitTest]
                if (target) {
                    var targetTile = {tile: target,
                        x: x,
                        y: y + this.imoveHitTest
                    }
                    this.targetTiles.push(targetTile)
                    targets.push(targetTile)
                }

                if (!target || !target.walkable) {
                    blocked = true
                }
            }
            else {
                blocked = true
            }
        }
    }

    for (var sprite of this.map.activeSprites) {
        for (this.imoveHitTest = 0; this.imoveHitTest <  targets.length; this.imoveHitTest++) {
            if (sprite.type === "npc" && sprite.thing.y <= targets[this.imoveHitTest].y && sprite.thing.y + sprite.thing.height > targets[this.imoveHitTest].y && 
                (targets[this.imoveHitTest].x === (this.hero.dx < 0 ? sprite.thing.x + sprite.thing.width - 1 : sprite.thing.x))) {
                this.touchingNPC = sprite
                return false
            }

        }
    }
    
    var oldRegion = this.inRegion
    this.inRegion = undefined
    for (var region of this.map.data.regions) {
        for (this.imoveHitTest = 0; this.imoveHitTest <  targets.length; this.imoveHitTest++) {                    
            if (region.y <= targets[this.imoveHitTest].y && region.y + region.height > targets[this.imoveHitTest].y && 
                (targets[this.imoveHitTest].x === (this.hero.dx < 0 ? region.x + region.width : region.x))) {
                    this.inRegion = region
                    if (region.walkable === "true" 
                            || (region.walkable === "onbeat" && region.musicBeat === this.currentBeat)
                            || (region.walkable === "offbeat" && region.musicBeat !== this.currentBeat)) {
                        if (!oldRegion || this.inRegion !== oldRegion) {
                            if (region.function && ge[region.function]) {
                                ge[region.function](region)
                            }
                        }
                        return true
                    }

                    return false
            }

        }
    }
    return !blocked
}

OMGGameEngine.prototype.canProceedY = function () {
    
    var targets = []
    var target
    var targety

    var x = Math.round((this.hero.x + this.hero.dx) / this.tileSize)
    var y = Math.floor((this.hero.y + this.hero.dy) / this.tileSize)

    if (this.hero.dx > 0) {
        //x += this.heroWidth
    }

    // if we can walk in all directions, use the feet as hit boxes
    if (this.hero.dy > 0) {
        y += this.heroHeight
    }
    else {
        if (!this.gravity) {
            y += this.heroHeight - 1
        }    
    }

    var boxCount = this.heroWidth
    var boxStart = 0
    var margin = this.hero.x - x * this.tileSize
    
    /*
    if (margin < this.fudge) {
        boxCount -= 1
    }
    else if (margin > this.fudge * -1 + this.tileSize) {
        boxStart = 1
    }
    */
    
    var blocked = false
    if (this.hero.dy !== 0) {
        if (!this.map.tiles[x]) {
            return false
        }
        targety = this.map.tiles[x][y]
        if (!targety) {
            return false
        }
        else {
            for (this.imoveHitTest = boxStart; this.imoveHitTest <  boxCount; this.imoveHitTest++) {
                if (this.map.tiles[x + this.imoveHitTest]) {
                    var targetTile = {
                        tile: this.map.tiles[x + this.imoveHitTest][y],
                        x: x + this.imoveHitTest,
                        y: y
                    }
                    targets.push(targetTile)
                    this.targetTiles.push(targetTile)

                    if (!targetTile.tile.walkable) {
                        if (this.gravity && this.hero.dy > 1 && targetTile.y * this.tileSize > this.hero.y + this.heroSpriter.h) {
                            this.hero.dy = targetTile.y * this.tileSize - this.hero.y - this.heroSpriter.h
                            //console.log("land", this.hero.dy, targets[this.imoveHitTest].y * this.tileSize , this.hero.y + this.heroSpriter.h)
                            
                        }
                        else {
                            if (this.hero.jumping) {
                                this.heroSpriter.i = 3
                                this.hero.jumping = 0
                                //this.heroSpriter.setSheet("walk")
                                //this.heroSpriter.i = 0
                            }
                            //console.log("land2")
                            blocked = true
                        }
                    }
                }
            }
        }
    }
    
    for (var sprite of this.map.activeSprites) {
        for (this.imoveHitTest = 0; this.imoveHitTest <  targets.length; this.imoveHitTest++) {
            if (sprite.type === "npc" && sprite.thing.x <= targets[this.imoveHitTest].x && sprite.thing.x + sprite.thing.width > targets[this.imoveHitTest].x && 
                (targets[this.imoveHitTest].y === (this.hero.dy < 0 ? sprite.thing.y + sprite.thing.height : sprite.thing.y))) {
                    if (this.hero.jumping) {
                        this.heroSpriter.i = 3
                        this.hero.jumping = 0
                    }
                    this.touchingNPC = sprite
                    return false
            }

        }
    }
    
    var oldRegion = this.inRegion
    
    this.inRegion = undefined
    for (var region of this.map.data.regions) {
        for (this.imoveHitTest = 0; this.imoveHitTest <  targets.length; this.imoveHitTest++) {
            if (region.x <= targets[this.imoveHitTest].x && region.x + region.width > targets[this.imoveHitTest].x && 
                (targets[this.imoveHitTest].y === (this.hero.dy < 0 ? region.y + region.height : region.y))) {
                    if (this.hero.jumping) {
                        this.heroSpriter.i = 3
                        this.hero.jumping = 0
                    }
                    console.log(region)
                    this.inRegion = region
                    if (region.walkable === "true" 
                            || (region.walkable === "onbeat" && region.musicBeat === this.currentBeat)
                            || (region.walkable === "offbeat" && region.musicBeat !== this.currentBeat)) {
                        if (!oldRegion || this.inRegion !== oldRegion) {
                            if (region.function && ge[region.function]) {
                                ge[region.function](region)
                            }
                        }
                        
                        return true
                    }
                    return false
            }

        }
    }
    return !blocked
}

OMGGameEngine.prototype.actionKey = function () {

    if (this.activeDialog) {
        document.body.removeChild(this.activeDialog)
        this.activeDialog = null
        return
    }

    if (this.touchingNPC && this.touchingNPC.thing) {

        if (this.touchingNPC.thing.dialog) {
            this.showDialog(this.touchingNPC.thing.dialog)
        }

        if (this.touchingNPC.on) {

        }

        if (!this.touchingNPC.thing.musicBeat || this.touchingNPC.thing.musicBeat === this.currentBeat) {
            this.touchingNPC.thing.on = !this.touchingNPC.thing.on
            this.touchingNPC.spriter.setSheet(this.touchingNPC.thing.on ? this.touchingNPC.thing.onSheet : this.touchingNPC.thing.offSheet) 
            this.touchingNPC.spriter.i = 0
            this.touchingNPC.thing.animating = true//!this.touchingNPC.thing.animating

            if (this.touchingNPC.thing.musicPart) {
                let partName = this.touchingNPC.thing.musicPart
                if (this.song && this.song.parts[partName]) {
                    let part = this.song.parts[partName]
                    this.musicCtx.mutePart(part, !this.touchingNPC.thing.on)
                    console.log("muted")
                }
            }
        
        }

    }
}

OMGGameEngine.prototype.loadMusic = async function (music) {
    if (!this.musicPlayer) {
        var o = await import("/apps/music/js/omusic.js")
        var OMusicContext = o.default
        this.musicCtx = new OMusicContext()
        this.musicCtx.loadFullSoundSets = true
    }

    if (music.type === "SONG" && music.omgurl) {
        var res = await fetch(music.omgurl)
        var data = await res.json()
        
        var {player, song} = await this.musicCtx.load(data)
        this.musicPlayer = player
        this.song = song

        this.setupBeatIndicator()
    }

}

OMGGameEngine.prototype.setupBeatIndicator = function () {
    this.beatIndicatorDiv = document.getElementById("beat-indicator")
    this.beatIndicatorDiv.className = "game-engine-beat-indicator"
    var beatDivs = []
    var lastDiv

    for (var i = 0; i < 4; i++) {
        let beatDiv = document.createElement("div")

        this.beatIndicatorDiv.appendChild(beatDiv)
        beatDiv.className = "game-engine-beat-indicator-beat"
        beatDivs.push(beatDiv)

        beatDiv.style.backgroundColor = this.beatColors[i]
        beatDiv.style.border = "10px solid black"
    }


    this.beatPlayedListener = (subbeat) => {        
        if (subbeat % 4 === 0) {
            this.currentBeat = (subbeat / 4) + 1
            if (lastDiv) {
                lastDiv.style.border = "10px solid black"
            }
            lastDiv = beatDivs[subbeat / 4]
            lastDiv.style.border = "10px solid " + this.beatColors[subbeat / 4]
            this.updateNPCs()
        }
        //this.drawBeatRegions()
    }
    this.musicPlayer.onBeatPlayedListeners.push(this.beatPlayedListener)
    //this.gameDisplay.appendChild(this.beatIndicatorDiv)
}

// maybe this should be in the map?
OMGGameEngine.prototype.drawBeatRegions = function () {
    if (!this.currentBeat) return

    for (this._drawBeatRegionI of this.map.data.regions) {
        if (this._drawBeatRegionI.musicBeat === this.currentBeat) {
            this.map.charCtx.globalAlpha = 1
        }
        else {
            this.map.charCtx.globalAlpha = 0.2
        }

        this.map.charCtx.fillStyle = this.beatColors[this._drawBeatRegionI.musicBeat - 1]
        this.map.charCtx.fillRect(
            this._drawBeatRegionI.x * this.tileSize + this.map.charCanvasOffsetX, 
            this._drawBeatRegionI.y * this.tileSize + this.map.charCanvasOffsetY,
            this._drawBeatRegionI.width * this.tileSize, 
            this._drawBeatRegionI.height * this.tileSize) 
        
        this.map.charCtx.globalAlpha = 1
    }
}


OMGGameEngine.prototype.turnGravityOn = function () {
    this.gravity = this.gravityOnValue
    console.log("gravity on")
}

OMGGameEngine.prototype.updateNPCs = function () {
    for (this._iupdateNPCs of this.map.activeSprites) {
        // if the npc has musicBeat, and is not on, show the beatSheet
        if (this._iupdateNPCs.thing && this._iupdateNPCs.thing.beatSheet && !this._iupdateNPCs.thing.on) {
            if (this._iupdateNPCs.thing.musicBeat === this.currentBeat) {
                this._iupdateNPCs.spriter.setSheet(this._iupdateNPCs.thing.beatSheet)
            }
            else {
                this._iupdateNPCs.spriter.setSheet(this._iupdateNPCs.thing.offSheet)
            }
        }
    }
}


// todo make this part of the map?
OMGGameEngine.prototype.enterRoad = function () {
    if (this.onRoad) {
        return
    }

    this.onRoad = true
    this.carThing = {
        x: -1,//this.hero.x / this.map.tileSize, 
        y: this.hero.y / this.map.tileSize + 1
    }
    this.car = {spriter: this.carSpriter, thing: this.carThing}
    this.map.activeSprites.push(this.car)

    this.enteredRoadY = this.hero.facing === 0 ? this.hero.y : this.hero.y 
}
OMGGameEngine.prototype.loadCar = async function (spriteData) {
    this.carSpriter = new OMGSpriter(spriteData, this.canvas)
    this.carSpriter.setSheet("")
    if (this.debugBoxes) {
        this.carSpriter.drawBorder = true
    }
    this.carSpriter.x = this.offsetLeft+ this.middleTileX
    this.carSpriter.y = this.offsetTop + this.middleTileY

    this.carSpriter.w = spriteData.frameWidth // 32
    this.carSpriter.h = spriteData.frameHeight // 32
    
}



OMGGameEngine.prototype.moveNPCs = function () {

    /*for (this._mnpc of this.map.activeSprites) {
        this.moveNPC(this._mnpc)
    }*/

    if (this.onRoad) {

        if (this.carThing.x >= this.hero.x / this.map.tileSize) {
            this.onRoad = false
            this.hero.stunned = true 
            setTimeout(() => {
                delete this.hero.stunned
                this.hero.y = this.enteredRoadY
                let i = this.map.activeSprites.indexOf(this.car)
                if (i > -1) {
                    this.map.activeSprites.splice(i, 1)
                }
            }, 500)
        }
        else {
            this.carThing.x += 2
        }
    }
}

OMGGameEngine.prototype.moveNPC = function (sprite) {

}

OMGGameEngine.prototype.showDialog = function (dialog) {

    console.log(dialog)
    var dialogDiv = document.createElement("div")
    dialogDiv.className = "dialog menu"

    dialogDiv.innerHTML = dialog

    document.body.appendChild(dialogDiv)

    this.activeDialog = dialogDiv
}



OMGGameEngine.prototype.setupGamepad = function () {
    console.log("setup gp")
    this.gamepads = {}
    var gamepadHandler = (event, connecting) => {
        console.log(event, connecting)
        var gamepad = event.gamepad;

        if (connecting) {
            this.gamepads[gamepad.index] = gamepad;
            this.gamepad = gamepad
        } else {
            delete this.gamepads[gamepad.index];
        }
    }

    window.addEventListener("gamepadconnected", function(e) { gamepadHandler(e, true); }, false);
    window.addEventListener("gamepaddisconnected", function(e) { gamepadHandler(e, false); }, false);

}

