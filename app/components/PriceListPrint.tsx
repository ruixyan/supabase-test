"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import "./price-list-print.css";

type PriceListArtwork = {
  id: number;
  artist_name: string | null;
  title_en: string | null;
  title_jp: string | null;
  year: string | null;
  material: string | null;
  dimensions: string | null;
  category: string | null;
  artwork_photo_url: string | null;
  market_price: number | null;
};

export default function PriceListPrint({ artworks, heading, subtitle }: {
  artworks: PriceListArtwork[];
  heading: string;
  subtitle: string;
}) {
  const measurementRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PriceListArtwork[][]>([]);

  // Measure real text wrapping at the PDF's width, then fill each page with
  // complete artwork rows. Category headings and the footer reserve space.
  useLayoutEffect(() => {
    const measurement = measurementRef.current;
    if (!measurement) return;
    const outerHeight = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      return element.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    };
    const paginate = () => {
      // Printing hides the measurement copy; retain the already measured pages.
      if (measurement.getBoundingClientRect().width === 0) return;
      const header = measurement.querySelector<HTMLElement>(".price-list-heading")!;
      const footer = measurement.querySelector<HTMLElement>(".price-list-print-footer")!;
      const capacity = 10.38 * 96 - outerHeight(header) - footer.getBoundingClientRect().height - 2;
      const result: PriceListArtwork[][] = [];
      let page: PriceListArtwork[] = [];
      let used = 0;
      let previousCategory = "";
      measurement.querySelectorAll<HTMLElement>(".price-list-category-section").forEach((section) => {
        const category = section.dataset.category!;
        const items = artworks.filter((artwork) => (artwork.category?.trim() || "Other") === category);
        const headingHeight = outerHeight(section.querySelector<HTMLElement>("h2")!);
        const sectionMargin = parseFloat(getComputedStyle(section).marginBottom);
        const gap = parseFloat(getComputedStyle(section.querySelector<HTMLElement>(".price-list-category-rows")!).rowGap);
        section.querySelectorAll<HTMLElement>(".price-list-print-grid").forEach((row, index) => {
          const rowHeight = row.getBoundingClientRect().height;
          let needed = rowHeight + (previousCategory === category ? gap : headingHeight + sectionMargin);
          if (page.length && used + needed > capacity) {
            result.push(page);
            page = [];
            used = 0;
            needed = rowHeight + headingHeight + sectionMargin;
          }
          page.push(...items.slice(index * 2, index * 2 + 2));
          used += needed;
          previousCategory = category;
        });
      });
      if (page.length) result.push(page);
      setPages(result);
    };
    paginate();
    const observer = new ResizeObserver(paginate);
    observer.observe(measurement);
    return () => observer.disconnect();
  }, [artworks, heading, subtitle]);

  function renderSheet(page: PriceListArtwork[], pageIndex: number, measuring = false) {
    return <section className="price-list-sheet" key={pageIndex}>
        <header className="price-list-heading">
          <h1>{heading || "\u00a0"}</h1>
          <p>{subtitle || "\u00a0"}</p>
        </header>
        <div className="price-list-print-sections">
          {Array.from(new Set(page.map((artwork) => artwork.category?.trim() || "Other"))).map((category) => (
            <section className="price-list-category-section" key={category} data-category={category}>
              <h2 className="price-list-category-heading">{category}</h2>
              <div className="price-list-category-rows">
          {(() => {
            const items = page.filter((artwork) => (artwork.category?.trim() || "Other") === category);
            return Array.from({ length: Math.ceil(items.length / 2) }, (_, rowIndex) => (
              <div className="price-list-print-grid" key={rowIndex}>
          {items.slice(rowIndex * 2, rowIndex * 2 + 2).map((artwork) => {
            const title = artwork.title_en || artwork.title_jp || "Untitled";
            return <article key={artwork.id} className="price-list-print-artwork">
              <div className="price-list-print-image">
                {!measuring && artwork.artwork_photo_url && <Image src={artwork.artwork_photo_url}
                  alt={title} fill sizes="64px" loading="eager" style={{ objectFit: "contain" }} />}
              </div>
              <div className="price-list-print-details">
                <p className="price-list-print-artist">{artwork.artist_name || "Unknown Artist"}</p>
                <p className="price-list-print-title">{title}{artwork.year ? `, ${artwork.year}` : ""}</p>
                {artwork.material && <p>{artwork.material}</p>}
                {artwork.dimensions && <p>{artwork.dimensions}</p>}
                {artwork.market_price !== null && <p className="price-list-print-price">
                  ${artwork.market_price.toLocaleString("en-US")}
                </p>}
              </div>
            </article>;
          })}
              </div>
            ));
          })()}
              </div>
            </section>
          ))}
        </div>
        <footer className="price-list-print-footer">
          <p className="price-list-print-address">16 E 79TH STREET       NEW YORK       NY       10075       T 212 695 8035       ONISHIGALLERY.COM</p>
          <p className="price-list-print-page-number">{pageIndex + 1} / {pages.length || 1}</p>
        </footer>
      </section>;
  }

  return <div className="price-list-preview">
    <div ref={measurementRef} className="price-list-measurement" aria-hidden="true">
      {renderSheet(artworks, 0, true)}
    </div>
    {pages.map((page, pageIndex) => renderSheet(page, pageIndex))}
  </div>;
}
