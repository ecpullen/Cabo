game_started = false

$(document).ready(function() {
    $('.hand').width($('.hand').height());
    $('.hand').width($('.hand').height());
    $('.hand').css('margin', $('.hand').css('margin-top'))

    height = $('#title').height()
    $('#title').css({
        'font-size': height + 'px',
        'line-height': height + 'px'
     })
     height = $('#center').height()
    $('#center').css({
        'font-size': height + 'px',
        'line-height': height + 'px'
     })
});

$(window).load(function(){
    $('#deck').width($('#deck').height()*.66)
    $('#discard').width($('#discard').height()*.66)
})

function size(){
    console.log("sizing")
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

$(window).resize(size);

var db = firebase.firestore();

playername = "Ethan"
leadplayer = false
gameid = "cfI9jREjdRVkKuagS8CD"

function make_deck(){
    suits = ['H','S','D','C']
    values = ['1','2','3','4','5','6','7','8','9','10','J','Q','K']
    cards = []
    for(i = 0; i < 13; i ++){
        for(j = 0; j< 4; j++){
            cards.push({'suit': suits[j], 'value': values[i]})
        }
    }
    shuffle(cards)
    db.collection("games").doc(gameid).update({"deck": cards})
    db.collection("games").doc(gameid).update({"discard": []})
}

function draw_deck(){
    return db.collection("games").doc(gameid).get().then((doc) => {
        data = doc.data()
        console.log(data)
        deck = data.deck
        let card = deck.pop()
        db.collection("games").doc(gameid).update({deck})
        return card
    })
}

function draw_discard(){
    return db.collection("games").doc(gameid).get().then((doc) => {
        data = doc.data()
        discard = data.discard
        let card = discard.pop()
        db.collection("games").doc(gameid).update({discard})
        return card
    })
}

function discard_card(card){
    db.collection("games").doc(gameid).get().then((doc) => {
        data = doc.data()
        discard = data.discard
        discard.push(card)
        db.collection("games").doc(gameid).update({discard})
    })
}

function get_player_hand(name){
    return  db.collection("games").doc(gameid).get().then((doc) => {
        data = doc.data()
        discard = data.discard
        return data.hands[playername]
    })
}

//swaps card with card in position then discards the swapped card
function swap_with_hand(card, position){
    db.collection("games").doc(gameid).get().then((doc) => {
        data = doc.data()
        discard = data.discard
        hand = data.hands[playername]
        old_card = hand[position.toString()]
        hand[position.toString()] = card
        discard.push(old_card)
        db.collection("games").doc(gameid).update({discard})
        p_update = "hands."+playername
        db.collection("games").doc(gameid).update({[p_update]:hand})
        //TODO Need to add discard to the discard doc
    })
}

function swap_with_op(player_position, opponent, opponent_position){
    db.collection("games").doc(gameid).get().then((doc) => {
        data = doc.data()
        p_hand = data.hands[playername]
        o_hand = data.hands[opponent]
        old_card_player = p_hand[player_position.toString()]
        old_card_opponent = o_hand[opponent_position.toString()]
        p_hand[player_position.toString()] = old_card_opponent
        o_hand[opponent_position.toString()] = old_card_player
        p_update = "hands."+playername
        o_update = "hands."+opponent
        db.collection("games").doc(gameid).update({[p_update]:p_hand})
        db.collection("games").doc(gameid).update({[o_update]:o_hand})
    })
}

function load_game(ignore_discard){
    db.collection("games").doc(gameid).get().then((doc) => {
       data = doc.data()
       console.log(data)
       hands = data.hands
       console.log(hands)
        playerhand = {}
        for(player in hands){
            if (player == playername){
                playerhand = hands[player]
            }
            else{
                hand = $("<div class='hand "+player+"'></div>")
                inner = " <div class='name'>"+player+"</div>"
                $("#opcards").empty()
                for(card in hands[player]){
                    inner = inner + "<div class='card p"+card+"'><img src='Cards/back.jpg' alt='Card' class='cardimg'></div>"
                }
                hand.append($(inner))
                
                $("#opcards").append(hand)
                
            }
        }
        hand = $("<div class='hand "+playername+"'></div>")
        inner = " <div class='name'>"+playername+"</div>"
        for(card in playerhand){
            inner = inner + "<div class='card p"+card+"'><img src='Cards/back.jpg' alt='Card' class='cardimg'></div>"
        }
        hand.html($(inner))
        $("#playercards").empty().append(hand)
        if(ignore_discard){
            $("#discard").empty()
            card = data.discard.pop()
            if(card){
                $("#discard").append(`<div class='card dealt'><img src='Cards/${card.value}${card.suit}.jpg' alt='Card' class='cardimg'></div>`)
            }
            else{
                $("#discard").append(`<div class='card dealt'><img src='Cards/back.jpg' alt='Card' class='cardimg'></div>`)
            }
        }
        size()
    })
}

discard_shown_time = 0
discard = ""
function delay_discard_card_show(card){
    timeleft = 3
    $('#center').css('display','block')
    $("#center").html(timeleft)
    timer = setInterval(function(){
        timeleft -= 1
        $("#center").html(timeleft)
        if(timeleft == 0){
            //set time and show card
            clearInterval(timer)
            $('#center').css('display','none')
            $("#discard .cardimg").attr("src", `Cards/${card.value + card.suit}.jpg`)
            delay_discard_card_show = Date.now()
            discard = card
            $(".card").click(submit_match_card)
            setTimeout(function(){
                $(".card").unbind()
            }, 3000)
        }
    }, 1000)
}

function submit_match_card(){
    $(".card").unbind()
    console.log(this)
    classes = $(this).attr("class").split(/\s+/)
    parent_classes = $(this).parent().attr("class").split(/\s+/)
    pos = 0
    player = ""
    pos = classes[1].substring(1,2)
    player = parent_classes[1]
    time = Date.now()-discard_shown_time
    time = time.toString()
    db.collection("games").doc(gameid).collection("GameState").doc("RacedCards").set({[time]:{player,pos}})
}

function first_match_on_discard(player, pos){
    get_player_hand(player).then(function(hand){
        console.log(hand)
        if (discard.value == hand[pos].value){
            discard_card(hand[pos])
            delete hand[pos]
            p_update = "hands."+player
            db.collection("games").doc(gameid).update({[p_update]:hand})
        }
        else {
            for(i = 1; i<=8; i++){
                if (!hand.hasOwnProperty(i)){
                    draw_deck().then(function(card){
                        hand[i]=card
                        p_update = "hands."+player
                        db.collection("games").doc(gameid).update({[p_update]:hand})
                    })
                    break
                }
            }
        }
    })
}

function show_cards_center(cards){
    c = $('#centercards')
    c.empty()
    inner = ""
    for(card in cards){
        inner = `${inner}<div class='card dealt' id='carddealt'><img src='Cards/${cards[card].value}${cards[card].suit}.jpg' alt='Card' class='cardimg'></div>`
    }
    c.append(inner)
    $('#centercards').css('display','block')
    //need something for card on table

}

function hide_center(){
    $('#centercards').css('display','none')
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}

function make_card_swap(position, card){
    console.log("Creating function", position, card)
    return function() {
        //card goes to play hand position
        //player hand position goes to deck
        db.collection("games").doc(gameid).get().then((doc) => {
            data = doc.data()
            p_hand = data.hands[playername]
            discard_c = p_hand[position.toString()]
            p_hand[position.toString()] = card
            p_update = "hands."+playername
            db.collection("games").doc(gameid).update({[p_update]:p_hand})
            discard_card(discard_c)
        })
    }
}

function clear_card_race(){
    db.collection("games").doc(gameid).collection("GameState").doc("RacedCards").delete()
}

function make_card_to_discard(card){
    console.log("Center to discard function", card)
    return function(){
        console.log("discarding", card)
        discard_card(card)
    }
}

  //Listeners (Snapshot)
  //turn snapshot
  db.collection("games").doc(gameid).collection("GameState").doc("Turn").onSnapshot((doc)=>{
      if(!game_started){
        return
      }
      data = doc.data()
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
                            db.collection("games").doc(gameid).collection("GameState").doc("Discard").set({"Card":card})
                            card_race()
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
                            //change discard doc
                            db.collection("games").doc(gameid).collection("GameState").doc("Discard").set({"Card":card})
                            card_race()
                        })
                    })
                }
            })
          })
      }
  })

  async function card_race(){
        clear_card_race()
        setTimeout(()=>{
                //calculate the fastest response time
            db.collection("games").doc(gameid).collection("GameState").doc("RacedCards").get().then(function(doc){
                if(doc.exists){
                    data = doc.data()
                    times = Object.keys(data)
                    collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                    card = data[times.sort(collator.compare)[0]]
                    discard_card(card)
                }
                //next turn
                db.collection("games").doc(gameid).get().then((doc) => {
                    data = doc.data()
                    idx = data.players.indexOf(playername) + 1
                    db.collection("games").doc(gameid).collection("GameState").doc("Turn").set({"Turn":data.players[idx]})
                })
            })
        }, 6000)
  }

db.collection("games").doc(gameid).collection("GameState").doc("Discard").onSnapshot((doc)=>{
    if(!game_started){
      return
    }
    data = doc.data()
    d = data.Card
    load_game(false)
    delay_discard_card_show(d)
})