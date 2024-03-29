import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// assets/styles
import "../../assets/styles/booklist.css";

// api base url
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

function BookList() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Use the useNavigate hook from 'react-router-dom'
  const navigate = useNavigate();

  useEffect(() => {
    // Function to fetch books data from the server
    const fetchBooks = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/books/allbooks`);
        const booksData = response.data.books;

        // Calculate weighted scores for each book
        const booksWithScores = await Promise.all(
          booksData.map(async (book) => {
            const weightedScore = await calculateWeightedScore(book);
            return { book, weightedScore };
          })
        );

        // Sort books based on weighted scores
        const sortedBooks = booksWithScores.sort(
          (a, b) => b.weightedScore - a.weightedScore
        );

        setBooks(sortedBooks.map((item) => item.book));
        setError(null);
      } catch (error) {
        console.error("Failed to fetch books:", error);
        setError("Failed to fetch books. Please try again later.");
      }
    };

    // Call the function to fetch and sort books when the component mounts
    fetchBooks();
  }, []);

  const calculateWeightedScore = async (book) => {
    try {
      // All declarations for The Book List Algorithm
      let notHeardBeforeCount;
      let haveHeardBeforeNotRatedCount;
      let ratingCount;
      const highestScore = 10;
      let usersTotalScore;

      // Retrieve all the users who have not heard of the book before
      try {
        const response = await axios.get(
          `${apiBaseUrl}/api/mentions/not-heard-before-count`,
          {
            params: {
              book_id: book.book_id,
            },
          }
        );

        notHeardBeforeCount = response.data.count;
      } catch (error) {
        console.error("Error fetching not heard before count:", error);
        throw error;
      }

      // Retrieve all the users who have heard of the book but haven't rated it
      try {
        const responseNotRated = await axios.get(
          `${apiBaseUrl}/api/mentions/heard-not-rated-count`,
          {
            params: {
              book_id: book.book_id,
            },
          }
        );

        haveHeardBeforeNotRatedCount = responseNotRated.data.count;
      } catch (error) {
        console.error("Error fetching heard-not-rated count:", error);
        throw error;
      }

      // Retrieve all the users who have rated the book
      try {
        // Fetch the count of ratings for the book
        const response = await axios.get(
          `${apiBaseUrl}/api/ratings/rating-count`,
          {
            params: {
              book_id: book.book_id,
            },
          }
        );

        ratingCount = response.data.count;
      } catch (error) {
        console.error("Error fetching rating count:", error);
        throw error;
      }

      // Retrieve all the users who have rated the book
      try {
        const response = await axios.get(
          `${apiBaseUrl}/api/ratings/sum-total`,
          {
            params: {
              book_id: book.book_id,
            },
          }
        );

        usersTotalScore = response.data.sum_total;
      } catch (error) {
        console.error("Error fetching rating sum total:", error);
        throw error;
      }

      // THE BOOK LIST ALGORITH
      const denominator =
        Number(notHeardBeforeCount) +
        Number(haveHeardBeforeNotRatedCount) +
        Number(ratingCount);

      const weightedScore =
        denominator !== 0
          ? ((Number(notHeardBeforeCount) / denominator) * 100 +
              (Number(usersTotalScore) /
                (Number(highestScore) * Number(ratingCount)) /
                Number(ratingCount)) *
                100) /
            2
          : 0;

      return weightedScore;
    } catch (error) {
      console.error("Error calculating weighted score:", error);
      return 0;
    }
  };

  // Function to open book details modal
  const openBookDetails = (book) => {
    // Construct the URL based on book title
    const urlTitle = book.title.replace(/\s+/g, "-").toLowerCase();
    const bookDetails = `${urlTitle}`;
    const bookUrl = `/books/${bookDetails}`;

    // Pass the book as state to the BookDetails component
    navigate(bookUrl, { state: { book } });
  };

  const readBook = (book) => {
    // Check if there's a valid link in the database for this book
    if (book.read_book_link) {
      // Make a request to generate a temporary identifier for a logged-out user
      axios
        .get(`${apiBaseUrl}/api/read/generatetempid`)
        .then((response) => {
          // Retrieve temporary user id from backend
          const temporaryUserId = response.data.temporaryUserId;

          // Open the book link in a new tab
          window.open(book.read_book_link, "_blank");

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

  const openSharePopup = (book) => {
    // Create a modal/pop-up for share options
    const modal = document.createElement("div");
    modal.className = "share-modal";

    // Close button for the modal
    const closeButton = document.createElement("span");
    closeButton.className = "close-button";
    closeButton.textContent = "✖️";
    closeButton.addEventListener("click", () => {
      modal.remove(); // Close the modal when clicking the close button
    });

    // Share options content
    const shareContent = document.createElement("div");
    shareContent.className = "share-content";

    const shareTitle = document.createElement("h1");
    shareTitle.textContent = `Share ${book.title}:`;

    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.textContent = "Copy URL";
    copyButton.addEventListener("click", () => copyBookURL(book));

    const emailButton = document.createElement("button");
    emailButton.className = "email-button";
    emailButton.textContent = "Share via Email";
    emailButton.addEventListener("click", () => shareViaEmail(book));

    const fbButton = document.createElement("button");
    fbButton.className = "fb-button";
    fbButton.textContent = "Share on FB";
    fbButton.addEventListener("click", () => shareOnFacebook(book));

    const twitterButton = document.createElement("button");
    twitterButton.className = "twitter-button";
    twitterButton.textContent = "Share on X";
    twitterButton.addEventListener("click", () => shareOnTwitter(book));

    // Apply margin to buttons
    [copyButton, emailButton, fbButton, twitterButton].forEach((button) => {
      button.style.marginRight = "10px";
    });

    // Append elements to the modal
    shareContent.appendChild(shareTitle);
    shareContent.appendChild(copyButton);
    shareContent.appendChild(emailButton);
    shareContent.appendChild(fbButton);
    shareContent.appendChild(twitterButton);

    modal.appendChild(closeButton);
    modal.appendChild(shareContent);

    // Append the modal to the document body
    document.body.appendChild(modal);
  };

  const copyBookURL = (book) => {
    const titleWithHyphens = book.title.toLowerCase().replace(/\s+/g, "-");
    const bookURL = `undervaluedbooks.com/books/${titleWithHyphens}`;

    navigator.clipboard.writeText(bookURL).then(() => {
      const customAlert = document.querySelector(".custom-alert");

      if (customAlert) {
        customAlert.textContent = `${book.title} URL copied to clipboard!`;
        customAlert.style.display = "block";

        // Hide the alert after a delay (e.g., 3 seconds)
        setTimeout(() => {
          customAlert.style.display = "none";
        }, 3000);
      }
    });
  };

  const shareViaEmail = (book) => {
    const titleWithHyphens = book.title.toLowerCase().replace(/\s+/g, "-");
    const subject = encodeURIComponent(`Check out this book: ${book.title}`);
    const body = encodeURIComponent(
      `I thought you might enjoy this book: undervaluedbooks.com/books/${titleWithHyphens}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareOnFacebook = (book) => {
    const titleWithHyphens = book.title.toLowerCase().replace(/\s+/g, "-");
    const shareText = encodeURIComponent(`Check out this book: ${book.title}`);
    const shareURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      `undervaluedbooks.com/books/${titleWithHyphens}`
    )}&quote=${shareText}`;
    window.open(shareURL, "_blank");
  };

  const shareOnTwitter = (book) => {
    const titleWithHyphens = book.title.toLowerCase().replace(/\s+/g, "-");
    const shareText = encodeURIComponent(`Check out this book: ${book.title}`);
    const shareURL = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(
      `undervaluedbooks.com/books/${titleWithHyphens}`
    )}`;
    window.open(shareURL, "_blank");
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;

    // Automatically capitalize the first letter of each word
    const formattedQuery = query
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    setSearchQuery(formattedQuery);

    // Filter books based on the formatted query
    const filtered = books.filter((book) =>
      book.title.toLowerCase().startsWith(formattedQuery.toLowerCase())
    );

    if (formattedQuery && filtered.length === 0) {
      setError(`No book title matches your search query! Double-check you've input the
      correct title into the search field. Otherwise, consider adding the
      book to The Book List.`);
    } else {
      setError(false);
    }

    setFilteredBooks(filtered);
  };

  const renderTableHeader = () => {
    // Render table sub-header row
    return (
      <tr>
        <th>Book Title</th>
        <th>Author</th>
        <th>About</th>
        <th>Book Info</th>
        <th>*Read Book</th>
        <th>Share Book</th>
      </tr>
    );
  };

  const renderBookRow = (book) => {
    return (
      <tr key={book.book_id}>
        <td>{book.title}</td>
        <td>{book.author}</td>
        <td>{book.description}</td>
        <td>
          <button className="info-button" onClick={() => openBookDetails(book)}>
            Info
          </button>
        </td>
        <td>
          {book.read_book_link ? (
            <button className="read-button" onClick={() => readBook(book)}>
              Read Book
            </button>
          ) : (
            <button className="disabled-button">Link Not Available</button>
          )}
        </td>
        <td>
          <button className="share-button" onClick={() => openSharePopup(book)}>
            Share
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="book-list">
      <div className="custom-alert"></div>
      <p>
        *Disclaimer: All available <b>Read Book</b> buttons to Amazon are
        affiliate links. <i>Undervalued Books</i> will make a commission on the
        sale you make through the link. It is no extra cost to you to use the
        link, it's simply another way to support <i>Undervalued Books</i>.
      </p>
      <input
        type="text"
        placeholder="Search Book Title"
        className="search-input"
        value={searchQuery}
        onChange={handleSearchChange}
      />
      {error ? (
        <tr>
          <td colSpan="5">
            <p className="error-message">{error}</p>
          </td>
        </tr>
      ) : (
        <table>
          <thead>{renderTableHeader()}</thead>
          <tbody>
            {searchQuery
              ? filteredBooks.map((book) => renderBookRow(book))
              : books.map((book) => renderBookRow(book))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default BookList;
