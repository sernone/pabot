var Discord = require('discord.js');
var auth = require('./auth.json');
var client = new Discord.Client();

var botCmds = [
    ['!role','Adds a fan role to a user eg: !role pubg']
];

client.on("ready", () => {
    console.log(client.user.username +  ' - ('+ client.user.id +') Connected');
    var channel = client.channels.find('name','role-call');
    channel.send("Hello AcePack! I'am ready for you now, use ! to call to me. Right now my available commands are:");
    botCmds.forEach(cmd => {
        channel.send('Command: ' + cmd[0] + ' - ' + cmd[1]);
    });
});

  client.on("message", (message) => {
    if(message.channel.name == "role-call") {
        if(message.content.substring(0,1) == "!") {
            var args = message.content.substring(1).split(' ');
            var cmd = args[0];

            var role = args.splice(1);
            switch(cmd){
                case 'role':
                    if(role.length == "1") {
                        role = role + " Fan";
                        var fanRoles = message.guild.roles.array();
                        fanRoles = fanRoles.filter(fanRole => fanRole.name.endsWith(' Fan'));

                        var roleToAdd = message.guild.roles.filter(fanRole => fanRole.name.toLowerCase() == role.toLowerCase());
                        if(roleToAdd.size == 1 && roleToAdd.first() != undefined){
                            var memeber = message.member;
                            var addingRole = roleToAdd.first();
                            if(!memeber.roles.has(addingRole)) {
                                memeber.addRole(addingRole)
                                .then(message.reply("Success - Role " + addingRole + " has been added given to you"))
                                .catch(err => {
                                    message.channel.send("An error occured please contact an admin to have them check the error. Apologies we'll get this fixed soon!");
                                    console.error(err);
                                });
                            }
                        } else {
                            message.channel.send("Error: Role " + role + " not found. Check available roles and try again or contact an admin. Available Roles are: " + fanRoles.join());
                        }
                    } else {
                        message.channel.send('Error: Invalid command length, expected 1 argument after role is called. Just use !role and the game name eg: !role pubg');
                    }
                break;
                default:
                    message.channel.send('Invalid command, available commands are: !role');
                break;
            }
        }
    }
  });

  client.login(auth.token);