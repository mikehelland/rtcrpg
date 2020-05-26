//game engine
var ge = {}

ge.stepDuration = 200
ge.aButton = " "
ge.bButton = "ArrowLeft"

ge.background = document.getElementById("background")
ge.backgroundCanvas = document.getElementById("backgroundCanvas")
ge.backgroundContext = ge.backgroundCanvas.getContext("2d")

ge.canvas = document.getElementById("mainCanvas")
ge.canvas.style.width = window.innerWidth + "px"
ge.canvas.style.height = window.innerHeight + "px"
ge.canvas.width = ge.canvas.clientWidth
ge.canvas.height = ge.canvas.clientHeight
ge.context = ge.canvas.getContext("2d")

ge.originalTitle = document.title

ge.img = {
    characters: document.getElementById("characters-spritesheet"),
    tiles: {},
    frameDiff: 60
}


// make it square
ge.tileOffset = 8
if (ge.canvas.height > ge.canvas.width) {
    ge.tileSize = ge.canvas.width / (ge.tileOffset * 2 + 1)
    ge.offsetTop = (ge.canvas.height - ge.canvas.width) / 2
    ge.offsetLeft = 0
}
else {
    ge.tileSize = ge.canvas.height / (ge.tileOffset * 2 + 1)
    ge.offsetLeft = (ge.canvas.width - ge.canvas.height) / 2
    ge.offsetTop = 0
}

ge.offsetLeft = 0
ge.offsetTop = 0

ge.tileWidth = ge.tileSize
ge.tileHeight = ge.tileSize


//our character is always in the middle
//this sets how many tiles each direction are shown
ge.middleTileX = ge.canvas.width / 2 - ge.tileWidth / 2
ge.middleTileY = ge.canvas.height / 2 - ge.tileHeight / 2


ge.hero = {
    characterI: Math.floor(Math.random() * 25),
    coins: 1000000,
    vocalSkill: 0,
    guitarSkill: 0,
    gear: [],
    facingX: 0,
    facingY: 1,
}


ge.keysPressed = {}
ge.visibleMenus = []

document.onkeydown = e => {
    if (ge.audioContext && ge.audioContext.state === 'suspended') {
        ge.audioContext.resume()
    }

    if (e.keyCode === 27) { //escape
        ge.hideMenus()
        if (ge.isShowingVideoChat) {
            ge.stopVideoCalls()
            ge.isShowingVideoChat = false
        }
        ge.canvas.focus()
    }
    if (e.target.tagName.toLowerCase() === "input") {
        return
    }
    if (ge.visibleMenus.length) {
        ge.handleKeyForMenu(e)
    }
    else {
        ge.keysPressed[e.key] = true
    }
}
document.onkeyup = e => {
    delete ge.keysPressed[e.key]
}
ge.handleKeyForMenu = e => {
    var menu = ge.visibleMenus[ge.visibleMenus.length - 1]

    if (menu === ge.dialogBox) {
        ge.advanceDialog()
        return 
    }

    if (e.key === ge.bButton) {
        menu.div.style.display = "none"
        ge.visibleMenus.splice(ge.visibleMenus.length - 1, 1)
    }
    if (e.key === ge.aButton) {
        ge.handleMenuOption(menu.currentOption)
    }

    if (e.key === "ArrowDown") {
        ge.highlightMenuOption(menu, ++menu.currentOptionI)
    }
    if (e.key === "ArrowUp") {
        ge.highlightMenuOption(menu, --menu.currentOptionI)
    }
}
ge.hideMenus = () => {
    ge.visibleMenus.forEach(menu => {
        menu.div.style.display = "none"
    })
    ge.visibleMenus = []
    ge.menus.coinCount.div.style.display = "none"
    ge.textMessageDialog.showing = false
}

ge.mainLoop = () => {
    ge.processKeys() 

    ge.render()

    requestAnimationFrame(ge.mainLoop)
}

ge.processKeys = () => {
    if (ge.visibleMenus.length) {
        return
    }
    if (ge.keysPressed[ge.aButton]) {
        ge.showPlayerMenu()
    }
    else if (ge.keysPressed["ArrowUp"]) {
        ge.hero.move(0, -1)
    }
    else if (ge.keysPressed["ArrowDown"]) {
        ge.hero.move(0, 1)
    }
    else if (ge.keysPressed["ArrowLeft"]) {
        ge.hero.move(-1, 0)
    }
    else if (ge.keysPressed["ArrowRight"]) {
        ge.hero.move(1, 0)
    }
}



