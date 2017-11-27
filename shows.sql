CREATE TABLE shows (
    imdb_id character varying(20) NOT NULL,
    title text,
    imdb_rating double precision,
    view_count integer DEFAULT 1,
    poster_url text
);

CREATE UNIQUE INDEX shows_unique_imdb_id on shows (imdb_id);
