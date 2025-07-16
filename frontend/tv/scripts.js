// helper functions for changing the displayed state (logged in or out)
var stateUtitls = {
  displayCorrectState: function () {
    // check whether device is authenticated
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/collections", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // device is already authenticated, display links
          document.getElementById("state-login").classList.add("state-hidden");
          document
            .getElementById("state-linklist")
            .classList.remove("state-hidden");
          linkUtils.fetchCollectionsAndRender();
        } else if (xhr.status === 401) {
          // device is not authenticated, display login
          console.log(
            "The 401 erorr you see in the console is intended. You are not logged in, starting device auth..."
          );
          document
            .getElementById("state-linklist")
            .classList.add("state-hidden");
          document
            .getElementById("state-login")
            .classList.remove("state-hidden");
          loginUtils.startDeviceAuth();
        }
      }
    };
    xhr.send();
  },

  // hide all elements when the app area is hidden
  hideEverything: function () {
    document.getElementById("state-login").classList.add("state-hidden");
    document.getElementById("state-linklist").classList.add("state-hidden");
  },
};

// helper functions for login handling
var loginUtils = {
  deviceCode: null,

  startDeviceAuth: function () {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/device/start", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        deviceCode = data.device_code;

        var qrBox = document.getElementById("login-qr-box");

        // remove existing, previously generated QR codes
        while (qrBox.firstChild) {
          qrBox.removeChild(qrBox.firstChild);
        }

        // generate new QR code
        new QRCode(qrBox, {
          text: data.verification_uri,
          width: 200,
          height: 200,
          colorDark: "#000000",
          colorLight: "#ffffff",
        });

        // show device code in console for debugging
        console.log("Device code:", data.verification_uri);

        // make sure the generated QR code fills the box
        var qrImg = document.querySelector("#qr-box img");
        if (qrImg) {
          qrImg.style.width = "100%";
          qrImg.style.height = "100%";
          qrImg.style.display = "block";
        }

        // show login container and logo
        document.getElementById("login-logo").style.opacity = "1";
        document.getElementById("login-container").style.opacity = "1";

        loginUtils.pollForAuth();
      }
    };
    xhr.send();
  },

  pollForAuth: function () {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/device/poll", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // authenticated
          stateUtitls.displayCorrectState();
        } else if (xhr.status === 202) {
          // authorization pending, poll again after delay
          setTimeout(loginUtils.pollForAuth, 2000);
        } else {
          // error (expired, invalid, etc)
          document.getElementById("login-container").innerHTML =
            "<h1>Something went wrong</h1><p>Please press the red button twice to try again.</p>";
        }
      }
    };
    try {
      xhr.send(JSON.stringify({ device_code: deviceCode }));
    } catch (e) {
      setTimeout(loginUtils.pollForAuth, 2000);
    }
  },
};