ge.handleTouch = (x,y) => {

    var xDiff = x - ge.canvas.width / 2
    var yDiff = y - ge.canvas.height / 2

    ge.lastX = x + " / " + ge.canvas.height
    ge.lastY = y + " / " + ge.canvas.width

    if (!ge.isTouchingCanvas) {
        if (Math.abs(xDiff) < ge.tileWidth / 2 && Math.abs(yDiff) < ge.tileHeight / 2) {
            ge.showPlayerMenu()
            return
        }
        if (ge.visibleMenus.length > 0) {
            ge.hideMenus()
            return
        }
    }

    ge.keysPressed = {}
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        ge.keysPressed[xDiff > 0 ? "ArrowRight" : "ArrowLeft"] = true
    }
    else {
        ge.keysPressed[yDiff > 0 ? "ArrowDown" : "ArrowUp"] = true
    }

}
ge.canvas.addEventListener("touchstart", e => {
    e.preventDefault()
    if (ge.audioContext && ge.audioContext.state === 'suspended') {
        ge.audioContext.resume()
    }
    ge.handleTouch(e.touches[0].clientX, e.touches[0].clientY)
    ge.isTouchingCanvas = true
})
ge.canvas.onmousedown = e => {
    e.preventDefault()
    ge.canvas.focus()
    if (ge.audioContext && ge.audioContext.state === 'suspended') {
        ge.audioContext.resume()
    }
    ge.handleTouch(e.clientX, e.clientY) 
    ge.isTouchingCanvas = true
}

ge.canvas.onmousemove = e => {
    e.preventDefault()
    if (!ge.isTouchingCanvas) {
        return
    }
    ge.handleTouch(e.clientX, e.clientY) 
}
ge.canvas.addEventListener("touchmove", e => {
    e.preventDefault()
    if (!ge.isTouchingCanvas) {
        return
    }
    ge.handleTouch(e.touches[0].clientX, e.touches[0].clientY)
})

ge.canvas.onmouseup = e => {
    e.preventDefault()
    ge.finishTouching()
}
ge.canvas.addEventListener("touchend", e =>{
    e.preventDefault()
    ge.finishTouching()
})

ge.finishTouching = () => {
    ge.keysPressed = {}
    ge.isTouchingCanvas = false 
}


ge.blockedTiles = "Ilwdp"
ge.hero.move = (x, y) => {
    if (Date.now() - ge.hero.lastMove < ge.stepDuration) {
        return 
    }

    ge.hero.facingX = x
    ge.hero.facingY = y
    if (y === 1) ge.hero.facing = 0
    if (y === -1) ge.hero.facing = 1
    if (x === 1) ge.hero.facing = 2
    if (x === -1) ge.hero.facing = 3

    var updatePosition = () => {
        if (ge.rtc) {
            ge.rtc.updateLocalUserData(ge.hero)
        }
    }

    // check to see if you can move to that position
    var target = ge.map[ge.hero.y + y]
    if (!target) {
        ge.finishTouching()
        ge.leaveMap()
        return updatePosition()
    }
    target = target[ge.hero.x + x]
    if (!target) {
        ge.finishTouching()
        ge.leaveMap()
        return updatePosition()
    }
    if (target === "p") {
        ge.finishTouching()
        ge.videoCallGroup((ge.hero.x + x) + "x" + (ge.hero.y + y))
        return updatePosition()
    }
    if (ge.blockedTiles.indexOf(target) > -1) {
        return updatePosition()
    }
    for (var i = 0; i < ge.npcs.length; i++) {
        if (ge.npcs[i].x === ge.hero.x + x && ge.npcs[i].y === ge.hero.y + y) {
            // we're using the mouse or touch
            if (ge.isTouchingCanvas) {
                ge.finishTouching()
                ge.talk()
            }
            return updatePosition()
        }
    }
    for (i in ge.remoteUsers) {
        if (!ge.remoteUsers[i].disconnected &&
                ge.remoteUsers[i].data &&
                ge.remoteUsers[i].data.x === ge.hero.x + x && 
                ge.remoteUsers[i].data.y === ge.hero.y + y) {
            if (ge.isTouchingCanvas) {
                ge.finishTouching()
                ge.talk()
            }
            return updatePosition()
        }
    }

    ge.hero.tile = target
    ge.hero.x += x
    ge.hero.y += y
    
    ge.hero.lastMove = Date.now()
    
    updatePosition()
}


ge.showPlayerMenu = () => {
    ge.showMenu(ge.menus.player)
}
ge.showMenu = (menu) => {
    menu.div.innerHTML = ""
    menu.currentOption = null
    menu.currentOptionI = 0
    var maxLength = 0
    var hasPrices = false
    menu.options.forEach((option) => {
        option.div = document.createElement("div")
        option.div.className = "menu-option"
        option.div.innerHTML = "&nbsp;&nbsp;" + option.caption//&#8594;
        menu.div.appendChild(option.div)

        option.div.onclick = e => ge.handleMenuOption(option)
    
        if (option.caption.length > maxLength) maxLength = option.caption.length
        if (option.price) hasPrices = true
    })
    if (hasPrices) {
        console.log(maxLength)
        menu.options.forEach((option) => {
            option.div.innerHTML = option.div.innerHTML.padEnd(maxLength + 4, "&nbsp;") + option.price
        })    
    }
    ge.visibleMenus.push(menu)
    menu.div.style.display = "block"
    ge.highlightMenuOption(menu, 0)
}
ge.highlightMenuOption = (menu, optionI) => {
    if (menu.currentOption) {
        menu.currentOption.div.innerHTML = "&nbsp;" + menu.currentOption.div.innerHTML.slice(1)
    }
    if (optionI < 0) {
        optionI = menu.options.length - 1
    }
    else {
        optionI = optionI % menu.options.length
    }
    menu.currentOptionI = optionI
    menu.currentOption = menu.options[optionI]
    menu.currentOption.div.innerHTML = menu.currentOption.div.innerHTML.replace("&nbsp;", "&#9658;")
}

