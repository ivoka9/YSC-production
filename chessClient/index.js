// NOTE: this example uses the chess.js library:
  // https://github.com/jhlywa/chess.js
  require('dotenv').config();

  let flag = false;
  let lessonFlag = false;
  let isLesson = false;
  let lessonStarted = false;
  let lessonBoard = "";
  let lessonEnd = "";
  let endSquare = "";
  let previousEndSquare = "";
  var squareClass = 'square-55d63';
  var $board = $('#myBoard');
  var board = null
  var game = new Chess()
  //var $status = $('#status')
  //var $fen = $('#fen')
  //var $pgn = $('#pgn')

  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  var eventer = window[eventMethod];
  var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

  var playerColor;

  let startFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"

  letParentKnow();
  // Listen to message from child window
  eventer(messageEvent, (e) => {
    //console.log("Hey, I am going to update the board state");
    let data = JSON.parse(e.data);
    console.log(data);
    lessonFlag = data.lessonFlag;
    if(lessonFlag == true) { isLesson = true; }

    if(isLesson == true) {
      console.log("I am isLesson " + isLesson);
      endSquare = data.endSquare;
      lessonBoard = data.boardState;
      lessonEnd = data.endState;
      playerColor = data.color;
      previousEndSquare = data.previousEndSquare;

      if(previousEndSquare !== "") {
        $board.find('.square-' + previousEndSquare)
        .removeClass('highlight');
      }
      
      if(lessonStarted == false) {
        var lessonConfig = {
          draggable: true,
          position: lessonBoard,
          onDragStart: onDragStart,
          onDrop: onDrop,
          onSnapEnd: onSnapEnd
        }
        board = Chessboard('myBoard', lessonConfig);
        lessonStarted = true;
        game.load(lessonBoard);
      } else {
        board.position(data.boardState);
        game.load(data.boardState);
        updateStatus();
      }

      $board.find('.square-' + endSquare)
    .addClass('highlight');
      
    }
    else if(data.boardState == startFEN){
      game = new Chess();
    }
    if(isLesson == false){
      console.log(data.boardState);
      playerColor = data.color;
      board.orientation(playerColor);
      game.load(data.boardState);
      board.position(data.boardState);
      updateStatus();
    }
    
  }, false);
  
  function flip() {
	  board.flip();
  }

  function letParentKnow() {
    if(flag === false) {
       parent.postMessage("ReadyToRecieve", process.env.PARENT);
      //parent.postMessage("ReadyToRecieve", "http://localhost:4200");
      //console.log("message sent");
    }
    flag = true;
  }

  function onDragStart(source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if(isLesson == false) {
      if (game.game_over()) {
        sendGameOver();
        return false;
      } 
    }

    console.log(playerColor);
      if(playerColor === "black") {
        if(piece.search(/^w/) !== -1) return false;
      } else if(playerColor === "white") {
        if(piece.search(/^b/) !== -1) return false;
      }
    
    // only pick up pieces for the side to move
    console.log("I am is Lesson " + isLesson);
      console.log("I am in piece move validation");
      if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
      }
  }

  function onDrop(source, target) {
    // see if the move is legal
    var move = game.move({
      from: source,
      to: target,
      promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })

    // illegal move
    if (move === null) return 'snapback'

  if(isLesson == false) {
    if(game.game_over()) {
      console.log("game over");
      sendGameOver();
    }
  }

  console.log("I am in drop");
    updateStatus()
    console.log(game.fen());
    sendToParent(game.fen());
  }

  function sendToParent(fen) {
    parent.postMessage(fen, process.env.PARENT);
    //parent.postMessage(fen, "http://localhost:4200");
  }

  // update the board position after the piece snap
  // for castling, en passant, pawn promotion
  function onSnapEnd() {
    board.position(game.fen())
  }

  function updateStatus() {
    var status = ''
    console.log("I am in status");

    var moveColor = 'White'
    if (game.turn() === 'b') {
      moveColor = 'Black'
    }

    // checkmate?
    if(isLesson == false){
      if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.'
        sendCheckmate();
      }
    

      // draw?
      else if (game.in_draw()) {
        status = 'Game over, drawn position'
        sendDraw();
      }
    }

    // game still on
    else {
      status = moveColor + ' to move'

      // check?
      if (game.in_check()) {
        status += ', ' + moveColor + ' is in check';
      }
    }

    // $status.html(status)
    // $fen.html(game.fen())
    // $pgn.html(game.pgn())
  }

  function sendGameOver() {
    parent.postMessage("gameOver", process.env.PARENT);
    //parent.postMessage("gameOver", "http://localhost:4200");
  }

  function sendDraw() {
    parent.postMessage("draw", process.env.PARENT);
    //parent.postMessage("draw", "http://localhost:4200");
  }

  function sendCheckmate() {
    parent.postMessage("checkmate", process.env.PARENT);
    //parent.postMessage("checkmate", "http://localhost:4200");
  }

  var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  }
  
  if(isLesson == false) { board = Chessboard('myBoard', config); }
  
  $(window).resize(board.resize);

  updateStatus()
