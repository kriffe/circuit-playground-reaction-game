var Playground = require('playground-io')
var five = require('johnny-five')
var board = new five.Board({
  io: new Playground({
    port: '/COM3',

    // Passing Firmata options through:
    // Circuit Playground Firmata seems not to report version before timeout,
    // lower timeout to reduce initial connection time.
    reportVersionTimeout: 200
  })
})

var colors = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'indigo',
  'violet'
]
colors = ['FF0000', 'FF7F00', 'FFFF00', '00FF00', '0000FF', '4B0082', '8F00FF']

board.on('ready', function () {
  var pixels = new five.Led.RGBs({
    controller: Playground.Pixel,
    pins: [0, 1, 2]
  })

  var pads = new five.Touchpad({
    controller: Playground.Touchpad,
    pads: [0, 10]
  })

  var piezo = new five.Piezo({
    controller: Playground.Piezo,
    pin: 5
  })

  /**
   * Default Component Controllers
   * @type {five}
   */
  var buttons = new five.Buttons([4, 19])

  // var led = new five.Led(13)
  // led.on()

  var light = new five.Sensor({
    pin: 'A5',
    freq: 100
  })

  var gameIsRunning = false
  var someoneHasReacted = false
  var someoneHasCheated = false
  var timeToPressButton = -1
  var playerOneReactionTime = -1
  var playerTwoReactionTime = -1

  var startColorIndex = 0

  board.loop(100, () => {
    if (gameIsRunning === true && someoneHasReacted === false && timeToPressButton === -1) {
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
    } else if (gameIsRunning === true && timeToPressButton !== -1 && someoneHasReacted === false) {
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
          pixels[0].color('red')
        } else {
          pixels[0].color('green')
        }
      }

      if (playerTwoIsWinner) {
        if (someoneHasCheated) {
          pixels[1].color('red')
        } else {
          pixels[1].color('green')
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
      console.log(data)
      if (data.which[0] === 0) { // Player one
        playerOneReactionTime = Date.now()
      } else if (data.which[0] === 10) {  // Player two
        playerTwoReactionTime = Date.now()
      } else {
        console.log(data)
      }
      someoneHasReacted = true
      someoneHasCheated = timeToPressButton === -1

      piezo.frequency(1200, 200)

    } else {
      piezo.noTone()
    }
  })

  function newGame () {
    playerOneReactionTime = -1
    playerTwoReactionTime = -1
    gameIsRunning = true
    someoneHasReacted = false
    someoneHasCheated = false
    timeToPressButton = -1
    var gameTime = Math.random() * 3000 + 2000
    setTimeout(() => {
      if (!someoneHasReacted) {
        console.log('Times up: Press button!')
        timeToPressButton = Date.now()
        piezo.frequency(800, 20)
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