ge.handleBButton = () => {
    if (ge.menus.player.showing) {
        ge.menus.player.div.style.display = "none"
        ge.menus.player.showing = false
        ge.topMenu = null
    }
}
ge.handleMenuOption = option => {

    if (option.priceList) {
        ge.showPriceList(option.priceList)
        return
    }
    
    var action = option.action
    var result
    if (action.function) {
        result = ge[action.function](action)
    }
    else if (typeof action === "function") { //get rid of this
        result = action()
    }
    else if (typeof action === "string" && 
            typeof ge[action] === "function") { 
        result = ge[action](option)
    }

    if (typeof result === "string") {
        ge.showDialog(result.split("\n"))
    }

}

ge.frameCount = 0
ge.stepPercent = 1
ge.render = () => {
    if (ge.heroVolumeMonitor) {
        ge.heroVolumeMonitor.updateMeter()
        ge.hero.volume = ge.heroVolumeMonitor.volume
    }

    if (ge.frameCount === 10) {
        ge.animationFrame = !ge.animationFrame
        ge.frameCount = 0
    }
    else {
        ge.frameCount++
    }

    if (ge.frameCount > 0 && Date.now() - ge.hero.lastMove > ge.stepDuration) {
        return
    }

    if (!ge.drawnBackground) {
        ge.drawScene()
        ge.drawnBackground = true
    }

    ge.stepPercent = 0
    if (Date.now() - ge.hero.lastMove < ge.stepDuration) {
        ge.stepPercent = 1 - (Date.now() - ge.hero.lastMove) / ge.stepDuration
        ge.background.style.left = ge.tileWidth * (ge.hero.x - ge.hero.facingX * ge.stepPercent) * -1 + ge.middleTileX + "px"
        ge.background.style.top = ge.tileHeight * (ge.hero.y - ge.hero.facingY * ge.stepPercent) * -1 + ge.middleTileY  + "px"
    }
    else {
        ge.background.style.left = ge.tileWidth * ge.hero.x * -1 + ge.middleTileX + "px"
        ge.background.style.top = ge.tileHeight * ge.hero.y * -1 + ge.middleTileY  + "px"
    }


    ge.canvas.width = ge.canvas.width
    ge.drawCharacters()
}
ge.drawScene = () => {

    ge.backgroundContext.lineWidth = 4
    var colorI = 0
    ge.portalColors = ["red", "blue", "green", "yellow", "purple"]
    ge.portals = {}
    for (var y = 0; y < ge.mapData.height; y++) {
        for (var x = 0; x < ge.mapData.width; x++) {
            if (ge.map[y] && ge.map[y][x] && ge.img.tiles[ge.map[y][x]]) {
                ge.backgroundContext.drawImage(ge.img.tiles[ge.map[y][x]],
                    x * ge.tileWidth - 0.25, 
                    y * ge.tileHeight - 0.25,
                    ge.tileWidth + 0.5, ge.tileHeight + 0.5)

                if (ge.map[y][x] === "p") {
                    var portal = undefined
                    if (ge.portals[x + "x" + (y - 1)]) {
                        portal = ge.portals[x + "x" + (y - 1)]
                    }
                    else if (ge.portals[(x - 1) + "x" + y]) {
                        portal = ge.portals[(x - 1) + "x" + y]
                    }
                    ge.portals[x + "x" + y] = portal || {name: x + "x" + y, color: ge.portalColors[colorI++%ge.portalColors.length]}
                    ge.backgroundContext.strokeStyle = ge.portals[x + "x" + y].color
                    ge.backgroundContext.strokeRect(
                        x * ge.tileWidth - 0.25, 
                        y * ge.tileHeight - 0.25,
                        ge.tileWidth + 0.5, ge.tileHeight + 0.5)
                }
    
            }
        }
    }
}

