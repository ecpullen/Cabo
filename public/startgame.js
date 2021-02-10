playername = ""

$(document).ready(function() {
    $("#startbutton").click(function(){
        console.log("start clicked")
        playername = $("#startname input").val()
        set_name(playername)
        id = Math.floor(Math.random() * 10000);  
        players = [playername]
        console.log(players, id)
        make_lobby(id,true)
        gameid = id.toString()
        db.collection("games").doc(gameid).set({exists:true})
        db.collection("games").doc(gameid).collection("GameState").doc("State").set({state:"lobby"})
        db.collection("games").doc(gameid).collection("GameState").doc("Players").set({players})
    })
    $("#joinbutton").click(function(){
        console.log("join clicked")
        playername = $("#startname input").val()
        set_name(playername)
        id =  $("#jointext").val()
        db.collection("games").doc(id.toString()).collection("GameState").doc("Players").get().then(function(doc){
            data = doc.data()
            players = data.players
            players.push(playername)
            console.log(players, playername)
            db.collection("games").doc(id.toString()).collection("GameState").doc("Players").set({players})
            make_lobby(id)

            //set listener for change in game state
            db.collection("games").doc(gameid).collection("GameState").doc("State").onSnapshot((doc)=>state_change(doc))
        })
        gameid = id.toString()
    })
})

function set_name(name){
    playername = name
}

