playername = ""

$(document).ready(function() {
    $("#startbutton").click(function(){
        console.log("start clicked")
        playername = $("startname").val()
        id = Math.floor(Math.random() * 10000);  
        players = [$("#startname input").val()]
        console.log(players, id)
        db.collection("games").doc(id.toString()).set({players})
        make_lobby(true)
    })
    $("#joingame").click(function(){
        console.log("start clicked")
    })
})

function make_lobby(gameid, admin){
    $("#startgame").css("display","none")
    $("#lobby").css("display","block")
    if(!admin){
        $("#adminstartbutton").css("display","block")
    }
    height = $('#gameid').height()
    $('#gameid').css({
        'font-size': height + 'px',
        'line-height': height + 'px'
     })
     height = $('#lobbyplayers ul li').height()
     $('#lobbyplayers ul li').css({
        'font-size': height + 'px',
        'line-height': height + 'px'
     })
     $('gamelobby').html("Game ID: "+ gameid)
}