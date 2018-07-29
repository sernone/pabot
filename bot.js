var Discord = require("discord.js");
var auth = require("./auth.json");
var client = new Discord.Client();

var botCmds = [["!role", "Adds a fan role to a user eg: !role pubg"]];

client.on("ready", () => {
  console.log(client.user.username + " - (" + client.user.id + ") Connected");
  var channel = client.channels.find("name", "role-call");
  channel.send(
    "Hello AcePack! I'am ready for you now, use ! to call to me. Right now my available commands are:"
  );
  botCmds.forEach(cmd => {
    channel.send("Command: " + cmd[0] + " - " + cmd[1]);
  });
});

client.on("message", message => {
  if (message.channel.name == "role-call") {
    var msgChat = message.content;
    if (msgChat.substring(0, 1) == "!") {
      var cmd = msgChat.substring(1, msgChat.indexOf(" "));
      var arg = msgChat.substring(msgChat.indexOf(" ") + 1);

      switch (cmd) {
        case "role":
          if (!arg.toLowerCase().endsWith(" fan")) arg = arg + " fan";
          var fanRoles = message.guild.roles.array();
          fanRoles = fanRoles.filter(fanRole => fanRole.name.endsWith(" Fan"));

          var roleToAdd = message.guild.roles.filter(
            fanRole => fanRole.name.toLowerCase() == arg.toLowerCase()
          );
          if (roleToAdd.size == 1 && roleToAdd.first() != undefined) {
            var memeber = message.member;
            var addingRole = roleToAdd.first();
            if (!memeber.roles.has(addingRole)) {
              memeber
                .addRole(addingRole)
                .then(
                  message.reply(
                    "Success - Role " +
                      addingRole +
                      " has been added given to you"
                  )
                )
                .catch(err => {
                  message.channel.send(
                    "An error occured please contact an admin to have them check the error. Apologies we'll get this fixed soon!"
                  );
                  console.error(err);
                });
            }
          } else {
            message.channel.send(
              "Error: Role " +
                arg.toLowerCase() +
                " not found. Check available roles and try again or contact an admin. Available Roles are: " +
                fanRoles.join()
            );
          }
          break;
        case '!':
          message.channel.send(
            "All commands require argements, the command you used is missing an argument"
          );
        break;
        default:
          message.channel.send(
            "Invalid command, available commands are: !role"
          );
          break;
      }
    }
  }
});

client.login(auth.token);