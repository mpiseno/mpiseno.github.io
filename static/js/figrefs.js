// Numbers every <figure id="..."> in document order and fills <a class="figref" href="#id"></a> with its number.
(function figrefs() {
  const numbers = {};
  document.querySelectorAll("figure[id]").forEach((fig, i) => {
    numbers[fig.id] = i + 1;
    const name = fig.querySelector(".figname");
    name.textContent = "Fig. " + (i + 1) + " · " + name.textContent;
  });
  document.querySelectorAll("a.figref").forEach(a => {
    const id = a.getAttribute("href").slice(1);
    if (!(id in numbers)) throw new Error("figref to unknown figure: " + id);
    a.textContent = numbers[id];
  });
})();
