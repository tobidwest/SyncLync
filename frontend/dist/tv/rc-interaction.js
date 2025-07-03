// scene implementation
var scene = {
  theAppObject: null,
  appAreaDiv: null,
  isAppAreaVisible: false,
  redButtonDiv: null,
  lastNavigationButtonPressed: null,
  lastPlaybackButtonPressed: null,
  lastNumericButtonPressed: null,
  shouldReactToPlaybackButtons: false,
  shouldReactToNumericButtons: false,
  timeout: 0,
  initialize: function (appObj) {
    this.theAppObject = appObj;
    this.appAreaDiv = document.getElementById("app_area");
    this.redButtonDiv = document.getElementById(
      "red_button_notification_field"
    );
    // register RC button event listener
    rcUtils.registerKeyEventListener();
    // initial state is app_area hidden
    this.hideAppArea();
    // REMOVE render the scene so it is ready to be shown
    // this.render();
  },
  getRelevantButtonsMask: function () {
    // mask includes color buttons
    var mask =
      rcUtils.MASK_CONSTANT_RED +
      rcUtils.MASK_CONSTANT_GREEN +
      rcUtils.MASK_CONSTANT_YELLOW +
      rcUtils.MASK_CONSTANT_BLUE;
    // and navigation
    mask += rcUtils.MASK_CONSTANT_NAVIGATION;
    // add playback buttons if scene should react to them
    if (this.shouldReactToPlaybackButtons) {
      mask += rcUtils.MASK_CONSTANT_PLAYBACK;
    }
    // add numeric buttons if scene should react to them
    if (this.shouldReactToNumericButtons) {
      mask += rcUtils.MASK_CONSTANT_NUMERIC;
    }
    // return calculated button mask
    return mask;
  },
  showAppArea: function () {
    this.appAreaDiv.style.visibility = "visible";
    this.redButtonDiv.style.visibility = "hidden";
    this.isAppAreaVisible = true;
    // when shown, app reacts to all buttons relevant on the scene
    rcUtils.setKeyset(this.theAppObject, this.getRelevantButtonsMask());
  },
  hideAppArea: function () {
    this.appAreaDiv.style.visibility = "hidden";
    this.redButtonDiv.style.visibility = "visible";
    this.isAppAreaVisible = false;
    // when hidden, app reacts only to red button key press (show app scene)
    rcUtils.setKeyset(this.theAppObject, rcUtils.MASK_CONSTANT_RED);
  },
  // REMOVE
  // render: function () {
  //   var navigationField = document.getElementById("navigation_field");
  //   var playbackField = document.getElementById("playback_field");
  //   var togglePlaybackField = document.getElementById("toggle_playback_field");
  //   var numericField = document.getElementById("numeric_field");
  //   var toggleNumericField = document.getElementById("toggle_numeric_field");
  //   var preventField = document.getElementById("prevent_field");
  //   // do navigation buttons
  //   if (this.lastNavigationButtonPressed === null) {
  //     navigationField.innerHTML =
  //       "Please press one of the navigation buttons (arrows, OK/ENTER, back).";
  //   } else {
  //     navigationField.innerHTML = this.lastNavigationButtonPressed;
  //   }
  //   // do playback buttons
  //   if (this.shouldReactToPlaybackButtons) {
  //     if (this.lastPlaybackButtonPressed === null) {
  //       playbackField.innerHTML =
  //         "Please press one of the playback buttons (trick play controls).";
  //     } else {
  //       playbackField.innerHTML = this.lastPlaybackButtonPressed;
  //     }
  //     togglePlaybackField.innerHTML = "Disable playback buttons";
  //   } else {
  //     playbackField.innerHTML =
  //       "Please press the green button to enable playback buttons.";
  //     togglePlaybackField.innerHTML = "Enable playback buttons";
  //   }
  //   // do numeric buttons
  //   if (this.shouldReactToNumericButtons) {
  //     if (this.lastNumericButtonPressed === null) {
  //       numericField.innerHTML =
  //         "Please press one of the numeric buttons (0 ... 9).";
  //     } else {
  //       numericField.innerHTML = this.lastNumericButtonPressed;
  //     }
  //     toggleNumericField.innerHTML = "Disable numeric buttons";
  //   } else {
  //     numericField.innerHTML =
  //       "Please press the yellow button to enable numeric buttons.";
  //     toggleNumericField.innerHTML = "Enable numeric buttons";
  //   }
  //   // do prevent field
  //   preventField.innerHTML =
  //     "Please press the blue button to prevent the app from receiving button events for 10 seconds.";
  // },
  // timerTick: function () {
  //   // check if timeout occured
  //   if (scene.timeout > 0) {
  //     // not yet, display message
  //     var preventField = document.getElementById("prevent_field");
  //     preventField.innerHTML =
  //       "The app shall not receive RC button events for " +
  //       scene.timeout +
  //       " seconds.";
  //     // decrement timeout and reschedule for 1 second
  //     scene.timeout--;
  //     setTimeout(scene.timerTick, 1000);
  //   } else {
  //     // timeout occured, start reacting to buttons again
  //     rcUtils.setKeyset(scene.theAppObject, scene.getRelevantButtonsMask());
  //     // and rerender scene
  //     scene.render();
  //   }
  // },
};

