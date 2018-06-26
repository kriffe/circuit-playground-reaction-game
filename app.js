var Playground = require('playground-io')
var five = require('johnny-five')

var MY_USB_PORT = 'COM5'

console.log('Connecting to usb port: ', MY_USB_PORT)

var board = new five.Board({
  io: new Playground({
    port: '/' + MY_USB_PORT,
    reportVersionTimeout: 200
  })
})

var colors = [
  'pink',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'indigo',
  'violet',
  'white'
]

board.on('ready', function () {
  var pixels = new five.Led.RGBs({
    controller: Playground.Pixel,
    pins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]   // ToDo: Extend to all 10
  })

  var pads = new five.Touchpad({
    controller: Playground.Touchpad,
    pads: [0, 10]
  })

  var buttons = new five.Buttons([4, 19])

  var gameIsRunning = false
  var someoneHasReacted = false
  var someoneHasCheated = false
  var timeToPressPad = -1
  var playerOneReactionTime = -1
  var playerTwoReactionTime = -1

  var startColorIndex = 0

  board.loop(100, () => {
    if (gameIsRunning === true && someoneHasReacted === false && timeToPressPad === -1) {
      startColorIndex++
      if (startColorIndex >= colors.length) {
        startColorIndex = 0
      }

      pixels.forEach((pixel, index) => {
        var pixelIndex = startColorIndex + index
        if (pixelIndex >= colors.length) {
          pixelIndex = startColorIndex + index - colors.length
        }
        pixel.color(colors[pixelIndex])
        pixel.intensity(50)
      })
    } else if (gameIsRunning === true && timeToPressPad !== -1 && someoneHasReacted === false) {
      pixels.forEach((pixel, index) => {
        pixel.color('orange')
        pixel.intensity(100)
      })
    } else if (gameIsRunning === true && someoneHasReacted === true) {
      var playerOneIsWinner = playerOneReactionTime !== -1 && (playerTwoReactionTime === -1 || playerOneReactionTime < playerTwoReactionTime)
      var playerTwoIsWinner = playerTwoReactionTime !== -1 && (playerOneReactionTime === -1 || playerTwoReactionTime < playerOneReactionTime)

      pixels.forEach((pixel, index) => {
        pixel.color('blue')
        pixel.intensity(100)
      })

      if (playerOneIsWinner) {
        if (someoneHasCheated) {
          pixels[3].color('red')
        } else {
          pixels[3].color('green')
        }
      }

      if (playerTwoIsWinner) {
        if (someoneHasCheated) {
          pixels[8].color('red')
        } else {
          pixels[8].color('green')
        }
      }

      gameIsRunning = false
    }
  })

  buttons.on('press', (button) => {
    if (button.pin === 19) {
      console.log('New Game started!')
      newGame()
    } else {
      console.log('Button pressed: ', button.pin)
    }
  })

  pads.on('change', (data) => {
    if (data.type === 'down') {
      if (data.which[0] === 0) { // Player one
        playerOneReactionTime = Date.now()
      } else if (data.which[0] === 10) {  // Player two
        playerTwoReactionTime = Date.now()
      } else {
        console.log('Something else changed:')
        console.log(data)
      }
      someoneHasReacted = true
      someoneHasCheated = timeToPressPad === -1
    }
  })

  function newGame () {
    playerOneReactionTime = -1
    playerTwoReactionTime = -1
    gameIsRunning = true
    someoneHasReacted = false
    someoneHasCheated = false
    timeToPressPad = -1
    var gameTime = Math.random() * 3000 + 2000
    setTimeout(() => {
      if (!someoneHasReacted) {
        console.log('Times up: Press button!')
        timeToPressPad = Date.now()
        pixels.forEach((pixel, index) => {
          pixel.color('yellow')
          pixel.intensity(10)
        })
      } else {
        someoneHasCheated = true
      }
    }, gameTime)
  }
})