ge.drawCharacters = () => {
    
    ge.context.lineWidth = 2

    // the character
    ge.context.drawImage(ge.img.characters,
        ge.hero.spritesheetCoords.x + (ge.animationFrame ? ge.img.frameDiff : 0), 
        ge.hero.spritesheetCoords.y + 50 * ge.hero.facing, 36, 36,
        ge.offsetLeft+ ge.middleTileX, 
        ge.offsetTop + ge.middleTileY - (ge.heroVolumeMonitor ? ge.heroVolumeMonitor.volume : 0) * ge.tileHeight,
        ge.tileWidth, ge.tileHeight)    

    // the characters label
    if (ge.online) {
        ge.context.fillStyle = "black"
        ge.context.fillRect(
            ge.offsetLeft + ge.middleTileX, 
            ge.offsetTop + ge.middleTileY + ge.tileHeight,
            ge.tileWidth, 14)

        if (ge.hero.chatPortal) {
            ge.context.strokeStyle = ge.portals[ge.hero.chatPortal].color
            ge.context.strokeRect(
                ge.offsetLeft + ge.middleTileX, 
                ge.offsetTop + ge.middleTileY + ge.tileHeight,
                ge.tileWidth, 14)
            }
    
        ge.context.fillStyle = "white"
        ge.context.fillText(ge.userName,
            3 + ge.offsetLeft + ge.middleTileX, 
            12 + ge.offsetTop + ge.middleTileY + ge.tileHeight)    

        
    }

    for (var i = 0; i < ge.npcs.length; i++) {
        if (Math.abs(ge.npcs[i].x - ge.hero.x) <= ge.tileOffset * 2 &&
                Math.abs(ge.npcs[i].y - ge.hero.y) <= ge.tileOffset * 2) {
            ge.context.drawImage(ge.img.characters,
                ge.npcs[i].spritesheetCoords.x + (ge.animationFrame ? ge.img.frameDiff : 0), 
                ge.npcs[i].spritesheetCoords.y + 50 * (ge.npcs[i].facing||0), 36, 36,
                ge.offsetLeft + (ge.npcs[i].x - ge.hero.x + ge.hero.facingX * ge.stepPercent) * ge.tileWidth + ge.middleTileX, 
                ge.offsetTop + (ge.npcs[i].y - ge.hero.y + ge.hero.facingY * ge.stepPercent) * ge.tileHeight + ge.middleTileY,
                ge.tileWidth, ge.tileHeight)        
        }
    }

    
    for (var userName in ge.remoteUsers) {
        var user = ge.remoteUsers[userName]
        if (!user.disconnected && user.data &&
                Math.abs(user.data.x - ge.hero.x) <= ge.tileOffset * 2 &&
                Math.abs(user.data.y - ge.hero.y) <= ge.tileOffset * 2) {
            ge.context.drawImage(ge.img.characters,
                user.data.spritesheetCoords.x + (ge.animationFrame ? ge.img.frameDiff : 0), 
                user.data.spritesheetCoords.y + 50 * (user.data.facing||0), 36, 36,
                ge.offsetLeft + (user.data.x - ge.hero.x + ge.hero.facingX * ge.stepPercent) * ge.tileWidth + ge.middleTileX, 
                ge.offsetTop + (user.data.y - ge.hero.y + ge.hero.facingY * ge.stepPercent) * ge.tileHeight + ge.middleTileY -
                    (user.data.volume || 0) * ge.tileHeight,
                ge.tileWidth, ge.tileHeight)        

            ge.context.fillStyle = "black"
            ge.context.fillRect(
                ge.offsetLeft + (user.data.x - ge.hero.x + ge.hero.facingX * ge.stepPercent) * ge.tileWidth + ge.middleTileX, 
                ge.offsetTop + (user.data.y - ge.hero.y + 1 + ge.hero.facingY * ge.stepPercent) * ge.tileHeight + ge.middleTileY,
                ge.tileWidth, 14)
    
            ge.context.fillStyle = "white"
            ge.context.fillText(user.name,
                3 + ge.offsetLeft + (user.data.x - ge.hero.x + ge.hero.facingX * ge.stepPercent) * ge.tileWidth + ge.middleTileX, 
                12 + ge.offsetTop + (user.data.y - ge.hero.y + 1 + ge.hero.facingY * ge.stepPercent) * ge.tileHeight + ge.middleTileY)

            if (user.data.chatPortal) {
                ge.context.strokeStyle = ge.portals[user.data.chatPortal].color
                ge.context.strokeRect(
                    ge.offsetLeft + (user.data.x - ge.hero.x + ge.hero.facingX * ge.stepPercent) * ge.tileWidth + ge.middleTileX, 
                    ge.offsetTop + (user.data.y - ge.hero.y + 1 + ge.hero.facingY * ge.stepPercent) * ge.tileHeight + ge.middleTileY,
                    ge.tileWidth, 14)
                }
            
        
        }
    }
}

ge.talk = () => {
    var character = ge.getCharacter()
    if (!character) {
        ge.showDialog(["There is no one to talk to."])
        return
    }
    if (!character.id) {
        //this is an npc
        character.facing = ge.hero.facing % 2 === 0 ? ge.hero.facing + 1 : ge.hero.facing - 1
        ge.showDialog(character.dialog)
        return
    }
    
    ge.showDialog([{question: "Talk to " + character.name + " how?", options: [
        {caption: "TEXT", action: {"function": "textUser", name: character.name}},
        //{caption: "TEXT", action: {"function": "voiceCallUser", userName}},
        {caption: "VIDEO", action: {"function": "videoCallUser", name: character.name}}
    ]}])
}

ge.textUser = (options) => {
    console.log("texting user", options.name)
    ge.hideMenus()
    ge.showTextMessageDialog(options.name)
}

ge.videoCallUser = (options) => {
    console.log("calling user", options.name)
    ge.hideMenus()
    ge.rtc.callUser(options.name, (user) => {
        ge.showVideoCallDialog(user)
    })
}

ge.videoCallGroup = (tile) => {
    ge.hero.chatPortal = ge.portals[tile].name
    ge.rtc.acceptAllCalls = true
    ge.rtc.getUserMedia(video => {
        video.className = "menu"
        video.style.display = "block"
        video.style.padding = "2px"
        video.style.width = "25%"
        document.body.appendChild(video)
        video.style.bottom = video.clientHeight + "px"
        ge.isShowingVideoChat = true
        

        for (var user in ge.rtc.remoteUsers) {
            console.log("callgroup2")
    
            if (ge.rtc.remoteUsers[user].data.chatPortal === ge.hero.chatPortal &&
                !ge.rtc.remoteUsers[user].disconnected) {
                    ge.videoCallUser({name: user})
                }
        }
    
    })

}


