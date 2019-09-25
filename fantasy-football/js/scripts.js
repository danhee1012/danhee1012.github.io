/* Classes */
class Player {
    constructor(pid, name, order) {
        this.pid   = pid;
        this.name  = name;
        this.order = order;
    }
}

class PlayerStat {
    constructor(pid, passAtt, passCmp, passYd, passInt, passTd,
        rushAtt, rushYd, rushTd, recTgt, rec, recYd, recTd, fum, fumLost) {
        this.pid     = pid;
        
        this.passAtt = passAtt || "-";
        this.passCmp = passCmp || "-";
        this.passYd  = passYd  || "-";
        this.passInt = passInt || "-";
        this.passTd  = passTd  || "-";

        this.rushAtt = rushAtt || "-";
        this.rushYd  = rushYd  || "-";
        this.rushTd  = rushTd  || "-";

        this.recTgt  = recTgt  || "-";
        this.rec     = rec     || "-";
        this.recYd   = recYd   || "-";
        this.recTd   = recTd   || "-";

        this.fum     = fum     || "-";
        this.fumLost = fumLost || "-";
    }

    getPlayerStatTableRow(divider) {
        return createTableCellWithPlayerStatWithType(this.passAtt, "pass-att", divider) + createTableCellWithPlayerStatWithType(this.passCmp, "pass-cmp", divider) + 
            createTableCellWithPlayerStatWithType(this.passYd, "pass-yd", divider) + createTableCellWithPlayerStatWithType(this.passInt, "pass-int", divider) +
            createTableCellWithPlayerStatWithType(this.passTd, "pass-td", divider) +
            createTableCellWithPlayerStatWithType(this.rushAtt, "rush-att", divider) + createTableCellWithPlayerStatWithType(this.rushYd, "rush-yd", divider) + 
            createTableCellWithPlayerStatWithType(this.rushTd, "rush-td", divider) +
            createTableCellWithPlayerStatWithType(this.recTgt, "rec-tgt", divider) + createTableCellWithPlayerStatWithType(this.rec, "rec", divider) + 
            createTableCellWithPlayerStatWithType(this.recYd, "rec-yd", divider) + createTableCellWithPlayerStatWithType(this.recTd, "rec-td", divider) +
            createTableCellWithPlayerStatWithType(this.fum, "fum", divider) + createTableCellWithPlayerStatWithType(this.fumLost, "fum-lost", divider);
    }
}

/* Variables */
const POSITION_ORDER = ["QB", "RB", "LWR", "RWR", "SWR", "TE", "K"];
const TEAM_ACRONYMS = ["ARI", "ATL", "BAL", "BUF", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC", "LAC", "LAR", 
    "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "OAK", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];
const PLAY_TYPE_CLASS_TO_LIMIT = {
    "player-stat-pass-att" : [35, 25],
    "player-stat-pass-cmp" : [20, 15],
    "player-stat-pass-yd"  : [270, 200],
    "player-stat-pass-int" : [1, 1],
    "player-stat-pass-td"  : [1, 0],
    "player-stat-rush-att" : [13, 4],
    "player-stat-rush-yd"  : [60, 40],
    "player-stat-rush-td"  : [0, -1],
    "player-stat-rec-tgt"  : [7, 5],
    "player-stat-rec"      : [7, 5],
    "player-stat-rec-yd"   : [60, 40],
    "player-stat-rec-td"   : [1, 0],
    "player-stat-fum"      : [1, -1],
    "player-stat-fum-lost" : [1, -1],
}

/* Functions */
function getNumActiveWeeks() {
    var firstGameDay = new Date(2019,8,5,0,0);
    var today = new Date();
    var timeElapsed = today.getTime() - firstGameDay.getTime();
    
    return Math.ceil(timeElapsed / (1000*60*60*24) / 7);
}

function getEmptyStat() {
    var emptyRow = "";
    for (var i = 0; i < 14; ++i) {
        emptyRow += createTableCellWithPlayerStat("-");
    }
    
    return emptyRow;
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
        var passInt = playerStatData["pass_int"];
        var passTd  = playerStatData["pass_td"];

        var rushAtt = playerStatData["rush_att"];
        var rushYd  = playerStatData["rush_yd"];
        var rushTd  = playerStatData["rush_td"];

        var recTgt  = playerStatData["rec_tgt"];
        var rec     = playerStatData["rec"];
        var recYd   = playerStatData["rec_yd"];
        var recTd   = playerStatData["rec_td"];

        var fum     = playerStatData["fum"];
        var fumLost = playerStatData["fum_lost"];

        var playerStat = new PlayerStat(playerId, passAtt, passCmp, passYd, passInt, passTd,
            rushAtt, rushYd, rushTd, recTgt, rec, recYd, recTd, fum, fumLost);
        playerToStat[playerId] = playerStat;
    }

    return playerToStat;
}

