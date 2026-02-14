const ffmpeg = require('ffmpeg-static');
// El bot ahora usará la ruta que 'ffmpeg-static' le proporcione automáticamente.
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
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
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

        // Búsqueda simplificada
        let info = await play.search(args, { limit: 1 });
        if (info.length === 0) return message.reply('❌ No encontré nada.');

        message.channel.send(`🚀 Cargando: **${info[0].title}**...`);

      let stream = await play.stream(info[0].url, {
    discordPlayerCompatibility: true,
    quality: 0 // Esto baja la calidad al mínimo para que cargue instantáneamente
});
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type
        });

        const player = createAudioPlayer();
        player.play(resource);
        connection.subscribe(player);

        message.reply(`🎶 Reproduciendo: **${info[0].title}**`);

        player.on('error', error => {
            console.error(`Error de audio: ${error.message}`);
        });

    } catch (error) {
        console.error("Error en el comando:", error);
        message.reply('❌ Hubo un problema al conectar. Intenta de nuevo.');
    }
});

client.login(process.env.TOKEN);