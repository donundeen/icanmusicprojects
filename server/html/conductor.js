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
        ws.send("READY NOW");    
    };

    ws.onerror = function(msg){
        console.log("ws error");
        console.log(msg);
    }

    ws.onclose = function(msg){
        console.log("wsclose");
        console.log(msg);
    }

    ws.onmessage = function(msg) {
        console.log("got message "+ msg);
        console.log(JSON.stringify(msg));
    };  

    function message(msg){
        if(wsready){
            ws.send(msg);
        }else{
            console.log("ws not ready");
        }
    }

    $(".play").click(function(){
        console.log("play");
        $(".score .line").removeClass("highlight");
   //     $('.score .line[data-position="2"]').addClass("highlight");
        addLinesToScore();
    });


    $(".score").on('keyup',function(e) {
        console.log(e);
        if(e.which == 13) {
            addLinesToScore();
            setFocus();
        }
        selectedElement = window.getSelection().focusNode.parentNode;
        console.log(selectedElement);
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
        console.log("selection " +  startPosition + " , " +endPosition);
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
            console.log(matches);
        });

        let lastpos = $(".score .line").last().data("position");
        console.log(lastpos);
        $(".score div").not(".line").each(function(key,elem){
            curpos++
            console.log("pos " + curpos);
            let content = $(elem).text();
            let bar = Math.floor(curpos / 4) + 1;
            let beat = ((curpos - 1) % 4) + 1;
            content = bar+":"+beat+ " " +content;
            $(elem).addClass("line");
            $(elem).data("position", curpos);
            $(elem).attr("data-position", curpos);
            $(elem).text(content);
        });

    }

    var selectedElement = null;
    function setFocus(e) {
        $(".line").removeClass("highlight");
        selectedElement = window.getSelection().focusNode.parentNode;
        console.log("focus node");
        console.log(selectedElement);
            // walk up the DOM tree until the parent node is contentEditable
        while (selectedElement.parentNode && selectedElement.parentNode.contentEditable != 'true') {
            selectedElement = selectedElement.parentNode;
        }
        $(selectedElement).addClass("highlight");
     //   $(selectedElement).focus();
    }

});