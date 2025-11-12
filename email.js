const scriptUrl = "https://script.google.com/macros/s/AKfycbz6-3otirAd2j6QQ1nggZzAEIJ4duXT4feVJmekDRKKlwMwG3baBPemmBT4ceoeL8nVtg/exec"; // Replace with your deployed Apps Script URL

const button = document.getElementById("submit-email");

button.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  if (!email) return alert("Please enter your email");

  const formData = new URLSearchParams();
  formData.append("email", email);

  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.status === "success") {
      alert("Thanks for subscribing!");
      document.getElementById("email").value = '';
    } else {
      alert("Error: " + data.message);
    }

  } catch (err) {
    console.error(err);
    alert("There was an error submitting your email.");
  }
});
