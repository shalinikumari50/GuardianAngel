const Discord = require("discord.js");
require("dotenv").config();
require("@tensorflow/tfjs");

const client = new Discord.Client();
const toxicity = require("@tensorflow-models/toxicity");
const threshold = 0.9;
let model;

client.on("ready", async () => {
  model = await toxicity.load(threshold);
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
  //   if (msg.content === 'ping') {
  //     msg.reply('Pong!');
  //   }
  if (msg.author.bot) return;

  text = msg.content;

  // Load the model. Users optionally pass in a threshold and an array of
  // labels to include.
  let predictions = await model.classify(text);
  predictions.forEach((element) => {
    if (element.results[0].match) {
      msg.reply(
        `⚠️Warning!⚠️ Found ${element.label} in your previous message. Please delete it.❌`
      );
    }
  });
});

client.login(process.env.TOKEN);
