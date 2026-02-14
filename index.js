const { Client, GatewayIntentBits } = require('discord.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    getVoiceConnection,
    VoiceConnectionStatus,
    entersState
} = require('@discordjs/voice');
const play = require('play-dl');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

// 🔊 Creamos UN solo reproductor global
const player = createAudioPlayer();

client.once('ready', () => {
    console.log(`✅ ¡DJ Online como ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!play')) return;

    const args = message.content.slice(6).trim();
    if (!args) return message.reply('❌ ¡Dime qué canción quieres!');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('❌ ¡Entra a un canal de voz primero!');

    try {
        // Si ya hay conexión anterior la eliminamos
        const oldConnection = getVoiceConnection(message.guild.id);
        if (oldConnection) oldConnection.destroy();

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

        // 🔥 MUY IMPORTANTE: Esperar a que la conexión esté lista
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

        let info = await play.search(args, { limit: 1 });
        if (info.length === 0) return message.reply('❌ No encontré nada.');

        await message.channel.send(`🚀 Cargando: **${info[0].title}**...`);

        let stream = await play.stream(info[0].url, {
            discordPlayerCompatibility: true,
            quality: 2
        });

        const resource = createAudioResource(stream.stream, {
            inputType: stream.type,
        });

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Playing, () => {
            console.log(`🎵 Reproduciendo: ${info[0].title}`);
        });

        player.on('error', error => {
            console.error(`❌ Error del reproductor: ${error.message}`);
            connection.destroy();
        });

    } catch (error) {
        console.error(error);
        message.reply('❌ Error al reproducir. Intenta de nuevo.');
    }
});

client.login(process.env.TOKEN);


