//band warrior
var bw = {}

bw.aButton = " "
bw.bButton = "ArrowLeft"

bw.canvas = document.getElementById("mainCanvas")
bw.canvas.width = bw.canvas.clientWidth
bw.canvas.height = bw.canvas.clientHeight
bw.context = bw.canvas.getContext("2d")

bw.img = {
    characters: document.getElementById("characters-spritesheet"),
    tiles: {
        d: "desk.png",
        b: "brick.png",
        s: "brick.png",
        ".": "bushes.png",
        "r": "sand.png",
        " ": "grass.png",
        "t": "trees.png",
        "I": "wall1.png",
        "l": "wall2.png",
        "w": "water1.png"
    },
    frameDiff: 60
}
Object.keys(bw.img.tiles).forEach(key => {
    var img = document.createElement("img")
    img.src = "img/" + bw.img.tiles[key]
    bw.img.tiles[key] = img
})

//our character is always in the middle
//this sets how many tiles each direction are shown
bw.tileOffset = 8

// make it square
if (bw.canvas.height > bw.canvas.width) {
    bw.tileSize = bw.canvas.width / (bw.tileOffset * 2 + 1)
    bw.offsetTop = (bw.canvas.height - bw.canvas.width) / 2
    bw.offsetLeft = 0
}
else {
    bw.tileSize = bw.canvas.height / (bw.tileOffset * 2 + 1)
    bw.offsetLeft = (bw.canvas.width - bw.canvas.height) / 2
    bw.offsetTop = 0
}
bw.tileWidth = bw.tileSize
bw.tileHeight = bw.tileSize

bw.hero = {
    coins: 1000000,
    vocalSkill: 0,
    guitarSkill: 0,
    gear: []
}

//staring spot
bw.hero.x = 55
bw.hero.y = 42
bw.hero.facing = 0

bw.keysPressed = {}
bw.visibleMenus = []

window.onkeydown = e => {
    if (bw.visibleMenus.length) {
        bw.handleKeyForMenu(e)
    }
    else {
        bw.keysPressed[e.key] = true
    }
}
window.onkeyup = e => {
    delete bw.keysPressed[e.key]
}
bw.handleKeyForMenu = e => {
    var menu = bw.visibleMenus[bw.visibleMenus.length - 1]

    if (menu === bw.dialogBox) {
        bw.advanceDialog()
        return 
    }

    if (e.key === bw.bButton) {
        menu.div.style.display = "none"
        bw.visibleMenus.splice(bw.visibleMenus.length - 1, 1)
    }
    if (e.key === bw.aButton) {
        var actionResult = bw.handleAButton(menu)
        if (typeof actionResult === "string") {
            bw.showDialog(actionResult.split("\n"))
        }
    }

    if (e.key === "ArrowDown") {
        bw.highlightMenuOption(menu, ++menu.currentOptionI)
    }
    if (e.key === "ArrowUp") {
        bw.highlightMenuOption(menu, --menu.currentOptionI)
    }
}
bw.hideMenus = () => {
    bw.visibleMenus.forEach(menu => {
        menu.div.style.display = "none"
    })
    bw.visibleMenus = []
    bw.menus.coinCount.div.style.display = "none"
}

bw.mainLoop = () => {
    bw.processKeys() 

    bw.render()

    requestAnimationFrame(bw.mainLoop)
}

bw.processKeys = () => {
    if (bw.visibleMenus.length) {
        return
    }
    if (bw.keysPressed[bw.aButton]) {
        bw.showPlayerMenu()
    }
    else if (bw.keysPressed["ArrowUp"]) {
        bw.hero.move(0, -1)
    }
    else if (bw.keysPressed["ArrowDown"]) {
        bw.hero.move(0, 1)
    }
    else if (bw.keysPressed["ArrowLeft"]) {
        bw.hero.move(-1, 0)
    }
    else if (bw.keysPressed["ArrowRight"]) {
        bw.hero.move(1, 0)
    }
}

