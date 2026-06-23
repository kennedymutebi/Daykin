import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Birthdays from "./pages/Birthdays";
import LoveStories from "./pages/LoveStories";

import Charity from "./pages/Charity";
import AudioWishPage from "./pages/AudioWishPage";


import { Box } from "@mui/material";


const App: React.FC = () => (
  <BrowserRouter>
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box sx={{ flex: 1 }}>
        <Routes>
          <Route path="/"                element={<Home />}              />
          <Route path="/birthdays"       element={<Birthdays />}         />
          <Route path="/audio-wish"      element={<AudioWishPage />}     />
          <Route path="/love-stories"    element={<LoveStories />}       />
          <Route path="/charity"         element={<Charity />}           />
                   
          <Route path="*"                element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  </BrowserRouter>
);

export default App;