function clearTeamDepthChart() {
    $('#result-table tbody tr').remove();
}

function createTableCellWithPlayerStatWithType(val, type, divider) {
    var finalVal = "-"
    if (val !== "-") {
        finalVal = (val / divider).toFixed(1);
    }

    return "<td class=\"player-stat player-stat-" + type + "\">" + finalVal + "</td>"
}

function createTableCellWithPlayerStat(val) {
    return createTableCellWithPlayerStatWithType(val, "");
}

function createTableCell(val) {
    return "<td>" + val + "</td>"
}

function colorPlayerStat() {
    $('.player-stat').each(function() {
        var statVal = $(this).html();
        var positionClass = $(this).attr('class').split(" ")[1];
        var statLimit = PLAY_TYPE_CLASS_TO_LIMIT[positionClass];
        if (statLimit && statVal !== "-") {
            if (statVal > statLimit[0]) {
                $(this).css("background-color", "#c3e6cb");
            } else if (statVal > statLimit[1]) {
                $(this).css("background-color", "#ffeeba");
            } else {
                $(this).css("background-color", "#f5c6cb");
            }
        }
    });
}

function getWeekName(week, numActiveWeeks) {
    var weekName = "WEEK " + week;
    if (week === "ALL") {
        weekName = numActiveWeeks + " WEEK AVERAGE";
    }
    
    return weekName;
}

function displayTeamDepthChart(teamToPositionToPlayers, playerToStat, team, week, numActiveWeeks) {
    clearTeamDepthChart();

    var divider = 1;
    if (week === "ALL") {
        divider = numActiveWeeks;
    }

    var teamDepthChart = teamToPositionToPlayers[team];
    for (var i = 0; i < POSITION_ORDER.length; ++i) {
        var position = POSITION_ORDER[i];
        var positionPlayers = teamDepthChart[position];
        for (var j = 0; j < positionPlayers.length; ++j) {
            var player = positionPlayers[j];
            var playerStat = playerToStat[player.pid];
            var playerStatRow;
            if (playerStat) {
                playerStatRow = playerStat.getPlayerStatTableRow(divider);
            } else {
                playerStatRow = getEmptyStat();
            }

            var positionCell = "";
            if (j === 0) {
                positionCell = "<th rowspan=\"" + positionPlayers.length + "\">" + position + "</th>";
            }

            var playerRow = "<tr>" + positionCell +
                createTableCell(j+1) + createTableCell(player.name) + 
                playerStatRow + "</tr>";

            $('#result-table tbody').append(playerRow);
        }
    }

    $('#result-table').css("display", "block");
    $('#week-name').html(getWeekName(week, numActiveWeeks));
    colorPlayerStat();
}

function checkIfTeamPlayedInLastWeek(teamToPositionToPlayers, playerToStat, team) {
    var playerIdSet = new Set();

    var teamDepthChart = teamToPositionToPlayers[team];
    for (var i = 0; i < POSITION_ORDER.length; ++i) {
        var position = POSITION_ORDER[i];
        var positionPlayers = teamDepthChart[position];
        for (var j = 0; j < positionPlayers.length; ++j) {
            var player = positionPlayers[j];
            var playerId = player.pid;
            var playerStat = playerToStat[player.pid];
            if (playerStat) {
                playerIdSet.add(playerId);
            }
        }
    }

    console.log(playerIdSet.size);
    return playerIdSet.size;
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

    numActiveWeeks = getNumActiveWeeks();
    for (var i = 1; i < numActiveWeeks + 1; ++i) {
        $('#week-list').append(new Option(i));
    }

    $('#submit').click(function() {
        console.log("Button submitted");
        var team = $('#team-list option:selected').val();
        var week = $('#week-list option:selected').val();
        
        teamNumActiveWeeks = numActiveWeeks;
        if (week === "ALL") {
            var lastWeekPlayerStatJson = loadNflPlayerStatAsJson(numActiveWeeks);
            var lastWeekPlayerToStat = createPlayerToStat(lastWeekPlayerStatJson, playerIdSet);
            if (!checkIfTeamPlayedInLastWeek(teamToPositionToPlayers, lastWeekPlayerToStat, team)) {
                teamNumActiveWeeks -= 1;
            }
        }

        var playerStatJson = loadNflPlayerStatAsJson(week);
        var playerToStat = createPlayerToStat(playerStatJson, playerIdSet);
        displayTeamDepthChart(teamToPositionToPlayers, playerToStat, team, week, teamNumActiveWeeks);
    });

});