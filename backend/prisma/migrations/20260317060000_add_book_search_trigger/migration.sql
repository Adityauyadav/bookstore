CREATE INDEX IF NOT EXISTS "Book_searchVector_idx"
ON "Book" USING GIN ("searchVector");

CREATE OR REPLACE FUNCTION update_book_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    to_tsvector(
      'english',
      coalesce(NEW."title", '') || ' ' ||
      coalesce(NEW."author", '') || ' ' ||
      coalesce(NEW."description", '')
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS book_search_vector_trigger ON "Book";

CREATE TRIGGER book_search_vector_trigger
BEFORE INSERT OR UPDATE OF "title", "author", "description"
ON "Book"
FOR EACH ROW
EXECUTE FUNCTION update_book_search_vector();

UPDATE "Book"
SET "searchVector" =
  to_tsvector(
    'english',
    coalesce("title", '') || ' ' ||
    coalesce("author", '') || ' ' ||
    coalesce("description", '')
  );
