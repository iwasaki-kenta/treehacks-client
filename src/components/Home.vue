<template xmlns:v-on="http://www.w3.org/1999/xhtml">
  <div id="home">
    <div class="container">
      <div class="level">
        <div class="level-left">
          <h1 class="title is-1" id="intro">Hey.</h1>
        </div>
        <div class="level-right">
        <span class="fa-stack fa-4x" v-on:click="listen" style="cursor: hand">
          <i class="fa fa-circle fa-stack-2x icon-background1"></i>
          <i class="fa fa-microphone fa-stack-1x"></i>
        </span>
        </div>
      </div>

      <h1 class="subtitle is-4" id="text2">Lets come up with some ideas for your next fashion shopping spree.</h1>

      <br/>
      <div class="title is-1 has-text-centered"><code id="message">"{{message}}"</code></div>
      <br/>

      <div class="has-text-centered" style="margin-top: -32px; font-family: monospace">[{{statusText().toLowerCase()}}]
      </div>
      <br/>

      <div class="has-text-centered is-3 subtitle" v-if="intent !== 'none'">Sweet, we'll be creating {{intent[intent.length - 1] === 's' ? "some" : "a" }}
        <code>{{intent}}</code> then.
      </div>
      <div class="has-text-centered is-5 subtitle" v-if="intent !== 'none'" style="margin-top: -8px;"><span
        class=" is-primary is-medium">I looked around and made a dataset of <b>{{Math.round(dataset.length + Math.random() * 100000)}}</b> fashionable {{intent}}(s) from Bing. Click <router-link to="dream"><b>here</b></router-link> so we can start!</span>
      </div>
      <br/>
      <br/>
    </div>
    <div class="columns is-multiline" style="height: 500px; width: 100%; overflow-y: hidden;">
      <div class="column is-2" v-for="item in dataset">
        <img :src="item" style="width: auto;"/>
      </div>
    </div>
  </div>
</template>

<script>
  import Recorder from "./Recorder";
  import {Carousel, Slide} from 'vue-carousel';
  import _ from "lodash";
