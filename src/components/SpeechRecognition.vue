<template xmlns:v-on="http://www.w3.org/1999/xhtml">
  <div class="container">
    <div class="level">
      <div class="level-left">
        <div class="level-item">
          <span>{{statusText()}}</span>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <a class="button" v-on:click="listen">{{status == 0 ? "Listen" : "Stop"}}</a>
        </div>
      </div>
    </div>

    <textarea class="textarea" placeholder="Messages go here..." v-model="message"></textarea>
    <br/>

    <code>{{intent}}</code>
    <br/>
  </div>
</template>

<script>
  import Recorder from "./Recorder";

  AudioContext = window.AudioContext || window.webkitAudioContext;

  let audioContext, audioRecorder, audioSource;
  if (AudioContext) {
    audioContext = new AudioContext();
  }

  let websocket;


  function stopRecording(ui) {
    if (ui.status == 2 || ui.status == 1) {
      ui.status = 0;
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
    name: 'voice-recognition',
    data() {
      return {status: 0, message: "", intent: "none"}
    },
    methods: {
      statusText: function () {
        switch (this.status) {
          case 0:
            return "Stopped."
          case 1:
            return "Connecting..."
          case 2:
            return "Speak."
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
                  // TODO: Send to IBM Watson for intent recognition.
                  console.log(this.$http)
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
                    console.log(data)
                  });
                  stopRecording(self);
                }

                console.log(text);
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
          stopRecording(self);
        }
      }
    },
  }
</script>
