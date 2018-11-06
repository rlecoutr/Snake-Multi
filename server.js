var http = require('http');

var toSource = require('tosource');

var express = require('express');
var app = express();
var server = http.Server(app);

var io = require('socket.io').listen(server);


// Chargement du fichier index.html affiché au client


app.get('/', function(req, res){

    res.sendFile(__dirname + '/index.html');

});


app.use(express.static(__dirname + '/public'));



var users = [];
var sockets = [];


var taille = 10;
var snakes = [];
var directions = [];
var debutWaits = [];


var scores = [];










io.sockets.on('connection', function (socket) {

    socket.on("start", function(pseudo){

        socket.pseudo = pseudo;
        sockets.push(socket);

        users.push(pseudo);
        scores.push(0);

        snakes.push([[12, 12], [11, 12], [10, 12], [9, 12], [8, 12]]);
        directions.push("bas");
        debutWaits.push(true);

        waitStart(users.length-1);

        if(users.length==1){
            init();
        }



        socket.emit("connected", users.length-1);
        socket.emit("scores", text_scores());

        console.log(pseudo+" s'est connecté au jeu");

    });

    socket.on('disconnect', function(){

        var i = sockets.indexOf(socket);

        console.log(users[i] + " s'est déconnecté du jeu");


        sockets.splice(i, 1);

        users.splice(i, 1);
        snakes.splice(i, 1);
        scores.slice(i, 1);
        directions.splice(i, 1);

        if (users.length==0){
            fin();
        }


    });

    

    var hauteur = 350;
    var largeur = 350;

    var piz = [5, 5];

    var loop = setInterval(function(){}, 80);



    //Socket d'entrée de touche

    socket.on('direction', function(obj) {

        dir = obj.dir;
        var id = obj.idd;

        sleep(90);

        if ((directions[id] == "haut" && dir != "bas") || (directions[id] == "bas" && dir != "haut") || (directions[id] == "gauche" && dir != "droite") || (directions[id] == "droite" && dir != "gauche"))
            directions[id] = dir;

    });


    // Fonction test appartenance tableau

    function inTab(X) {

        Ns = snakes.length;

        for (var k=0; k<Ns; k++){

            var n = snakes[k].length;

            for (var i=0; i<n; i++){

                if (toSource(snakes[k][i]) == toSource(X))
                    return true;

            }

        }

        return false;
    }


    function sleep(milliseconds) {
      var start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
          break;
        }
      }
    }

    function waitStart(i){

        debutWaits[i] = true;

        setTimeout(function(){
            stopWaitStart(i);
        }, 3000);

    }

    function stopWaitStart(i){

        debutWaits[i] = false;

    }

    // Fonction création food


    function food() {

        var pasbon = true;

        while (pasbon) {

            nourriture = [Math.floor((Math.random() * 30) + 1), Math.floor((Math.random() * 30) + 1)];

            pasbon = inTab(nourriture);

        }

        return nourriture;
    }

    function text_scores(){

        text = "";
        for (i=0; i<users.length; i++){

            text += "<li><b>"+users[i]+"</b> : "+scores[i]+"</li>";

        }

        return text;

    }


    // Function emit

    function emission() {

        socket.emit("nourriture", piz);
        socket.broadcast.emit("nourriture", piz);

        S = {
            tab:snakes,
            wait: debutWaits
        };

        socket.emit("serpents", S);
        socket.broadcast.emit("serpents", S);
        

        socket.emit("scores", text_scores());
        socket.broadcast.emit("scores", text_scores());
    }


    // Fonction collision

    function Collision(X, Y, i){


        if (X == -1 || Y == -1 || X == hauteur/taille || Y == largeur/taille)
            return true;

        if (debutWaits[i])
            return false;


        for (var k=0; k<snakes.length; k++){

            if (k==i){
                for (var j=1; j<snakes[k].length; j++){
                    if (snakes[k][j][0] == X && snakes[k][j][1] == Y)
                        return true;
                }
            }

            else{
                for (var j=0; j<snakes[k].length; j++){
                    if (snakes[k][j][0] == X && snakes[k][j][1] == Y)
                        if (debutWaits[k])
                            return false;
                        else
                            return true;
                }
            }
        }

        return false;

    }

    // Fonction de fin de partie d'un joueur

    function fin(i){

        sockets.splice(i, 1);

        users.splice(i, 1);
        snakes.splice(i, 1);
        scores.splice(i, 1);
        directions.splice(i, 1);


        if (users.length == 0)
            clearInterval(loop);

    }

    // Fonction boucle


    function boucleJeu() {

        var n = users.length;

        for (var i=0; i<n; i++){

            X = snakes[i][0][0];
            Y = snakes[i][0][1];

            if (directions[i] == "haut")
                Y--;
            else if (directions[i] == "droite")
                X++;
            else if (directions[i] == "bas")
                Y++;
            else
                X--;


            if (Collision(X, Y, i)){
           
                sockets[i].emit("fin", true);
                fin(i);
                return;

            }

            if (X == piz[0] && Y == piz[1] && !debutWaits[i]){

                scores[i] = scores[i] + 1;
                piz = food();

            }
            else{

                snakes[i].pop();

            }

            var tete = [X, Y];
            snakes[i].unshift(tete);

        }

        emission();

    }

    

    // Fonction d'initialisation

    function init() {

        piz = food();

        emission();

        clearInterval(loop);

        loop = setInterval(function(){
            boucleJeu();
        }, 80);
    }


});


server.listen(8080);
