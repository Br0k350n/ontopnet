async function voteForServer(server_Id, token, vote_code) {
    try {
        if (!vote_code) {
            vote_code = null;
        }

        const response = await fetch('/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ server_Id, token, vote_code }),
        });
        const data = await response.json();
        console.log(data)
        if (response.ok) {
            openPopup(true, data.serverName);
        } else {
            
            document.getElementById("error-text").textContent = data.error || "An unknown error occurred.";
            openPopup(false);
        }
    } catch (error) {
        console.error("Error voting for server:", error);
        document.getElementById("error-text").textContent = "An error occurred while processing your vote. Please try again later.";
        openPopup(false);
    }
}

function editBanner(bannerId) {
  window.location.href = `/banners/edit/${bannerId}`;
}

function deleteBanner(bannerId) {
  if (confirm("Are you sure you want to delete this banner?")) {
      window.location.href = `/banners/delete/${bannerId}`;
  }
}

function trackImpression(adId) {
  fetch('/ad/impression/' + adId)
    .then(response => {
      if (!response.ok) {
        console.error('Impression tracking failed for ad', adId);
      }
    })
    .catch(error => console.error('Error tracking impression:', error));
}

function openPopup(voteSuccessful, serverName) {
  const popup = document.getElementById("vote-popup");
  popup.style.display = "flex";
  console.log(serverName)
  if (voteSuccessful) {
      document.getElementById("success-msg").style.display = "block"; 
      document.getElementById("voting-sm-buttons").style.display = "block";
      document.getElementById("error-msg").style.display = "none";
      updateShareLinks(serverName); // Update share buttons with server name
  } else {
      document.getElementById("success-msg").style.display = "none";
      document.getElementById("error-msg").style.display = "block";
      document.getElementById("voting-sm-buttons").style.display = "none";
  }
}

function closePopup() {
  const popup = document.getElementById("vote-popup");
  popup.style.display = "none";
  window.location.href = `/`; // Redirect to home page
}

function updateShareLinks(serverName) {
  const baseURL = window.location.href;
  const message = encodeURIComponent(
      `I just voted for "${serverName}" on City On Top!\n\nCity on Top is a Fivem server listing site that allows players to find the perfect city for them!\n\nJoin the community: ${baseURL}`
  );

  // Set social media share URLs
  document.getElementById('share-twitter').href = 
      `https://twitter.com/intent/tweet?text=${message}&url=${encodeURIComponent(baseURL)}`;
  
  document.getElementById('share-facebook').href = 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseURL)}&quote=${message}`;
  
      document.getElementById('share-reddit').href = 
      `https://www.reddit.com/submit?url=${encodeURIComponent(baseURL)}&title=${message}`;
}

function onClick(sid) {
    grecaptcha.ready(function() {
        grecaptcha.execute('6LeBjtAqAAAAAO0pvBRYhBCrTzXp2tAC6bIbVA9p', { action: 'submit' })
        .then(function(token) {
            voteForServer(sid, token); // Now correctly sends token
        });
    });
}

function onFormClick(sid) {
    grecaptcha.ready(function() {
        grecaptcha.execute('6LeBjtAqAAAAAO0pvBRYhBCrTzXp2tAC6bIbVA9p', { action: 'submit' })
        .then(function(token) {
            voteForServer(sid, token); // Now correctly sends token
        });
    });
}


function copyInviteLink() {
    const copyText = document.getElementById("inviteLink");  // Get the input field
    copyText.select();  // Select the text inside the input field
    copyText.setSelectionRange(0, 99999);  // For mobile devices, select the entire text
    navigator.clipboard.writeText(copyText.value)  // Write the text to the clipboard
        .then(() => {
            alert("Copied invite link: " + copyText.value);  // Notify the user that the link is copied
        })
        .catch((error) => {
            console.error("Error copying link: ", error);  // Handle any potential error
            alert("Failed to copy the invite link.");
        });
}

async function loadAd(section, number) {
    try {
        const response = await fetch(`/ads/${section}`);
        const ad = await response.json();

        if (ad.image_path) {
            const imgElement = document.getElementById(`${section}-${number}`);
            imgElement.src = `./imgs/${ad.image_path}`;
            imgElement.alt = "Advertisement";

            if (ad.link) {
                const anchor = document.createElement("a");
                anchor.href = ad.link;
                anchor.target = ad.open_in_new_tab ? "_blank" : "_self";
                imgElement.parentNode.insertBefore(anchor, imgElement);
                anchor.appendChild(imgElement);
            }
        }
    } catch (error) {
        console.error('Failed to load ad:', error);
    }
}

function copyInviteLink() {
  const inviteInput = document.getElementById("inviteLink");
  inviteInput.select();
  inviteInput.setSelectionRange(0, 99999); // For mobile devices
  navigator.clipboard.writeText(inviteInput.value)
      .then(() => {
          alert("Invite link copied to clipboard!");
      })
      .catch(err => {
          console.error("Error copying link: ", err);
      });
}

function copyVoteLink() {
  const voteLink = document.getElementById("voteLink").href;
  navigator.clipboard.writeText(voteLink)
      .then(() => {
          alert("Vote link copied to clipboard!");
      })
      .catch(err => {
          console.error("Error copying link: ", err);
      });
}

function copyReferLink() {
  const voteLink = document.getElementById("referLink").href;
  navigator.clipboard.writeText(voteLink)
      .then(() => {
          alert("Vote link copied to clipboard!");
      })
      .catch(err => {
          console.error("Error copying link: ", err);
      });
}



