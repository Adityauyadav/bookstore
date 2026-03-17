import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

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

export default function CataloguePage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const catalogueSectionRef = useRef<HTMLElement | null>(null);

  // Sync search state with URL query parameter
  useEffect(() => {
    const querySearch = searchParams.get("q") ?? "";
    setSearch(querySearch);
    setPage(1);
  }, [searchParams]);

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

  const filteredBooks = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
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
  }, [books, search, maxPrice, minPrice, selectedGenre]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBooks.length / DEFAULT_LIMIT),
  );
  const currentPage = Math.min(page, totalPages);
  const visibleBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * DEFAULT_LIMIT;
    return filteredBooks.slice(startIndex, startIndex + DEFAULT_LIMIT);
  }, [currentPage, filteredBooks]);

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

  const handleGenreChange = (genreSlug: string) => {
    setSelectedGenre(genreSlug);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="bg-white min-h-screen text-[#1A1A1A] pb-10">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Search Section */}
        <section ref={catalogueSectionRef} className="mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="font-serif text-4xl tracking-tight text-[#1A1A1A] mb-2">
                Full Catalogue
              </h1>
              <p className="text-[#9A9A9A] font-sans text-sm">
                Browse all {filteredBooks.length.toLocaleString()} books in our
                collection
              </p>
            </div>

            <div className="flex items-center gap-3 w-full relative">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9A9A]"
                />
                <input
                  id="catalogue-search"
                  type="search"
                  placeholder="Search by title, author, ISBN..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-[#E0DDD7] rounded-full bg-[#F5F3EE] text-[#1A1A1A] placeholder-[#9A9A9A] focus:outline-none focus:bg-white focus:border-[#D84C35]/50 transition-all"
                />
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen((current) => !current)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#E0DDD7] bg-[#F5F3EE] px-5 text-sm text-[#1A1A1A] transition-all hover:bg-white font-medium whitespace-nowrap"
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
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-80 rounded-3xl border border-[#E0DDD7] bg-white p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#9A9A9A] font-bold">
                          Filters
                        </p>
                        <p className="mt-1 font-serif text-xl text-[#1A1A1A]">
                          Price & Genre
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
                        <label className="text-sm font-medium text-[#9A9A9A] mb-3 block">
                          Minimum Price:{" "}
                          <span className="text-[#1A1A1A]">
                            {formatPrice(minPrice ? Number(minPrice) : 0)}
                          </span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={maxPrice ? Number(maxPrice) : MAX_PRICE}
                          step="100"
                          value={minPrice ? Number(minPrice) : 0}
                          onChange={(e) => handleMinPriceChange(e.target.value)}
                          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E0DDD7] accent-[#D84C35]"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-[#9A9A9A] mb-3 block">
                          Maximum Price:{" "}
                          <span className="text-[#1A1A1A]">
                            {formatPrice(
                              maxPrice ? Number(maxPrice) : MAX_PRICE,
                            )}
                          </span>
                        </label>
                        <input
                          type="range"
                          min={minPrice ? Number(minPrice) : 0}
                          max={MAX_PRICE}
                          step="100"
                          value={maxPrice ? Number(maxPrice) : MAX_PRICE}
                          onChange={(e) => handleMaxPriceChange(e.target.value)}
                          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E0DDD7] accent-[#D84C35]"
                        />
                      </div>

                      <div className="border-t border-[#E0DDD7] pt-6">
                        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#9A9A9A] font-bold mb-3">
                          Genres
                        </p>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => handleGenreChange("")}
                            className={`rounded-full px-3 py-1.5 text-xs transition-all font-medium border whitespace-nowrap ${
                              selectedGenre === ""
                                ? "bg-[#D84C35] text-white border-[#D84C35]"
                                : "bg-[#F5F3EE] text-[#9A9A9A] border-[#E0DDD7] hover:text-[#1A1A1A]"
                            }`}
                          >
                            All
                          </button>
                          {genres.map((genre) => (
                            <button
                              key={genre.id}
                              type="button"
                              onClick={() => handleGenreChange(genre.slug)}
                              className={`rounded-full px-3 py-1.5 text-xs transition-all font-medium border whitespace-nowrap ${
                                selectedGenre === genre.slug
                                  ? "bg-[#D84C35] text-white border-[#D84C35]"
                                  : "bg-[#F5F3EE] text-[#9A9A9A] border-[#E0DDD7] hover:text-[#1A1A1A]"
                              }`}
                            >
                              {genre.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-6 border-t border-[#E0DDD7]">
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-sm text-[#9A9A9A] hover:text-[#1A1A1A] font-medium transition-colors"
                      >
                        Clear all
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
        </section>

        {/* Genre Filters */}
        <section className="mb-8">
          <div className="flex flex-wrap items-center gap-2.5">
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
        </section>

        {/* Books Grid */}
        <section>
          {booksLoading ? (
            <div className="grid gap-x-4 gap-y-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mb-6">
              {Array.from({ length: 24 }).map((_, index) => (
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
                    className="rounded-full border border-[#E0DDD7] bg-[#F5F3EE] px-5 py-2.5 text-sm font-medium text-[#1A1A1A] transition-all hover:bg-white disabled:opacity-40 disabled:hover:bg-[#F5F3EE]"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    disabled={currentPage >= totalPages}
                    className="rounded-full border border-[#E0DDD7] bg-[#F5F3EE] px-5 py-2.5 text-sm font-medium text-[#1A1A1A] transition-all hover:bg-white disabled:opacity-40 disabled:hover:bg-[#F5F3EE]"
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
