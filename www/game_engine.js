import OMGRPGMap from "./rpgmap.js"
import OMusicContext from "/apps/music/js/omusic.js"

export default function OMGGameEngine(params) {
    this.debugBoxes = true
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

    this.friction = 1
    this.maxJump = 1//25

    this.frameCount = 0
    this.physicsFrame = 0

    this.dmax = 8
    this.gravity = 0 //0.5
    this.targetTiles = []

    this.activeSprites = []
    this.fudge = 8
}

OMGGameEngine.prototype.mainLoop = function () {
    //console.log("mainloop")
    this.processKeys() 

    this.physics()

    this.render()

    //requestAnimationFrame(() => {this.mainLoop()})
}

OMGGameEngine.prototype.loadMap = function (data, mapName) {
    this.roomName = mapName

    this.map = new OMGRPGMap(data, {backCanvas: this.backgroundCanvas, charCanvas: this.canvas})
    this.map.tileSize = this.tileSize
    
    this.background.style.width = this.backgroundCanvas.width + "px"
    this.background.style.height = this.backgroundCanvas.height + "px"

    
    this.activeSprites = []

    this.npcs = data.npcs || []
    this.npcs.forEach(npc => {
        this.map.loadNPC(npc)
    })


    //todo unload previous map html elements?
    this.htmlElements = {}
    //if (this.mapData.html) {    
    //    this.mapData.html.forEach(html => this.addHTML(html))
    //}
    
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

    this.background = document.getElementById("background")
    this.backgroundCanvas = document.getElementById("backgroundCanvas")
    this.backgroundContext = this.backgroundCanvas.getContext("2d")

    this.canvas = document.getElementById("mainCanvas")
    this.canvas.style.width = window.innerWidth + "px"
    this.canvas.style.height = window.innerHeight + "px"
    this.canvas.width = this.canvas.clientWidth
    this.canvas.height = this.canvas.clientHeight
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
                this.gravity = 0.5
            }
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




OMGGameEngine.prototype.processKeys = function () {

    /*if (this.keysPressed[" "]) {
        if (this.hero.jumping < this.maxJump) {
            console.log(this.hero.jumping)
            this.hero.jumping++
        }
        else {
            this.hero.wishY = 0
        }
    }
    /*if (this.keysPressed["ArrowDown"]) {
        this.move(0, 1)
    }
    if (this.keysPressed["ArrowLeft"]) {
        this.move(-1, 0)
    }
    if (this.keysPressed["ArrowRight"]) {
        this.move(1, 0)
    }*/
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
    this.context.fillStyle = "white"
    this.context.font = "14pt serif"
    this.context.fillText(this.hero.dx, 10, 20)
    this.context.fillText(this.hero.dy, 10, 50)
    this.drawCharacters()
    if (this.debugBoxes) {
        this.drawHighlightedTiles()
    }
    this.nextFrame = false
}

