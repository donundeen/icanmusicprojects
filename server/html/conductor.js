const WEBSOCKET_PORT = 8001;
const WEBSERVER_PORT = 8002;

$(function() {

    console.log("starting");

    // chnage this depending on location of webserver. Figure out a way to make this more dynamic...
    let host =  window.location.host;
    host = host.replace(/:[0-9]+/,"");
    // remove port
    console.log(host);

    // some note characters: 
    // ♭ 𝅘𝅥𝅮𝅗𝅥°♭𝅘𝅥𝅗𝅥𝅗 𝄼 𝄽 

    //  const ws = new WebSocket('ws://localhost:8080');
    //const ws = new WebSocket('ws://192.168.4.34:8080');
    //const ws = new WebSocket('ws://10.102.134.110:8080');
    const ws = new WebSocket('ws://'+host+':'+WEBSOCKET_PORT);

    let wsready = false;  
    // Browser WebSockets have slightly different syntax than `ws`.
    // Instead of EventEmitter syntax `on('open')`, you assign a callback
    // to the `onopen` property.
    ws.onopen = function() {
        wsready = true;
        console.log("opened " + ws.readyState);
        message("ready", "READY NOW")
    };

    ws.onerror = function(msg){
        console.log("ws error");
        console.log(msg);
    }

    ws.onclose = function(msg){
        console.log("wsclose");
        console.log(msg);
    }

    ws.onmessage = function(event) {
//        console.log("got message "+ event);
        msg = JSON.parse(event.data);
  //      console.log(msg);
        if(msg.address == "score"){
            updateScore(msg.data);
        }
        if(msg.address == "curbeat"){
            updateBeat(msg.data[0],msg.data[1],msg.data[2]);
        }
    }

    function message(address, data){
        let msg = {address : address,
            data: data};  
        if(wsready){
        //    var buf = new Buffer.from(JSON.stringify(msg));
            ws.send(JSON.stringify(msg));
        }else{
            console.log("ws not ready");
        }
    }

    function updateScore(scoreText){
        let split = scoreText.split("\n");
        $(".score").empty();

        for (let i = 0; i < split.length; i++){
            line = split[i];
            let matches = line.match(/([0-9]+):([0-9]+)(.*)/);
            if(matches){
                let elem = $("<div>").appendTo(".score");
                $(elem).text(line);
                bar = parseInt(matches[1]);
                beat = parseInt(matches[2]);
                curpos = barBeatToPos(bar, beat);
                $(elem).addClass("line"); 
                $(elem).data("position", curpos);
                $(elem).attr("data-position", curpos);
            }
        }
    }


    function updateBeat(position, bar, beat){
        $(".position").text(bar+":"+beat);
        let selector = ".line[data-position='"+position+"']";
        if($(selector).length){
            $(".line").removeClass("curbeat");
            $(selector).addClass("curbeat");
        }
    }
        
    function sendScore(){
  //      let text = $(".score").text();
        let text = $.map(
            $(".line"), 
            function(element) {
                return $(element).text()
            })
            .join("\n");
        message("score", text);
    }


    $(".sendscore").click(function(){
        sendScore();
    });

    $(".play").click(function(){
        message("play", 1);
    });

    $(".stop").click(function(){
        message("stop", 1);
    });

    $(".pause").click(function(){
        message("pause",1);
    });

    $(".getscore").click(function(){
        message("getscore",1);
    });

    $(".score").on('keyup',function(e) {
        if(e.which == 13) {
            addLinesToScore();
        }
        setFocus();
    });
    $(".score").on("mouseup", setFocus);

    function posToBeatBar(curpos){
        let bar = Math.ceil(curpos / 4);
        let beat = ((curpos - 1) % 4) + 1;        
        return [bar, beat];
    }
    function barBeatToPos(bar, beat){
        curpos = ((bar - 1) * 4) + (beat);
        return curpos;
    }

    function addLinesToScore(){

        let curpos = 0;
        let bar = Math.floor(curpos / 4) + 1;
        let beat = ((curpos - 1) % 4) + 1;    
        var startPosition = $(".score").selectionStart;
        var endPosition = $(".score").selectionEnd;    
        $(".score div").each(function(key, elem){
            // go line by line, and make sure
            // each line has a "line" class
            // - each line starts with a bar:beat that matches the data-position value
            // (change the data-position to mathc the written text)
            let content = $(elem).text();
            let matches = content.match(/([0-9]+):([0-9]+)(.*)/);
            if(matches){
                bar = parseInt(matches[1]);
                beat = parseInt(matches[2]);
                curpos = barBeatToPos(bar, beat);
                $(elem).addClass("line"); 
                $(elem).data("position", curpos);
                $(elem).attr("data-position", curpos);
            }else{
                curpos++;
                [bar, beat] = posToBeatBar(curpos);
                $(elem).addClass("line");
                content = bar+":"+beat+ " " +content;
                $(elem).data("position", curpos);
                $(elem).attr("data-position", curpos);
                $(elem).text(content);
            }
        });

        let lastpos = $(".score .line").last().data("position");
        $(".score div").not(".line").each(function(key,elem){
            curpos++
            let content = $(elem).text();
            let bar = Math.floor(curpos / 4) + 1;
            let beat = ((curpos - 1) % 4) + 1;
            content = bar+":"+beat+ " " +content;
            $(elem).addClass("line");
            $(elem).data("position", curpos);
            $(elem).attr("data-position", curpos);
            $(elem).text(content);
        });

        // send updated score here:
        sendScore();
    }

    var selectedElement = null;
    function setFocus(e) {
        $(".line").removeClass("highlight");
        selectedElement = window.getSelection().focusNode.parentNode;
            // walk up the DOM tree until the parent node is contentEditable
        while (selectedElement.parentNode && selectedElement.parentNode.contentEditable != 'true') {
            selectedElement = selectedElement.parentNode;
        }
        $(selectedElement).addClass("highlight");
    }

});