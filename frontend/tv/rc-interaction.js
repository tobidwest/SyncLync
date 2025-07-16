// scene implementation

var scene = {
  theAppObject: null, // will hold the HbbTV application object
  appAreaDiv: null, // reference to the main app UI container
  isAppAreaVisible: false, // tracks if the app scene is currently visible
  redButtonDiv: null, // reference to red button notification prompt
  lastNavigationButtonPressed: null,
  lastPlaybackButtonPressed: null,
  lastNumericButtonPressed: null,
  shouldReactToPlaybackButtons: false, // whether to enable playback button input
  shouldReactToNumericButtons: false, // whether to enable numeric button input
  timeout: 0,
  // initializes the scene at app startup
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
    this.appAreaDiv.style.visibility = "visible"; // make app visible
    this.redButtonDiv.style.visibility = "hidden"; // hide red button prompt
    this.isAppAreaVisible = true;
    // when shown, app reacts to all buttons relevant on the scene
    rcUtils.setKeyset(this.theAppObject, this.getRelevantButtonsMask());
  },
  hideAppArea: function () {
    this.appAreaDiv.style.visibility = "hidden"; // hide app
    this.redButtonDiv.style.visibility = "visible"; // show red button prompt
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
        // red button shows and hides the app scene
        if (scene.isAppAreaVisible) {
          scene.hideAppArea();

          stateUtitls.hideEverything();
        } else {
          scene.showAppArea();

          setTimeout(function () {
            stateUtitls.displayCorrectState(); // decide what to show (login or links)
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
                      // after logout change to login-screen
                      document
                        .getElementById("state-linklist")
                        .classList.add("state-hidden");
                      document
                        .getElementById("state-login")
                        .classList.remove("state-hidden");
                      loginUtils.startDeviceAuth();
                    } else {
                      console.error(
                        "Logout failed with status: " + logoutXhr.status
                      );
                    }
                  }
                };
                logoutXhr.send();
              } else {
                //do nothing if not logged in
                console.log("user is not logged in, cannot logout");
              }
            }
          };
          xhr.send();
        }
        break;

      case VK_LEFT: // navigate left
        if (linkUtils.currentFocusedCell) {// if current focus is on a link cell   
          const currentCell = linkUtils.currentFocusedCell;
          const currentRow = currentCell.parentElement;
          const cellsInRow = Array.from(
            currentRow.querySelectorAll(".grid-item")
          );
          const cellIndex = cellsInRow.indexOf(currentCell);
          
          if (cellIndex === 0) { // if current focused link is the leftmost in the table row
            // set focus from link table to current collection
            const navLinks = document.querySelectorAll("#nav-links .nav-link");
            const navLinkToFocus =
              navLinks[linkUtils.activeNavIndex] || navLinks[0];
            if (navLinkToFocus) {
              linkUtils.focusNavLink(navLinkToFocus);
            }
          } else {
            // move one cell to the left in the table
            const targetCell = cellsInRow[cellIndex - 1];
            linkUtils.focusCell(targetCell);
          }
        }
        break;

      case VK_RIGHT: //navigate right
        if (linkUtils.currentFocusedNavLink) { // if current focus is on a collection
          // move focus from colelction to first element in the link table (link cell in upper-left corner)
          const linksTable = document.getElementById("links-table");
          const rows = linksTable.querySelectorAll("tr");
          if (rows.length > 0) {
            const firstCell = rows[0].querySelector(".grid-item");
            if (firstCell) {
              linkUtils.focusCell(firstCell);
            }
          }
        } else if (linkUtils.currentFocusedCell) { // if current focus is on a link cell
          const currentCell = linkUtils.currentFocusedCell;
          const currentRow = currentCell.parentElement;
          const cellsInRow = Array.from(
            currentRow.querySelectorAll(".grid-item")
          );
          const cellIndex = cellsInRow.indexOf(currentCell);

          let targetCell;
          if (cellIndex === cellsInRow.length - 1) { // if current focused link is the rightmost in the table row
            targetCell = cellsInRow[0]; // wrap-around to the first link cell in this row
          } else {
            targetCell = cellsInRow[cellIndex + 1]; // move one cell to the right
          }

          // check if the cell navigated to contains a link
          if (targetCell.hasAttribute("data-link-url")) {
            linkUtils.focusCell(targetCell); // set focus to this link cell
          }
          // do not move focus is next cell would be an empty cell
        }
        break;

      case VK_DOWN: // navigate down
        if (linkUtils.currentFocusedNavLink) { // if current focus is on a collection
          
          const navLinks = Array.from(
            document.querySelectorAll("#nav-links .nav-link")
          );
          let idx = navLinks.indexOf(linkUtils.currentFocusedNavLink);
          idx = (idx + 1) % navLinks.length; // move focus down in the collection list or to the very top if the current selected collection is at the bottom (wrap-around)
          linkUtils.focusNavLink(navLinks[idx]);
        } else if (linkUtils.currentFocusedCell) { // if current focus is on a link cell
          const currentCell = linkUtils.currentFocusedCell;
          const table = currentCell.closest("table");
          const currentRow = currentCell.parentElement;
          const rows = Array.from(table.querySelectorAll("tr"));
          const cellsInCurrentRow = Array.from(
            currentRow.querySelectorAll(".grid-item")
          );
          const colIndex = cellsInCurrentRow.indexOf(currentCell);

          let rowIndex = rows.indexOf(currentRow);

          // move one cell down (no wrap-around)
          if (rowIndex < rows.length - 1) {
            rowIndex = rowIndex + 1;

            const targetRow = rows[rowIndex];
            const targetCells = Array.from(
              targetRow.querySelectorAll(".grid-item")
            );

            const targetCell =
              targetCells[colIndex] || targetCells[targetCells.length - 1];
            // check if the cell navigated to contains a link
            if (targetCell.hasAttribute("data-link-url")) {
              linkUtils.focusCell(targetCell);  // set focus to this link cell
            }
          }
          // do not move focus is next cell would be an empty cell
        }
        break;

      case VK_UP:
        if (linkUtils.currentFocusedNavLink) { // if current focus is on a collection
          const navLinks = Array.from(
            document.querySelectorAll("#nav-links .nav-link")
          );
          let idx = navLinks.indexOf(linkUtils.currentFocusedNavLink);
          idx = (idx - 1 + navLinks.length) % navLinks.length; // move focus up in the collection list or to the very bottom if the current selected collection is at the top (wrap-around)
          linkUtils.focusNavLink(navLinks[idx]);
        } else if (linkUtils.currentFocusedCell) { // if current focus is on a link cell
          const currentCell = linkUtils.currentFocusedCell;
          const table = currentCell.closest("table");
          const currentRow = currentCell.parentElement;
          const rows = Array.from(table.querySelectorAll("tr"));
          const cellsInCurrentRow = Array.from(
            currentRow.querySelectorAll(".grid-item")
          );
          const colIndex = cellsInCurrentRow.indexOf(currentCell);

          let rowIndex = rows.indexOf(currentRow);

          // move one cell up (no wrap-around)
          if (rowIndex > 0) {
            rowIndex = rowIndex - 1;

            const targetRow = rows[rowIndex];
            const targetCells = Array.from(
              targetRow.querySelectorAll(".grid-item")
            );

            const targetCell =
              targetCells[colIndex] || targetCells[targetCells.length - 1];
            // check if the cell navigated to contains a link
            if (targetCell.hasAttribute("data-link-url")) { 
              linkUtils.focusCell(targetCell); // set focus to this link cell
            }
          }
          // do not move focus is next cell would be an empty cell
        }
        break;

      case VK_ENTER:
        if (linkUtils.currentFocusedNavLink) { // if current focus is on a collection
          // opens the collection
          const idx = parseInt(linkUtils.currentFocusedNavLink.dataset.idx, 10);
          if (!isNaN(idx)) {
            linkUtils.setActiveNav(idx); // highlight nav-item 
            linkUtils.renderLinksTable(linkUtils.collections[idx].links || []); // load links
            linkUtils.focusNavLink(linkUtils.currentFocusedNavLink); // focus remains on the collection
          }
        } else if (linkUtils.currentFocusedCell) { // if current focus is on a link cell
          
          linkUtils.activateLink(linkUtils.currentFocusedCell); // opens the link
        }
        break;
    }
  } catch (e) {
    // pressed unhandled key, catch the error
  }
  // return true to prevent default action for processed keys
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
      // initialize the scene and show our app
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
    }, 5000); // hide after 5 seconds to not disturb the viewer from watching TV 
  }, 1000);
}
