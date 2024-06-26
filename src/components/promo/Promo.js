import React from "react";
import "../../assets/styles/promo.css";

function Promo() {
  return (
    <div className="promo">
      <p>
        Subscribe to Ewen's Newsletter to receive book recommendations, and
        more, right{" "}
        <a
          href="https://ewenmunro.substack.com/?showWelcome=true"
          target="_blank"
          rel="noopener noreferrer"
          className="promo-link"
        >
          here.
        </a>
      </p>
      <p>
        Check out related sites{" "}
        <a
          href="https://undervaluedfilms.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="undervaluedfilms-link"
        >
          Undervalued Films
        </a>{" "}
        &{" "}
        <a
          href="https://www.undervaluedmusic.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="undervaluedmusic-link"
        >
          Undervalued Music.
        </a>
      </p>
      <p>
        Support <i>Undervalued Books</i> by buying a coffee{" "}
        <a
          href="https://ewenmunro.com/coffee"
          target="_blank"
          rel="noopener noreferrer"
          className="promo-link"
        >
          here.
        </a>
      </p>
      <p>
        Visit our shop{" "}
        <a
          href="https://www.bonfire.com/undervaluedbooks/"
          target="_blank"
          rel="noopener noreferrer"
          className="promo-link"
        >
          here.
        </a>
      </p>
    </div>
  );
}

export default Promo;
