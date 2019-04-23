// Quelques variables global

var conteneurGrilleDiv = $("#conteneur-grille");
var finPartieDiv = $("#fin-jeu");
var buttonCombatDiv = $(".combat-conteneur");
var jouerEncoreBtn = $("#jouer-encore");
var messageDiv = $(".message");
var message1Div = $(".message1");
var message2Div = $(".message2");
var ganantDiv = $(".gagnant");

//Obtient un nombre aléatoire dans un intervalle

function aleatoire (min, max) {
	return Math.round( Math.random() * (max - min) + min );
}

/*---------------------------------------------------------
CONSTRUCTEURS
----------------------------------------------------------*/ 

// Constructeur d'obstacle

var Obstacle = {
    type: "obstacle",
    img: "images/bloc.png"
};

// Constructeur d'arme

var Arme = {
    type: "arme",
    
    init: function(nom, degats, img) {
        this.nom = nom;
        this.degats = degats;
        this.img = img;
    }
};

// Constructeur de joueur

var Joueur = {
    
    pointsDeVie         : 100,    
    arme                : "",
    x                   : -1, // Initialisation joueur dans la position x
    y                   : -1, // Initialisation joueur dans la position y

    init: function(nom, img, index) {
        this.nom = nom;
        this.index = index;
        this.img = img;
        this.arme = couteau;
        this.status = "attaquer";
    },
    
    setPosition: function (x, y) {
        this.x = x;
        this.y = y;
    },
    
    /*--------------------------------------------------------------------------------------------
    MOVEMENT DES JOUEURS 
    --------------------------------------------------------------------------------------------*/    
 
    
    // Déplace le joueur au besoin. Prendre en compte les obstacles, les options de combat et les armes.
    
    genDeplacement: function (direction, nbDeplacement) {          
        var x = this.x;
        var y = this.y;        
       
        var joueur = partie[partie.tour];        
        var img = joueur.arme.img;       
        
        for (var i = 0; i < nbDeplacement; i++) {             
            
            if (direction === "gauche") {
                x--;
            } else if (direction === "droite") {
                x++;
            } else if (direction === "haut") {
                y--;
            } else {
                y++;
            }
            
            var el = document.getElementById(x + "-" + y);             
            var posAncienne = { // On stock la position ou joueur été avant
                x: this.x,
                y: this.y
                
            };             
                      
            var carre = partie.plateau.carres[y][x];
            
            this.setPosition (x, y);                
            partie.plateau.placementJoueur(this);
            carre = partie.plateau.carres[posAncienne.y][posAncienne.x];                    
                           
            if (carre.arme) { 
                
                carre.changementArme(joueur);  
                
            } else {
                
                carre.element.style.backgroundImage = "";                        
               
            }                                 
                            
            partie.plateau.carres[posAncienne.y][posAncienne.x].libre = true;           
                     
        }
        
        partie.changementTour();               
    },
    
    attaquer: function () { 
        
        var autreJoueur = partie.getAutreJoueur();
        
        if (this.status === "defense") {
            
            this.status = "attaquer";            
            partie.changementTour();
            
            return;
        }

        $(" .message").text(this.nom + " à choisi d'attaquer!");
        
        var degats = this.arme.degats;      
       
        //si l'adversaire est en mode defense, les degats sont divides par 2
        if (autreJoueur.status === "defense")  {
            degats /= 2;           
        } 
        
        autreJoueur.pointsDeVie -= degats;    
        partie.changementTour();        
        
        if (autreJoueur.pointsDeVie <= 0) {            
            
            partie.finPartie(this.nom);
            
        }       
    },    
    
    estACote: function (autreJoueur) {        
        
        if (autreJoueur.x === this.x ) {
            if (autreJoueur.y === this.y -1 || autreJoueur.y === this.y +1) {
                
                return autreJoueur;                
                
            } else {
                
                return false;
            }
            
        } else if (autreJoueur.y === this.y) {
            if (autreJoueur.x === this.x -1 || autreJoueur.x === this.x +1) {
                
                return autreJoueur;               
                
            } else {
                
                return false;
            }
            
        } else {
            
            return false;
        }      
    },
    
    seDefendre: function () {
        
        this.status = "defense";
    }, 
    
    //Creation des infos 
    
    setJoueursInfo: function (joueurDiv, joueur, arme) {
        $(joueurDiv + " .vie").text(joueur.pointsDeVie);
        $(joueurDiv + " .arme-valeur").text(joueur.arme.nom + " " +joueur.arme.degats);
    },      
};

// Constructeur button attaquer et defense

