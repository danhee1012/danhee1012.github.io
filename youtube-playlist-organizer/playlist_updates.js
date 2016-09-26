// Define some variables used to remember state.
var currPlaylistId, channelId, destPlaylistId;
var playlistItemIds = [];

// After the API loads, call a function to enable the playlist creation form.
function handleAPILoaded() {
    $('#submit').click(function () {
        currPlaylistId = $('#curr-playlist-id').val();
        destPlaylistId = $('#dest-playlist-id').val();
        requestUserUploadsPlaylistId(currPlaylistId, true);
        requestUserUploadsPlaylistId(destPlaylistId, false);
    });

    /*$('#curr-playlist-id').on("input", function() {
       currPlaylistId = $('#curr-playlist-id').val();
       destPlaylistId = $('#dest-playlist-id').val();
        if(currPlaylistId != "") {
          $('#submit').removeAttr('disabled');
          requestUserUploadsPlaylistId(currPlaylistId);
        }
        else {
          $('#submit').attr('disabled', true);
        }
    });*/
}

// Call the Data API to retrieve the playlist ID that uniquely identifies the
// list of videos uploaded to the currently authenticated user's channel.
function requestUserUploadsPlaylistId(currPlaylistId, isCurrPlaylist) {
    // See https://developers.google.com/youtube/v3/docs/channels/list
    var request = gapi.client.youtube.channels.list({
        mine: true,
        part: 'contentDetails'
    });
    request.execute(function (response) {
        requestVideoPlaylist(currPlaylistId, isCurrPlaylist);
    });
}

// Retrieve the list of videos in the specified playlist.
function requestVideoPlaylist(playlistId, isCurrPlaylist, pageToken) {
    $('#curr-video-container').html('');

    var requestOptions = {
        playlistId: playlistId,
        part: 'snippet',
        maxResults: 10
    };

    if (pageToken) {
        requestOptions.pageToken = pageToken;
    }

    var request = gapi.client.youtube.playlistItems.list(requestOptions);

    request.execute(function (response) {
        // Only show pagination buttons if there is a pagination token for the
        // next or previous page of results.

        nextPageToken = response.result.nextPageToken;
        var nextVis = nextPageToken ? 'visible' : 'hidden';
        $('#next-button').css('visibility', nextVis);

        prevPageToken = response.result.prevPageToken
        var prevVis = prevPageToken ? 'visible' : 'hidden';
        $('#prev-button').css('visibility', prevVis);

        if (isCurrPlaylist) {
            playlistItemIds = [];
            $('#curr-video-container').html('');
        } else {
            $('#dest-video-container').html('');
        }

        var playlistItems = response.result.items;

        if (playlistItems) {
            $.each(playlistItems, function (index, item) {
                if (isCurrPlaylist) {
                    displayResult(item, isCurrPlaylist);
                    updateplaylistItemIds(item);
                } else {
                    displayResult(item, isCurrPlaylist);
                }
            });
        } else {
            if (isCurrPlaylist) {
                $('#curr-video-container').html('Sorry you have no uploaded videos');

            } else {
                $('#dest-video-container').html('Sorry you have no uploaded videos');
            }
        }

        if (isCurrPlaylist) {
            movePlaylistItems();
        }
    });
}

function movePlaylistItems() {
    addToPlaylist(0);
    deleteFromPlaylist(0);
    
    /*for (var i = 0; i < playlistItemIds.length; i++) {
        var data = playlistItemIds[i];
        console.log(data);
        addToPlaylist(data.videoId);
        //deleteFromPlaylist(data.id);
    }*/
}

function updateplaylistItemIds(item) {
    var data = {
        id: item.id,
        videoId: item.snippet.resourceId.videoId
    }

    playlistItemIds.push(data);
}

// Create a listing for a video.
function displayResult(item, isCurrPlaylist) {
    var title = item.snippet.title;
    var videoId = item.snippet.resourceId.videoId;
    var id = item.id;

    if (isCurrPlaylist) {
        $('#curr-video-container').append('<pre>' + title + ' - ' + videoId + ' - ' + id + '</pre>');
    } else {
        $('#dest-video-container').append('<pre>' + title + ' - ' + videoId + ' - ' + id + '</pre>');
    }
}

// Add a video to a playlist. The "startPos" and "endPos" values let you
// start and stop the video at specific times when the video is played as
// part of the playlist. However, these values are not set in this example.

function deleteFromPlaylist(idx) {
    var playlistItemId = playlistItemIds[idx].id;

    var request = gapi.client.youtube.playlistItems.delete({
        id: playlistItemId
    }).execute(function(response) {
        if(idx < playlistItemIds.length-1) {
             deleteFromPlaylist((++idx));
        }
    });
}

function addToPlaylist(idx) {
    var videoId = playlistItemIds[idx].videoId;
    
    var details = {
        videoId: videoId,
        kind: 'youtube#video'
    }

    var request = gapi.client.youtube.playlistItems.insert({
        part: 'snippet',
        resource: {
            snippet: {
                playlistId: destPlaylistId,
                resourceId: details
            }
        }
    });

    request.execute(function(response) {
        if(idx < playlistItemIds.length-1) {
             addToPlaylist((++idx));
        }
    });
}