ge.getCharacter = () => {
    for (var i = 0; i < ge.npcs.length; i++) {
        if (ge.npcs[i].x === ge.hero.x + ge.hero.facingX && 
                ge.npcs[i].y === ge.hero.y + ge.hero.facingY) {
            return ge.npcs[i]
        }
    }

    for (i in ge.remoteUsers) {
        var user = ge.remoteUsers[i]
        if (user.data.x === ge.hero.x + ge.hero.facingX && 
                user.data.y === ge.hero.y + ge.hero.facingY) {
            return user
        }
    }

    // maybe theyre behind a desk
    if (ge.map[ge.hero.y + ge.hero.facingY] && 
            ge.map[ge.hero.y + ge.hero.facingY][ge.hero.x + ge.hero.facingX] === "d") {
        for (var i = 0; i < ge.npcs.length; i++) {
            if (ge.npcs[i].x === ge.hero.x + ge.hero.facingX * 2 && 
                    ge.npcs[i].y === ge.hero.y + ge.hero.facingY * 2) {
                return ge.npcs[i]
            }
        }            
    }
}

ge.buyGear = (item) => {
    if (ge.hero.coins < item.price) {
        return "You ain't got enough coins, man!"
    }
    ge.spendCoins(item.price)
    ge.hero.gear.push({caption: item.caption})
    return "Here you go! Enjoy."
}

ge.spendCoins = (amount) => {
    ge.hero.coins -= amount
    ge.menus.coinCount.div.innerHTML = "$ " + ge.hero.coins
}

ge.buyVocalLesson = () => {
    if (ge.hero.coins >= (ge.hero.vocalSkill + 1) * 10) {
        ge.spendCoins((ge.hero.vocalSkill + 1) * 10)
        ge.hero.vocalSkill++
        if (ge.hero.vocalSkill === 1) {
            ge.menus.player.options.push({caption:"SING", action: ge.sing})
        }
        return "One vocal lesson, comin' right up \nYour vocal skill increased!"
    }
    else {
        return "You don't have enough money.\nDid you waste it?!"
    }    
}
ge.buyGuitarLesson = () => {
    // you need an acoustic guitar for the first lesson
    if (ge.hero.guitarSkill === 0) {
        if (!ge.characterHasGear(ge.hero, "Acoustic Guitar")) {
            return "You don't even have a guitar!"
        }
    }
    else if (ge.hero.guitarSkill === 1) {
        if (!ge.characterHasGear(ge.hero, "Acoustic Guitar")) {
            return "You don't even have a guitar!"
        }
        if (!ge.characterHasGear(ge.hero, "Guitar Pick")) {
            return "You'll need a Guitar Pick for the next lesson.'"
        }
    }
    else if (ge.hero.guitarSkill === 2) {
        if (!ge.characterHasGear(ge.hero, "Electric Guitar")) {
            return "The next lesson requires an Electric Guitar"
        }
        if (!ge.characterHasGear(ge.hero, "Guitar Pick")) {
            return "What happened to your Guitar Pick?"
        }
    }
    else if (ge.hero.guitarSkill === 3) {
        if (!ge.characterHasGear(ge.hero, "Electric Guitar")) {
            return "The next lesson requires an Electric Guitar"
        }
        if (!ge.characterHasGear(ge.hero, "Guitar Pick")) {
            return "What happened to your Guitar Pick?"
        }
        if (!ge.characterHasGear(ge.hero, "Guitar Amp")) {
            return "Come back when you get your own Guitar Amp!"
        }
    }

    // a guitar pick for the second
    if (ge.hero.coins >= (ge.hero.guitarSkill + 1) * 10) {
        ge.hero.coins -= (ge.hero.guitarSkill + 1) * 10
        ge.hero.guitarSkill++
        ge.menus.player.options.push({caption:"PLAY", action: ge.play})
        return "One guitar lesson, comin' right up\nYour guitar skill increased!"
    }
    else {
        return "You don't have enough money. Did you waste it?!"
    }    
}
ge.enterTalentShow = (params) => {
    if (params.price > ge.hero.coins) {
        return "You don't have enough money!"
    }
}

ge.sing = () => {
    var singing = ["You sing...", "... and sing ...", "... and ..."]
    if (ge.hero.tile === "s") {
        var coins = Math.ceil(Math.random() * 5 * ge.hero.vocalSkill)
        singing.push("Somebody tipped you " + coins + " coins!")
        ge.hero.coins += coins
    }
    else if (Math.random() < ge.hero.vocalSkill / 10) {
        singing.push("Somebody tipped you 1 coin!")
        ge.hero.coins += 1
    }
    else {
        singing.push("Nobody cared")
    }
    ge.showDialog(singing)
}

