const {
    Client,
    Events,
    GatewayIntentBits,
} = require('discord.js');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
} = require('@discordjs/voice');
const playYotube = require('play-dl')
const ytpl = require('ytpl');
// const { addSpeechEvent } = require("discord-speech-recognition");

const { config } = require('./config');

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

let player = null;
let connection = null;
let queue = [];

const initPlayer = () => {
    console.log('WARNING: Player creating started ...');

    // addSpeechEvent(bot);

    player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    });

    console.log('WARNING: Player creating finished');
};

const play = async (url, message) => {
    try {
        const stream = await playYotube.stream(url);
        const info = await playYotube.video_basic_info(url);
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type
        });

        player.play(resource);
        connection.subscribe(player);
        message.channel.send(info.video_details.title);
        console.log(`WARNING: Current - ${info.video_details.title}`);
    } catch (error) {
        console.log(`ERROR: [play] ${error}`);
    }
}

bot.on(Events.ClientReady, (e) => {
    try {
        console.log(`WARNING: Ready! Logged in as ${e.user.tag}`);
        initPlayer();
    } catch (error) {
        console.log(`ERROR: [onReady] ${error}`);
    }
});

bot.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

    const { voice } = message.member;

    if (!voice.channelId) return;

    const splitted = message.content.split(' ');

    if (!connection) {
        try {
            connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator
            });
            
            console.log(`WARNING: Joined to voice channel`);
        } catch (error) {
            console.log(`ERROR: [connection] ${error}`);
        }
    }
    
    if (splitted[0] === `${config.prefix}play`) {
        try {
            if (splitted[1].includes('playlist')) {
                const result = await ytpl(message.content);
    
                queue.push(...result.items.map((item) => item.url));
                console.log(`WARNING: Pushed to queue from playlist`);
            } else {
                queue.push(splitted[1]);
                console.log(`WARNING: Pushed to queue`);
            }
    
            if (player.state.status !== AudioPlayerStatus.Playing) {
                play(queue[0], message);
    
                player.on(AudioPlayerStatus.Idle, () => {
                    console.log(`WARNING: Song is finished`);
                    queue.shift();
        
                    if (queue[0]) play(queue[0], message);
                });
            }
        } catch (error) {
            console.log(`ERROR: [play] ${error}`);
        }
    }

    if (splitted[0] === `${config.prefix}skip`) {
        try {
            console.log(`WARNING: Skip is started`);
            queue.shift();
            play(queue[0], message);
            console.log(`WARNING: Skip is finished`);
        } catch (error) {
            console.log(`ERROR: [skip] ${error}`);
        }
    }

    if (splitted[0] === `${config.prefix}stop`) {
        try {
            console.log(`WARNING: Stop is started`);
            connection.destroy();
            connection = null;
            queue = [];
            console.log(` WARNING: Stop is started`);
        } catch (error) {
            console.log(`ERROR: [stop] ${error}`);
        }
    }
});

// bot.on("speech", (msg) => {
//     console.log(msg);
//     // If bot didn't recognize speech, content will be empty
//     if (!msg.content) return;
  
//     console.log(msg);
// });

bot.login(config.token);
