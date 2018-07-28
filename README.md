# Polar Ace Discord Bot

This is the Discord Bot for Polar Ace, the commands for this bot are as follows
```
!role gameName - This will add the Fan role for the request game to the user
```

> This bot REQUIRES a channel called **`#role-call`** if you do not have this channel on your sever it will not work.

> This bot's role needs to be above any `Fan` roles. Roles to be added by this bot must end in the word ` Fan`.

### Running this bot locally

Bot requires a bot developer token, this was not pushed with the code as its a secret token that should not be shared. If you wish to run this bot on your local PC you need to first create a new application in discord by visiting https://discordapp.com/developers/applications/ and creating the new application and assigning a bot account to the application.

Once the application is created with the bot you need to add a file called `auth.json` and in this file have the below text and replace `YOUR_TOKEN_HERE` with your application bot token.

```
{
    "token":"YOUR_TOKEN_HERE"
}
```

Once you've done that you need to then install all the packages that are need for this by running a `npm install` on your machine in the directory you cloned this repo to. 

Now you have everything you need you just need to run `node bot.js` in the directory to start the bot. Once you started the bot have it join a server by visiting the following link and replace `YOUR_APPLICATION_ID_HERE` with your application id from the application you created on the discord site. This will ask you what server to join your application to. 

```
http://discordapp.com/api/oauth2/authorize?client_id=YOUR_APPLICATION_ID_HERE&scope=bot&permissions=286329856
```

The permissions you see here in this link are a enumerated value based on the current proper permissions this bot will need to run on the server. This will auto create a role for the bot, if you do not want this replace `286329856` with just `0` and assign a role yourself to the bot.