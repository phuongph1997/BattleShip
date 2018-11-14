"using strict";

var BOARD_SIZE = 9;

var player1array = new Array(BOARD_SIZE + 1);
var player2array = new Array(BOARD_SIZE + 1);
var playerTurn = null;
var turn = 0;
var movedShip = null;
var shipType = null;
var player = null;

const states = {PLACESHIP:0, ROTATE:1, READY:4, PLAYERTURN:2, OPPONENTTURN:3};
const command = {UP:'w', DOWN:'s', LEFT:'a', RIGHT:'d', OK:'f', CANCLE:'g'};
const ships = [2, 3, 3, 4, 5];
var index = 0;
var state = null;
var selectedPoint = null;
var shipLength = null;
var direction = null;
var opponent_done = false;

// handle socket event
// var socket = io("18.136.212.75:3000");

// socket event move

// socket event emit Client_PlaceShip_Done

// socket event on Server_Opponent_Done

// socket event emit Client_Shot

// socket event on Server_WereShot

// socket event emit Client_Shot_Result

// socket event on Server_Shot

// socket event

$(function() {

  for (var i = 0; i < player1array.length; i++) {
    player1array[i] = new Array(BOARD_SIZE + 1);
    player2array[i] = new Array(BOARD_SIZE + 1);
  }

  for (var i = 0; i < player1array.length; i++) {
    for (var j = 0; j < player1array.length; j++) {
      player1array[i][j] = false;
      player2array[i][j] = false;
    }
  }

  /**
   * Create the boards
   */
  var board1 = document.getElementById('player1-board');
  var board2 = document.getElementById('player2-board');
  for (var i = 1; i <= BOARD_SIZE; i++) {
    for (var j = 1; j <= BOARD_SIZE; j++) {
      var div1 = document.createElement('div');
      div1.id = i + "" + j + "-1";
      div1.style.width = (100 / BOARD_SIZE) + "%";
      div1.style.height = (100 / BOARD_SIZE) + "%";
      board1.appendChild(div1);
      var div2 = document.createElement('div');
      div2.id = i + "" + j + "-2";
      div2.style.width = (100 / BOARD_SIZE) + "%";
      div2.style.height = (100 / BOARD_SIZE) + "%";
      board2.appendChild(div2);
    }
  }

  /**
   * Pick a ship to place
   */

  $('.ship').click(function(e) {
    movedShip = e.target;
    shipType = movedShip.className.split(" ")[1];

    console.log('selected ship : ' + movedShip.className);
    $('#debug').text("DEBUG: movedShip : " + movedShip.className + ", shipType : " + shipType);

    if ($(e.target).parents('#left').length)
      player = 1;
    else
      player = 2;
    $('.board > div').not('.ship').removeClass();
    $('.board > div').not('.ship').addClass('place-ship ' + shipType);
    if ($(movedShip).hasClass('vertical'))
      $('.board > div').not('.ship').addClass('vertical');

  });

  /**
   * Place a ship on the board
   */
  $('body').on('click', '.place-ship', function(e) {
    if (validPlacement(player, movedShip, shipType, e.target)) {
      var parent = (player == 1 ? "#left" : "#right");
      // Remove ship from picking area
      $(parent + ' .ship-placeholder > .' + shipType).css('display', 'none');
      // Remove hover classes from empty squares
      $('.board > div').not('.ship').removeClass();
      var row = e.target.id.substr(0, 1);
      var col = e.target.id.substr(1, 1);
      var shipLength = shipType.substr(shipType.length-1, 1);
      if ($(movedShip).hasClass('vertical')) {
        $('#' + row + col + "-" + player).addClass('ship ' + shipType + ' vertical');
        for (var i = 1; i < shipLength; i++) {
          $('#' + (parseInt(row)+i) + col + "-" + player).addClass('ship');
        }
      }
      else {
        $('#' + row + col + "-" + player).addClass('ship ' + shipType);
        for (var i = 1; i < shipLength; i++) {
          $('#' + row + (parseInt(col)+i) + "-" + player).addClass('ship');
        }
      }

      if (player === 1) {
        if ($('#left .ship[style="display: none;"]').length === 8) {
          $('button#' + player).removeClass('hidden');
        }
      }
      else {
        if ($('#right .ship[style="display: none;"]').length === 10) {
          $('button#' + player).removeClass('hidden');
        }
      }

      /*movedShip = null;
      shipType = null;
      player = null;*/
    }
  });

  /**
   * Ready: hide ships and start game
   */
  $('button').click(function(e) {
    storeShips(e.target.id);
    $(e.target).hide();
    if ($('button[style]').length == 2) {
      $('#player1-board').addClass('shoot');
      $('.score').show();
      playerTurn = 1;
    }
  });


  /**
   * Reload the page
   */
   $('#reset').click(function() {
      location.reload();
   });


  /**
   * Shoot ship
   */
  $('body').on('click', '.shoot > div', function(e) {
    var row = e.target.id.substr(0, 1);
    var col = e.target.id.substr(1, 1);
    if (!$(e.target).hasClass('bomb')) {
      if (playerTurn === 1) {
        if (player2array[row][col]) {
          $(e.target).addClass('ship bomb');
          $('#left #shots').html("Shots: &nbsp; " + $('#left .bomb').length);
          $('#left #hits').html("Hits: &nbsp;&nbsp;&nbsp;&nbsp; " + $('#left .ship.bomb').length);
        }
        else {
          $(e.target).addClass('bomb');
          $('#left #shots').html("Shots: &nbsp; " + $('#left .bomb').length);
        }
      }
      else {
        if (player1array[row][col]) {
          $(e.target).addClass('ship bomb');
          $('#right #shots').html("Shots: &nbsp; " + $('#right .bomb').length);
          $('#right #hits').html("Hits: &nbsp;&nbsp;&nbsp;&nbsp; " + $('#right .ship.bomb').length);
        }
        else {
          $(e.target).addClass('bomb');
          $('#right #shots').html("Shots: &nbsp; " + $('#right .bomb').length);
        }
      }
      if ($('#player' + playerTurn + '-board .ship.bomb').length === 17) {
        $('#p' + playerTurn).html("Winner").css('color', '#AFB42B');
        $('.shoot').addClass('winner');
        $('.shoot').removeClass('shoot');
      }
      else {
        $('#player' + playerTurn + '-board').removeClass('shoot');
        playerTurn = (++turn) % 2 + 1;
        $('#player' + playerTurn + '-board').addClass('shoot');
      }
    }
  });

});

