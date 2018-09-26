var Discord = require("discord.js");
var auth = require("./auth.json");
var https = require("https");
var fs = require("fs");
var schedule = require("node-schedule");
var client = new Discord.Client();

var botCmds = [
  [
    "!checkin timeToStream",
    "For PATV Members only to checkin to their stream for the day. This can only be called from the #patv-streamer channel."
  ],
  [
    "!streamtoday",
    "Outputs who is streaming and what time they are streaming on the PATV Channel"
  ],
  [
    "!streamalert add/remove twitchName",
    "'add' or 'remove' alerts when a streamer goes live to the media and sharing channel. Owner or Staff Only Command"
  ],
  [
    "!events",
    "Displays all of the weeks events from our TeamUp Calendar"
  ],
  [
    "!eventtoday",
    "Displays what event is going on Today from the TeamUp Calendar"
  ]
];
var sentLive = false;

schedule.scheduleJob("0 5 * * *", () => {
  fs.writeFileSync("./streamer-schedule.json", "{}");
});

try {
  client.on("ready", () => {
    console.log(client.user.username + " - (" + client.user.id + ") Connected");

    setInterval(checkPackRole, 60000);
    setInterval(checkStream, 60000);
  });
} catch (err) {
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
        checkin(message, arg, cmd);
        break;
      case "streamtoday":
        streamToday(message);
        break;
      case "streamalert":
        streamAlert(message, arg);
        break;
      case "help":
        help(message);
        break;
      case "events":
        var dt = new Date();
        var weekStart = new Date(dt.setDate(dt.getDate() - dt.getDay() + (dt.getDay === 0 ? -6 : 0)));
        var weekEnd = new Date(dt.setDate(dt.getDate() - dt.getDay() + (dt.getDay === 6 ? -1 : 6)));

        var start = weekStart.getFullYear() + '-' + (weekStart.getMonth()+1).toString() + '-' + weekStart.getDate();
        var end = weekEnd.getFullYear() + '-' + (weekEnd.getMonth()+1).toString() + '-' + weekEnd.getDate();

        events(start,end,function(allEvents){
          message.channel.send("__**Here's a list of Upcoming PolarAce Events This Week!**__\nTo see our entire calendar of upcoming and past events check it out here ! https://teamup.com/kse85f2w1dp59ydxgj\n\n");
          var weekDays = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
          for(var i in allEvents.events) {
            var eventStart = new Date(allEvents.events[i].start_dt);
            var eventTitle = allEvents.events[i].title;
            var notes = (allEvents.events[i].notes !== null ? allEvents.events[i].notes : "No additional info");

            message.channel.send("**Starting:** " + weekDays[eventStart.getDay()] + " " + eventStart.toLocaleString() + "\n**Event:** " + eventTitle + "\n**Info:** " + notes + "\n\n");
          }
        });
        break;
      case "eventtoday":
        events(null,null,function(todayEvent){
          if(todayEvent.events.length > 0) {
            var event = todayEvent.events[0];
            var eventStart = new Date(event.start_dt);
            var eventTitle = event.title;
            var notes = (event.notes !== null ? event.notes : "No additional info");

            message.channel.send("__**Here's what's going on with PolarAce Today!**__\nTo see our entire calendar of upcoming and past events check it out here ! https://teamup.com/kse85f2w1dp59ydxgj\n\n");
            message.channel.send("**Starting:** " + eventStart.toLocaleTimeString() + "\n**Event:** " + eventTitle + "\n**Info:** " + notes + "\n\n");
          }
        });
        break;
      default:
        if (msgChat.match(/^[!][a-zA-Z]+$/)) {
          message.channel.send(
            "Invalid command, available commands are: !role, !checkin, !streamtoday, !streamalert, !events, !eventtoday"
          );
        }
        break;
    }
  }
});

client.login(auth.token);

//Call functions
function checkin(msg, arg, cmd) {
  if (msg.channel.name == "patv-streamers") {
    if (arg.substring(1) !== cmd) {
      var streamer = msg.author.username;
      var sch = JSON.parse(fs.readFileSync("./streamer-schedule.json", "utf8"));
      sch[streamer] = arg;
      fs.writeFileSync("./streamer-schedule.json", JSON.stringify(sch));
      msg.reply("You have checked to stream today for " + arg);
    } else
      msg.channel.send(
        "Hey streamer!, the !checkin command requires you put when your steaming please!:"
      );
  }
}

function streamToday(msg) {
  var sch = "";
  var data = JSON.parse(fs.readFileSync("./streamer-schedule.json", "utf8"));
  for (streamer in data) {
    sch += streamer + " is set to stream " + data[streamer] + " today. \n";
  }

  msg.channel.send(sch);
}

function streamAlert(msg, arg) {
  if (msg.member.roles.find("name", "Org Staff") || msg.member.roles.find("name", "Owner")) {
    var call = arg.split(" ");
    switch (call[0]) {
      case "add":
        var str = JSON.parse(fs.readFileSync("./streamers.json", "utf8"));
        str[call[1]] = false;
        fs.writeFileSync("./streamers.json", JSON.stringify(str));
        msg.channel.send(call[1] + " has been added to stream live alerts!");
        break;
      case "remove":
        var str = JSON.parse(fs.readFileSync("./streamers.json", "utf8"));
        delete str[call[1]];
        fs.writeFileSync("./streamers.json", JSON.stringify(str));
        msg.channel.send(call[1] + " has been removed to stream live alerts.");
        break;
      default:
        msg.channel.send(
          "Invalid streamer command, please use add or remove for " + call[1]
        );
        break;
    }
  }
}

function events(sd,ed,cb) {
  if(sd !== null) {
    var query = "startDate="+sd+"&endDate="+ed+"&format=markdown";
  } else {
    var query = "format=markdown";
  }

  var http_options = {
    host: "api.teamup.com",
    path: "/"+auth.calendar+"/events?"+query,
    method: "GET",
    headers: {
      "Teamup-Token": auth.teamup
    }
  }

  https.get(http_options, resp => {
    var data = "";

    resp.on("data", chunk => {
      data += chunk;
    });

    resp.on("end", () => {
      cb(JSON.parse(data));
    });
  });
}

function help(msg) {
  botCmds.forEach(cmd => {
    msg.channel.send("**Command**: __" + cmd[0] + "__ - " + cmd[1]);
  });
}

//Other functions

function checkPackRole() {
  var polarServer = client.guilds.find(serv => {
    if (serv.name == "Polar Ace" || serv.name == "SernBot Test") return serv;
  });
  var packRole = polarServer.roles.find("name", "The Pack");
  polarServer.members.find(mem => {
    if (!mem.roles.exists("id", packRole.id)) {
      mem.addRole(packRole, "PolarBot added The Pack Role to this user.");
    }
  });
}

async function checkStream() {
  var str = JSON.parse(fs.readFileSync("./streamers.json", "utf8"));
  await Object.keys(str).forEach(function(twitchUser) {
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

        if (chanData.length > 0 && chanData !== undefined) {
          if (!str[twitchUser]) {
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
            str[twitchUser] = true;
            fs.writeFileSync("./streamers.json", JSON.stringify(str));
          }
        } else {
          str[twitchUser] = false;
          fs.writeFileSync("./streamers.json", JSON.stringify(str));
        }
      });
    });
  });
}
