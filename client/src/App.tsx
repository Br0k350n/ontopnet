import React from "react";
import "./App.css";
import Home from "./components/Home";
import Head from "./components/Head";
import Header from "./components/Header";
import Footer from "./components/Footer";

const App: React.FC = () => {
  return (
    <>
      <Head title="Home" tag="On Top Network" isAdmin={false} />
      {/* Render the header and meta information (head) */}
      <Header />

      {/* Render the main content (Home page) */}
      <Home />

      {/* Render the footer */}
      <Footer />
    </>
  );
};

export default App;
