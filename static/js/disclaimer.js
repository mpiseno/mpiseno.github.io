// Shared by every post: appends the disclaimer to the end of the post body.
const DISCLAIMER = "Disclaimer: None of the writing on my website is AI-generated. AI is only used to create figures.";

(function disclaimer() {
  const el = document.createElement("p");
  el.className = "disclaimer";
  el.textContent = DISCLAIMER;
  document.querySelector(".content-wrapper").appendChild(el);
})();
