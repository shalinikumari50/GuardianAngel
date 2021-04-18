const Discord = require("discord.js");
require("dotenv").config();
require("@tensorflow/tfjs");

const client = new Discord.Client();
const toxicity = require("@tensorflow-models/toxicity");
const threshold = 0.8;
let model;


const emojiMap = {
  identity_attack: "🐟",
  insult: "👊",
  obscene: "🤪",
  threat: "🤯",
  toxicity: "🧨",



};
const users = {};

async function kickBaddie(user, guild) {
  const member = guild.member(user);
  if (!member) return;
  try {
    await member.kick("Was a jerk");
  } catch (err) {
    console.log(`Could not kick user ${user.username}: ${err}`);
  }
}

function getKarma() {
  const scores = [];
  for (const user in users) {
    if (!Object.keys(users[user]).length) continue;
    let score = `<@${user}> - `;
    for (const attr in users[user]) {
      score += `${emojiMap[attr]} : ${users[user][attr]}\t`;
    }
    scores.push(score);
  }
  console.log(scores);
  if (!scores.length) {
    return "";
  }
  return scores.join("\n");
}


client.on("ready", async () => {
  model = await toxicity.load(threshold);
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {

  if (msg.author.bot) return;

  text = msg.content;
 
  const userid = msg.author.id;
  if (!users[userid]) {
    users[userid] = [];
  }
 
  let predictions = await model.classify(text.toLowerCase());
  predictions.forEach((element) => {
    if (element.results[0].match) {
      
      msg.reply(
        `Warning! Found ${element.label} in your previous message. Please delete it.`
      );
      msg.react(emojiMap[element.label]);
      users[userid][element.label] = users[userid][element.label]
            ? users[userid][element.label] + 1
            : 1;
      
    
    }
  });
  
  let shouldKick = false;
  try {
    shouldKick = users[userid]["toxicity"] > process.env.KICK_THRESHOLD;
  } catch (err) {
    console.log(err);
  }
  if (shouldKick) {
    kickBaddie(msg.author, msg.guild);
    delete users[msg.author.id];
    msg.channel.send(`Kicked user ${msg.author.username} from channel`);
    return;
  }

  if (msg.content.startsWith("!karma")) {
    const karma = getKarma(msg);
    msg.channel.send(karma ? karma : "No karma yet!");
  }

});

client.login(process.env.TOKEN);
