//game engine
var ge = {}
ge.userName = window.location.search.slice(1) || (Math.round(Math.random() * 100000) + "")

try { // real time communication
    ge.rtc = new OMGRealTime(ge.userName)
    ge.remoteUsers = ge.rtc.remoteUsers
}
catch (e) {
    console.log("did not create rtc", e)
    ge.remoteUsers = {}
}


ge.aButton = " "
ge.bButton = "ArrowLeft"

ge.backgroundCanvas = document.getElementById("backgroundCanvas")
ge.backgroundContext = ge.backgroundCanvas.getContext("2d")

ge.canvas = document.getElementById("mainCanvas")
ge.canvas.style.width = window.innerWidth + "px"
ge.canvas.style.height = window.innerHeight + "px"
ge.canvas.width = ge.canvas.clientWidth
ge.canvas.height = ge.canvas.clientHeight
ge.context = ge.canvas.getContext("2d")

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
    gear: []
}

ge.keysPressed = {}
ge.visibleMenus = []

document.onkeydown = e => {
    if (e.keyCode === 27) {
        ge.hideMenus()
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
        var actionResult = ge.handleAButton(menu)
        if (typeof actionResult === "string") {
            ge.showDialog(actionResult.split("\n"))
        }
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

ge.blockedTiles = "Ilwdp"
ge.hero.move = (x, y) => {
    if (Date.now() - ge.hero.lastMove < 175) {
        return 
    }

    ge.hero.facingX = x
    ge.hero.facingY = y
    if (y === 1) ge.hero.facing = 0
    if (y === -1) ge.hero.facing = 1
    if (x === 1) ge.hero.facing = 2
    if (x === -1) ge.hero.facing = 3

    // check to see if you can move to that position
    var target = ge.map[ge.hero.y + y]
    if (!target) return
    target = target[ge.hero.x + x]
    if (!target || ge.blockedTiles.indexOf(target) > -1) {
        return 
    }
    for (var i = 0; i < ge.npcs.length; i++) {
        if (ge.npcs[i].x === ge.hero.x + x && ge.npcs[i].y === ge.hero.y + y) {
            return
        }
    }
    for (i in ge.remoteUsers) {
        if (ge.remoteUsers[i].data &&
            ge.remoteUsers[i].data.x === ge.hero.x + x && 
            ge.remoteUsers[i].data.y === ge.hero.y + y) {
            return
        }
    }

    ge.hero.tile = target
    ge.hero.x += x
    ge.hero.y += y

    ge.hero.lastMove = Date.now()

    if (ge.rtc) {
        ge.rtc.updateLocalUserData(ge.hero)
    }
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
        option.div.innerHTML = "&nbsp;&nbsp;" + option.caption//&#8594;
        menu.div.appendChild(option.div)
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
ge.handleAButton = (menu) => {
    if (typeof menu.currentOption.action === "function") { //get rid of this
        return menu.currentOption.action()
    }
    if (typeof menu.currentOption.action === "string" && 
            typeof ge[menu.currentOption.action] === "function") { 
        return ge[menu.currentOption.action](menu.currentOption)
    }
    if (menu.currentOption.action) {
        return ge.handleAction(menu.currentOption.action)
    }
    if (menu.currentOption.priceList) {
        ge.showPriceList(menu.currentOption.priceList)
    }
}
ge.handleBButton = () => {
    if (ge.menus.player.showing) {
        ge.menus.player.div.style.display = "none"
        ge.menus.player.showing = false
        ge.topMenu = null
    }
}
ge.handleAction = (action) => {
    if (ge[action]) {
        ge
    }
    if (action.function) {
        return ge[action.function](action)
    }
}

ge.frameCount = 0
ge.render = () => {
    if (ge.frameCount === 10) {
        ge.animationFrame = !ge.animationFrame
        ge.frameCount = 0
    }
    else {
        ge.frameCount++
    }

    if (!ge.drawnBackground) {
        ge.drawScene()
        ge.drawnBackground = true
    }
    ge.backgroundCanvas.style.left = ge.hero.x * ge.tileWidth * -1 + ge.middleTileX + "px"
    ge.backgroundCanvas.style.top = ge.hero.y * ge.tileHeight * -1 + ge.middleTileY  + "px"

    ge.canvas.width = ge.canvas.width
    ge.drawCharacters()
}
ge.drawScene = () => {


    for (var y = 0; y < ge.map.length; y++) {
        for (var x = 0; x < ge.map[y].length; x++) {
            if (ge.map[y][x] && ge.img.tiles[ge.map[y][x]]) {
                ge.backgroundContext.drawImage(ge.img.tiles[ge.map[y][x]],
                    x * ge.tileWidth - 0.25, 
                    y * ge.tileHeight - 0.25,
                    ge.tileWidth + 0.5, ge.tileHeight + 0.5)
            }
        }
    }
    return    


    ge.drawY = 0
    for (var y = ge.hero.y - ge.tileOffset; y < ge.hero.y + ge.tileOffset + 1; y++) {
        if (ge.map[y]) {
            ge.drawX = 0
            for (var x = ge.hero.x - ge.tileOffset; x < ge.hero.x + ge.tileOffset + 1; x++) {
                if (ge.map[y][x] && ge.img.tiles[ge.map[y][x]]) {
                    ge.context.drawImage(ge.img.tiles[ge.map[y][x]],
                        ge.offsetLeft + ge.drawX * ge.tileWidth - 0.25, 
                        ge.offsetTop + ge.drawY * ge.tileHeight - 0.25,
                        ge.tileWidth + 0.5, ge.tileHeight + 0.5)
                    }
                ge.drawX++
            }
        }
        ge.drawY++                
    }
}

ge.drawCharacters = () => {
    ge.context.drawImage(ge.img.characters,
        ge.hero.spritesheetCoords.x + (ge.animationFrame ? ge.img.frameDiff : 0), 
        ge.hero.spritesheetCoords.y + 50 * ge.hero.facing, 36, 36,
        ge.offsetLeft+ ge.middleTileX, 
        ge.offsetTop + ge.middleTileY,
        ge.tileWidth, ge.tileHeight)    
    
    for (var i = 0; i < ge.npcs.length; i++) {
        if (Math.abs(ge.npcs[i].x - ge.hero.x) <= ge.tileOffset &&
                Math.abs(ge.npcs[i].y - ge.hero.y) <= ge.tileOffset) {
            ge.context.drawImage(ge.img.characters,
                ge.npcs[i].spritesheetCoords.x + (ge.animationFrame ? ge.img.frameDiff : 0), 
                ge.npcs[i].spritesheetCoords.y + 50 * (ge.npcs[i].facing||0), 36, 36,
                ge.offsetLeft + (ge.npcs[i].x - ge.hero.x) * ge.tileWidth + ge.middleTileX, 
                ge.offsetTop + (ge.npcs[i].y - ge.hero.y) * ge.tileHeight + ge.middleTileY,
                ge.tileWidth, ge.tileHeight)        
        }
    }

    for (var userName in ge.remoteUsers) {
        var user = ge.remoteUsers[userName]
        if (user.data &&
                Math.abs(user.data.x - ge.hero.x) <= ge.tileOffset &&
                Math.abs(user.data.y - ge.hero.y) <= ge.tileOffset) {
            ge.context.drawImage(ge.img.characters,
                user.data.spritesheetCoords.x + (ge.animationFrame ? ge.img.frameDiff : 0), 
                user.data.spritesheetCoords.y + 50 * (user.data.facing||0), 36, 36,
                ge.offsetLeft + (user.data.x - ge.hero.x) * ge.tileWidth + ge.middleTileX, 
                ge.offsetTop + (user.data.y - ge.hero.y) * ge.tileHeight + ge.middleTileY,
                ge.tileWidth, ge.tileHeight)        
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
    ge.showVideoCallDialog(options.name)
    
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
            ge.textMessageDialog.output.innerHTML += "<br><span class='text-message-from-me'>" + ge.hero.name + ": " + message + "</span>"
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
ge.showVideoCallDialog = (remoteUserName) => {
    //var dialog = document.createElement('div')
    //dialog.className = "menu"
    //document.body.appendChild(dialog)

    ge.rtc.callUser(remoteUserName, (data) => {
        ge.rtc.localVideo.className = "menu"
        ge.rtc.localVideo.style.display = "block"
        ge.rtc.localVideo.style.width = "25%"
        document.body.appendChild(ge.rtc.localVideo)        
    })
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

//finally, get a map and go
fetch("map1").then(result => {
    return result.json() 
}).then((data) => {

    Object.keys(data.tileSet).forEach(key => {
        var img = document.createElement("img")
        img.src = "img/" + data.tileSet[key]
        ge.img.tiles[key] = img
        img.onload = ()=>{ge.drawnBackground = false}
    })

    console.log(ge.tileWidth, ge.tileHeight)
    ge.backgroundCanvas.width = data.mapLines[0].length * ge.tileWidth
    ge.backgroundCanvas.height = data.mapLines.length * ge.tileHeight
    ge.backgroundCanvas.style.width = ge.backgroundCanvas.width + "px"
    ge.backgroundCanvas.style.height = ge.backgroundCanvas.height + "px"
    

    
    ge.map = data.mapLines;
    ge.npcs = data.npcs || []
    ge.npcs.forEach(npc => npc.spritesheetCoords = ge.img.getSpriteSheetCoords(npc.characterI))
    ge.hero.x = data.startX
    ge.hero.y = data.startY
    ge.hero.facing = 0

    if (ge.rtc) {
        ge.rtc.join("map1", window.location.search.substring(1))
        ge.rtc.onjoined = () => {
            ge.rtc.updateLocalUserData(ge.hero)
        }
        ge.rtc.onincomingcall = (userName, callback) => {
            ge.showDialog([
                {question: "Accept a call from " + userName, options: [
                    {caption: "Yes", action: callback},
                    {caption: "Nope", action: "hideMenus"}
                ]}
            ])            
        }
        ge.rtc.ontextmessage = (data) => {
            console.log("tm", data)
            ge.showTextMessage(data)
        }
    }

    ge.mainLoop()
})