// RC button press handler function
function handleKeyCode(kc) {
  try {
    // REMOVE
    // var shouldRender = true;
    // process buttons
    switch (kc) {
      case VK_RED:
        // red button shows & hides the app scene
        console.log("red"); //TODO REMOVE
        if (scene.isAppAreaVisible) {
          scene.hideAppArea();

          stateUtitls.hideEverything();
        } else {
          scene.showAppArea();

          setTimeout(function () {
            stateUtitls.displayCorrectState();
          }, 500); // wait for 500ms to ensure that UI change is completed
        }

        // REMOVE no need to rerender complete scene
        // shouldRender = false;
        break;
      case VK_GREEN:
        // TODO – LOGOUT IMPLEMENTIEREN
        // wenn eingeloggt und App aktiv (also nicht im Hintergrund):
        //    logout über api auslösen (damit cookies gelöscht werden)
        //    state auf login wechseln
        // sonst: nichts tun
        break;
      // REMOVE
      // case VK_YELLOW:
      //   // yellow button toggles numeric buttons
      //   if (scene.shouldReactToNumericButtons) {
      //     scene.shouldReactToNumericButtons = false;
      //   } else {
      //     scene.shouldReactToNumericButtons = true;
      //     scene.lastNumericButtonPressed = null;
      //   }
      //   rcUtils.setKeyset(scene.theAppObject, scene.getRelevantButtonsMask());
      //   break;
      // case VK_BLUE:
      //   // blue button prevents user input for 10 seconds
      //   rcUtils.setKeyset(scene.theAppObject, 0); // this will prevent the app from receiving furher RC button events
      //   scene.timeout = 10;
      //   scene.timerTick();
      //   // REMOVE no need to rerender complete scene
      //   // shouldRender = false;
      //   break;
      // TODO change focus
      case VK_LEFT:
        if (linkUtils.currentFocusedCell) {
          const currentCell = linkUtils.currentFocusedCell;
          const currentRow = currentCell.parentElement;
          const cellsInRow = Array.from(
            currentRow.querySelectorAll(".grid-item")
          );
          const cellIndex = cellsInRow.indexOf(currentCell);

          if (cellIndex === 0) {
            // Fokus von Tabelle zu Navi springen (auf aktuell aktive Nav)
            const navLinks = document.querySelectorAll("#nav-links .nav-link");
            const navLinkToFocus =
              navLinks[linkUtils.activeNavIndex] || navLinks[0];
            if (navLinkToFocus) {
              linkUtils.focusNavLink(navLinkToFocus);
            }
          } else {
            // Eine Zelle nach links in Tabelle
            const targetCell = cellsInRow[cellIndex - 1];
            linkUtils.focusCell(targetCell);
          }
        }
        break;

      case VK_RIGHT:
        if (linkUtils.currentFocusedNavLink) {
          // Fokus von Navi zurück in Tabelle: Erste Zelle der aktuell aktiven Links-Tabelle-Zeile fokussieren
          const linksTable = document.getElementById("links-table");
          const rows = linksTable.querySelectorAll("tr");
          if (rows.length > 0) {
            const firstCell = rows[0].querySelector(".grid-item");
            if (firstCell) {
              linkUtils.focusCell(firstCell);
            }
          }
        } else if (linkUtils.currentFocusedCell) {
          const currentCell = linkUtils.currentFocusedCell;
          const currentRow = currentCell.parentElement;
          const cellsInRow = Array.from(
            currentRow.querySelectorAll(".grid-item")
          );
          const cellIndex = cellsInRow.indexOf(currentCell);

          let targetCell;
          if (cellIndex === cellsInRow.length - 1) {
            targetCell = cellsInRow[0];
          } else {
            targetCell = cellsInRow[cellIndex + 1];
          }

          // Prüfen, ob targetCell einen Link (data-link-url) enthält
          if (targetCell.hasAttribute("data-link-url")) {
            linkUtils.focusCell(targetCell);
          }
          // sonst nichts tun, Fokus bleibt auf currentCell
        }
        break;

      case VK_DOWN:
        if (linkUtils.currentFocusedNavLink) {
          // Fokus in Navi: eine Collection nach unten (wrap-around bleibt)
          const navLinks = Array.from(
            document.querySelectorAll("#nav-links .nav-link")
          );
          let idx = navLinks.indexOf(linkUtils.currentFocusedNavLink);
          idx = (idx + 1) % navLinks.length;
          linkUtils.focusNavLink(navLinks[idx]);
        } else if (linkUtils.currentFocusedCell) {
          const currentCell = linkUtils.currentFocusedCell;
          const table = currentCell.closest("table");
          const currentRow = currentCell.parentElement;
          const rows = Array.from(table.querySelectorAll("tr"));
          const cellsInCurrentRow = Array.from(
            currentRow.querySelectorAll(".grid-item")
          );
          const colIndex = cellsInCurrentRow.indexOf(currentCell);

          let rowIndex = rows.indexOf(currentRow);

          // KEIN wrap-around nach oben, also nur vorwärts, wenn nicht letzte Zeile
          if (rowIndex < rows.length - 1) {
            rowIndex = rowIndex + 1;

            const targetRow = rows[rowIndex];
            const targetCells = Array.from(
              targetRow.querySelectorAll(".grid-item")
            );

            const targetCell =
              targetCells[colIndex] || targetCells[targetCells.length - 1];

            if (targetCell.hasAttribute("data-link-url")) {
              linkUtils.focusCell(targetCell);
            }
          }
          // sonst Fokus bleibt auf currentCell (keine Aktion)
        }
        break;

      case VK_UP:
        if (linkUtils.currentFocusedNavLink) {
          // Fokus in Navi: eine Collection nach oben (wrap-around bleibt)
          const navLinks = Array.from(
            document.querySelectorAll("#nav-links .nav-link")
          );
          let idx = navLinks.indexOf(linkUtils.currentFocusedNavLink);
          idx = (idx - 1 + navLinks.length) % navLinks.length;
          linkUtils.focusNavLink(navLinks[idx]);
        } else if (linkUtils.currentFocusedCell) {
          const currentCell = linkUtils.currentFocusedCell;
          const table = currentCell.closest("table");
          const currentRow = currentCell.parentElement;
          const rows = Array.from(table.querySelectorAll("tr"));
          const cellsInCurrentRow = Array.from(
            currentRow.querySelectorAll(".grid-item")
          );
          const colIndex = cellsInCurrentRow.indexOf(currentCell);

          let rowIndex = rows.indexOf(currentRow);

          // KEIN wrap-around nach unten, also nur rückwärts, wenn nicht erste Zeile
          if (rowIndex > 0) {
            rowIndex = rowIndex - 1;

            const targetRow = rows[rowIndex];
            const targetCells = Array.from(
              targetRow.querySelectorAll(".grid-item")
            );

            const targetCell =
              targetCells[colIndex] || targetCells[targetCells.length - 1];

            if (targetCell.hasAttribute("data-link-url")) {
              linkUtils.focusCell(targetCell);
            }
          }
          // sonst Fokus bleibt auf currentCell (keine Aktion)
        }
        break;

      case VK_ENTER:
        if (linkUtils.currentFocusedNavLink) {
          // Aktiviere die Collection (wie z.B. bei Hover)
          const idx = parseInt(linkUtils.currentFocusedNavLink.dataset.idx, 10);
          if (!isNaN(idx)) {
            linkUtils.setActiveNav(idx);
            linkUtils.renderLinksTable(linkUtils.collections[idx].links || []);
            // Fokus bleibt auf Navi-Link (optional)
            linkUtils.focusNavLink(linkUtils.currentFocusedNavLink);
          }
        } else if (linkUtils.currentFocusedCell) {
          // Link in Tabelle aktivieren (wie bisher)
          linkUtils.activateLink(linkUtils.currentFocusedCell);
        }
        break;

      //activateFocusedItem();
      // break;
      //  REMOVE
      // case VK_BACK:
      //   // BACK button
      //   scene.lastNavigationButtonPressed = "BACK";
      //   break;
      // case VK_PLAY:
      //   // PLAY button
      //   scene.lastPlaybackButtonPressed = "PLAY";
      //   break;
      // case VK_PAUSE:
      //   // PAUSE button
      //   scene.lastPlaybackButtonPressed = "PAUSE";
      //   break;
      // case VK_PLAY_PAUSE:
      //   // PLAY / PAUSE button
      //   scene.lastPlaybackButtonPressed = "PLAY / PAUSE";
      //   break;
      // case VK_STOP:
      //   // STOP button
      //   scene.lastPlaybackButtonPressed = "STOP";
      //   break;
      // case VK_FAST_FWD:
      //   // FFWD button
      //   scene.lastPlaybackButtonPressed = "FFWD";
      //   break;
      // case VK_REWIND:
      //   // RWD button
      //   scene.lastPlaybackButtonPressed = "RWD";
      //   break;
      // case VK_0:
      //   // 0 numeric button
      //   scene.lastNumericButtonPressed = "0";
      //   break;
      // case VK_1:
      //   // 1 numeric button
      //   scene.lastNumericButtonPressed = "1";
      //   break;
      // case VK_2:
      //   // 2 numeric button
      //   scene.lastNumericButtonPressed = "2";
      //   break;
      // case VK_3:
      //   // 3 numeric button
      //   scene.lastNumericButtonPressed = "3";
      //   break;
      // case VK_4:
      //   // 4 numeric button
      //   scene.lastNumericButtonPressed = "4";
      //   break;
      // case VK_5:
      //   // 5 numeric button
      //   scene.lastNumericButtonPressed = "5";
      //   break;
      // case VK_6:
      //   // 6 numeric button
      //   scene.lastNumericButtonPressed = "6";
      //   break;
      // case VK_7:
      //   // 7 numeric button
      //   scene.lastNumericButtonPressed = "7";
      //   break;
      // case VK_8:
      //   // 8 numeric button
      //   scene.lastNumericButtonPressed = "8";
      //   break;
      // case VK_9:
      //   // 9 numeric button
      //   scene.lastNumericButtonPressed = "9";
      //   break;
      default:
      // REMOVE pressed unhandled key
      // shouldRender = false;
    }
    // REMOVE
    // if (shouldRender) {
    //   // render scene
    //   scene.render();
    // }
  } catch (e) {
    // pressed unhandled key, catch the error
  }
  // we return true to prevent default action for processed keys
  return true;
}

// app entry function
function start() {
  try {
    // attempt to acquire the Application object
    var appManager = document.getElementById("applicationManager");
    var appObject = appManager.getOwnerApplication(document);
    // check if Application object was a success
    if (appObject === null) {
      // error acquiring the Application object!
    } else {
      // we have the Application object, and we can initialize the scene and show our app
      scene.initialize(appObject);
      appObject.show();
    }
  } catch (e) {
    // this is not an HbbTV client, catch the error.
  }

  // show the red button prompt
  setTimeout(() => {
    const red_button_notification_field = document.getElementById(
      "red_button_notification_field"
    );
    red_button_notification_field.style.visibility = "visible";
    setTimeout(() => {
      red_button_notification_field.style.visibility = "hidden";
    }, 5000);
  }, 1000);
}
