import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface Quote {
  text: string;
  author: string;
}

interface QuoteCarouselProps {
  interval?: number;
}

/**
 * QuoteCarousel Component
 * Carrusel de citas con borde de acento
 * Refactored following Refactoring UI principles
 */
export const QuoteCarousel: React.FC<QuoteCarouselProps> = ({
  interval = 8000
}) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const quotes: Quote[] = t("login.brand.quotes", { returnObjects: true }) as Quote[];

  useEffect(() => {
    if (!quotes || quotes.length === 0) return;

    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % quotes.length);
        setIsVisible(true);
      }, 700);
    }, interval);

    return () => clearInterval(timer);
  }, [quotes.length, interval]);

  if (!quotes || quotes.length === 0) {
    return null;
  }

  const currentQuote = quotes[currentIndex];

  const handleDotClick = (index: number) => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsVisible(true);
    }, 700);
  };

  return (
    <div className="rui-quote-container">
      {/* Quote con borde de acento - "Add color with accent borders" */}
      <div className="rui-quote-wrapper">
        <div className="rui-quote-accent" />
        <div className="rui-quote-content">
          <p
            className={`rui-quote-text transition-opacity duration-700 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            &ldquo;{currentQuote.text}&rdquo;
          </p>
          <span
            className={`rui-quote-attribution transition-opacity duration-700 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {currentQuote.author}
          </span>
        </div>
      </div>

      {/* Carousel Dots - "Don't rely on color alone" */}
      <div className="rui-carousel-dots">
        {quotes.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`rui-dot ${index === currentIndex ? "active" : ""}`}
            aria-label={`Go to quote ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
