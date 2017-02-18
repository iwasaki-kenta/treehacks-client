<template xmlns:v-on="http://www.w3.org/1999/xhtml">
  <div class="content">
    <span>{{statusText()}}</span> <br/><a class="button" v-on:click="listen">{{status == 0 ? "Listen" : "Stop"}}</a>
    <br/><br/>
    <textarea class="textarea" placeholder="Messages go here...">{{message}}</textarea>
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
      return {status: 0, message: ""}
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
            websocket.onerror = function (event) {
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
//                textDisplay = text + " ";
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
