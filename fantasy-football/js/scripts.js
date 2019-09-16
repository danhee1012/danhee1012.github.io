/* Classes */
class Player {
    constructor(pid, name, order) {
        this.pid   = pid;
        this.name  = name;
        this.order = order;
    }
}

class PlayerStat {
    constructor(pid, pass_att, pass_cmp, pass_yd, 
        rush_att, rush_yd, rec_tgt, rec, rec_yd) {
        this.pid      = pid;
        this.pass_att = pass_att || "-";
        this.pass_cmp = pass_cmp || "-";
        this.pass_yd  = pass_yd  || "-";
        this.rush_att = rush_att || "-";
        this.rush_yd  = rush_yd  || "-";
        this.rec_tgt  = rec_tgt  || "-";
        this.rec      = rec      || "-";
        this.rec_yd   = rec_yd   || "-";
    }

    getPlayerStatTableRow() {
        return createColumnWithVal(this.pass_att) + createColumnWithVal(this.pass_cmp) + 
            createColumnWithVal(this.pass_yd) + createColumnWithVal(this.rush_att) + 
            createColumnWithVal(this.rush_yd) + createColumnWithVal(this.rec_tgt) + 
            createColumnWithVal(this.rec) + createColumnWithVal(this.rec_yd);
    }
}

/* Variables */
const POSITION_ORDER = ["QB", "RB", "LWR", "RWR", "SWR", "TE", "K"];
const TEAM_ACRONYMS = ["ARI","ATL","BAL","BUF","CHI","CIN","CLE","DAL","DEN","DET","GB","HOU","IND","JAX","KC","LAC","LAR","MIA","MIN","NE","NO","NYG","NYJ","OAK","PHI","PIT","SEA","SF","TB","TEN","WAS"];

/* Functions */
function createColumnWithVal(val) {
    return "<td>" + val + "</td>"
}

function getEmptyStat() {
    return createColumnWithVal("-") + createColumnWithVal("-") + 
            createColumnWithVal("-") + createColumnWithVal("-") + 
            createColumnWithVal("-") + createColumnWithVal("-") + 
            createColumnWithVal("-") + createColumnWithVal("-");
}

function loadJsonFromUrl(url) {
    var jsonData = null;
    $.ajax({
        url: url,
        type: 'get',
        dataType: 'html',
        async: false,
        success: function(data) {
            jsonData =  data;
        } 
    });
    return JSON.parse(jsonData);
}

function loadOverallNflDataAsJson() {
    var url = "https://api.sleeper.app/v1/players/nfl";
    
    return loadJsonFromUrl(url);
}

function loadNflPlayerStatAsJson(week) {
    var url;
    url = "https://api.sleeper.app/v1/stats/nfl/regular/2019";
    if (week !== "ALL") {
        url += ("/" + week);
    }
    return loadJsonFromUrl(url);
}

function createNflTeamData(overallNflJson) {
    var playerIdSet = new Set();
    var teamToPositionToPlayers = {};
    teamToPositionToPlayers["FA"] = {};
    
    for (var playerId in overallNflJson) {
        var playerData = overallNflJson[playerId];
        var team = playerData["team"] || "FA";
        
        var position = playerData["depth_chart_position"] || playerData["position"];
        if (!POSITION_ORDER.includes(position)) {
            continue;
        }

        var order = playerData["depth_chart_order"] || 1000;
        
        var name = playerData["full_name"];
        if (position === "DEF") {
            name = team;
        }

        var player = new Player(playerId, name, order);

        if (!(team in teamToPositionToPlayers)) {
            teamToPositionToPlayers[team] = {};
        }

        if (!(position in teamToPositionToPlayers[team])) {
            teamToPositionToPlayers[team][position] = [];
        }

        teamToPositionToPlayers[team][position].push(player);
        teamToPositionToPlayers[team][position].sort(function(a, b){return a.order - b.order});
        playerIdSet.add(playerId);
    }

    return [playerIdSet, teamToPositionToPlayers];
}

function createPlayerToStat(playerStatJson, playerIdSet) {
    var playerToStat = {};

    for (var playerId in playerStatJson) {
        if (!playerIdSet.has(playerId)) {
            continue;
        }

        var playerStatData = playerStatJson[playerId];

        if (!("wind_speed" in playerStatData)) {
            continue;
        }

        var passAtt = playerStatData["pass_att"];
        var passCmp = playerStatData["pass_cmp"];
        var passYd  = playerStatData["pass_yd"];
        var rushAtt = playerStatData["rush_att"];
        var rushYd  = playerStatData["rush_yd"];
        var recTgt  = playerStatData["rec_tgt"];
        var rec     = playerStatData["rec"];
        var recYd   = playerStatData["rec_yd"];

        var playerStat = new PlayerStat(playerId, passAtt, passCmp,
            passYd, rushAtt, rushYd, recTgt, rec, recYd);
        playerToStat[playerId] = playerStat;
    }

    return playerToStat;
}

function clearTeamDepthChart() {
    $('#result-table tbody tr').remove();
}

function displayTeamDepthChart(teamToPositionToPlayers, playerToStat, team) {
    clearTeamDepthChart();

    var teamDepthChart = teamToPositionToPlayers[team]
    for (var i = 0; i < POSITION_ORDER.length; ++i) {
        var position = POSITION_ORDER[i];
        var positionPlayers = teamDepthChart[position];
        for (var j = 0; j < positionPlayers.length; ++j) {
            var player = positionPlayers[j];
            
            var playerStat = playerToStat[player.pid];
            var playerStatRow;
            if (playerStat) {
                playerStatRow = playerStat.getPlayerStatTableRow();
            } else {
                playerStatRow = getEmptyStat();
            }

            var positionCell = "";
            if (j === 0) {
                positionCell = "<td rowspan=\"" + positionPlayers.length + "\">" + position + "</td>";
            }

            var playerRow = "<tr>" + positionCell +
                createColumnWithVal(j+1) + createColumnWithVal(player.name) + 
                playerStatRow + "</tr>";

            $('#result-table tbody').append(playerRow);
        }
    }

    $('#result-table').css("display", "block");
}

/* Runnables */
$(document).ready(function() {
    var overallNflJson = loadOverallNflDataAsJson();
    
    var nflTeamData = createNflTeamData(overallNflJson);
    var playerIdSet = nflTeamData[0];
    var teamToPositionToPlayers = nflTeamData[1];

    for (var i = 0; i < TEAM_ACRONYMS.length; ++i) {
        $('#team-list').append(new Option(TEAM_ACRONYMS[i]));
    }

    for (var i = 1; i < 16; ++i) {
        $('#week-list').append(new Option(i));
    }

    $('#submit').click(function() {
        console.log("Button submitted");
        var team = $('#team-list option:selected').val();
        var week = $('#week-list option:selected').val();

        var playerStatJson = loadNflPlayerStatAsJson(week);
        var playerToStat = createPlayerToStat(playerStatJson, playerIdSet);
        displayTeamDepthChart(teamToPositionToPlayers, playerToStat, team);
    });

});