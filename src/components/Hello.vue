<template xmlns:v-on="http://www.w3.org/1999/xhtml">
  <div class="hello">
    <h1>{{ msg }}</h1>
    <voice></voice>x
    <canvas id="editor" width="500" height="500"></canvas>
    <br/>
  </div>
</template>

<script>
  import SocketIO from 'socket.io-client';
  import SpeechRecognition from "./SpeechRecognition";
  import {fabric} from 'fabric';

  let socket, canvas;

  const img = new Image();
  img.onload = () => {
    const frame = new fabric.Image(img);
    canvas.setBackgroundImage(frame)
    canvas.renderAll();
  }

  function base64ArrayBuffer(arrayBuffer) {
    var base64 = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    var bytes = new Uint8Array(arrayBuffer)
    var byteLength = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength = byteLength - byteRemainder

    var a, b, c, d
    var chunk

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
      d = chunk & 63               // 63       = 2^6 - 1

      // Convert the raw binary segments to the appropriate ASCII encoding
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
      chunk = bytes[mainLength]

      a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

      // Set the 4 least significant bits to zero
      b = (chunk & 3) << 4 // 3   = 2^2 - 1

      base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

      a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

      // Set the 2 least significant bits to zero
      c = (chunk & 15) << 2 // 15    = 2^4 - 1

      base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
  }

  export default {
    name: 'hello',
    data () {
      return {
        msg: 'Treehacks.',
        updating: false
      }
    },
    mounted() {
      let lastUpdate = Date.now();

      canvas = new fabric.Canvas('editor', {isDrawingMode: true});
      canvas.freeDrawingBrush.width = 10;

      canvas.on({
        'mouse:down': () => {
          this.updating = true;
        },
        'mouse:move': () => {
          if (this.updating && Date.now() - lastUpdate >= 400) {
            console.log(canvas.toDataURL({
              format: 'png',
//              multiplier: 0.128,
            }))
//            socket.emit('draw', canvas.toDataURL({
//              format: 'png',
////              multiplier: 0.128,
//            }), false)
            lastUpdate = Date.now();
          }
        },
        'mouse:up': () => {
          if (this.updating) {

            socket.emit('draw', canvas.toDataURL({
              format: 'png',
//              multiplier: 0.128,
            }).split("base64,")[1], false)

            //socket.emit('draw', 'test', false)
            this.updating = false;
          }
        }
      })

      socket = SocketIO('http://127.0.0.1:5000/data');
      var onevent = socket.onevent;
      socket.onevent = function (packet) {
        var args = packet.data || [];
        onevent.call(this, packet);    // original call
        packet.data = ["*"].concat(args);
        onevent.call(this, packet);      // additional call to catch-all
      };

      socket.binaryType = 'blob';

      socket.on('connect', () => {
        console.log("Connected.")
      });

      socket.on("*", function (event, data) {
        img.src = "data:image/jpg;base64," + base64ArrayBuffer(data);
      });

      socket.on('preview', (data) => {
        console.log(data)
        img.src = "data:image/jpg;base64," + data;
      });
    },
    methods: {
      export() {
        console.log();
      }
    },
    components: {'voice': SpeechRecognition}
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
  h1, h2 {
    font-weight: normal;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    display: inline-block;
    margin: 0 10px;
  }

  a {
    color: #42b983;
  }

  .canvas-container {
    margin: 0 auto;
  }

  canvas {
    border: 1px solid black;
    margin: 0 auto !important;
  }
</style>