// helper functions for displaying links and collections and for managing the focus used for navigation
var linkUtils = {
  collections: [], // collections loaded from server
  activeNavIndex: 0, // currently selected collection
  currentFocusedCell: null, // currently focused link cell
  currentFocusedNavLink: null, // currently focused collections

  // fetch collections from API on page load
  fetchCollectionsAndRender: function () {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/collections", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            linkUtils.collections = JSON.parse(xhr.responseText);
            linkUtils.renderNavLinks();
            if (linkUtils.collections.length > 0) {
              linkUtils.renderLinksTable(linkUtils.collections[0].links || []);
              linkUtils.setActiveNav(0); // select first collection
            } else {
              // no collections available
              document.getElementById("links-table").innerHTML =
                "<tr><td>No collections found.</td></tr>";
            }
          } catch (e) {
            stateUtitls.displayCorrectState(); // retry state check
          }
        } else {
          stateUtitls.displayCorrectState(); // retry state check
        }
      }
    };
    xhr.send();
  },

  // render nav-link for each collection
  renderNavLinks: function () {
    const navLinksDiv = document.getElementById("nav-links");
    navLinksDiv.innerHTML = "";
    linkUtils.collections.forEach((col, idx) => {
      const a = document.createElement("a");
      a.href = "#";
      a.className = "nav-link";
      a.textContent = col.name;
      a.dataset.idx = idx;
      a.tabIndex = 0;
      a.onmouseenter = function (e) {
        e.preventDefault();
        linkUtils.renderLinksTable(col.links); // render links for current collection
        linkUtils.setActiveNav(idx); // set styling for active collection
        linkUtils.focusNavLink(a); // set focus to current collection
      };
      navLinksDiv.appendChild(a);
    });
  },

  // highlight the active collection
  setActiveNav: function (activeIdx) {
    linkUtils.activeNavIndex = activeIdx;
    const navLinks = document.querySelectorAll("#nav-links .nav-link");
    navLinks.forEach((link, idx) => {
      link.style.backgroundColor = idx === activeIdx ? "#2e3c47" : "";
      link.style.borderLeft =
        idx === activeIdx ? "5px solid #921a36" : "5px solid #1d2a38";
    });
  },

  // render the links as grid-items in a table
  renderLinksTable: function (links) {
    const table = document.getElementById("links-table");
    table.innerHTML = "";
    const perRow = 3; // number of links per row

    for (let i = 0; i < links.length; i += perRow) {
      const tr = document.createElement("tr");
      for (let j = 0; j < perRow; j++) {
        const td = document.createElement("td");
        td.className = "grid-item";
        const link = links[i + j];
        if (link) {
          td.tabIndex = 0; 
          td.style.cursor = "pointer";
          td.dataset.linkUrl = link.url;
          td.dataset.linkId = link._id || "";

          td.onclick = function () {
            linkUtils.activateLink(td); // open link when clicked
          };
          td.innerHTML = `
                <img src="${link.icon}" alt="${link.name}" />
                <span>${link.name}</span>
              `;
        } else {
          // if no link is present empty cell for grid layout consistency
          td.innerHTML = "";
          td.style.background = "transparent";
          td.style.border = "none";
          td.style.cursor = "default";
        }
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    // add space for snap scrolling
    const spacerDiv = document.createElement("div");
    spacerDiv.style.height = "100vh";
    spacerDiv.style.flexShrink = "0";
    table.appendChild(spacerDiv);

    // automatically put focus on first link cell
    const firstCell = table.querySelector(".grid-item[tabindex='0']");
    if (firstCell) {
      linkUtils.focusCell(firstCell);
    }
  },

  // set focus to a collection and remove focus from previously focused element
  focusNavLink: function (navLink) {
    if (linkUtils.currentFocusedNavLink) {
      linkUtils.currentFocusedNavLink.classList.remove("focused-nav");
    }
    navLink.focus();
    navLink.classList.add("focused-nav");
    linkUtils.currentFocusedNavLink = navLink;

    // remove focus from link table
    if (linkUtils.currentFocusedCell) {
      linkUtils.currentFocusedCell.classList.remove("focused");
      linkUtils.currentFocusedCell = null;
    }
  },

  // set focus to a link cell and remove focus from previously focused element
  focusCell: function (cell) {
    if (linkUtils.currentFocusedCell) {
      linkUtils.currentFocusedCell.classList.remove("focused");
    }
    cell.focus();
    cell.classList.add("focused");
    linkUtils.currentFocusedCell = cell;

    // remove focus from collections
    if (linkUtils.currentFocusedNavLink) {
      linkUtils.currentFocusedNavLink.classList.remove("focused-nav");
      linkUtils.currentFocusedNavLink = null;
    }
  },

  // handles link click
  activateLink: function (el) {
    const linkId = el.dataset.linkId;
    const linkUrl = el.dataset.linkUrl;

    if (linkId) {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/links/${linkId}/click`, true); //reports a link click to the server to increase usage counter
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          window.open(linkUrl); //opens the link
        }
      };
      xhr.send(JSON.stringify({}));
    } else if (linkUrl) { //fallback if reporting to server is not possible
      window.open(linkUrl); //opens the link
    }
  },
};