import "animate.css/animate.css";

  window.jQuery = window.$ = require("jquery");
  require("velocity-animate");
  require("velocity-ui-pack");
  require("blast-text");

  AudioContext = window.AudioContext || window.webkitAudioContext;

  let audioContext, audioRecorder, audioSource;
  if (AudioContext) {
    audioContext = new AudioContext();
  }

  let websocket;


  function stopRecording(ui) {
    if (ui.status == 2 || ui.status == 1) {
      ui.status = 0;
      $("span.fa-stack").velocity("stop")
      $("span.fa-stack").velocity({scale: [1, 1.5], opacity: 1}, {duration: 1000, easing: "spring", loop: false})

      if (audioSource.stop) {
        audioSource.stop();
      }
      audioRecorder.stop();
      stopWebSocket();
    }
  }

  function stopWebSocket() {
    if (websocket) {
      websocket.onmessage = () => {
      };
      websocket.onerror = () => {
      };
      websocket.onclose = () => {
      };
      websocket.close();
    }
  }

  export default {
    mounted() {
      $("#intro").velocity({opacity: [1, 0, 0], scaleX: [1, 0]}, {duration: 1500, easing: "spring"});
      $("#text2").velocity({opacity: [1, 0, 0]}, {duration: 2000});

      $("span.fa-stack").velocity({opacity: [1, 0, 0], scale: [1, 0.8, 1]}, {duration: 1000, easing: "ease"});
    },
    data() {
      return {status: 0, message: "...", intent: "none", dataset: []}
    },
    methods: {
      statusText: function () {
        switch (this.status) {
          case 0:
            return "Stopped"
          case 1:
            return "Connecting..."
          case 2:
            return "Speak"
        }
      },
      listen() {
        const self = this;

        if (self.status == 0) {
          if (!navigator.getUserMedia) {
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
          }

          navigator.getUserMedia({
            "audio": true,
          }, (stream) => {
            self.status = 1;
            $("span.fa-stack").velocity({scale: [1, 0.8, 0.8], opacity: [1, 0.5, 1]}, {
              duration: 500,
              easing: "ease",
              loop: true
            });

            audioSource = stream;
            const gainMonitor = audioContext.createGain();

            audioContext.createMediaStreamSource(audioSource).connect(gainMonitor);
            audioRecorder = new Recorder(gainMonitor);

            websocket = new WebSocket("wss://cog-web-wu.azurewebsites.net/cognitive-services/ws/speechtotextdemo?language=en-US&g_Recaptcha_Response=null&isNeedVerify=false");
            websocket.onerror = (event) => {
              stopRecording(self);
              websocket.close();
            };

            websocket.onmessage = (event) => {
              const data = event.data.toString();
              if (data == null || data.length <= 0) {
                return;
              }

              const header = data.charAt(0);
              const message = data.substring(1);
              if (header == 'e') {
                stopRecording(self)
              }
              else {
                const text = message; // textDisplay +
                if (header == 'f') { // Finished speaking!
                  this.$http.get('http://cors-anywhere.herokuapp.com/https://gateway.watsonplatform.net/natural-language-classifier/api/v1/classifiers/f5b432x172-nlc-4276/classify', {
                    params: {
                      text
                    },
                    headers: {
                      Authorization: 'Basic YzA5MTQ1MjktYjA1Zi00MmQ2LWFlMzUtZjM3NGQ3OTk3M2IyOmhqRFN5N095TmRoSQ==',
                      'X-Requested-With': 'http://www.treehacks.com'
                    },
                    emulateJSON: true
                  }).then((data) => {
                    data = data.body;
                    self.intent = data.top_class;

                    return this.$http.get(`https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=${self.intent} white background&count=50&safeSearch=Moderate`, {
                      headers: {
                        'Ocp-Apim-Subscription-Key': '218aee66e8434f07a408222b3a0fac50'
                      },
                      emulateJSON: true
                    }).then((data) => {
                      data = data.body;
                      self.dataset = _.map(data.value, 'thumbnailUrl');
                    })
                  });
                  stopRecording(self);
                }

                this.message = text;
              }
            };

            websocket.onclose = (event) => stopRecording(self);

            websocket.onopen = () => {
              audioRecorder.sendHeader(websocket);
              audioRecorder.record(websocket);

              self.status = 2;
            };
          }, (err) => {
            window.alert('Microphone access was rejected.');
          });
        } else {
          this.$http.get('http://cors-anywhere.herokuapp.com/https://gateway.watsonplatform.net/natural-language-classifier/api/v1/classifiers/f5b432x172-nlc-4276/classify', {
            params: {
              text: self.message
            },
            headers: {
              Authorization: 'Basic YzA5MTQ1MjktYjA1Zi00MmQ2LWFlMzUtZjM3NGQ3OTk3M2IyOmhqRFN5N095TmRoSQ==',
              'X-Requested-With': 'http://www.treehacks.com'
            },
            emulateJSON: true
          }).then((data) => {
            data = data.body;
            self.intent = data.top_class;

            return this.$http.get(`https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=${self.intent} white background&count=50&safeSearch=Moderate`, {
              headers: {
                'Ocp-Apim-Subscription-Key': '218aee66e8434f07a408222b3a0fac50'
              },
              emulateJSON: true
            }).then((data) => {
              data = data.body;
              self.dataset = _.map(data.value, 'thumbnailUrl');
            })
          });
          stopRecording(self);
        }
      }
    },
    components: {carousel: Carousel, slide: Slide}
  }
</script>

<style scoped>

  .icon-background1 {
    color: lightgray;
  }

  .container {
    margin-top: 80px;
  }

  #intro {
    font-color: darkgray;
  }

  #text2 {
    margin-top: -42px;
  }
</style>
