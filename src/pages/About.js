import React from "react";
import "../assets/styles/about.css";

function About() {
  return (
    <div className="about">
      <h1>
        About <i>Undervalued Books</i>
      </h1>
      <p>
        <i>Undervalued Books</i> was founded in 2024 and is a web platform for a
        community of book enthusiasts who recommend books that they feel are
        undervalued to each other in order to give those books the appreciation
        they deserve.
      </p>
      <p>
        Users are able to recommend any book that hasn’t already been
        recommended by the community, make as many book recommendations as they
        wish, can rate whether or not they have heard of the book before coming
        to the site and can rate the quality of each book between 1 to 10 stars.
      </p>
      <p>
        All of these contributions from the community influence The Book List, a
        list of all the books recommended by the community, in order of how
        undervalued the book is. The more undervalued a book is the higher up
        the list it will land and the less undervalued a book is the lower it
        will find itself on the list.
      </p>
      <p>
        But what makes this list different is that as users seek out and watch
        the more undervalued books, the books at the top of the list, and rate
        the quality of those books on the site, those books will find their way
        down the list as they’re finally gaining more and more appreciation.
        This reshuffling of the list always gives users more undervalued books
        to seek out and watch, constantly encouraging users to discover books
        that they might not have heard of otherwise.
      </p>
    </div>
  );
}

export default About;
