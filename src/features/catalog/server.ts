import "server-only";
import { cache } from "react";
import { getDb } from "@/db/client";
import { getPublishedProduct, listCategories, listPublishedProducts, type CatalogFilters } from "./queries";

export const getCatalogCategories = () => listCategories(getDb());
export const getCatalogProducts = (filters: CatalogFilters = {}) => listPublishedProducts(getDb(), filters);
export const getCatalogProduct = cache((slug: string) => getPublishedProduct(getDb(), slug));
