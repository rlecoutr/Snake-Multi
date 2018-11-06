var mycanvas = document.getElementById('canvas_jeu');

var socket = io.connect('http://localhost:8080');

var pseudo = prompt("Quel est votre pseudo ?");


var id=-1;
socket.on("connected", function(i){

    id = i;

});

var largeur = mycanvas.width;
var hauteur = mycanvas.height;
var ctx = mycanvas.getContext('2d');   


var colors = ['green', 'blue', 'orange', 'black', 'red', 'pink'];


var couleur_nourriture = "red";

var tailleCase = 10;


var corps_serpent = function(x, y, wait, k){

    if (wait)
        ctx.globalAlpha = 0.5;

    ctx.fillStyle = colors[k];
    ctx.fillRect(x*tailleCase, y*tailleCase, tailleCase, tailleCase);
    ctx.strokeStyle = 'grey';
    ctx.strokeRect(x*tailleCase, y*tailleCase, tailleCase, tailleCase);
    
    if (wait)
        ctx.globalAlpha = 1;
}


var nourriture = function(x, y){
    ctx.fillStyle = couleur_nourriture;
    ctx.beginPath();
    ctx.arc(x*tailleCase+tailleCase/2, y*tailleCase+tailleCase/2, tailleCase/2, 0, Math.PI*2, 0);
    ctx.fill();
}


socket.on('serpents', function(S) {

    snakes = S.tab;
    waits = S.wait;

    Ns = snakes.length;

    for (var k=0; k<Ns; k++){

        n = snakes[k].length;

        for (var iter = 0; iter<n; iter++){
            
            corps_serpent(snakes[k][iter][0], snakes[k][iter][1], waits[k], k);
        
        }
    }

    
})

socket.on('nourriture', function(tab) {


    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, largeur, hauteur);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(0, 0, largeur, hauteur);

    nourriture(tab[0], tab[1]);
})
    
socket.on('scores', function(text) {


    $("#liste").html(text);


})

socket.on('fin', function(fin){

    if (fin){
        $("#canvas_jeu").hide();
        $("#oui").html("<h2>PERDUUUU</h2></br></br></br></br>");
    }

})



document.onkeydown = function(event) {

    var keyCode = event.keyCode;


    switch(keyCode) {
        case 37:
            socket.emit('direction', {dir:'gauche', idd:id});
            break;
        case 38:
            socket.emit('direction', {dir:'haut', idd:id});
            break;
        case 39:
            socket.emit('direction', {dir:'droite', idd:id});
            break;
        case 40:
            socket.emit('direction', {dir:'bas', idd:id});
            break;
    }

    return false;
}

$('#start').click(function(){
       
    $('#canvas_jeu').show();         

    $('html, body').animate({
        scrollTop: ($('#start').offset().top)
    },500);

    socket.emit("start", pseudo);

})
