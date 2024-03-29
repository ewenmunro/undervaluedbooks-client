import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// assets/styles
import "../../assets/styles/booklistdashboard.css";

// components/auth
import { useAuth } from "../auth/AuthContext";

// api base url
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

function BookListLanding() {
  const [books, setBooks] = useState([]);
  const [filterOption, setFilterOption] = useState("all");
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedBooks, setDisplayedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booksSorted, setBooksSorted] = useState(false);
  const [message, setMessage] = useState("");

  const { isAuthenticated } = useAuth();

  // Use the useNavigate hook from 'react-router-dom'
  const navigate = useNavigate();

  const handleInitialMentionButtonState = useCallback(
    async (book) => {
      try {
        // Make an API request to check if the user has mentioned the book
        const response = await axios.get(
          `${apiBaseUrl}/api/mentions/checkmentioned`,
          {
            params: {
              user_id: isAuthenticated.user.user_id,
              book_id: book.book_id,
            },
          }
        );

        const hasMentioned = response.data.hasMentioned;

        if (hasMentioned === true || hasMentioned === false) {
          const mentionButton = document.querySelector(
            `#mention-button-${book.book_id}`
          );

          if (mentionButton) {
            mentionButton.disabled = true;
            mentionButton.textContent = "Mentioned";
            mentionButton.classList.add("disabled-button");
          }
        }
      } catch (error) {
        console.error("Failed to check mention status:", error);
      }
    },
    [isAuthenticated.user.user_id]
  );

  // Handle filter option change
  const handleFilterChange = (option) => {
    setFilterOption(option);
  };

  const updateDisplayedBooks = useCallback(async () => {
    try {
      setLoading(true);

      let updatedBooks = books;

      // Apply filter option
      switch (filterOption) {
        case "notRated":
          if (isAuthenticated && isAuthenticated.user) {
            const notRatedResponse = await axios.get(
              `${apiBaseUrl}/api/ratings/not-rated`,
              {
                params: {
                  user_id: isAuthenticated.user.user_id,
                },
                headers: {
                  Authorization: `Bearer ${isAuthenticated.token}`,
                },
              }
            );
            updatedBooks = notRatedResponse.data.books;
          }
          break;

        case "notMentioned":
          if (isAuthenticated && isAuthenticated.user) {
            const notMentionedResponse = await axios.get(
              `${apiBaseUrl}/api/mentions/not-mentioned`,
              {
                params: {
                  user_id: isAuthenticated.user.user_id,
                },
                headers: {
                  Authorization: `Bearer ${isAuthenticated.token}`,
                },
              }
            );
            updatedBooks = notMentionedResponse.data.books;
          }
          break;

        case "notHeardBefore":
          if (isAuthenticated && isAuthenticated.user) {
            const notHeardBeforeResponse = await axios.get(
              `${apiBaseUrl}/api/mentions/not-heard-before`,
              {
                params: {
                  user_id: isAuthenticated.user.user_id,
                },
                headers: {
                  Authorization: `Bearer ${isAuthenticated.token}`,
                },
              }
            );
            updatedBooks = notHeardBeforeResponse.data.books;
          }
          break;

        case "all":
        default:
        // If no filter is applied, do nothing
      }

      // Apply search filter if there is a search query
      if (searchQuery) {
        updatedBooks = updatedBooks.filter((book) =>
          book.title.toLowerCase().startsWith(searchQuery.toLowerCase())
        );
      }

      // Update the displayedBooks state
      setDisplayedBooks(updatedBooks);
    } catch (error) {
      console.error("Failed to update displayed books:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterOption, books, isAuthenticated]);

  useEffect(() => {
    // Function to fetch books data from the server
    const fetchBooks = async () => {
      try {
        setLoading(true);

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

        // Check and disable Mention buttons for books already mentioned by the user
        sortedBooks.forEach((book) => {
          handleInitialMentionButtonState(book);
        });

        setBooksSorted(true);
        updateDisplayedBooks();
      } catch (error) {
        console.error("Failed to fetch books:", error);
        setError("Failed to fetch books. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    // Call the function to fetch and sort books when the component mounts
    fetchBooks();
  }, [
    handleInitialMentionButtonState,
    searchQuery,
    filterOption,
    books,
    isAuthenticated,
    updateDisplayedBooks,
  ]);

  // Function to calculate the weighted score for a book
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
    const bookUrl = `/books/private/${bookDetails}`;

    // Pass the book as state to the BookDetails component
    navigate(bookUrl, { state: { book } });
  };

  const handleMention = async (book) => {
    try {
      // Make an API request to check if the user has mentioned the book
      const response = await axios.get(
        `${apiBaseUrl}/api/mentions/checkmentioned`,
        {
          params: {
            user_id: isAuthenticated.user.user_id,
            book_id: book.book_id,
          },
        }
      );

      const hasMentioned = response.data.hasMentioned;

      if (hasMentioned === true || hasMentioned === false) {
        // If the user has already mentioned the book, disable the buttons and return
        const mentionButton = document.querySelector(
          `#mention-button-${book.book_id}`
        );

        if (mentionButton) {
          mentionButton.disabled = true;
          mentionButton.textContent = "Mentioned";
          mentionButton.classList.add("disabled-button");
        }

        return;
      }

      // Modal/pop-up for mentioning if the user hasn't mentioned before
      const modal = document.createElement("div");
      modal.className = "mention-modal";

      // Close button for the modal
      const closeButton = document.createElement("span");
      closeButton.className = "close-button";
      closeButton.textContent = "✖️";
      closeButton.addEventListener("click", () => {
        modal.remove(); // Close the modal when clicking the close button
      });

      // Mention question
      const mentionQuestion = document.createElement("div");
      mentionQuestion.className = "mention-question";
      mentionQuestion.textContent = `Have you heard of ${book.title} before visiting undervaluedbooks.com?`;

      // Disclaimer
      const disclaimer = document.createElement("div");
      disclaimer.className = "disclaimer";
      disclaimer.textContent =
        "Note: Once you have answered the question, you won't be able to edit your answer. Please make sure you answer this question correctly.";

      // Yes button
      const yesButton = document.createElement("button");
      yesButton.textContent = "Yes";
      yesButton.addEventListener("click", async () => {
        // Handle the 'Yes' answer
        try {
          // Show loading message and hide table content
          setLoading(true);
          setDisplayedBooks([]);
          setMessage("Your Mention request is being processed...");

          await axios.post(
            `${apiBaseUrl}/api/mentions/mentioned`,
            {
              user_id: isAuthenticated.user.user_id,
              book_id: book.book_id,
              mentioned: true,
            },
            {
              headers: {
                Authorization: `Bearer ${isAuthenticated.token}`,
              },
            }
          );

          // Hide loading message and show table content after the user answers
          setLoading(false);
          setMessage("");
          updateDisplayedBooks();
        } catch (error) {
          console.error("Failed to update mention status:", error);
        }

        modal.remove(); // Close the modal after answering
      });

      // No button
      const noButton = document.createElement("button");
      noButton.textContent = "No";
      noButton.addEventListener("click", async () => {
        // Handle the 'No' answer
        try {
          // Show loading message and hide table content
          setLoading(true);
          setDisplayedBooks([]);
          setMessage("Your Mention request is being processed...");

          await axios.post(
            `${apiBaseUrl}/api/mentions/mentioned`,
            {
              user_id: isAuthenticated.user.user_id,
              book_id: book.book_id,
              mentioned: false,
            },
            {
              headers: {
                Authorization: `Bearer ${isAuthenticated.token}`,
              },
            }
          );

          // Hide loading message and show table content after the user answers
          setLoading(false);
          setMessage("");
          updateDisplayedBooks();
        } catch (error) {
          console.error("Failed to update mention status:", error);
        }

        modal.remove(); // Close the modal after answering
      });

      // Append elements to the modal
      modal.appendChild(closeButton);
      modal.appendChild(mentionQuestion);
      modal.appendChild(disclaimer);
      modal.appendChild(yesButton);
      modal.appendChild(noButton);

      // Append the modal to the document body
      document.body.appendChild(modal);

      // Hide loading message and show table content after user answers
      setLoading(false);
      setMessage("");
      updateDisplayedBooks();
    } catch (error) {
      console.error("Failed to check mention status:", error);
      setLoading(false);
      setMessage("");
    }
  };

  // Helper function to highlight stars on hover
  function highlightStars(stars, rating) {
    const starElements = stars.querySelectorAll(".star");
    starElements.forEach((star, index) => {
      star.classList.toggle("highlighted", index < rating);
    });
  }

  // Helper function to remove highlights on mouseout
  function removeHighlights(stars) {
    const starElements = stars.querySelectorAll(".star");
    starElements.forEach((star) => {
      star.classList.remove("highlighted");
    });
  }

  const handleRating = async (book) => {
    // Check if the user has already rated the book
    const userRating = book.userRating;

    try {
      const response = await axios.get(
        `${apiBaseUrl}/api/ratings/checkrating`,
        {
          params: {
            user_id: isAuthenticated.user.user_id,
            book_id: book.book_id,
          },
        }
      );

      const hasRated = response.data.rated;
      const previousUserRating = response.data.userRating;

      // Create a modal/pop-up for rating
      const modal = document.createElement("div");
      modal.className = "rating-modal";

      // Close button for the modal
      const closeButton = document.createElement("span");
      closeButton.className = "close-button";
      closeButton.textContent = "✖️";
      closeButton.addEventListener("click", () => {
        modal.remove(); // Close the modal when clicking the close button
      });

      // Rating stars
      const stars = document.createElement("div");
      stars.className = "rating-stars";

      // Create stars and handle click events
      for (let i = 1; i <= 10; i++) {
        const star = document.createElement("span");
        star.textContent = "★";
        star.className = "star";
        star.dataset.value = i;

        // Highlight stars based on user's previous rating or current userRating
        if (hasRated && i <= previousUserRating) {
          star.classList.add("selected", "highlighted");
        }

        star.addEventListener("mouseover", () => {
          highlightStars(stars, i + 1); // Highlight stars up to the one being hovered over
        });

        star.addEventListener("mouseout", () => {
          removeHighlights(stars);
        });

        star.addEventListener("click", async () => {
          // Show loading message and hide table content
          setLoading(true);
          setDisplayedBooks([]);
          setMessage("Your Rating request is being processed...");

          // Handle the user's rating
          if (userRating !== i) {
            try {
              if (hasRated) {
                // User has already rated, edit the rating
                await axios.post(
                  `${apiBaseUrl}/api/ratings/edit`,
                  {
                    user_id: isAuthenticated.user.user_id,
                    book_id: book.book_id,
                    rating: i,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${isAuthenticated.token}`,
                    },
                  }
                );
              } else {
                // User has not rated, create a new rating
                await axios.post(
                  `${apiBaseUrl}/api/ratings/rate`,
                  {
                    user_id: isAuthenticated.user.user_id,
                    book_id: book.book_id,
                    rating: i,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${isAuthenticated.token}`,
                    },
                  }
                );
              }
              // Update the user's rating in the book object
              book.userRating = i;

              // If the user rates 7 or higher, open the share pop-up
              if (i >= 7) {
                openSharePopup(book);
              }

              // Hide loading message and show table content after user rates
              setLoading(false);
              setMessage("");
              updateDisplayedBooks();
            } catch (error) {
              console.error("Failed to update rating:", error);
              setLoading(false);
              setMessage("");
            }
          }

          modal.remove(); // Close the modal after rating
        });

        stars.appendChild(star);
      }

      // Append elements to the modal
      modal.appendChild(closeButton);
      modal.appendChild(stars);

      // Append the modal to the document body
      document.body.appendChild(modal);

      // Hide loading message and show table content after user rates
      setLoading(false);
      setMessage("");
      updateDisplayedBooks();
    } catch (error) {
      console.error("Failed to check rating status:", error);
      setLoading(false);
      setMessage("");
    }
  };

  const readBook = (book) => {
    // Check if there's a valid link in the database for this book
    if (book.read_book_link) {
      // Open the book link in a new tab
      window.open(book.read_book_link, "_blank");

      // Make an API request to log the click
      axios.post(
        `${apiBaseUrl}/api/read/authclick`,
        {
          user_id: isAuthenticated.user.user_id,
          book_id: book.book_id,
        },
        {
          headers: {
            Authorization: `Bearer ${isAuthenticated.token}`,
          },
        }
      );
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
      setError(
        `No book title matches your search query! Double-check you've input the
        correct title into the search field. Otherwise, consider adding the
        book to The Book List.`
      );
    } else {
      setError(false);
    }

    // Update the displayedBooks state
    setDisplayedBooks(filtered);
  };

  const renderTableHeader = () => {
    // Render table header with filter options
    return (
      <div>
        <div className="filter-options">
          <button
            onClick={() => handleFilterChange("all")}
            className={filterOption === "all" ? "active" : ""}
          >
            All Books
          </button>
          <button
            onClick={() => handleFilterChange("notRated")}
            className={filterOption === "notRated" ? "active" : ""}
          >
            Not Rated
          </button>
          <button
            onClick={() => handleFilterChange("notMentioned")}
            className={filterOption === "notMentioned" ? "active" : ""}
          >
            Not Mentioned
          </button>
          <button
            onClick={() => handleFilterChange("notHeardBefore")}
            className={filterOption === "notHeardBefore" ? "active" : ""}
          >
            Not Heard Before
          </button>
        </div>
        <input
          type="text"
          placeholder="Search Book Title"
          className="search-input"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <table>
          <thead>{renderTableHeaderRow()}</thead>
          <tbody>
            {searchQuery
              ? displayedBooks.map((book) => renderBookRow(book))
              : Object.keys(displayedBooks).map((bookKey) =>
                  renderBookRow(displayedBooks[bookKey])
                )}
            {displayedBooks.length === 0 && searchQuery ? (
              <tr>
                <td colSpan="8">
                  <p className="error-message">{error}</p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTableHeaderRow = () => {
    // Render table sub-header row
    return (
      <tr>
        <th>Book Title</th>
        <th>Author</th>
        <th>About</th>
        <th>Book Info</th>
        <th>Heard of Before</th>
        <th>Score Book</th>
        <th>*Read Book</th>
        <th>Share Book</th>
      </tr>
    );
  };

  const renderBookRow = (book) => {
    // Render book row
    return (
      <tr key={book.book_id}>
        <td>{loading || !booksSorted ? "Loading..." : book.title}</td>
        <td>{loading || !booksSorted ? "Loading..." : book.author}</td>
        <td>{loading || !booksSorted ? "Loading..." : book.description}</td>
        <td>
          {loading || !booksSorted ? (
            <button disabled>Loading...</button>
          ) : (
            <button
              className="info-button"
              onClick={() => openBookDetails(book)}
            >
              Info
            </button>
          )}
        </td>
        <td>
          {loading || !booksSorted ? (
            <button disabled>Loading...</button>
          ) : (
            <button
              id={`mention-button-${book.book_id}`}
              className="mention-button"
              onClick={() => handleMention(book)}
            >
              Mention
            </button>
          )}
        </td>
        <td>
          {loading || !booksSorted ? (
            <button disabled>Loading...</button>
          ) : (
            <button
              className="rating-button"
              onClick={() => handleRating(book)}
            >
              Rate
            </button>
          )}
        </td>
        <td>
          {loading || !booksSorted ? (
            <button disabled>Loading...</button>
          ) : (
            <div>
              {book.read_book_link ? (
                <button className="read-button" onClick={() => readBook(book)}>
                  Read Book
                </button>
              ) : (
                <button className="disabled-button">Link Not Available</button>
              )}
            </div>
          )}
        </td>
        <td>
          {loading || !booksSorted ? (
            <button disabled>Loading...</button>
          ) : (
            <button
              className="share-button"
              onClick={() => openSharePopup(book)}
            >
              Share
            </button>
          )}
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
      {message && <p className="mention-rating-loading-message">{message}</p>}
      {renderTableHeader()}
    </div>
  );
}

export default BookListLanding;
