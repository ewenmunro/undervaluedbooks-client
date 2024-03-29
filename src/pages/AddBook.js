import React, { useState } from "react";
import "../assets/styles/addbook.css";

// components/auth
import AddBookForm from "../components/books/AddBookForm";

function AddBook() {
  // Define your books state or fetch it as needed
  const [books, setbooks] = useState([]);

  // Function to add a book to the list
  const handleAddBook = (newbook) => {
    setbooks([...books, newbook]);
  };

  return (
    <div className="addbook">
      <h1>Add Book</h1>
      {/* Message for when I need to disable the Add Book button */}
      {/* <p>Note: I've had to disable the Add Book button because...</p> */}
      {/* Add additional <p></p> message to let users know that they can send me books to be added to The Book List by subscribing to my newsletter and sending them via a chat */}
      <AddBookForm onAddBook={handleAddBook} />
    </div>
  );
}

export default AddBook;
