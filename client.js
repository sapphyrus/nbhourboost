var Steam = require('steam');
var fs = require('fs');

var accounts = [];
var delay = 50;

fs.readFile('accounts.txt', 'utf-8', (err, data) => {
    if (err) throw err;
    accounts = [];
    data.trim().split("\n").forEach(function(line) {
        account = line.trim().split(":");
        account[2] = account[2].split(",").map(function(game) {
			return {
				game_id: parseInt(game, 10)
			};
		});
        accounts.push(account);
    })
    console.log("Loaded %s accounts", accounts.length);

    accounts.forEach(function(account, i) {

        var steamClient = new Steam.SteamClient();
        var steamUser = new Steam.SteamUser(steamClient);
        var steamFriends = new Steam.SteamFriends(steamClient);

        setTimeout(function() {
            console.log("[%s] - Logging in.", account[0]);

            steamClient.connect();
            steamClient.on('connected', () => {
                steamUser.logOn({
                    account_name: account[0],
                    password: account[1],
                });
            });

            steamClient.on('logOnResponse', (logonResp) => {
                if (logonResp.eresult == Steam.EResult.OK) {

                    steamFriends.setPersonaState(Steam.EPersonaState.Offline);
                    steamUser.gamesPlayed({
                        games_played: account[2]
                    });

					console.log("[%s] - Active Games and online status set. (%s)", account[0], JSON.stringify(account[2]));
                }
            });

            steamClient.on("error", (error) => {
                console.log("[%s] - error: %s (Reconnecting in 5 minutes)", account[0], error.message);
                setTimeout(function() {
                    console.log("[%s] - Reconnecting...", account[0]);
                    steamClient.connect();
                }, 5*60000)
            });
        }, delay * i);
    })
});
