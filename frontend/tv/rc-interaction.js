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
};

// RC button press handler function
function handleKeyCode(kc) {
  try {
    switch (kc) {
      case VK_RED:
        // red button shows & hides the app scene
        if (scene.isAppAreaVisible) {
          scene.hideAppArea();

          stateUtitls.hideEverything();
        } else {
          scene.showAppArea();

          setTimeout(function () {
            stateUtitls.displayCorrectState();
          }, 500); // wait for 500ms to ensure that UI change is completed
        }
        break;

        // logout functionality
      case VK_GREEN:
        if (scene.isAppAreaVisible) {
          //check whether user is logged in
          const xhr = new XMLHttpRequest();
          xhr.open("GET", "/api/collections", true);

          xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                // logout
                const logoutXhr = new XMLHttpRequest();
                logoutXhr.open("POST", "/auth/logout", true);
                logoutXhr.onreadystatechange = function () {
                  if (logoutXhr.readyState === 4) {
                    if (logoutXhr.status === 200) {
                      // change to login-screen
                      document.getElementById("state-linklist").classList.add("state-hidden");
                      document.getElementById("state-login").classList.remove("state-hidden");
                      loginUtils.startDeviceAuth();
                    } else {
                      console.error("Logout failed with status: " + logoutXhr.status);
                    }
                  }
                };
                logoutXhr.send();  
              } else {
                //do nothing
                console.log("user is not logged in, cannot logout")
              }
            }
          };
          xhr.send(); 
        }
        break;

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
          // otherwise focus remains on currentCell
        }
        break;

      case VK_ENTER:
        if (linkUtils.currentFocusedNavLink) {
          // activate the collection
          const idx = parseInt(linkUtils.currentFocusedNavLink.dataset.idx, 10);
          if (!isNaN(idx)) {
            linkUtils.setActiveNav(idx);
            linkUtils.renderLinksTable(linkUtils.collections[idx].links || []);
            // focus remains on the collection
            linkUtils.focusNavLink(linkUtils.currentFocusedNavLink);
          }
        } else if (linkUtils.currentFocusedCell) {
          // activate a link table cell
          linkUtils.activateLink(linkUtils.currentFocusedCell);
        }
        break;

    }
    /
  } catch (e) {
    // pressed unhandled key, catch the error
  }
  // we return true to prevent default action for processed keys
  return true;
}

// app entry function
function start() {
  try {
    // attempt to acquire the application object
    var appManager = document.getElementById("applicationManager");
    var appObject = appManager.getOwnerApplication(document);
    // check if application object was a success
    if (appObject === null) {
      // error acquiring the application objecto
    } else {
      // we have the Application object, and we can initialize the scene and show our app
      scene.initialize(appObject);
      appObject.show();
    }
  } catch (e) {
    // this is not an HbbTV client, catch the error
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
