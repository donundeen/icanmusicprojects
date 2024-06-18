const debugging = class{

    active = false;

    log(){
        if(this.active){
            console.log(...arguments);
        }
    }

}


module.exports = debugging;