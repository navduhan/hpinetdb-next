# Performance Verification Guide

Use this checklist after dependency install.

## Build and Bundle

1. `npm run build`
2. Inspect chunk sizes from Vite output.
3. Confirm route-level lazy chunks are created for major pages.

## Runtime

1. Open Chrome DevTools Performance panel.
2. Record navigation flow:
   - Home -> Plants -> Interactome -> Results -> Network -> Annotation.
3. Verify no long main-thread blocks during table rendering.

## Data Loading

1. Validate request dedupe by navigating away/back quickly.
2. Verify stale cache behavior in `useQueryResource` (default stale window).
3. Confirm canceled requests do not trigger state updates.

## Large Data Scenarios

1. Results pages with >1,000 rows switch to virtualized rendering.
2. Network table remains responsive for large edge sets.
3. Cytoscape interaction remains usable with search filtering enabled.
