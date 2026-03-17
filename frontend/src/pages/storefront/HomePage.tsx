import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getBooks, getGenres } from "../../api/books.api";
import { addToCart, getCart } from "../../api/cart.api";
import BookCard from "../../components/ui/BookCard";
import { useAuthStore } from "../../store/auth.store";
import { Link } from "react-router-dom";

const DEFAULT_LIMIT = 20;
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
  const deferredSearch = useDeferredValue(search);
  const booksSectionRef = useRef<HTMLElement | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

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

  const bookQueryParams = useMemo(
    () => ({
      page: 1,
      limit: 200,
    }),
    [],
  );

  const { data: genresData } = useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
  });

  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ["books", bookQueryParams],
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
    window.scrollTo({ top: 0, behavior: "smooth" });

    window.setTimeout(() => {
      const input = document.getElementById(
        "storefront-search",
      ) as HTMLInputElement | null;

      input?.focus();
    }, 250);
  };

  const handleGenreChange = (genreSlug: string) => {
    setSelectedGenre(genreSlug);
    setPage(1);
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

  return (
    <div className="space-y-6 pb-6">
      {user?.role === "ADMIN" ? (
        <section className="rounded-3xl border border-[#1d1a17]/10 bg-[linear-gradient(135deg,#1d1a17_0%,#3b342d_100%)] px-5 py-5 text-white sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/65">
                Admin Access
              </p>
              <h2 className="mt-2 font-serif text-[1.8rem] leading-tight">
                Open the admin dashboard
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                Manage inventory, review orders, update fulfillment, and keep
                the storefront running from one place.
              </p>
            </div>

            <Link
              to="/admin"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-[#1d1a17] transition-all hover:-translate-y-0.5 hover:bg-[#f4efe7]"
            >
              Go to Admin Dashboard
            </Link>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-black/10 bg-[#fbf8f2]">
        <div className="px-5 py-7 sm:px-6 lg:px-8 lg:py-8">
          <div className="max-w-2xl">
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.34em] text-text-muted">
              Curated Storefront
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-3xl leading-none tracking-tight text-text-primary sm:text-[2.7rem] xl:text-[3.4rem]">
              Your next read is waiting.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-text-muted sm:text-base">
              Explore curated books across every genre.
            </p>

            <button
              type="button"
              onClick={handleBrowseClick}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1d1a17] px-4 py-2.5 text-sm font-medium tracking-[0.08em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-black"
            >
              Browse all books
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <section
        id="books-grid"
        ref={booksSectionRef}
        className="space-y-5 rounded-3xl border border-black/8 bg-[#fbf8f2] px-5 py-5 sm:px-6 lg:px-7"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.32em] text-text-muted">
              Browse Collection
            </p>
            <h2 className="mt-2 font-serif text-[1.9rem] text-text-primary">
              Find your next book
            </h2>
          </div>

          <div className="flex items-center justify-start gap-2 lg:min-w-40">
            <button
              type="button"
              onClick={focusTopSearch}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/20"
              aria-label="Jump to search"
              title="Search"
            >
              <Search size={16} />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFiltersOpen((current) => !current)}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/20"
              >
                <SlidersHorizontal size={16} />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1d1a17] px-1.5 text-[11px] text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              {isFiltersOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[20rem] rounded-[1.25rem] border border-black/10 bg-white p-4 shadow-[0_20px_50px_rgba(42,30,18,0.12)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
                        Filters
                      </p>
                      <p className="mt-1 font-serif text-xl text-text-primary">
                        Price range
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFiltersOpen(false)}
                      className="rounded-full p-2 text-text-muted transition-colors hover:bg-[#f4efe7] hover:text-text-primary"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mt-5 space-y-5">
                    <div>
                      <div className="flex items-center justify-between text-sm text-text-muted">
                        <span>Minimum</span>
                        <span>
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
                        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#e6ddd0]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm text-text-muted">
                        <span>Maximum</span>
                        <span>
                          {formatPrice(maxPrice ? Number(maxPrice) : MAX_PRICE)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={minPrice ? Number(minPrice) : 0}
                        max={MAX_PRICE}
                        step="100"
                        value={maxPrice ? Number(maxPrice) : MAX_PRICE}
                        onChange={(e) => handleMaxPriceChange(e.target.value)}
                        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#e6ddd0]"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm text-text-muted transition-colors hover:text-text-primary"
                    >
                      Clear filters
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFiltersOpen(false)}
                      className="rounded-full bg-[#1d1a17] px-4 py-2 text-sm text-white transition-all hover:-translate-y-0.5 hover:bg-black"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => handleGenreChange("")}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-all ${
              selectedGenre === ""
                ? "bg-[#1d1a17] text-white"
                : "bg-white text-text-muted hover:text-text-primary"
            }`}
          >
            All
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => handleGenreChange(genre.slug)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-all ${
                selectedGenre === genre.slug
                  ? "bg-[#1d1a17] text-white"
                  : "bg-white text-text-muted hover:text-text-primary"
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>

        {booksLoading ? (
          <div className="grid gap-x-2.5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-[1.2rem] bg-white/60"
              />
            ))}
          </div>
        ) : visibleBooks.length > 0 ? (
          <>
            <div className="grid gap-x-2.5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
              {visibleBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onAddToCart={() => handleAddToCart(book.id)}
                  isInCart={cartBookIds.has(book.id)}
                  isAddingToCart={
                    addToCartMutation.isPending &&
                    addToCartMutation.variables?.bookId === book.id
                  }
                />
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-black/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-muted">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage <= 1}
                  className="rounded-full border border-black/10 bg-white px-3.5 py-2 text-sm text-text-primary transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-45"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="rounded-full border border-black/10 bg-white px-3.5 py-2 text-sm text-text-primary transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-45"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-black/12 bg-white px-6 py-10 text-center">
            <p className="font-serif text-[1.7rem] text-text-primary">
              No books found
            </p>
            <p className="mt-3 text-sm text-text-muted">
              Try changing your search, genre, or price range.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
