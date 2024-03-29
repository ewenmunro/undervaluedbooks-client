import React, { useState } from "react";
import "../assets/styles/masteraddbook.css";

// components/auth
import MasterAddBookForm from "../components/books/MasterAddBookForm";

function MasterAddBook() {
  // Define your books state or fetch it as needed
  const [books, setbooks] = useState([]);

  // Function to add a book to the list
  const handleAddBook = (newbook) => {
    setbooks([...books, newbook]);
  };

  return (
    <div className="addbook">
      <h1>Add Book</h1>
      <MasterAddBookForm onAddBook={handleAddBook} />
    </div>
  );
}

export default MasterAddBook;
