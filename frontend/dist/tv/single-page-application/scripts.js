var stateUtitls = {
  displayCorrectState: function () {
    // what this function should to:
    // - check if login is required
    // - show state-login or state-linklist, both are hidden by default
    // - use loginUtils.startDeviceAuth or fetchCollectionsAndRender.fetchCollectionsAndRender, depending on the state
    // -----------------------
    // - when this function should be called:
    // - pollForAuth must be changed so it calls this function once the login has finished
    // - this function must be called after red button press via scene.showAppArea and scene.hideAppArea in rc-interaction.js (X)
    //   OR via a listener that checks it the app area visibility changes
    // - the code below contains window.location.href in some places, especially when an error occurs. instead of refreshing,
    //   the state should be set accordingly (and in some cases data may need to be refreshed, e.g. new authorization attempt –
    //   this might still need to be implemented in this or a new function)

    //TODO: What is meant by "(and in some cases data may need to be refreshed, e.g. new authorization attempt –
    //   this might still need to be implemented in this or a new function)" ??


    // -----------------------
    // then (we can do this together after everything else works and after pc frontend is uploaded):
    // - implement button navigation rc-interaction.js
    // -----------------------
    // thank you!!

   
    //check whether device is authenticated
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/collections", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {

          //Device is already authenticated, display links
          document.getElementById('state-login').style.display = 'none';
          document.getElementById('state-linklist').style.display = 'block';
          linkUtils.fetchCollectionsAndRender(); 

        } else if (xhr.status === 401) {

          //Device is not authenticated, display login
          console.log(
            "The 401 erorr you see in the console is intended. You are not logged in, starting device auth..."
          );
          document.getElementById('state-linklist').style.display = 'none';
          document.getElementById('state-login').style.display = 'block';
          loginUtils.startDeviceAuth();

        }
      }
    };
    xhr.send();
  },

  //hide all elements when app area is hidden
  hideEverything: function () {
    document.getElementById('state-login').style.display = 'none';
    document.getElementById('state-linklist').style.display = 'block';
  }
};

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

        // remove existing, previously generated QR-codes
        while (qrBox.firstChild) {
          qrBox.removeChild(qrBox.firstChild);
        }

        // generate new QR-Code
        new QRCode(qrBox, {
          text: data.verification_uri,
          width: 200,
          height: 200,
          colorDark: "#000000",
          colorLight: "#ffffff",
        });

        // Show device code in console for debugging
        console.log("Device code:", data.verification_uri);

        // Make sure the generated QR code fills the box
        var qrImg = document.querySelector("#qr-box img");
        if (qrImg) {
          qrImg.style.width = "100%";
          qrImg.style.height = "100%";
          qrImg.style.display = "block";
        }

        // Show login container and logo
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
          // Authenticated!
          stateUtitls.displayCorrectState();
        } else if (xhr.status === 202) {
          // Authorization pending, poll again after delay
          setTimeout(loginUtils.pollForAuth, 2000);
        } else {
          // Error (expired, invalid, etc)
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

  //TODO: Delete this function ?
  checkLoginStatus: function () {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/collections", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          window.location.href = "app.html";
        } else if (xhr.status === 401) {
          console.log(
            "The 401 erorr you see in the console is intended. You are not logged in, starting device auth..."
          );
          startDeviceAuth();
        }
      }
    };
    xhr.send();
  },
};

var linkUtils = {
  collections: [],

  // Fetch collections from API on page load
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
              linkUtils.setActiveNav(0);
            } else {
              document.getElementById("links-table").innerHTML =
                "<tr><td>No collections found.</td></tr>";
            }
          } catch (e) {
            //window.location.href = "login.html";
            stateUtitls.displayCorrectState();
          }
        } else {
          //window.location.href = "login.html";
          stateUtitls.displayCorrectState();
        }
      }
    };
    xhr.send();
  },

  renderNavLinks: function () {
    const navLinksDiv = document.getElementById("nav-links");
    navLinksDiv.innerHTML = "";
    linkUtils.collections.forEach((col, idx) => {
      const a = document.createElement("a");
      a.href = "#";
      a.className = "nav-link";
      a.textContent = col.name;
      a.dataset.idx = idx;
      a.onmouseenter = function (e) {
        e.preventDefault();
        linkUtils.renderLinksTable(col.links);
        linkUtils.setActiveNav(idx);
      };
      navLinksDiv.appendChild(a);
    });
  },

  // Highlight the active nav-link
  setActiveNav: function (activeIdx) {
    const navLinks = document.querySelectorAll("#nav-links .nav-link");
    navLinks.forEach((link, idx) => {
      link.style.backgroundColor = idx === activeIdx ? "#2e3c47" : "";
      link.style.borderLeft =
        idx === activeIdx ? "5px solid #921a36" : "5px solid #1d2a38";
    });
  },

  // Render the links as grid-items in a table
  renderLinksTable: function (links) {
    const table = document.getElementById("links-table");
    table.innerHTML = "";
    const perRow = 3;
    for (let i = 0; i < links.length; i += perRow) {
      const tr = document.createElement("tr");
      for (let j = 0; j < perRow; j++) {
        const td = document.createElement("td");
        td.className = "grid-item";
        const link = links[i + j];
        if (link) {
          td.style.cursor = "pointer";
          td.onclick = () => {
            if (link._id) {
              const xhr = new XMLHttpRequest();
              xhr.open("POST", `/api/links/${link._id}/click`, true);
              xhr.setRequestHeader("Content-Type", "application/json");
              xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                  window.open(link.url, "_blank");
                }
              };
              xhr.send(JSON.stringify({}));
            } else {
              window.open(link.url, "_blank");
            }
          };
          td.innerHTML = `
                <img src="${link.icon}" alt="${link.name}" />
                <span>${link.name}</span>
              `;
        } else {
          td.innerHTML = "";
          td.style.background = "transparent";
          td.style.border = "none";
          td.style.cursor = "default";
        }
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
  },
};
