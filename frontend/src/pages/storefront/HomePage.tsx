import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
  ShieldCheck,
  Package,
  BookOpen,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

import { getBooks, getGenres } from "../../api/books.api";
import { addToCart, getCart } from "../../api/cart.api";
import BookCard from "../../components/ui/BookCard";
import { useAuthStore } from "../../store/auth.store";

const DEFAULT_LIMIT = 120;
const MAX_PRICE = 5000;

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);

  const deferredSearch = useDeferredValue(search);
  const booksSectionRef = useRef<HTMLElement | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isHoveringCarousel = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHoveringCarousel.current) {
        setCurrentSlide((prev) => (prev + 1) % 3);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const nextSearch = searchParams.get("q") ?? "";
    setSearch((current) => {
      if (
        current.trim() === nextSearch.trim() &&
        current.length > nextSearch.length
      ) {
        return current;
      }
      return current === nextSearch ? current : nextSearch;
    });
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isAuthenticated,
  });

  const { data: genresData } = useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
  });

  const bookQueryParams = useMemo(
    () => ({
      page: 1,
      limit: 200,
    }),
    [],
  );

  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ["books-all"],
    queryFn: () => getBooks(bookQueryParams),
    placeholderData: (previousData) => previousData,
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ bookId, quantity }: { bookId: string; quantity: number }) =>
      addToCart(bookId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const books = booksData?.data?.books ?? [];
  const genres = genresData?.data ?? [];
  const cartBookIds = new Set(
    cartData?.data?.items.map((item) => item.bookId) ?? [],
  );

  const heroBooks = books.slice(0, 3);

  const slides = [
    {
      headline: "Read before you go.",
      subtext: "Your bucket list starts with a book.",
      cta: "Browse Collection →",
      bgClass: "bg-white",
    },
    {
      headline: "This week's most wanted.",
      subtext: "Fresh arrivals, handpicked for you.",
      cta: "New Arrivals →",
      bgClass: "bg-white",
    },
    {
      headline: "Discover your next obsession.",
      subtext: "Every genre. Every mood. One shelf.",
      cta: "Explore Genres →",
      bgClass: "bg-white",
    },
  ];

  const newArrivals = useMemo(() => {
    return [...books]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 6);
  }, [books]);

  const budgetPicks = useMemo(() => {
    return books.filter((b) => Number(b.price) <= 299).slice(0, 6);
  }, [books]);

  const genreBooksMap = useMemo(() => {
    const map = new Map<string, typeof books>();
    genres.forEach((g) => {
      map.set(
        g.slug,
        books.filter((b) => b.genre?.slug === g.slug).slice(0, 6),
      );
    });
    return map;
  }, [books, genres]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = deferredSearch.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;

    return books.filter((book) => {
      const matchesSearch =
        !normalizedQuery ||
        [
          book.title,
          book.author,
          book.isbn,
          book.description,
          book.genre?.name,
        ].some((value) => value?.toLowerCase().includes(normalizedQuery));

      const matchesGenre = !selectedGenre || book.genre?.slug === selectedGenre;
      const price = Number(book.price);
      const matchesMin = min === undefined || price >= min;
      const matchesMax = max === undefined || price <= max;

      return matchesSearch && matchesGenre && matchesMin && matchesMax;
    });
  }, [books, deferredSearch, maxPrice, minPrice, selectedGenre]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBooks.length / DEFAULT_LIMIT),
  );
  const currentPage = Math.min(page, totalPages);
  const visibleBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * DEFAULT_LIMIT;
    return filteredBooks.slice(startIndex, startIndex + DEFAULT_LIMIT);
  }, [currentPage, filteredBooks]);

  const handleBrowseClick = () => {
    booksSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const focusTopSearch = () => {
    navigate("/catalogue");
  };

  const handleGenreChange = (genreSlug: string) => {
    setSelectedGenre(genreSlug);
    setPage(1);
    handleBrowseClick();
  };

  const handleGenreSectionViewAll = (genreSlug: string) => {
    setSelectedGenre(genreSlug);
    setPage(1);
    handleBrowseClick();
  };

  const handleMinPriceChange = (value: string) => {
    const numericValue = Number(value);
    const safeMax =
      maxPrice === "" ? MAX_PRICE : Math.max(numericValue, Number(maxPrice));

    setMinPrice(String(numericValue));
    if (maxPrice !== "" && numericValue > Number(maxPrice)) {
      setMaxPrice(String(safeMax));
    }
    setPage(1);
  };

  const handleMaxPriceChange = (value: string) => {
    const numericValue = Number(value);
    const safeMin =
      minPrice === "" ? 0 : Math.min(numericValue, Number(minPrice));

    setMaxPrice(String(numericValue));
    if (minPrice !== "" && numericValue < Number(minPrice)) {
      setMinPrice(String(safeMin));
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedGenre("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  const activeFilterCount = [
    selectedGenre !== "",
    minPrice !== "",
    maxPrice !== "",
  ].filter(Boolean).length;

  const handleAddToCart = (bookId: string) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    addToCartMutation.mutate({ bookId, quantity: 1 });
  };

  const renderHorizontalList = (items: typeof books) => (
    <div className="flex overflow-x-auto gap-4 md:gap-5 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
      {items.map((book) => (
        <div
          key={book.id}
          className="min-w-35 max-w-35 sm:min-w-40 sm:max-w-40 snap-start shrink-0"
        >
          <BookCard
            book={book}
            onAddToCart={() => handleAddToCart(book.id)}
            isInCart={cartBookIds.has(book.id)}
            isAddingToCart={
              addToCartMutation.isPending &&
              addToCartMutation.variables?.bookId === book.id
            }
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white min-h-screen text-[#1A1A1A] pb-10">
      {user?.role === "ADMIN" && (
        <div className="w-full bg-[#D84C35] text-white text-[0.8rem] py-2.5 px-4 flex justify-between items-center z-50">
          <span>You are logged in as Admin.</span>
          <Link
            to="/admin"
            className="hover:underline opacity-80 hover:opacity-100 flex items-center gap-1 font-medium"
          >
            Go to Dashboard <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="px-4 py-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-14">
        {/* HERO SECTION */}
        <section
          className="relative overflow-hidden rounded-3xl h-80 sm:h-96 shadow-sm bg-white"
          onMouseEnter={() => (isHoveringCarousel.current = true)}
          onMouseLeave={() => (isHoveringCarousel.current = false)}
        >
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex flex-col md:flex-row items-center p-8 md:p-10 ${slide.bgClass} ${
                currentSlide === idx
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <div className="flex-1 text-center md:text-left z-20">
                <h1 className="font-serif text-4xl tracking-tight sm:text-5xl lg:text-6xl lg:tracking-tighter leading-tight mb-3 text-[#1A1A1A]">
                  {slide.headline}
                </h1>
                <p className="font-sans text-base tracking-tight sm:text-lg text-[#1A1A1A]/70 mb-5 max-w-lg mx-auto md:mx-0">
                  {slide.subtext}
                </p>
                <button
                  onClick={handleBrowseClick}
                  className="rounded-full bg-[#D84C35] text-white px-6 py-2.5 font-medium text-sm tracking-tight hover:bg-[#b83a1f] transition-all hover:-translate-y-0.5 shadow-md inline-flex items-center gap-2"
                >
                  {slide.cta}
                </button>
              </div>
              <div className="flex-1 hidden md:flex justify-end items-center relative z-20 xl:pr-8">
                {heroBooks.length > 0 && (
                  <div className="relative w-64 h-80 flex items-center justify-center">
                    {heroBooks.map((book, i) => (
                      <div
                        key={book.id}
                        className={`absolute w-36 sm:w-44 aspect-2/3 shadow-lg rounded-sm overflow-hidden border-2 border-white/40 transition-transform duration-700 ease-out hover:scale-105 hover:z-30 hover:-translate-y-1 ${
                          i === 0
                            ? "-rotate-12 -translate-x-12 sm:-translate-x-16 z-10 opacity-90"
                            : i === 1
                              ? "rotate-0 z-20 translate-y-3 sm:translate-y-4 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
                              : "rotate-12 translate-x-12 sm:translate-x-16 z-10 opacity-90"
                        }`}
                      >
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Carousel Dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2.5 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx
                    ? "bg-[#D84C35] w-6"
                    : "bg-[#1A1A1A]/20 hover:bg-[#D84C35]/40 w-2"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </section>

        {/* TRUST STRIP SECTION */}
        <section className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 py-2 text-[#9A9A9A] font-sans text-sm pb-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-[#D84C35]" />
            <span>Secure payments via Razorpay</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-[#E0DDD7]" />
          <div className="flex items-center gap-3">
            <Package size={20} className="text-[#D84C35]" />
            <span>Free delivery on orders over ₹499</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-[#E0DDD7]" />
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-[#D84C35]" />
            <span>10,000+ happy readers</span>
          </div>
        </section>

        {/* NEW ARRIVALS */}
        {newArrivals.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="font-sans text-[0.7rem] uppercase tracking-wider text-[#9A9A9A] font-medium">
                  New Arrivals
                </p>
                <h2 className="mt-1.5 font-serif text-3xl sm:text-4xl tracking-tight text-[#1A1A1A]">
                  Fresh off the shelf.
                </h2>
              </div>
              <button
                onClick={handleBrowseClick}
                className="text-sm tracking-tight font-medium text-[#1A1A1A] hover:text-[#D84C35] transition-colors mb-1"
              >
                View all →
              </button>
            </div>
            {renderHorizontalList(newArrivals)}
          </section>
        )}

        {/* GENRE SECTIONS */}
        {genres.map((genre) => {
          const gBooks = genreBooksMap.get(genre.slug) || [];
          if (gBooks.length < 3) return null;

          return (
            <section key={genre.id}>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="font-sans text-[0.7rem] uppercase tracking-wider text-[#9A9A9A] font-medium">
                    {genre.name}
                  </p>
                  <h2 className="mt-1.5 font-serif text-3xl sm:text-4xl tracking-tight text-[#1A1A1A]">
                    Best of {genre.name}.
                  </h2>
                </div>
                <button
                  onClick={() => handleGenreSectionViewAll(genre.slug)}
                  className="text-sm tracking-tight font-medium text-[#1A1A1A] hover:text-[#D84C35] transition-colors mb-1"
                >
                  View all {genre.name} →
                </button>
              </div>
              {renderHorizontalList(gBooks)}
            </section>
          );
        })}

        {/* BUDGET PICKS */}
        {budgetPicks.length >= 3 && (
          <section className="bg-white rounded-3xl p-5 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[#E0DDD7]">
            <div className="mb-6">
              <p className="font-sans text-[0.75rem] uppercase tracking-wider text-[#D84C35] font-bold">
                Budget Picks
              </p>
              <h2 className="mt-1.5 font-serif text-3xl sm:text-4xl tracking-tight text-[#1A1A1A]">
                Great reads under ₹299.
              </h2>
            </div>
            {renderHorizontalList(budgetPicks)}
          </section>
        )}

        {/* FULL CATALOGUE */}
        <section
          id="books-grid"
          ref={booksSectionRef}
          className="bg-white rounded-3xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[#E0DDD7] scroll-mt-6"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between mb-6">
            <div>
              <p className="font-sans text-[0.7rem] uppercase tracking-wider text-[#9A9A9A] font-medium">
                Browse Everything
              </p>
              <h2 className="mt-1.5 font-serif text-3xl sm:text-4xl tracking-tight text-[#1A1A1A]">
                Full Catalogue
              </h2>
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto">
              <button
                type="button"
                onClick={focusTopSearch}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#E0DDD7] bg-[#F5F3EE] text-[#1A1A1A] transition-all hover:bg-[#E0DDD7]"
                aria-label="Jump to search"
                title="Search"
              >
                <Search size={18} />
              </button>

              <div className="relative flex-1 xl:flex-none">
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen((current) => !current)}
                  className="inline-flex w-full xl:w-auto h-11 items-center justify-center gap-2 rounded-full border border-[#E0DDD7] bg-[#F5F3EE] px-5 text-sm text-[#1A1A1A] transition-all hover:bg-[#E0DDD7] font-medium"
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D84C35] px-1.5 text-[11px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {isFiltersOpen && (
                  <div className="absolute right-0 left-0 xl:left-auto top-[calc(100%+0.75rem)] z-20 w-full xl:w-88 rounded-3xl border border-[#E0DDD7] bg-white p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#9A9A9A] font-bold">
                          Filters
                        </p>
                        <p className="mt-1 font-serif text-xl text-[#1A1A1A]">
                          Price range
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFiltersOpen(false)}
                        className="rounded-full p-2 text-[#9A9A9A] hover:bg-[#F5F3EE] hover:text-[#1A1A1A] transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between text-sm text-[#9A9A9A] mb-3">
                          <span className="font-medium">Minimum</span>
                          <span className="text-[#1A1A1A] font-semibold">
                            {formatPrice(minPrice ? Number(minPrice) : 0)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={maxPrice ? Number(maxPrice) : MAX_PRICE}
                          step="100"
                          value={minPrice ? Number(minPrice) : 0}
                          onChange={(e) => handleMinPriceChange(e.target.value)}
                          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E0DDD7] accent-[#1d1a17]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm text-[#9A9A9A] mb-3">
                          <span className="font-medium">Maximum</span>
                          <span className="text-[#1A1A1A] font-semibold">
                            {formatPrice(
                              maxPrice ? Number(maxPrice) : MAX_PRICE,
                            )}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={minPrice ? Number(minPrice) : 0}
                          max={MAX_PRICE}
                          step="100"
                          value={maxPrice ? Number(maxPrice) : MAX_PRICE}
                          onChange={(e) => handleMaxPriceChange(e.target.value)}
                          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E0DDD7] accent-[#1d1a17]"
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between pt-5 border-t border-[#E0DDD7]">
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-sm text-[#9A9A9A] hover:text-[#1A1A1A] font-medium transition-colors"
                      >
                        Clear filters
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFiltersOpen(false)}
                        className="rounded-full bg-[#D84C35] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#b83a1f] hover:-translate-y-0.5 shadow-md"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <button
              type="button"
              onClick={() => handleGenreChange("")}
              className={`rounded-full px-5 py-2 text-sm transition-all font-medium border ${
                selectedGenre === ""
                  ? "bg-[#D84C35] text-white border-[#D84C35] shadow-sm"
                  : "bg-[#F5F3EE] text-[#9A9A9A] border-[#E0DDD7] hover:text-[#1A1A1A] hover:bg-white"
              }`}
            >
              All
            </button>
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => handleGenreChange(genre.slug)}
                className={`rounded-full px-5 py-2 text-sm transition-all font-medium border ${
                  selectedGenre === genre.slug
                    ? "bg-[#D84C35] text-white border-[#D84C35] shadow-sm"
                    : "bg-[#F5F3EE] text-[#9A9A9A] border-[#E0DDD7] hover:text-[#1A1A1A] hover:bg-white"
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>

          {booksLoading ? (
            <div className="grid gap-x-4 gap-y-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mb-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-2/3 animate-pulse bg-[#F5F3EE] rounded-sm"
                />
              ))}
            </div>
          ) : visibleBooks.length > 0 ? (
            <>
              <div className="grid gap-x-4 gap-y-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mb-6">
                {visibleBooks.map((book) => (
                  <div key={book.id} className="w-full">
                    <BookCard
                      book={book}
                      onAddToCart={() => handleAddToCart(book.id)}
                      isInCart={cartBookIds.has(book.id)}
                      isAddingToCart={
                        addToCartMutation.isPending &&
                        addToCartMutation.variables?.bookId === book.id
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 mt-4 border-t border-[#E0DDD7]">
                <p className="text-sm text-[#9A9A9A] font-medium">
                  Page {currentPage} of {totalPages}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    disabled={currentPage <= 1}
                    className="rounded-full border border-[#E0DDD7] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1A1A] transition-all hover:bg-[#F5F3EE] disabled:opacity-40 disabled:hover:bg-white"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    disabled={currentPage >= totalPages}
                    className="rounded-full border border-[#E0DDD7] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1A1A] transition-all hover:bg-[#F5F3EE] disabled:opacity-40 disabled:hover:bg-white"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#E0DDD7] bg-[#F5F3EE]/50 p-16 text-center">
              <p className="font-serif text-2xl text-[#1A1A1A]">
                No books found
              </p>
              <p className="mt-3 text-[#9A9A9A] max-w-sm mx-auto">
                We couldn't find any books matching your criteria. Try adjusting
                your search or clearing your filters.
              </p>
              <button
                onClick={clearFilters}
                className="mt-6 rounded-full bg-white border border-[#E0DDD7] px-6 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#F5F3EE] transition-colors shadow-sm"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
