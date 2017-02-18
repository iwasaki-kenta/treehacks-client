<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <voice></voice>
    <canvas id="editor" width="800" height="600"></canvas>
  </div>
</template>

<script>
  import SocketIO from 'socket.io-client';
  import SpeechRecognition from "./SpeechRecognition";
  import {fabric} from 'fabric';

  let socket, canvas;

  export default {
    name: 'hello',
    data () {
      return {
        msg: 'Treehacks.'
      }
    },
    mounted() {
      canvas = new fabric.Canvas('editor', {isDrawingMode: true})

      socket = SocketIO('http://127.0.0.1:5000/data');
      socket.on('connect', () => {
        console.log("Connected.")
        socket.emit('draw', 'test')
      });

      socket.on('preview', (data) => {
        const img = new Image();
        img.onload = () => {
          const frame = new fabric.Image(img);
          canvas.setBackgroundImage(frame)
          canvas.renderAll();
        }
        img.src = "data:image/jpg;base64," + data;

      });
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
