const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
    name: 'help',
    desc: 'Displays the help menu with all commands.',
    aliases: ['menu', 'commands'],
    category: 'General',
    cooldown: 10,
    dmUser: true,
    permission: 0,
    run: async ({ m, sock, args }) => {
        const loadingMsg = await sock.sendMessage(m.chat, { 
            text: '```Loading menu...```' 
        });
        
        try {
            const commandsFolder = path.resolve(__dirname);
            const commandFiles = fs.readdirSync(commandsFolder).filter(file => 
                file.endsWith('.js')
            );
            
            const commands = {};
            const categories = {};
            let totalCommands = 0;
            
            commandFiles.forEach(file => {
                try {
                    const command = require(path.join(commandsFolder, file));
                    if (command.name) {
                        commands[command.name] = command;
                        const category = command.category || "General";
                        if (!categories[category]) categories[category] = [];
                        categories[category].push({
                            name: command.name,
                            desc: command.desc || "No description"
                        });
                        totalCommands++;
                        
                        if (command.aliases) {
                            command.aliases.forEach(alias => {
                                commands[alias] = command;
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Error loading command from ${file}:`, err);
                }
            });
            
            if (args.length > 0) {
                const cmdName = args[0].toLowerCase();
                const command = commands[cmdName];
                
                if (command) {
                    const prefix = global.prefix || '/';
                    const usage = command.usage ? `${prefix}${command.name} ${command.usage}` : `${prefix}${command.name}`;
                    
                    let cmdInfo = `╭────❒ *📋 COMMAND INFO* ❒
├⬡ *Name:* ${command.name}
├⬡ *Description:* ${command.desc || "No description"}
├⬡ *Category:* ${command.category || "General"}
├⬡ *Usage:* ${usage}`;

                    if (command.aliases && command.aliases.length > 0) {
                        cmdInfo += `\n├⬡ *Aliases:* ${command.aliases.join(', ')}`;
                    }
                    
                    cmdInfo += `\n├⬡ *Cooldown:* ${command.cooldown || 0}s`;
                    cmdInfo += `\n├⬡ *Permission:* ${getPermissionText(command.permission || 0)}`;
                    cmdInfo += `\n├⬡ *DM Allowed:* ${command.dmUser ? "Yes" : "No"}`;
                    cmdInfo += `\n╰────────────❒`;
                    
                    await sock.sendMessage(m.chat, {
                        text: cmdInfo,
                        edit: loadingMsg.key,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true
                        }
                    });
                    return;
                } else {
                    await sock.sendMessage(m.chat, {
                        text: `⚠️ Command "${cmdName}" not found. Use ${global.prefix || '/'}help to see all available commands.`,
                        edit: loadingMsg.key
                    });
                    return;
                }
            }
            
            const userName = m.pushName || (m.sender ? m.sender.split('@')[0] : "User");
            const uptime = formatUptime(process.uptime());
            const ramUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
            
            let helpMessage = `╭─❒ *EF-PRIME-MD V2* ❒
├⬡ 👤 User: @${userName}
├⬡ ⚙️ Version: 2.0.0
├⬡ ⏱️ Uptime: ${uptime}
├⬡ 🌐 Prefix: ${global.prefix || '/'}
├⬡ ⚡ Server: Active
├⬡ 🔋 RAM: ${ramUsage}MB
╰────────────❒\n\n`;

            const sortedCategories = Object.keys(categories).sort((a, b) => {
                if (a === "General") return -1;
                if (b === "General") return 1;
                if (a === "Owner") return 1;
                if (b === "Owner") return -1;
                return a.localeCompare(b);
            });

            sortedCategories.forEach(category => {
                const emoji = getCategoryEmoji(category);
                helpMessage += `╭────❒ *${emoji} ${category}* ❒\n`;
                
                categories[category].sort((a, b) => a.name.localeCompare(b.name));
                
                categories[category].forEach(cmd => {
                    helpMessage += `├⬡ ${cmd.name}\n`;
                });
                
                helpMessage += `╰────────────❒\n\n`;
            });
            
            helpMessage += `╭────────────❒
├⬡ Total Commands: ${totalCommands}
├⬡ Current bot prefix: ${global.prefix || '/'}
╰────────────❒\n\n`;
            
            helpMessage += `BOT BY L A W K E Y 🇳🇬`;
            
            await sock.sendMessage(m.chat, {
                text: helpMessage,
                edit: loadingMsg.key,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363419090892208@newsletter',
                        newsletterName: "MARVLUZ BoT",
                        serverMessageId: 143
                    },
                    externalAdReply: {
                        title: 'Lawkey Marvelous',
                        body: 'ULTRoN by Dev Lawkey Marvelous',
                        thumbnailUrl: 'https://files.catbox.moe/oifwcm.jpg',
                        sourceUrl: 'Frankdevinc.com',
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        showAdAttribution: false
                    }
                }
            });
            
            setTimeout(() => {
                sock.sendMessage(m.chat, {
                    text: `*TIP:* Use \`${global.prefix || '/'}help <command>\` to see detailed info about a specific command.`
                });
            }, 1000);
            
        } catch (error) {
            console.error('Error in help command:', error);
            await sock.sendMessage(m.chat, {
                text: '⚠️ An error occurred while loading the help menu.',
                edit: loadingMsg.key
            });
        }
    },
};

function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds -= days * 24 * 60 * 60;
    const hours = Math.floor(seconds / (60 * 60));
    seconds -= hours * 60 * 60;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    seconds = Math.floor(seconds);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getCategoryEmoji(category) {
    const emojis = {
        'General': '🤖',
        'Media': '🎵',
        'Group': '👥',
        'Fun': '🎮',
        'Converter': '🔄',
        'Search': '🔍',
        'AI': '🤔',
        'Stickers': '🎭',
        'Tools': '🛠️',
        'Download': '📥',
        'Owner': '👑',
        'Anime': '🌸',
        'Education': '📚',
        'Games': '🎲',
        'Economy': '💰',
        'Audio': '🔊',
        'Image': '🖼️'
    };
    
    return emojis[category] || '📌';
}

function getPermissionText(permLevel) {
    switch(permLevel) {
        case 0: return "Everyone";
        case 1: return "Admin";
        case 2: return "Owner";
        default: return "Unknown";
    }
}