var Discord = require("discord.js");
var auth = require("./auth.json");
var https = require("https");
var fs = require("fs");
var schedule = require("node-schedule");
var client = new Discord.Client();

var botCmds = [
  ["!role roleName", "Adds a fan role to a user eg: !role pubg"],
  [
    "!checkin timeToStream",
    "For PATV Members only to checkin to their stream for the day"
  ],
  [
    "!streamtoday",
    "Outputs who is streaming and what time they are streaming on the PATV Channel"
  ],
  [
    "?help",
    "All ? prefix commands control the music bot attached to me, use ?help to get a list of commands for it."
  ]
];
var sentLive = false;

schedule.scheduleJob("0 5 * * *", () => {
  fs.writeFileSync("./streamer-schedule.json", "{}");
});

client.on("ready", () => {
  console.log(client.user.username + " - (" + client.user.id + ") Connected");
  var channel = client.channels.find("name", "role-call");
  channel.send(
    "Hello AcePack! I'am ready for you now, use ! to call to me. Right now my available commands are:"
  );
  botCmds.forEach(cmd => {
    channel.send("Command: " + cmd[0] + " - " + cmd[1]);
  });

  setInterval(checkStream, 60000, "polaracetv");
});

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