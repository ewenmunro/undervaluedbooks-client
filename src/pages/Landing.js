import React from "react";

// assets/styles
import "../assets/styles/home.css";

// components/books
import BookListLanding from "../components/books/BookListLanding";

// components/promo
import Promo from "../components/promo/Promo";

function Landing() {
  return (
    <div className="home">
      <h1>The Book List</h1>
      <Promo />
      <BookListLanding />
    </div>
  );
}

export default Landing;
