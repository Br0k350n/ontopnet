// /////////////////////////////////
// //////////// PAYMENT ////////////
// /////////////////////////////////


// // Update Billing Cycle: update active button and pricing values (you may update these as needed)
function updateBillingCycle(cycle) {
    const monthlyBtn = document.getElementById("monthlyBtn");
    const yearlyBtn = document.getElementById("yearlyBtn");
    monthlyBtn.classList.toggle("active", cycle === "month");
    yearlyBtn.classList.toggle("active", cycle === "year");
    // Update pricing based on cycle and plan (example logic, modify as needed)
    if(cycle === "month") {
        document.getElementById("starter-price").textContent = "$14.99/month";
        document.getElementById("pro-price").textContent = "$29.99/month";
    } else {
        document.getElementById("starter-price").textContent = "$144.00/year";
        document.getElementById("pro-price").textContent = "$288.00/year";
    }
}

function openCheckout(plan) {
  const selectedServer = document.getElementById('selectedServer').value;
  const billingCycle = document.getElementById("monthlyBtn").classList.contains("active") ? "month" : "year";
  // Redirect to checkout page, passing plan, server, and billing cycle as query parameters
  window.location.href = `/checkout?plan=${plan}&server=${selectedServer}&cycle=${billingCycle}`;
}



// // Close 3Ds Dialog
// function onClose() {
//     const threedsElement = document.getElementById("threeds");
//     threedsElement.innerHTML = "";
//   }
  
//   // Handle 3Ds Payload
//   async function onHandle3Ds(payload, orderId) {
//     const { liabilityShifted, liabilityShift } = payload;
  
//     if (liabilityShift === "POSSIBLE") {
//       await onApproveCallback(orderId);
//     } else if (liabilityShifted === false || liabilityShifted === undefined) {
//       document.getElementById("threeds").innerHTML = `<Dialog open>
//           <p>You have the option to complete the payment at your own risk,
//            meaning that the liability of any chargeback has not shifted from
//             the merchant to the card issuer.</p>
//           <button onclick=onApproveCallback("${orderId}")>Pay Now</button>
//           <button onclick=onClose()>Close</button>
//         </Dialog>
//       `;
//     }
//   }
  
//   async function createOrderCallback() {
//     resultMessage("");
//     try {
//       const response = await fetch("/api/orders", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         // use the "body" param to optionally pass additional order information
//         // like product ids and quantities
//         body: JSON.stringify({
//           cart: [
//             {
//               id: "YOUR_PRODUCT_ID",
//               quantity: "YOUR_PRODUCT_QUANTITY",
//             },
//           ],
//         }),
//       });
  
//       const orderData = await response.json();
  
//       if (orderData.id) {
//         return orderData.id;
//       } else {
//         const errorDetail = orderData?.details?.[0];
//         const errorMessage = errorDetail
//           ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
//           : JSON.stringify(orderData);
  
//         throw new Error(errorMessage);
//       }
//     } catch (error) {
//       console.error(error);
//       resultMessage(`Could not initiate PayPal Checkout...<br><br>${error}`);
//     }
//   }
  
//   async function onApproveCallback(orderId) {
//     console.log("orderId", orderId);
  
//     const threedsElement = document.getElementById("threeds");
//     threedsElement.innerHTML = "";
  
//     try {
//       const response = await fetch(`/api/orders/${orderId}/capture`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });
  
//       const orderData = await response.json();
//       // Three cases to handle:
//       //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
//       //   (2) Other non-recoverable errors -> Show a failure message
//       //   (3) Successful transaction -> Show confirmation or thank you message
  
//       const transaction =
//         orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
//         orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
//       const errorDetail = orderData?.details?.[0];
  
//       // this actions.restart() behavior only applies to the Buttons component
//       if (errorDetail?.issue === "INSTRUMENT_DECLINED" && !data.card && actions) {
//         // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
//         // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
//         return actions.restart();
//       } else if (
//         errorDetail ||
//         !transaction ||
//         transaction.status === "DECLINED"
//       ) {
//         // (2) Other non-recoverable errors -> Show a failure message
//         let errorMessage;
//         if (transaction) {
//           errorMessage = `Transaction ${transaction.status}: ${transaction.id}`;
//         } else if (errorDetail) {
//           errorMessage = `${errorDetail.description} (${orderData.debug_id})`;
//         } else {
//           errorMessage = JSON.stringify(orderData);
//         }
  
//         throw new Error(errorMessage);
//       } else {
//         // (3) Successful transaction -> Show confirmation or thank you message
//         // Or go to another URL:  actions.redirect('thank_you.html');
//         resultMessage(
//           `Transaction ${transaction.status}: ${transaction.id}<br><br>See console for all available details`,
//         );
//         console.log(
//           "Capture result",
//           orderData,
//           JSON.stringify(orderData, null, 2),
//         );
//       }
//     } catch (error) {
//       console.error(error);
//       resultMessage(
//         `Sorry, your transaction could not be processed...<br><br>${error}`,
//       );
//     }
//   }
  
//   // Example function to show a result to the user. Your site's UI library can be used instead.
//   function resultMessage(message) {
//     const container = document.querySelector("#result-message");
//     container.innerHTML = message;
//   }
  
//   // If this returns false or the card fields aren't visible, see Step #1.
//   if (window.paypal.HostedFields.isEligible()) {
//     let orderId;
//     // Renders card fields
//     window.paypal.HostedFields.render({
//       // Call your server to set up the transaction
//       createSubscription: async (data, actions) => {
//         return actions.subscription.create({
//             plan_id: "YOUR_PAYPAL_PLAN_ID", // Replace with your actual PayPal Plan ID
//         });
//     },
//       styles: {
//         ".valid": {
//           color: "green",
//         },
//         ".invalid": {
//           color: "red",
//         },
//       },
//       fields: {
//         number: {
//           selector: "#card-number",
//           placeholder: "4111 1111 1111 1111",
//         },
//         cvv: {
//           selector: "#cvv",
//           placeholder: "123",
//         },
//         expirationDate: {
//           selector: "#expiration-date",
//           placeholder: "MM/YY",
//         },
//       },
//     }).then((cardFields) => {
//       document
//         .querySelector("#card-form")
//         .addEventListener("submit", async (event) => {
//           event.preventDefault();
//           try {
//             const { value: cardHolderName } =
//               document.getElementById("card-holder-name");
//             const { value: streetAddress } = document.getElementById(
//               "card-billing-address-street",
//             );
//             const { value: extendedAddress } = document.getElementById(
//               "card-billing-address-unit",
//             );
//             const { value: region } = document.getElementById(
//               "card-billing-address-state",
//             );
//             const { value: locality } = document.getElementById(
//               "card-billing-address-city",
//             );
//             const { value: postalCode } = document.getElementById(
//               "card-billing-address-zip",
//             );
//             const { value: countryCodeAlpha2 } = document.getElementById(
//               "card-billing-address-country",
//             );
  
//             const payload = await cardFields.submit({
//               cardHolderName,
//               contingencies: ["SCA_ALWAYS"],
//               billingAddress: {
//                 streetAddress,
//                 extendedAddress,
//                 region,
//                 locality,
//                 postalCode,
//                 countryCodeAlpha2,
//               },
//             });
  
//             await onHandle3Ds(payload, orderId);
//           } catch (error) {
//             alert("Payment could not be captured! " + JSON.stringify(error));
//           }
//         });
//     });
//   } else {
//     // Hides card fields if the merchant isn't eligible
//     document.querySelector("#card-form").style = "display: none";
//   }