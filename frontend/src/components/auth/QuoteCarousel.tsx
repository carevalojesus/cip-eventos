import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface Quote {
  text: string;
  author: string;
}

interface QuoteCarouselProps {
  interval?: number; // milliseconds between slides
}

/**
 * QuoteCarousel Component
 * Auto-rotating carousel of institutional quotes with fade animation
 *
 * Features:
 * - Automatic rotation every 5 seconds (configurable)
 * - Smooth fade in/out transitions
 * - i18n support
 * - Responsive design
 */
export const QuoteCarousel: React.FC<QuoteCarouselProps> = ({
  interval = 8000
}) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Get quotes from translations
  const quotes: Quote[] = t("login.brand.quotes", { returnObjects: true }) as Quote[];

  useEffect(() => {
    // No iniciar el intervalo si no hay citas disponibles
    if (!quotes || quotes.length === 0) return;

    const timer = setInterval(() => {
      // Fade out
      setIsVisible(false);

      // Wait for fade out, then change quote
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % quotes.length);
        // Fade in
        setIsVisible(true);
      }, 700); // 700ms for fade out
    }, interval);

    return () => clearInterval(timer);
  }, [quotes.length, interval]);

  if (!quotes || quotes.length === 0) {
    return null;
  }

  const currentQuote = quotes[currentIndex];

  return (
    <div className="relative z-20 mt-auto">
      <blockquote className="space-y-2 border-l-4 border-primary pl-4">
        <p
          className={`text-lg italic text-gray-200 transition-opacity duration-700 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          &ldquo;{currentQuote.text}&rdquo;
        </p>
        <footer
          className={`text-sm font-bold text-white transition-opacity duration-700 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {currentQuote.author}
        </footer>
      </blockquote>

      {/* Indicators */}
      <div className="flex gap-2 mt-4">
        {quotes.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsVisible(true);
              }, 700);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-primary"
                : "w-1.5 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to quote ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