ge.play = () => {
    var singing = ["You play...", "... and play ...", "... and ..."]
    if (Math.random() < 0.1) {
        singing.push("Somebody tipped you 1 coin!")
        ge.hero.coins += 1
    }
    else {
        singing.push("Nobody cared")
    }
    ge.showDialog(singing)
}


ge.dialogBox = {
    div: document.getElementById("dialogBox"),
    bButton: () => {

    },
    aButton: () => {

    }
}
ge.showDialog = (dialog) => {
    ge.dialogBox.currentLine = -1
    ge.dialogBox.div.style.display = "block"
    ge.visibleMenus.push(ge.dialogBox)
    ge.dialogBox.dialog = dialog
    ge.advanceDialog()

    ge.dialogBox.div.onclick = () => ge.advanceDialog()
}
ge.advanceDialog = () => {
    if (!ge.dialogBox.dialog) {
        ge.dialogBox.dialog = ["..."]
    }
    ge.dialogBox.currentLine++
    if (ge.dialogBox.currentLine >= ge.dialogBox.dialog.length) {
        ge.hideMenus()
    }
    else {
        var currentLine = ge.dialogBox.dialog[ge.dialogBox.currentLine]
        // if it's a string, show it, otherwise, it's a question
        if (typeof currentLine === "string") {
            ge.dialogBox.div.innerHTML = currentLine
            if (ge.dialogBox.dialog.length > ge.dialogBox.currentLine + 1) {
                ge.dialogBox.div.innerHTML += "<br>&nbsp;&#x25BC"
            }
        }
        else if (currentLine.question) {
            ge.dialogBox.div.innerHTML = currentLine.question
            if (currentLine.showCoins) {
                ge.showCoinCount()
            }
            if (currentLine.options) {
                ge.showResponseOptions(currentLine.options)
            }
            else if (currentLine.priceList) {
                ge.showPriceList(currentLine.priceList)
            }
        }
        else if (currentLine.salesPitch) {
            ge.dialogBox.div.innerHTML = currentLine.salesPitch
            ge.showPriceList(currentLine.options)
        }
    }
}
ge.showResponseOptions = (answers) => {
    ge.menus.response.options = answers
    ge.showMenu(ge.menus.response)
}
ge.showPriceList = (items) => {
    ge.showCoinCount()
    ge.menus.priceList.options = items
    ge.showMenu(ge.menus.priceList)
}
ge.showCoinCount = () => {
    ge.menus.coinCount.div.innerHTML = "$ " + ge.hero.coins
    ge.menus.coinCount.div.style.display = "block"
}
    
ge.textMessageDialog = {
    div: document.getElementById("textMessageDialog"),
    input: document.getElementById("textMessageInput"),
    output: document.getElementById("textMessageOutput"),
    bButton: () => {

    },
    aButton: () => {

    }
}

ge.showTextMessageDialog = (remoteUserName) => {
    ge.textMessageDialog.showing = true
    ge.textMessageDialog.remoteUserName = remoteUserName
    ge.textMessageDialog.div.style.display = "flex"
    ge.visibleMenus.push(ge.textMessageDialog)

    ge.textMessageDialog.output.innerHTML = "Chatting with " + remoteUserName
    ge.textMessageDialog.input.focus()
    //ge.textMessageDialog.input.value = ""
    ge.textMessageDialog.input.onkeypress = (e) => {
        if (e.keyCode === 13) {
            var message = ge.textMessageDialog.input.value
            ge.rtc.sendTextMessage(remoteUserName, message)
            ge.textMessageDialog.output.innerHTML += "<br><span class='text-message-from-me'>" + ge.userName + ": " + message + "</span>"
            ge.textMessageDialog.input.value = ""
            ge.textMessageDialog.output.scrollTop = ge.textMessageDialog.output.scrollHeight;
        }
    }
}
ge.showTextMessage = (data) => {
    if (!ge.textMessageDialog.showing) {
        ge.showTextMessageDialog(data.from)
    }

    ge.textMessageDialog.output.innerHTML += "<br>" + data.from + ": " + data.message
    ge.textMessageDialog.output.scrollTop = ge.textMessageDialog.output.scrollHeight;
}

ge.videoCallDialog = {
    div: document.getElementById("textMessageDialog"),
}


ge.remoteVideos = []
ge.showVideoCallDialog = (user) => {
    //ge.hideMenus()
    
    ge.rtc.localVideo.className = "menu"
    ge.rtc.localVideo.style.padding = "2px"
    ge.rtc.localVideo.style.display = "block"
    ge.rtc.localVideo.style.width = "25%"
    ge.rtc.localVideo.style.left = "0"
    document.body.appendChild(ge.rtc.localVideo)
    ge.rtc.localVideo.style.bottom = ge.rtc.localVideo.clientHeight + "px"
    
    var i = ge.remoteVideos.indexOf(user)
    if (i === -1) {
        ge.remoteVideos.push(user)
        i = ge.remoteVideos.length - 1
    }
    user.video.className = "menu"
    user.video.style.display = "block"
    user.video.style.padding = "2px"
    user.video.style.left = i * 25 + "%"
    user.video.style.width = "25%"
    user.video.style.bottom = "0px"
    document.body.appendChild(user.video)

    ge.isShowingVideoChat = true
}

