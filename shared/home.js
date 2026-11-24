
document.addEventListener("DOMContentLoaded", () => {
  console.log("Inochi Studio Home Ready");

  const cards = document.querySelectorAll(".editor-card");

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      console.log("Editor selected:", card.href);
    });
  });
});
