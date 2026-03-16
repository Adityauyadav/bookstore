import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { getBooks, getGenres } from "../../api/books.api";
import { addToCart } from "../../api/cart.api";
import BookCard from "../../components/ui/BookCard";
import { useAuthStore } from "../../store/auth.store";

const DEFAULT_LIMIT = 20;
const MAX_PRICE = 5000;

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function HomePage() {
  const [search, setSearch] = useState("");
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

  const bookQueryParams = useMemo(
    () => ({
      q: deferredSearch.trim() || undefined,
      genre: selectedGenre || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page,
      limit: DEFAULT_LIMIT,
    }),
    [deferredSearch, selectedGenre, minPrice, maxPrice, page],
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
  const totalPages = booksData?.data?.totalPages ?? 1;
  const currentPage = booksData?.data?.page ?? page;
  const genres = genresData?.data ?? [];

  const handleBrowseClick = () => {
    booksSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleGenreChange = (genreSlug: string) => {
    setSelectedGenre(genreSlug);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
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
    <div className="space-y-8 pb-8">
      <section className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-[#fbf8f2]">
        <div className="grid gap-6 px-5 py-8 sm:px-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:px-10 lg:py-10">
          <div className="max-w-2xl">
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.34em] text-text-muted">
              Curated Storefront
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-none tracking-tight text-text-primary sm:text-5xl xl:text-6xl">
              Your next read is waiting.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-text-muted sm:text-base">
              Explore curated books across every genre.
            </p>

            <button
              type="button"
              onClick={handleBrowseClick}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1d1a17] px-5 py-3 text-sm font-medium tracking-[0.08em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-black"
            >
              Browse all books
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid gap-3 self-end sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-[1.25rem] border border-black/8 bg-white px-4 py-5">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-text-muted">
                Current filters
              </p>
              <p className="mt-2 font-serif text-2xl text-text-primary">
                {selectedGenre
                  ? (genres.find((genre) => genre.slug === selectedGenre)
                      ?.name ?? "Selected")
                  : "All genres"}
              </p>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                {minPrice || maxPrice
                  ? `${minPrice ? formatPrice(Number(minPrice)) : "Any"} to ${
                      maxPrice ? formatPrice(Number(maxPrice)) : "Any"
                    }`
                  : "Any price range"}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-[#8f2d22]/10 bg-[#f8ece8] px-4 py-5">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#8f2d22]/70">
                Shelf count
              </p>
              <p className="mt-2 font-serif text-2xl text-[#8f2d22]">
                {booksData?.data?.total ?? 0}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#8f2d22]/80">
                Titles available across the current search and filter set.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="books-grid"
        ref={booksSectionRef}
        className="space-y-6 rounded-[1.75rem] border border-black/8 bg-[#fbf8f2] px-5 py-6 sm:px-7 lg:px-8"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.32em] text-text-muted">
              Browse Collection
            </p>
            <h2 className="mt-2 font-serif text-3xl text-text-primary">
              Find your next book
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_auto] lg:min-w-152">
            <label className="relative block">
              <span className="sr-only">Search books</span>
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-4 w-4 text-text-muted" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search books, authors, ISBN..."
                className="h-11 w-full rounded-xl border border-black/10 bg-white pl-11 pr-4 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted/70 focus:border-black/20 focus:shadow-sm"
              />
            </label>

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-2xl bg-white/60"
              />
            ))}
          </div>
        ) : books.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onAddToCart={() => handleAddToCart(book.id)}
                  isAddingToCart={
                    addToCartMutation.isPending &&
                    addToCartMutation.variables?.bookId === book.id
                  }
                />
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-black/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="rounded-3xl border border-dashed border-black/12 bg-white px-6 py-12 text-center">
            <p className="font-serif text-2xl text-text-primary">
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
