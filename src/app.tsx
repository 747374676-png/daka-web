import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import UserSetupPage from "@/pages/UserSetupPage/UserSetupPage";
import TrackerPage from "@/pages/TrackerPage/TrackerPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TrackerPage />} />
        <Route path="login" element={<UserSetupPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