function make_lobby(gameid, admin){
    $("#startgame").css("display","none")
    $("#lobby").css("display","block")
    if(!admin){
        $("#adminstartbutton").css("display","none")
    }
    else{
        $("#adminstartbutton").click(start_game)
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
     $('#gameid').html("Game ID: "+ gameid)
     db.collection("games").doc(id.toString()).collection("GameState").doc("Players").get().then(function(doc){
        data = doc.data()
        players = data.players
        show_players(players)
    })
    //Lobby listener
    db.collection("games").doc(id.toString()).collection("GameState").doc("Players").onSnapshot((doc)=>show_players(doc.data().players))
}

function show_players(players){
    console.log("showing", players)
    $('#lobbyplayers ul').empty()
    for(p in players){
        $('#lobbyplayers ul').append(`<li>${players[p]}</li>`)
    }
}

function start_game(){
    console.log("starting game")
    console.log("id", id)
    db.collection("games").doc(id.toString()).collection("GameState").doc("Players").get().then(function(doc){
        data = doc.data()
        console.log("retrieved game data")
        players = data.players
        num_cards = 4*players.length
        cards = draw_make_new_deck(num_cards)
            console.log(cards)
            deal_order = [2,3,6,7]
            hands={}
            for(p in players){
                temp_hand = {}
                for(i = 0; i < 4; i ++){
                    temp_hand[deal_order[i]] = cards.pop()
                }
                hands[players[p]] = temp_hand
            }
            db.collection("games").doc(gameid).update({hands, players})
            db.collection("games").doc(gameid).collection("GameState").doc("Discard").set({Card:false})
            db.collection("games").doc(gameid).collection("GameState").doc("Turn").set({Turn:players[Math.floor(Math.random() * players.length)]})
            db.collection("games").doc(gameid).collection("GameState").doc("State").set({state:"start"})
            //add highlight document with {cards:[]}
            //add log doc with {log:[]}
                    //will need listeners in setup_listeners()

            //set listener for change in game state
            db.collection("games").doc(gameid).collection("GameState").doc("State").onSnapshot((doc)=>state_change(doc))
        
    })
}

function draw_make_new_deck(cards){
    suits = ['H','S','D','C']
    values = ['1','2','3','4','5','6','7','8','9','10','J','Q','K']
    deck = []
    for(i = 0; i < 13; i ++){
        for(j = 0; j< 4; j++){
            deck.push({'suit': suits[j], 'value': values[i]})
        }
    }
    shuffle(deck)
    dealt_cards = []
    for(i=0; i < cards; i++){
        dealt_cards.push(deck.pop())
    }
    db.collection("games").doc(gameid).update({deck})
    db.collection("games").doc(gameid).update({"discard": []})
    return dealt_cards
}

function state_change(doc){
    state = doc.data().state
    console.log("State Change", state)
    if(state == "start"){
        load_game()
        setup_listeners()
        console.log("start")
        $("#lobby").css("display","none")
        $("#opcards").css("display","block")
        $("#middeck").css("display","block")
        $("#playercards").css("display","block")
        format_game()
        console.log(game_started)
        setTimeout(()=>game_started=true,500)
    }
}

function format_game(){
    $('.hand').width($('.hand').height());
    $('.hand').width($('.hand').height());
    $('.hand').css('margin', $('.hand').css('margin-top'))

    $('#deck').width($('#deck').height()*.66)
    $('#discard').width($('#discard').height()*.66)

    height = $('#title').height()
    $('#title').css({
        'font-size': height + 'px',
        'line-height': height + 'px'
     })

}

function setup_listeners(){
    db.collection("games").doc(gameid).collection("GameState").doc("Turn").onSnapshot((doc)=>{
        data = doc.data()
        load_game()
        //clear all player highlights
        //TODO: get player color function
        //add highlight to $(`.hand.${data.Turn}`)
        if(playername == data.Turn){
            //make turn
            console.log("Start Draw")
            $("#deck").click(()=>{
                  draw_deck().then((card)=>{
                      show_cards_center([card])
                      //card on center goes to discard
                      c2dis = make_card_to_discard(card)
                      $("#carddealt").click(function(){
                          console.log("in carddealt")
                          c2dis()
                          //center disappears
                          $("#centercards").css("display","none")
                          $('#carddealt').unbind()
                          //change discard doc
                          db.collection("games").doc(gameid).collection("GameState").doc("Discard").set({"Card":card})
                          card_race()
                      })
                      //card in deck swaps with center
                      hand = data.hands[playername.toString()]
                      swap = {}
                      for(pos in hand){
                          swap[pos] = make_card_swap(pos, card)
                          $(`.hand.${playername} .card.p${pos}`).click(function(){
                              p = parseInt($(this).attr("class").split(/\s+/)[1][1])
                              t = this
                              swap[p]().then(function(card){
                                //center disappears
                              $("#centercards").css("display","none")
                              //remove onclick
                              $(t).parent().children().each(function(){
                                  $(t).unbind()
                              })
                              //change discard doc
                              db.collection("games").doc(gameid).collection("GameState").doc("Discard").set({"Card":card, pos:parseInt($(t).attr("class").split(/\s+/)[1].substring(1,2)), player:$(t).parent().attr("class").split(/\s+/)[1]})
                              card_race()
                              })
                          })
                      }
                  })
            })
            $("#discard").click(()=>{
              draw_discard().then((card)=>{
                  show_cards_center([card])
                  //card on center goes to discard
                  swap = make_card_to_discard(card)
                  $("#carddealt").click(function(){
                      swap()
                      //center disappears
                      $("#centercards").css("display","none")
                      $('#carddealt').unbind()
                      //change discard doc
                      db.collection("games").doc(gameid).collection("GameState").doc("Discard").set({"Card":card})
                      card_race()
                  })
                  //card in deck swaps with center
                  hand = data.hands[playername.toString()]
                  for(pos in hand){
                      swap = make_card_swap(pos, card)
                      $(`.hand.${playername} .card.p${pos}`).click(function(){
                          swap()
                          //center disappears
                          $("#centercards").css("display","none")
                          //remove onclick
                          $(this).parent().children().each(function(){
                              $(this).unbind()    
                          })
                          //change discard doc
                            db.collection("games").doc(gameid).collection("GameState").doc("Discard").set({"Card":card, pos:parseInt($(t).attr("class").split(/\s+/)[1].substring(1,2)), player:$(t).parent().attr("class").split(/\s+/)[1]})
                            card_race()
                      })
                  }
              })
            })
        }
    })
  
  db.collection("games").doc(gameid).collection("GameState").doc("Discard").onSnapshot((doc)=>{
      if(!game_started){
        return
      }
      console.log("here!!!")
      data = doc.data()
      d = data.Card
      if(data.player && data.pos){
        delay_discard_card_show(d, data.player, data.pos)
      }
      else{
        delay_discard_card_show(d)
      }
  })

  db.collection("games").doc(gameid).collection("GameState").doc("Highlight").onSnapshot((doc)=>{
    data = doc.data()
    //face down all cards
    if(data.cards.length>0){
        //for each card in cards
            //if card.value and card.suit
                //show card (search ${)
            //highlight card
    }
})
  
}
match = false
async function card_race(timeout){
    clear_card_race()
    setTimeout(()=>{
            //calculate the fastest response time
        db.collection("games").doc(gameid).collection("GameState").doc("RacedCards").get().then(function(doc){
            if(doc.exists){
                data = doc.data()
                times = Object.keys(data)
                collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                play_pos = data[times.sort(collator.compare)[0]]
                //send in data
                //TODO: rework with while loop
                // punish proper player
                // highlight cards until valid match
                // set matched = true if match
                first_match_on_discard(play_pos.player, play_pos.pos)
            }
            //next turn
            db.collection("games").doc(gameid).get().then((doc) => {
                data = doc.data()
                idx = (data.players.indexOf(playername) + 1) % data.players.length
                db.collection("games").doc(gameid).collection("GameState").doc("Turn").set({"Turn":data.players[idx]})
            })
        })
    }, timeout? timeout: 6000)
    //TODO: Do power
}
//if do power
        //do power
                        //highlight changing cards for .5 sß
        //do_power = false
        //if matched
            //card race (could be a quicker version)