var BtnCombat = {
    init: function (comBtn) {
        this.el = document.createElement("button");
        this.el.id = comBtn;       
        this.addListener(comBtn);
        this.el.innerHTML = comBtn;        
        document.getElementById("btn-combat").appendChild(this.el);
      
        this.el.className = "display-none";
        
    },   
    
    addListener: function (comBtn) {
        this.el.addEventListener("click", function (e) {         
          
            if (comBtn === "attaquer") {
                partie[partie.tour].attaquer();                
                Joueur.setJoueursInfo("#joueur-1", partie.joueur1);
                Joueur.setJoueursInfo("#joueur-2", partie.joueur2);
                
            } else  {                
                
                var autreJoueur = partie.getAutreJoueur();
                autreJoueur.seDefendre();
                $(" .message").text(partie.getAutreJoueur().nom + " à choisi de se defendre!");
                
            }           
        });
    }   
    
};

var btnAttaque  = Object.create(BtnCombat);
btnAttaque.init("attaquer");

var btnDefense  = Object.create(BtnCombat);
btnDefense.init("defendre");

// Constructeur de cases

var Carre = {
    
    libre: true, // S'Il y a un obstacle elle est false
    
    arme: false,    
    
    distance: false,
    
    direction: false,

    init: function(x, y, element) {
        this.x = x;
        this.y = y;
        this.element = element;
        this.ajoutClic();        
    },
      
    ajoutClic: function () {
        var that = this; // On declare une variable that qui sauvegarde this
        this.element.addEventListener("click", function (e) {
            if (that.libre && that.distance && that.direction) {
               var joueur = partie[partie.tour];
               joueur.genDeplacement(that.direction, that.distance);
            }
        });
    },

    changementArme: function (joueur) {        
        var armeInitial = this.arme;        
        
         // déposé ici l'arme que l'on avait avant de s' équiper la nouvelle
        this.element.style.backgroundImage = "url(" + joueur.arme.img + ")";
        joueur.arme = armeInitial;
       
        this.changementArmeValeur("#joueur-1", partie.joueur1);
        this.changementArmeValeur("#joueur-2", partie.joueur2);             
    },

    changementArmeValeur: function (joueurDiv, joueur, arme) {    
        
        $(joueurDiv + " .arme-valeur").text(joueur.arme.nom + " " + joueur.arme.degats);
    },
    
   };

// Constructeur de grille de jeu

var Plateau = {
    
    carres: [],
    
    carreObj: {},

    carresJouables: [],
    
    // Methodes d'initialization du tableau de jeu, obstacles, armes et position initial des joueurs  
    
    init: function(plateauContainerId, nombre_obstacles, nombre_armes, armes, joueur1, joueur2) {
        this.plateauContainer = document.getElementById(plateauContainerId);
        var ligne;
        var ligneElt;        
        var carre;
        var carreElt;
        
        for (var y = 0; y < 10; y++) { // Rempli mon tableau ligne
            ligne = [];
            ligneElt = document.createElement("div");
            ligneElt.className = "ligne";
            
            for (var x = 0; x < 10; x++) {
                carreElt = document.createElement("div");
                carreElt.className = "carre";
                carreElt.id = y + "-" + x;
                ligneElt.appendChild(carreElt);                
                
                carre = Object.create(Carre);
                
                carre.init(x, y, carreElt);
                
                ligne.push(carre); // Ajout d'une ligne            
                
            }
            
            this.plateauContainer.appendChild(ligneElt);           
            this.carres[y] = ligne;
            
        }         
        
        this.placementObstacles(nombre_obstacles);
        this.placementArmes(armes, nombre_armes);
        this.placementInitialJoueur(joueur1);
        this.placementInitialJoueur(joueur2);
        Joueur.setJoueursInfo("#joueur-1", joueur1);
        Joueur.setJoueursInfo("#joueur-2", joueur2);
    },    
          
    placementJoueur: function(joueur) {
        var x = joueur.x;
        var y = joueur.y;        
        var carre = this.carres[y][x];
        
        carre.libre = false;
        carre.element.style.backgroundImage = "url(" + joueur.img + ")";
    },
    
    placementElement: function (item, nombre_element) {        
        var x;
        var y;        
        var img;
        var indexAleatoire;
        var arme;
        
        for (var i = 0; i < nombre_element; i++) {
            
            x = aleatoire(0, 9);
            y = aleatoire(0, 9);
            
            var carre = this.carres[y][x];
            
            if (carre.libre && !carre.arme) {
                if(item.type === "obstacle") {
                    
                    img = "images/bloc.png";
                    carre.libre = false;
                    
                } else {
                    
                    var armes = item;
                    
                    indexAleatoire = aleatoire(0, armes.length - 1); // quantité des armes sur le plateau
                    
                    arme = armes[indexAleatoire];
                    img = arme.img;
                    carre.arme = arme;
                }
                
                carre.element.style.backgroundImage = "url(" + img + ")";
                
            } else {
                
                i--;
            }
        }
    },
    
    placementInitialJoueur: function (joueur) {
        //joueur.y = joueur.index === 1 ? 0 : 9;
        
        var autreJoueur;
        
        if (joueur.index === 1) {
            autreJoueur = partie.joueur2;
        } else {
            autreJoueur = partie.joueur1;
        }
        
        while (autreJoueur) { // Si l'autre joueur n'est pas egal à false
            
            joueur.y = aleatoire(0, 9);
            joueur.x = aleatoire(0, 9);
            autreJoueur = joueur.estACote(autreJoueur);
        }

        this.placementJoueur(joueur);

        if (joueur.index === 1) {
            this.listeCarresJouables(joueur.x, joueur.y);
        }
        
    },
    
    placementObstacles: function(nombre_obstacles) {
        
        var obstacle = Object.create(Obstacle);
        this.placementElement(obstacle, nombre_obstacles);
    },
    
    placementArmes: function(armes, nombre_armes) {
        this.placementElement(armes, nombre_armes);
        
    },

    listeCarresJouables: function (x, y) {
        
        this.supprimerAnciensCarresJouables();

        var _x, _y;
        
        ["gauche", "droite", "haut", "bas"].forEach(direction => {
            
            _x = x;
            _y = y;

            for (var i = 1; i < 4; i ++) {
                if (direction === "gauche") {
                    _x--;
                } else if (direction === "droite") {
                    _x++;
                }else if (direction === "haut") {
                    _y--;
                } else {
                    _y++;
                }
                    
                if(this.carres[_y] && this.carres[_y][_x] && this.carres[_y][_x].libre) {

                    this.carres[_y][_x].element.style.backgroundColor = "silver";
                    this.carres[_y][_x].direction                     = direction;
                    this.carres[_y][_x].distance                      = i;

                    this.carresJouables.push(this.carres[_y][_x]);
                
                } else {
                    break; // on quitte la boucle 
                }
            }
        });
    },

    supprimerAnciensCarresJouables: function () {
        this.carresJouables.forEach( carre => {
            carre.element.style.backgroundColor = "";
            carre.direction                     = false;
            carre.distance                      = false;
        });

        this.carresJouables = [];
    }

};