OMGGameEngine.prototype.loadHero = async function (spriteData) {
    this.heroSprite = spriteData

    // todo move to top
    var o = await import("/apps/sprite/spriter.js")
    this.heroSpriter = new o.default(spriteData, this.canvas)
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

    
    var hyp = Math.sqrt(Math.pow(this.hero.dx + this.hero.wishX, 2) + Math.pow(this.hero.dy + this.hero.wishY, 2))

    /*var hyp = Math.sqrt(Math.pow(this.hero.dx, 2) + Math.pow(this.hero.dy, 2))
    //console.log(hyp)
    if (hyp > this.dmax) {
        console.log(hyp)
        this.hero.dx = Math.floor((this.hero.wishX + this.hero.dx) / hyp * this.dmax)
        this.hero.dy = Math.floor((this.hero.wishY + this.hero.dy) / hyp * this.dmax)
    }
    else {
        this.hero.dy = Math.max(-this.dmax, Math.min(this.dmax, this.hero.dy + this.hero.wishY))
        this.hero.dx = Math.max(-this.dmax, Math.min(this.dmax, this.hero.dx + this.hero.wishX))
    
    }*/
    

    if (this.gravity) { 
        this.hero.dy += this.gravity
        this.hero.dy = Math.max(-2 * this.dmax, Math.min(2 * this.dmax, this.hero.dy + this.hero.wishY))
    }
    else {
        this.hero.dy = Math.max(-this.dmax, Math.min(this.dmax, this.hero.dy + this.hero.wishY))
    }
    this.hero.dx = Math.max(-this.dmax, Math.min(this.dmax, this.hero.dx + this.hero.wishX))    
    

    this.targetTiles = []

    if (this.hero.dy || this.hero.dx) {
        this.touchingNPC = null
    }


    if (this.hero.dy && this.canProceedY()) {
        this.hero.y += this.hero.dy
    }
    else {
        this.hero.dy = 0
    }
    if (this.hero.dx && this.canProceedX()) {
        this.hero.x += this.hero.dx
    }
    
    if (!this.hero.jumping && this.hero.dx > 0 && !this.keysPressed["ArrowRight"]) {
        this.hero.dx -= this.friction
    }
    else if (!this.hero.jumping && this.hero.dx < 0 && !this.keysPressed["ArrowLeft"]) {
        this.hero.dx += this.friction
    }
    else if (!this.gravity && this.hero.dy > 0 && !this.keysPressed["ArrowDown"]) {
        this.hero.dy -= this.friction
    }
    else if (!this.gravity && this.hero.dy < 0 && !this.keysPressed["ArrowUp"]) {
        this.hero.dy += this.friction
    }

    //console.log(this.hero.dy)
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

                if (!target || target.code.charAt(0) === target.code.charAt(0).toUpperCase()) {
                    return false
                }
            }
            else {
                return false
            }
        }
    }

    for (var sprite of this.map.activeSprites) {
        for (this.imoveHitTest = 0; this.imoveHitTest <  targets.length; this.imoveHitTest++) {
            if (sprite.npc.y <= targets[this.imoveHitTest].y && sprite.npc.y + sprite.npc.height > targets[this.imoveHitTest].y && 
                (targets[this.imoveHitTest].x === (this.hero.dx < 0 ? sprite.npc.x + sprite.npc.width - 1 : sprite.npc.x))) {

                this.touchingNPC = sprite
                return false
            }

        }
    }
    return true
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
    
    if (this.hero.dy !== 0) {
        if (!this.map.tiles[x]) {
            return false
        }
        targety = this.map.tiles[x][y]
        if (targety) {
            for (this.imoveHitTest = boxStart; this.imoveHitTest <  boxCount; this.imoveHitTest++) {
                if (this.map.tiles[x + this.imoveHitTest]) {
                    var targetTile = {
                        tile: this.map.tiles[x + this.imoveHitTest][y],
                        x: x + this.imoveHitTest,
                        y: y
                    }
                    targets.push(targetTile)
                    this.targetTiles.push(targetTile)

                    if (targetTile.tile.code.charAt(0) === targetTile.tile.code.charAt(0).toUpperCase()) {
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
                            return false
                        }
                    }
                }
            }
        }
    }

    
    for (var sprite of this.map.activeSprites) {
        for (this.imoveHitTest = 0; this.imoveHitTest <  targets.length; this.imoveHitTest++) {
            if (sprite.npc.x <= targets[this.imoveHitTest].x && sprite.npc.x + sprite.npc.width > targets[this.imoveHitTest].x && 
                (targets[this.imoveHitTest].y === (this.hero.dy < 0 ? sprite.npc.y + sprite.npc.height : sprite.npc.y))) {
                    if (this.hero.jumping) {
                        this.heroSpriter.i = 3
                        this.hero.jumping = 0
                    }
                    this.touchingNPC = sprite
                    return false
            }

        }
    }
    return true
}

OMGGameEngine.prototype.actionKey = function () {
    if (this.touchingNPC) {
        this.touchingNPC.npc.animating = !this.touchingNPC.npc.animating
        
        if (this.touchingNPC.npc.musicPart) {
            let partName = this.touchingNPC.npc.musicPart
            if (this.song && this.song.parts[partName]) {
                let part = this.song.parts[partName]
                this.musicCtx.mutePart(part, !part.data.audioParams.mute)
            }
        }
    }
}

OMGGameEngine.prototype.loadMusic = async function (music) {
    if (!this.musicPlayer) {
        var o = await import("/apps/music/js/omusic.js")
        var OMusicContext = o.default
        this.musicCtx = new OMusicContext()
    }

    if (music.type === "SONG" && music.omgurl) {
        var res = await fetch(music.omgurl)
        var data = await res.json()
        
        var {player, song} = await this.musicCtx.load(data)
        this.musicPlayer = player
        this.song = song

    }

}
