# 42-red-tetris

language typescript
frontend svelte
frontend mostly jrenault
backend mostly hgeffroy
backend node.js Express
socket io pour les sockets

functionnal library like lodash or ramda (dig)

backend in OOP
classes for Player, Piece and Game

SVG forbidden
Canvas forbidden
DOM manip like jquery forbidden

70% units tests, 50% of branches.

- Les blocs tombent, si une ligne est complétée, elle est supprimée
- Si multijoueur, compléter n ligne ajoute n - 1 ligne indestructible à l'adversaire 
- même séquence pour tous les joueurs

Tetrimino shapes and rotation rules

tableau de booléen avec 1 pour pièce et 0 pour rien
le back envoie la position du tableau de la pièce et le front l'affiche

json tableau booléen, position, couleur.
le back calcule et envoie toutes les positions à chaque fois

lock la room quand la game est lancée mais peut être rejointe dès que la game est finie

le front envoie les inputs quand ils sont disponibles

le back envoie les infos en 60 fps

https://excalidraw.com/#json=VW6odnKOXzNvXVvvdje-D,wZBOWPiye1_8r4WbTMHtug
