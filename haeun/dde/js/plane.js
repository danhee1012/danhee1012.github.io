//Of course I can code this more programatically, but this seems good to me.
$().ready(function() {
    $('#plate').click(function() {
        setTimeout(function() {
            $('.send').remove();
            $('.arrow-container').remove();
            $('#plate').addClass("appear");
            $('#plate').css("background-image", "url(\"img/plate.jpeg\")");
            $('#plate').css("background-size", "cover");
            $('#plate').css("background-position", "50%");
            
            setTimeout(function() {
                $('#plate').removeClass('front');
                $('#container').removeClass('beginning');
                $('.curvable').addClass('curved');
                setTimeout(function() {
                    $('#container').addClass('hover');
                    $('.main-circle img').css("opacity", "1")
                    setTimeout(function() {
                        $('#container').addClass('fly_away_first');
                        
                        setTimeout(function() {
                            $('#container').addClass('fly_away');
                            
                            setTimeout(function(){
                                $('#plate').remove();
                                $('.main-circle').css("box-shadow", "none");
                                $('.main-circle').css("top", "-300px");
                                setTimeout(function(){
                                    $('.main-circle').remove();
                                    $('.congratulate').css("opacity", "1");
                                    setTimeout(function(){
                                        $('.congratulate').css("opacity", "0");
                                        setTimeout(function(){
                                            $('.congratulate').remove();
                                            $('.letter-1').css("opacity", "1");
                                        }, 3000);
                                    }, 10000);
                                }, 3000);
                            }, 3000);
                        }, 600);
                    }, 2000);
                }, 2800);
            }, 2000);
        }, 200);
    });
});

$().ready(function() {
    $('.letter-1 .box__inner').click(function() {
        $('.letter-1').css("opacity", "0");
        $('.letter-2').css("opacity", "1");
    });
});