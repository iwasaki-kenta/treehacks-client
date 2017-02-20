# Dream.it - Client

You're walking down the road, and see a belle rocking an exquisite one-piece. "Damn, that would look good on me (or my wife)".

You go home and try to look for it: "beautiful red dress". Google gives you 110,000,000 results in 0.54 seconds. Well that helped a lot. You think of checking the fashion websites, but the number of these e-commerce websites makes you refrain from spending more than a few hours. "This is impossible...". You perseverance only lasts so long - you give up.

Fast forward to 2017. We've got everything from Neural Forests to Adversarial Networks.

You go home to look for it: Launch Dream.it

You make a chicken-sketch of the dress - you just need to get the curves right. You select the pattern on the dress, a couple of estimates about the dress. Dream.it synthesizes elegant dresses based on your sketch. It then gives you search results from different stores based on similar dresses, and an option to get on custom made. You love the internet. You love Dream.it. Its a wonderful place to make your life wonderful.

Sketch and search for anything and everything from shoes and bracelets to dresses and jeans: all at your slightest whim. Dream.it lets you buy existing products or get a new one custom-made to fit you.

## User Experience

Dream.it uses a website as the basic entry point into the service, which is run on a linode server. It has a chatbot interface, through which users can initially input the kind of garment they are looking for with a few details. The service gives the user examples of possible products using the Bing Search API. The voice recognition for the chatbot is created using the Bing Speech to Text API. This is classified using a multiclassifier from IBM Watson Natural Language Classifier trained on custom labelled data into the clothing / accessory category. It then opens a custom drawing board for you to sketch the contours of your clothing apparel / accessories / footwear and add color to it.

Once the sketch is finalized, the image is converted to more detailed higher resolution image using Pixel Recursive Super Resolution.

We then use Google's Label Detection Vision ML and IBM Watson's Vision APIs to generate the most relevant tags for the final synthesized design which give additional textual details for the synthesized design.
The tags, in addition to the image itself are used to scour the web for similar dresses available for purchase

## Behind the Scenes

We used a Deep Convolutional Generative Adversarial Network (GAN) which runs using Theano and cuDNN on CUDA. This is connected to our web service through websockets. The brush strokes from the drawing pad on the website get sent to the GAN algorithm, which sends back the synthesized fashion design to match the user's sketch.