ge.stopVideoCalls = () => {
    document.body.removeChild(ge.rtc.localVideo)
    ge.rtc.stopMedia()
    ge.remoteVideos.forEach(user => {
        document.body.removeChild(user.video)
        ge.rtc.closeConnection(user)    
    })
    ge.remoteVideos = []
}



ge.characterHasGear = (character, gear) => {
    for (var i = 0; i < character.gear.length; i++) {
        if (character.gear[i].name === gear) { 
            return true
        }
    }
    return false
}

ge.img.getSpriteSheetCoords = (i) => {
    var row = Math.floor(i / 5)
    var col = i % 5
    return {x: 18 + col * 120, y: 8 + row * 200}
}

ge.showGear = () => {
    ge.showCoinCount()
    ge.menus.gearList.options = ge.hero.gear
    ge.showMenu(ge.menus.gearList)
}

// this should be next to last, so all the functions are defined
ge.menus = {
    "player" : {
        div: document.getElementById("playerMenu"),
        options: [
            {caption:"TALK", action: "talk"},
            {caption:"GEAR", action: "showGear"}
        ]
    },
    "response" : {
        div: document.getElementById("responseOptions")
    },
    "priceList" : {
        div: document.getElementById("priceList")
    },
    "coinCount" : {
        div: document.getElementById("coinCount")
    },
    "gearList" : {
        div: document.getElementById("gearList")
    }
}


ge.teachersDialog = [
    "Hi! I'm the Music Teacher!",
    {salesPitch: "Do you want a music lesson?", options:
        [
            {caption: "VOCAL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;10", action: ge.buyVocalLesson},
            {caption: "GUITAR&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;10", action: ge.buyGuitarLesson},
        ]
    }
]

for (var i = 0; i < 25; i++) {
//    ge.npcs.push({x: 56 + i, y:15, spritesheetCoords: ge.img.getSpriteSheetCoords(i)})
}

ge.hero.spritesheetCoords = ge.img.getSpriteSheetCoords(ge.hero.characterI)


ge.startTheShow = (params, sendToRoom) => {
    if (params.performer === ge.userName) {
        return
    }

    var getYouTubeID = url => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    ge.htmlElements[params.iframe].div.style.display = "block"
    //todo hang up phone calls?
    var videoId = getYouTubeID(params.src)
    var url = videoId ? "https://www.youtube.com/embed/" + videoId : params.src

    if (ge.htmlElements[params.iframe]) {
        try {
            ge.htmlElements[params.iframe].prevSrc = ge.htmlElements[params.iframe].child.src
            ge.htmlElements[params.iframe].child.src = url
        } catch (e) {console.log(e)}
    }

    if (sendToRoom) {
        params.action = "startTheShow"
        ge.rtc.sendCommandToRoom(params)

        ge.rtc.updateRoomData(params)
    }
    ge.turnOnVisualApplause()
}

ge.endTheShow = (params, sendToRoom) => {
    try {
        if (params.src === "") {
            ge.htmlElements[params.iframe].div.style.display = "none"
        }
        else {
            ge.htmlElements[params.iframe].child.src = params.src || ge.htmlElements[params.iframe].prevSrc
        }
    } catch (e) {console.log(e)}
    if (sendToRoom) {
        params.action = "endTheShow"
        ge.rtc.sendCommandToRoom(params)

        ge.rtc.updateRoomData(params)
    }
    ge.turnOffVisualApplause()
}


ge.chatServer = ""
ge.startRTC = (userName) => {
    try { // real time communication
        ge.rtc = new OMGRealTime(ge.chatServer)
        ge.remoteUsers = ge.rtc.remoteUsers
        ge.rtc.acceptAllCalls = true
    }
    catch (e) {
        console.log("did not create rtc", e)
        ge.remoteUsers = {}
    }
    
    if (ge.rtc) {
        ge.online = true
        ge.userName = userName || ge.rtc.userName

        ge.rtc.join(ge.roomName, ge.userName)
        ge.rtc.onjoined = () => {
            ge.rtc.updateLocalUserData(ge.hero)
            ge.rtc.onnewuser()
        }
        ge.rtc.onincomingcall = (userName, callback) => {
            ge.showDialog([
                {question: "Accept a call from " + userName, options: [
                    {caption: "Yes", action: () => {
                        ge.hideMenus()
                        if (callback) callback()
                    }},
                    {caption: "Nope", action: "hideMenus"}
                ]}
            ])            
        }
        ge.rtc.onconnection = (user) => {
            ge.showVideoCallDialog(user)
        }
        ge.rtc.ontextmessage = (data) => {
            console.log("tm", data)
            ge.showTextMessage(data)
        }
        ge.rtc.onuservideodisconnected = (name, user) => {
            console.log("disconnecnting user video")
            if (user.disconnected && user.peerConnection.connectionState !== "connected") {
                user.video.style.display = "none"
                if (ge.remoteVideos.indexOf(user) > -1) {
                    ge.remoteVideos.splice(ge.remoteVideos.indexOf(user), 1)
                }
            }
        }
        ge.rtc.onuserreconnected = (name, user) => {
            user.video.style.display = "block"
        }
        
        ge.rtc.oncommand = message => {
            if (message.command.action === "startTheShow") {
                ge.startTheShow(message.command)
            }
            if (message.command.action === "endTheShow") {
                ge.endTheShow(message.command)
            }
        }

        ge.serverStatus = document.getElementById("server-status")
        ge.rtc.ondisconnect = () => {
            ge.serverStatus.innerHTML = "? users"
        }
        ge.rtc.onnewuser = user => {
            var count = 1
            for (var user in ge.rtc.remoteUsers) {
                if (!ge.rtc.remoteUsers[user].disconnected) {
                    count++
                }
            }
            ge.serverStatus.innerHTML = document.title = count + "@" + ge.originalTitle
        }
        ge.rtc.onuserdisconnected = ge.rtc.onnewuser
        ge.rtc.onuserreconnected = ge.rtc.onnewuser
        ge.rtc.onuserleft = ge.rtc.onnewuser
    }

}

