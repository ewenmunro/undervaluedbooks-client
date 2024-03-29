import React, { useState, useEffect } from "react";
import axios from "axios";

// assets/styles
import "../../assets/styles/masteraddbookform.css";

// components/auth
import { useAuth } from "../auth/AuthContext";

// api base url
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

function MasterAddBookForm({ onAddBook }) {
  const { isAuthenticated } = useAuth();

  // Variable to quickly disable Add Book button if I need to
  let isButtonDisabled = false;

  // State to store user input
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    readBook: "",
    userId: "",
    confirmationChecked: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pathSegments = window.location.pathname.split("/").slice(3);
        const title = pathSegments[0];
        const author = pathSegments[1];
        const description = pathSegments[2];
        const userId = pathSegments[3];

        // Correct the title, author and description before sending info to the database
        const formattedTitle = title
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        const formattedAuthor = author
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        const formattedDescription = description
          .split("-")
          .map((word, index) =>
            index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word
          )
          .join(" ");

        setFormData({
          title: formattedTitle,
          author: formattedAuthor,
          description: formattedDescription,
          userId: userId,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // State to manage loading state
  const [isLoading, setIsLoading] = useState(false);

  // State to store success, info, and error messages
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Set loading state to true when the form is submitted
    setIsLoading(true);

    // Extract book details from formData
    const {
      title,
      author,
      description,
      readBook,
      userId,
      confirmationChecked,
    } = formData;

    // // Disable the Add Book button when I need to
    // setIsButtonDisabled(true);

    // Clear previous messages
    setSuccessMessage("");
    setErrorMessage("");

    // Check if the confirmation checkbox is checked
    if (!confirmationChecked) {
      setErrorMessage(
        "Please confirm that you've double-checked the book details."
      );
      return;
    }

    // Validate the form data
    if (!title.trim() || !author.trim() || !description.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    // Validate that the title is not a website link
    if (containsWebsiteLinks(title)) {
      setErrorMessage("Title should not be a website link.");
      return;
    }

    // Validate that the author is not a website link
    if (containsWebsiteLinks(author)) {
      setErrorMessage("Author should not be a website link.");
      return;
    }

    // Validate that the description does not contain website links
    if (containsWebsiteLinks(description)) {
      setErrorMessage("Description should not contain website links.");
      return;
    }

    // Validate that the title do not contain accents
    if (containsAccents(title)) {
      setErrorMessage("Title should not contain accents.");
      return;
    }

    // Validate that the author do not contain accents
    if (containsAccents(author)) {
      setErrorMessage("Author should not contain accents.");
      return;
    }

    // Validate that the title and description do not contain accents
    if (containsAccents(description)) {
      setErrorMessage("Description should not contain accents.");
      return;
    }

    // Check if a book with the same title and author already exists in the database
    try {
      const response = await axios.get(
        `${apiBaseUrl}/api/books/checkbook?title=${title}&author=${author}`
      );

      if (response.data.exists) {
        setErrorMessage("This book is already on The Book List.");
        return;
      }
    } catch (error) {
      console.error("Error checking book:", error);
      setErrorMessage("Failed to check if the book exists. Please try again.");
      return;
    }

    // If no matching book was found, proceed to add the book
    try {
      // Make an Axios POST request to your backend API to review a book
      const response = await axios.post(
        `${apiBaseUrl}/api/books/addbook`,
        {
          title,
          author: author,
          description,
          readBook,
          userId,
        },
        {
          headers: {
            Authorization: `Bearer ${isAuthenticated.token}`,
          },
        }
      );

      if (response.status === 200) {
        // Clear the form data
        setFormData({
          title: "",
          author: "",
          description: "",
          readBook: "",
          userId: "",
        });

        // Clear previous error messages
        setErrorMessage("");

        // Display a success message if the book was added successfully
        setSuccessMessage("The Book has been added to The Book List.");

        // Call the onAddBook function passed as a prop to update the book list
        onAddBook(response.data.book);
      } else {
        // Handle other response statuses, if needed
        setErrorMessage("Failed to add the book. Please try again.");
      }
    } catch (error) {
      // Handle any errors that occur during the request
      console.error("Failed to add the book:", error);
      setErrorMessage("Failed to add the book. Please try again.");
    } finally {
      // Set loading state back to false when the request is complete
      setIsLoading(false);
    }
  };

  // Function to handle rejecting the book
  const handleReject = async () => {
    // Set loading state to true when the form is submitted
    setIsLoading(true);

    try {
      // Make an Axios POST request to reject the book
      const response = await axios.post(
        `${apiBaseUrl}/api/books/reject`,
        {
          title: formData.title,
          author: formData.author,
          userId: formData.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${isAuthenticated.token}`,
          },
        }
      );

      if (response.status === 200) {
        // Clear the form data
        setFormData({
          title: "",
          author: "",
          description: "",
          readBook: "",
          userId: "",
        });

        // Clear previous error messages
        setErrorMessage("");

        // Display a success message if the book was rejected successfully
        setSuccessMessage("The Book has been rejected.");
      } else {
        // Handle other response statuses, if needed
        setErrorMessage("Failed to reject the book. Please try again.");
      }
    } catch (error) {
      // Handle any errors that occur during the request
      console.error("Failed to reject the book:", error);
      setErrorMessage("Failed to reject the book. Please try again.");
    } finally {
      // Set loading state back to false when the request is complete
      setIsLoading(false);
    }
  };

  // Function to check if a string contains website links using regular expressions
  const containsWebsiteLinks = (text) => {
    // Regular expression to match URLs
    const urlPattern = /(https?|ftp|http):\/\/[^\s/$.?#].[^\s]*/gi;

    // Test if the text contains URLs
    return urlPattern.test(text);
  };

  // Function to check if a string contains accents
  const containsAccents = (text) => {
    // Regular expression to match accents
    const accentPattern = /[\u0300-\u036f]/g;

    // Test if the text contains accents
    return accentPattern.test(text);
  };

  // Function to handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    let formattedValue = value;

    if (type === "checkbox") {
      // If the input is a checkbox, update the confirmationChecked state
      formattedValue = checked;
    } else if (name === "title") {
      // If the input is for the title, capitalize the first letter of each word and convert the rest to lowercase
      formattedValue = value
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    // Update the formData state with the formatted input value
    setFormData({ ...formData, [name]: formattedValue });
  };

  return (
    <div className="add-book-form">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title" />
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="author" />
          <input
            type="text"
            id="author"
            name="author"
            placeholder="Author"
            value={formData.author}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="description" />
          <textarea
            id="description"
            name="description"
            placeholder="Logline"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="readBook" />
          <input
            type="text"
            id="readBook"
            name="readBook"
            placeholder="Read Book"
            value={formData.readBook}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="userId" />
          <input
            type="text"
            id="userId"
            name="userId"
            placeholder="User ID"
            value={formData.userId}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <input
            type="checkbox"
            id="confirmation"
            name="confirmationChecked"
            checked={formData.confirmationChecked}
            onChange={handleInputChange}
          />
          <label htmlFor="confirmation">
            I confirm that I've double-checked the book details
          </label>
        </div>
        <div>
          <button
            type="button"
            className="reject-book-button"
            onClick={handleReject}
          >
            {isLoading ? "Processing..." : "Reject Book"}
          </button>
          <button
            type="submit"
            className="add-book-button"
            disabled={isButtonDisabled}
          >
            {isLoading ? "Processing..." : "Add Book"}
          </button>
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
      </form>
    </div>
  );
}

export default MasterAddBookForm;
