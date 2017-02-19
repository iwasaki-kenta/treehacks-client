<template xmlns:v-on="http://www.w3.org/1999/xhtml" xmlns:v-bind="http://www.w3.org/1999/xhtml">
  <div id="dream">
    <div class="container">
      <span class="title is-3">Sketch out your ideal handbag.</span>
      <br/>
      <span class="subtitle is-5">I'll shape up your ideas and get it ready from a fashion designer/find it from a retailer ASAP.</span>
      <br/><br/><br/>

      <div class="columns">
        <div class="column">
          <img src="https://github.com/junyanz/iGAN/raw/master/pics/demo_teaser.jpg"
               style="width: 50%; margin: 0 auto;"/>
        </div>
        <div class="column">
          <div class="overlay-container">
            <img class='img'/>
            <canvas id="editor_sketch" width="368" height="368"></canvas>
          </div>
        </div>
      </div>


      <br/><br/><br/>

      <span class="title is-3">Now just color it in.</span>
      <br/>
      <span class="subtitle is-5">Place some blobs of paint and I'll dream it up for you.</span>

      <br/><br/><br/>

      <div class="columns">
        <div class="column">
          <chrome-color v-model="colors" @change-color="onColorChange"></chrome-color>
        </div>
        <div class="column">
          <div class="overlay-container">
            <img class='img'/>
            <canvas id="editor_color" width="368" height="368"></canvas>
          </div>
        </div>
      </div>

      <br/>

      <a class="button is-primary is-large" v-on:click="exportDesign">Export Design</a>

      <div class="modal" v-bind:class="{'is-active': exportDialog}">
        <div class="modal-background" v-on:click="exportDialog = false"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Export Fashion Design</p>
            <button class="delete"></button>
          </header>
          <section class="modal-card-body">
            <div class="columns">
              <div class="column is-2">
                <img id="design"/>
              </div>
              <div class="column">
                <span class="fa fa-cog fa-spin fa-2x fa-fw" v-if="!exportKeywords[0]"></span>
                <div>
                  <span class="tag is-medium is-black" v-for="tag in exportKeywords"
                        style="margin-right: 8px; margin-bottom: 8px; font-family: monospace;">{{tag}}</span>
                </div>
                <br/>

                <div class="columns">
                  <div class="column is-4">
                    <span class="fa fa-cog fa-spin fa-2x fa-fw" v-if="!resEnabled"></span>
                    <img id="superRes" />
                  </div>

                  <div class="column">
                    <blockquote style="font-family: monospace;" v-if="resEnabled">I polished up your design for you and increased the resolution of what I had in mind.</blockquote>
                  </div>

                </div>
              </div>
            </div>

          </section>
          <footer class="modal-card-foot">
            <a class="button is-success" v-on:click="exportDialog = false">Deliver</a>
            <a class="button">Cancel</a>
          </footer>
        </div>
      </div>

      <br/><br/><br/>
    </div>
    <br/>
  </div>
</template>

