import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// assets/styles
import "../../assets/styles/bookdetailsprivate.css";

// components/auth
import { useAuth } from "../auth/AuthContext";

// api base url
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

const BookDetailsPrivate = () => {
  const { bookDetails } = useParams();
  const [book, setBook] = useState(null);
  const [isMentioned, setIsMentioned] = useState(false);

  const { isAuthenticated } = useAuth();

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

        // Make an API request to fetch book details based on title
        const response = await axios.get(
          `${apiBaseUrl}/api/books/bookdetails`,
          {
            params: {
              title,
            },
          }
        );

        setBook(response.data.book);

        // Check if the user has mentioned the book
        const mentionResponse = await axios.get(
          `${apiBaseUrl}/api/mentions/checkmentioned`,
          {
            params: {
              user_id: isAuthenticated.user.user_id,
              book_id: response.data.book.book_id,
            },
          }
        );

        setIsMentioned(mentionResponse.data.hasMentioned);
      } catch (error) {
        console.error("Failed to fetch book details:", error);
      }
    };

    fetchBookDetails();
  }, [bookDetails, isAuthenticated.user.user_id]);

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

  const handleMention = async (mentioned) => {
    try {
      // Make an API request to update the mention status
      await axios.post(
        `${apiBaseUrl}/api/mentions/mentioned`,
        {
          user_id: isAuthenticated.user.user_id,
          book_id: book.book_id,
          mentioned,
        },
        {
          headers: {
            Authorization: `Bearer ${isAuthenticated.token}`,
          },
        }
      );

      // Update the state to reflect the mention status
      setIsMentioned(mentioned);
    } catch (error) {
      console.error("Failed to update mention status:", error);
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
            } catch (error) {
              console.error("Failed to update rating:", error);
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
    } catch (error) {
      console.error("Failed to check rating status:", error);
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

  const shareViaEmail = () => {
    const titleWithHyphens = book.title.toLowerCase().replace(/\s+/g, "-");
    const subject = encodeURIComponent(`Check out this book: ${book.title}`);
    const body = encodeURIComponent(
      `I thought you might enjoy this book: undervaluedbooks.com/books/${titleWithHyphens}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareOnFacebook = () => {
    const titleWithHyphens = book.title.toLowerCase().replace(/\s+/g, "-");
    const shareText = encodeURIComponent(`Check out this book: ${book.title}`);
    const shareURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      `undervaluedbooks.com/books/${titleWithHyphens}`
    )}&quote=${shareText}`;
    window.open(shareURL, "_blank");
  };

  const shareOnTwitter = () => {
    const titleWithHyphens = book.title.toLowerCase().replace(/\s+/g, "-");
    const shareText = encodeURIComponent(`Check out this book: ${book.title}`);
    const shareURL = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(
      `undervaluedbooks.com/books/${titleWithHyphens}`
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
        <b>About:</b> {book.description}
      </p>
      <p>
        <b>Heard of Before:</b>
      </p>
      <p>
        Have you heard of {book.title} before visiting undervaluedbooks.com?
      </p>
      <p>
        Note: Once you have answered the question, you won't be able to edit
        your answer. Please make sure you answer this question correctly.
      </p>
      <p>
        {isMentioned ? (
          <button className="book-details-disable" disabled>
            Mentioned
          </button>
        ) : (
          <>
            <button
              className="book-details-mention-button"
              onClick={() => handleMention(true)}
            >
              Yes
            </button>
            <button
              className="book-details-mention-button"
              onClick={() => handleMention(false)}
            >
              No
            </button>
          </>
        )}
      </p>
      <p>
        <b>Score Book:</b>
      </p>
      <p>
        <button
          className="book-details-rating-button"
          onClick={() => handleRating(book)}
        >
          Rate
        </button>
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
        <button className="book-details-disable" disabled>
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

export default BookDetailsPrivate;
