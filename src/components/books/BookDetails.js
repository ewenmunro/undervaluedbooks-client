import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// assets/styles
import "../../assets/styles/bookdetails.css";

// api base url
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

const BookDetails = () => {
  const { bookDetails } = useParams();
  const [book, setBook] = useState(null);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        // Extract the title
        let title = bookDetails;

        // Replace each '-' with a space
        title = title
          .replace(/-/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        // Make an API request to fetch book details based on title and author
        const response = await axios.get(
          `${apiBaseUrl}/api/books/bookdetails`,
          {
            params: {
              title,
            },
          }
        );

        setBook(response.data.book);
      } catch (error) {
        console.error("Failed to fetch book details:", error);
      }
    };

    fetchBookDetails();
  }, [bookDetails]);

  // Check if book is defined
  if (!book) {
    // Handle the case where book is not available
    return (
      <div>
        <p className="book-details-error-message">
          Error: Book details not available.
        </p>
      </div>
    );
  }

  const readBook = (book) => {
    // Check if there's a valid link in the database for this book
    if (book.read_book) {
      // Make a request to generate a temporary identifier for a logged-out user
      axios
        .get(`${apiBaseUrl}/api/read/generatetempid`)
        .then((response) => {
          // Retrieve temporary user id from backend
          const temporaryUserId = response.data.temporaryUserId;

          // Open the book link in a new tab
          window.open(book.read_book, "_blank");

          // Make an API request to log the click
          axios.post(`${apiBaseUrl}/api/read/click`, {
            user_id: temporaryUserId,
            book_id: book.book_id,
          });
        })
        .catch((error) => {
          console.error("Failed to generate a temporary identifier:", error);
        });
    }
  };

  const copyBookURL = () => {
    const bookURL = window.location.href;
    navigator.clipboard.writeText(bookURL).then(() => {
      const customAlert = document.querySelector(".custom-alert");
      customAlert.textContent = `${book.title} URL copied to clipboard!`;
      customAlert.style.display = "block";

      // Hide the alert after a delay (e.g., 3 seconds)
      setTimeout(() => {
        customAlert.style.display = "none";
      }, 3000);
    });
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this book: ${book.title}`);
    const body = encodeURIComponent(
      `I thought you might enjoy this book: ${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareOnFacebook = () => {
    const shareText = encodeURIComponent(`Check out this book: ${book.title}`);
    const shareURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      window.location.href
    )}&quote=${shareText}`;
    window.open(shareURL, "_blank");
  };

  const shareOnTwitter = () => {
    const shareText = encodeURIComponent(`Check out this book: ${book.title}`);
    const shareURL = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(
      window.location.href
    )}`;
    window.open(shareURL, "_blank");
  };

  return (
    <div className="book-details">
      <h1>{book.title}</h1>
      <p>
        <b>Author:</b> {book.author}
      </p>
      <p>
        <b>Description:</b> {book.description}
      </p>
      <p>
        *Disclaimer: If the <b>Read Book</b> button is available and goes to
        Amazon, then it is an affiliate link. <i>Undervalued Books</i> will make
        a commission on the sale you make through the link. It is no extra cost
        to you to use the link, it's simply another way to support{" "}
        <i>Undervalued Books</i>.
      </p>
      <p>
        <b>*Read Book:</b>
      </p>
      {book.read_book ? (
        <button
          className="book-details-read-button"
          onClick={() => readBook(book)}
        >
          Read Book
        </button>
      ) : (
        <button className="book-details-book-details-disable" disabled>
          Link Not Available
        </button>
      )}
      <p>
        <b>Share Book:</b>
      </p>
      <div className="book-details-share-buttons">
        <button className="book-details-copy-button" onClick={copyBookURL}>
          Copy URL
        </button>
        <button className="book-details-email-button" onClick={shareViaEmail}>
          Share via Email
        </button>
        <button className="book-details-fb-button" onClick={shareOnFacebook}>
          Share on FB
        </button>
        <button
          className="book-details-twitter-button"
          onClick={shareOnTwitter}
        >
          Share on X
        </button>
      </div>
      <div className="custom-alert"></div>
    </div>
  );
};

export default BookDetails;
