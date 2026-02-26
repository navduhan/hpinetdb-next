import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/features/layout/MainLayout";
import { LoadingState } from "@/shared/ui/LoadingState";
import { APP_CONFIG } from "@/shared/api/config";

const HomePage = lazy(() => import("@/features/home/HomePage"));
const PlantsPage = lazy(() => import("@/features/plants/PlantsPage"));
const InteractomePage = lazy(() => import("@/features/interactome/InteractomePage"));
const ResultsPage = lazy(() => import("@/features/results/ResultsPage"));
const NetworkPage = lazy(() => import("@/features/network/NetworkPage"));
const AnnotationListPage = lazy(() => import("@/features/annotations/AnnotationListPage"));
const AnnotationBundlePage = lazy(() => import("@/features/annotations/AnnotationBundlePage"));
const DatasetsPage = lazy(() => import("@/features/datasets/DatasetsPage"));
const AboutPage = lazy(() => import("@/features/about/AboutPage"));
const HelpPage = lazy(() => import("@/features/help/HelpPage"));
const SearchPage = lazy(() => import("@/features/search/SearchPage"));
const NotFoundPage = lazy(() => import("@/features/notfound/NotFoundPage"));

export function AppRouter() {
  return (
    <BrowserRouter basename={APP_CONFIG.baseUrl}>
      <Suspense fallback={<LoadingState label="Loading page" />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/plants" element={<PlantsPage />} />
            <Route path="/interactome" element={<InteractomePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/go" element={<AnnotationListPage type="go" />} />
            <Route path="/kegg" element={<AnnotationListPage type="kegg" />} />
            <Route path="/interpro" element={<AnnotationListPage type="interpro" />} />
            <Route path="/local" element={<AnnotationListPage type="local" />} />
            <Route path="/tf" element={<AnnotationListPage type="tf" />} />
            <Route path="/virulence" element={<AnnotationListPage type="virulence" />} />
            <Route path="/annotation" element={<AnnotationBundlePage />} />
            <Route path="/datasets" element={<DatasetsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