bw.blockedTiles = "Ilwd"
bw.hero.move = (x, y) => {
    if (Date.now() - bw.hero.lastMove < 75) {
        return 
    }

    bw.hero.facingX = x
    bw.hero.facingY = y
    if (y === 1) bw.hero.facing = 0
    if (y === -1) bw.hero.facing = 1
    if (x === 1) bw.hero.facing = 2
    if (x === -1) bw.hero.facing = 3

    // check to see if you can move to that position
    var target = bw.map[bw.hero.y + y]
    if (!target) return
    target = target[bw.hero.x + x]
    if (!target || bw.blockedTiles.indexOf(target) > -1) {
        return 
    }
    for (var i = 0; i < bw.npcs.length; i++) {
        if (bw.npcs[i].x === bw.hero.x + x && bw.npcs[i].y === bw.hero.y + y) {
            return
        }
    }

    bw.hero.tile = target
    bw.hero.x += x
    bw.hero.y += y

    bw.hero.lastMove = Date.now()
}


bw.showPlayerMenu = () => {
    bw.showMenu(bw.menus.player)
}
bw.showMenu = (menu) => {
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
    bw.visibleMenus.push(menu)
    menu.div.style.display = "block"
    bw.highlightMenuOption(menu, 0)
}
bw.highlightMenuOption = (menu, optionI) => {
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
bw.handleAButton = (menu) => {
    if (typeof menu.currentOption.action === "function") { //get rid of this
        return menu.currentOption.action()
    }
    if (typeof menu.currentOption.action === "string" && 
            typeof bw[menu.currentOption.action] === "function") { 
        return bw[menu.currentOption.action](menu.currentOption)
    }
    if (menu.currentOption.action) {
        return bw.handleAction(menu.currentOption.action)
    }
    if (menu.currentOption.priceList) {
        bw.showPriceList(menu.currentOption.priceList)
    }
}
bw.handleBButton = () => {
    if (bw.menus.player.showing) {
        bw.menus.player.div.style.display = "none"
        bw.menus.player.showing = false
        bw.topMenu = null
    }
}
bw.handleAction = (action) => {
    if (bw[action]) {
        bw
    }
    if (action.function) {
        return bw[action.function](action)
    }
}

bw.frameCount = 0
bw.render = () => {
    if (bw.frameCount === 10) {
        bw.animationFrame = !bw.animationFrame
        bw.frameCount = 0
    }
    else {
        bw.frameCount++
    }

    bw.drawScene()
    bw.drawCharacters()
}
bw.drawScene = () => {
    bw.drawY = 0
    bw.canvas.width = bw.canvas.width

    for (var y = bw.hero.y - bw.tileOffset; y < bw.hero.y + bw.tileOffset + 1; y++) {
        if (bw.map[y]) {
            bw.drawX = 0
            for (var x = bw.hero.x - bw.tileOffset; x < bw.hero.x + bw.tileOffset + 1; x++) {
                if (bw.map[y][x] && bw.img.tiles[bw.map[y][x]]) {
                    bw.context.drawImage(bw.img.tiles[bw.map[y][x]],
                        bw.offsetLeft + bw.drawX * bw.tileWidth - 0.25, 
                        bw.offsetTop + bw.drawY * bw.tileHeight - 0.25,
                        bw.tileWidth + 0.5, bw.tileHeight + 0.5)
                    }
                bw.drawX++
            }
        }
        bw.drawY++                
    }
}

bw.drawCharacters = () => {
    bw.context.drawImage(bw.img.characters,
        18 + (bw.animationFrame ? bw.img.frameDiff : 0), 7 + 50 * bw.hero.facing, 36, 36,
        bw.offsetLeft+ bw.tileOffset * bw.tileWidth, 
        bw.offsetTop + bw.tileOffset * bw.tileHeight,
        bw.tileWidth, bw.tileHeight)    
    
    for (var i = 0; i < bw.npcs.length; i++) {
        if (Math.abs(bw.npcs[i].x - bw.hero.x) <= bw.tileOffset &&
                Math.abs(bw.npcs[i].y - bw.hero.y) <= bw.tileOffset) {
            bw.context.drawImage(bw.img.characters,
                bw.npcs[i].spritesheetCoords.x + (bw.animationFrame ? bw.img.frameDiff : 0), 
                bw.npcs[i].spritesheetCoords.y + 50 * (bw.npcs[i].facing||0), 36, 36,
                bw.offsetLeft + (bw.tileOffset + bw.npcs[i].x - bw.hero.x) * bw.tileWidth, 
                bw.offsetTop + (bw.tileOffset + bw.npcs[i].y - bw.hero.y) * bw.tileHeight,
                bw.tileWidth, bw.tileHeight)        
        }
    }
}

bw.talk = () => {
    var npc = bw.getNPC()
    if (!npc) {
        bw.showDialog(["There is no one to talk to."])
        return
    }
    npc.facing = bw.hero.facing % 2 === 0 ? bw.hero.facing + 1 : bw.hero.facing - 1
    bw.showDialog(npc.dialog)
}
bw.getNPC = () => {
    for (var i = 0; i < bw.npcs.length; i++) {
        if (bw.npcs[i].x === bw.hero.x + bw.hero.facingX && 
                bw.npcs[i].y === bw.hero.y + bw.hero.facingY) {
            return bw.npcs[i]
        }
    }

    // maybe theyre behind a desk
    if (bw.map[bw.hero.y + bw.hero.facingY] && 
            bw.map[bw.hero.y + bw.hero.facingY][bw.hero.x + bw.hero.facingX] === "d") {
        for (var i = 0; i < bw.npcs.length; i++) {
            if (bw.npcs[i].x === bw.hero.x + bw.hero.facingX * 2 && 
                    bw.npcs[i].y === bw.hero.y + bw.hero.facingY * 2) {
                return bw.npcs[i]
            }
        }            
    }
}

bw.buyGear = (item) => {
    if (bw.hero.coins < item.price) {
        return "You ain't got enough coins, man!"
    }
    bw.spendCoins(item.price)
    bw.hero.gear.push({caption: item.caption})
    return "Here you go! Enjoy."
}

bw.spendCoins = (amount) => {
    bw.hero.coins -= amount
    bw.menus.coinCount.div.innerHTML = "$ " + bw.hero.coins
}

bw.buyVocalLesson = () => {
    if (bw.hero.coins >= (bw.hero.vocalSkill + 1) * 10) {
        bw.spendCoins((bw.hero.vocalSkill + 1) * 10)
        bw.hero.vocalSkill++
        if (bw.hero.vocalSkill === 1) {
            bw.menus.player.options.push({caption:"SING", action: bw.sing})
        }
        return "One vocal lesson, comin' right up \nYour vocal skill increased!"
    }
    else {
        return "You don't have enough money.\nDid you waste it?!"
    }    
}
bw.buyGuitarLesson = () => {
    // you need an acoustic guitar for the first lesson
    if (bw.hero.guitarSkill === 0) {
        if (!bw.characterHasGear(bw.hero, "Acoustic Guitar")) {
            return "You don't even have a guitar!"
        }
    }
    else if (bw.hero.guitarSkill === 1) {
        if (!bw.characterHasGear(bw.hero, "Acoustic Guitar")) {
            return "You don't even have a guitar!"
        }
        if (!bw.characterHasGear(bw.hero, "Guitar Pick")) {
            return "You'll need a Guitar Pick for the next lesson.'"
        }
    }
    else if (bw.hero.guitarSkill === 2) {
        if (!bw.characterHasGear(bw.hero, "Electric Guitar")) {
            return "The next lesson requires an Electric Guitar"
        }
        if (!bw.characterHasGear(bw.hero, "Guitar Pick")) {
            return "What happened to your Guitar Pick?"
        }
    }
    else if (bw.hero.guitarSkill === 3) {
        if (!bw.characterHasGear(bw.hero, "Electric Guitar")) {
            return "The next lesson requires an Electric Guitar"
        }
        if (!bw.characterHasGear(bw.hero, "Guitar Pick")) {
            return "What happened to your Guitar Pick?"
        }
        if (!bw.characterHasGear(bw.hero, "Guitar Amp")) {
            return "Come back when you get your own Guitar Amp!"
        }
    }

    // a guitar pick for the second
    if (bw.hero.coins >= (bw.hero.guitarSkill + 1) * 10) {
        bw.hero.coins -= (bw.hero.guitarSkill + 1) * 10
        bw.hero.guitarSkill++
        bw.menus.player.options.push({caption:"PLAY", action: bw.play})
        return "One guitar lesson, comin' right up\nYour guitar skill increased!"
    }
    else {
        return "You don't have enough money. Did you waste it?!"
    }    
}
bw.enterTalentShow = (params) => {
    if (params.price > bw.hero.coins) {
        return "You don't have enough money!"
    }
}

bw.sing = () => {
    var singing = ["You sing...", "... and sing ...", "... and ..."]
    if (bw.hero.tile === "s") {
        var coins = Math.ceil(Math.random() * 5 * bw.hero.vocalSkill)
        singing.push("Somebody tipped you " + coins + " coins!")
        bw.hero.coins += coins
    }
    else if (Math.random() < bw.hero.vocalSkill / 10) {
        singing.push("Somebody tipped you 1 coin!")
        bw.hero.coins += 1
    }
    else {
        singing.push("Nobody cared")
    }
    bw.showDialog(singing)
}

bw.play = () => {
    var singing = ["You play...", "... and play ...", "... and ..."]
    if (Math.random() < 0.1) {
        singing.push("Somebody tipped you 1 coin!")
        bw.hero.coins += 1
    }
    else {
        singing.push("Nobody cared")
    }
    bw.showDialog(singing)
}


bw.dialogBox = {
    div: document.getElementById("dialogBox"),
    bButton: () => {

    },
    aButton: () => {

    }
}
bw.showDialog = (dialog) => {
    bw.dialogBox.currentLine = -1
    bw.dialogBox.div.style.display = "block"
    bw.visibleMenus.push(bw.dialogBox)
    bw.dialogBox.dialog = dialog
    bw.advanceDialog()
}
bw.advanceDialog = () => {
    bw.dialogBox.currentLine++
    if (bw.dialogBox.currentLine >= bw.dialogBox.dialog.length) {
        bw.hideMenus()
    }
    else {
        var currentLine = bw.dialogBox.dialog[bw.dialogBox.currentLine]
        // if it's a string, show it, otherwise, it's a question
        if (typeof currentLine === "string") {
            bw.dialogBox.div.innerHTML = currentLine
            if (bw.dialogBox.dialog.length > bw.dialogBox.currentLine + 1) {
                bw.dialogBox.div.innerHTML += "<br>&nbsp;&#x25BC"
            }
        }
        else if (currentLine.question) {
            bw.dialogBox.div.innerHTML = currentLine.question
            if (currentLine.showCoins) {
                bw.showCoinCount()
            }
            if (currentLine.options) {
                bw.showResponseOptions(currentLine.options)
            }
            else if (currentLine.priceList) {
                bw.showPriceList(currentLine.priceList)
            }
        }
        else if (currentLine.salesPitch) {
            bw.dialogBox.div.innerHTML = currentLine.salesPitch
            bw.showPriceList(currentLine.options)
        }
    }
}
bw.showResponseOptions = (answers) => {
    bw.menus.response.options = answers
    bw.showMenu(bw.menus.response)
}
bw.showPriceList = (items) => {
    bw.showCoinCount()
    bw.menus.priceList.options = items
    bw.showMenu(bw.menus.priceList)
}
bw.showCoinCount = () => {
    bw.menus.coinCount.div.innerHTML = "$ " + bw.hero.coins
    bw.menus.coinCount.div.style.display = "block"
}

bw.characterHasGear = (character, gear) => {
    for (var i = 0; i < character.gear.length; i++) {
        if (character.gear[i].name === gear) { 
            return true
        }
    }
    return false
}

bw.img.getSpriteSheetCoords = (i, facing, frame) => {
    var row = Math.floor(i / 5)
    var col = i % 5
    return {x: 18 + col * 120, y: 8 + row * 200}
}

bw.showGear = () => {
    bw.showCoinCount()
    bw.menus.gearList.options = bw.hero.gear
    bw.showMenu(bw.menus.gearList)
}

// this should be next to last, so all the functions are defined
bw.menus = {
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

//objecet literals, need to be after function definitions
bw.merchantsDialog = [
    {question: "Pawn shop here. Whadya want?", options:
        [
            {caption: "BUY", priceList: [
                {caption: "Acoustic Guitar", price: 100, action: "buyGear"},
                {caption: "Electric Guitar", price: 250, action: "buyGear"},
                {caption: "Guitar Amp", price: 100},
            ]},
            {caption: "SELL", dialog: ["I'm a Buying"]},
            {caption: "NOPE", action: bw.hideMenus}
        ]
    }
]
bw.teachersDialog = [
    "Hi! I'm the Music Teacher!",
    {salesPitch: "Do you want a music lesson?", options:
        [
            {caption: "VOCAL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;10", action: bw.buyVocalLesson},
            {caption: "GUITAR&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;10", action: bw.buyGuitarLesson},
        ]
    }
]
bw.talentshowDialog = [
    "Welcome to our Coffee Shop!",
    "There's a Talent Show tonight...",
    "You can win $100!",
        {question: "It costs $15 to enter. Wanna try it?", showCoins: true, options:
        [
            {caption: "YES", action: {"function": "enterTalentShow", price: 15}},
            {caption: "NOPE", action: bw.hideMenus}
        ]
    }
]
bw.autopartsDialog = [
    "This is an auto parts stpre.",
    {"question": "Need something?", "priceList":
        [
            {caption: "Van Parts", price: 300, action: "buyGear"},
            {caption: "Helicopter Parts", price: 1000, action: "buyGear"}
        ]
    }
]


bw.npcs = [

    {character: "DRAGO", x: 57, y: 42, spritesheetCoords: bw.img.getSpriteSheetCoords(5),
            dialog: ["Hi! I'm a Dragon.", "I'm you're only friend.", 
                "And we live in this van down by the river."
            ]},

    {character: "VAN", x: 58, y: 42, spritesheetCoords: bw.img.getSpriteSheetCoords(25),
            facing:1,
            dialog: [".. crank crank...", 
                "Won't start."
            ]},


    {character: "RANDO", x: 5, y: 5, spritesheetCoords: bw.img.getSpriteSheetCoords(0),
            dialog: ["Hi! I'm rando", "This is Hometown"]},
    {character: "RANDO", x: 13, y: 39, spritesheetCoords: bw.img.getSpriteSheetCoords(20),
            dialog: ["I like this park.", 
            "There's a stage for people to sing and play!"]},
    {character: "RANDO", x: 6, y: 37, spritesheetCoords: bw.img.getSpriteSheetCoords(2),
            dialog: ["I haven't heard anyone sing yet today."]},
    {character: "RANDO", x: 5, y: 15, spritesheetCoords: bw.img.getSpriteSheetCoords(3),
            dialog: [
            {question: "Wnat to hear a joke?", options: [
                {caption: "YES", dialog: ["A nurse pulls an rectal thermometer out of her breast pocket, and says...",
                                        "Some asshole has my pen."]},
                {caption: "NO", action: bw.hideMenus},
            ]}
        ]},
    {character: "WELCOME", x: 32, y: 9, spritesheetCoords: bw.img.getSpriteSheetCoords(4), 
            dialog: ["welcome"]},
    {character: "MERCHANT", x: 62, y: 33, spritesheetCoords: bw.img.getSpriteSheetCoords(13),
            dialog: bw.merchantsDialog},
    {character: "TALENTSHOW", x: 64, y: 5, spritesheetCoords: bw.img.getSpriteSheetCoords(6),
            dialog: bw.talentshowDialog},
    {character: "TEACHER", x: 41, y: 24, spritesheetCoords: bw.img.getSpriteSheetCoords(1),
            dialog: bw.teachersDialog},
    {character: "AUTOPARTS", x: 50, y: 5, spritesheetCoords: bw.img.getSpriteSheetCoords(6),
            dialog: bw.autopartsDialog},
    
]

for (var i = 0; i < 25; i++) {
    bw.npcs.push({x: 56 + i, y:15, spritesheetCoords: bw.img.getSpriteSheetCoords(i)})
}


//finally, get a map and go
fetch("map1").then(result => {
    return result.text() 
}).then((data) => {
    bw.map = data.split("\n");
    bw.mainLoop()
})
