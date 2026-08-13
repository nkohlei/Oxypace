"use client";

import { useEffect, useRef, useState } from "react";
import { posts as staticPosts } from "../data/posts";

const TRANSLATIONS = {
  tr: {
    placeholder: "Makale başlığı, konu veya anahtar kelime ara...",
    noResults: "Aramanızla eşleşen makale bulunamadı.",
    hint: "Kapatmak için ESC tuşuna basın veya dışarı tıklayın",
    loading: "Makaleler taranıyor...",
    resultCount: "makale bulundu",
  },
  en: {
    placeholder: "Search article title, topic or keyword...",
    noResults: "No matching articles found.",
    hint: "Press ESC or click outside to close",
    loading: "Searching articles...",
    resultCount: "articles found",
  },
};

// Turkish character normalization helper
function normalizeText(text = "") {
  return text
    .toString()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/Ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/Ş/g, "s")
    .replace(/Ö/g, "o")
    .replace(/Ç/g, "c")
    .trim();
}

export default function SearchModal({ isOpen, onClose, lang = "tr" }) {
  const [query, setQuery] = useState("");
  const [allPosts, setAllPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;

  /* Fetch posts from API when modal opens */
  useEffect(() => {
    if (!isOpen) return;

    setQuery("");
    const id = setTimeout(() => inputRef.current?.focus(), 60);

    const loadPosts = async () => {
      setIsLoading(true);
      try {
        const apiUrl =
          typeof window !== "undefined"
            ? window.location.origin.includes("localhost")
              ? "http://localhost:5000/api/blog"
              : "/api/blog"
            : "/api/blog";

        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const formatted = data.map((p) => ({
              ...p,
              id: p._id || p.id,
            }));
            setAllPosts(formatted);
          } else {
            setAllPosts(staticPosts);
          }
        } else {
          setAllPosts(staticPosts);
        }
      } catch (e) {
        console.error("SearchModal API fetch error, fallback to static:", e);
        setAllPosts(staticPosts);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
    return () => clearTimeout(id);
  }, [isOpen]);

  /* ESC key handler & body overflow lock */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = normalizeText(query);

  const results = normalizedQuery
    ? allPosts.filter((p) => {
        const normTitle = normalizeText(p.title || "");
        const normExcerpt = normalizeText(p.excerpt || "");
        const normCategory = normalizeText(p.category || "");
        const normContent = normalizeText(p.content || "");

        return (
          normTitle.includes(normalizedQuery) ||
          normExcerpt.includes(normalizedQuery) ||
          normCategory.includes(normalizedQuery) ||
          normContent.includes(normalizedQuery)
        );
      })
    : [];

  return (
    /* Backdrop */
    <div
      id="search-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "10vh",
        paddingLeft: "16px",
        paddingRight: "16px",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Modal box */}
      <div
        className="glass-modal animate-slide-up w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{
          maxWidth: "680px",
          border: "1px solid var(--border-hover)",
          background: "var(--glass-bg)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Search input row */}
        <div
          className="flex items-center gap-3.5 px-5"
          style={{
            borderBottom: "1px solid var(--glass-border)",
            paddingTop: "18px",
            paddingBottom: "18px",
          }}
        >
          {/* Magnifier icon */}
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--foreground-muted)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            id="search-modal-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "15px",
              color: "var(--foreground)",
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              fontWeight: "500",
            }}
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--foreground-muted)",
                cursor: "pointer",
                padding: "2px 6px",
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          )}

          {/* ESC hint */}
          <kbd
            style={{
              flexShrink: 0,
              fontSize: "10px",
              fontFamily: "monospace",
              color: "var(--foreground-subtle)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "3px 6px",
              background: "var(--glass-bg)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results count status bar */}
        {query.trim() !== "" && (
          <div
            className="flex items-center justify-between px-5 py-2"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid var(--glass-border)",
              fontSize: "11px",
              color: "var(--foreground-muted)",
            }}
          >
            <span>
              {results.length} {t.resultCount}
            </span>
            <span style={{ fontSize: "10px", opacity: 0.7 }}>
              EVENT HORIZON SEARCH ENGINE
            </span>
          </div>
        )}

        {/* Results list */}
        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            padding: "8px",
          }}
        >
          {isLoading && query.trim() === "" && (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                fontSize: "12px",
                color: "var(--foreground-subtle)",
              }}
            >
              {t.loading}
            </div>
          )}

          {!isLoading && query.trim() === "" && (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                fontSize: "12px",
                color: "var(--foreground-subtle)",
                fontFamily: "var(--font-geist-mono), monospace",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {t.hint}
            </div>
          )}

          {query.trim() !== "" && results.length === 0 && (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                fontSize: "13px",
                color: "var(--foreground-muted)",
              }}
            >
              {t.noResults}
            </div>
          )}

          {results.map((post) => {
            const hasCover = !!post.image;
            return (
              <a
                key={post.id || post.slug}
                href={`/blog/${post.slug}`}
                onClick={onClose}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  className="group transition-all duration-200"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "12px 14px",
                    margin: "4px 0",
                    borderRadius: "12px",
                    border: "1px solid transparent",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--glass-bg)";
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {/* Left Side: Article info & minimal details */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {/* Category + Date + ReadTime badges line */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        className="badge-category"
                        style={{
                          fontSize: "10px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: 600,
                        }}
                      >
                        {post.category || "Teorik Fizik"}
                      </span>
                      {post.readTime && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--foreground-subtle)",
                            fontFamily: "var(--font-geist-mono), monospace",
                          }}
                        >
                          {post.readTime}
                        </span>
                      )}
                      {post.date && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--foreground-subtle)",
                            opacity: 0.8,
                          }}
                        >
                          • {post.date}
                        </span>
                      )}
                    </div>

                    {/* Article Title */}
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        lineHeight: "1.35",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {post.title}
                    </h4>

                    {/* Minimal Excerpt (1 line clamp) */}
                    {post.excerpt && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--foreground-muted)",
                          lineHeight: "1.4",
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.excerpt}
                      </p>
                    )}
                  </div>

                  {/* Right Side: Cover Image Thumbnail */}
                  <div
                    style={{
                      width: "80px",
                      height: "60px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "var(--glass-bg)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {hasCover ? (
                      <img
                        src={post.image}
                        alt={post.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.3s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.08)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "18px",
                          opacity: 0.5,
                        }}
                      >
                        🌌
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
