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
//        console.log(msg.address);
        if(msg.address == "score"){
            updateScore(msg.data);
        }
        if(msg.address == "curbeat"){
            updateBeat(msg.data[0],msg.data[1],msg.data[2]);
        }
        if(msg.address =="addinstrument"){
            console.log("adding instrument");
            instrumentAnnounced(msg);
        }
        if(msg.address =="updateinstrument"){
            updateInstrumentData(msg.data.device_name, msg.data);
        }
        if(msg.address =="makenote"){
            updateInstrumentMakenote(msg.data.device_name, msg.data);
        }

        // add message about adding a new instrument here
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



    let instrcount = 0;
    $(".play").click(function(){
        message("play", 1);
        /*
        instrcount++;
        let id = "instr"+instrcount;
        createInstrumentForm(id, {});        
        */
    });

    $(".stop").click(function(){
        message("stop", 1);
    });

    $(".reset").click(function(){
        console.log("sending reset");
        message("reset", 1);
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

    $(".copyme").hide();

    function instrumentAnnounced(options){
        /*
        options is an array of objects w/ properties name, type, and value        
        */
        console.log("instrumentAnnounced");
        console.log(options.data);
        let id = options.data.filter((item)=>item.name=="device_name")[0].value;
        
        // if the instrument already has an interface, don't create a new one,
        // but DO update the form with the options, since they might have changed in the meantime
        if($( "#"+id ).length){
            console.log("updating form");
            let instr = $("#"+id);
            let midi_voice = options.data.filter((item)=>item.name=="midi_voice")[0].value;
            let midimin = options.data.filter((item)=>item.name=="midimin")[0].value;
            let midimax = options.data.filter((item)=>item.name=="midimax")[0].value;
            $( ".midi-range",instr ).slider( "option", "values", [ midimin, midimax ] );
            $( ".range_display",instr ).val(  midimin + " - " + midimax );
            $( ".midi-voice",instr ).slider( "option", "values", midi_voice );
            return;
        }

        let options_object = {};
        for(let i =0; i< options.data.length; i++){
            options_object[options.data[i]["name"]] = options.data[i]["value"];
        }       
        console.log("id is  " +id);
        console.log(options_object);
        console.log(options.data);
        createInstrumentForm(id, options.data, options_object);
    }

    function createInstrumentForm(id, options_array, options_object){
        console.log("coptying");
        let instr = $(".copyme").clone(true,true).removeClass("copyme").show().attr("id",id).appendTo(".instruments");
        //***** Setting up instrument nodes,  */
        let midimin = options_object.midimin  ? options_object.midimin : 32;
        let midimax = options_object.midimax  ? options_object.midimax : 100;
        let midi_voice = options_object.midi_voice  ? options_object.midi_voice : 1;
        let midi_channel = options_object.midi_channel  ? options_object.midi_channel : 0;
        let device_name = options_object.device_name  ? options_object.device_name : "BAD_NAME";
        let instrtype = options_object.instrtype ? options_object.instrtype : "UNKNOWNTYPE";
        $(instr).data("device_name", device_name);
        $(instr).data("instrtype", instrtype);
        $(instr).attr("id", device_name);
        $( ".device_name span",instr ).text(device_name);
        $( ".midi-range",instr ).slider({
            range: true,
            min: 0,
            max: 127,
            values: [midimin, midimax ],
            slide : function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".range_display",instr ).val(  ui.values[ 0 ] + " - " + ui.values[ 1 ] );
            },
            stop    : function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".range_display",instr ).val(  ui.values[ 0 ] + " - " + ui.values[ 1 ] );
                let min = ui.values[ 0 ];
                let max = ui.values[ 1 ];
                let address = "instrval";
                let instrtype = $(instr).data("instrtype"); // local or udp
                let data = {id:id, 
                            instrtype : instrtype,
                            var: "midimin",
                            val: min};
                message(address, data);
                data.var = "midimax";
                data.val = max;
                message(address, data);

            }
        });
        $( ".range_display" ,instr).val( midimin +
            " - " + midimax );

        $( ".midi-channel",instr ).slider({
            range: false,
            min: 0,
            max: 15,
            value: midi_channel,
            slide: function( event, ui ) {
                console.log("slide", ui.value);
                $(event.target).closest(".instrument").attr("id")                
                $( ".channel_display",instr ).val(  ui.value );
            },            
            stop: function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".channel_display",instr ).val(  ui.value );
                let address = "instrval";
                let instrtype = $(instr).data("instrtype"); // local or udp
                let data = {id:id, 
                            instrtype: instrtype,
                            var: "midi_channel",
                            val: ui.value };
                message(address, data);
            }
        });
        $( ".channel_display",instr ).val(midi_channel );
        $( ".channel_display",instr ).keyup(function(event){
            console.log(event.which);
            if(event.which == 13) {
                let val = parseInt($(event.target).val());
                parseChannelVal(val, instr);
            }
        });
        $( ".channel_display",instr ).blur(function(event){
            let voiceval = parseInt($(event.target).val());
            parseVoiceVal(voiceval, instr);
        });

        function parseChannelVal(val, instr){
            console.log("voice value", val);
            if(!isNaN(val)){
                $( ".midi-channel",instr ).slider("value", val);
                $( ".channel_display",instr ).val(val);
                sendChannelVal(val);                
            }
        }
        function sendChannelVal(val){
            let address = "instrval";            
            let data = {id:id, 
                instrtype: instrtype,
                var: "midi_channel",
                val: val };
            message(address, data);             
        }


        $( ".midi-voice",instr ).slider({
            range: false,
            min: 0,
            max: 127,
            value: midi_voice,
            slide: function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".voice_display",instr ).val(  ui.value );
            },
            
            stop: function( event, ui ) {
                $(event.target).closest(".instrument").attr("id")                
                $( ".voice_display",instr ).val(  ui.value );
                let address = "instrval";
                let instrtype = $(instr).data("instrtype"); // local or udp
                console.log("sending " + ui.value + instrtype);
                let data = {id:id, 
                            instrtype: instrtype,
                            var: "midi_voice",
                            val: ui.value,
                            foo: "bar1" };
                message(address, data);                
            }
        });
        $( ".voice_display",instr ).val( midi_voice );
        $( ".voice_display",instr ).keyup(function(event){
            console.log(event.which);
            if(event.which == 13) {
                let voiceval = parseInt($(event.target).val());
                parseVoiceVal(voiceval, instr);
            }
        });
        $( ".voice_display",instr ).blur(function(event){
            let voiceval = parseInt($(event.target).val());
            parseVoiceVal(voiceval, instr);
        });

        function parseVoiceVal(val, instr){
            console.log("voice value", val);
            if(!isNaN(val)){
                $( ".midi-voice",instr ).slider("value", val);
                $( ".voice_display",instr ).val(val);
                let instrtype = $(instr).data("instrtype");
                let id = $(instr).attr("id");               
                sendVoiceVal(val, id, instrtype);                
            }
        }
        function sendVoiceVal(voiceval, id, instrtype){
            let address = "instrval";            
            let data = {id:id, 
                instrtype: instrtype,
                var: "midi_voice",
                val: voiceval,
                foo: "bar2" };
            message(address, data);             
        }

        $(".resetbutton button", instr).click(function(event,ui){
            console.log("reset clicked");
            id = $(event.target).closest(".instrument").attr("id");
            let address = "instrval";
            let instrtype = $(instr).data("instrtype"); // local or udp
            let data = {id:id, 
                        instrtype: instrtype,
                        var: "reset",
                        val: 1 };
            message(address, data);               
        });
    }


    function updateInstrumentData(id, data_obj){
        console.log("updateInstrument");
        console.log(data_obj);
        let instr = $("#"+id);
        console.log(data_obj.sensor_value);
        if(data_obj.sensor_value){
            $( ".sensor_val span",instr ).text(data_obj.sensor_value);
        }
    }
    function updateInstrumentMakenote(id, data_obj){
        console.log("updateMakenote");
        console.log(data_obj);
        let instr = $("#"+id);
        let text = data_obj.pitch + ":"+data_obj.velocity+":"+data_obj.duration;
        console.log(text);
        $( ".makenote span",instr ).text(text);
    }


});