/**
 * Checks if the ship placement is valid, e.g. not outside of the board,
 * not on another ship, etc.
 * @param  player    the player placing the ship
 * @param  movedShip the ship that will be placed on the board
 * @param  shipType  the type of ship
 * @param  box       the square to place the ship in
 * @return          true if it is a valid placement
 */
function validPlacement(player, movedShip, shipType, box) {
  var shipLength = shipType.substr(shipType.length-1, 1);
  var row = box.id.substr(0, 1);
  var col = box.id.substr(1, 1);
  if ($(movedShip).hasClass('vertical')) {
    // Vertical ship
    if (BOARD_SIZE - shipLength < row - 1)
      return false;
    for (var i = 0; i < shipLength; i++) {
      if ($('#' + (parseInt(row)+i) + col + "-" + player).hasClass('ship'))
        return false;
    }
  }
  else {
    // Horizontal ship
    if (BOARD_SIZE - shipLength < col - 1)
      return false;
    for (var i = 0; i < shipLength; i++) {
      if ($('#' + row + (parseInt(col)+i) + "-" + player).hasClass('ship'))
        return false;
    }
  }
  return true;
}

/**
 * Stores the ships in a matrix and hides them from the board.
 * @param  player  the player board to store and hide
 */
function storeShips(player) {
  console.log(player);
  for (var i = 1; i <= BOARD_SIZE; i++) {
    for (var j = 1; j <= BOARD_SIZE; j++) {
      if ($('#' + i + j + "-" + player).hasClass('ship')) {
        if (player == 1)
          player1array[i][j] = true;
        else
          player2array[i][j] = true;
      }
    }
  }
}


// init all variable
$(document).ready(function(e){
  state = states.PLACESHIP;
  selectedPoint = 11;
  shipLength = ships[index];
  direction = command.RIGHT;

  PickShip('ship2');
});

// test
$(document).keypress(function(e){

  // e.which returns the keycode which we convert into
  // the key with fromCharCode
  var keyPressed = String.fromCharCode(e.which)

  Process(keyPressed);
});

function PickShip(shipType){
    $('.board > div').not('.ship').removeClass();
    $('.board > div').not('.ship').addClass(shipType);
    $('.board > div').not('.ship').addClass('opacity');
}

function Process(key ){
  //in the board field
  console.log('selected rectangle: ' + '#'+selectedPoint+'-1');
  console.log('state: ' + state);
  console.log('keypress: ' + key);

  switch (state)
  {
    case states.PLACESHIP:
      PlaceShip (key);
      break;

    case states.ROTATE:
      Rotate (key);
      break;
    case states.READY:
      if (key == command.OK);
        storeShips(1)
        console.log('status : ready')
        if (!opponent_done)
          $('#waiting').removeClass('hidden')
        // Do press button
    case states.PLAYERTURN:
    case states.OPPONENTTURN:
    default:
      break;
  }
  // in ship container field
}

