import React from "react";
import "../assets/styles/home.css";

// components/books
import BookList from "../components/books/BookList";

// components/promo
import Promo from "../components/promo/Promo";

function Home() {
  return (
    <div className="home">
      <h1>The Book List</h1>
      <Promo />
      <BookList />
    </div>
  );
}

export default Home;
