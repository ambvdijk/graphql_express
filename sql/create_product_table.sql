CREATE TABLE public.product
(
    id serial NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(1024),
    PRIMARY KEY (id)
);

ALTER TABLE public.product
    OWNER to "postgres-user";