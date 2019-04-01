$(document).ready(function() {
    var config = {
        apiKey: "AIzaSyBfkOFqUQwbolFWZAcopxIC66UZs0Ggqt8",
        authDomain: "movie-player-4e166.firebaseapp.com",
        databaseURL: "https://movie-player-4e166.firebaseio.com",
        projectId: "movie-player-4e166",
        storageBucket: "movie-player-4e166.appspot.com",
        messagingSenderId: "629996184031"
    };
    firebase.initializeApp(config);
    
    var fbPlaylist = firebase.database().ref('playlist/');
    fbPlaylist.on('value', function(snapshot) {
        $("#playlist").empty();

        snapshot.forEach(function(data) {
            var key = data.key;
            var title = data.val().title;
            var start = data.val().start;
            var end = data.val().end;
            var videoId = key.split("=").pop();
            $("#playlist").append("<option value='" + videoId + "' title='" + title + "' start='" + start + "' end='" + end + "'>" + videoId + "</option>");
        });

        $("#playlist option").first().attr("selected", "selected");
        initYtPlayer($("#playlist option:selected").val(), 
            $("#playlist option:selected").attr("title"),
            $("#playlist option:selected").attr("start"), 
            $("#playlist option:selected").attr("end"));

    });

    var stopPlayAt = 5, // Stop play at time in seconds
    stopPlayTimer;     // Reference to settimeout call

    // This code loads the IFrame Player API code asynchronously.
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // This function creates an <iframe> (and YouTube player)
    // after the API code downloads.
    var player;

    function initYtPlayer(videoId, title, start, end) {
        if(player != null) {
            player.destroy();
        }

        $("#title").attr("value", title);
        $("#start").attr("value", start);
        $("#end").attr("value", end);

        player = new YT.Player("player", {
            "height": "360",
            "width": "640",
            "videoId": videoId,
            "events": {
                "onReady": onPlayerReady,
                "onStateChange": onPlayerStateChange
            }
        });
    }

    // The API will call this function when the video player is ready.
    // This automatically starts the video playback when the player is loaded.
    function onPlayerReady(event) {
        // event.target.playVideo();
        var title = $("#title").attr("value");
        var start = parseInt($("#start").attr("value"));
        var end = parseInt($("#end").attr("value"));

        $('#title').text("Title: " + title);

        $(".btn-play").click(function() {
            console.log(start);
            player.seekTo(start, true); 
            stopPlayAt = end;
            player.playVideo();
        });

        $(".btn-pause").click(function() {
            stopPlayAt = parseInt($(this).val());
            player.pauseVideo();
        });

        $("#playlist").change(function() {
            initYtPlayer($("#playlist option:selected").val(), 
                $("#playlist option:selected").attr("title"),
                $("#playlist option:selected").attr("start"), 
                $("#playlist option:selected").attr("end"));
        });
    }

    // The API calls this function when the player's state changes.
    function onPlayerStateChange(event) {
        var time, rate, remainingTime;
        clearTimeout(stopPlayTimer);
        if (event.data == YT.PlayerState.PLAYING) {
            time = player.getCurrentTime();
            // Add .4 of a second to the time in case it's close to the current time
            // (The API kept returning ~9.7 when hitting play after stopping at 10s)
            if (time + .4 < stopPlayAt) {
                rate = player.getPlaybackRate();
                remainingTime = (stopPlayAt - time) / rate;
                stopPlayTimer = setTimeout(pauseVideo, remainingTime * 1000);
            }
        }
    }

    function pauseVideo() {
        player.pauseVideo();
    }
});