var Discord = require("discord.js");
var auth = require("./auth.json");
var https = require("https");
var fs = require("fs");
var schedule = require("node-schedule");
var client = new Discord.Client();

var botCmds = [
  [
    "!role roleName",
    "Adds a fan role to a user eg: !role pubg. This can only be called from the #role-call channel."
  ],
  [
    "!checkin timeToStream",
    "For PATV Members only to checkin to their stream for the day. This can only be called from the #patv-streamer channel."
  ],
  [
    "!streamtoday",
    "Outputs who is streaming and what time they are streaming on the PATV Channel"
  ],
  [
    "?help",
    "All ? prefix commands control the music bot attached to me, use ?help to get a list of commands for it. Please call this from the #bot-spam Channel."
  ]
];
var sentLive = false;

schedule.scheduleJob("0 5 * * *", () => {
  fs.writeFileSync("./streamer-schedule.json", "{}");
});

try {
  client.on("ready", () => {
    console.log(client.user.username + " - (" + client.user.id + ") Connected");

    var channel = client.channels.find("name", "role-call");
    var fanRoles = channel.guild.roles.filter(fanRole =>
      fanRole.name.endsWith(" Fan")
    );

    channel.send(
      "Hello AcePack! Are you a fan of a game and want to participate in events for the game and upto date with the team?! \
Say no more use one of the below fan roles with the command !role and the name of the game or fan role you would like!"
    );

    roleOutput = "";

    fanRoles.forEach(r => {
      roleOutput += r.name + "\n";
    });
    channel.send(roleOutput);

    setInterval(checkPackRole, 60000);
    setInterval(checkStream, 60000, "polaracetv");
  });
}
catch(err) {
  throw err.message;
}

client.on("message", message => {
  var msgChat = message.content;
  if (msgChat.substring(0, 1) == "!") {
    var cmd =
      msgChat.substring(1, msgChat.indexOf(" ")) !== "!"
        ? msgChat.substring(1, msgChat.indexOf(" "))
        : msgChat.substring(1);
    var arg = msgChat.substring(msgChat.indexOf(" ") + 1);

    switch (cmd.toLowerCase()) {
      case "checkin":
        if (message.channel.name == "patv-streamers") {
          if (arg.substring(1) !== cmd) {
            var streamer = message.author.username;
            var sch = JSON.parse(
              fs.readFileSync("./streamer-schedule.json", "utf8")
            );
            sch[streamer] = arg;
            fs.writeFileSync("./streamer-schedule.json", JSON.stringify(sch));
            message.reply("You have checked to stream today for " + arg);
          } else
            message.channel.send(
              "Hey streamer!, the !checkin command requires you put when your steaming please!:"
            );
        }
        break;
      case "streamtoday":
        var sch = "";
        var data = JSON.parse(
          fs.readFileSync("./streamer-schedule.json", "utf8")
        );
        for (streamer in data) {
          sch +=
            streamer + " is set to stream " + data[streamer] + " today. \n";
        }

        message.channel.send(sch);
        break;
      case "role":
        if (message.channel.name == "role-call") {
          if (arg.substring(1) !== cmd) {
            if (!arg.toLowerCase().endsWith(" fan")) arg = arg + " fan";
            var fanRoles = message.guild.roles.array();
            fanRoles = fanRoles.filter(fanRole =>
              fanRole.name.endsWith(" Fan")
            );

            message.delete(10000);

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
                    message.channel.send(
                      "Success - Role " +
                        addingRole +
                        " has been added given to you"
                    )
                    .then(msg => {
                      msg.delete(10000)
                    })
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
          } else
            message.channel.send(
              "The !role command requires a fan role after it. Please include the role you're looking for after the command."
            );
        }
        break;
        case "help":
          botCmds.forEach(cmd => {
            message.channel.send("Command: " + cmd[0] + " - " + cmd[1]);
          });
        break;
      default:
        message.channel.send(
          "Invalid command, available commands are: !role, !checkin, !streamtoday"
        );
        break;
    }
  }
});

client.login(auth.token);

//Other functions

function checkPackRole(){
  var polarServer = client.guilds.find(serv => {
    if(serv.name === 'SernBot Test' && serv.verified !== true) return serv
  })
  var packRole = polarServer.roles.find('name','The Pack');
  polarServer.members.find(mem => {
    if(!mem.roles.exists('id', packRole.id)) {
      //mem.addRole(packRole, "PolarBot added The Pack Role to this user.");
    }
  })
}

function checkStream(twitchUser) {
  var http_options = {
    host: "api.twitch.tv",
    path: "/helix/streams?user_login=" + twitchUser,
    method: "GET",
    headers: {
      "Client-ID": "btwox7o0tmnpqupua8xwj8rxrt94x7"
    }
  };
  https.get(http_options, resp => {
    var data = "";

    resp.on("data", chunk => {
      data += chunk;
    });

    resp.on("end", () => {
      var chanData = JSON.parse(data);
      chanData = chanData.data;

      if (chanData.length > 0) {
        if (!sentLive) {
          var disChan = client.channels.find(
            "name",
            "stream-and-media-sharing"
          );
          disChan.send(
            "We are LIVE here https://twitch.tv/" +
              twitchUser +
              " , Come by and check us out!"
          );
          disChan.send(chanData[0].title);
          sentLive = true;
        }
      } else {
        sentLive = false;
      }
    });
  });
}