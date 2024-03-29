// routes.js
import React from "react";
import { Routes, Route } from "react-router-dom";

//  components/pages
import Home from "../../pages/Home";
import About from "../../pages/About";
import Landing from "../../pages/Landing";
import AddBook from "../../pages/AddBook";
import MasterAddBook from "../../pages/MasterAddBook";
import UserProfile from "../../pages/UserProfile";
import Login from "../../pages/Login";
import Signup from "../../pages/Signup";
import TermsConditions from "../../pages/T&C";
import PrivacyPolicy from "../../pages/PrivacyPolicy";

// components/auth
import Logout from "../auth/Logout";
import Verification from "../../pages/Verification";

// components/book
import BookDetails from "../books/BookDetails";
import BookDetailsPrivate from "../books/BookDetailsPrivate";

// components/route
import PrivateRoutes from "./PrivateRoutes";

const AllRoutes = () => (
  <Routes>
    <Route exact path="/" element={<Home />} />
    <Route path="/books/:bookDetails" element={<BookDetails />} />
    <Route path="/about" element={<About />} />
    <Route element={<PrivateRoutes />}>
      <Route exact path="/dashboard" element={<Landing />} />
      <Route
        path="/books/private/:bookDetails"
        element={<BookDetailsPrivate />}
      />
      <Route path="/addbook" element={<AddBook />} />
      <Route
        path="/master/addbook/:title/:author/:description/:user_id"
        element={<MasterAddBook />}
      />
      <Route path="/myprofile" element={<UserProfile />} />
    </Route>
    <Route path="/login" element={<Login />} />
    <Route path="/verification/:token" element={<Verification />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/logout" element={<Logout />} />
    <Route path="/terms-conditions" element={<TermsConditions />} />
    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
  </Routes>
);

export default AllRoutes;