// Creation du jeu

var Partie = {
    
    init: function(plateauContainerId, armes) {
        
        this.tour = "joueur1";
        
        //Initialization des joueurs 
        
        this.joueur1 = Object.create(Joueur);
        this.joueur1.init("may", "images/joueur1.png", 1);
        
        this.joueur2 = Object.create(Joueur);
        this.joueur2.init("sorciere", "images/joueur2.png", 2);
        
        this.plateau = Object.create(Plateau);
        this.plateau.init(plateauContainerId, 10, 4, armes, this.joueur1, this.joueur2);
    },
    
    changementTour: function () {
        
        let autreJoueur, joueur;
        if (this.tour === "joueur1") {
            
            this.tour = "joueur2";
            autreJoueur = this.joueur1;
            $(" .message1").text("May, c'est à toi de jouer!");
            $(" .message2").text("Sorcière, c'est à toi de jouer!");
            $(" .message1").hide();
            $(" .message2").show();
        } else {
            
            this.tour = "joueur1";
            autreJoueur = this.joueur2;
            $(" .message1").text("May, c'est à toi de jouer!");
            $(" .message2").text("Sorcière, c'est à toi de jouer!");
            $(" .message1").show();
            $(" .message2").hide();
        }

        joueur = this[this.tour];
 
        
        if (!joueur.estACote(autreJoueur)) {
            
            this.initCarresJouablesPourJoueur();
            
        } else {
            
            this.plateau.supprimerAnciensCarresJouables();
            btnAttaque.el.className = "combat-btn";
            btnDefense.el.className = "combat-btn";
        }

    },
    
    getAutreJoueur: function () {
        
        var autreJoueur;
        
        if (this.tour === "joueur1") {
            autreJoueur = this.joueur2;
        } else {
            autreJoueur = this.joueur1;
        }
        
        return autreJoueur;        
    },

    initCarresJouablesPourJoueur: function () {
         this.plateau.listeCarresJouables(this[this.tour].x, this[this.tour].y);
    }, 
    
    finPartie: function (nom) {        
        alert(nom + " a gagné !");
        ganantDiv.text(nom + " a gagné la partie !");
        conteneurGrilleDiv.hide();
        buttonCombatDiv.hide();
        finPartieDiv.show();
        messageDiv.hide();
        message1Div.hide();
        message2Div.hide();
    }   
};

//Initialisation des armes 

var couteau = Object.create(Arme);
couteau.init("couteau", 10, "images/couteau.png");

var epee = Object.create(Arme);
epee.init("epee", 15, "images/epee.png");

var pistolet = Object.create(Arme);
pistolet.init("pistolet", 20, "images/pistolet.png");

var fusil = Object.create(Arme);
fusil.init("fusil", 25, "images/fusil.png");

var bazooka = Object.create(Arme);
bazooka.init("bazooka", 30, "images/bazooka.png");

var armes = [epee, pistolet, fusil, bazooka];

var partie = Object.create(Partie);

partie.init("grille", armes);

// Evénèment actualization jeu

$("#jouer-encore").on("click", function () {
    location.reload();
});