ge.addHTML = html => {
    var div = document.createElement("div")
    div.innerHTML = html.innerHTML
    div.style.position = "absolute"
    div.style.left = html.x * ge.tileWidth + "px"
    div.style.top = html.y * ge.tileHeight + "px"
    div.style.width = html.width * ge.tileWidth + "px"
    div.style.height = html.height * ge.tileHeight + "px"
    div.style.zIndex = 5
    try {
        div.children[0].style.height = "100%"
        div.children[0].style.width = "100%"    
    }
    catch (e) {}
    ge.background.appendChild(div)
    ge.htmlElements[html.name] = {div: div, html: html, child: div.children[0]}
}

ge.turnOnVisualApplause = () => {
    // get the audio started
    ge.audioContext = new AudioContext()
    ge.heroAudioMeterDiv = document.createElement("div")
    ge.heroAudioMeterDiv.className = "hero-audio-meter"
    document.body.appendChild(ge.heroAudioMeterDiv)
    navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
        ge.heroAudioSource = ge.audioContext.createMediaStreamSource(stream)
        ge.heroVolumeMonitor = new VolumeMonitor(ge.heroAudioSource, ge.heroAudioMeterDiv, ge.audioContext)
    })
    var reset = false
    ge.handleApplauseMeter = setInterval(() => {
        if (ge.hero.volume > 0.2 || reset) {
            ge.rtc.updateLocalUserData(ge.hero)
            reset = ge.hero.volume > 0.2
        }
    }, 500)
}

ge.turnOffVisualApplause = () => {
    ge.heroVolumeMonitor = null // disconnect?
    clearInterval(ge.handleApplauseMeter)
}

// if we don't have a user name, ask
ge.startup = () => {
    var nameMenu = document.getElementById("enter-your-name")
    nameMenu.style.display = "block"
    var nameInput = document.getElementById("enter-your-name-input")
    nameInput.focus()
    var joinButton = document.getElementById("enter-your-name-join")
    joinButton.onclick = e => {
        if (nameInput.value.length > 0) {
            ge.startRTC(nameInput.value)
            //ge.rtc.acceptAllCalls = document.getElementById("auto-accept").checked
            //ge.rtc.autoConnectAll = document.getElementById("auto-connect").checked
            nameMenu.style.display = "none"

            if (ge.onstart) {
                ge.onstart()
            }
        }
    }
    document.getElementById("enter-your-name-join-anon").onclick = e => {
        ge.startRTC()
        nameMenu.style.display = "none"    
    }
    document.getElementById("enter-your-name-offline").onclick = e => {
        nameMenu.style.display = "none"    
        ge.userName = nameInput.value
    }
    nameInput.onkeypress = e => {
        if (e.charCode === 13) {
            joinButton.onclick()
        }
    }
}
ge.startup()

ge.leaveMap = () => {
    if (ge.mapData.parentMap) {
        fetch(ge.mapData.parentMap.url).then(data => data.json()).then(json => {
            ge.loadMap(json, ge.mapData.parentMap.url)
        })
    }
}

//finally, get a map and go
ge.loadMap = (data, mapName) => {
    ge.roomName = mapName
    Object.keys(data.tileSet.tileCodes).forEach(key => {
        var img = document.createElement("img")
        //img.src = "img/" + data.tileSet.tileCodes[key]
        img.src = (data.tileSet.prefix + "") + data.tileSet.tileCodes[key] + (data.tileSet.postfix || "")
        ge.img.tiles[key] = img
        img.onload = ()=>{ge.drawnBackground = false}
    })

    ge.backgroundCanvas.width = data.width * ge.tileWidth
    ge.backgroundCanvas.height = data.height * ge.tileHeight
    ge.background.style.width = ge.backgroundCanvas.width + "px"
    ge.background.style.height = ge.backgroundCanvas.height + "px"
    
    ge.mapData = data
    ge.map = data.mapLines;
    ge.npcs = data.npcs || []
    ge.npcs.forEach(npc => npc.spritesheetCoords = ge.img.getSpriteSheetCoords(npc.characterI))
    ge.hero.x = data.startX
    ge.hero.y = data.startY
    ge.hero.facing = 0
    
    ge.htmlElements = {}
    if (ge.mapData.html) {    
        ge.mapData.html.forEach(html => ge.addHTML(html))
    }
    
    ge.mainLoop()
}