function PlaceShip (key){

  // get previous position
  let X = parseInt(selectedPoint%10);
  let Y = parseInt(selectedPoint/10);

  switch (key){
    // up
    case command.UP:
      if (Y != 1)
        Y -= 1;
      else return;
      break;

    //left  
    case command.LEFT:
      if (X  != 1)
        X -= 1;
      else return;
      break;

    //right  
    case command.RIGHT:
      if (X  < BOARD_SIZE)
        X += 1;
      else return;
      break;

    //down
    case command.DOWN:
      if (Y  < BOARD_SIZE)
        Y += 1;
      else return;
      break;

    //OK
    case command.OK:
      if (CheckPlacement(command.RIGHT) || CheckPlacement(command.LEFT) 
          || CheckPlacement(command.DOWN) || CheckPlacement(command.UP)) {
        state = states.ROTATE;
        return;
      }
      break;
    default:
      break;
  }
  // store value back to selectedPoint
  oldSelectedPoint = selectedPoint;
  selectedPoint = Y * 10 + X;
  let PreviousID = '#'+oldSelectedPoint+'-1';
  let CurrentID = '#'+selectedPoint+'-1';

  $(CurrentID).addClass('selected');
  if (CheckPlacement(direction)){
    $(CurrentID).addClass('place-ship');
    switch (direction){
      case command.UP:
        $(CurrentID).addClass('vertical up');
        break;
      case command.LEFT:
        $(CurrentID).addClass('left');
        break;
      case command.DOWN:
        $(CurrentID).addClass('vertical');
        break;
      default:
        break;
    }
  } else {
    //selectedPoint = oldSelectedPoint;
  }
  // remove old selected rectangle
  $(PreviousID).not('.ship').removeClass('vertical up left'); 
  $(PreviousID).removeClass('place-ship');
  $(PreviousID).removeClass('selected');

  
}

function Rotate (key){
  let X = parseInt(selectedPoint%10);
  let Y = parseInt(selectedPoint/10);
  let CurrentID = '#'+selectedPoint+'-1';
  switch (key){
      // up
      case command.UP:
        if (CheckPlacement(command.UP)){
          $(CurrentID).addClass('vertical up');
          $(CurrentID).removeClass('left');   
          $(CurrentID).addClass('place-ship');
          direction = command.UP;
        }
        break;

      //left  
      case command.LEFT:
        if (CheckPlacement(command.LEFT)){
          $(CurrentID).addClass('left');
          $(CurrentID).removeClass('vertical up');
          $(CurrentID).addClass('place-ship');
          direction = command.LEFT;  
        }
        break;

      //right  
      case command.RIGHT:
        if (CheckPlacement(command.RIGHT)){
          $(CurrentID).removeClass('vertical up left');
          $(CurrentID).addClass('place-ship');
          direction = command.RIGHT;            
        }
        break;

      //down
      case command.DOWN:
        if (CheckPlacement(command.DOWN)){
          $(CurrentID).addClass('vertical');
          $(CurrentID).removeClass('left up');
          $(CurrentID).addClass('place-ship');
          direction = command.DOWN;  
        }
        break;

      //OK
      case command.OK:
        state = states.PLACESHIP;
        // Remove ship from picking area
        $('#shipNo' + (index + 1)).css('display', 'none');
        // Remove opcatity
        $(CurrentID).removeClass('opacity');
        $(CurrentID).addClass('ship');
        $('.board > div').not('.ship').removeClass();
        switch (direction){
          case command.UP:
            for (var i = 1; i < shipLength; i++) {
              $('#' + (Y - i) + X + "-1").addClass('ship');
            }
            break;

          case command.LEFT:
            for (var i = 1; i < shipLength; i++) {
              $('#' + Y  + (X - i) + "-1").addClass('ship');
            }
            break;

          case command.RIGHT:
            for (var i = 1; i < shipLength; i++) {
              $('#' + Y + (X + i) + "-1").addClass('ship');
            }
            break;

          case command.DOWN:
            for (var i = 1; i < shipLength; i++) {
              $('#' + (Y+i) + X + "-1").addClass('ship');
            }
            break;
          default:
            break;
        }

        console.log('index : ' + index);
        console.log('ships lenght: ' + ships.length);
        
        //increase shiplength
        index++;
        shipLength = ships[index];
        PickShip('ship' + shipLength);

        // Check if all the ship have been placed
        if ((index ) === ships.length) {
          $('#Ready_button').removeClass('hidden');
          $('#Ready_button').addClass('selected')
          // end shipplacement
          $(CurrentID).removeClass('selected');
          state = states.READY;

          // highlight ready button
        }


        break;

      // Cancle
      case command.CANCLE:
        //$(CurrentID).removeClass('vertical up left');
        //direction = command.RIGHT;
        state = states.PLACESHIP;
        break;
      default:
        break;
    }
}

function CheckPlacement(direct){
  var temp ;
  let X = parseInt(selectedPoint%10);
  let Y = parseInt(selectedPoint/10);

  switch (direct){
    case command.UP:
      if (Y - shipLength + 1 <= 0)
        return false;
      temp = -10;
      break;

    case command.LEFT:
      if (X - shipLength + 1 <= 0)
        return false;
      temp = -1;
      break;

    case command.RIGHT:
      if (X + shipLength - 1 > BOARD_SIZE)
        return false;
      temp = 1;
      break;

    case command.DOWN:
      if (Y + shipLength - 1 > BOARD_SIZE)
        return false;
      temp = 10;
      break;
    default:
      break;
  }

  for (var i = 0; i < shipLength; i++) 
      if ($('#' + (selectedPoint + temp*i) + "-1").hasClass('ship'))
          return false;
  return true
}
  