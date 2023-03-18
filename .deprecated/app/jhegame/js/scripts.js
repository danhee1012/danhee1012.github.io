$(document).ready(function() {
    var config = {
    apiKey: "AIzaSyAKN4T4KffUnW7fGqv8bc9PJtwR5b0Xeo8",
    authDomain: "youtube-timer-player.firebaseapp.com",
    databaseURL: "https://youtube-timer-player.firebaseio.com",
    projectId: "youtube-timer-player",
    storageBucket: "youtube-timer-player.appspot.com",
    messagingSenderId: "187405860866"
  };
  firebase.initializeApp(config);
    
    var fbPlaylist = firebase.database().ref('playlist/');
    fbPlaylist.on('value', function(snapshot) {
        $("#playlist").empty();
        
        snapshot.forEach(function(data) {
            var videoId = data.val().split("=").pop();
            $("#playlist").append("<option value='" + videoId + "'>" + videoId + "</option>");
        });

        $("#playlist option").first().attr("selected", "selected");
        initYtPlayer($("#playlist option:selected").val());
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

    function initYtPlayer(videoId) {
        if(player != null) {
            player.destroy();
        }

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
        $('#title').text("Title: " + player.getVideoData().title);

        $(".btn-play").click(function() {
            player.seekTo(0,true); 
            stopPlayAt = parseInt($(this).val());
            player.playVideo();
        });

        $(".btn-pause").click(function() {
            stopPlayAt = parseInt($(this).val());
            player.pauseVideo();
        });

        $("#playlist").change(function() {
            initYtPlayer($("#playlist option:selected").val());
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