<script>
  import {Modal, ImageModal, CardModal} from 'vue-bulma-modal'
  import SocketIO from 'socket.io-client';
  import {Photoshop} from 'vue-color';
  import {fabric} from 'fabric';
  import $ from "jquery";

  let socket, canvas_sketch, canvas_color;

  function exportData(id, dimensions = 64) {
    const destinationCanvas = document.createElement("canvas");
    destinationCanvas.width = destinationCanvas.height = dimensions;
    const context = destinationCanvas.getContext('2d');


    context.fillStyle = "black";
    context.fillRect(0, 0, destinationCanvas.width, destinationCanvas.height);

    context.drawImage($(id)[0], 0, 0, destinationCanvas.width, destinationCanvas.height);

    return destinationCanvas.toDataURL({format: 'image/png'}).split("base64,")[1];
  }

  function scaleBitmap(id, dimensions = 64) {
    const destinationCanvas = document.createElement("canvas");
    destinationCanvas.width = destinationCanvas.height = dimensions;
    const context = destinationCanvas.getContext('2d');


    context.fillStyle = "black";
    context.fillRect(0, 0, destinationCanvas.width, destinationCanvas.height);

    context.drawImage(document.getElementById(id), 0, 0, destinationCanvas.width, destinationCanvas.height);

    return destinationCanvas.toDataURL({format: 'image/png'}).split("base64,")[1];
  }

  export default {
    name: 'dream',
    data () {
      return {
        updating: false,
        exportDialog: false,
        resEnabled: false,
        exportKeywords: [],
        colors: {
          hex: '#194d33',
          hsl: {
            h: 150,
            s: 0.5,
            l: 0.2,
            a: 1
          },
          hsv: {
            h: 150,
            s: 0.66,
            v: 0.30,
            a: 1
          },
          rgba: {
            r: 25,
            g: 77,
            b: 51,
            a: 1
          },
          a: 1
        }
      }
    },
    mounted() {
      let lastUpdate = Date.now();

      canvas_sketch = new fabric.Canvas('editor_sketch', {isDrawingMode: true});
      canvas_sketch.backgroundColor = null;
      canvas_sketch.freeDrawingBrush.width = 10;
      canvas_sketch.freeDrawingBrush.color = '#d3d3d3'

      canvas_sketch.on({
        'mouse:down': () => {
          this.updating = true;
        },
        'mouse:move': () => {
          if (this.updating) {
            if (Date.now() - lastUpdate >= 500) {
              socket.emit('draw',
                exportData("#editor_sketch"), exportData("#editor_color"))
              lastUpdate = Date.now();
            }
          }
        },
        'mouse:up': () => {
          if (this.updating) {
            socket.emit('draw',
              exportData("#editor_sketch"), exportData("#editor_color"))
            this.updating = false;
          }
        }
      })

      canvas_color = new fabric.Canvas('editor_color', {isDrawingMode: true});
      canvas_color.backgroundColor = null;
      canvas_color.freeDrawingBrush.width = 10;

      canvas_color.on({
        'mouse:down': () => {
          this.updating = true;
        },
        'mouse:move': () => {
          if (this.updating) {
            if (Date.now() - lastUpdate >= 500) {
              socket.emit('draw',
                exportData("#editor_sketch"), exportData("#editor_color"))
              lastUpdate = Date.now();
            }
          }
        },
        'mouse:up': () => {
          if (this.updating) {
            socket.emit('draw',
              exportData("#editor_sketch"), exportData("#editor_color"))
            this.updating = false;
          }
        }
      })

      socket = SocketIO('http://127.0.0.1:5000/data');

      socket.on('connect', () => {
        console.log("Connected.")

        socket.emit('resetCanvas');

        socket.emit('draw', null, null)
      });

      socket.on("frame", (data) => {
        $(".img").attr('src', "data:image/jpg;base64," + data);
        $("#design").attr('src', "data:image/jpg;base64," + data);
        socket.emit('draw', null, null)

      });

      socket.on('disconnect', () => {
      })
    },
    methods: {
      onColorChange(val) {
        this.colors = val;
        canvas_color.freeDrawingBrush.color = val.hex;
      },
      exportDesign() {
        const self = this;

        this.exportDialog = true;

        const payload = atob(scaleBitmap("design"));

        var ab = new ArrayBuffer(payload.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < payload.length; i++) {
          ia[i] = payload.charCodeAt(i);
        }

        var formData = new FormData();
        formData.append('noise', 2);
        formData.append('scale', 2);
        formData.append('file', new Blob([ab], {type: 'image/jpeg'}));

        self.resEnabled = false;
        $("#superRes").attr('src', '');

        this.$http.post('http://cors-anywhere.herokuapp.com/http://waifu2x.udp.jp/api',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'X-Requested-With': 'http://www.treehacks.com'
            }
          }).then((res) => {
          res = res.body;
          var a = new FileReader();
          a.onload = (e) => {
            $("#superRes").attr('src', e.target.result);
            self.resEnabled = true;
          }
          a.readAsDataURL(res);
        })

        self.exportKeywords = []
        this.$http.post('https://vision.googleapis.com/v1/images:annotate?key=AIzaSyAqUI5qbMQj8eet6SkyLYpIm8mdB86p2U4', {
          requests: [
            {
              image: {
                content: scaleBitmap("design", 512)
              },
              features: [{
                type: 'LABEL_DETECTION',
                maxResults: 10,
              }]
            }
          ]
        }).then((data) => {
          data = _.map(data.body.responses[0].labelAnnotations, 'description');
          self.exportKeywords = data;
          console.log(data);
        })
      }
    },
    components: {'chrome-color': Photoshop, 'card-modal': CardModal}
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

  .canvas-container {
    display: inline-block;
    alignment: center;
    position: relative;
    z-index: 20;
    border: 1px solid black;
  }

  #dream {
    margin-top: 80px;
  }

  .img {
    position: absolute;
    z-index: 2;
    width: 368px;
    height: 368px;
  }

  #design {
    width: 64px;
    height: 64px;
  }

  .overlay-container {
    display: inline-block;
    width: 368px;
    height: 368px;
    background: black;
    position: relative;
  }
</style>