// Convert UTC timestamps to local time
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('time.local-time').forEach(timeElement => {
        const utcTime = timeElement.getAttribute('datetime');
        const localTime = new Date(utcTime).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
        timeElement.textContent = localTime;
    });
});




// Initialize on page load
document.addEventListener("DOMContentLoaded", initializePaddle);

document.addEventListener('DOMContentLoaded', () => {

  // Remove button handler
  document.querySelectorAll('.removeServerBtn').forEach(button => {
    console.log(button)
    button.addEventListener('click', function() {
      const serverId = this.dataset.serverId;
      console.log(serverId)
      const modal = document.getElementById(`confirmModal-${serverId}`);
      if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
      }
    });
  });

  // Cancel button handler
  document.querySelectorAll('.cancel-delete-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const modal = this.closest('.confirmModal');
      if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
    });
  });
})

let lastScrollY = window.scrollY;
const navbar = document.querySelector('.navbar-sticky');

window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
        navbar.style.top = '0'; // Show navbar when scrolling down
    } else {
        navbar.style.top = '-70px'; // Hide navbar when scrolling up
    }
    lastScrollY = window.scrollY;
});

function validateTagInput(input) {
  // Define allowed characters (alphanumeric, spaces, and hyphens)
  const allowedChars = /^[a-zA-Z0-9\s-]*$/;

  // Remove any special characters
  if (!allowedChars.test(input.value)) {
    input.value = input.value.replace(/[^a-zA-Z0-9\s-]/g, '');
  }
}

// PADDLE [OBSOLETE] //

// Configuration
// Replace with values from your sandbox account
const CONFIG = {
  clientToken: "test_f24d5329221dd184996f4e065b1",
  prices: {
   premium: {
     month: "pri_01jk6raemg8bqgsgfa4yprevht",
     year: "pri_01jk6rqpqfbyz5awc06af48thq"
   },
   premiumPlus: {
     month: "pri_01jk6tky0z15djd8pny9z5gp4d",
     year: "pri_01jk6tn3gf6pv67y813fvy3bj3"
   }
  }
};

// UI elements
const monthlyBtn = document.getElementById("monthlyBtn");
const yearlyBtn = document.getElementById("yearlyBtn");
const countrySelect = document.getElementById("countrySelect");
const starterPrice = document.getElementById("starter-price");
const proPrice = document.getElementById("pro-price");

// State
let currentBillingCycle = "month";
let currentCountry = "US";
let paddleInitialized = false;

// Initialize Paddle
// function initializePaddle() {
//  try {
//    Paddle.Environment.set("sandbox");
//    Paddle.Initialize({
//      token: CONFIG.clientToken,
//      eventCallback: function (event) {
//      }
//    });
//    paddleInitialized = true;
//    updatePrices();
//  } catch (error) {
//    console.error("Initialization error:", error);
//  }
// }

// Update billing cycle
// function updateBillingCycle(cycle) {
//  currentBillingCycle = cycle;
//  monthlyBtn.classList.toggle("active", cycle === "month");
//  yearlyBtn.classList.toggle("active", cycle === "year");
//  updatePrices();
// }



// Update prices
// async function updatePrices() {
//  if (!paddleInitialized) {
//    console.log("Paddle not initialized yet");
//    return;
//  }

//  try {
//    const request = {
//      items: [
//        {
//          quantity: 1,
//          priceId: CONFIG.prices.premium[currentBillingCycle]
//        },
//        {
//          quantity: 1,
//          priceId: CONFIG.prices.premiumPlus[currentBillingCycle]
//        }
//      ],
//      address: {
//        countryCode: currentCountry
//      }
//    };

//    console.log("Fetching prices:", request);
//    const result = await Paddle.PricePreview(request);

//    result.data.details.lineItems.forEach((item) => {
//      const price = item.formattedTotals.subtotal;
//      if (item.price.id === CONFIG.prices.premium[currentBillingCycle]) {
//        starterPrice.textContent = price;
//      } else if (item.price.id === CONFIG.prices.premiumPlus[currentBillingCycle]) {
//        proPrice.textContent = price;
//      }
//    });
//    console.log("Prices updated:", result);
//  } catch (error) {
//    console.error(`Error fetching prices: ${error.message}`);
//  }
// }

// function openCheckout(plan) {
  // if (!paddleInitialized) {
      // console.log("Paddle not initialized yet");
      // return;
  // }
// 
// const serverSelect = document.getElementById("serverSelect");
// 
// const selectedServerId = serverSelect ? serverSelect.value : null;
// 
// if (!selectedServerId || selectedServerId === "null") {
    // console.error("No server selected!");
    // alert("Please select a server before purchasing premium.");
    // return;
// }
// 
// try {
    // Paddle.Checkout.open({
        // items: [
            // {
                // priceId: CONFIG.prices[plan][currentBillingCycle],
                // quantity: 1
            // }
        // ],
        // customData: {
            // serverId: selectedServerId,
            // tier: plan, // "premium" or "premiumPlus"
            // subscriptionPeriod: currentBillingCycle
        // },
        // settings: {
            // theme: "light",
            // displayMode: "overlay",
            // variant: "one-page"
        // }
    // });
// } catch (error) {
    // console.error(`Checkout error: ${error.message}`);
// }
// }

// New openCheckout function to redirect to the checkout page with query parameters
        
