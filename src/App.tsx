import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
//import Birthdays from "./pages/Birthdays";
import LoveStories from "./pages/LoveStories";
import BirthdayLayout from "./pages/birthday/BirthdayLayout";
import BirthdayFeed from "./pages/birthday/BirthdayFeed";
import BirthdayAdd from "./pages/birthday/BirthdayAdd";
import AIWishPage from "./pages/birthday/AIWishPage";
import CelebTwinsPage from "./pages/birthday/CelebTwinsPage";
import WishingWall from "./pages/birthday/WishingWall";

import Charity from "./pages/Charity";
import AudioWishPage from "./pages/AudioWishPage";

import { usePresence } from "./hooks/usePresence";


import { Box } from "@mui/material";


const App: React.FC = () => {
  // App-wide presence heartbeat — marks this device "online" while the app is
  // open, on any page. Fails silently until the backend endpoint exists.
  usePresence();

  return (
    <BrowserRouter>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar />
        <Box sx={{ flex: 1 }}>
          <Routes>
            <Route path="/"                element={<Home />}              />
           <Route path="/audio-wish"      element={<AudioWishPage />}     />
            <Route path="/love-stories"    element={<LoveStories />}       />
            <Route path="/charity"         element={<Charity />}           />
            <Route path="/birthdays" element={<BirthdayLayout />}>
              <Route index element={<Navigate to="feed" replace />} />
              <Route path="feed" element={<BirthdayFeed />} />
              <Route path="add" element={<BirthdayAdd />} />
              <Route path="ai-wish" element={<AIWishPage />} />
              <Route path="celeb" element={<CelebTwinsPage />} />
              <Route path="wall" element={<WishingWall />} />
            </Route>


            <Route path="*"                element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </BrowserRouter>
  );
};

export default App;