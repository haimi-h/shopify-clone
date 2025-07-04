import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import "../ProductRating.css";

function ProductRatingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product;

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(null);

  const handleStarClick = (index) => {
    setRating(index + 1);
  };

  const isTaskCompleted = rating === 5;

  if (!product) {
    return (
      <div className="rating-wrapper">
        <h2>No product selected</h2>
        <button onClick={() => navigate("/")}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="rating-wrapper">
      <div className="rating-card">
        <img src={product.image} alt={product.name} className="rating-image" />
        <h2 className="rating-title">{product.name}</h2>
        <p className="rating-description">{product.description}</p>
        <p className="rating-price">Price: ₹{product.price}</p>
        {product.category && (
          <p className="rating-category">Category: {product.category}</p>
        )}

        <p className="rating-instruction">Rate this product (5 stars to complete task)</p>
        <div className="stars">
          {[...Array(5)].map((_, index) => (
            <FaStar
              key={index}
              className="star"
              color={(hover || rating) > index ? "#ffc107" : "#ccc"}
              onClick={() => handleStarClick(index)}
              onMouseEnter={() => setHover(index + 1)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </div>

        {isTaskCompleted ? (
          <div className="success-message">
            ✅ Task Completed – Thank you for your 5-star rating!
          </div>
        ) : (
          <div className="incomplete-message">
            ⭐ Task not complete – Please give 5 stars to finish.
          </div>
        )}

        <button className="back-button" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default ProductRatingPage;
